# Collection Workflow - Quick Reference

> **Tài liệu nhanh để tra cứu thông tin Collection Workflow.**

---

## 1. Danh Sách Kiểm Tra (Checklist)

### Tệp Bắt Buộc
- `modules/StorageModule/app/entities/collection_entities.py` - MilvusConfig
- `modules/StorageModule/app/adapters/collection_adapters.py` - Milvus API
- `modules/StorageModule/app/services/collection_services.py` - Orchestration
- `modules/StorageModule/app/routers/collection_routers.py` - Router
- `modules/StorageModule/configs/storage.env.local` - Config
- `modules/StorageModule/storage_main.py` - CLI
- `modules/StorageModule/storage_requirements.txt` - Dependencies

### Environment Variables
```ini
MILVUS_HOST=localhost
MILVUS_PORT=19530
COLLECTION_NAME=sise_v1
COLLECTION_VECTOR_DIM=512
COLLECTION_METRIC_TYPE=COSINE
COLLECTION_INDEX_M=16
COLLECTION_INDEX_EF_CONSTRUCTION=200
COLLECTION_SEARCH_EF=64
```

### External Dependencies
- Milvus 2.4.x running at `MILVUS_HOST:MILVUS_PORT`
- Python 3.13+
- pymilvus library installed

---

## 2. Mục Đích Workflow

| Câu Hỏi | Trả Lời |
|--------|--------|
| **Cái gì?** | Thiết lập Milvus vector collection `sise_v1` |
| **Tại sao?** | Lưu trữ & tìm kiếm vector embeddings ảnh |
| **Khi nào?** | Phase 1 setup, một lần khi deploy |
| **Bởi ai?** | StorageModule (AG-02), được gọi từ CLI |
| **Cho ai?** | AG-03 (Backend) dùng để search vectors |

---

## 3. Kiến Trúc 5-Layer

```
Layer 5: ROUTERS (storage_main.py → CollectionWorkflowRouter)
   ↓
Layer 4: SERVICES (collection_services.py → ensure_collection)
   ↓
Layer 3: ADAPTERS (collection_adapters.py → pymilvus)
   ↓
Layer 2: ENTITIES (collection_entities.py → MilvusConfig)
   ↓
Layer 1: EXTERNAL (Milvus Database)
```

| Layer | Tệp | Vai Trò | Đầu Vào | Đầu Ra |
|-------|-----|--------|---------|--------|
| **5** | collection_routers.py | Entry point | MilvusConfig | ✓ Setup |
| **4** | collection_services.py | Orchestration logic | Config | Validation |
| **3** | collection_adapters.py | Low-level Milvus API | Function params | Status |
| **2** | collection_entities.py | Config dataclass | Dict/Env | MilvusConfig |
| **1** | Milvus 2.4.x | Vector database | Commands | Collection |

---

## 4. Collection Schema

### Fields (4 Trường)

```python
FieldSchema(name="image_id",     dtype=VARCHAR,       is_primary=True, max_length=36)
FieldSchema(name="vector",       dtype=FLOAT_VECTOR,  dim=512)
FieldSchema(name="user_id",      dtype=INT64)
FieldSchema(name="privacy_level", dtype=INT32)
```

### Data Type Reference

| Field | Type | Size | Example | Purpose |
|-------|------|------|---------|---------|
| image_id | VARCHAR(36) | 36 bytes | "550e8400-e29b..." | UUID, Primary Key |
| vector | FLOAT_VECTOR | 512 × 4B = 2KB | [0.1, 0.2, ...] | CLIP embedding |
| user_id | INT64 | 8 bytes | 42 | User owner |
| privacy_level | INT32 | 4 bytes | 0, 1, 2 | Access control |

### Index Configuration

```python
index_type = "HNSW"
metric_type = "COSINE"
index_params = {
	"M": 16,                    # Max connections/node
	"ef_construction": 200      # Build depth
}
search_params = {
	"ef": 64                    # Search depth
}
```

---

## 🔧 5. Execution Commands

### Run Collection Workflow

```bash
# Method 1: CLI Main
cd E:\SISE
py -3.13 modules/StorageModule/storage_main.py collection

# Method 2: Test Script
cd E:\SISE
py -3.13 modules/StorageModule/tests/test_collection_workflow.py

# Method 3: PowerShell Helper
cd E:\SISE\modules\StorageModule
./run_storage_tests.ps1
```

### Check Milvus Status

```bash
# Check if running
cd E:\SISE\modules\StorageModule
./start_storage_stack.ps1 status

# Expected output:
# milvus-0           running
```

### Start/Stop Services

