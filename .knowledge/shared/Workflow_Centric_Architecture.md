# KIẾN TRÚC 4 LỚP VÀ QUY TẮC ĐẶT TÊN WORKFLOW-CENTRIC (SISE PROJECT)

## 1. THIẾT LẬP QUY TẮC ĐẶT TÊN BÁM SÁT KIẾN TRÚC VÀ WORKFLOW

Kiến trúc cốt lõi của SISE ưu tiên hoàn toàn tính chất **hiểu ngữ cảnh tổng quát và quản lý tập trung**. Chúng ta chấp nhận đánh đổi một phần khả năng tái sử dụng (reusability) của các component nhỏ lẻ vì chúng bị ràng buộc vào một mắt xích công việc cụ thể. Tuy nhiên, điều này mang lại lợi ích khổng lồ về độ rõ ràng: một bộ tệp là một đội thi công hoàn chỉnh cho một tính năng.

### 1.1. Cấu trúc thư mục `configs`
- Vị trí: Đặt nằm ngoài cùng gốc với project modules.
- Tổ chức: Chỉ chứa cấu hình, tham số, biến môi trường.
- Quy tắc đặt tên: `[prefix_of_project].env.[status]`
  - Ví dụ: `ai.env.local`, `ai.env.production`, `ai.env.example`, `backend.env.staging`.
- Không áp dụng đặt tên theo Workflow-Centric tại thư mục này.

### 1.2. Cấu trúc thư mục `app` (Entities, Adapters, Services, Routers)
- Vị trí: Đặt trong thư mục `app/` (hoặc `src/` đối với dự án Frontend React).
- Cùng cấp với thư mục `app` sẽ có tệp `main.py` (hoặc `App.tsx`) đóng vai trò là Global Orchestrator - nơi gọi toàn bộ workflow cùng chạy.
- **Quy tắc WORKFLOW-CENTRIC:** `[tên_mắt_xích]_[tên_thư_mục_chứa_nó].py`
- Yêu cầu cấu trúc: Mỗi thư mục con (`entities/`, `adapters/`,...) **bắt buộc** phải có 1 tệp `__init__.py` để gom nhóm các class/hàm và export `__all__ = []`, giúp việc import ở nơi khác gọn gàng và tường minh.

**Ví dụ một bộ tệp hoàn chỉnh cho mắt xích "upload":**
- `app/entities/upload_entities.py` (Chứa Schema, Pydantic, DTO)
- `app/adapters/upload_adapters.py` (Chứa MinIO client, external connections)
- `app/services/upload_services.py` (Chứa Upload pipeline logic, Business logic)
- `app/routers/upload_routers.py` (Chứa HTTP Endpoint Route)

---

## 2. WORKFLOW HOÀN CHỈNH VÀ CÁC "MẮT XÍCH" TRỌNG TÂM TỪNG MODULE

Dựa trên DOS và Data Schema, workflow của các hệ thống được chia thành các mắt xích (trạm xử lý) cụ thể:

### 2.1. AG-01: AIModule (Python/FastAPI)
**Tính chất workflow:** Pipeline xử lý hình ảnh và trích xuất đặc trưng (Vector).
* **Mắt xích 1: `preprocessing`** -> Nhận ảnh, resize, normalize, chuẩn bị tensor.
* **Mắt xích 2: `embedding`** -> Trích xuất đặc trưng qua CLIP model (Vector = 512).
* **Mắt xích 3: `warmup`** -> Khởi tạo sẵn đưa model lên RAM/VRAM khi start app.

### 2.2. AG-02: StorageModule (Python/Scripts)
**Tính chất workflow:** Pipeline khởi tạo cơ sở hạ tầng (Database, Vector DB, Blob Storage).
* **Mắt xích 1: `schema`** -> Alembic Migration, setup bảng Postgres (User, Album, Image).
* **Mắt xích 2: `collection`** -> Tạo index và collection "sise_v1" trên Milvus.
* **Mắt xích 3: `bucket`** -> Tạo không gian lưu trữ ảnh thô trên MinIO.

