# Collection Workflow - Ví Dụ Thực Tế & Code

> **Tài liệu này chứa các ví dụ code thực tế từ mỗi layer, cho phép bạn xem chính xác cách các thành phần hoạt động.**

## Phần 1: Entities Layer - Configuration Objects

### 1.1 MilvusConfig - Dataclass

```python
# modules/StorageModule/app/entities/collection_entities.py

from dataclasses import dataclass
from typing import Dict


@dataclass(frozen=True)
class MilvusConfig:
	"""
	Configuration object cho Collection Workflow.

	frozen=True: Sau khi tạo, không thể thay đổi (immutable).
	"""
	host: str                           # Milvus server host
	port: int                           # Milvus server port
	collection_name: str                # Collection name
	vector_dim: int                     # Vector dimension (512)
	index_params: Dict[str, int]        # HNSW parameters
	metric_type: str                    # Distance metric (COSINE)
	search_params: Dict[str, int]       # Search time parameters


# Ví dụ tạo config
config = MilvusConfig(
	host="localhost",
	port=19530,
	collection_name="sise_v1",
	vector_dim=512,
	index_params={"M": 16, "ef_construction": 200},
	metric_type="COSINE",
	search_params={"ef": 64}
)

# ✓ Sử dụng thuộc tính
print(f"Collection: {config.collection_name}")  # sise_v1
print(f"Vector dim: {config.vector_dim}")       # 512
print(f"Index M: {config.index_params['M']}")   # 16

# ✗ Thay đổi sẽ gặp lỗi (vì frozen=True)
# config.vector_dim = 768  # FrozenInstanceError!
```

### 1.2 Type Hints & Validation

```python
# Type hints giúp detect lỗi khi build config sai

# ✓ Đúng
config = MilvusConfig(
	host="localhost",  # str ✓
	port=19530,        # int ✓
	collection_name="sise_v1",  # str ✓
	vector_dim=512,    # int ✓
	index_params={"M": 16, "ef_construction": 200},  # Dict[str, int] ✓
	metric_type="COSINE",  # str ✓
	search_params={"ef": 64}  # Dict[str, int] ✓
)

# ✗ Sai - kiểu dữ liệu không đúng
config = MilvusConfig(
	host="localhost",
	port="19530",  # ✗ Phải là int, không phải string!
	...
)
# Runtime lỗi hoặc type checker cảnh báo
```

---

## Phần 2: Adapters Layer - Low-Level Milvus API

### 2.1 Connect to Milvus

```python
# modules/StorageModule/app/adapters/collection_adapters.py

from pymilvus import connections


def connect_to_milvus(host: str, port: int, alias: str = "default") -> None:
	"""
	Kết nối đến Milvus server.

	Args:
		host: Milvus server hostname
		port: Milvus server port
		alias: Connection alias (tên gọi)
	"""
	connections.connect(alias=alias, host=host, port=port)
	# Bây giờ có thể dùng pymilvus APIs


# Sử dụng
connect_to_milvus("localhost", 19530)
# ✓ Kết nối thành công
```

**Error Handling**:
```python
try:
	connect_to_milvus("localhost", 19530)
except Exception as e:
	print(f"❌ Connection failed: {e}")
	# Có thể là:
	# - Milvus không chạy
	# - Port sai
	# - Firewall issue
```

### 2.2 Check Collection Exists

```python
from pymilvus import utility


def collection_exists(collection_name: str) -> bool:
	"""
	Kiểm tra collection đã tồn tại.

	Returns:
		True nếu collection tồn tại, False nếu không
	"""
	return utility.has_collection(collection_name)


# Ví dụ
exists = collection_exists("sise_v1")
if exists:
	print("✓ Collection already exists")
else:
	print("✗ Collection not found, need to create")

# Sử dụng để decide
if not collection_exists("sise_v1"):
	# Tạo collection mới
	create_collection("sise_v1", fields)
else:
	# Collection đã có, validate nó
	validate_existing_collection()
```

### 2.3 Build Collection Fields

