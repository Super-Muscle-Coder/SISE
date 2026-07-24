# Tổng hợp luồng nghiệp vụ FrontendModule (SISE) — Tài liệu nguồn cho báo cáo

> Tài liệu này tổng hợp lại 4 luồng nghiệp vụ chính đã hoàn thiện ở FrontendModule (AG-04), tập trung vào cách Frontend đóng vai trò **lớp trung gian (client layer)** giao tiếp với hạ tầng phía sau (BackendModule, AIModule, StorageModule) thông qua REST API đã đặc tả trong `openapi.yaml` v1.2.3. Không đi sâu vào chi tiết implementation UI, chỉ tập trung vào **luồng dữ liệu và giao tiếp API**.

---

## 0. Kiến trúc tổng quan lớp giao tiếp

Toàn bộ giao tiếp giữa Frontend và Backend đi qua **1 điểm vào duy nhất**: `scaffoldAdapter` (Axios instance có cấu hình sẵn `baseURL`, interceptor request/response, retry logic, timeout). Mọi request đều tự động được gắn:

- **Bearer Token** (`Authorization: Bearer <JWT>`) — đọc từ `localStorage`, gắn tự động vào header nếu người dùng đã đăng nhập.
- **Idempotency-Key** (UUID v4) — gắn tự động cho mọi request `POST/PUT/PATCH/DELETE`, theo đúng `openapi.yaml` `components.parameters.IdempotencyKey` — cơ chế chống xử lý trùng lặp khi client vô tình gửi lại cùng 1 request (mất mạng, double-click...).
- **Retry tự động** — với lỗi `408/429/5xx`, tự thử lại tối đa 3 lần theo backoff tăng dần (1s → 2s → 4s), theo `data_schema.yaml global_configs.retry_policy`.

Kiến trúc Frontend theo mô hình **5 tầng** (Workflow-Centric Architecture): `configs → entities → adapters → services → routers → pages`, trong đó **`adapters`** là tầng duy nhất thực sự gọi HTTP request tới Backend, các tầng trên chỉ điều phối state/logic UI.

---

## 1. Luồng Đăng nhập / Đăng ký

### Mục đích nghiệp vụ
Cho phép người dùng tạo tài khoản mới và xác thực để truy cập các chức năng còn lại của hệ thống (mọi endpoint khác đều yêu cầu Bearer Token hợp lệ).

### API/Endpoint sử dụng (theo `openapi.yaml`, Clause A — Auth)

| Endpoint | Method | Mô tả |
|---|---|---|
| `/auth/register` | `POST` | Tạo tài khoản mới |
| `/auth/login` | `POST` | Xác thực, nhận JWT |
| `/auth/me` | `GET` | Lấy thông tin tài khoản hiện tại |

### Chi tiết luồng

**Đăng ký:**
1. Người dùng nhập `username`, `email`, `password` vào form đăng ký (validate phía client: độ dài username 3-50 ký tự, password tối thiểu 8 ký tự, định dạng email hợp lệ — mirror đúng ràng buộc Backend để giảm round-trip lỗi không cần thiết).
2. Frontend gửi `POST /auth/register` với body `{username, email, password}`.
3. Backend hash password, ghi vào bảng `users` (đúng `backend_owned_resources`), trả về `201 Created` kèm object `User` đầy đủ (`{id, username, email, created_at, role}}`) — **không kèm token**.
4. **Ngay sau khi đăng ký thành công**, Frontend tự động gọi tiếp `POST /auth/login` (dùng chính username/password vừa nhập) để lấy token — đây là quyết định UX chủ động của Frontend (không có trong hợp đồng), giúp người dùng không phải đăng nhập lại thủ công sau khi đăng ký.
5. Sau khi có token, Frontend **tự động tạo 1 album mặc định** (`POST /albums`, `title: "Default"`) cho tài khoản mới — đảm bảo người dùng luôn có ít nhất 1 album để upload ảnh vào ngay từ lần đầu sử dụng.

**Đăng nhập:**
1. Frontend gửi `POST /auth/login` với `{username, password}`.
2. Backend xác thực, trả về `200 OK` với `AuthResponse {access_token, token_type: "bearer", expires_in}`.
3. Frontend lưu `access_token` vào `localStorage`, phát ra sự kiện nội bộ `sessionStarted` — hệ thống điều hướng tự động chuyển người dùng sang Dashboard.

