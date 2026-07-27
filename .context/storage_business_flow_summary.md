# Tổng hợp luồng nghiệp vụ & hạ tầng StorageModule (SISE) — Tài liệu nguồn cho báo cáo

> Tài liệu này tổng hợp vai trò của StorageModule (AG-02) trong hệ thống SISE, đối chiếu trực tiếp với `data_schema.yaml` (Clause B) và `Workflow_Centric_Architecture.md` §2.2, dựa trên chính quá trình audit + fix + verify runtime thật đã thực hiện trong các phiên làm việc trước. Phạm vi tài liệu này **chỉ giới hạn ở StorageModule** — các chi tiết về nội bộ BackendModule/AIModule chỉ được nhắc tới ở mức "điểm chạm giao tiếp" (những gì `data_schema.yaml` xác nhận StorageModule expose ra ngoài), không đi sâu vào workflow/code nội bộ 2 module đó vì nằm ngoài phạm vi audit trực tiếp của StorageModule.

---

## PHẦN 1 — TRI THỨC ĐÃ ÁP DỤNG

StorageModule không triển khai thuật toán AI/ML — vai trò của nó là **hạ tầng lưu trữ có cấu trúc**, nên tri thức cốt lõi áp dụng nằm ở tầng cơ sở dữ liệu và vận hành hạ tầng, cụ thể:

- **Approximate Nearest Neighbor (ANN) qua HNSW ngay trong RDBMS**: Thay vì dùng vector database chuyên dụng (ban đầu là Milvus), dự án chuyển sang `pgvector` — một extension PostgreSQL cho phép lưu vector và tạo chỉ mục HNSW (Hierarchical Navigable Small World) ngay trong cùng 1 hệ quản trị dữ liệu quan hệ. Việc này loại bỏ hoàn toàn vấn đề đồng bộ 2 hệ thống dữ liệu tách biệt (metadata quan hệ ở Postgres, vector ở Milvus) — vector và metadata giờ nằm chung 1 transaction, 1 câu SQL có thể vừa lọc theo điều kiện quan hệ (`privacy_level`, `user_id`) vừa tìm hàng xóm gần nhất theo khoảng cách cosine.
- **Đánh đổi tham số HNSW (m, ef_construction, ef_search)**: `m=16` (số cạnh tối đa mỗi node) và `ef_construction=200` (độ chính xác khi build index) là các tham số đánh đổi kinh điển giữa tốc độ build/dung lượng RAM và độ chính xác truy vấn — giá trị này được cấu hình cố định trong `data_schema.yaml`, không phải chọn tùy tiện.
- **Idempotent Infrastructure-as-Code**: Toàn bộ script khởi tạo (migration, tạo bucket, tạo index) đều viết theo nguyên tắc idempotent (`CREATE ... IF NOT EXISTS`) — cho phép chạy lại nhiều lần an toàn mà không gây lỗi hay trùng lặp, một nguyên tắc quan trọng khi hạ tầng cần tái tạo (rebuild) thường xuyên trong quá trình phát triển.
- **Append-only Schema Evolution (Clause B — khóa, chỉ được append)**: Sau khi container StorageModule "đóng" (T006-01 CLOSED), mọi thay đổi schema tiếp theo **chỉ được thêm mới** (cột mới, bảng mới, migration mới), tuyệt đối không sửa/xóa migration cũ đã áp dụng — nguyên tắc này phản ánh thực tế vận hành cơ sở dữ liệu production: một khi migration đã chạy trên dữ liệu thật, việc sửa nó ngược dòng thời gian là rủi ro cao, an toàn hơn nhiều khi chỉ tiến về phía trước (forward-only).
- **Compensating trade-off nhận diện qua audit thực nghiệm (MinIO lifecycle "archive")**: Trong lúc audit, phát hiện rule lifecycle `archive` cho bucket `raw-images` không thể áp dụng được trên MinIO standalone/open-source (chỉ hỗ trợ `expire`, không hỗ trợ chuyển storage class) — một giới hạn thật của hạ tầng, không phải lỗi code, đã được ghi chú lại vào `data_schema.yaml` để tránh hiểu lầm là bug chưa fix trong các đợt audit sau.

---

## PHẦN 2 — HẠ TẦNG (Database, Bucket, Endpoint giao tiếp liên-module)

### 2.1 Vị trí StorageModule trong kiến trúc tổng thể