```python
from pymilvus import FieldSchema, DataType
from typing import List


def build_collection_fields(vector_dim: int) -> List[FieldSchema]:
	"""
	Xây dựng field schema cho collection.

	Args:
		vector_dim: Vector dimension (512)

	Returns:
		List of FieldSchema objects
	"""
	return [
		FieldSchema(
			name="image_id",
			dtype=DataType.VARCHAR,
			is_primary=True,  # ← Primary key!
			max_length=36,    # UUID = 36 chars
		),
		FieldSchema(
			name="vector",
			dtype=DataType.FLOAT_VECTOR,
			dim=vector_dim,   # 512
		),
		FieldSchema(
			name="user_id",
			dtype=DataType.INT64,
		),
		FieldSchema(
			name="privacy_level",
			dtype=DataType.INT32,
		),
	]


# Ví dụ
fields = build_collection_fields(512)

# fields[0] = FieldSchema(name='image_id', dtype=VARCHAR, is_primary=True)
# fields[1] = FieldSchema(name='vector', dtype=FLOAT_VECTOR, dim=512)
# fields[2] = FieldSchema(name='user_id', dtype=INT64)
# fields[3] = FieldSchema(name='privacy_level', dtype=INT32)

for field in fields:
	print(f"{field.name}: {field.dtype}")
	# image_id: DataType.VARCHAR
	# vector: DataType.FLOAT_VECTOR
	# user_id: DataType.INT64
	# privacy_level: DataType.INT32
```

**Các DataTypes**:
| DataType | Sử Dụng | Ví Dụ |
|----------|--------|-------|
| `VARCHAR` | String (max_length phải set) | UUID (36 chars) |
| `FLOAT_VECTOR` | Float arrays | CLIP embeddings (512) |
| `INT64` | 64-bit integers | User IDs |
| `INT32` | 32-bit integers | Privacy levels (0/1/2) |

### 2.4 Create Collection

```python
from pymilvus import Collection, CollectionSchema


def create_collection(collection_name: str, fields: List[FieldSchema]) -> Collection:
	"""
	Tạo collection mới trong Milvus.

	Args:
		collection_name: Tên collection
		fields: List of FieldSchema

	Returns:
		Collection object
	"""
	schema = CollectionSchema(
		fields=fields,
		description="SISE image vectors"
	)
	return Collection(name=collection_name, schema=schema)


# Ví dụ
fields = build_collection_fields(512)
collection = create_collection("sise_v1", fields)

# ✓ Collection đã được tạo trong Milvus!
# Nhưng chưa có dữ liệu
```

**Cấu Trúc CollectionSchema**:
```
CollectionSchema
├── fields: [FieldSchema(...), FieldSchema(...), ...]
└── description: "SISE image vectors"
```

### 2.5 Create HNSW Index

```python
def create_hnsw_index(
	collection: Collection,
	field_name: str,
	index_params: dict,
	metric_type: str,
) -> None:
	"""
	Tạo HNSW index cho collection.

	Args:
		collection: Collection object
		field_name: Field name to index (usually "vector")
		index_params: {"M": 16, "ef_construction": 200}
		metric_type: "COSINE", "L2", or "IP"
	"""
	collection.create_index(
		field_name=field_name,
		index_params={
			"index_type": "HNSW",
			"params": index_params,
			"metric_type": metric_type,
		},
	)


# Ví dụ
collection.create_index(
	field_name="vector",
	index_params={
		"index_type": "HNSW",
		"params": {
			"M": 16,              # Max connections per node
			"ef_construction": 200  # Depth during index building
		},
		"metric_type": "COSINE",  # Distance metric
	}
)

# ✓ HNSW index được tạo trên field "vector"
```

**HNSW Parameters Chi Tiết**:

```python
{
	"M": 16,
	# ├─ Số kết nối tối đa cho mỗi node
	# ├─ M = 4-64 tuỳ thuộc workload
	# ├─ M nhỏ (4-8): Tìm kiếm nhanh, chứa ít data
	# ├─ M lớn (32-64): Chính xác tốt hơn, tìm chậm hơn
	# └─ 16 là balanced choice

	"ef_construction": 200,
	# ├─ Beam width khi xây dựng index
	# ├─ Cao hơn → chất lượng index tốt → xây chậm hơn
	# └─ 200 là standard
}

# Metric Type
"COSINE"    # Cosine similarity (dùng cho normalized vectors)
"L2"        # Euclidean distance
"IP"        # Inner product
```

### 2.6 Load Collection

