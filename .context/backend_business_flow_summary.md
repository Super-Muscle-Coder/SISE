## PHẦN 1 — TRI THỨC ÁP DỤNG

BackendModule đóng vai trò **API Gateway/Orchestrator** thuần túy — bản
thân nó không chứa thuật toán học máy hay xử lý ảnh nào (những phần đó
thuộc AIModule). Tri thức cốt lõi ở đây thuộc về **kiến trúc phần mềm và
thiết kế hệ thống phân tán**, không phải thuật toán AI.

### 1.1 Kiến trúc Workflow-Centric 5 lớp

Mỗi nghiệp vụ (workflow) được tổ chức thành 4 tệp độc lập theo đúng 1
chiều phụ thuộc: `entities` (mô hình dữ liệu thuần Pydantic) → `adapters`
(truy cập DB/HTTP/MinIO thô) → `services` (logic nghiệp vụ, điều phối
nhiều adapter) → `routers` (endpoint FastAPI). Nguyên tắc quan trọng nhất:
**chấp nhận trùng lặp có chủ đích** giữa các workflow (ví dụ mỗi router
tự định nghĩa lại `get_current_authenticated_user()`, mỗi workflow tự
định nghĩa `PrivacyLevel`/`ImageMetadata` riêng dù trùng cấu trúc) để giữ
từng workflow **hoàn toàn cô lập, dễ audit độc lập** — đánh đổi lấy 1 ít
dư thừa code để tránh phụ thuộc chéo ẩn giữa các phần không liên quan.

### 1.2 Idempotency (chống trùng lặp yêu cầu)

Các endpoint có khả năng gây tác dụng phụ khi gọi lại (`POST
/media/upload-url`, `POST /media/upload/confirm`, `POST /vector/index`)
hỗ trợ header `Idempotency-Key` (UUID do client tự sinh). Server lưu kết
quả lần gọi đầu vào Redis theo key này; nếu client gọi lại với cùng key
(do mất mạng, retry tự động...), server trả `409` kèm **nguyên vẹn**
response gốc thay vì xử lý lại — đảm bảo 1 yêu cầu logic của người dùng
không bao giờ tạo ra 2 bản ghi trùng lặp trong hệ thống dù mạng không ổn
định.

### 1.3 Retrieval Evaluation Metrics (MRR, HitRate, Precision@K, Recall@K)

Đây là phần tri thức học thuật duy nhất thực sự thuộc về BackendModule
(workflow `evaluation`) — 4 chỉ số chuẩn trong lĩnh vực Information
Retrieval, dùng để đánh giá khách quan chất lượng tìm kiếm ảnh bằng CLIP:

- **MRR (Mean Reciprocal Rank):** trung bình nghịch đảo thứ hạng của kết
  quả đúng đầu tiên — phạt nặng nếu kết quả đúng nằm xa vị trí #1.
- **HitRate:** tỷ lệ truy vấn có **ít nhất 1** kết quả đúng trong top-K.
- **Precision@K:** trong K kết quả trả về, bao nhiêu % thực sự đúng.
- **Recall@K:** trong tổng số kết quả đúng có thể có, top-K tìm được bao
  nhiêu %.

Ground truth (định nghĩa "đúng là gì") được xây dựng theo mô hình
**1-tag-định-danh** (mỗi ảnh gắn đúng 1 tag xác định danh tính), ưu tiên
tag hơn `album_id` (album dễ bị gán nhầm do thao tác người dùng, tag được
gắn có chủ đích). Bổ sung thêm chỉ số **`top1_cross_class_confusion_rate`**
(tự thiết kế, không phải chuẩn IR kinh điển) để tách bạch "CLIP nhầm sang
đối tượng khác hoàn toàn" khỏi "CLIP chỉ xếp sai thứ tự nội bộ giữa các
ảnh cùng 1 đối tượng" — phát hiện quan trọng cho thấy `MRR` thấp trong
benchmark thực tế chủ yếu do nguyên nhân thứ hai, không phải nhầm lẫn
danh tính thật.

### 1.4 JWT (JSON Web Token) & RBAC tối giản

Xác thực dùng JWT chữ ký `HS256`, payload **chỉ chứa** `{user_id,
username, exp}` — **không lưu `role`** trong token. Đây là quyết định có
chủ đích: nếu role được cache trong JWT, việc nâng quyền/hạ quyền 1 tài
khoản sẽ không có hiệu lực cho tới khi token cũ hết hạn (rủi ro bảo mật
"stale permission"). Thay vào đó, mọi endpoint yêu cầu quyền `admin` đều
**truy vấn lại trực tiếp** cột `users.role` từ PostgreSQL ở mỗi request.

