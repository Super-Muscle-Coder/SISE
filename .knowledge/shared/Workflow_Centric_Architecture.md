---
**Document Type:** Architecture Reference
**Status:** Active (enforced via CI/CD)
**Owner:** AG-00 (OrchestratorAgent) + ProjectOwner
**Last Updated:** 2026-07-08
**Version:** 2.4.0
**Applies To:** All modules (AIModule, BackendModule, StorageModule, frontendweb, FrontendMobile)
**Changelog v2.4.0 (đồng bộ với data_schema.yaml v1.2.0 / openapi.yaml v1.2.0):**
  - **[AP-2] Khép lại mơ hồ về phạm vi "Direct Resource Manipulation" đối với AG-03.**
    Trước v2.4.0, câu chữ AP-2 chỉ liệt kê tường minh 2 trường hợp bị cấm
    (AG-03→DB riêng của AG-01; AG-04→PostgreSQL/pgvector), để ngỏ câu hỏi
    "AG-03 có được SQLAlchemy trực tiếp vào PostgreSQL (Clause B) hay
    không?". Đối chiếu `transaction_semantics.upload_pipeline` (S3, S5 —
    data_schema.yaml, nơi actor AG-03 tự INSERT/UPDATE bảng `images`) xác
    nhận: AG-03 ĐƯỢC PHÉP SQLAlchemy trực tiếp vào mọi bảng
    `users/friends/albums/images` NGOẠI TRỪ cột `images.embedding`. Cột
    `embedding` bắt buộc qua REST AG-02 (`POST /vector/index`,
    `POST /vector/search/hybrid`). Mục 3.2 bên dưới nay dẫn chiếu trực tiếp
    tới `backend_owned_resources` (data_schema.yaml v1.2.0, Clause D) làm
    nguồn sự thật duy nhất — không còn suy diễn rời rạc.
  - **[§2.3 AG-03]** Thêm lại workflow `indexing` như một BỘ FILE ĐỘC LẬP
    (`indexing_*.py`), tách khỏi `upload`, đúng như bản mô tả gốc §2.3 và
    khớp với `transaction_semantics.upload_pipeline` S4-S5 (async job,
    logic khác biệt rõ với S1-S3 là orchestration đồng bộ). Đây là điều
    chỉnh về TỔ CHỨC FILE, không đổi hành vi nghiệp vụ.
  - **[§2.3 AG-03]** Bổ sung workflow `friends` (mới, khớp
    `friends_management` — data_schema.yaml v1.2.0, Clause D — và nhóm path
    `/friends/*` — openapi.yaml v1.2.0).
  - **[§2.3 AG-03]** Bổ sung ghi chú `admin` cho workflow `evaluation` và
    workflow mới `admin` (khớp `admin_authorization`, `users.role`).
  - **[§3.4]** Cập nhật lại đặc tả Vector-Dim Assertion và Idempotency để
    khớp chính xác `openapi.yaml` v1.2.0 (409 responses đầy đủ ở mọi
    endpoint có `Idempotency-Key`).
  - Không có thay đổi nào ở §2.2 (StorageModule) hay phần mô tả AIModule
    trong §2.1 so với v2.3.0 — hai mục này phản ánh đúng module đã KHÓA
    (Clause B, Clause C), chỉ được đọc/tham chiếu, không sửa.

**Changelog v2.3.0:** Updated StorageModule AG-02 section: replaced all Milvus/etcd references with pgvector (PostgreSQL `vector` extension) per `data_schema.yaml` v1.1.0 and `openapi.yaml` v1.1.0 migration.
---

# KIẾN TRÚC 5 LỚP VÀ QUY TẮC WORKFLOW-CENTRIC (SISE PROJECT)

Tài liệu này định nghĩa hệ thống phân lớp kiến trúc và nguyên tắc tổ chức mã nguồn của dự án SISE.

> **Vị trí của tài liệu này trong hệ thống hợp đồng:** `data_schema.yaml` và
> `openapi.yaml` là 2 hợp đồng TỐI CAO (single source of truth về dữ liệu và
> giao tiếp). Tài liệu này là bản DIỄN GIẢI kiến trúc — giải thích *tại sao*
> và *tổ chức thế nào* — phục vụ cho việc code thực thi đúng 2 hợp đồng trên.
> Khi có bất kỳ khác biệt nào giữa tài liệu này và `data_schema.yaml` /
> `openapi.yaml`, **2 tệp hợp đồng luôn thắng**; tài liệu này phải được sửa
> lại cho khớp, không phải ngược lại.

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

   > **Bắt buộc (v2.4.0):** Mọi router workflow tạo ra ở lớp này PHẢI được
   > đăng ký (`app.include_router(...)`) tại entry point chính
   > (`main.py`/`backend_main.py`) trước khi workflow được coi là hoàn
   > thành. Một router tồn tại dưới dạng file nhưng chưa được include vào
   > app KHÔNG được tính là "done" ở Tasks.yaml — đây là lỗi đã từng xảy ra
   > trong thực tế (chỉ 2/7 router được đăng ký dù 7/7 được báo cáo hoàn
   > thành) và phải được runtime-verify (`GET /openapi.json` từ app đang
   > chạy, đối chiếu với `openapi.yaml`), không chấp nhận việc chỉ đọc code.

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