### 2.3. AG-03: BackendModule (Python/FastAPI)
**Tính chất workflow:** Trạm trung chuyển API, Upload, Indexing và Query xử lý logic cốt lõi.
* **Mắt xích 1: `auth`** -> Xử lý đăng nhập, JWT, xác thực User.
* **Mắt xích 2: `upload`** -> Quản lý chu trình 5 bước upload (từ cấp URL Presigned đến xác nhận lưu file).
* **Mắt xích 3: `indexing`** -> Logic background worker gắp ảnh, gọi AIModule lấy vector và push vào Milvus.
* **Mắt xích 4: `search`** -> Xử lý query, filter phân quyền truy cập người dùng và tìm kiếm.
* **Mắt xích 5: `evaluation`** -> Chạy Benchmark (MRR/HitRate).

### 2.4. AG-04 & AG-05: WebFrontend / MobileFrontend (TypeScript/React)
**Tính chất workflow:** Tương tác phía client, bám sát các mắt xích API của Backend.
*(Quy tắc áp dụng bán phần: Đổi `.py` thành `.ts/.tsx`, và `app/` thành `src/`)*
* **Mắt xích 1: `auth`** -> Lưu trữ token, flow đăng nhập.
* **Mắt xích 2: `upload`** -> Xử lý giao diện kéo thả, quản lý progress và async request.
* **Mắt xích 3: `search`** -> Quản lý thanh tìm kiếm, rendering danh sách ảnh kết quả.

---

## 3. CÂY THƯ MỤC HOÀN CHỈNH MẪU

Dưới đây là cấu trúc minh họa cực kỳ chuẩn xác áp dụng những nguyên tắc trên (Sử dụng BackendModule AG-03 làm mẫu tham quát toàn diện).

```text
modules/BackendModule/
├── configs/
│   ├── backend.env.local
│   ├── backend.env.staging
│   └── backend.env.example
├── app/
│   ├── __init__.py
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── auth_entities.py
│   │   ├── upload_entities.py
│   │   ├── indexing_entities.py
│   │   ├── search_entities.py
│   │   └── evaluation_entities.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── auth_adapters.py
│   │   ├── upload_adapters.py
│   │   ├── indexing_adapters.py
│   │   ├── search_adapters.py
│   │   └── evaluation_adapters.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_services.py
│   │   ├── upload_services.py
│   │   ├── indexing_services.py
│   │   ├── search_services.py
│   │   └── evaluation_services.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth_routers.py
│   │   ├── upload_routers.py
│   │   ├── search_routers.py
│   │   └── evaluation_routers.py
├── main.py        <-- Global Orchestrator (FastAPI entrypoint kết nối routers)
└── requirements.txt
```

Cấu trúc minh họa đổi với Frontend (Thư mục `src` thay vì `app`):
```text
modules/frontendweb/
├── configs/
│   ├── web.env.local
│   └── web.env.example
├── src/
│   ├── entities/
│   │   ├── __init__.ts
│   │   ├── auth_entities.ts
│   │   └── upload_entities.ts
│   ├── adapters/
│   │   ├── __init__.ts
│   │   ├── auth_adapters.ts    <-- Gọi API external
│   │   └── upload_adapters.ts
│   ├── services/
│   │   ├── __init__.ts
│   │   ├── auth_services.ts    <-- React hooks hoặc service classes
│   │   └── upload_services.ts
├── App.tsx          <-- Global Orchestrator kết nối UI và Navigation
├── package.json
└── vite.config.ts
```

### LỜI KẾT
Cấu trúc này tuy hy sinh một phần nhỏ rủi ro trùng lặp mã (so với việc tìm cách viết các component dùng chung tuyệt đối), nhưng lại giải quyết triệt để **Khủng hoảng định hướng mã nguồn**. Lập trình viên lập tức biết code thay đổi ở đoạn nào, thuộc luồng xử lý nào, và cần xem các tệp nào đi liền với nó. Toàn bộ các agent chịu trách nhiệm sinh tệp mã nguồn **Bắt Buộc** phải tuân theo tài liệu kiến trúc này.
