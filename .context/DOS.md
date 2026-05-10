# DESCRIPTION OF SYSTEM (DOS)
# SMART IMAGE SEARCH ENGINE — SISE

> **Vai trò:** Kim chỉ nam duy nhất (Single Source of Truth) cho toàn bộ solution.
> Tất cả agents PHẢI tuân thủ tài liệu này. Không agent nào được phép thay đổi file này.
> Writer: Con người (Project Owner) + AG-00. Reader: Tất cả agents.

---

## 1. TÓM TẮT HỆ THỐNG

**SISE** là một nền tảng quản lý và truy vấn hình ảnh thông minh đa phương thức (**Multimodal Retrieval**), cho phép người dùng lưu trữ ảnh theo Album cá nhân và tìm kiếm linh hoạt qua hai hình thức:
- **Image-to-Image:** Tìm ảnh tương tự bằng cách upload một ảnh mẫu.
- **Text-to-Image:** Tìm ảnh phù hợp bằng cách nhập mô tả văn bản.

### Cốt lõi công nghệ

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| AI Engine | CLIP (OpenAI) + Contrastive Learning | Trích xuất Vector Embedding, đồng bộ không gian biểu diễn ngôn ngữ và hình ảnh |
| Vector DB | Milvus + HNSW (ANN) | Lưu trữ và truy vấn vector tốc độ cao, độ trễ thấp ở quy mô lớn |
| Object Storage | MinIO (S3-compatible) | Lưu trữ file ảnh vật lý, tách biệt khỏi database |
| Relational DB | PostgreSQL | Lưu metadata người dùng, album, ảnh, quyền truy cập |
| Backend | FastAPI (Python, Async) | Điều phối toàn bộ luồng dữ liệu |
| Cache | Redis | Cache kết quả tìm kiếm phổ biến |
| Kiến trúc | Decoupled Architecture | Triển khai toàn phần qua Docker |

### Mục tiêu hệ thống

Xây dựng một giải pháp tìm kiếm ảnh vượt trội về:
- **Độ chính xác:** Đo lường qua MRR, HitRate, Precision, Recall.
- **Trải nghiệm người dùng:** Đồng bộ trên cả Web (React) và Mobile App (React Native).
- **Bảo mật:** Privacy-Aware Search — lọc kết quả theo cấp độ bảo mật ngay trong quá trình truy vấn vector.

---

## 2. CÁC THÀNH PHẦN CHÍNH CỦA HỆ THỐNG

### 2.1 Mảng AI & Xử lý dữ liệu (The Brain)

Đây là thành phần quan trọng nhất, quyết định độ chính xác của toàn hệ thống. Nhiệm vụ cốt lõi: biến dữ liệu phi cấu trúc (hình ảnh / văn bản) thành dữ liệu số (vector).

#### A. Mô hình Embedding

**Lựa chọn chính — CLIP (OpenAI):**
- Tiêu chuẩn vàng cho bài toán multimodal search.
- Được huấn luyện trên hàng triệu cặp (ảnh, văn bản).
- Đưa vector của chữ "Con mèo" và vector của "Hình ảnh con mèo" về gần nhau trong cùng một không gian biểu diễn.
- Hai phiên bản được hỗ trợ:
  - `ViT-B/32`: vector 512 chiều — nhẹ hơn, phù hợp với môi trường không có GPU mạnh.
  - `ViT-L/14`: vector 768 chiều — chính xác hơn, yêu cầu GPU tốt hơn.

> ⚠️ **Ràng buộc cứng:** Phiên bản CLIP được chọn phải nhất quán xuyên suốt toàn solution. `vector_dim` phải khớp giữa `data_schema.yaml`, Milvus collection, và AI Service. Không được thay đổi giữa chừng mà không xóa và tái tạo toàn bộ Milvus collection.

**Lựa chọn phụ (chuyên biệt):** ResNet-100 hoặc Vision Transformer (ViT) thuần túy nếu cần nhận diện đặc điểm hình dạng sâu. Không phải ưu tiên của dự án này.

