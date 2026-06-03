---
**Document Type:** Architecture Reference
**Status:** Active (enforced via CI/CD)
**Owner:** AG-00 (OrchestratorAgent) + ProjectOwner
**Last Updated:** 2026-05-12
**Version:** 2.2.0
**Applies To:** All modules (AIModule, BackendModule, StorageModule, frontendweb, FrontendMobile)
---

# KIẾN TRÚC 5 LỚP VÀ QUY TẮC WORKFLOW-CENTRIC (SISE PROJECT)

Tài liệu này định nghĩa hệ thống phân lớp kiến trúc và nguyên tắc tổ chức mã nguồn của dự án SISE.

---

## 1. KIẾN TRÚC 5 LỚP TRONG SISE

Kiến trúc mã nguồn của SISE được thiết kế theo mô hình "Workflow-Centric" kết hợp với sự phân tách 5 lớp (5-Layer Architecture). Kiến trúc này **phù hợp 100% với các project Python (Backend, AI)** và được áp dụng **bán phần cho các project React (Web, Mobile)** với sự điều chỉnh ở lớp UI. Mục tiêu chính là phân định rõ ràng ranh giới trách nhiệm (Bounded Context) và giúp quá trình gỡ lỗi trở nên trực quan nhất có thể.

### 1.1 Khái niệm về 5 Thành phần cốt lõi

Trong thư mục mã nguồn của mỗi project (thường là `app/` cho Python hoặc `src/` cho React), toàn bộ code phải được xếp vào đúng 5 lớp sau:

1. **configs (Cấu hình ngoại vi)**
   - **Định nghĩa:** Nơi lưu trữ toàn bộ các tham số môi trường, thông tin kết nối, và các hằng số không thay đổi ở runtime. Tách biệt hoàn toàn ra khỏi thư mục chứa code logic `app`.
   - **Tên tệp:** Được đặt ở định dạng `[prefix].env.[status]` (Ví dụ: `ai.env.local`, `backend.env.staging`).
   - **Vị trí:** Đứng độc lập ở thư mục gốc của project, ngang hàng với thư mục mã nguồn chính.

2. **entities (Thực thể Dữ liệu)**
   - **Định nghĩa:** Lớp định nghĩa cấu trúc dữ liệu. Bao gồm các Pydantic Models, SQLAlchemy Schemas, hoặc DTO đối với Python; Interfaces/Types đối với TypeScript. Điểm mấu chốt: **Lớp này tuyệt đối không chứa logic xử lý**. 
   - **Tên tệp:** `[workflow]_entities.py` (hoặc `.ts`).

3. **adapters (Cầu nối Ngoại vi)**
   - **Định nghĩa:** Nơi duy nhất mã nguồn giao tiếp trực tiếp với "thế giới bên ngoài". Bất kỳ thư viện nào thực thi kết nối (SQLAlchemy cho DB, MinIO Client cho Storage, PyTorch cho AI Inference, Axios/Fetch gọi API) đều phải bọc lại ở đây.
   - **Tên tệp:** `[workflow]_adapters.py` (hoặc `.ts`).

4. **services (Logic Nghiệp vụ)**
   - **Định nghĩa:** Bộ não của từng workflow. Chứa "Pure business logic". Services nhận input từ Routers, thao tác dữ liệu dựa trên Entities, và gọi Adapters để thực hiện lưu trữ hoặc tính toán.
   - **Tên tệp:** `[workflow]_services.py` (hoặc `.ts`).

5. **routers (Giao tiếp HTTP / UI Controller)**
   - **Định nghĩa:** Cánh cửa tiếp nhận dữ liệu đầu vào. Tại Backend, nó là các Endpoints HTTP (FastAPI routers). Tại Frontend, nó đóng vai trò là Global Orchestrator UI (như Pages, Route config, Controller components). Trách nhiệm của Routers chỉ dừng lại ở bước validate request và điều hướng lời gọi tới Services.
   - **Tên tệp:** `[workflow]_routers.py` (hoặc `.tsx`). Cùng cấp với lớp này là `main.py` hoặc `App.tsx` đóng vai trò nhạc trưởng cao nhất.

### Minh hoạ cấu trúc thư mục
**Áp dụng cho Python (Backend/AI)**
```text
project_root/
├── configs
│	├── backend.env.local
│	├── backend.env.staging
│	└── backend.env.example  
├── app/
│   ├── entities/
│   │    ├── search_entities.py    
│   │    └── __init__.py
│   ├── adapters/
│   │    ├── search_adapters.py   
│   │    └── __init__.py
│   ├── services/
│   │    ├── search_services.py    
│   │    └── __init__.py
│   └── routers/
│        ├── search_routers.py   
│        └── __init__.py
├── backend_main.py    
├── backend_dependencies.py (hoặc backend_requirements.txt)
(...)
```
### 1.2 Quyền lực của "Bộ tệp Workflow"

