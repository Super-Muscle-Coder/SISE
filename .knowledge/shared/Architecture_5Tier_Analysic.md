# PHÂN TÍCH: KIẾN TRÚC 5 LỚP (configs/entities/adapters/services/routers) VÀ WORKFLOW-CENTRIC CHO SISE

## TÓM TẮT

Cấu trúc phân lớp kết hợp **Workflow-Centric Naming** là kiến trúc chuẩn cho toàn bộ dự án SISE. Kiến trúc này RẤT PHÙ HỢP với các project Python (AG-01, AG-02, AG-03) và có thể áp dụng BÁN PHẦN cho React projects (AG-04, AG-05) với một chút điều chỉnh ở lớp UI.

Điểm mấu chốt:
- Tách biệt hoàn toàn `configs` (chứa `.env`) ra khỏi thư mục chứa code logic `app`.
- Trong thư mục `app`, mã nguồn được phân thành 4 không gian: `entities`, `adapters`, `services`, `routers`.
- Đặt tên file theo chuẩn WORKFLOW-CENTRIC (`[mắt_xích]_[tên_lớp]`), đảm bảo tính hiểu ngữ cảnh tổng quát tối đa.

---

## PYTHON PROJECTS — ÁP DỤNG 100%

### AG-01 — AIModule (EXCELLENT FIT)

```text
modules/AIModule/
├── configs/
│   ├── ai.env.local
│   └── ai.env.staging
├── app/
│   ├── __init__.py
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── preprocessing_entities.py    # Dữ liệu ngây thơ (PreprocessedImage)
│   │   └── embedding_entities.py        # Pydantic models (EmbedRequest, EmbedResponse)
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── preprocessing_adapters.py    # Wrapping công cụ xử lý ảnh ngoài
│   │   └── embedding_adapters.py        # Load CLIP model (external ML lib)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── preprocessing_services.py    # Logic tiền xử lý
│   │   └── embedding_services.py        # Business logic trích xuất vector
│   └── routers/
│       ├── __init__.py
│       ├── preprocessing_routers.py     # (Nếu cần tách route)
│       └── embedding_routers.py         # HTTP endpoints gọi sang services
├── main.py                              # Global Orchestrator
```

**Lợi ích:**
- `configs/`: Tập trung tham số môi trường, không dính líu logic mã nguồn .py.
- `entities/`: Định nghĩa Pydantic rõ ràng cho 1 mắt xích (workflow).
- `adapters/`: Wrap mọi external calls/libs theo từng mắt xích.
- `services/`: Chứa toàn bộ business logic.
- `routers/`: Giao tiếp HTTP, đóng vai trò nhạc trưởng điều phối các services.

---

### AG-03 — BackendModule (PERFECT FIT, phức tạp nhất)

```text
modules/BackendModule/
├── configs/
│   ├── backend.env.local
│   └── backend.env.production
├── app/
│   ├── __init__.py
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── auth_entities.py
│   │   ├── upload_entities.py
│   │   └── search_entities.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── auth_adapters.py
│   │   ├── upload_adapters.py
│   │   └── search_adapters.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_services.py
│   │   ├── upload_services.py
│   │   └── search_services.py
│   └── routers/
│       ├── __init__.py
│       ├── auth_routers.py
│       ├── upload_routers.py
│       └── search_routers.py
├── main.py
```

**Sức mạnh của Workflow-Centric:** Khi bạn cần nâng cấp "tìm kiếm", bạn chỉ quan tâm đến bộ 4 file bắt đầu bằng `search_...`. Code không bị trộn lẫn trong các schema/service khổng lồ 2000 dòng.

---

## REACT PROJECTS — ÁP DỤNG BÁN PHẦN (AG-04, AG-05)

React ecosystem áp dụng 5 lớp này bằng cách map thư mục `app` thành `src`, và routers thường sẽ là các hooks/pages/components điều hướng.

```text
modules/frontendweb/
├── configs/
│   └── web.env.local
├── src/
│   ├── entities/
│   │   ├── __init__.ts
│   │   ├── auth_entities.ts             # TypeScript interfaces (LoginRequest, TokenResponse)
│   │   └── upload_entities.ts
│   ├── adapters/
│   │   ├── __init__.ts
│   │   ├── auth_adapters.ts             # Axios/Fetch clients
│   │   └── upload_adapters.ts
│   ├── services/
│   │   ├── __init__.ts
│   │   ├── auth_services.ts             # Pure business/state logic
│   │   └── upload_services.ts
│   ├── routers/                         # Tương đương Pages hoặc Router config trong React
│   │   ├── __init__.ts
│   │   ├── auth_routers.tsx
│   │   └── upload_routers.tsx
├── App.tsx                              # Global Orchestrator UI
```

**Kết luận Frontend:** Tách API calls, data types và pure logic ra khỏi components. Components/Routes (lớp thứ 5) chỉ đóng vai trò nhạc trưởng (như router trong backend) để kết xuất dữ liệu ra màn hình.

---

## KẾT LUẬN & KHUYẾN NGHỊ CUỐI CÙNG

Việc dịch chuyển từ kiến trúc phân chia kĩ thuật thông thường sang **Kiến trúc 5 lớp + Workflow-Centric** đã tạo ra một sự thay đổi cực lớn về tính dễ bảo trì. Mọi dự án (kể cả Python hay JS/TS) phải TẬP TRUNG vào Context (Mắt xích nghiệp vụ).

Tất cả Agent trong dự án (từ AG-01 đến AG-05) phải nghiêm ngặt tuân thủ luật này và tài liệu hướng dẫn cụ thể trong `Workflow_Centric_Architecture.md`.
