# Collection Workflow - Quick Guide

**Mục đích**: Giới thiệu nhanh Collection Workflow cho newcomer muốn nắm bắt cốt lõi trong 10-15 phút.

**Đối tượng**: Junior developer, newcomer tham gia dự án, người muốn "big picture"

**Thời gian đọc**: 10-15 phút

---

## 1. Collection Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa

**Collection Workflow** là quy trình tạo và quản lý vector collection trong **Milvus** (vector database). Nó tạo collection `sise_v1`, cấu hình HNSW index (Hierarchical Navigable Small World), và đảm bảo collection sẵn sàng để nhận vector embeddings từ CLIP model.

**Vai trò**: Bridge thứ hai trong StorageModule - phụ thuộc vào Schema Workflow, cung cấp vector search capability cho AG-03 (upload service).

### Quy trình cơ bản (5 bước)

1. **Connection Setup**: Kết nối tới Milvus server (host, port)
2. **Schema Building**: Xây dựng collection schema (fields: image_id, vector, user_id, privacy_level)
3. **Collection Creation**: Tạo collection `sise_v1` với schema
4. **HNSW Index Setup**: Tạo HNSW index trên vector field với metric type (L2 hoặc IP)
5. **Load & Validation**: Load collection vào memory, kiểm tra readiness

### Kiến trúc đơn giản

```
Milvus Config (host, port, vector_dim, index_params)
		↓
MilvusCollectionAdapter (tương tác Milvus SDK)
		↓
CollectionService (orchestrate tạo collection)
		↓
CollectionRouter (public API)
		↓
Milvus Database (collection `sise_v1` sẵn sàng)
```

---

## 2. Collection Workflow làm việc với dữ liệu gì? Input/Output là gì?

### Input

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Milvus Connection** | Host, port, kết nối tới Milvus server | localhost:19530 |
| **Collection Configuration** | vector_dim, metric_type, index params | 768, L2, HNSW m=16 |
| **Schema Definition** | Fields: image_id (STRING), vector (FLOAT_VECTOR), user_id, privacy_level | 4 fields defined |
| **External Service** | Milvus server (đang chạy) + etcd backend | Milvus 2.4.x |

### Output

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Primary Output** | Collection `sise_v1` được tạo trong Milvus | Collection sẵn sàng nhận vectors |
| **Side Effects** | Health check log, collection stats | Readiness status, partition count |
| **State Changes** | Milvus từ "no collection" → "collection loaded & indexed" | Vector search ready |

### Dữ liệu được xử lý

- **Loại**: Vector embeddings (768-dimensional float32) + metadata
- **Định dạng**: PyMilvus data structures (List[List[float]])
- **Kích thước**: Hàng triệu vectors (mỗi vector ~3 KB)
- **Tần suất**: Setup một lần, sau đó continuous inserts từ AG-03

---

## 3. Các thành phần trọng tâm của Collection Workflow?

### 4 thành phần chính

| Thành phần | Chức năng | Loại |
|-----------|---------|------|
| **MilvusConfig** | Lưu trữ kết nối Milvus (host, port, vector_dim, index params) | Config Entity |
| **MilvusCollectionAdapter** | Tương tác Milvus SDK (pymilvus), create/validate collection | Adapter |
| **CollectionService** | Điều phối quy trình tạo collection, kiểm tra schema | Service |
| **CollectionRouter** | Cung cấp public API (ensure_collection, get_status) | Router |

### Mối quan hệ

```
collection_config.yaml / env variables
		↓
MilvusConfig (loads & holds connection params)
		↓
MilvusCollectionAdapter (wraps pymilvus SDK)
		↓
CollectionService (orchestrates setup, validation)
		↓
CollectionRouter (exposes public API)
		↓
External Callers (AG-03 upload service, tests)
```

---

## Quick Checklist

Để khởi động Collection Workflow:

- [ ] Schema Workflow đã hoàn thành (tables tồn tại)
- [ ] Milvus server đang chạy (localhost:19530 hoặc remote)
- [ ] Milvus config (host, port, vector_dim) được set
- [ ] Có quyền tạo collection trong Milvus
- [ ] etcd backend (Milvus dependency) hoạt động
- [ ] Run setup: `python scripts/setup_collection.py`

---

## Bước tiếp theo

- **Muốn hiểu chi tiết hơn?** → Xem `COLLECTION_WORKFLOW_DEEP_GUIDE.md`
- **Cần tra cứu file/config?** → Xem `COLLECTION_WORKFLOW_REFERENCES.md`
- **Muốn xem code mẫu?** → Xem `COLLECTION_WORKFLOW_REFERENCES.md` section 5

---

## Tài liệu liên quan

- **Schema Workflow**: Tiền điều kiện (phải chạy trước Collection)
- **Bucket Workflow**: Parallel, không phụ thuộc
- **Seed Workflow**: Phụ thuộc (sau Collection được tạo)
- **AG-03 Upload Service**: Consumer của Collection (insert vectors)
- **Milvus Docs**: https://milvus.io/docs