#### B. Feature Extraction Pipeline

Quy trình tự động xử lý dữ liệu đầu vào trước khi đưa vào mô hình:

1. **Image Pre-processing:** Resize ảnh về kích thước chuẩn (224×224), chuẩn hóa màu sắc (Normalization), chuyển về RGB nếu cần.
2. **Text Tokenization:** Chuyển câu lệnh tìm kiếm thành token mà CLIP có thể hiểu.
3. **Batch Processing:** Xử lý theo batch khi nạp dữ liệu lớn (hàng chục nghìn ảnh) để tận dụng GPU/CPU mà không tràn RAM.

#### C. AI Inference Service

Lớp phần mềm (FastAPI, cổng riêng) điều khiển mô hình:
- **Model Warm-up:** Tải mô hình vào bộ nhớ và giữ trạng thái sẵn sàng (tránh cold-start).
- **Endpoints:**
  - `POST /embed/image` — nhận ảnh, trả về vector `float32[]` đúng chiều.
  - `POST /embed/text` — nhận chuỗi văn bản, trả về vector `float32[]` đúng chiều.
- **Tính toán linh hoạt:** Tự động chuyển đổi giữa CPU và GPU tùy môi trường.

---

### 2.2 Mảng Hạ tầng Vector Database (The Storage)

Nếu The Brain tạo ra vector, The Storage là "trí nhớ dài hạn" lưu trữ và so sánh hàng triệu vector đó trong tích tắc.

#### A. Vector Database

**Lựa chọn chính — Milvus (Standalone):**
- Hỗ trợ Docker tốt, phù hợp cho môi trường phát triển và production.
- Có sẵn tính năng **Metadata Filtering** — bắt buộc cho Privacy-Aware Search.
- Collection: `sise_v1`, các field bắt buộc: `image_id`, `vector`, `user_id`, `privacy_level`.

**Lựa chọn thay thế:** Qdrant (API đơn giản hơn, Docker nhẹ hơn) — có thể cân nhắc ở giai đoạn sau.

#### B. Chiến lược Indexing

| Thuật toán | Ưu điểm | Nhược điểm | Lựa chọn của SISE |
|---|---|---|---|
| **HNSW** | Độ chính xác cực cao, tốc độ nhanh | Tốn RAM | ✅ Mặc định |
| IVF | Tiết kiệm RAM | Chậm hơn một chút | Nghiên cứu so sánh |

**Distance Metric:** Cosine Similarity — chuẩn cho CLIP vector.

**Index Parameters (HNSW):**
- `M`: 16 (số cạnh tối đa mỗi node)
- `efConstruction`: 200 (độ chính xác khi build index)
- `ef` (search): 64

#### C. Privacy Layer — Metadata Filtering

Vector DB không chỉ lưu vector mà còn lưu kèm metadata để filter quyền truy cập ngay trong quá trình truy vấn:

```
Tìm 10 vector gần nhất
VỚI ĐIỀU KIỆN: (privacy_level == 2) HOẶC (user_id == current_user_id)
```

**Privacy levels:**
- `0` — Private: chỉ chủ sở hữu xem được.
- `1` — Friends: chủ sở hữu và bạn bè xem được.
- `2` — Public: tất cả mọi người xem được.

#### D. Object Storage (MinIO)

Tuyệt đối **không lưu ảnh dưới dạng Binary trong database**. Tách biệt hoàn toàn:
- **MinIO:** Lưu file ảnh vật lý. S3-compatible, chạy trong Docker container.
- **Buckets:** `raw-images` (ảnh gốc), `thumbnails` (ảnh thu nhỏ).
- **Object naming:** `{user_id}/{album_id}/{image_id}.jpg`

**Upload flow:**
```
Client → Backend → MinIO (lưu ảnh) → PostgreSQL (lưu metadata, status='pending')
                → AI Service (trích vector) → Milvus (lưu vector, status='ready')
```

#### E. Đánh giá hiệu năng (Benchmarking)

Các chỉ số BẮT BUỘC phải đo đạc và báo cáo:

| Chỉ số | Mô tả |
|---|---|
| **Latency (ms)** | Thời gian tìm kiếm trong 10k, 100k ảnh |
| **Precision@K** | Tỷ lệ kết quả liên quan trong K kết quả đầu tiên |
| **Recall** | Tỷ lệ ảnh liên quan tìm được / tổng số ảnh liên quan |
| **MRR** | Mean Reciprocal Rank — kết quả đúng nhất ở vị trí thứ mấy |
| **Hit Rate** | Trong K kết quả, có ít nhất 1 đúng không? |
| **Resource Usage** | RAM/CPU khi số lượng vector tăng |

---

### 2.3 Mảng Backend & API Service (The Backbone)

Backend đóng vai trò "Nhạc trưởng" — điều phối luồng dữ liệu giữa Frontend, AI Service, và các loại Database. Không trực tiếp tính toán vector hay lưu trữ file.

#### A. Công nghệ: FastAPI (Python 3.13)

- **Async first:** Xử lý bất đồng bộ, không bị nghẽn khi nhiều người dùng đồng thời.
- **Pydantic validation:** Đảm bảo dữ liệu đầu vào đúng định dạng theo `data_schema.yaml`.
- **Auto docs:** Tự sinh `/docs` (Swagger UI) để test endpoint.
- **Cổng:** 8000 (API Gateway chính).

> ⚠️ **Forbidden:** Flask bị cấm. Dùng FastAPI bắt buộc.

#### B. Các Module chức năng chính

**1. Auth Service (Module Xác thực)**
- JWT (JSON Web Token) — xác thực stateless.
- Endpoints: `POST /auth/register`, `POST /auth/login`.
- Logic: Giải mã token → lấy `user_id` → áp dụng privacy filter.

**2. Media Service (Module Xử lý Hình ảnh & Album)**
- Upload pipeline (async, 5 bước — xem `data_schema.yaml` → `transaction_semantics`):
  1. Tạo presigned PUT URL từ MinIO.
  2. Client PUT trực tiếp lên MinIO.
  3. Insert metadata vào PostgreSQL (`index_status='pending'`).
  4. Enqueue Celery task: fetch ảnh → CLIP → index vào Milvus.
  5. Update `index_status='ready'` sau khi index thành công.
- Tạo Thumbnail bằng Pillow để Frontend hiển thị nhanh.

**3. Search Service (Module Truy vấn)**
- **Image-to-Image:** Nhận ảnh query → AI Service → vector → Milvus (với privacy filter) → PostgreSQL (lấy metadata) → JSON response.
- **Text-to-Image:** Nhận text query → AI Service → vector → Milvus → PostgreSQL → JSON response.
- **Hybrid Search:** Kết hợp kết quả từ Milvus (similarity score) và PostgreSQL (album/user info).
- **Re-ranking (optional):** Sắp xếp lại dựa trên độ phổ biến hoặc thời gian upload.

**4. Evaluation Service (Module Đánh giá)**
- `POST /eval/run` — chạy benchmark tự động trên test set.
- So sánh kết quả với Ground Truth → báo cáo MRR, HitRate, Precision, Recall.

#### C. Search Workflow (Luồng xử lý tìm kiếm)

```
Request → JWT Validation
        → Embedding Call (AI Service, port 8001)
        → Vector Query + Privacy Filter (Milvus)
        → Metadata Enrichment (PostgreSQL)
        → JSON Response
```

#### D. Giao tiếp giữa các Service

- **Backend → AI Service:** HTTP (nội bộ Docker network), hoặc gRPC nếu cần tối ưu.
- **Backend → Milvus:** gRPC (cổng 19530).
- **Backend → PostgreSQL:** asyncpg.
- **Backend → MinIO:** boto3 / minio-py.
- **Backend → Redis:** aioredis.

> ⚠️ **Forbidden (AG-03):** `heavy_image_processing` — mọi xử lý nặng về ảnh (resize, embedding) PHẢI gọi qua AI Service. Backend chỉ điều phối, không xử lý trực tiếp.

---