**Xử lý lỗi theo đúng hợp đồng:**
- `400` — dữ liệu sai định dạng (thiếu trường, email không hợp lệ).
- `409` — username/email đã tồn tại (đăng ký).
- `401` — sai username/password (đăng nhập).

**Cơ chế phiên đăng nhập toàn cục:** Frontend có 1 interceptor lắng nghe lỗi `401` từ **bất kỳ API call nào** trong toàn hệ thống — nếu phát hiện token hết hạn/không hợp lệ giữa chừng (không chỉ lúc đăng nhập), tự động xóa token, phát sự kiện `sessionEnded`, điều hướng người dùng về trang đăng nhập. Cơ chế này đồng bộ qua nhiều tab trình duyệt (dùng sự kiện `storage` của trình duyệt).

---

## 2. Luồng Upload ảnh

### Mục đích nghiệp vụ
Cho phép người dùng tải ảnh thật lên hệ thống, tạo dữ liệu để phục vụ tìm kiếm bằng CLIP. Đây là bước **tiên quyết** — không có ảnh trong hệ thống thì không thể tìm kiếm hay benchmark.

### API/Endpoint sử dụng (Clause D, upload_pipeline)

| Endpoint | Method | Vai trò |
|---|---|---|
| `/media/upload-url` | `POST` | Bước S1 — xin URL tải lên có chữ ký trước (presigned URL) |
| *(URL trả về từ S1)* | `PUT` | Bước S2 — tải file nhị phân thẳng lên MinIO |
| `/media/upload/confirm` | `POST` | Bước S3 — xác nhận đã tải xong, ghi metadata |

### Chi tiết luồng — mô hình 3 bước (S1 → S2 → S3)

**Bước S1 — Xin presigned URL:**
Frontend gửi `POST /media/upload-url` với `{filename, content_type, expected_size_mb}`. Backend sinh 1 URL có chữ ký số (AWS Signature V4) trỏ thẳng tới MinIO, hiệu lực trong 1 giờ, kèm `object_key` (đường dẫn lưu trữ duy nhất) và ràng buộc `{max_file_size_mb: 20, allowed_content_types: [image/jpeg, image/png]}`.

**Bước S2 — Upload nhị phân trực tiếp lên MinIO:**
Trình duyệt **tự thực hiện `PUT`** thẳng tới URL nhận được ở S1 — **file ảnh không đi qua Backend**, giảm tải hoàn toàn cho tầng ứng dụng, đúng kiến trúc "direct-to-storage upload" phổ biến trong hệ thống lưu trữ đám mây hiện đại. Đây là 1 HTTP client **hoàn toàn tách biệt**, không gắn Bearer Token hay bất kỳ header xác thực nào của hệ thống (vì chính chữ ký trong URL đã đóng vai trò xác thực).

**Bước S3 — Xác nhận & ghi metadata:**
Sau khi tải nhị phân thành công, Frontend gửi `POST /media/upload/confirm` với `{object_key, album_id, privacy_level, tags?}`. Backend ghi bản ghi ảnh vào PostgreSQL với `index_status = "pending"`, đồng thời **đẩy 1 tác vụ bất đồng bộ (Celery task)** vào hàng đợi để tính vector embedding CLIP cho ảnh — **response trả về ngay lập tức** (`200 OK`, `index_status: "pending"`), không đợi việc tính embedding hoàn tất.

### Xử lý đồng thời nhiều ảnh (Bulk Upload)
Frontend hỗ trợ tải lên nhiều ảnh cùng lúc — quản lý 1 hàng đợi nội bộ, giới hạn tối đa **N job chạy song song** (mặc định 3-5, có thể cấu hình) để tránh quá tải trình duyệt/Backend, tự động retry tối đa 2 lần cho từng ảnh nếu gặp lỗi tạm thời, có cơ chế hủy từng ảnh riêng lẻ giữa chừng.

### Idempotency — chống upload trùng lặp
Theo `data_schema.yaml`, nếu Frontend vô tình gửi lại đúng 1 request `S1`/`S3` (ví dụ do mất mạng rồi tự động retry), Backend nhận diện qua header `Idempotency-Key` và trả về **response `409` chứa nguyên schema thành công của lần gọi đầu tiên** — Frontend coi đây là **thành công**, không phải lỗi, sử dụng lại kết quả cũ thay vì tạo bản ghi trùng lặp.