Thay vì áp dụng MVC tĩnh khiến số lượng tệp phình to mất kiểm soát, SISE nhóm các lớp trên thành các **"Bộ tệp Workflow"** (Workflow-Centric Naming). 

- **Ưu điểm:** Khắc phục triệt để tình trạng mã nguồn chồng chéo. Ví dụ, khi ta cần nâng cấp tính năng "tìm kiếm", bạn chỉ quan tâm đến bộ 4 file bắt đầu bằng `search_...`. Code không bị trộn lẫn trong các schema/service khổng lồ hàng ngàn dòng. Thay đổi logic ở nghiệp vụ "search" sẽ không bao giờ tạo ra bug ẩn cho các luồng nghiệp vụ khác.
- **Đánh đổi:** Chấp nhận sự lặp lại (code duplication) và khả năng tái sử dụng kém để giữ sự TẬP TRUNG TUYỆT ĐỐI vào Context (Mắt xích nghiệp vụ) thay vì cố trừu tượng hoá.

---

## 2. WORKFLOW ĐẶC TẢ THEO TỪNG MODULE

Dưới đây là đặc tả kỹ thuật nghiêm ngặt về phân rã chức năng cho từng Module dựa trên `DOS.md`, `Tasks.yaml` và `data_schema.yaml`.

### 2.1 AG-01: AIModule
- **Đặc tả luồng xử lý:** Pipeline Inference chuyên dụng phân tách tính toán CPU/GPU (Feature Extraction).
- **Ràng buộc I/O:** Output vector có số chiều bắt buộc phải ánh xạ cấu hình `global_configs.vector_dim` bằng cơ chế kiểm định strict.
- **Luồng chức năng (Mắt xích phân rã):**
  1. `warmup`: Trạng thái Pre-initialization. Load CLIP model mapping VRAM để loại trừ cold-start latency.
  2. `image_embedding`: Pre-processing pipeline (224x224, Normalized RGB matrix) $\rightarrow$ Model Inference $\rightarrow$ Vector float32[].
  3. `text_embedding`: Text Tokenization $\rightarrow$ Model Inference $\rightarrow$ Temporal Text Vector float32[].

### 2.2 AG-02: StorageModule
- **Đặc tả luồng xử lý:** Infrastructure as Code (IaC) và Database Initialization scripts.
- **Luồng chức năng (Mắt xích phân rã):**
  1. `schema`: Quản trị Alembic Migrations (PostgreSQL) đảm bảo DDL cho Entities khớp `database_spec.postgresql`.
  2. `collection`: Milvus Schema Initialization (HNSW Indexing, M: 16, efConstruction: 200) cho collection `sise_v1`.
  3. `bucket`: MinIO Initial Setup (Lifecycles retention policy cho `raw-images` & `thumbnails`).

### 2.3 AG-03: BackendModule
- **Đặc tả luồng xử lý:** Central API Gateway & Asynchronous Coordinator. Quản trị Dependency Injection và Transaction Semantics.
- **Ràng buộc I/O:** Cổng giao tiếp bắt buộc tuân thủ Restful APIs theo `openapi.yaml`.
- **Luồng chức năng (Mắt xích phân rã):**
  1. `auth`: Bearer Token validation, JWT decode to extract identity payload.
  2. `upload`: Orchestration of 5-step pipelining (Presigned URL initialization $\rightarrow$ Binary verification $\rightarrow$ Pending metadata persistence $\rightarrow$ Celery queueing $\rightarrow$ Ready commit).
  3. `indexing`: Asynchronous Job Consumer. Liên kết AG-01 AI Inference & AG-02 Milvus Storage.
  4. `search`: Multimodal query ingestion. Áp dụng Privacy-Aware Metadata Filter trên Milvus Engine.
  5. `evaluation`: Benchmarking daemon trigger (MRR, HitRate, Precision computation).

### 2.4 AG-04 & AG-05: WebFrontend / MobileFrontend
- **Đặc tả luồng xử lý:** Client State Management & Render Tree optimization. Áp dụng kiến trúc 5 lớp bán phần: tách biệt triệt để API calls (Adapters), Data types (Entities) và Logic trạng thái (Services) ra khỏi các Components hiển thị UI (Routers).
- **Luồng chức năng (Mắt xích phân rã):**
  1. `auth`: JWT Local/AsyncStorage management.
  2. `upload`: Blob transport manipulation. Chunking/presigned dispatching protocols.
  3. `search`: Grid computation & Infinite Scroll pagination mapping.
  4. `camera` *(Chỉ áp dụng AG-05)*: Native Hardware Device Interface delegation.

---

## 3. QUY TẮC TOÀN VẸN (VALIDATION RULES) VÀ ANTI-PATTERNS

Phần này định hình các rào cản kỹ thuật tĩnh (Static Constraints) mà các tài liệu mã nguồn do Agents khởi tạo BẮT BUỘC phải thoả mãn nhằm bảo vệ kiến trúc `decoulped`.