### 2.4 Mảng Giao diện & Triển khai (The Interface & DevOps)

#### A. Web App (AG-04 — FrontendWeb)

**Tech:** React + Vite + Tailwind CSS + Nginx (build).

**Chức năng bắt buộc:**
- Dashboard layout — quản lý Album, xem ảnh.
- **Bulk Upload:** Kéo thả cả thư mục ảnh (Drag & Drop) để upload hàng loạt.
- **Search UI:** Upload ảnh query hoặc nhập text → hiển thị grid kết quả với similarity score.
- **Evaluation Dashboard:** Biểu đồ MRR, Precision@K, HitRate, Recall.
- Responsive — chạy tốt trên laptop và tablet.

> ⚠️ AG-04 chỉ giao tiếp với AG-03 (Backend). **Cấm gọi thẳng AI Service hay Storage.**

#### B. Mobile App (AG-05 — FrontendMobile)

**Tech:** React Native + Expo + EAS.

**Chức năng bắt buộc:**
- **Camera Integration:** Chụp ảnh thực tế → search ngay lập tức.
- **Image Picker:** Chọn ảnh từ thư viện điện thoại.
- **Offline Cache:** Lưu kết quả tìm kiếm gần nhất để xem lại khi offline.
- **Share Extension:** Nhận ảnh từ app khác (Facebook, Instagram) để search tương tự.

> ⚠️ AG-05 chỉ giao tiếp với AG-03 (Backend). **Cấm gọi thẳng AI Service hay Storage.**

#### C. DevOps & Deployment

**Docker Compose — toàn bộ services:**

| Container | Service | Ghi chú |
|---|---|---|
| `ai-service` | FastAPI + CLIP model | GPU support qua NVIDIA Container Toolkit |
| `backend` | FastAPI API Gateway | Cổng 8000 |
| `postgres` | PostgreSQL | Volume-mounted |
| `milvus-standalone` | Milvus | Phụ thuộc etcd |
| `etcd` | etcd | Phụ trợ cho Milvus |
| `minio` | MinIO | Volume-mounted |
| `redis` | Redis | Cache |
| `frontend-web` | Nginx + React build | Cổng 80/443 |
| `celery-worker` | Celery | Xử lý async indexing task |

**Reverse Proxy (Nginx/Traefik):**
- `api.yourdomain.com` → FastAPI Backend
- `app.yourdomain.com` → React Web
- `storage.yourdomain.com` → MinIO

**CI/CD (GitHub Actions):**
- Trigger khi push lên `main`: lint → unit test → build Docker image → deploy.
- AG-00 quản lý toàn bộ workflow file trong `.github/`.

**Mobile Distribution:**
- Expo Application Services (EAS) → file APK (Android) + bộ cài iOS.

#### D. Monitoring & Observability

- **Logging:** Structured JSON (Loguru hoặc ELK Stack).
- **Tracing:** OpenTelemetry.
- **Health Probes:**
  - `GET /health/liveness` — Backend còn sống không?
  - `GET /health/readiness` — tất cả dependencies sẵn sàng chưa? (PostgreSQL, Milvus, MinIO, AI Service).
- **Metrics cần theo dõi:** `embedding_latency_ms`, `index_latency_ms`, `search_qps`, `mrr_score`, `hit_rate`, `error_rate`.

---

## 3. KIẾN TRÚC TỔNG THỂ & LUỒNG DỮ LIỆU

### 3.1 Upload Flow

```
[Client]
   │── POST /media/upload/init ──→ [Backend AG-03]
   │                                    │── MinIO: presigned PUT URL
   │←── upload_url + object_key ────────┘
   │
   │── PUT {upload_url} (file binary) ──→ [MinIO AG-02]
   │
   │── POST /media/upload/confirm ──→ [Backend AG-03]
                                           │── PostgreSQL: INSERT images (status='pending')
                                           │── Celery Queue: enqueue embed task
                                           │
                                    [Celery Worker]
                                           │── MinIO: fetch image
                                           │── AI Service AG-01: POST /embed/image → vector[]
                                           │── Milvus AG-02: insert vector
                                           └── PostgreSQL: UPDATE status='ready'
```

