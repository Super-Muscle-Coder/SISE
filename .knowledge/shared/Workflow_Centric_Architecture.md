---
**Document Type:** Architecture Reference
**Status:** Active (enforced via CI/CD)
**Owner:** AG-00 (OrchestratorAgent) + ProjectOwner
**Last Updated:** 2026-05-12
**Version:** 2.0.0
**Applies To:** All modules (AIModule, BackendModule, StorageModule, frontendweb, FrontendMobile)
---

# KIẾN TRÚC 5 LỚP VÀ QUY TẮC WORKFLOW-CENTRIC (SISE PROJECT)

Tài liệu này là nguồn tham chiếu chuẩn xác nhất (Single Source of Truth) về cách tổ chức mã nguồn, đặt tên tệp và phân tách trách nhiệm trong dự án SISE. Toàn bộ lập trình viên và Agents BẮT BUỘC tuân thủ.

---

## 1. KIẾN TRÚC 5 LỚP TRONG DỰ ÁN SISE

Kiến trúc mã nguồn của SISE được thiết kế theo "Workflow-Centric" kết hợp phân tách 5 lớp rõ ràng. Điều này giúp khoanh vùng trách nhiệm (Bounded Context) cực kỳ mạch lạc.

### 1.1 Trình bày về 5 Thành phần cốt lõi

Mọi project trong số 5 Modules chính đều phải tuân thủ 5 lớp sau:

1. **Configs (Cấu hình ngoại vi)**
   - **Ý nghĩa:** Chứa các biến môi trường, tham số triển khai, URL kết nối. Không chứa logic code.
   - **Cú pháp tên tệp:** `[prefix].env.[status]` (Ví dụ: `ai.env.local`, `backend.env.staging`).
   - **Vị trí:** Nằm MỘT MÌNH ở thư mục gốc của project (cùng cấp với `app/` hoặc `src/`).

2. **Entities (Thực thể Dữ liệu)**
   - **Ý nghĩa:** Nơi định nghĩa khung xương dữ liệu (Schema, DTOs, Pydantic Models, SQLAlchemy Models). Tuyệt đối KHÔNG có hàm logic tính toán.
   - **Cú pháp tên tệp:** `[workflow]_entities.py` (hoặc `.ts`).
   - **Vị trí:** Nằm trong `app/entities/`.

3. **Adapters (Cầu nối Ngoại vi)**
   - **Ý nghĩa:** Chịu trách nhiệm giao tiếp với "thế giới bên ngoài" (Database, AI Model như PyTorch/CLIP, Third-party APIs như MinIO, Milvus). Đây là nơi duy nhất import các thư viện kết nối bên ngoài.
   - **Cú pháp tên tệp:** `[workflow]_adapters.py` (hoặc `.ts`).
   - **Vị trí:** Nằm trong `app/adapters/`.

4. **Services (Logic Nghiệp vụ)**
   - **Ý nghĩa:** Chứa toàn bộ Data Flow và Business Logic. Nhận Entities, thực hiện tính toán, gọi Adapters để thao tác dữ liệu, và ghép nối các bước lại với nhau thành một luồng hoàn chỉnh.
   - **Cú pháp tên tệp:** `[workflow]_services.py` (hoặc `.ts`).
   - **Vị trí:** Nằm trong `app/services/`.

5. **Routers (Giao tiếp HTTP / UI Controller)**
   - **Ý nghĩa:** Điểm đón nhận Request từ người dùng (Endpoints trong FastAPI) hoặc UI/Navigation trong Frontend (React). Làm nhiệm vụ Validate Input ban đầu và đẩy yêu cầu xuống cho Services.
   - **Cú pháp tên tệp:** `[workflow]_routers.py` (hoặc `.ts`).
   - **Vị trí:** Nằm trong `app/routers/`.

### 1.2 "Bộ tệp" giải quyết tự trị cho 1 mắt xích Workflow

Thay vì tổ chức theo kiểu MVC truyền thống (gom tất cả Controllers vào 1 chỗ, tất cả Models vào 1 chỗ một cách rời rạc), SISE gom chúng lại thành các **"Bộ tệp Workflow"**.