Dưới đây là đặc tả kỹ thuật nghiêm ngặt về phân rã chức năng cho từng Module dựa trên `Tasks.yaml`, `openapi.yaml` v1.2.0 và `data_schema.yaml` v1.2.0.

### 2.1 AG-01: AIModule — [CLAUSE C, KHÓA — đã đóng container T006-02]
- **Đặc tả luồng xử lý:** Pipeline Inference chuyên dụng phân tách tính toán CPU/GPU (Feature Extraction).
- **Ràng buộc I/O:** Output vector có số chiều bắt buộc phải ánh xạ cấu hình `global_configs.vector_dim` bằng cơ chế kiểm định strict.
- **Luồng chức năng (Mắt xích phân rã):**
  1. `warmup`: Trạng thái Pre-initialization. Load CLIP model mapping VRAM để loại trừ cold-start latency.
  2. `image_embedding`: Pre-processing pipeline (224x224, Normalized RGB matrix) $\rightarrow$ Model Inference $\rightarrow$ Vector float32[].
  3. `text_embedding`: Text Tokenization $\rightarrow$ Model Inference $\rightarrow$ Temporal Text Vector float32[].
  4. `batch_embedding`: Xử lý nhiều ảnh trong 1 request (`POST /inference/embed/batch`), phục vụ `POST /admin/reindex` (AG-03).
- **Giao tiếp:** implemented_by C, called_by D duy nhất (xem `openapi.yaml` tag `AIModule` — E không bao giờ gọi trực tiếp).

### 2.2 AG-02: StorageModule — [CLAUSE B, KHÓA — đã đóng container T006-01, APPEND-ONLY]
- **Đặc tả luồng xử lý:** Infrastructure as Code (IaC) và Database Initialization scripts. Vector store nằm ngay trong PostgreSQL thông qua extension `pgvector` (thay thế Milvus từ v2.3.0).
- **Luồng chức năng (Mắt xích phân rã):**
  1. `schema`: Quản trị Alembic Migrations (PostgreSQL) đảm bảo DDL cho Entities khớp `database_spec.postgresql`, bao gồm extension `vector`, cột `images.embedding`, và HNSW index. Từ v1.2.0, DDL này còn bao gồm 2 cột APPEND mới: `users.role` và `albums.deleted_at` (xem `data_schema.yaml` v1.2.0, Clause B) — thêm bằng migration Alembic mới, không phá vỡ container đã build.
  2. `pgvector-index`: pgvector Index Initialization (HNSW Indexing, M: 16, ef_construction: 200, operator_class: vector_cosine_ops) cho index `idx_images_embedding_hnsw` trên cột `images.embedding`.
  3. `bucket`: MinIO Initial Setup (Lifecycles retention policy cho `raw-images` & `thumbnails`).
  4. Runtime surface (REST, dùng bởi D — xem `openapi.yaml` tag `StorageModule`): `POST /vector/index`, `POST /vector/search/hybrid`. **Đây là 2 endpoint DUY NHẤT của B lộ ra ngoài qua REST** — mọi truy cập khác vào Postgres do B sở hữu vật lý nhưng D dùng SQLAlchemy trực tiếp theo `backend_owned_resources` (xem §3.2 AP-2 bên dưới).
- **Giao tiếp:** implemented_by B, called_by D duy nhất cho 2 REST endpoint trên. E không bao giờ gọi B trực tiếp.