```python
def load_collection(collection: Collection) -> None:
	"""
	Tải collection vào bộ nhớ (ready for queries).

	Milvus có hai chế độ:
	- Memory: Collection trong RAM (nhanh, sẵn sàng search)
	- Disk: Collection trên disk (chậm, tiết kiệm RAM)
	"""
	collection.load()


# Ví dụ
collection = create_collection("sise_v1", fields)
create_hnsw_index(collection, "vector", {...}, "COSINE")
load_collection(collection)

# ✓ Collection đã sẵn sàng cho tìm kiếm!
```

### 2.7 Get Existing Collection

```python
def get_collection(collection_name: str) -> Collection:
	"""
	Lấy reference đến collection đã tồn tại.

	Dùng khi collection đã được tạo trước đó.
	"""
	return Collection(collection_name)


# Ví dụ
collection = get_collection("sise_v1")  # Lấy collection đã tồn tại
indexes = collection.indexes  # Kiểm tra indexes
print(f"Indexes: {indexes}")
```

### 2.8 Get Indexes

```python
def get_indexes(collection: Collection):
	"""
	Lấy danh sách indexes trên collection.

	Returns:
		List of Index objects
	"""
	return collection.indexes


# Ví dụ
collection = get_collection("sise_v1")
indexes = get_indexes(collection)

if indexes:
	index = indexes[0]
	print(f"Index type: {index.params.get('index_type')}")
	# Output: HNSW
else:
	print("No indexes found")
```

---

## Phần 3: Services Layer - Orchestration Logic

### 3.1 Ensure Collection - Main Function

```python
# modules/StorageModule/app/services/collection_services.py

from app.adapters import collection_adapters
from app.entities.collection_entities import MilvusConfig


def ensure_collection(config: MilvusConfig) -> None:
	"""
	Main orchestration function: tạo hoặc xác thực collection.

	Workflow:
	1. Kết nối đến Milvus
	2. Kiểm tra collection tồn tại
	3. Nếu không → Tạo mới (schema + index + load)
	4. Nếu có → Xác thực schema & index, rồi load

	Args:
		config: MilvusConfig object

	Raises:
		CollectionValidationError: Schema/index không khớp
	"""
	# Step 1: Kết nối
	collection_adapters.connect_to_milvus(config.host, config.port)

	# Step 2: Kiểm tra tồn tại
	if not collection_adapters.collection_exists(config.collection_name):
		# ← CREATE PATH
		print(f"Creating collection {config.collection_name}...")

		fields = collection_adapters.build_collection_fields(config.vector_dim)
		collection = collection_adapters.create_collection(
			config.collection_name,
			fields,
		)
		collection_adapters.create_hnsw_index(
			collection,
			field_name="vector",
			index_params=config.index_params,
			metric_type=config.metric_type,
		)
		collection_adapters.load_collection(collection)
		print("✓ Collection created successfully")
		return

	# ← VALIDATE PATH
	print(f"Collection {config.collection_name} exists, validating...")

	collection = collection_adapters.get_collection(config.collection_name)
	_validate_collection_schema(collection, config.vector_dim)
	_validate_index(collection, config.index_params, config.metric_type)
	collection_adapters.load_collection(collection)
	print("✓ Collection validated successfully")


# Ví dụ sử dụng
config = MilvusConfig(
	host="localhost",
	port=19530,
	collection_name="sise_v1",
	vector_dim=512,
	index_params={"M": 16, "ef_construction": 200},
	metric_type="COSINE",
	search_params={"ef": 64}
)

ensure_collection(config)
# Lần thứ 1: "Creating collection..."
# Lần thứ 2: "Collection exists, validating..."
```

### 3.2 Validate Collection Schema

```python
def _validate_collection_schema(collection, vector_dim: int) -> None:
	"""
	Xác thực collection schema khớp với expected schema.

	Checks:
	1. Có đúng 4 fields: image_id, vector, user_id, privacy_level
	2. Field 'vector' có dim = 512
	3. Field 'image_id' là primary key

	Raises:
		CollectionValidationError: Schema không khớp
	"""
	schema_fields = {field.name: field for field in collection.schema.fields}

	# Check 1: Exact fields
	expected_fields = {"image_id", "vector", "user_id", "privacy_level"}
	actual_fields = set(schema_fields.keys())
	if actual_fields != expected_fields:
		raise CollectionValidationError(
			f"Unexpected fields. Expected {expected_fields}, got {actual_fields}"
		)

	# Check 2: Vector dimension
	vector_field = schema_fields["vector"]
	if getattr(vector_field, "dim", None) != vector_dim:
		raise CollectionValidationError(
			f"Vector dim mismatch. Expected {vector_dim}, got {getattr(vector_field, 'dim', 'N/A')}"
		)

	# Check 3: image_id is primary key
	if not schema_fields["image_id"].is_primary:
		raise CollectionValidationError("Field 'image_id' must be primary key")


# Ví dụ
collection = get_collection("sise_v1")

try:
	_validate_collection_schema(collection, 512)
	print("✓ Schema is valid")
except CollectionValidationError as e:
	print(f"✗ Schema validation failed: {e}")
```