**Cách hoạt động:** Lấy ví dụ mắt xích vòng đời `upload` của BackendModule, bộ tệp sẽ gồm: `upload_entities.py`, `upload_adapters.py`, `upload_services.py`, `upload_routers.py`. Bộ 4 tệp này hoạt động như một "đội thi công" độc lập, trọn vẹn dành riêng cho nghiệp vụ tải ảnh.

**So sánh Ưu/Nhược điểm với các kiến trúc nhóm phổ biến:**
- **Ưu điểm SISE (Workflow-Centric):** Khắc phục triệt để căn bệnh "mã nguồn loãng" (Spaghetti Code). Lập trình viên lập tức biết logic nằm ở đâu, không cần nhảy chéo giữa hàng chục file dùng chung. Trách nhiệm (Responsibility) minh bạch.
- **Nhược điểm (Trade-off):** Chấp nhận hy sinh khả năng tái sử dụng (reusability) ở mức độ nhỏ. Có thể đôi lúc bạn phải viết lại một hàm nhỏ ở 2 file service khác nhau, nhưng đổi lại, nếu sửa logic ở luồng Upload, chắc chắn luồng Search không bao giờ bị dính bug (Side-effect).

---

## 2. CHI TIẾT TỪNG WORKFLOW CỦA CÁC MODULE

### 2.1 AG-01: AIModule (The Brain)
- **Tính chất Workflow:** Pipeline Inference (chuyển đổi Dữ liệu phi cấu trúc -> Vector số). Xử lý nặng bằng CPU/GPU.
- **Input:** Hình ảnh (form-data) hoặc Văn bản (JSON text) nhận trực tiếp từ BackendModule AG-03.
- **Output:** Mảng `float32[]` có số chiều tuân thủ tuyệt đối chuẩn `global_configs.vector_dim` của `data_schema.yaml` (512 chiều đối với ViT-B/32). Return JSON về Backend.

**Các mắt xích (Links):**
1. **`warmup` (Warm-up Model):** Tải AI Model (CLIP) từ đĩa cứng lên RAM/VRAM ngay tại thời điểm khởi động FastAPI, tránh tình trạng Cold-start cho request đầu tiên.
2. **`preprocessing` (Tiền xử lý):** Nhận ảnh, resize 224x224, Normalize, tokenizing text. Đưa Raw Data thành Tensor.
3. **`embedding` (Trích xuất đặc trưng):** Gọi mạng nơ-ron inference Tensor thành Vector.

### 2.2 AG-02: StorageModule (The Storage)
- **Tính chất Workflow:** Cơ sở hạ tầng. Cung cấp Migration scripts và khởi tạo hệ thống lưu trữ chứ không phải code chạy runtime như API.
- **Input:** Khai báo Schema và Configurations.
- **Output:** Hạ tầng sẵn sàng để Backend kết nối.

**Các mắt xích (Links):**
1. **`schema` (PostgreSQL):** Tạo bảng `users`, `friends`, `albums`, `images` (bằng Alembic Migration).
2. **`collection` (Milvus):** Tạo bảng vector `sise_v1` bằng index chuẩn HNSW, Metric COSINE.
3. **`bucket` (MinIO):** Thiết lập bucket `raw-images` (private), `thumbnails`, và policy lifecycle (Ví dụ sau 10 năm archive).

### 2.3 AG-03: BackendModule (The Backbone)
- **Tính chất Workflow:** Điều phối viên trung tâm. Router HTTP, quản lý State, Data Flow và Authorization. Bám chặt vào `data_schema.yaml`.
- **Input:** HTTP Requests từ Frontend.
- **Output:** JSON Data / Presigned URLs / Redirect.