---

## PHẦN 2 — HẠ TẦNG (API, Endpoint, Giao tiếp liên-module)

### 2.1 Vị trí BackendModule trong kiến trúc tổng thể

```
FrontendModule (E) ──HTTP──▶ BackendModule (D, gateway duy nhất)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼                                ▼
            AIModule (C, khóa)              StorageModule (B, khóa)
         /inference/embed/*                /vector/index
         (embedding extraction)            /vector/search/hybrid
                                            (pgvector, chạy NGAY TRÊN
                                             chính server BackendModule,
                                             không phải service riêng)
```

FrontendModule **không bao giờ** gọi trực tiếp AIModule hay StorageModule
— mọi request đều đi qua BackendModule, vốn đóng vai trò "wrapper ứng
dụng" (application-level wrapper): nhận 1 request đơn giản từ Frontend,
tự tuần tự gọi nhiều service nội bộ, rồi trả về 1 response gộp duy nhất.

**Lưu ý kiến trúc quan trọng:** `/vector/index` và `/vector/search/hybrid`
tuy mang tag `StorageModule` (Clause B) trong hợp đồng, nhưng **thực thi
ngay trên server của BackendModule** (namespace `storage_vector_*`) — vì
StorageModule không chạy 1 HTTP service riêng biệt, chỉ sở hữu về mặt
thiết kế dữ liệu (bảng, index HNSW). Đây là ranh giới sở hữu nghiệp vụ,
không phải ranh giới network.

### 2.2 Toàn bộ endpoint do BackendModule triển khai (Clause D)

#### System & Health
| Endpoint | Method | Công dụng |
|---|---|---|
| `/health/liveness` | GET | Process còn sống hay không — không kiểm tra dependency nào |
| `/health/readiness` | GET | Kiểm tra đủ 4 dependency (postgres + pgvector, minio, ai_service, redis), trả header `X-Expected-Vector-Dim: 512`, `503` nếu có dependency down |

#### Auth
| Endpoint | Method | Công dụng |
|---|---|---|
| `/auth/register` | POST | Tạo tài khoản mới, hash password, trả `User` (không kèm token) |
| `/auth/login` | POST | Xác thực, trả `AuthResponse {access_token, token_type, expires_in}` |
| `/auth/me` | GET | Lấy thông tin tài khoản đang đăng nhập |

#### Friends
| Endpoint | Method | Công dụng |
|---|---|---|
| `/friends` | GET | Liệt kê danh sách bạn bè |
| `/friends/request` | POST | Kết bạn — ghi **đối xứng 2 dòng** (A→B, B→A) trong cùng 1 transaction (auto-accept, không có hàng đợi pending riêng) |
| `/friends/{friend_id}` | DELETE | Hủy kết bạn — xóa **cả 2 dòng đối xứng** |

#### Media & Albums
| Endpoint | Method | Công dụng |
|---|---|---|
| `/media/upload-url` | POST | S1 — xin presigned URL (chữ ký AWS SigV4) để upload thẳng lên MinIO |
| `/media/upload/confirm` | POST | S3 — xác nhận đã upload xong, ghi metadata, `index_status='pending'`, tự động enqueue Celery task |
| `/media/{image_id}` | GET | Xem chi tiết 1 ảnh |
| `/media/{image_id}/update` | PUT | Sửa metadata (album, privacy, tags) |
| `/media/{image_id}/delete` | DELETE | Xóa mềm (soft delete) |
| `/media` | GET | Danh sách ảnh của user (phân trang, lọc theo album) |
| `/albums` | GET, POST | Danh sách / tạo album |
| `/albums/{album_id}` | GET, PUT, DELETE | Chi tiết / sửa / xóa mềm album |

#### Search
| Endpoint | Method | Công dụng |
|---|---|---|
| `/search/image` | POST | Tìm bằng ảnh — gọi nội bộ `/inference/embed/image` (C) rồi `/vector/search/hybrid` (B) |
| `/search/text` | POST | Tìm bằng văn bản — gọi nội bộ `/inference/embed/text` (C) rồi `/vector/search/hybrid` (B) |

#### Vector (thực thi tại BackendModule, tag StorageModule)
| Endpoint | Method | Công dụng |
|---|---|---|
| `/vector/index` | POST | Ghi vector vào `images.embedding` (pgvector) — chỉ Celery Worker nội bộ gọi, Frontend không bao giờ gọi trực tiếp |
| `/vector/search/hybrid` | POST | ANN search (cosine similarity, HNSW index) kết hợp lọc metadata (privacy, album, tags) |