### 2.3 AG-03: BackendModule — [CLAUSE D, ĐANG XÂY LẠI — vùng làm việc chính]
- **Đặc tả luồng xử lý:** Central API Gateway & Asynchronous Coordinator. Quản trị Dependency Injection và Transaction Semantics.
- **Ràng buộc I/O:** Cổng giao tiếp bắt buộc tuân thủ RESTful API theo `openapi.yaml` v1.2.0 — MỌI router phải được đăng ký vào app thật (xem §1.1 bắt buộc mới).
- **Luồng chức năng (Mắt xích phân rã — 9 workflow, khớp `Tasks.yaml` Phase 3 mở rộng):**
  1. `scaffold`: Khởi tạo project, DI container (`dependencies.py`), config loading. DI phải trả về instance THẬT (có DB session sống), không được để `db_session=None` như một hình thức "TODO ngầm".
  2. `auth`: Bearer Token validation, JWT decode/encode, đăng ký/đăng nhập. SQLAlchemy trực tiếp bảng `users` (bao gồm cột `role` mới) theo `backend_owned_resources`.
  3. `friends` **(MỚI v2.4.0, tách từ khoảng trống trước đây)**: Quản lý quan hệ bạn bè — `GET /friends`, `POST /friends/request` (ghi đối xứng 2 dòng, cùng 1 transaction), `DELETE /friends/{friend_id}` (xóa đối xứng 2 dòng). SQLAlchemy trực tiếp bảng `friends`. Xem `friends_management` (data_schema.yaml v1.2.0, Clause D).
  4. `upload`: Orchestration đồng bộ của bước S1-S3 (Presigned URL initialization $\rightarrow$ Binary verification (client-side) $\rightarrow$ Pending metadata persistence). Kết thúc ở việc enqueue Celery task — KHÔNG chứa logic S4-S5 (xem workflow `indexing` bên dưới).
  5. `indexing` **(TÁCH RIÊNG v2.4.0, khớp bản mô tả gốc §2.3 phiên bản đầu)**: Asynchronous Job Consumer (Celery task thật, có decorator đăng ký thật — không comment out). Liên kết AG-01 (`POST /inference/embed/image`) & AG-02 (`POST /vector/index`) cho bước S4-S5. File `indexing_celery_tasks.py`, `indexing_entities.py`, `indexing_adapters.py`, `indexing_services.py` — 4 file độc lập, không gộp vào `upload_*`. **Cấm tuyệt đối mock data** (không được trả `b"fake_image_bytes"`, vector hardcode `[0.1]*512`, hay bất kỳ giá trị giả lập nào trông như dữ liệu thật) — nếu một bước chưa thể implement đầy đủ, phải `raise NotImplementedError` tường minh, có trỏ tới Task ID liên quan.
  6. `search`: Multimodal query ingestion (`/search/image`, `/search/text`) — app-level wrapper: gọi C (`/inference/embed/*`) rồi gọi B (`/vector/search/hybrid`). Áp dụng Privacy-Aware Metadata Filter (xem `notes.privacy_level_1_query`, data_schema.yaml) — SQLAlchemy trực tiếp bảng `friends` để lấy `friend_ids`, sau đó gửi filter đã biên dịch qua REST tới B.
  7. `media`: Album & Media CRUD — SQLAlchemy trực tiếp bảng `albums`, `images` (trừ cột `embedding`) theo `backend_owned_resources`.
  8. `evaluation`: Benchmarking daemon trigger (MRR, HitRate, Precision computation). `POST /eval/run` yêu cầu `admin_authorization` (đọc `users.role`).
  9. `admin` **(MỚI v2.4.0, tách từ `evaluation` để khớp tag `Admin` riêng trong openapi.yaml)**: `POST /admin/reindex` — cùng cơ chế `admin_authorization`, gọi C (batch embedding) rồi B (`/vector/index`) theo batch.
  10. `health`: `GET /health/liveness`, `GET /health/readiness` — kiểm tra 4 dependency: postgres (bao gồm pgvector extension), minio, ai_service, **redis** (bổ sung v1.2.0). Trả header `X-Expected-Vector-Dim`.

## 2.4 AG-04: FrontendModule (Web) — KIẾN TRÚC CHI TIẾT (Clause E)

> **Changelog v2.5.0 (bổ sung §2.4 chi tiết, thay thế mô tả sơ lược v2.4.0):**
> Trước v2.5.0, §2.4 chỉ mô tả sơ lược 5 workflow cho cả AG-04 (Web)
> và AG-05 (Mobile) dùng chung. Sau khi Project Owner xác nhận phạm vi
> đồ án CHỈ triển khai FrontendWeb (AG-04, React + Vite), KHÔNG triển
> khai FrontendMobile (AG-05, React Native) — AG-05 và toàn bộ workflow
> `camera`/`offline_cache`/`share` (Tasks.yaml T004-08 đến T004-11)
> chính thức **NGOÀI PHẠM VI** đồ án, không audit, không xây dựng.
>
> v2.5.0 thay thế phần mô tả "bán kiến trúc" mơ hồ trước đây bằng một
> đặc tả đầy đủ, chặt chẽ tương đương mức độ chi tiết của §2.3
> (BackendModule), xây dựng cùng Project Owner trong phiên audit
> FrontendWeb đầu tiên (2026-07-13), dựa trên nguyên tắc: kiến trúc
> phải triệt để rõ ràng, không để lại vùng xám giữa các lớp.

