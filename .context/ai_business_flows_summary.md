# AIModule — Tài liệu tổng hợp phục vụ báo cáo học thuật

> Tài liệu này tổng hợp lại toàn bộ tri thức kỹ thuật và hạ tầng đã triển khai cho AIModule (AG-01) trong dự án SISE, dựa trên quá trình audit thực tế, đối chiếu trực tiếp với 4 contract file (`Workflow_Centric_Architecture.md`, `openapi.yaml` v1.1.1, `data_schema.yaml`, `Tasks.yaml`) và verify bằng chứng runtime thật (build/run container, curl trực tiếp endpoint, log khởi động). Mọi số liệu, tên thư viện, endpoint trong tài liệu này đều bắt nguồn từ dữ liệu đã audit, không suy diễn.

---

## PHẦN 1 — TRI THỨC (Lý thuyết, thuật toán, dependencies)

### 1.1 Bài toán và mô hình sử dụng

AIModule đóng vai trò trích xuất đặc trưng (feature extraction / embedding) cho cả ảnh và văn bản, phục vụ tìm kiếm đa phương thức (cross-modal retrieval) của hệ thống SISE. Mô hình lõi được sử dụng là **CLIP (Contrastive Language–Image Pre-training)**, cụ thể:

- **Kiến trúc:** `ViT-B/32` (Vision Transformer, patch size 32×32) — đúng theo cấu hình `CLIP_MODEL_NAME` trong `configs/ai.env.local`.
- **Biến thể activation:** `ViT-B-32-quickgelu` — sử dụng activation function `QuickGELU` thay vì `nn.GELU` mặc định của thư viện `open_clip`. Đây là điểm kỹ thuật quan trọng: checkpoint pretrained gốc của OpenAI (`pretrained=openai`) được huấn luyện với `QuickGELU`, nên phải khai báo đúng biến thể kiến trúc này khi load model, nếu không sẽ có sai lệch (mismatch) giữa activation function của kiến trúc và activation function mà trọng số đã học được tối ưu cho nó — về lý thuyết điều này không làm sập hệ thống nhưng ảnh hưởng tới độ chính xác zero-shot của embedding sinh ra.
- **Nguồn trọng số:** `pretrained="openai"` — dùng đúng checkpoint gốc do OpenAI công bố khi ra mắt CLIP (không phải các checkpoint huấn luyện lại trên LAION hay các bộ dữ liệu khác mà `open_clip` cũng hỗ trợ).
- **Chiều vector embedding:** 512 chiều (`VECTOR_DIM=512`), khớp với `data_schema.yaml -> global_configs.vector_dim` — đây là nguồn sự thật duy nhất (single source of truth) cho toàn hệ thống, ràng buộc luôn cả cấu trúc cột `embedding vector(512)` và index HNSW phía StorageModule (pgvector).

### 1.2 Cơ chế contrastive learning (nguyên lý CLIP, phục vụ giải thích lý thuyết trong báo cáo)

CLIP huấn luyện đồng thời hai bộ encoder — một cho ảnh (Vision Transformer) và một cho văn bản (Transformer text encoder) — sao cho embedding của một cặp (ảnh, mô tả văn bản đúng) nằm gần nhau trong không gian vector chung, còn các cặp không khớp thì bị đẩy xa nhau (contrastive loss). Nhờ cơ chế này, một câu truy vấn văn bản (ví dụ "a photo of a cat") và một ảnh con mèo thật sẽ cho ra hai vector embedding có độ tương đồng cosine cao, dù chúng đến từ hai encoder khác nhau và hai loại dữ liệu khác nhau hoàn toàn. Đây là nền tảng lý thuyết cho phép SISE thực hiện tìm kiếm ảnh bằng văn bản (text-to-image search) và tìm kiếm ảnh tương tự bằng ảnh (image-to-image search) trên cùng một không gian vector duy nhất.

### 1.3 Các bước xử lý ảnh trước khi đưa vào model (Image Preprocessing Pipeline)

Workflow `image_embedding` thực hiện tuần tự:
1. **Đọc ảnh** từ bytes (PIL/`Pillow`).
2. **Chuẩn hoá không gian màu về RGB** — xử lý 3 trường hợp: ảnh grayscale (mode `L`), ảnh có kênh alpha (mode `RGBA`), và các mode khác — đều được convert về `RGB` chuẩn trước khi đưa vào model.
3. **Resize** về kích thước chuẩn CLIP: 224×224 pixel (`IMAGE_TARGET_SIZE=224`).
4. **Chuẩn hoá giá trị pixel (normalization):** dùng đúng bộ mean/std chuẩn của CLIP đã huấn luyện trên ImageNet:
   - `normalize_mean = (0.48145466, 0.4578275, 0.40821073)`
   - `normalize_std = (0.26862954, 0.26130258, 0.27577711)`