```bash
./start_storage_stack.ps1 up      # Start all services
./start_storage_stack.ps1 down    # Stop all services
./start_storage_stack.ps1 logs    # View logs
```

---

## 6. Configuration Reference

### storage.env.local Template

```ini
# Milvus Connection
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Collection Configuration
COLLECTION_NAME=sise_v1
COLLECTION_VECTOR_DIM=512
COLLECTION_METRIC_TYPE=COSINE

# HNSW Index Parameters
COLLECTION_INDEX_TYPE=HNSW
COLLECTION_INDEX_M=16
COLLECTION_INDEX_EF_CONSTRUCTION=200

# Search Parameters
COLLECTION_SEARCH_EF=64
```

### MilvusConfig Object

```python
MilvusConfig(
	host="localhost",
	port=19530,
	collection_name="sise_v1",
	vector_dim=512,
	index_params={"M": 16, "ef_construction": 200},
	metric_type="COSINE",
	search_params={"ef": 64}
)
```

---

## 7. File Locations

```
E:\SISE\modules\StorageModule\
├── app/
│   ├── entities/
│   │   └── collection_entities.py
│   ├── adapters/
│   │   └── collection_adapters.py
│   ├── services/
│   │   └── collection_services.py
│   └── routers/
│       └── collection_routers.py
├── configs/
│   └── storage.env.local
├── tests/
│   └── test_collection_workflow.py
├── storage_main.py
├── storage_requirements.txt
├── start_storage_stack.ps1
├── run_storage_tests.ps1
└── documents/
	└── collection_workflow/
		├── COLLECTION_WORKFLOW_COMPLETE_GUIDE.md
		├── COLLECTION_WORKFLOW_TUTORIAL.md
		├── COLLECTION_WORKFLOW_EXAMPLES.md
		└── COLLECTION_WORKFLOW_QUICK_REFERENCE.md
```

---

## 8. Layer Reference

### Layer 5: Router

```python
from app.routers.collection_routers import CollectionWorkflowRouter

config = MilvusConfig(...)
router = CollectionWorkflowRouter(config)
router.setup_collection()  # Main entry point
```

**Methods**:
- `setup_collection()` → Tạo/xác thực collection

### Layer 4: Services

```python
from app.services import collection_services

collection_services.ensure_collection(config)           # Main orchestration
collection_services._validate_collection_schema(...)    # Schema validation
collection_services._validate_index(...)                # Index validation
```

**Functions**:
- `ensure_collection(config)` → Create or validate
- `_validate_collection_schema()` → Schema checks
- `_validate_index()` → Index checks

### Layer 3: Adapters

```python
from app.adapters import collection_adapters

collection_adapters.connect_to_milvus(host, port)
collection_adapters.collection_exists(name)
collection_adapters.build_collection_fields(dim)
collection_adapters.create_collection(name, fields)
collection_adapters.create_hnsw_index(collection, field, params, metric)
collection_adapters.load_collection(collection)
collection_adapters.get_collection(name)
collection_adapters.get_indexes(collection)
```

**Functions**:
- Connection: `connect_to_milvus()`
- Check: `collection_exists()`, `get_indexes()`
- Build: `build_collection_fields()`
- Create: `create_collection()`, `create_hnsw_index()`
- Load: `load_collection()`
- Retrieve: `get_collection()`

### Layer 2: Entities

```python
from app.entities.collection_entities import MilvusConfig

config = MilvusConfig(
	host="localhost",
	port=19530,
	collection_name="sise_v1",
	vector_dim=512,
	index_params={"M": 16, "ef_construction": 200},
	metric_type="COSINE",
	search_params={"ef": 64}
)
```

**Classes**:
- `MilvusConfig` (frozen dataclass)

---

## 9. Execution Flow

```
1. Load storage.env.local
   ↓
2. Parse environment variables
   ↓
3. Build MilvusConfig
   ↓
4. Create CollectionWorkflowRouter
   ↓
5. router.setup_collection()
   ├─ collection_services.ensure_collection()
   │  ├─ connect_to_milvus()
   │  ├─ collection_exists() ?
   │  │  ├─ NO:  create + index + load
   │  │  └─ YES: validate + load
   │  └─ return
   └─ Done!
```

---

## 🐛 10. Troubleshooting

### Error: Connection refused

```
pymilvus.exceptions.exceptions.MilvusException: 
  Failed to connect to Milvus
```

**Causes**:
- ❌ Milvus not running
- ❌ Wrong host/port
- ❌ Firewall blocking

**Fix**:
```bash
./start_storage_stack.ps1 up      # Start Milvus
./start_storage_stack.ps1 status  # Verify running
```

### Error: Collection already exists

