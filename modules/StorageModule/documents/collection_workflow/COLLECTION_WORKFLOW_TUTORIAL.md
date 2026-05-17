# Collection Workflow - Giảng Dạy Chi Tiết

> **Tài liệu này giải thích Collection Workflow từ cấp độ bắt đầu đến trung cấp, với ví dụ thực tế và giải thích từng bước.**

## Phần 1: Bối Cảnh & Vấn Đề

### 1.1 Tại Sao Ảnh Cần Được Chuyển Thành Vector?

Trong SISE, mỗi ảnh được xử lý qua hai giai đoạn:

#### Giai Đoạn 1: AI Processing (Ngoài StorageModule)
```
Ảnh JPG/PNG
	↓
[CLIP Model - AI Inference]
	↓
Vector Embedding 512-chiều
(VD: [0.123, 0.456, ..., 0.789])
```

**CLIP là gì?**
- Contrastive Language-Image Pre-training
- Model AI huấn luyện trước có khả năng hiểu ảnh
- Chuyển ảnh thành một vector 512 số thực
- Các ảnh "giống nhau" sẽ có vector "gần nhau"

#### Giai Đoạn 2: Vector Storage (StorageModule - Collection Workflow)
```
Vector Embedding (512-chiều)
	↓
[Collection Workflow]
	↓
Milvus Vector Database
	(Lưu trữ + Indexing + Search)
```

### 1.2 Tại Sao Không Dùng PostgreSQL?

PostgreSQL là database quan hệ, tuyệt vời cho:
- ✅ Lưu trữ dữ liệu có cấu trúc (bảng, rows)
- ✅ Truy vấn chính xác (WHERE id = 5)
- ❌ Tìm kiếm vector hiệu quả

```sql
-- PostgreSQL không tối ưu cho vector search
SELECT * FROM images 
WHERE vector <-> query_vector < 0.5;  -- CẬP NHẬT
-- Phải duyệt toàn bộ hàng, rất chậm!
```

**Milvus là gì?**
- Vector database chuyên dụng
- Hỗ trợ indexing HNSW (graph-based)
- Tìm kiếm 10M vectors trong mili-giây
- Thiết kế cho AI/ML workloads

### 1.3 HNSW Index - Cấu Trúc Data Thần Kỳ

**Vấn đề**: Với 10 triệu vectors, không thể so sánh từng cái một!

**Giải pháp**: HNSW (Hierarchical Navigable Small World)
- Tạo một **graph cấu trúc** của vectors
- Như một "bản đồ" của không gian vector
- Tìm kiếm = "điều hướng" trên bản đồ

```
Vector Space (Không gian Vector):
┌─────────────────────────────┐
│  ●(1) ─── ●(2)              │
│   │   \   │                 │
│   │    ●(3)                 │
│  ●(4)     ●(5)              │
│   │      ╱ │                │
│   └─●(6)   │                │
│      │    ●(7)              │
│      └────●(8)              │
│                             │
│ ● Query Vector (Q)          │
│       -> Tìm vectors gần Q  │
└─────────────────────────────┘

Tìm kiếm:
1. Bắt đầu từ entry point ngẫu nhiên
2. Điều hướng theo graph đến vectors gần nhất
3. Trả về top-K vectors
→ NHANH! Chỉ cần kiểm tra vài chục vectors thay vì 10M
```

---

## Phần 2: Collection Workflow Là Gì?

### 2.1 Định Nghĩa Cơ Bản

**Collection Workflow** = Quy trình thiết lập Milvus collection

```
Collection = "Bảng" trong Milvus
		   ≈ "Table" trong PostgreSQL nhưng tối ưu cho vectors
```

### 2.2 Collection vs Table

| Đặc Tính | PostgreSQL Table | Milvus Collection |
|----------|-----------------|------------------|
| Lưu trữ | Rows (dòng) | Vectors (embeddings) |
| Primary Key | INT/UUID | VARCHAR (image_id) |
| Index | B-tree, Hash | HNSW, IVF |
| Search | `WHERE col = value` | `search(query_vector)` |
| Tốc độ Vector | Chậm | Nhanh |

### 2.3 Collection trong SISE

