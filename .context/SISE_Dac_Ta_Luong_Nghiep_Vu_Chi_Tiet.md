# ĐẶC TẢ CHI TIẾT CÁC LUỒNG NGHIỆP VỤ HỆ THỐNG SISE
### Dựa trên đối chiếu trực tiếp mã nguồn thật (routers/services/adapters), `openapi.yaml`, `data_schema.yaml`

> Timeline sử dụng: **Frontend (E)**, **Backend (D)**, **Celery Worker (D)**, **AIModule (C)**, **StorageModule/PostgreSQL (B)**, **MinIO (B)**. Mỗi bước ghi rõ: hành động, method REST, request/response, status code, hoặc chuyển giao hạ tầng.

---

## LUỒNG 1 — AUTH (Đăng ký, Đăng nhập, Lấy hồ sơ)

**Timeline tham gia:** Frontend, Backend, PostgreSQL

### 1.1. Đăng ký — `POST /auth/register`

- **Frontend → Backend:** `POST /auth/register`, body `{username, email, password}`.
- **Backend (Router `auth_routers.py`) → Service (`AuthService.register_user`)**.
- **Backend → PostgreSQL:** `SELECT id, username, email FROM users WHERE username=:username OR email=:email LIMIT 1` — kiểm tra trùng lặp trước khi xử lý tiếp.
  - Nếu có dòng trả về → raise `UserAlreadyExistsError` → Backend trả **`409 Conflict`**, body `{code: "ERR_USER_ALREADY_EXISTS", message: ...}`.
- **Backend (nội bộ):** `PasswordHasher.hash_password(password)` — băm mật khẩu (bcrypt).
- **Backend → PostgreSQL:** `INSERT INTO users (username, email, password_hash) VALUES (...) RETURNING id, username, email, role, created_at`.
  - Nếu `IntegrityError` xảy ra (race condition — 2 request trùng username đồng thời vượt qua bước SELECT) và message chứa `unique` + (`username`/`email`) → tự động chuyển thành `UserAlreadyExistsError` → **`409`** (lớp bảo vệ thứ 2, độc lập với SELECT).
  - Lỗi khác → `rollback()`, raise nguyên trạng → Backend trả **`500`**, `{code: "ERR_INTERNAL"}`.
- **Backend → Frontend:** **`201 Created`**, body `User {id, username, email, role, created_at}` — **không kèm token**.

### 1.2. Đăng nhập — `POST /auth/login`

- **Frontend → Backend:** `POST /auth/login`, body `{username, password}`.
- **Backend → PostgreSQL:** `SELECT id, username, password_hash FROM users WHERE username=:username LIMIT 1`.
  - Không tìm thấy dòng → trả `None` từ Service.
- **Backend (nội bộ):** `PasswordHasher.verify_password(password, password_hash)`.
  - Sai mật khẩu → trả `None` từ Service.
  - Cả 2 trường hợp trên → Backend trả **`401 Unauthorized`**, `{code: "UNAUTHORIZED", message: "Invalid username or password"}`.
- **Backend (nội bộ):** `TokenGenerator.generate_token(user_id, username, expires_in)` — sinh JWT (HS256). **Payload JWT chỉ chứa `{user_id, username, exp}` — KHÔNG chứa `role`** (quyết định thiết kế có chủ đích, tránh quyền hạn bị lỗi thời trong phiên).
- **Backend → Frontend:** **`200 OK`**, `AuthResponse {access_token, token_type: "bearer", expires_in}`.

### 1.3. Lấy hồ sơ hiện tại — `GET /auth/me`

- **Frontend → Backend:** `GET /auth/me`, header `Authorization: Bearer <token>`.
- **Backend (nội bộ):** `TokenGenerator.verify_token(token)` — giải mã + kiểm tra hạn JWT.
  - Không có header/sai scheme → **`401`**, `{code: "UNAUTHORIZED", message: "Authentication required"}`.
  - Token không hợp lệ/hết hạn → **`401`**, `{code: "UNAUTHORIZED", message: "Invalid or expired token"}`.
- **Backend → PostgreSQL:** `SELECT id, username, email, role, created_at FROM users WHERE id=:user_id LIMIT 1` — **luôn truy vấn lại `role` từ DB, không đọc từ JWT payload** (đảm bảo quyền hạn luôn cập nhật theo thời gian thực).
- **Backend → Frontend:** **`200 OK`**, `User {id, username, email, role, created_at}`.

---