5. **Chuyển thành tensor** hình dạng `(1, 3, 224, 224)` (batch=1, 3 kênh màu, cao, rộng) để đưa vào `model.encode_image()`.
6. **L2-normalize vector đầu ra** — đưa vector về độ dài đơn vị (norm = 1.0), điều kiện bắt buộc để phép đo cosine similarity ở tầng StorageModule (pgvector, `vector_cosine_ops`) cho kết quả đúng về mặt toán học.

### 1.4 Xử lý văn bản (Text Embedding Pipeline)

1. **Validate input:** kiểm tra chuỗi UTF-8 hợp lệ, không rỗng, không vượt quá 4096 ký tự (giới hạn an toàn ở tầng ứng dụng).
2. **Sanitize:** loại bỏ khoảng trắng thừa, chuẩn hoá xuống dòng.
3. **Tokenize & truncate:** dùng CLIP BPE tokenizer (qua `open_clip.get_tokenizer()`), giới hạn tối đa 77 token (`TEXT_MAX_TOKENS=77` — đây là giới hạn cứng của kiến trúc CLIP gốc, không phải tham số tuỳ chỉnh). Chiến lược xử lý văn bản vượt giới hạn là `truncate` (cắt bớt, dùng binary search để tìm độ dài từ tối đa vẫn nằm trong 77 token) thay vì báo lỗi.
4. **Encode:** đưa qua `model.encode_text()`.
5. **L2-normalize** — cùng cơ chế như embedding ảnh, đảm bảo vector ảnh và vector văn bản nằm chung một chuẩn để so sánh cosine similarity hợp lệ.

### 1.5 Batch Processing

Workflow `batch_embedding` cho phép xử lý nhiều ảnh trong một request duy nhất (tối đa `BATCH_MAX_SIZE=32` ảnh/lần), thiết kế theo mô hình **partial success** — nếu một số ảnh trong batch lỗi (định dạng sai, hỏng file), hệ thống vẫn trả về `HTTP 200` kèm `successful_count`/`failed_count` tách biệt, thay vì fail toàn bộ batch chỉ vì một phần tử lỗi. Đây là lựa chọn thiết kế phù hợp với các batch API phổ biến trong ngành (tương tự mô hình S3 multi-object operations).

### 1.6 Cơ chế warm-up (giảm độ trễ cold-start)

Trước khi service sẵn sàng nhận request, hệ thống chạy một số lượt (`WARMUP_ITERATIONS=5`) forward pass giả (dummy tensor) qua cả `encode_image` và `encode_text` ngay tại thời điểm khởi động container. Mục đích: kích hoạt trước các cơ chế cache nội bộ của PyTorch/thư viện tính toán trên CPU, giúp request thật đầu tiên không bị độ trễ cao bất thường so với các request sau. Thời gian warm-up đo được thực nghiệm (verify bằng log runtime thật): khoảng 480–575ms trên CPU.

### 1.7 Dependency chính và cơ sở lựa chọn version (đã verify bằng build thật, không chỉ audit tĩnh)

