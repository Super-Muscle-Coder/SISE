# [WORKFLOW_NAME] - Quick Guide

**Mục đích**: Tài liệu này cung cấp cái nhìn tổng thể nhanh về [WORKFLOW_NAME] cho các developer mới tham gia dự án hoặc cần nắm bắt nhanh cốt lõi của hệ thống.

**Thời gian đọc**: 10-15 phút

---

## 1. Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa
[WORKFLOW_NAME] là [mô tả ngắn về workflow: chức năng chính, mục tiêu, vai trò trong hệ thống].

**Ví dụ**:
- Schema Workflow: tạo và quản lý cấu trúc cơ sở dữ liệu PostgreSQL
- Collection Workflow: tạo và quản lý collection vector trong Milvus
- Bucket Workflow: tạo và quản lý các bucket lưu trữ trong MinIO

### Quy trình cơ bản (High-level Steps)
[WORKFLOW_NAME] gồm các quy trình nhỏ bên trong:

1. **[Process 1 Name]**: [Mô tả ngắn - 1 dòng]
2. **[Process 2 Name]**: [Mô tả ngắn - 1 dòng]
3. **[Process 3 Name]**: [Mô tả ngắn - 1 dòng]
4. **[Process N Name]**: [Mô tả ngắn - 1 dòng]

**Ví dụ cho Collection Workflow**:
1. **Configuration Setup**: Cài đặt thông số kết nối Milvus
2. **Collection Creation**: Tạo collection với schema chuẩn bị
3. **Index Configuration**: Thiết lập HNSW index
4. **Validation & Health Check**: Kiểm tra tính sẵn sàng của collection

### Kiến trúc đơn giản (Simple Architecture)
```
[Diagram hoặc text-based flow]

[Input] --> [Process 1] --> [Process 2] --> [Process 3] --> [Output]
```

**Ví dụ**:
```
Config Files --> Adapter Layer --> Service Layer --> Router Layer --> Storage Ready
```

---

## 2. Workflow này làm việc với dữ liệu gì? Input, Output là gì?

### Input
| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Config/Parameters** | [Những cấu hình cần thiết] | [Ví dụ cụ thể] |
| **External Dependencies** | [Các dịch vụ/tài nguyên bên ngoài cần có] | [Ví dụ cụ thể] |
| **Prerequisites** | [Điều kiện tiên quyết] | [Ví dụ cụ thể] |

**Ví dụ cho Collection Workflow**:
| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Config/Parameters** | Milvus connection URI, collection schema, index params | `MILVUS_HOST=localhost, vector_dim=768` |
| **External Dependencies** | Milvus server đang chạy, etcd backend | Milvus 2.4+ instance |
| **Prerequisites** | PostgreSQL schema đã được tạo (Schema Workflow) | Schema Workflow hoàn thành |

### Output
| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Primary Output** | [Artifact/trạng thái chính được tạo] | [Ví dụ cụ thể] |
| **Side Effects** | [Trạng thái/log/metadata được ghi lại] | [Ví dụ cụ thể] |
| **State Changes** | [Thay đổi trạng thái hệ thống] | [Ví dụ cụ thể] |

**Ví dụ cho Collection Workflow**:
| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Primary Output** | Collection `sise_v1` được tạo trong Milvus | Collection sẵn sàng nhận vector embeddings |
| **Side Effects** | Migration log, health check records | `collection_created_at`, readiness status |
| **State Changes** | Milvus từ "empty" → "ready for indexing" | Vector DB sẵn sàng phục vụ |

### Dữ liệu được xử lý
[Mô tả loại dữ liệu, định dạng, kích thước, tần suất xử lý]

**Ví dụ cho Collection Workflow**:
- **Loại**: Vector embeddings (768-dimensional, float32)
- **Định dạng**: NumPy arrays hoặc nested Python lists
- **Kích thước**: Hàng triệu vectors
- **Tần suất**: Liên tục (real-time indexing)

---

## 3. Các thành phần trọng tâm của Workflow?

### Thành phần chính (Core Components)

| Thành phần | Chức năng | Loại |
|-----------|---------|------|
| **[Component 1]** | [Vai trò/chức năng - 1 dòng] | Entity / Adapter / Service / Router / Config |
| **[Component 2]** | [Vai trò/chức năng - 1 dòng] | Entity / Adapter / Service / Router / Config |
| **[Component 3]** | [Vai trò/chức năng - 1 dòng] | Entity / Adapter / Service / Router / Config |
| **[Component N]** | [Vai trò/chức năng - 1 dòng] | Entity / Adapter / Service / Router / Config |

**Ví dụ cho Collection Workflow**:

| Thành phần | Chức năng | Loại |
|-----------|---------|------|
| **MilvusConfig** | Lưu trữ cấu hình kết nối Milvus và collection schema | Config Entity |
| **MilvusCollectionAdapter** | Đóng gói các hành động tương tác với Milvus API | Adapter |
| **CollectionService** | Điều phối quy trình tạo collection, index, validation | Service |
| **CollectionRouter** | Cung cấp entry point cho các caller bên ngoài | Router |
| **collection_config.yaml** | File cấu hình collection schema và index parameters | Config File |

### Sơ đồ mối quan hệ (Component Relationships)
```
[Simple text diagram showing how components interact]
```

**Ví dụ**:
```
collection_config.yaml
		|
		v
   MilvusConfig (reads)
		|
		v
MilvusCollectionAdapter
		|
		v
  CollectionService
		|
		v
  CollectionRouter (exposes API)
```

---

## Quick Checklist

Để khởi động [WORKFLOW_NAME]:

- [ ] [Prerequisite 1]
- [ ] [Prerequisite 2]
- [ ] [Config file/variable set]
- [ ] [External service running]
- [ ] [Validation/health check passed]

**Ví dụ cho Collection Workflow**:
- [ ] Schema Workflow hoàn thành
- [ ] Milvus container đang chạy
- [ ] MILVUS_HOST, MILVUS_PORT, vector_dim được cấu hình
- [ ] Connection test thành công
- [ ] Collection readiness check passed

---

## Bước tiếp theo

- **Muốn hiểu chi tiết hơn?** → Xem `[WORKFLOW_NAME]_WORKFLOW_DEEP_GUIDE.md`
- **Cần tham khảo cấu trúc tệp/thư mục?** → Xem `[WORKFLOW_NAME]_WORKFLOW_REFERENCES.md`
- **Muốn xem code mẫu?** → Xem `[WORKFLOW_NAME]_WORKFLOW_EXAMPLES.md`

---

## Tài liệu liên quan
- [Link to related workflow/module docs]
- [Link to storage schema docs]
- [Link to implementation code]