## LUỒNG 2 — UPLOAD (3 bước qua Presigned URL)

**Timeline tham gia:** Frontend, Backend, MinIO, PostgreSQL, Celery Worker (chỉ enqueue, xử lý ở Luồng 6)

### 2.1. Bước S1 — Xin đường dẫn tải lên: `POST /media/upload-url`

- **Frontend → Backend:** `POST /media/upload-url`, header `Authorization`, `Idempotency-Key` (tùy chọn), body `{filename, content_type, expected_size_mb}`.
- **Backend (nội bộ):** Nếu có `Idempotency-Key`, kiểm tra định dạng UUID hợp lệ — sai định dạng → **`400`**, `{code: "INVALID_IDEMPOTENCY_KEY"}`.
- **Backend (nội bộ, Service):** `_validate_presigned_request()` — chỉ chấp nhận `content_type ∈ {image/jpeg, image/png}`, `expected_size_mb ≤ 20` — sai → **`400`**, `{code: "BAD_REQUEST"}`.
- **Backend → Redis (Idempotency Adapter):** `retrieve_key(user_id, idempotency_key)` — nếu đã tồn tại kết quả cache từ trước → Backend trả ngay **`409 Conflict`** kèm **đúng schema `PresignedUploadResponse`** của lần gọi thành công đầu tiên (không xử lý lại).
- **Backend (nội bộ):** Sinh `image_id = uuid4()`, `object_key = "raw-images/{user_id}/{image_id}/{filename}"`.
- **Backend → MinIO (SDK, không qua REST):** `public_client.get_presigned_url(method="PUT", bucket="raw-images", object_name=object_key, expires=3600s)` — ký bằng AWS Signature V4.
- **Backend → Redis:** `store_key(user_id, idempotency_key, response)` — lưu cache cho 24 giờ (nếu có `Idempotency-Key`).
- **Backend → Frontend:** **`200 OK`**, `PresignedUploadResponse {upload_url, object_key, expires_in_sec: 3600, max_file_size_mb: 20, allowed_content_types: [...]}`.

### 2.2. Bước S2 — Tải file nhị phân: `PUT` trực tiếp lên MinIO

- **Frontend → MinIO:** `PUT <upload_url>`, body = file nhị phân thô. **Đây là ngoại lệ DUY NHẤT** cho phép Frontend chạm trực tiếp hạ tầng lưu trữ — không đi qua Backend, không cần `Authorization` (chữ ký trong URL đã đóng vai trò xác thực).
- **MinIO → Frontend:** `200 OK` (chuẩn giao thức S3/MinIO) nếu tải thành công. MinIO tự cưỡng chế giới hạn dung lượng đã nhúng trong chữ ký — vượt quá sẽ bị MinIO từ chối ở tầng hạ tầng, không cần Backend can thiệp.

### 2.3. Bước S3 — Xác nhận: `POST /media/upload/confirm`

- **Frontend → Backend:** `POST /media/upload/confirm`, body `{object_key, album_id, privacy_level, tags}`.
- **Backend (nội bộ):** `_validate_confirm_request()` — `privacy_level ∈ {0,1,2}`, `tags` tối đa 10 phần tử, mỗi tag 1-50 ký tự — sai → **`400`**.
- **Backend → Redis:** kiểm tra `Idempotency-Key` — trùng → **`409`** kèm response cũ.
- **Backend → MinIO:** `client.stat_object(bucket, object_key)` — xác minh file đã thực sự tồn tại trên MinIO (không tin tưởng mù client báo đã upload xong).
  - Không tồn tại → **`400`**, `{message: "Object not found in MinIO"}`.
- **Backend → PostgreSQL:** `INSERT INTO images (id, user_id, album_id, minio_object_name, minio_bucket, privacy_level, tags, index_status='pending') VALUES (...)`.
  - **Nếu INSERT lỗi (cơ chế bù trừ — compensating action, có bằng chứng trực tiếp trong code):**
    - **Backend → MinIO:** `delete_object(object_key)` — xóa file vừa tải lên để tránh dữ liệu mồ côi.
    - Log `"[S3] Compensating action executed: deleted object {object_key}"`.
    - Backend trả **`500`**, `{code: "METADATA_COMMIT_FAILED"}`.