```
Collection: sise_v1

Định nghĩa (Schema):
┌────────────────────────────────────┐
│ Field 1: image_id (PRIMARY KEY)    │
│          UUID của ảnh              │
├────────────────────────────────────┤
│ Field 2: vector (512-chiều)        │
│          Embedding từ CLIP model   │
├────────────────────────────────────┤
│ Field 3: user_id                   │
│          ID người dùng sở hữu      │
├────────────────────────────────────┤
│ Field 4: privacy_level             │
│          Mức độ riêng tư (0/1/2)   │
└────────────────────────────────────┘

Dữ Liệu Ví Dụ (Entities):
┌─────────────────────────────────────┬──────────────────────────────────┐
│ image_id                            │ vector (512 values)              │
├─────────────────────────────────────┼──────────────────────────────────┤
│ 550e8400-e29b-41d4-a716-446655...   │ [0.12, 0.34, ..., 0.99]          │
│ 6ba7b810-9dad-11d1-80b4-00c04f...   │ [0.45, 0.67, ..., 0.23]          │
│ 6ba7b811-9dad-11d1-80b4-00c04f...   │ [0.78, 0.90, ..., 0.56]          │
└─────────────────────────────────────┴──────────────────────────────────┘
```

---

## Phần 3: Collection Workflow - 5 Bước

### Bước 1: Kết Nối đến Milvus

```python
from pymilvus import connections

# Kết nối đến Milvus server
connections.connect(
	alias="default",  # Tên kết nối (có thể có nhiều)
	host="localhost",
	port=19530         # Cổng mặc định Milvus
)
# Bây giờ có thể gọi Milvus API
```

**Collection Adapter**:
```python
def connect_to_milvus(host: str, port: int, alias: str = "default") -> None:
	connections.connect(alias=alias, host=host, port=port)
```

### Bước 2: Kiểm Tra Collection Đã Tồn Tại?

```python
from pymilvus import utility

# Kiểm tra
has_collection = utility.has_collection("sise_v1")
# True nếu tồn tại, False nếu không
```

**Collection Adapter**:
```python
def collection_exists(collection_name: str) -> bool:
	return utility.has_collection(collection_name)
```

**Tại Sao Kiểm Tra?**
- Nếu collection đã tồn tại, không tạo lại (tránh mất dữ liệu)
- Nếu chưa tồn tại, tạo mới

### Bước 3: Xây Dựng Schema (Định Nghĩa Fields)

```python
from pymilvus import CollectionSchema, FieldSchema, DataType

# Định nghĩa từng field
fields = [
	FieldSchema(
		name="image_id",
		dtype=DataType.VARCHAR,
		is_primary=True,      # Đây là primary key
		max_length=36         # Max 36 ký tự (UUID)
	),
	FieldSchema(
		name="vector",
		dtype=DataType.FLOAT_VECTOR,
		dim=512               # 512 chiều
	),
	FieldSchema(
		name="user_id",
		dtype=DataType.INT64
	),
	FieldSchema(
		name="privacy_level",
		dtype=DataType.INT32
	)
]

# Tạo schema từ fields
schema = CollectionSchema(
	fields=fields,
	description="SISE image vectors"
)
```

**Collection Adapter**:
```python
def build_collection_fields(vector_dim: int) -> List[FieldSchema]:
	return [
		FieldSchema(name="image_id", dtype=DataType.VARCHAR, is_primary=True, max_length=36),
		FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=vector_dim),
		FieldSchema(name="user_id", dtype=DataType.INT64),
		FieldSchema(name="privacy_level", dtype=DataType.INT32),
	]
```

### Bước 4: Tạo Collection & Index

#### 4a. Tạo Collection

```python
from pymilvus import Collection

collection = Collection(
	name="sise_v1",
	schema=schema
)
# Collection đã được tạo trong Milvus!
```

**Collection Adapter**:
```python
def create_collection(collection_name: str, fields: List[FieldSchema]) -> Collection:
	schema = CollectionSchema(fields, description="SISE image vectors")
	return Collection(name=collection_name, schema=schema)
```

#### 4b. Tạo HNSW Index

```python
collection.create_index(
	field_name="vector",
	index_params={
		"index_type": "HNSW",  # Loại index
		"params": {
			"M": 16,                # Kết nối tối đa per node
			"ef_construction": 200  # Độ sâu build
		},
		"metric_type": "COSINE"  # Cosine similarity
	}
)
```

**Tham Số HNSW:**
- **M = 16**: Mỗi node trong graph kết nối đến 16 neighbors
  - M nhỏ → tìm kiếm nhanh nhưng kém chính xác
  - M lớn → chính xác nhưng tìm chậm hơn
  - **16 là balanced choice**

- **ef_construction = 200**: Khi xây dựng index
  - Cao hơn → chất lượng index tốt hơn nhưng xây dựng chậm
  - **200 là standard**