```
pymilvus.exceptions.exceptions.CreateCollectionException:
  CreateCollection failed: collection already exists
```

**Causes**:
- ❌ Running workflow twice without idempotent check

**Fix**:
- ✓ Workflow is idempotent by default
- ✓ Second run validates existing collection
- ✓ No error should occur

### Error: Vector dimension mismatch

```
CollectionValidationError:
  Vector dim mismatch. Expected 512, got 768
```

**Causes**:
- ❌ `COLLECTION_VECTOR_DIM` changed in config
- ❌ CLIP model output dimension changed

**Fix**:
- ✓ Match `COLLECTION_VECTOR_DIM` to AI model output
- ✓ Ensure `vector_dim == 512` (CLIP standard)

### Error: Index parameter mismatch

```
CollectionValidationError:
  Index param mismatch for 'M'. Expected 16, got 32
```

**Causes**:
- ❌ `COLLECTION_INDEX_M` changed
- ❌ Manual index modification

**Fix**:
- ✓ Keep `COLLECTION_INDEX_M=16` (or consistent value)
- ✓ Don't modify collection via Milvus console

### Error: Field not found

```
CollectionValidationError:
  Unexpected fields. Expected {...}, got {...}
```

**Causes**:
- ❌ Collection schema corrupted
- ❌ Manual field deletion

**Fix**:
- ✓ Drop and recreate collection
- ✓ Ensure `DROP COLLECTION sise_v1` if needed
- ✓ Rerun workflow

---

## 11. Health Checks

### Collection Ready Check

```python
from pymilvus import Collection, utility

# Check collection exists
if utility.has_collection("sise_v1"):
	print("✓ Collection exists")

	collection = Collection("sise_v1")

	# Check loaded in memory
	info = collection.num_entities
	print(f"✓ Entities: {info}")

	# Check indexes
	if collection.indexes:
		print("✓ Indexes exist")

	print("✓ Collection is ready!")
else:
	print("✗ Collection not found")
```

### Connection Test

```bash
# Test from Python
py -c "from pymilvus import connections; connections.connect(host='localhost', port=19530); print('✓ Connected')"
```

---

## 12. Related Documentation

| Tài Liệu | Mục Đích |
|---------|---------|
| `COLLECTION_WORKFLOW_COMPLETE_GUIDE.md` | Tổng quan & mục đích |
| `COLLECTION_WORKFLOW_TUTORIAL.md` | Giảng dạy chi tiết |
| `COLLECTION_WORKFLOW_EXAMPLES.md` | Code examples |
| `COLLECTION_WORKFLOW_QUICK_REFERENCE.md` | Tham khảo nhanh (đây!) |

---

## 13. Cross-Workflow Reference

| Workflow | Phụ Thuộc | Cung Cấp |
|----------|-----------|---------|
| **Schema** | PostgreSQL | Database schema |
| **Collection** | Milvus | Vector search capability |
| **Bucket** | MinIO | Image storage |
| **Seed** | Collection + Schema + Bucket | Initial data |
| **Infra Compose** | Docker | All services |

---

## 14. Key Concepts

### Collection
- "Bảng" trong Milvus (như Table trong PostgreSQL)
- Chứa vectors + metadata
- Có schema + indexes

### Vector Embedding
- 512-chiều vector output từ CLIP model
- Đại diện hóa nội dung ảnh
- Các ảnh giống nhau = vectors gần nhau

### HNSW Index
- Hierarchical Navigable Small World
- Graph-based indexing structure
- Cho phép tìm kiếm nhanh (O(log n) complexity)

### Idempotent
- Chạy 2+ lần → kết quả giống nhau
- Không tạo trùng lặp
- Xác thực nếu đã tồn tại

---

## 15. Common Commands Cheatsheet

```bash
# Start all services
./start_storage_stack.ps1 up

# Check status
./start_storage_stack.ps1 status

# View logs
./start_storage_stack.ps1 logs

# Run Collection Workflow
py -3.13 modules/StorageModule/storage_main.py collection

# Run all tests
./run_storage_tests.ps1

# Stop services
./start_storage_stack.ps1 down
```

---

## Summary Table

| Item | Value | Notes |
|------|-------|-------|
| **Collection Name** | `sise_v1` | Standard name |
| **Vector Dimension** | 512 | CLIP output |
| **Primary Key** | `image_id` | UUID string |
| **Index Type** | HNSW | Graph-based |
| **Metric** | COSINE | For normalized vectors |
| **M Parameter** | 16 | Balanced choice |
| **ef_construction** | 200 | Standard value |
| **Python Version** | 3.13+ | Required |
| **Milvus Version** | 2.4.x | Required |
| **Status** | Production | Phase 1 |