**Các mắt xích (Links):**
1. **`auth`:** Đăng ký, đăng nhập JWT, giải mã lấy `user_id`.
2. **`upload`:** Thực thi chuẩn xác luồng 5 bước "Transaction Semantics" (Tạo Presigned URL -> Client Upload binary MinIO -> DB pending status -> Enqueue -> Commit).
3. **`indexing`:** Celery Worker ngầm hoạt động: Bốc ảnh từ MinIO -> gọi AIModule -> insert vector vào Milvus -> cập nhật trạng thái PostgreSQL thành `ready`.
4. **`search`:** Nhận Image/Text từ người dùng -> gọi AIModule sinh vector -> gọi Milvus tìm kiếm **có kèm Privacy Filter** (Privacy-Aware Search theo metadata) -> Map với dữ liệu PostgreSQL để ra Output hoàn chỉnh.
5. **`evaluation`:** Benchmark đánh giá MRR, HitRate (gọi test dataset).

### 2.4 AG-04 & AG-05: WebFrontend / MobileFrontend
- **Tính chất Workflow:** UI Rendering, Client-side state, API Consumer. Không có quyền gọi Milvus/MinIO/AIModule trực tiếp, BẮT BUỘC gọi qua Backend.

**Các mắt xích chung:**
1. **`auth`:** Lưu Token cục bộ, validate session.
2. **`upload`:** UI Upload progress, xử lý giao tiếp 2 bước (gọi Backend lấy presigned URL -> tự PUT tệp binary trực tiếp về MinIO).
3. **`search`:** Thanh tìm kiếm đa phương thức, Filter giao diện, hiển thị ảnh dạng lưới (Grid).
*(Riêng AG-05 Mobile sẽ có thêm `camera` cho phép chụp ảnh thực).*

---

## 3. QUY TẮC TOÀN VẸN (VALIDATION RULES) & ANTI-PATTERNS

### 3.1 Quy tắc định danh tên tệp
- **Hành động hóa (Action-oriented):** Thay vì đặt tên là danh từ `image_services.py`, HÃY đặt theo động từ quy trình `upload_services.py` hoặc `indexing_services.py`.
- **Cấm tên "Rác" (No Generic Names):** Tuyệt đối không sinh các tệp như `utils.py`, `helpers.py`, `common.py`. Các hàm tiện ích phải thuộc về Adapter hoặc Service cụ thể.
- **Tên Adapter:** Phải định danh rõ external system. Ví dụ: `minio_adapters.py`, `clip_adapters.py`.

### 3.2 Các Anti-Patterns cần tránh (Phải ghi nhớ)
- **ANTI-PATTERN 1 (Logic in Entities):** Entities (Pydantic / SQLAlchemy / Interface / Types) chứa hàm giải quyết logic. (SAI! Entities chỉ được định hình dữ liệu).
- **ANTI-PATTERN 2 (Service gọi thẳng Lõi Base/External Libs):** Service import thẳng `pymilvus`, `boto3`, hoặc mô hình `torch` vào để gọi. (SAI! Service phải gọi qua hàm của `[workflow]_adapters.py`).
- **ANTI-PATTERN 3 (Hardcode):** Viết cứng mật khẩu hoặc URL vào trong Adapters. (SAI! Mọi cấu hình gọi từ thư mục `configs/`).
- **ANTI-PATTERN 4 (Vòng luẩn quẩn):** `upload_services.py` import `search_services.py` và ngược lại. (SAI! Dependency phải theo chiều tuyến tính một chiều).

### 3.3 Dependency Injection (DI)
- **Rule:** Dùng thiết kế tiêm phụ thuộc qua Constructor. KHÔNG khởi tạo Adapter trực tiếp bên trong nội bộ Service.
- **Dự án Python/FastAPI:** Sử dụng hàm `Depends()` trong Routers để inject Adapters vào Services.
- **Lý do:** Rất dễ cho việc Mocking khi viết Unit Test.

### 3.4 Giao tiếp chéo giữa các Modules (Cross-Module Comm)
- Dựa theo `.context/openapi.yaml`, Modules chỉ được giao tiếp ngoại mạng với nhau qua **HTTP APIs**.
- **Cấm:** Backend AG-03 không được sử dụng SQLAlchemy chọc thẳng vào file Database riêng của AIModule hoặc đọc qua biến bộ nhớ. Mọi request phải là RESTful API. Tương tự WebFrontend không được tự ý gửi gRPC tới Milvus.