### 2.4.0 Phạm vi module

FrontendModule (AG-04) là ứng dụng web duy nhất của SISE, xây bằng
**React 18 + TypeScript + Vite + Tailwind CSS + React Router 7**. Đây
là module **duy nhất** áp dụng kiến trúc "bán phần" — 5-layer nguyên
bản của Workflow-Centric (§1.1) được giữ cho phần logic, nhưng được
mở rộng thêm 2 nhóm layer riêng cho nhu cầu đặc thù của UI, mô tả chi
tiết tại §2.4.1 bên dưới.

Workflow đã triển khai (đối chiếu Tasks.yaml Phase 4, AG-04): `scaffold`,
`auth`, `media`, `search`, `evaluation`. Workflow `friends` (T004-06,
P2) hiện **backlog, chưa triển khai** — không audit ở các vòng hiện
tại cho đến khi Project Owner xác nhận bắt đầu xây. Workflow `upload`
(T004-04) **chưa triển khai riêng biệt** — cần audit xác nhận mức độ
tồn tại thực tế khi vào workflow `media`.

### 2.4.1 Ba nhóm lớp (thay thế mô tả "5-layer bán phần" cũ)

FrontendModule tổ chức mã nguồn thành **3 nhóm lớp (A, B, C)** với ranh
giới trách nhiệm tuyệt đối, không chồng lấn:

---

**NHÓM A — LOGIC THUẦN TÚY (`src/configs`, `entities`, `adapters`,
`services`, `routers`)**

Tương ứng 5-layer gốc của kiến trúc SISE (§1.1), áp dụng cho TypeScript
thay vì Python. Toàn bộ file trong nhóm A **cấm tuyệt đối cú pháp
JSX/TSX**, kể cả khi chỉ render 1 `<div>` — mọi file nhóm A dùng đuôi
`.ts`, không phải `.tsx`.

| Layer | Vai trò | Quy tắc cứng |
|---|---|---|
| `configs/[workflow]_configs.ts` | Trích xuất biến môi trường (`.env`) thành object TypeScript có type. Single source of truth cho mọi hằng số/ngưỡng/timeout — **cấm hard-code** giá trị này ở bất kỳ layer nào khác. | 1 workflow = 1 file |
| `entities/[workflow]_entities.ts` | Type/interface thuần túy, khớp 1-1 với schema tương ứng trong `openapi.yaml`/`data_schema.yaml`. Không chứa logic, không import layer khác (ngoại trừ ngoại lệ `StandardError`, xem §2.4.2). | 1 workflow = 1 file |
| `adapters/[workflow]_adapters.ts` | Lớp DUY NHẤT gọi HTTP (Axios) tới BackendModule. **Gộp class định nghĩa và singleton instance vào cùng 1 file** — không tách file `_instance` riêng. Chuẩn hóa lỗi backend về `StandardError`. | 1 workflow = 1 file |
| `services/[workflow]_services.ts` | React custom hooks + business logic thuần (validate, transform). Gọi `adapters`, dùng `entities`, đọc `configs`. Không JSX. | 1 workflow = 1 file |
| `routers/[workflow]_routers.ts` | **0% JSX.** "UI Controller" thuần logic — export `RouteObject[]` (định nghĩa route con của workflow) và/hoặc `use[Workflow]Controller()` hook gom các `services` lại thành 1 API duy nhất cho `pages/` tiêu thụ. Guard/protected-route logic (kiểm tra token, redirect) thuộc về `auth_routers.ts`, export dưới dạng loader/guard function — không phải component JSX. | 1 workflow = 1 file |

**`routers/scaffold_routers.ts` — Composition Root (ngoại lệ có kiểm
soát, KHÔNG phải ngoại lệ về JSX):**
Đóng vai trò tương đương `app/__init__.py` bên BackendModule (§3.1,
mục 4). Nhiệm vụ:
1. Dựng `<BrowserRouter>`, `<Routes>` bằng `React.createElement`
   (KHÔNG dùng cú pháp JSX `<>` — giữ file ở đuôi `.ts` thuần túy,
   triệt để 100%, không có ngoại lệ nào được phép giữ đuôi `.tsx`
   trong toàn bộ thư mục `routers/`).
2. Gom `RouteObject[]` từ **mọi** `[workflow]_routers.ts` khác thành
   1 route map tổng.