### 3.3 Validate Index

```python
def _validate_index(
	collection, 
	index_params: dict, 
	metric_type: str
) -> None:
	"""
	Xác thực collection index khớp với expected index.

	Checks:
	1. HNSW index tồn tại trên field 'vector'
	2. Index type = HNSW
	3. Metric type khớp
	4. Tất cả tham số (M, ef_construction) khớp

	Raises:
		CollectionValidationError: Index không khớp
	"""
	indexes = collection_adapters.get_indexes(collection)

	# Nếu chưa có index -> tạo
	if not indexes:
		print("No indexes found, creating HNSW index...")
		collection_adapters.create_hnsw_index(
			collection,
			field_name="vector",
			index_params=index_params,
			metric_type=metric_type,
		)
		return

	# Lấy index đầu tiên
	index = indexes[0]
	params = index.params or {}

	# Check 1: Field name
	if index.field_name != "vector":
		raise CollectionValidationError(
			f"HNSW index must target 'vector' field, found '{index.field_name}'"
		)

	# Check 2: Index type
	if params.get("index_type") != "HNSW":
		raise CollectionValidationError(
			f"Index type mismatch. Expected HNSW, got {params.get('index_type')}"
		)

	# Check 3: Metric type
	existing_metric = params.get("metric_type")
	if existing_metric != metric_type:
		raise CollectionValidationError(
			f"Metric type mismatch. Expected {metric_type}, got {existing_metric}"
		)

	# Check 4: Index parameters
	existing_params = params.get("params") or {}
	for key, expected_value in index_params.items():
		actual_value = existing_params.get(key)
		if actual_value != expected_value:
			raise CollectionValidationError(
				f"Index param mismatch for '{key}'. Expected {expected_value}, got {actual_value}"
			)


# Ví dụ
collection = get_collection("sise_v1")

try:
	_validate_index(
		collection,
		index_params={"M": 16, "ef_construction": 200},
		metric_type="COSINE"
	)
	print("✓ Index is valid")
except CollectionValidationError as e:
	print(f"✗ Index validation failed: {e}")
```

### 3.4 Custom Exception

```python
class CollectionValidationError(ValueError):
	"""Custom exception cho collection validation errors"""
	pass


# Sử dụng
try:
	ensure_collection(config)
except CollectionValidationError as e:
	print(f"Validation error: {e}")
	# Handle error
```

---

## Phần 4: Routers Layer - Entry Point

### 4.1 CollectionWorkflowRouter

```python
# modules/StorageModule/app/routers/collection_routers.py

from app.entities.collection_entities import MilvusConfig
from app.services import collection_services


class CollectionWorkflowRouter:
	"""
	Entry point cho Collection Workflow.

	Trách nhiệm:
	- Nhận config
	- Dispatch đến services

	Không đúng:
	- Thực hiện logic trực tiếp
	- Gọi adapters
	"""

	def __init__(self, milvus_config: MilvusConfig) -> None:
		"""
		Khởi tạo router.

		Args:
			milvus_config: MilvusConfig object
		"""
		self._milvus_config = milvus_config

	def setup_collection(self) -> None:
		"""
		Public method: Thực hiện Collection Workflow.

		Gọi collection_services.ensure_collection()
		"""
		collection_services.ensure_collection(self._milvus_config)


# Ví dụ
config = MilvusConfig(
	host="localhost",
	port=19530,
	collection_name="sise_v1",
	vector_dim=512,
	index_params={"M": 16, "ef_construction": 200},
	metric_type="COSINE",
	search_params={"ef": 64}
)

router = CollectionWorkflowRouter(config)
router.setup_collection()  # Thực hiện workflow
```