- **Backend → Celery (Redis broker):** `process_image_indexing.delay(image_id)` — **enqueue không chờ (fire-and-forget)**, response HTTP tiếp tục xử lý ngay, không đợi task này chạy xong. *(Đây là ranh giới đồng bộ/bất đồng bộ — xem Luồng 6.)*
- **Backend → MinIO:** `generate_presigned_get_url(object_key, 3600s)` — sinh URL xem ảnh để trả về client.
  - Nếu bước này lỗi (hiếm, ví dụ MinIO tạm thời không phản hồi) → **KHÔNG fail toàn bộ request** — fallback sang `build_object_url()` (URL endpoint thường, không ký), log cảnh báo.
- **Backend → Redis:** lưu cache Idempotency-Key với response vừa tạo.
- **Backend → Frontend:** **`200 OK`**, `UploadResponse {image_id, minio_url, status: "pending", index_status: "pending"}`.

### 2.4. Luồng dự phòng — `POST /media/upload` (multipart, không qua S1/S2/S3)

- **Frontend → Backend:** `POST /media/upload`, multipart form (`file`, `album_id`, `privacy_level`).
- **Backend → MinIO:** `upload_object_bytes()` — Backend tự trung chuyển file (khác S1-S3, file **có đi qua** Backend).
- Phần còn lại (INSERT metadata, cơ chế bù trừ, enqueue Celery, sinh presigned GET URL) **giống hệt logic S3** ở trên.
- **Backend → Frontend:** **`201 Created`** (khác S3 dùng `200`), `UploadResponse`.

---

## LUỒNG 3 — SEARCH (Ảnh và Văn bản)

**Timeline tham gia:** Frontend, Backend, PostgreSQL (bảng `friends`), AIModule, StorageModule (PostgreSQL/pgvector)

### 3.1. Tìm bằng ảnh — `POST /search/image`

- **Frontend → Backend:** `POST /search/image`, multipart `{file, top_k, metric, album_id?}`.
- **Backend → AIModule:** `POST /inference/embed/image`, multipart `{file}`, header `Authorization: Bearer <token>`.
  - AIModule trả `401/403` → Backend raise `PermissionError`.
  - AIModule trả `≥500` → Backend raise `RuntimeError`.
  - AIModule trả `≥400` khác → Backend raise `ValueError` (parse `message`/`detail` từ response).
  - Thành công → AIModule trả **`200 OK`**, `VectorEmbeddingResponse {vector[512], dim, model}`.
- **Backend → PostgreSQL:** `SELECT friend_id FROM friends WHERE user_id=:current_user_id ORDER BY friend_id` — lấy danh sách bạn bè (thao tác SQL trực tiếp, **không** qua REST vì đây là bảng thuộc quyền Backend).
- **Backend (nội bộ):** Biên dịch `FilterExpression`:
  ```
  {"or": [
    {"field": "privacy_level", "op": "in", "value": [2]},
    {"field": "user_id", "op": "eq", "value": current_user_id},
    {"and": [{"privacy_level in [1]"}, {"user_id in friend_ids"}]}
  ]}
  ```
- **Backend → StorageModule:** `POST /vector/search/hybrid`, body `{vector, top_k, metric: "COSINE", filter: FilterExpression}`, header `Authorization`.
  - Timeout/lỗi kết nối → Backend raise `RuntimeError`.
  - `401/403` → `PermissionError`. `≥500` → `RuntimeError`. `≥400` khác → `ValueError`.
  - Thành công → StorageModule trả **`200 OK`**, `SearchResponse {results[], latency_ms, top_k}`.
- **Backend (nội bộ):** Nếu có `album_id` trong request, **lọc lại kết quả phía Python** (`_apply_album_filter_if_needed`) — **không** gửi `album_id` vào `FilterExpression` gửi cho StorageModule, lọc sau khi đã nhận kết quả.
- **Backend → Frontend:** **`200 OK`**, `SearchResponse {results: [{image_id, score, minio_url, metadata}], latency_ms, top_k}`.

### 3.2. Tìm bằng văn bản — `POST /search/text`

- **Frontend → Backend:** `POST /search/text`, JSON `{query_text, top_k, metric, album_id?}`.
- **Backend → AIModule:** `POST /inference/embed/text`, JSON `{query_text}` — cùng cơ chế xử lý lỗi như 3.1.
- **Phần còn lại (friends → filter → StorageModule → lọc album) giống hệt 3.1**, chỉ khác nguồn vector.

**Lưu ý quan trọng:** Toàn bộ Luồng 3 **hoàn toàn đồng bộ** — người dùng chờ trực tiếp cả 2 lệnh gọi HTTP nội bộ (AIModule + StorageModule) trong cùng 1 request-response, **không có phần nào chạy qua Celery/queue**.