3. Định nghĩa `ScaffoldContext` (React Context) và hook
   `useScaffoldContext()` — gộp chung 1 file, không tách file
   `use_scaffold_context.ts` riêng.
4. Xử lý vòng đời phiên đăng nhập ở mức LOGIC (lắng nghe
   `sessionStarted`/`sessionEnded` CustomEvent, gọi `navigate()`) —
   KHÔNG tự vẽ UI "Session Expired". UI fallback khi lỗi/hết phiên
   thuộc về Nhóm B/C (xem `ScaffoldErrorBoundary` bên dưới).

**Xử lý riêng `ScaffoldErrorBoundary` và `ScaffoldAppShell` (đã phát
hiện vi phạm khi audit, ghi nhận làm tiền lệ):** 2 thành phần này ở
bản cũ (trước v2.5.0) là React Component có JSX nằm lẫn trong
`scaffold_routers.tsx` — vi phạm trực tiếp quy tắc "0% JSX" ở trên.
Hướng xử lý bắt buộc:
- Phần **logic bắt lỗi** (`componentDidCatch`, quyết định khi nào
  hiển thị fallback) → giữ lại ở `scaffold_routers.ts`, dưới dạng
  logic thuần (không return JSX trực tiếp — return qua
  `React.createElement` gọi tới component fallback nằm ở Nhóm B).
- Phần **UI hiển thị** (khung "Something went wrong", nút "Reload",
  khung "Session Expired") → di chuyển thành component `.tsx` trong
  `components/` hoặc `page-layouts/` (Nhóm B), nhận props thuần
  (`error`, `onReload`, `onGoToLogin`), không tự chứa logic điều
  hướng/bắt lỗi.

---

**NHÓM B — GIAO DIỆN THUẦN TÚY (`src/design-system`, `styles`,
`components`, `page-layouts`)**

Định nghĩa giao diện độc lập hoàn toàn khỏi nghiệp vụ. Đuôi `.tsx`
được phép (đây là nơi JSX thuộc về). **Cấm tuyệt đối:** import từ
`adapters/` hoặc `services/`, gọi API trực tiếp, biết về URL/route
hiện tại, tự phát sinh logic điều hướng.

| Layer | Vai trò | Ràng buộc |
|---|---|---|
| `design-system/` | Design token cấp thấp nhất: màu sắc, typography, spacing, shadow, animation — dạng key-value (TypeScript const hoặc CSS variable). | **Hard-code là cấm kỵ tuyệt đối** ở mọi nơi khác trong Nhóm B/C — mọi giá trị màu/spacing/font phải trỏ về đây. |
| `styles/` | CSS toàn cục (reset, typography-base, utilities), tiêu thụ CSS variable từ `design-system/`. | Không chứa selector gắn với business logic (vd `.error-code-409`) |
| `components/[workflow]/` | "Mảnh LEGO" tái sử dụng được, ghép từ token của `design-system/` (AuthForm, FormInput, SubmitButton, NavButton, Footer...). | Chỉ nhận **props thuần** (data + callback do `pages/` truyền xuống). Callback là do trên truyền vào, component không tự tạo ra hành vi điều hướng/nghiệp vụ bên trong. |
| `page-layouts/[layout-name]/` | Khung tổng thể của 1 nhóm trang (LandingLayout, DashboardLayout, ContentLayout), gồm bộ 3 file: `XxxLayout.tsx`, `xxx-layout.css` (có thể để trống nếu không cần), `index.ts` (export point, vai trò tương đương `__init__` cho layout đó). | Chỉ nhận `children` + slot props **thuần túy trạng thái hiển thị** (`showHeader`, `headerContent`). **Cấm nhận callback quyết định điều hướng nghiệp vụ** (vd `onPageChange` chọn trang đích) — đây là lỗi đã phát hiện ở `LandingLayout.tsx` bản cũ, xem §2.4.3. |

---

**NHÓM C — GIAO ĐIỂM (`src/pages`)**

`pages/[Workflow]Page.tsx` là **nơi duy nhất trong toàn bộ codebase**
được phép vừa import từ Nhóm A (`use[Workflow]Controller()` từ
`routers/`) vừa import từ Nhóm B (`components/`, `page-layouts/`),
ghép chúng lại thành JSX hoàn chỉnh mà người dùng thấy. Đây là bản
dịch trực tiếp của khái niệm "Global Orchestrator UI" đã có sẵn ở
§1.1 mục 5, được làm rõ ràng dứt điểm cho FrontendModule.

### 2.4.2 Ngoại lệ dùng chung hợp lệ