#### Evaluation & Admin (yêu cầu quyền `admin`)
| Endpoint | Method | Công dụng |
|---|---|---|
| `/eval/run` | POST | Chạy benchmark CLIP (MRR/HitRate/Precision/Recall + breakdown chi tiết) |
| `/eval/results/{eval_id}` | GET | Xem lại kết quả 1 lần chạy benchmark |
| `/eval/metrics` | GET | Kết quả benchmark gần nhất |
| `/admin/reindex` | POST | Đánh index lại hàng loạt ảnh — gọi `/inference/embed/batch` rồi `/vector/index` theo batch |

### 2.3 Giao tiếp với AIModule (Clause C — nội bộ, chỉ D được gọi)

| Endpoint AIModule | BackendModule gọi khi nào |
|---|---|
| `POST /inference/embed/image` | Trong `upload_pipeline` (Celery Worker, sau khi ảnh upload xong) và trong `/search/image` |
| `POST /inference/embed/text` | Trong `/search/text` |
| `POST /inference/embed/batch` | Trong `/admin/reindex` — gửi nhiều ảnh 1 lần thay vì gọi lặp `embed/image` |

Cả 3 endpoint dùng `multipart/form-data` (ảnh) hoặc `application/json`
(văn bản), yêu cầu `BearerAuth`, trả `VectorEmbeddingResponse
{vector, dim, model}` (hoặc `BatchVectorEmbeddingResponse` cho batch, có
cấu trúc `{index, success, vector, error}` cho từng phần tử để xử lý đúng
khi 1 phần batch thất bại).

### 2.4 Giao tiếp với StorageModule (Clause B — nội bộ, chỉ D được gọi)

`/vector/index` chỉ được gọi bởi **Celery Worker** trong bước S4 của
upload pipeline (không bao giờ do FastAPI request-response trực tiếp gọi)
— đúng nguyên tắc "D không được tự `UPDATE` cột `embedding` bằng
SQLAlchemy, bắt buộc đi qua endpoint này" để đảm bảo mọi ghi vector đều
qua đúng 1 cửa duy nhất, tránh dữ liệu vector sai định dạng lọt vào
pgvector.

`/vector/search/hybrid` nhận `FilterExpression` (cấu trúc lọc đệ quy dạng
`and`/`or`/leaf `{field, op, value}`) — BackendModule tự biên dịch bộ lọc
quyền riêng tư (`privacy_level`) trước khi gửi, đặc biệt với
`privacy_level=1` (Friends): tự `JOIN` bảng `friends` để lấy danh sách
bạn bè **trước**, rồi mới gửi filter đã biên dịch — tuyệt đối không tự
`JOIN` trực tiếp vào cột `embedding`.

### 2.5 Giao tiếp với FrontendModule (Clause E)

BackendModule là **gateway duy nhất** Frontend giao tiếp — không có
đường tắt nào khác. Toàn bộ endpoint ở mục 2.2 là bề mặt API công khai
cho Frontend. Xác thực dùng Bearer Token (JWT) trong header
`Authorization`, response lỗi thống nhất `{code, message}`.

### 2.6 Luồng Upload — mô hình "Direct-to-Storage" 3 bước (S1→S2→S3)

Đặc điểm hạ tầng đáng chú ý nhất: **ảnh không đi qua BackendModule**.

1. **S1** (`POST /media/upload-url`): Backend sinh presigned URL (ký bằng
   thuật toán AWS Signature V4), trả về cho Frontend.
2. **S2** (`PUT` trực tiếp): **Trình duyệt** tự thực hiện `PUT` file
   thẳng lên MinIO bằng URL nhận được — hoàn toàn không qua Backend, giảm
   tải băng thông đáng kể cho tầng ứng dụng.
3. **S3** (`POST /media/upload/confirm`): Frontend báo lại đã upload
   xong, Backend ghi metadata vào PostgreSQL và tự động **enqueue Celery
   task** (bất đồng bộ) để gọi AIModule tính vector rồi ghi vào
   StorageModule.

**Bài học hạ tầng quan trọng đã rút ra khi triển khai:** presigned URL
này cần được ký với **2 hostname khác nhau tùy ngữ cảnh** — nội bộ Docker
network (`sise-minio:9000`, dùng khi BackendModule tự thao tác MinIO) và
địa chỉ public (`localhost:9000`, dùng khi trình duyệt bên ngoài gọi trực
tiếp ở bước S2). Dùng nhầm 1 client cho cả 2 mục đích sẽ khiến trình
duyệt không resolve được hostname nội bộ.