### 3.2 Search Flow

```
[Client]
   │── POST /search/image (hoặc /search/text) ──→ [Backend AG-03]
                                                        │── JWT decode → user_id
                                                        │── AI Service AG-01: embed query
                                                        │── Milvus AG-02: vector search + privacy filter
                                                        │── PostgreSQL AG-02: enrich metadata
                                                        └── JSON response → [Client]
```

---

## 4. RÀNG BUỘC KỸ THUẬT TOÀN SOLUTION

Các quy định này có hiệu lực với TẤT CẢ agents:

| Ràng buộc | Giá trị |
|---|---|
| Python version | 3.13 (bắt buộc) |
| Allowed tech stack | Python, FastAPI, PyTorch, React, Tailwind, Milvus, PostgreSQL, MinIO, Docker, pytest |
| Forbidden libraries | `pandas`, `tensorflow`, `flask` |
| No secrets in repo | `true` — dùng env vars / Vault |
| Default timeout | 10,000 ms |
| Default retries | 2 lần, backoff 500ms |
| Idempotency TTL | 24 giờ |
| Max file size | 20 MB |
| Allowed image types | `image/jpeg`, `image/png` |

---

## 5. CẤU TRÚC SOLUTION (Multi-Project)

```
SISE/
├── .context/                        ← Solution-wide config (AG-00 quản lý)
│   ├── DOS.md                       ← File này
│   ├── data_schema.yaml
│   ├── openapi.yaml
│   ├── agent_boundaries.yaml
│   └── Tasks.yaml
│
├── .knowledge/                      ← Knowledge base cục bộ
│   ├── shared/
│   │   └── KnowledgeBase_template.md
│   │   └── Skill_template.md
│   │   └── Log_template.md
│   │   └── Architecture_4Tier_Analysis.md
│   ├── agent00/ … agent05/
│   │   ├── KnowledgeBase_[N].md
│   │   ├── Skill_[N].md
│   │   └── Log_[N].md
│
├── .context/Sessions/               ← Session retrospective (AG-00 append)
│
├── .github/
│   ├── agents/                      ← .agent.md files (AG-00 quản lý)
│   └── workflows/                   ← CI/CD (AG-00 quản lý)
│
├── modules/
│   ├── SecretaryAgent/              ← AG-00 workspace
│   ├── AIModule/                    ← AG-01: CLIP service (Python)
│   ├── StorageModule/               ← AG-02: DB schemas, Docker configs
│   ├── BackendModule/               ← AG-03: FastAPI
│   ├── frontendweb/                 ← AG-04: React
│   └── FrontendMobile/              ← AG-05: React Native
│
└── docker-compose.yml               ← AG-00 quản lý
```

---

## 6. ĐỊNH NGHĨA THUẬT NGỮ (Glossary)

| Thuật ngữ | Định nghĩa |
|---|---|
| **Vector Embedding** | Biểu diễn số học của ảnh/văn bản dưới dạng mảng float32 nhiều chiều |
| **ANN** | Approximate Nearest Neighbor — tìm kiếm gần đúng trong không gian vector |
| **HNSW** | Hierarchical Navigable Small World — thuật toán ANN đồ thị đa lớp |
| **Cosine Similarity** | Đo góc giữa 2 vector — chuẩn cho CLIP |
| **MRR** | Mean Reciprocal Rank — đánh giá kết quả đúng ở vị trí thứ mấy |
| **Hit Rate** | Trong K kết quả, có ít nhất 1 đúng không? |
| **Privacy-Aware Search** | Lọc kết quả theo quyền truy cập ngay trong quá trình truy vấn vector |
| **Presigned URL** | URL tạm thời cho phép upload/download trực tiếp lên MinIO mà không qua Backend |
| **Idempotency Key** | Header đảm bảo cùng một request không bị xử lý 2 lần |
| **index_status** | Trạng thái xử lý của ảnh: `pending` → `ready` / `failed` |