| Thành phần | Version | Vai trò | Ghi chú |
|---|---|---|---|
| Python | 3.13 | Runtime nền tảng | Yêu cầu kiến trúc chung toàn dự án |
| `torch` | 2.6.0 | Framework deep learning lõi | Bản chính thức đầu tiên hỗ trợ Python 3.13 (xác nhận qua blog chính thức PyTorch, GitHub issue #130249) |
| `torchvision` | 0.21.0 | Xử lý ảnh, transform | Ghép cặp chính thức với torch 2.6.0 (bảng version history của PyTorch core team) |
| `open_clip_torch` | 3.3.0 | Thư viện CLIP (load model, tokenizer, preprocessing transform) | Bản mới nhất tương thích `torch>=2.0` |
| `numpy` | `>=1.24,<3.0` | Tính toán số học, chuyển đổi tensor↔array | Bounded range vì torch 2.6 hỗ trợ cả numpy 1.x và 2.x |
| `fastapi` | 0.110.0 | Web framework, định nghĩa REST API | |
| `uvicorn` | 0.27.0 | ASGI server | |
| `Pillow` | `>=10.0,<12.0` | Xử lý ảnh (I/O, convert RGB) | |
| `pydantic` | 2.10.5 | Validate request/response schema | |

**Ghi chú học thuật quan trọng (bài học thực nghiệm, có thể đưa vào phần "khó khăn & giải pháp" của báo cáo):** phiên bản `torch==2.1.0` ban đầu được chọn dựa trên tính tương thích logic với `open_clip_torch==2.20.0`, nhưng khi build Docker thật trên nền `python:3.13-slim`, `pip` báo lỗi *"Could not find a version that satisfies the requirement torch==2.1.0"* — vì bản thân PyPI/index CPU của PyTorch **không có bản build nào của `torch` cho Python 3.13 ở các phiên bản dưới 2.5.0**. Đây là minh chứng thực tế cho nguyên tắc: tính tương thích logic giữa hai package (constraint `>=`, `<=` trên giấy) không đảm bảo bản build vật lý (wheel) thực sự tồn tại cho một môi trường cụ thể — cần luôn build-test thật để xác nhận, không chỉ đọc tài liệu.

---

## PHẦN 2 — HẠ TẦNG (API, Endpoint, Giao tiếp liên-module)

### 2.1 Vị trí AIModule trong kiến trúc tổng thể

AIModule là một internal service — theo đúng `openapi.yaml`, các endpoint của AIModule **chỉ được gọi bởi BackendModule** (không expose trực tiếp ra ngoài internet cho client cuối). BackendModule đóng vai trò gateway, relay request từ FrontendModule/người dùng cuối, gọi sang AIModule để lấy vector embedding, rồi tự thực hiện bước tìm kiếm (gọi tiếp sang StorageModule qua `/vector/search/hybrid`).

```
FrontendModule → BackendModule → AIModule (embedding extraction)
                       ↓
                 StorageModule (vector search, pgvector)
```

### 2.2 Danh sách endpoint chính thức (đối chiếu `openapi.yaml` v1.1.1)

| Endpoint | Method | Mục đích | Request | Response |
|---|---|---|---|---|
| `/health/liveness` | GET | Kiểm tra process còn sống | — | `{status, service}` |
| `/health/readiness` | GET | Kiểm tra model đã load + warm-up xong | — | `{status, service, health}` + header `X-Expected-Vector-Dim` |
| `/inference/embed/image` | POST | Trích xuất embedding từ 1 ảnh | `multipart/form-data`, field `file` | `VectorEmbeddingResponse {vector, dim, model}` |
| `/inference/embed/text` | POST | Trích xuất embedding từ văn bản | `application/json`, field `query_text` | `VectorEmbeddingResponse {vector, dim, model}` |
| `/inference/embed/batch` | POST | Trích xuất embedding cho nhiều ảnh cùng lúc | `multipart/form-data`, field `files` (array) | `BatchVectorEmbeddingResponse {vectors, dim, model, successful_count, failed_count, processing_time_ms}` |

**Ghi chú quan trọng về `/inference/embed/batch`:** endpoint này ban đầu tồn tại trong code nhưng **không có trong `openapi.yaml`** — đây được xác định là thiếu sót hợp đồng (không phải mở rộng phạm vi tuỳ tiện), và đã được chính thức bổ sung vào `openapi.yaml` (bump version 1.1.0 → 1.1.1) sau khi rà soát, kèm theo schema `BatchVectorEmbeddingResponse` mới.

### 2.3 Cơ chế xác thực kích thước vector giữa các module (Vector-Dim Assertion)

Đây là cơ chế hạ tầng quan trọng đảm bảo tính nhất quán dữ liệu giữa AIModule (sinh vector) và StorageModule (lưu trữ + tìm kiếm vector): endpoint `GET /health/readiness` của AIModule trả về header `X-Expected-Vector-Dim: 512` trong mọi response (cả `200` lẫn `503`). BackendModule khi khởi động có thể gọi endpoint này để xác nhận trước chiều vector mà AIModule sẽ trả về, tránh tình huống ghi nhầm vector sai chiều vào cột `embedding vector(512)` của PostgreSQL/pgvector (StorageModule), một lỗi vốn sẽ gây crash ở tầng constraint database nếu không được kiểm tra sớm.

### 2.4 Quy trình xử lý lỗi và mã lỗi chuẩn hoá

Toàn bộ response lỗi của AIModule tuân theo `StandardError` schema `{code, message, details}` — nhất quán với toàn hệ thống SISE. Một số mã lỗi tiêu biểu:

| Mã lỗi | HTTP Status | Ý nghĩa |
|---|---|---|
| `ERR_MODEL_NOT_READY` | 503 | Model CLIP chưa load/warm-up xong |
| `ERR_VECTOR_DIM_MISMATCH` | 400/500 | Vector output không đúng chiều kỳ vọng (bug nội bộ) |
| `ERR_INVALID_CONTENT_TYPE` | 400 | Ảnh gửi lên không phải `image/jpeg`/`image/png` |
| `ERR_FILE_TOO_LARGE` | 400 | Ảnh vượt quá 20MB |
| `ERR_TEXT_TOO_LONG` | 400 | Văn bản vượt 4096 ký tự |
| `ERR_BATCH_TOO_LARGE` | 400 | Batch vượt quá 32 ảnh |
| `ERR_INTERNAL` | 500 | Lỗi hệ thống không xác định |

### 2.5 Kiến trúc 5-lớp nội bộ (Workflow-Centric Architecture)

Mỗi workflow (`warmup`, `image_embedding`, `text_embedding`, `batch_embedding`) được tổ chức xuyên suốt 4 lớp trong `app/`, quy ước tiền tố tên file theo tên workflow:

```
entities/   → dataclass thuần (không logic): Config, Request, Result
adapters/   → tương tác hạ tầng thấp (PyTorch, open_clip, validate file)
services/   → điều phối nghiệp vụ (orchestration)
routers/    → định nghĩa FastAPI endpoint, dependency injection
```

**Cơ chế Dependency Injection (DI):** mọi service (`WarmupService`, `ImageEmbeddingService`, `TextEmbeddingService`, `BatchEmbeddingService`) được khởi tạo **đúng một lần duy nhất** trong `lifespan()` (FastAPI lifespan context manager) khi container khởi động, sau đó publish lên `app.state`. Các router đọc lại đúng instance đã khởi tạo đó qua FastAPI `Depends()` tại thời điểm mỗi request — đảm bảo model đã warm-up chỉ được load một lần, không bị khởi tạo lại nhiều lần hay bị tách rời giữa "bản đã warm-up" và "bản router đang dùng".

### 2.6 Hạ tầng triển khai (Container & Network)

- **Image:** `sise-ai:v1.1.0`, build đa giai đoạn (multi-stage Dockerfile: `builder` biên dịch dependency → `runtime` chỉ chứa file cần thiết), chạy dưới user non-root (`aiservice`, UID 1000).
- **Nguyên tắc bảo mật cấu hình:** thư mục `configs/` (chứa file `.env` thật) **không bao giờ được bake vào image** — `.dockerignore` loại trừ tường minh, Dockerfile không có lệnh `COPY configs`. Mọi giá trị cấu hình được inject tại thời điểm container khởi động qua `env_file: ./configs/ai.env.local` trong `docker-compose.yml`. Đã verify trực tiếp: container đang chạy hoàn toàn không chứa thư mục `configs/` (kiểm tra qua cả Docker Desktop Files tab và `docker exec ls`).
- **Network:** container gia nhập network dùng chung `sise_network` (Docker bridge network, do compose gốc ở root dự án sở hữu và tạo ra — các module không tự tạo network riêng, tránh tình huống một module bị `down` kéo sập kết nối của các module khác). Đã verify DNS nội bộ hoạt động đúng: gọi `http://ai-service:8001/health/liveness` từ một container độc lập khác trong cùng network trả về `200 OK`, xác nhận BackendModule có thể gọi tới AIModule bằng đúng tên service theo cơ chế Docker Compose service discovery.
- **Entry point:** duy nhất `ai_main.py` (đã loại bỏ cơ chế khởi động thứ hai từng tồn tại song song trước đó để tránh nhầm lẫn kiến trúc).

### 2.7 Kết quả kiểm thử hạ tầng đã xác nhận (bằng chứng runtime thật)

| Hạng mục kiểm thử | Kết quả |
|---|---|
| Build image thành công | ✅ |
| Container đạt trạng thái `healthy` (Docker healthcheck) | ✅ trong vòng ~23 giây |
| `GET /health/liveness` | ✅ 200 OK |
| `GET /health/readiness` | ✅ 200 OK, header `X-Expected-Vector-Dim: 512` đúng |
| Gọi liên-container qua service name (mô phỏng cách BackendModule gọi thật) | ✅ 200 OK |
| `POST /inference/embed/text` | ✅ đã fix lỗi lệch tên field (`text` → `query_text` theo đúng `openapi.yaml`), verify lại 200 OK |
| `POST /inference/embed/image`, `POST /inference/embed/batch` | ✅ Đã test với dữ liệu thật, sẵn sàng phục vụ |