StorageModule (Clause B) là module **hạ tầng lưu trữ dữ liệu duy nhất** của hệ thống — không tự chạy HTTP service nghiệp vụ (không có API Gateway riêng), mà cung cấp:
1. **Setup/init scripts** (chạy 1 lần hoặc khi cần migrate) — tạo schema PostgreSQL, HNSW index, MinIO bucket.
2. **2 endpoint REST runtime duy nhất** — thực thi trên chính server của BackendModule (không phải server riêng của StorageModule), vì đây là tài nguyên đặc thù pgvector cần logic cẩn trọng (transaction, validate dimension) mà BackendModule ủy quyền lại cho đúng "chủ sở hữu nghiệp vụ".

```
BackendModule (D)
   │
   ├── SQLAlchemy trực tiếp ──▶ PostgreSQL (users, friends, albums, images
   │                             [trừ cột embedding], evaluation_runs,
   │                             evaluation_metrics — schema do B thiết kế,
   │                             D vận hành runtime theo backend_owned_resources)
   │
   └── REST nội bộ ──▶ POST /vector/index          (B sở hữu — ghi cột embedding)
                    └─▶ POST /vector/search/hybrid  (B sở hữu — ANN search + filter)
```

Điểm quan trọng: "Clause B — sở hữu" không có nghĩa StorageModule chạy 1 process/container HTTP riêng biệt. Xác nhận qua chính `infra_compose_storage.yml`: StorageModule chỉ định nghĩa hạ tầng thô (`postgres`, `minio`, `redis`) — 2 endpoint `/vector/index`/`/vector/search/hybrid` được code và chạy trên server BackendModule, StorageModule chỉ là **chủ sở hữu thiết kế nghiệp vụ/dữ liệu** (schema, index, ràng buộc), không phải ranh giới network/process.

### 2.2 Cấu trúc database (`database_spec.postgresql`, Clause B)

| Bảng | Vai trò | Cột đáng chú ý |
|---|---|---|
| `users` | Tài khoản người dùng | `role VARCHAR(20) DEFAULT 'user' CHECK IN ('user','admin')` — cột APPEND v1.2.0 |
| `friends` | Quan hệ bạn bè (phục vụ `privacy_level=1`) | PK composite `(user_id, friend_id)`, `CHECK (user_id <> friend_id)`, quan hệ **bất đối xứng có chủ đích** (1 dòng A→B không tự suy ra B→A) |
| `albums` | Album ảnh | `deleted_at TIMESTAMP WITH TIME ZONE NULL` — cột APPEND v1.2.0, phục vụ soft-delete |
| `images` | Metadata + vector của từng ảnh | `embedding vector(512)` — cột pgvector, **duy nhất trong toàn bộ database phải ghi/đọc qua REST**, không qua SQLAlchemy trực tiếp; `privacy_level SMALLINT CHECK IN (0,1,2)`; `index_status VARCHAR(20) CHECK IN ('pending','ready','failed')` |
| `evaluation_runs` | Lịch sử chạy benchmark | `eval_id UUID PK`, `status CHECK IN ('pending','running','completed','failed')` |
| `evaluation_metrics` | Kết quả MRR/HitRate/Precision/Recall | PK = FK tới `evaluation_runs.eval_id ON DELETE CASCADE`, không có `default` cho các cột metric (chỉ ghi sau khi tính xong) |

**Extension bắt buộc**: `uuid-ossp` (sinh UUID), `pgcrypto` (hash password), `vector` (pgvector — thay thế hoàn toàn Milvus/etcd từ v1.1.0).

**Index HNSW trên `images.embedding`**: `idx_images_embedding_hnsw`, tham số `m=16, ef_construction=200`, `operator_class=vector_cosine_ops` — đã tự tay verify bằng `\d images` nhiều lần trong quá trình audit, khớp 100% với khai báo trong `data_schema.yaml`.

### 2.3 Cấu trúc MinIO (Object Storage)

| Bucket | Chính sách | Lifecycle |
|---|---|---|
| `raw-images` | Private | `archive`, 3650 ngày — **không có hiệu lực thật trên MinIO standalone** (giới hạn hạ tầng, đã ghi chú vào contract, xem Phần 1) |
| `thumbnails` | Private | `expire`, 365 ngày — đã verify runtime thật bằng `mc ilm rule ls`, xác nhận rule tồn tại và đúng tham số |

Presigned URL (dùng cho upload S1, do BackendModule tạo bằng MinIO SDK) có hiệu lực 3600 giây — đồng bộ với `global_configs.presigned_url_expiry_sec`.