`StandardError` (khớp `openapi.yaml` `Error` schema: `code, message,
details?`) là type DUY NHẤT được phép định nghĩa tại
`entities/scaffold_entities.ts` và tái sử dụng (import lại) ở mọi
`[workflow]_entities.ts` khác, thay vì mỗi workflow tự định nghĩa lại.
Lý do: đây là hợp đồng lỗi dùng chung toàn hệ thống, tương đương vai
trò `Error` schema ở tầng `components.schemas` của `openapi.yaml` —
định nghĩa lặp lại ở nhiều nơi tạo rủi ro trôi dạt (drift) type mà
không có cảnh báo biên dịch.

`entities/scaffold_entities.ts` **CHỈ** được giữ: `HealthStatus`,
`StandardError`, `ScaffoldContextState`, và các hằng số `ERROR_CODES`
dùng chung. Mọi type nghiệp vụ khác (`User`, `Album`, `ImageMetadata`,
`SearchResponse`, `EvaluationResult`...) **PHẢI** nằm đúng
`entities/[workflow]_entities.ts` tương ứng theo nguồn gốc schema
trong `openapi.yaml`, không được khai báo trùng lặp ở `scaffold_entities.ts`.

### 2.4.3 Anti-Patterns riêng của FrontendModule (bổ sung §3.2)

- **[AP-7] Layer Leakage (Rò rỉ ranh giới lớp):** Bất kỳ file nào
  trong Nhóm B (`components/`, `page-layouts/`) chứa logic điều hướng
  (callback chọn trang đích, gọi `navigate()`), gọi trực tiếp
  `adapters/`/`services/`, hoặc biết về URL hiện tại. Tiền lệ đã phát
  hiện: `LandingLayout.tsx` (bản cũ) nhận prop
  `onPageChange?: (page: 'introduce' | 'about' | ...) => void` — đây
  là logic điều hướng lọt vào Nhóm B, vi phạm AP-7.
- **[AP-8] JSX Contamination (Nhiễm JSX vào lớp logic):** Bất kỳ file
  nào trong `routers/` (Nhóm A) chứa cú pháp JSX/TSX, kể cả đơn giản.
  Không có ngoại lệ, kể cả `scaffold_routers.ts` — file composition
  root dùng `React.createElement` thay vì JSX để giữ đuôi `.ts` thuần
  túy. Tiền lệ đã phát hiện: `ScaffoldAppShell`, `ScaffoldErrorBoundary`
  (bản cũ) chứa JSX trực tiếp trong `scaffold_routers.tsx`.