### Trạng thái xử lý ảnh (`index_status`)
Sau khi upload xong (S3), ảnh ở trạng thái `pending` — Frontend tự động polling `GET /media/{image_id}` theo chu kỳ (mặc định 3 giây/lần) để cập nhật giao diện khi trạng thái chuyển sang `ready` (đã tính xong vector embedding, có thể tìm kiếm được) hoặc `failed`.

---

## 3. Luồng Tìm kiếm ảnh (Search)

### Mục đích nghiệp vụ
Đây là **chức năng lõi** của toàn hệ thống — cho phép người dùng tìm ảnh bằng 2 cách: mô tả bằng văn bản, hoặc dùng chính 1 ảnh khác làm truy vấn. Đây là nơi mô hình CLIP thể hiện năng lực zero-shot cross-modal retrieval.

### API/Endpoint sử dụng (Clause D, gọi xuống Clause C qua Clause B)

| Endpoint | Method | Input |
|---|---|---|
| `/search/text` | `POST` | `{query_text, top_k?, metric?, album_id?}` |
| `/search/image` | `POST` | multipart/form-data: `{file, top_k?, metric?, album_id?}` |

### Chi tiết luồng

**Tìm bằng văn bản:**
1. Người dùng gõ vào ô tìm kiếm (Header, luôn hiển thị xuyên suốt giao diện) — Frontend **tự động debounce 500ms** (tránh gọi API liên tục khi đang gõ).
2. Gửi `POST /search/text` với `{query_text, top_k: 10, metric: "COSINE"}` (`metric` luôn cố định `COSINE`, không cho người dùng chọn khác — đúng ràng buộc hợp đồng vì Backend chỉ có 1 index HNSW dùng `vector_cosine_ops`).
3. **Backend → AIModule:** BackendModule relay câu truy vấn sang AIModule (`POST /inference/embed/text`), nhận về vector 512 chiều đại diện ngữ nghĩa của câu văn bản.
4. **Backend → StorageModule:** BackendModule dùng vector đó gọi `POST /vector/search/hybrid` (endpoint nội bộ của StorageModule) — thực hiện tìm kiếm cosine similarity trên toàn bộ vector ảnh đã lưu trong PostgreSQL/pgvector (chỉ so sánh với ảnh có `index_status = "ready"`).
5. Kết quả trả về Frontend là `SearchResponse {results: [{image_id, score, minio_url, metadata}], latency_ms, top_k}` — mỗi kết quả kèm `score` (cosine similarity, thang 0.0-1.0) để hiển thị độ liên quan.

**Tìm bằng hình ảnh:**
Luồng tương tự, khác ở bước 3: gửi file ảnh qua `POST /search/image` (multipart/form-data), Backend relay sang AIModule (`POST /inference/embed/image`) để tính vector từ nội dung ảnh thay vì văn bản, các bước sau giữ nguyên.

**Cơ chế "tìm ảnh tương tự" (tại trang xem chi tiết ảnh):** Không có endpoint riêng cho tính năng này trong hợp đồng — Frontend **tái sử dụng chính workflow search** làm "truy vấn bị động": lấy tag định danh của ảnh đang xem làm `query_text` gọi `search/text` (nếu có tag); nếu ảnh không có tag, tải lại chính file ảnh đó rồi gọi `search/image` làm phương án dự phòng.

**Hủy request khi đổi phương thức tìm kiếm giữa chừng:** Nếu người dùng đang gõ text rồi đột ngột chuyển sang tìm bằng ảnh (hoặc ngược lại), Frontend chủ động hủy (`AbortController`) request cũ đang chạy dở, tránh nhận về kết quả sai ngữ cảnh hiển thị chồng lên kết quả mới.

---

## 4. Luồng xem Benchmark (Evaluation) — phục vụ mục đích nghiên cứu

### Mục đích nghiệp vụ
Cho phép đo lường định lượng chất lượng mô hình CLIP đang vận hành trong hệ thống thật — đây là công cụ chính phục vụ phần thực nghiệm của đồ án, không phải tính năng cho người dùng cuối thông thường (giới hạn quyền truy cập `admin`).

### API/Endpoint sử dụng (Clause D, EvaluationService)

| Endpoint | Method | Vai trò |
|---|---|---|
| `/eval/run` | `POST` | Chạy 1 lượt đánh giá benchmark mới (đồng bộ) |
| `/eval/results/{eval_id}` | `GET` | Tra cứu lại 1 lượt đánh giá cụ thể theo ID |
| `/eval/metrics` | `GET` | Lấy 4 chỉ số cốt lõi của lượt đánh giá "completed" gần nhất đã lưu |