- **metric_type = COSINE**: Hàm khoảng cách
  - COSINE: Dùng cho normalized vectors (CLIP output)
  - L2: Euclidean distance
  - IP: Inner product

**Collection Adapter**:
```python
def create_hnsw_index(
	collection: Collection,
	field_name: str,
	index_params: dict,
	metric_type: str,
) -> None:
	collection.create_index(
		field_name=field_name,
		index_params={
			"index_type": "HNSW",
			"params": index_params,
			"metric_type": metric_type,
		},
	)
```

### Bước 5: Tải Collection vào Bộ Nhớ

```python
collection.load()
# Giờ collection sẵn sàng cho tìm kiếm!
```

**Tại Sao Tải vào Bộ Nhớ?**
- Milvus có hai chế độ:
  - **Disk mode**: Collection chỉ nằm trên disk (chậm)
  - **Memory mode**: Collection tải vào RAM (nhanh, ready for queries)
- `collection.load()` = chuyển vào memory mode

**Collection Adapter**:
```python
def load_collection(collection: Collection) -> None:
	collection.load()
```

---

## Phần 4: Xác Thực Idempotent

### Vấn Đề: Nếu Collection Đã Tồn Tại?

Nếu chạy Collection Workflow hai lần, lần thứ hai sẽ gặp lỗi:
```
pymilvus.exceptions.exceptions.CreateCollectionException:
  CreateCollection failed: collection already exists
```

### Giải Pháp: Xác Thực Thay Vì Tạo Lại

**Collection Services Logic**:
```python
def ensure_collection(config: MilvusConfig) -> None:
	# 1. Kết nối
	collection_adapters.connect_to_milvus(config.host, config.port)

	# 2. Kiểm tra tồn tại
	if not collection_adapters.collection_exists(config.collection_name):
		# Tạo mới
		fields = collection_adapters.build_collection_fields(config.vector_dim)
		collection = collection_adapters.create_collection(config.collection_name, fields)
		collection_adapters.create_hnsw_index(collection, "vector", config.index_params, config.metric_type)
		collection_adapters.load_collection(collection)
		return

	# 3. Nếu đã tồn tại -> Xác thực
	collection = collection_adapters.get_collection(config.collection_name)

	# Xác thực schema khớp
	_validate_collection_schema(collection, config.vector_dim)
	# Xác thực index khớp
	_validate_index(collection, config.index_params, config.metric_type)
	# Tải lên bộ nhớ
	collection_adapters.load_collection(collection)
```

### 4.1 Xác Thực Schema

```python
def _validate_collection_schema(collection, vector_dim: int) -> None:
	"""Kiểm tra schema khớp với expected"""
	schema_fields = {field.name: field for field in collection.schema.fields}

	# ✓ Cần có đúng 4 fields
	expected_fields = {"image_id", "vector", "user_id", "privacy_level"}
	if set(schema_fields.keys()) != expected_fields:
		raise CollectionValidationError(f"Unexpected fields: {set(schema_fields.keys())}")

	# ✓ Vector field phải có đúng dimension
	vector_field = schema_fields["vector"]
	if vector_field.dim != vector_dim:
		raise CollectionValidationError(f"Vector dim mismatch. Expected {vector_dim}")

	# ✓ image_id phải là primary key
	if not schema_fields["image_id"].is_primary:
		raise CollectionValidationError("image_id must be primary key")
```

**Checks**:
1. ✓ Đúng 4 fields: image_id, vector, user_id, privacy_level
2. ✓ `vector.dim == 512` (match config)
3. ✓ `image_id` là primary key

### 4.2 Xác Thực Index

```python
def _validate_index(collection, index_params: dict, metric_type: str) -> None:
	"""Kiểm tra index khớp với expected"""
	indexes = collection.get_indexes()

	# Nếu chưa có index -> tạo
	if not indexes:
		collection_adapters.create_hnsw_index(collection, "vector", index_params, metric_type)
		return

	index = indexes[0]
	params = index.params or {}

	# ✓ Index phải target field "vector"
	if index.field_name != "vector":
		raise CollectionValidationError("HNSW index must target vector field")

	# ✓ Index type phải là HNSW
	if params.get("index_type") != "HNSW":
		raise CollectionValidationError("Index type mismatch; expected HNSW")

	# ✓ Metric type phải khớp
	if params.get("metric_type") != metric_type:
		raise CollectionValidationError("Metric type mismatch for HNSW index")

	# ✓ Tham số index phải khớp
	existing_params = params.get("params") or {}
	for key, expected_value in index_params.items():
		if existing_params.get(key) != expected_value:
			raise CollectionValidationError(f"Index param mismatch for {key}")
```