---

## Phần 5: CLI Entry Point

### 5.1 storage_main.py - Build Config

```python
# modules/StorageModule/storage_main.py

import os
import argparse
from app.routers.collection_routers import CollectionWorkflowRouter
from app.entities.collection_entities import MilvusConfig


def _build_configs():
	"""
	Đọc environment variables và xây dựng config objects.

	Đọc từ:
	- Environment variables
	- storage.env.local (nếu tồn tại)

	Returns:
		Dict[str, Config]: {"collection": MilvusConfig}
	"""

	# Milvus connection settings
	milvus_host = os.getenv("MILVUS_HOST", "localhost")
	milvus_port = int(os.getenv("MILVUS_PORT", "19530"))

	# Collection settings
	collection_name = os.getenv("COLLECTION_NAME", "sise_v1")
	vector_dim = int(os.getenv("COLLECTION_VECTOR_DIM", "512"))
	metric_type = os.getenv("COLLECTION_METRIC_TYPE", "COSINE")

	# HNSW index parameters
	index_m = int(os.getenv("COLLECTION_INDEX_M", "16"))
	ef_construction = int(os.getenv("COLLECTION_INDEX_EF_CONSTRUCTION", "200"))
	index_params = {"M": index_m, "ef_construction": ef_construction}

	# Search parameters
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


def main():
	"""Main CLI dispatcher"""
	parser = argparse.ArgumentParser(description="StorageModule CLI")
	parser.add_argument(
		"workflow",
		choices=["schema", "collection", "bucket", "seed", "all"],
		help="Workflow to execute"
	)

	args = parser.parse_args()
	configs = _build_configs()

	if args.workflow == "collection":
		router = CollectionWorkflowRouter(configs["collection"])
		router.setup_collection()
	elif args.workflow == "all":
		# Thực hiện tất cả workflows
		router = CollectionWorkflowRouter(configs["collection"])
		router.setup_collection()
		# ... các workflow khác


if __name__ == "__main__":
	main()
```

### 5.2 Execution

```bash
# Chạy Collection Workflow
$ py -3.13 modules/StorageModule/storage_main.py collection

# Output:
# Creating collection sise_v1...
# ✓ Collection created successfully
```

---

## Phần 6: Test Script

### 6.1 test_collection_workflow.py

```python
# modules/StorageModule/tests/test_collection_workflow.py

#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Load env file
script_dir = Path(__file__).parent
workspace_root = script_dir.parent.parent
env_file = workspace_root / "modules" / "StorageModule" / "configs" / "storage.env.local"

def load_env_from_file(filepath: str) -> dict:
	"""Load environment variables từ config file"""
	env_vars = {}
	with open(filepath, 'r') as f:
		for line in f:
			line = line.strip()
			if line and not line.startswith("#"):
				if "=" in line:
					key, value = line.split("=", 1)
					env_vars[key.strip()] = value.strip()
	return env_vars

# Load env
env_vars = load_env_from_file(str(env_file))
for key, value in env_vars.items():
	if value:
		os.environ[key] = value

# Thêm modules vào path
sys.path.insert(0, str(workspace_root / "modules" / "StorageModule"))

# Import
from app.entities.collection_entities import MilvusConfig
from app.routers.collection_routers import CollectionWorkflowRouter

# Build config
milvus_config = MilvusConfig(
	host=os.getenv("MILVUS_HOST", "localhost"),
	port=int(os.getenv("MILVUS_PORT", "19530")),
	collection_name=os.getenv("COLLECTION_NAME", "sise_v1"),
	vector_dim=int(os.getenv("COLLECTION_VECTOR_DIM", "512")),
	index_params={
		"M": int(os.getenv("COLLECTION_INDEX_M", "16")),
		"ef_construction": int(os.getenv("COLLECTION_INDEX_EF_CONSTRUCTION", "200")),
	},
	metric_type=os.getenv("COLLECTION_METRIC_TYPE", "COSINE"),
	search_params={"ef": int(os.getenv("COLLECTION_SEARCH_EF", "64"))},
)

# Run
router = CollectionWorkflowRouter(milvus_config)
router.setup_collection()

print("✓ Collection workflow completed successfully!")
```

---

## Phần 7: Complete Execution Flow