- **[AP-9] File Fragmentation (Phân mảnh file trái quy tắc "1 workflow
  1 file/layer"):** Tách 1 layer của 1 workflow thành nhiều file phụ
  không có trong bảng §2.4.1 (vd `_instance.ts`, `_context.ts`, router
  phụ ngoài `[workflow]_routers.ts`). Tiền lệ đã phát hiện: workflow
  `scaffold` (bản cũ) có đồng thời `scaffold_adapters.ts` +
  `scaffold_adapter_instance.ts` (2 file cho layer adapters), và
  `scaffold_routers.tsx` + `router.tsx` + `app_routers.tsx` +
  `use_scaffold_context.ts` (4 file cho layer routers).
- **[AP-10] Contract Version Drift (Trôi dạt phiên bản hợp đồng):**
  `entities/[workflow]_entities.ts` không phản ánh đúng field mới nhất
  của `openapi.yaml`/`data_schema.yaml` phiên bản hiện hành (v1.2.3).
  Tiền lệ đã phát hiện: `scaffold_entities.ts` còn field `milvus`
  (di sản pre-v1.1.0) và thiếu `redis`, `config_validated` (append
  v1.2.0); `auth_entities.ts` `User` thiếu field `role` (append
  v1.2.0) — kéo theo lỗi tích hợp thật ở `auth_adapters.ts`
  (`registerUser()` kỳ vọng sai schema response `AuthResponse` thay vì
  `User` đúng theo `openapi.yaml` v1.2.0 trở đi, khớp lỗi tương tự đã
  từng phát hiện và sửa ở BackendModule T003-01).

### 2.4.4 Ràng buộc tuyệt đối (giữ nguyên từ v2.4.0, không đổi)

AG-04 **CHỈ** được gọi REST tới D (BackendModule). AG-04 **KHÔNG BAO
GIỜ** gọi trực tiếp B (StorageModule) hay C (AIModule), kể cả khi biết
URL nội bộ.
---

## 3. QUY TẮC TOÀN VẸN (VALIDATION RULES) VÀ ANTI-PATTERNS

Phần này định hình các rào cản kỹ thuật tĩnh (Static Constraints) mà các tài liệu mã nguồn do Agents khởi tạo BẮT BUỘC phải thoả mãn nhằm bảo vệ kiến trúc `decoupled`.

### 3.1 Quy tắc định danh và Tổ chức Thư mục
1. **Action-oriented Lexicon:** Danh pháp tệp phải miêu tả quá trình, không phản ánh danh từ mô tả mảng tĩnh. 
   - *Valid:* `upload_services.py`, `indexing_adapters.py`.
   - *Invalid:* `image_services.py`, `model_data.py`.
2. **Explicit Adapter Declaration:** Lớp adapter bắt buộc gắn tiền tố chỉ định công nghệ nền tảng. (e.g. `minio_upload_adapters.py`).
3. **Module Barrier:** `__init__.py` phải được khởi tạo tại mỗi thư viện con để bao bọc Context Variables thông qua `__all__ = []`. Cấm rò rỉ imports vượt ra ngoài Scope.
4. **DI-wiring dùng chung** (`dependencies.py` ở AG-03, tương đương `ai_main.py`/`storage_main.py` ở AG-01/AG-02) được xem là ngoại lệ hợp lệ đứng ngoài prefix `[workflow]_`, vì đây là lớp lắp ráp (composition root) dùng chung cho toàn app, không thuộc riêng 1 workflow.

### 3.2 Anti-Patterns Vận Hành Xây Dựng Ràng Buộc Cứng
Dựa trên `Tasks.yaml` và các bài học audit thực tế, các tập vi phạm sau sẽ trigger Lỗi Hậu Kiểm (CI Reject):

- **[AP-1] Delegation Breach (Vi phạm Uỷ quyền Khối lượng):** AG-03 tự ý khởi tạo cấu trúc tính toán (như Resize Array hoặc Deep Learning Embedding) mà không sử dụng AG-01. (Nguyên tắc: `heavy_image_processing` bị cấm hoàn toàn tại lớp API Gateway).

- **[AP-2] Direct Resource Manipulation — ĐÃ LÀM RÕ v2.4.0:**
  Nguồn sự thật duy nhất cho quy tắc này là mục `backend_owned_resources`
  trong `data_schema.yaml` v1.2.0 (Clause D). Tóm tắt:
  - **ĐƯỢC PHÉP:** AG-03 SQLAlchemy trực tiếp vào bảng `users`, `friends`,
    `albums`, và bảng `images` (mọi cột NGOẠI TRỪ `embedding`). Bằng chứng:
    `transaction_semantics.upload_pipeline` S3 (`INSERT images`), S5
    (`UPDATE index_status`) ghi actor AG-03 tự thao tác trực tiếp.
  - **CẤM:** AG-03 SQLAlchemy trực tiếp vào cột `images.embedding` (đọc
    hoặc ghi). Bắt buộc qua REST AG-02: `POST /vector/index` (ghi),
    `POST /vector/search/hybrid` (đọc/ANN search). Lý do: cột vector là tài
    nguyên đặc thù pgvector/HNSW — trộn logic index/ANN search ra ngoài B sẽ
    tái tạo đúng loại rủi ro "đồng bộ 2 hệ thống" mà migration
    Milvus→pgvector từng giải quyết.
  - **CẤM TUYỆT ĐỐI:** AG-04 (Frontend) SQLAlchemy/chạm PostgreSQL hay
    pgvector dưới bất kỳ hình thức nào — E chỉ gọi REST D.
  - **CẤM:** AG-03 chạm cơ sở dữ liệu vật lý riêng của AG-01 (AG-01
    không sở hữu DB nào — điều khoản này giữ để phòng ngừa mở rộng tương
    lai nếu AG-01 có thêm state riêng).

- **[AP-3] Hardcoded Configuration (Trạng thái Cứng):** Bí mật cấp cao hoặc tham chiếu URI nằm trong nội hàm của Adapter. (Thay vào đó, phải Inject từ Env config tại bước Startup). Bao gồm cả các hằng số nghiệp vụ như `vector_dim`, `EXPECTED_DIM` — phải đọc từ `global_configs`/env var, không hardcode literal trong logic.

- **[AP-4] Logic Bleed in Entities (Tràn Logic thực thể):** Định nghĩa Data Types như `Pydantic BaseModel` chứa Methods có tính toán State.

- **[AP-5] Circular Dependency (Phụ thuộc Tuyến tính Nghịch):** Module A.Service mapping sang Module B.Service, trong khi Module B.Service gọi trực tiếp module A. Tính Linear Directed Graph bị phá huỷ.

- **[AP-6] Mock Data Impersonation (MỚI v2.4.0):** Viết hàm/service trả về dữ liệu giả lập được thiết kế để "trông như dữ liệu thật" (ví dụ: byte string giả `b"fake_image_bytes"`, vector hardcode đồng nhất, dict metadata cố định không đọc từ DB) mà không có cảnh báo tường minh. Đây bị coi là vi phạm nghiêm trọng ngang AP-1 đến AP-5, vì nó phá vỡ khả năng audit — bug bị che giấu thay vì báo lỗi. Nếu 1 phần chưa thể implement đầy đủ (thiếu hạ tầng test, phụ thuộc chưa sẵn sàng), bắt buộc `raise NotImplementedError("<mô tả>, xem Task ID <X>")`, không được trả giá trị giả trông hợp lệ. Áp dụng cho mọi worker agent, mọi module.

### 3.3 Cơ chế Khởi tạo và Phụ thuộc (Dependency Injection)
- Lớp Services không khởi tạo lớp Adapters. Adapters phải được Injected qua Constructor Object tại Initialization Runtime ở vòng Routers (vd thông qua hệ thống `Depends()` của FastAPI).
- Việc inject này đảm bảo Unit Test Module có khả năng tách rời (Isolation Mocking) nhằm đánh giá riêng Business Logic của Lớp 4 (Services) mà không tiêu tốn Network I/O.
- **Yêu cầu bổ sung v2.4.0:** Mọi factory DI (`Depends(get_*_service)`) khi đưa vào production PHẢI trả về instance có khả năng hoạt động thật (có DB session sống, có adapter kết nối thật) — không được để tham số quan trọng ở trạng thái `None`/placeholder trong code đã đánh dấu "done".

### 3.4 Giao tiếp chéo và Idempotency (Cross-Module Communication)
- Kế thừa chuẩn `openapi.yaml` v1.2.0: Liên lạc ngoại vi hệ thống được đảm bảo tính bất biến (Idempotent), dựa trên HTTP Header `Idempotency-Key` (TTL 24 hours). **Mọi endpoint khai báo tham số `Idempotency-Key` bắt buộc phải trả đúng response 409 với schema TRÙNG với response thành công gốc** (khớp `behavior_on_duplicate`, data_schema.yaml) — đây là lỗi Blocking đã từng xảy ra ở `requestUploadUrl` v1.1.1 (trả nhầm schema) và đã sửa ở v1.2.0.
- Xác thực kích thước Vector (Vector-Dim Assertion): AG-01 khi trả kết quả, AG-03 tiến hành parse phải kiểm thử cấu trúc thông qua `X-Expected-Vector-Dim` probe endpoint `/health/readiness`. Mismatch phải trả `400 ERR_VECTOR_DIM_MISMATCH`.

### 3.5 Chiến lược Đảm bảo Chất lượng theo Phân lớp (Layer Testing Matrix)
- **Entities:** Runtime Constraint Validator Coverage (Input Type validation).
- **Adapters:** Network Client Isolation Mockings.
- **Services:** Pure Logic Integration Test bằng Stub Adapters.
- **Routers & Workflow:** RESTful Endpoint E2E (End-to-end payload asserting), verify bằng cách chạy app thật (`uvicorn`) và gọi `GET /openapi.json`, đối chiếu path thực tế với `openapi.yaml` — không chỉ đọc test report tự khai của worker agent. Đạt mốc `200/201/202` schema testing theo `openapi-generator`.

### 3.6 Quản Trị Phức Tạp Thuật Toán (Complexity Management)
- **Nguyên lý 1 - Cohesion Constraint:** Nếu chiều dài thuật toán của 1 Single Workflow file vượt 2000 loc (dòng) mà việc chia nhỏ bằng Interface làm tăng độ trừu tượng, BẮT BUỘC giữ nguyên để bảo toàn Context Cohesion.
- **Nguyên lý 2 - Phase Splitting:** Nếu file chứa 2 phases rời rạc (Ví dụ: `upload` pipeline chứa "Upload_init" - presigned creation và "Upload_commit" - verify), lập trình viên được quyền rẽ nhánh file thành `upload_init_services.py` và `upload_commit_services.py`. Tuyệt đối không sinh thêm class chung như `utils.py`. Trường hợp `upload` và `indexing` (v2.4.0) là ví dụ điển hình đã áp dụng nguyên lý này ở cấp WORKFLOW (không chỉ cấp file): 2 phase có bản chất kỹ thuật khác hẳn nhau (đồng bộ HTTP-request/response vs. bất đồng bộ Celery job) nên tách thành 2 workflow độc lập ngay từ đầu, không chờ tới lúc file quá dài mới tách.