### 3.5 Chiến lược Testing theo Lớp
- **Entities:** Chỉ Test Validation schema (kiểm tra Validate Error).
- **Adapters:** Test bằng Mock external client (Mock MinIO put_object).
- **Services:** Integration Test với Mock Adapters để bám sát logic xử lý if/else.
- **Routers:** End-to-end Test Request / Response HTTP thật.
- **Workflow:** Benchmark chạy thực tế luồng thông suốt từ Upload tới Search.

### 3.6 Quản lý Độ Phức Tạp và Mở Rộng
- **Rule:** Ưu tiên 1 mắt xích chỉ có 1 file. Trừ khi một tệp Services vượt quá 600 dòng code (ví dụ Workflow Upload quá dày).
- Giữ sự liền mạch (Cohesion) quan trọng hơn kích thước tệp. Nếu thực sự cần chia nhỏ, hãy chia theo phase: `upload_init_services.py` và `upload_commit_services.py`.

---

## 4. DEMO MINH HỌA VỚI AI MODULE (AG-01)

### 4.1. Workflow của AIModule
- **Mắt xích `metadata_warmup`:** Chuẩn bị Model.
- **Mắt xích `image_embedding`:** Nhận ảnh, Resize -> Inference Vector.
- **Mắt xích `text_embedding`:** Nhận Text, Tokenize -> Inference Vector.

### 4.2. Vẽ Cây Thư Mục (Code Tree)
```text
modules/AIModule/
├── configs/
│   ├── ai.env.local
│   └── ai.env.production
├── app/
│   ├── __init__.py
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── image_embedding_entities.py  (Chứa class ImageEmbedRequest)
│   │   └── text_embedding_entities.py   (Chứa class TextEmbedRequest)
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── clip_adapters.py             (Tương tác với thư viện PyTorch/HuggingFace)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── image_embedding_services.py  (Business logic kiểm tra ảnh, gọi Model qua Adapter)
│   │   ├── text_embedding_services.py
│   │   └── warmup_services.py
│   ├── routers/
│   │   ├── __init__.py
│   │   └── embedding_routers.py         (Chứa @router.post("/inference/embed/image"))
│   └── dependencies.py                  (Phụ trách DI kết nối Adapter và Service)
├── main.py        (FastAPI global orchestrator)
└── requirements.txt
```

### 4.3. Demo các Quy Tắc Toàn Vẹn trong Code
- **Cấm Anti-Pattern 1 (Logic in Entities):**
  Trong `image_embedding_entities.py`, chỉ khai báo dữ liệu kỳ vọng từ `openapi.yaml`:
  ```python
  from pydantic import BaseModel
  class VectorResponse(BaseModel):
      vector: list[float]
      dim: int
      model: str
  ```

- **Dependency Injection (DI) & Anti-Pattern 2:**
  Trong `image_embedding_services.py`, Service gọi AI Model nhưng không import PyTorch:
  ```python
  class ImageEmbeddingService:
      # Inject Adapter vào
      def __init__(self, clip_adapter: CLIPAdapter):
          self.clip_adapter = clip_adapter

      async def process(self, file_bytes: bytes) -> VectorResponse:
          # Business logic (e.g., validate format, log processing time)
          vector = self.clip_adapter.extract_image_features(file_bytes)
          return VectorResponse(vector=vector, dim=len(vector), model="clip-vit-b-32")
  ```

- **__init__.py thông minh để né tên dài:**
  Tại `app/services/__init__.py`:
  ```python
  from .image_embedding_services import ImageEmbeddingService
  from .text_embedding_services import TextEmbeddingService

  __all__ = ["ImageEmbeddingService", "TextEmbeddingService"]
  ```

Việc tuân thủ một khuôn gốc chuẩn mực như trên biến dự án SISE thành một bộ code có khả năng chống đạn với các rủi ro thay đổi hành vi trong quá trình phát triển (Regression bugs).