```
$ py -3.13 modules/StorageModule/storage_main.py collection

┌────────────────────────────────────────────────────┐
│ storage_main.py									 │
│ ├─ _build_configs()								 │
│ │  ├─ Read MILVUS_HOST=localhost					 │
│ │  ├─ Read MILVUS_PORT=19530						 │
│ │  ├─ Read COLLECTION_NAME=sise_v1			     │
│ │  ├─ Read COLLECTION_VECTOR_DIM=512				 │
│ │  └─ Return MilvusConfig object					 │
│ │													 │
│ ├─ Create CollectionWorkflowRouter				 │
│ │													 │
│ └─ router.setup_collection()						 │
│    │												 │
│    └─ collection_services.ensure_collection()		 │
│       │											 │
│       ├─ connect_to_milvus(localhost, 19530)		 │
│       │  └─ pymilvus.connections.connect()		 │
│       │     ✓ Connected to Milvus					 │
│       │											 │
│       ├─ collection_exists("sise_v1")				 │
│       │  └─ pymilvus.utility.has_collection(")	 │
│       │     → False (doesn't exist)				 │
│       │											 │
│       ├─ build_collection_fields(512)				 │
│       │  └─ [FieldSchema(...), ...]				 │
│       │     ✓ 4 fields defined					 │
│       │											 │
│       ├─ create_collection("sise_v1", fields)		 │
│       │  └─ Collection(name="sise_v1", ...)		 │
│       │     ✓ Collection created					 │
│       │											 │
│       ├─ create_hnsw_index(collection, ...)		 │
│       │  └─ collection.create_index(...)			 │
│       │     ✓ HNSW index created					 │
│       │											 │
│       └─ load_collection(collection)				 │
│          └─ collection.load()						 │
│             ✓ Collection loaded to memory			 │
│													 │
└────────────────────────────────────────────────────┘

✓ Collection sise_v1 is ready for vector search!
```

---

## Phần 8: Real Data Example

### 8.1 Thêm Vector Data (được AG-03 làm)

```python
# Ví dụ: Seed workflow sẽ thêm vectors như này

from pymilvus import Collection

# Lấy collection (đã setup bởi Collection Workflow)
collection = Collection("sise_v1")

# Chuẩn bị dữ liệu
image_ids = [
	"550e8400-e29b-41d4-a716-446655440000",
	"6ba7b810-9dad-11d1-80b4-00c04fd430c8",
]

vectors = [
	[0.1, 0.2, 0.3, ..., 0.9],  # 512 values
	[0.2, 0.3, 0.4, ..., 0.8],  # 512 values
]

user_ids = [42, 43]
privacy_levels = [0, 1]

# Insert data
collection.insert(
	data={
		"image_id": image_ids,
		"vector": vectors,
		"user_id": user_ids,
		"privacy_level": privacy_levels,
	}
)

# ✓ Dữ liệu đã được insert vào collection
```

### 8.2 Search Vector (được AG-03 làm)

```python
# Tìm kiếm 10 ảnh giống nhất với query_vector

from pymilvus import Collection

collection = Collection("sise_v1")

# Query vector (output từ CLIP model)
query_vector = [0.15, 0.25, 0.35, ..., 0.95]  # 512 dimensions

# Search
results = collection.search(
	data=[query_vector],
	anns_field="vector",
	param={"metric_type": "COSINE", "params": {"ef": 64}},
	limit=10,  # Trả về top 10
	output_fields=["image_id", "user_id", "privacy_level"]
)

# results[0] = list of top 10 similar vectors
for hit in results[0]:
	print(f"Image: {hit.entity.get('image_id')}, Distance: {hit.distance}")

# ✓ Tìm kiếm hoàn tất trong mili-giây!
```

---

## Tóm Tắt Ví Dụ

| Layer | Tệp | Chức Năng | Ví Dụ Hàm |
|-------|-----|---------|---------|
| **5. Router** | `collection_routers.py` | Entry point | `CollectionWorkflowRouter.setup_collection()` |
| **4. Services** | `collection_services.py` | Orchestration | `ensure_collection(config)` |
| **3. Adapters** | `collection_adapters.py` | Low-level API | `connect_to_milvus()`, `create_index()` |
| **2. Entities** | `collection_entities.py` | Config objects | `MilvusConfig(...)` |
| **1. External** | Milvus server | Storage | Collection `sise_v1` with HNSW index |