### 3.1 Quy tắc định danh và Tổ chức Thư mục
1. **Action-oriented Lexicon:** Danh pháp tệp phải miêu tả quá trình, không phản ánh danh từ mô tả mảng tĩnh. 
   - *Valid:* `upload_services.py`, `indexing_adapters.py`.
   - *Invalid:* `image_services.py`, `model_data.py`.
2. **Explicit Adapter Declaration:** Lớp adapter bắt buộc gắn tiền tố chỉ định công nghệ nền tảng. (e.g. `minio_upload_adapters.py`).
3. **Module Barrier:** `__init__.py` phải được khởi tạo tại mỗi thư viện con để bao bọc Context Variables thông qua `__all__ = []`. Cấm rò rỉ imports vượt ra ngoài Scope.

### 3.2 Anti-Patterns Vận Hành Xây Dựng Ràng Buộc Cứng
Dựa trên `agent_boundaries.yaml` và `DOS.md`, các tập vi phạm sau sẽ trigger Lỗi Hậu Kiểm (CI Reject):

- **[AP-1] Delegation Breach (Vi phạm Uỷ quyền Khối lượng):** AG-03 tự ý khởi tạo cấu trúc tính toán (như Resize Array hoặc Deep Learning Embedding) mà không sử dụng AG-01. (Nguyên tắc: `heavy_image_processing` bị cấm hoàn toàn tại lớp API Gateway).
- **[AP-2] Direct Resource Manipulation (Cấm xâm phạm Hạ tầng Dữ liệu Chéo):** AG-03 gọi SQLAlchemy can thiệp cơ sở dữ liệu vật lý riêng của AG-01 hoặc AG-04 chọc thẳng HTTP tới Milvus. Mọi trao đổi phải đóng gói theo RESTful protocol quy định tại `openapi.yaml`.
- **[AP-3] Hardcoded Configuration (Trạng thái Cứng):** Bí mật cấp cao hoặc tham chiếu URI nằm trong nội hàm của Adapter. (Thay vào đó, phải Inject từ Env config tại bước Startup).
- **[AP-4] Logic Bleed in Entities (Tràn Logic thực thể):** Định nghĩa Data Types như `Pydantic BaseModel` chứa Methods có tính toán State.
- **[AP-5] Circular Dependency (Phụ thuộc Tuyến tính Nghịch):** Module A.Service mapping sang Module B.Service, trong khi Module B.Service gọi trực tiếp module A. Tính Linear Directed Graph bị phá huỷ.

### 3.3 Cơ chế Khởi tạo và Phụ thuộc (Dependency Injection)
- Lớp Services không khởi tạo lớp Adapters. Adapters phải được Injected qua Constructor Object tại Initialization Runtime ở vòng Routers (vd thông qua hệ thống `Depends()` của FastAPI).
- Việc inject này đảm bảo Unit Test Module có khả năng tách rời (Isolation Mocking) nhằm đánh giá riêng Business Logic của Lớp 4 (Services) mà không tiêu tốn Network I/O.

### 3.4 Giao tiếp chéo và Idempotency (Cross-Module Communication)
- Kế thừa chuẩn `openapi.yaml`: Liên lạc ngoại vi hệ thống được đảm bảo tính bất biến (Idempotent), dựa trên HTTP Header `Idempotency-Key` (TTL 24 hours).
- Xác thực kích thước Vector (Vector-Dim Assertion): AG-01 khi trả kết quả, AG-03 tiến hành parse phải kiểm thử cấu trúc thông qua `X-Expected-Vector-Dim` probe endpoint `/health/readiness`. Mismatch phải trả `400 ERR_VECTOR_DIM_MISMATCH`.

### 3.5 Chiến lược Đảm bảo Chất lượng theo Phân lớp (Layer Testing Matrix)
- **Entities:** Runtime Constraint Validator Coverage (Input Type validation).
- **Adapters:** Network Client Isolation Mockings.
- **Services:** Pure Logic Integration Test bằng Stub Adapters.
- **Routers & Workflow:** RESTful Endpoint E2E (End-to-end payload asserting). Đạt mốc `200/201/202` schema testing theo `openapi-generator`.

### 3.6 Quản Trị Phức Tạp Thuật Toán (Complexity Management)
- **Nguyên lý 1 - Cohesion Constraint:** Nếu chiều dài thuật toán của 1 Single Workflow file vượt 2000 loc (dòng) mà việc chia nhỏ bằng Interface làm tăng độ trừu tượng, BẮT BUỘC giữ nguyên để bảo toàn Context Cohesion.
- **Nguyên lý 2 - Phase Splitting:** Nếu file chứa 2 phases rời rạc (Ví dụ: `upload` pipeline chứa "Upload_init" - presigned creation và "Upload_commit" - verify), lập trình viên được quyền rẽ nhánh file thành `upload_init_services.py` và `upload_commit_services.py`. Tuyệt đối không sinh thêm class chung như `utils.py`.