### Chi tiết luồng

1. **Kiểm soát quyền:** Frontend tự lấy thông tin tài khoản hiện tại (`GET /auth/me`), kiểm tra `role === "admin"` — chỉ hiển thị chức năng chạy/xem benchmark cho tài khoản quản trị, đúng cơ chế `admin_authorization` của hợp đồng (Backend cũng tự chặn ở tầng API với `403 ERR_FORBIDDEN_ADMIN_ONLY` nếu cố tình gọi trái phép, Frontend chỉ là lớp UX bổ sung, không thay thế việc kiểm soát ở Backend).
2. **Chạy benchmark:** Gửi `POST /eval/run` — Backend chọn ngẫu nhiên N ảnh đã index (`limit` cấu hình được), với mỗi ảnh mẫu, xác định "nhóm đúng" (ảnh khác cùng đối tượng, dựa theo tag định danh đã chuẩn hóa), rồi dùng chính ảnh đó làm truy vấn tìm lại trong toàn bộ database, tính toán 4 chỉ số cho từng ảnh và tổng hợp lại.
3. Response trả về đầy đủ ngay trong request (xử lý đồng bộ, không cần polling): 4 chỉ số toàn cục (`MRR, HitRate, Precision, Recall`), phân tích chi tiết theo từng nhóm đối tượng (`breakdown_by_class`), và danh sách các trường hợp nhận diện sai kèm ảnh minh họa cụ thể (`misclassified_queries`) — phục vụ trực tiếp phân tích định tính cho báo cáo.
4. Vì thời gian xử lý benchmark tỷ lệ thuận với số lượng ảnh mẫu, Frontend cấu hình `timeout` riêng dài hơn (tách khỏi timeout mặc định của các API thông thường) cho riêng luồng này, và **chủ động không tự động thử lại (retry)** nếu gặp lỗi — vì đây là thao tác **không idempotent** (mỗi lần gọi tạo ra 1 bản ghi đánh giá mới trong hệ thống), tự động thử lại khi gặp timeout có thể vô tình kích hoạt nhiều lượt tính toán trùng lặp không cần thiết.

### Ý nghĩa của 4 chỉ số (dùng cho phần lý thuyết báo cáo)
- **MRR (Mean Reciprocal Rank):** trung bình nghịch đảo thứ hạng của kết quả đúng đầu tiên tìm được — đo *độ chính xác vị trí xếp hạng*.
- **HitRate:** tỷ lệ truy vấn có ít nhất 1 kết quả đúng xuất hiện trong top-K — đo *khả năng tìm thấy được, không quan tâm vị trí*.
- **Precision:** tỷ lệ kết quả đúng trong tổng số kết quả trả về (top-K) — đo *độ "sạch" của kết quả*.
- **Recall:** tỷ lệ kết quả đúng tìm được trên tổng số kết quả đúng có trong toàn hệ thống — đo *độ bao phủ*.

---

## 5. Sơ đồ tổng quan luồng dữ liệu qua các module

```
[Trình duyệt / Frontend]
        │
        │  REST API (JWT Bearer, JSON/multipart)
        ▼
[BackendModule — API Gateway]  ←── điều phối trung tâm, không xử lý AI/vector trực tiếp
        │                     │
        │ (auth/media/friends/eval — SQLAlchemy trực tiếp)
        │                     │
        │           gọi khi cần embedding text/ảnh
        │                     ▼
        │              [AIModule — CLIP inference]
        │                     │
        │           trả về vector 512 chiều
        │                     │
        │           gọi khi cần lưu/tìm vector
        ▼                     ▼
[PostgreSQL + pgvector]  ←──── [StorageModule — vector index/search]
        ▲
        │
[MinIO — lưu trữ file ảnh nhị phân, truy cập trực tiếp từ trình duyệt qua presigned URL]
```

**Nguyên tắc quan trọng:** Frontend **không bao giờ gọi trực tiếp** AIModule hay StorageModule — mọi giao tiếp đều đi qua BackendModule làm cổng trung gian duy nhất, đúng vai trò "API Gateway" đã thiết kế. Ngoại lệ duy nhất là bước **S2 của upload** (PUT file nhị phân) và việc **tải ảnh hiển thị** (GET qua presigned URL) — 2 trường hợp này trình duyệt giao tiếp thẳng với MinIO, không qua Backend, để giảm tải băng thông cho tầng ứng dụng.