**Checks**:
1. ✓ Index tồn tại trên field `vector`
2. ✓ Index type = HNSW
3. ✓ Metric type = COSINE
4. ✓ M = 16, ef_construction = 200

---

## Phần 5: Kiến Trúc 5-Layer Full

### Layer 5: Router (Entry Point)

```python
# collection_routers.py

class CollectionWorkflowRouter:
	def __init__(self, milvus_config: MilvusConfig) -> None:
		self._milvus_config = milvus_config

	def setup_collection(self) -> None:
		"""Public method gọi từ CLI"""
		collection_services.ensure_collection(self._milvus_config)
```

**Sử dụng**:
```python
config = MilvusConfig(host="localhost", port=19530, ...)
router = CollectionWorkflowRouter(config)
router.setup_collection()  # Chạy workflow
```

### Layer 4: Services (Orchestration)

```python
# collection_services.py

def ensure_collection(config: MilvusConfig) -> None:
	"""Điều phối tạo/xác thực collection"""
	collection_adapters.connect_to_milvus(config.host, config.port)

	if not collection_adapters.collection_exists(config.collection_name):
		# Tạo mới
		fields = collection_adapters.build_collection_fields(config.vector_dim)
		collection = collection_adapters.create_collection(config.collection_name, fields)
		collection_adapters.create_hnsw_index(collection, "vector", config.index_params, config.metric_type)
		collection_adapters.load_collection(collection)
	else:
		# Xác thực
		collection = collection_adapters.get_collection(config.collection_name)
		_validate_collection_schema(collection, config.vector_dim)
		_validate_index(collection, config.index_params, config.metric_type)
		collection_adapters.load_collection(collection)
```

### Layer 3: Adapters (Low-Level)

```python
# collection_adapters.py

def connect_to_milvus(host: str, port: int, alias: str = "default") -> None:
	connections.connect(alias=alias, host=host, port=port)

def collection_exists(collection_name: str) -> bool:
	return utility.has_collection(collection_name)

def build_collection_fields(vector_dim: int) -> List[FieldSchema]:
	return [
		FieldSchema(name="image_id", dtype=DataType.VARCHAR, is_primary=True, max_length=36),
		FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=vector_dim),
		FieldSchema(name="user_id", dtype=DataType.INT64),
		FieldSchema(name="privacy_level", dtype=DataType.INT32),
	]

def create_collection(collection_name: str, fields: List[FieldSchema]) -> Collection:
	schema = CollectionSchema(fields, description="SISE image vectors")
	return Collection(name=collection_name, schema=schema)

def create_hnsw_index(collection: Collection, field_name: str, index_params: dict, metric_type: str) -> None:
	collection.create_index(
		field_name=field_name,
		index_params={"index_type": "HNSW", "params": index_params, "metric_type": metric_type},
	)

def load_collection(collection: Collection) -> None:
	collection.load()
```

### Layer 2: Entities (Config Objects)

```python
# collection_entities.py

from dataclasses import dataclass
from typing import Dict

@dataclass(frozen=True)
class MilvusConfig:
	host: str
	port: int
	collection_name: str
	vector_dim: int
	index_params: Dict[str, int]
	metric_type: str
	search_params: Dict[str, int]
```

**Đặc Điểm**:
- `frozen=True`: Không thể thay đổi sau tạo (bảo vệ config)
- Type hints: Validate tại runtime

### Layer 1: External (Milvus)

```
Milvus Server (localhost:19530)
├── Collection: sise_v1
│   ├── Schema (4 fields)
│   ├── HNSW Index (on vector field)
│   └── Data (vector embeddings + metadata)
└── (Ready for searches from AG-03)
```

---

## Phần 6: Environment Configuration

### storage.env.local

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

### storage_main.py - Xây Dựng Config