---

## LUỒNG 4 — MEDIA / ALBUM CRUD

**Timeline tham gia:** Frontend, Backend, PostgreSQL, MinIO (chỉ để sinh URL xem ảnh)

### 4.1. Album — Tạo, liệt kê, xem, sửa, xóa mềm

- **`POST /albums`** → Backend `INSERT INTO albums (...)` → **`201`**, `Album`.
- **`GET /albums`** → Backend `SELECT ... FROM albums WHERE user_id=... AND deleted_at IS NULL` → **`200`**, `AlbumListResponse`.
- **`GET /albums/{album_id}`** → không tìm thấy/không đúng chủ → **`404`**.
- **`PUT /albums/{album_id}`**:
  - Backend → Service: kiểm tra tồn tại + đúng chủ sở hữu trước (`get_album()`).
  - Backend → PostgreSQL: `UPDATE albums SET {chỉ các field được cung cấp} WHERE id=... AND user_id=... AND deleted_at IS NULL RETURNING ...`.
  - Không có field nào thay đổi → trả nguyên trạng, **không** gọi UPDATE.
  - → **`200`**, `Album` đã cập nhật.
- **`DELETE /albums/{album_id}`**:
  - Backend → PostgreSQL: `UPDATE albums SET deleted_at = NOW() WHERE id=... AND user_id=... AND deleted_at IS NULL`.
  - `rowcount == 0` (đã xóa từ trước hoặc không tồn tại) → Service trả `False` → Router → **`404`**.
  - Thành công → **`204 No Content`**.

### 4.2. Ảnh — Xem, liệt kê, sửa metadata, xóa mềm

- **`GET /media/{image_id}`**:
  - Backend → PostgreSQL: `SELECT ... FROM images WHERE id=... `, kiểm tra `user_id` khớp.
  - Không khớp/không tồn tại → **`404`**.
  - Backend → MinIO: `generate_presigned_get_url()` để đính kèm `minio_url` vào response.
  - → **`200`**, `ImageMetadata`.
- **`GET /media`** (liệt kê, phân trang):
  - Backend → PostgreSQL: `SELECT ... LIMIT :limit OFFSET :offset [AND album_id=...]`.
  - Với **mỗi ảnh** trong danh sách, Backend → MinIO sinh riêng 1 `minio_url` (N lệnh gọi MinIO cho N ảnh trong trang).
  - → **`200`**, `ImageListResponse {items, total, offset, limit}`.
- **`PUT /media/{image_id}/update`**:
  - Backend kiểm tra sở hữu trước (`get_image()`) → không đúng chủ → **`404`**.
  - Backend → PostgreSQL: `UPDATE images SET {chỉ field được cung cấp: album_id/privacy_level/tags} WHERE ...`.
  - → **`200`**, `ImageMetadata` (kèm `minio_url` sinh lại).
- **`DELETE /media/{image_id}/delete`**:
  - Backend → PostgreSQL: `UPDATE images SET deleted_at = NOW() WHERE id=... AND user_id=...` (xóa mềm, **không** xóa file vật lý khỏi MinIO).
  - Không tìm thấy/không đúng chủ → **`404`**.
  - Thành công → **`204 No Content`**.

---

## LUỒNG 5 — EVALUATION (Benchmark CLIP, chỉ Admin)

**Timeline tham gia:** Frontend, Backend, PostgreSQL, AIModule, StorageModule

### 5.1. Khởi chạy — `POST /eval/run`