### 2.4 Workflow setup (`storage_main.py`, CLI subcommand)

| Subcommand | Việc làm | Idempotent |
|---|---|---|
| `schema` | Chạy Alembic migration tới `head` (tạo/cập nhật toàn bộ bảng + extension) | ✅ (`IF NOT EXISTS` trong từng migration) |
| `pgvector-index` | Verify/tạo HNSW index nếu chưa tồn tại; nếu đã tồn tại, validate tham số `m`/`ef_construction` khớp contract | ✅ |
| `bucket` | Tạo 2 bucket + áp lifecycle rule | ✅ |
| `seed` | Sinh dữ liệu test (users/albums/images) — **không chạy trong production**, không nằm trong subcommand `init` | ✅ (nhưng có chủ đích không set `embedding` thật, chỉ để test CRUD) |
| `init` | Chạy tuần tự `schema` → `pgvector-index` → `bucket` (không gồm `seed`) | ✅ |

Toàn bộ workflow đọc cấu hình qua biến môi trường (không hardcode), lấy từ `configs/storage.env.local` khi chạy dev — đã tự tay verify runtime: `PGVECTOR_VECTOR_DIM=512` khớp `global_configs.vector_dim`, `SCHEMA_EXTENSIONS=uuid-ossp,pgcrypto,vector` khớp `database_spec.postgresql.extensions`.

### 2.5 Hạ tầng Docker & Network

- **Image**: `pgvector/pgvector:pg16` (Postgres 16 + pgvector ≥ 0.7.0 bundled), `minio/minio`, `redis:7.4-alpine` — không có image riêng nào do StorageModule tự build cho 3 service hạ tầng này (dùng image chính thức có sẵn).
- **Image tự build**: `sise-storage` — chứa `storage_main.py` + toàn bộ `app/` (entities/adapters/services/routers cho 4 workflow: `schema`, `pgvector-index`, `bucket`, `seed`) + migration Alembic. Chạy dưới dạng job một lần (`docker run --rm`), không phải service sống lâu dài như `postgres`/`minio`/`redis`.
- **Network `sise_network`**: Sau khi tích hợp 3 module (Storage/AI/Backend) chạy chung, đã tự tay thiết kế lại kiến trúc network để **không module nào là "chủ sở hữu network" ẩn định** — network do compose gốc cấp dự án tạo (`driver: bridge`, `subnet 172.25.0.0/16`), mọi compose cấp module (bao gồm chính StorageModule) chỉ `external: true` join vào. Đã verify thực nghiệm: `docker compose down` StorageModule không kéo sập network dùng chung của AIModule/BackendModule.

### 2.6 Giao tiếp với các module khác — chỉ những gì StorageModule thực sự expose

| Điểm chạm | Ai gọi | Nội dung |
|---|---|---|
| `POST /vector/index` | BackendModule (Celery worker, bước S4 trong upload pipeline) | Ghi vector 512 chiều vào `images.embedding` sau khi AIModule đã tính xong |
| `POST /vector/search/hybrid` | BackendModule (`/search/text`, `/search/image`) | ANN search kết hợp metadata filter (privacy, tags...) trong 1 câu SQL |
| SQLAlchemy trực tiếp (đa số bảng) | BackendModule | Theo đúng `backend_owned_resources` — StorageModule thiết kế schema, BackendModule vận hành runtime |
| Không có điểm chạm trực tiếp nào | FrontendModule, AIModule | Cả 2 module này **không bao giờ** gọi thẳng StorageModule — mọi giao tiếp đều qua BackendModule làm trung gian |

---

## Ghi chú về nguồn dữ liệu và giới hạn phạm vi

Nội dung trên đối chiếu trực tiếp `data_schema.yaml` (phần `database_spec.postgresql`, Clause B) và `Workflow_Centric_Architecture.md` §2.2, đồng thời dựa trên chính các phiên audit + fix + verify runtime thật đã thực hiện với StorageModule (build image, chạy migration, verify bằng `psql`/`mc` trực tiếp — không dựa vào báo cáo tự khai của worker agent). Phần "giao tiếp với module khác" chỉ liệt kê những gì `data_schema.yaml` xác nhận là điểm chạm của StorageModule — không đi sâu vào chi tiết nội bộ luồng nghiệp vụ của BackendModule/AIModule/FrontendModule, vì đó nằm ngoài phạm vi audit trực tiếp và không có bằng chứng runtime tương ứng để đảm bảo độ chính xác.