```python
# storage_main.py

def _build_configs():
	"""Đọc environment và xây dựng config objects"""

	# Đọc Milvus settings
	milvus_host = os.getenv("MILVUS_HOST", "localhost")
	milvus_port = int(os.getenv("MILVUS_PORT", "19530"))

	# Đọc Collection settings
	collection_name = os.getenv("COLLECTION_NAME", "sise_v1")
	vector_dim = int(os.getenv("COLLECTION_VECTOR_DIM", "512"))
	metric_type = os.getenv("COLLECTION_METRIC_TYPE", "COSINE")

	# Đọc Index parameters
	index_m = int(os.getenv("COLLECTION_INDEX_M", "16"))
	ef_construction = int(os.getenv("COLLECTION_INDEX_EF_CONSTRUCTION", "200"))
	index_params = {"M": index_m, "ef_construction": ef_construction}

	# Đọc Search parameters
	search_ef = int(os.getenv("COLLECTION_SEARCH_EF", "64"))
	search_params = {"ef": search_ef}

	# Xây dựng MilvusConfig
	milvus_config = MilvusConfig(
		host=milvus_host,
		port=milvus_port,
		collection_name=collection_name,
		vector_dim=vector_dim,
		index_params=index_params,
		metric_type=metric_type,
		search_params=search_params,
	)

	return {"collection": milvus_config}

if __name__ == "__main__":
	configs = _build_configs()
	router = CollectionWorkflowRouter(configs["collection"])
	router.setup_collection()
```

---

## Phần 7: Execution Flow - Chi Tiết

```
$ py -3.13 modules/StorageModule/storage_main.py collection

│
├─ [1] Đọc storage.env.local
│      MILVUS_HOST=localhost
│      MILVUS_PORT=19530
│      COLLECTION_NAME=sise_v1
│      COLLECTION_VECTOR_DIM=512
│      etc.
│
├─ [2] Xây dựng MilvusConfig
│      config = MilvusConfig(
│          host="localhost",
│          port=19530,
│          collection_name="sise_v1",
│          vector_dim=512,
│          index_params={"M": 16, "ef_construction": 200},
│          metric_type="COSINE",
│          search_params={"ef": 64}
│      )
│
├─ [3] Tạo CollectionWorkflowRouter
│      router = CollectionWorkflowRouter(config)
│
├─ [4] Gọi setup_collection()
│      router.setup_collection()
│      │
│      └─→ collection_services.ensure_collection(config)
│          │
│          ├─ connect_to_milvus("localhost", 19530)
│          │  ✓ Kết nối đến Milvus
│          │
│          ├─ collection_exists("sise_v1") ?
│          │  │
│          │  ├─ FALSE (collection chưa tồn tại):
│          │  │  │
│          │  │  ├─ fields = build_collection_fields(512)
│          │  │  │  ✓ Xây dựng 4 fields
│          │  │  │
│          │  │  ├─ collection = create_collection("sise_v1", fields)
│          │  │  │  ✓ Tạo collection trong Milvus
│          │  │  │
│          │  │  ├─ create_hnsw_index(collection, "vector", {...}, "COSINE")
│          │  │  │  ✓ Tạo HNSW index
│          │  │  │
│          │  │  └─ load_collection(collection)
│          │  │     ✓ Tải vào bộ nhớ
│          │  │
│          │  └─ TRUE (collection đã tồn tại):
│          │     │
│          │     ├─ collection = get_collection("sise_v1")
│          │     │
│          │     ├─ _validate_collection_schema(collection, 512)
│          │     │  ✓ Kiểm tra 4 fields, dim=512
│          │     │
│          │     ├─ _validate_index(collection, {...}, "COSINE")
│          │     │  ✓ Kiểm tra HNSW, params khớp
│          │     │
│          │     └─ load_collection(collection)
│          │        ✓ Tải vào bộ nhớ
│
└─ [5] Collection sẵn sàng!
   ✓ sise_v1 collection đã được thiết lập
   ✓ HNSW index đã sẵn sàng
   ✓ AG-03 có thể gọi search() ngay
```

---

## Phần 8: So Sánh Collection vs Schema Workflow

| Khía Cạnh | Schema Workflow | Collection Workflow |
|-----------|-----------------|-------------------|
| **Mục đích** | PostgreSQL schema | Milvus collection |
| **Công nghệ** | Alembic + SQLAlchemy | pymilvus |
| **Dữ Liệu** | SQL tables + rows | Vectors + metadata |
| **Index** | B-tree, Hash | HNSW |
| **Validation** | Alembic version track | Schema/Index validation |
| **Idempotent** | Alembic `upgrade head` | `collection_exists()` check |
| **External Dep** | PostgreSQL | Milvus |

---

## Tóm Tắt

1. **Collection Workflow = Thiết lập Milvus collection**
2. **Dữ Liệu = 512-chiều vectors + metadata**
3. **Schema = 4 fields: image_id, vector, user_id, privacy_level**
4. **Index = HNSW trên field `vector`**
5. **Kiến Trúc = 5-layer (Router → Services → Adapters → Entities)**
6. **Xác Thực = Kiểm tra collection tồn tại, schema & index khớp**
7. **Idempotent = Chạy lần thứ 2 không lỗi, chỉ validate**