- **Frontend → Backend:** `POST /eval/run`, body `{limit?, seed?}`, header `Authorization` (phải là tài khoản `role='admin'`).
- **Backend → PostgreSQL:** `INSERT INTO evaluation_runs (status='running', limit_images, seed, created_by) RETURNING eval_id, ...`.
- **Backend → PostgreSQL:** `fetch_ready_images_for_evaluation(limit, seed)` — `SELECT id, minio_bucket, minio_object_name, album_id, tags FROM images WHERE index_status='ready' ORDER BY RANDOM()/md5(id||seed) LIMIT :limit`.
- **Backend → PostgreSQL:** `fetch_all_ready_image_tags()` — lấy toàn bộ tag của mọi ảnh `ready` để xây bảng đếm `tag_total_count` (dùng làm mẫu số Recall toàn cục).
- **Vòng lặp, với mỗi ảnh mẫu:**
  - **Backend → MinIO:** `client.get_object(bucket, object_name)` — tải bytes ảnh.
  - **Backend → AIModule:** `POST /inference/embed/image` (multipart, content-type suy từ đuôi file) → nhận vector.
  - **Backend → StorageModule:** `POST /vector/search/hybrid`, `{vector, top_k, metric: "COSINE", filter: None}` → nhận `ranked_ids`.
  - **Backend (nội bộ):** Loại self-match khỏi `ranked_ids` **ngay sau khi nhận kết quả**, trước mọi tính toán khác.
  - **Backend → PostgreSQL:** `fetch_metadata_for_images(candidate_ids)` — lấy `tags`/`album_id` của các ảnh trong top-k để xây ground truth (tag định danh khớp → relevant; fallback `album_id` nếu ảnh mẫu không có tag).
  - **Backend (nội bộ):** Tính `top1_class_label`, `is_cross_class_confusion` (so tag của ảnh #1 với tag ảnh mẫu).
- **Backend (nội bộ, sau vòng lặp):** Tính 4 chỉ số MRR/HitRate/Precision/Recall (Recall dùng `total_relevant_count` toàn cục làm mẫu số), `breakdown_by_class`, `cross_class_confusion_matrix`.
- **Backend → MinIO:** với mỗi truy vấn bị nhầm lẫn, sinh `presigned_get_url` cho ảnh mẫu + top-k liên quan (chỉ các case nhầm lẫn, không phải toàn bộ).
- **Backend → PostgreSQL:** `complete_evaluation_run()` — `INSERT ... ON CONFLICT DO UPDATE` vào `evaluation_metrics` (mrr, hit_rate, precision, recall, top_k, top1_cross_class_confusion_rate), `UPDATE evaluation_runs SET status='completed'`.
  - Lỗi bất kỳ đâu trong toàn bộ quá trình → `except Exception: fail_evaluation_run(); raise` → `UPDATE evaluation_runs SET status='failed'`.
- **Backend → Frontend:** **`202 Accepted`**, `{eval_id, status, breakdown_by_class, top1_cross_class_confusion_rate, cross_class_confusion_matrix, misclassified_queries}`.
  - **Lưu ý quan trọng:** mã `202` thường ngụ ý xử lý bất đồng bộ, nhưng **toàn bộ vòng lặp trên đã chạy xong hoàn toàn đồng bộ trước khi response này được gửi** — không có cơ chế thăm dò trạng thái riêng biệt. Đây là hạn chế thiết kế đã ghi nhận, phù hợp quy mô nghiên cứu.

### 5.2. Truy vấn lại — `GET /eval/results/{eval_id}`, `GET /eval/metrics`

- **Backend → PostgreSQL:** `JOIN evaluation_runs r ON evaluation_metrics m` theo `eval_id` (hoặc `ORDER BY completed_at DESC LIMIT 1` cho `/eval/metrics`).
- Không tìm thấy → **`404`**. Thành công → **`200`**.

**Xác thực quyền admin:** cột `role` được **truy vấn lại từ `users` mỗi request** (không đọc từ JWT) — sai vai trò → **`403`**, `{code: "ERR_FORBIDDEN_ADMIN_ONLY"}`.

---

## LUỒNG 6 — INDEXING (Bất đồng bộ, tách biệt khỏi Upload)

**Timeline tham gia:** Celery Worker, MinIO, AIModule, StorageModule/PostgreSQL

> **Không có endpoint HTTP riêng** — kích hoạt duy nhất bởi `process_image_indexing.delay(image_id)` gọi từ Luồng 2 (Upload, bước S3). Đây chính là ranh giới đồng bộ/bất đồng bộ: Backend trả response cho Frontend **ngay sau khi enqueue**, không chờ luồng dưới đây chạy xong.

### 6.1. Chuỗi xử lý chính (`process_image_indexing`, chạy trong tiến trình Celery riêng)

- **Celery Worker → MinIO:** tải bytes ảnh thật từ `minio_object_name` (không phải dữ liệu giả lập).
- **Celery Worker → AIModule:** `POST /inference/embed/image` (HTTP thật, `httpx.AsyncClient`).
  - Timeout/connect error → raise `TransientIndexingError`.
- **Celery Worker (nội bộ):** validate `vector_dim` nhận được khớp `global_config.vector_dim` (đọc từ env, không hardcode).
- **Celery Worker → StorageModule (nội bộ, HTTP thật dù chạy cùng server):** `POST /vector/index`, `{image_id, vector}`, header `Authorization`.
  - `201` → thành công.
  - `≥500` → `TransientIndexingError`.
  - `401/403` → `PermanentIndexingError`.
  - `400` + code `ERR_VECTOR_DIM_MISMATCH` → `PermanentIndexingError` (không retry).
  - `400` khác → `PermanentIndexingError`.
- **Celery Worker → PostgreSQL:** `UPDATE images SET index_status='ready' WHERE id=... AND deleted_at IS NULL` (SQLAlchemy trực tiếp — hợp lệ vì đây là cột `index_status`, **không phải** cột `embedding`).
  - `rowcount == 0` (ảnh đã bị xóa mềm giữa chừng) → `PermanentIndexingError`.

### 6.2. Cơ chế lỗi và retry (có bằng chứng chi tiết trong code)

| Loại lỗi | Ví dụ | Hành vi |
|---|---|---|
| `PermanentIndexingError` | Vector dim sai, auth bị từ chối, ảnh không tồn tại | **Không retry** — gọi ngay `_mark_failed()` → `UPDATE index_status='failed'` |
| `TransientIndexingError` | Timeout, mất kết nối, lỗi `5xx` | **Retry** với backoff cấp số nhân: `countdown = (BACKOFF_MS/1000) × FACTOR^lần_thử` (1s → 2s → 4s) |
| `Exception` không rõ loại | Lỗi ngoài dự kiến | **Mặc định coi là Transient** — bọc thành `TransientIndexingError`, vẫn cho retry (thiên về "cho cơ hội thử lại" hơn "an toàn, fail nhanh") |

- Hết số lần thử tối đa (`MAX_RETRIES`, đọc từ `global_config.retry_policy`) → dừng hẳn, `_mark_failed()` → `index_status='failed'`, không thử lại nữa.
- Toàn bộ luồng chạy trong `asyncio.run()` bên trong task Celery đồng bộ (`bind=True`) — mỗi lần thử là 1 phiên async độc lập, `engine.dispose()` sau mỗi lần chạy.

---

## BẢNG TỔNG HỢP — Ranh giới Đồng bộ / Bất đồng bộ toàn hệ thống

| Luồng | Đồng bộ (chờ response ngay) | Bất đồng bộ (Celery/queue) |
|---|---|---|
| Auth | Toàn bộ | Không có |
| Upload | S1, S2, S3 (kể cả bước enqueue — chỉ gọi `.delay()` không chờ) | S4-S5 (Indexing) |
| Search | Toàn bộ (kể cả gọi AIModule + StorageModule) | Không có |
| Media/Album CRUD | Toàn bộ | Không có |
| Evaluation | Toàn bộ (dù mã trả về là `202`) | Không có — hạn chế thiết kế đã ghi nhận |
| Indexing | — | Toàn bộ (chạy trong Celery Worker riêng biệt) |

---

## GHI CHÚ ĐỐI CHIẾU — Chi tiết code thật khác/bổ sung so với tài liệu tổng hợp trước đây

1. **Cơ chế fallback URL xem ảnh:** nếu `generate_presigned_get_url()` lỗi (hiếm), Backend **không fail toàn bộ request** — tự động dùng `build_object_url()` (URL không ký) thay thế, chỉ log cảnh báo. Áp dụng cho cả luồng Upload (S3, legacy) và Media (GET ảnh).
2. **2 lớp bảo vệ trùng lặp nhất quán:** cả Auth (đăng ký) và Media (xóa album/ảnh) đều có song song 2 cơ chế kiểm tra (SELECT trước + ràng buộc DB, hoặc kiểm tra sở hữu ở Service + điều kiện `WHERE user_id` ở Adapter) — không phải trùng lặp thừa, mà là phòng vệ race-condition.
3. **Lọc `album_id` trong Search xảy ra phía Backend (Python), không gửi vào `FilterExpression`** cho StorageModule — StorageModule không biết khái niệm "lọc theo album" trong bộ lọc nó nhận.
4. **Evaluation không có cơ chế retry nào** (khác Indexing) — bất kỳ lỗi nào trong vòng lặp benchmark đều dừng toàn bộ lần chạy ngay lập tức.
5. **Indexing mặc định coi lỗi lạ là "có thể thử lại"** — quyết định thiết kế nghiêng về khả năng phục hồi hơn là dừng an toàn ngay lập tức.
