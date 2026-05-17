# Collection Workflow - Hướng Dẫn Toàn Diện

## Mục Lục
1. [Tổng Quan Nhanh](#tổng-quan-nhanh)
2. [Collection Workflow Là Gì?](#collection-workflow-là-gì)
3. [Tại Sao Cần Collection Workflow?](#tại-sao-cần-collection-workflow)
4. [Dữ Liệu & Cấu Trúc](#dữ-liệu--cấu-trúc)
5. [Kiến Trúc 5 Lớp](#kiến-trúc-5-lớp)
6. [Các Thành Phần Chính](#các-thành-phần-chính)
7. [Danh Sách Kiểm Tra (Checklist)](#danh-sách-kiểm-tra)
8. [Bắt Đầu Nhanh](#bắt-đầu-nhanh)

---

## Tổng Quan Nhanh

| Khía Cạnh | Chi Tiết |
|-----------|---------|
| **Vai Trò** | Thiết lập và quản lý Milvus vector collection để lưu trữ embedding vector ảnh |
| **Dữ Liệu** | Vector embedding (512 chiều), metadata ảnh (image_id, user_id, privacy_level) |
| **Công Nghệ** | Milvus 2.4.x, HNSW indexing, pymilvus client |
| **Kết Quả** | Collection `sise_v1` sẵn sàng cho AI inference & tìm kiếm vector |
| **Trạng Thái** | Chỉ thiết lập cơ sở hạ tầng, KHÔNG xử lý dữ liệu kinh doanh |

---

## Collection Workflow Là Gì?

**Collection Workflow** là một quy trình thiết lập và xác thực **Milvus vector collection** cho SISE.

### Định Nghĩa Chi Tiết

```
Collection Workflow = Tạo collection + Định nghĩa schema + Tạo index HNSW + Tải collection vào bộ nhớ
```

### Bối Cảnh Kiến Trúc

Trong StorageModule Phase 1, Collection Workflow xử lý một trong năm trách nhiệm chính:

```
StorageModule
├── Schema Workflow    ← PostgreSQL schema (tables, indexes)
├── Collection Workflow ← Milvus collection (vector storage)  ← BẠN ĐANG XEM ĐÂY
├── Bucket Workflow    ← MinIO buckets (image storage)
├── Seed Workflow      ← Initial data
└── Infra Compose      ← Docker service orchestration
```

**Collection Workflow không**:
- Tạo hoặc quản lý ứng dụng backend
- Thực hiện AI inference
- Thực hiện tìm kiếm vector (đó là trách nhiệm của AG-03)
- Xử lý quy tắc bảo mật hoặc quyền riêng tư

---

## Tại Sao Cần Collection Workflow?

### 1. **Lưu Trữ Vector Embedding Hiệu Quả**

Hình ảnh trong SISE được chuyển đổi thành **vector embedding** (512 chiều) bằng CLIP model. Các vector này cần được lưu trữ trong một **cơ sở dữ liệu vector** để:
- Tìm kiếm nhanh (similarity search)
- Truy vấn `k` hình ảnh gần nhất (KNN search)
- Hỗ trợ các tính năng như "tìm hình ảnh giống nhau"

### 2. **Indexing Hiệu Quả**

PostgreSQL không được thiết kế cho tìm kiếm vector. Milvus là một cơ sở dữ liệu **chuyên dụng** cho vector search với:
- **HNSW (Hierarchical Navigable Small World)**: Cấu trúc index graph tối ưu cho tìm kiếm gần đúng nhanh
- Hỗ trợ các metric khoảng cách: `COSINE`, `L2`, `IP`
- Performance cao ngay cả với miliions vectors

### 3. **Chuẩn Bị Cơ Sở Hạ Tầng**

Workflow này đảm bảo rằng:
- Milvus đang chạy và sẵn sàng kết nối
- Collection với schema chính xác được tạo
- Index được tạo với các tham số tối ưu
- Collection được tải vào bộ nhớ (ready for queries)

### 4. **Xác Thực Idempotent**

Nếu collection đã tồn tại:
- Kiểm tra schema khớp với expected schema
- Kiểm tra index khớp với expected index
- Tránh tạo trùng lặp

---

## Dữ Liệu & Cấu Trúc

### Schema Collection

Collection `sise_v1` bao gồm **4 trường (fields)**:

| Trường | Kiểu Dữ Liệu | Mô Tả | Ví Dụ |
|--------|-------------|-------|-------|
| `image_id` | `VARCHAR(36)` | **Primary key**, UUID của ảnh | `"550e8400-e29b-41d4-a716-446655440000"` |
| `vector` | `FLOAT_VECTOR(512)` | Embedding 512-chiều từ CLIP | `[0.123, 0.456, ..., 0.789]` (512 phần tử) |
| `user_id` | `INT64` | ID người dùng sở hữu ảnh | `12345` |
| `privacy_level` | `INT32` | Mức độ riêng tư (0=public, 1=private, 2=friends-only) | `0` |

### Ví Dụ Entity Trong Collection

```json
{
  "image_id": "550e8400-e29b-41d4-a716-446655440000",
  "vector": [0.1234, 0.5678, ..., 0.9012],  // 512 chiều
  "user_id": 42,
  "privacy_level": 0
}
```

### Index Configuration (HNSW)

Collection sử dụng **HNSW index** trên trường `vector`:

| Tham Số | Giá Trị | Ý Nghĩa |
|---------|--------|--------|
| `index_type` | `"HNSW"` | Loại index: Hierarchical Navigable Small World |
| `M` | `16` | Số kết nối tối đa cho mỗi node trong graph |
| `ef_construction` | `200` | Độ sâu tìm kiếm khi xây dựng index |
| `metric_type` | `"COSINE"` | Hàm khoảng cách: similarity theo cosine |

### Ví Dụ Search Query (được AG-03 thực hiện)

```python
# Tìm 10 ảnh giống nhất với query_vector
results = collection.search(
	data=[query_vector],  # query embedding
	anns_field="vector",
	param={"metric_type": "COSINE", "params": {"ef": 64}},
	limit=10,  # trả về top 10 kết quả
	output_fields=["image_id", "user_id", "privacy_level"]
)
```

---

## Kiến Trúc 5 Lớp

Collection Workflow tuân theo **kiến trúc 5 lớp** giống như Schema Workflow:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 5: ROUTERS                                        │
│ ┌──────────────────────────────────────────────────┐    │
│ │ CollectionWorkflowRouter                         │    │
│ │ - setup_collection()                             │    │
│ └──────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────┘
			   │ imports & uses
┌─────────────────────────────────────────────────────────┐
│ Layer 4: SERVICES                                       │
│ ┌──────────────────────────────────────────────────┐    │
│ │ collection_services.ensure_collection()          │    │
│ │ - Điều phối tạo / xác thực collection            │    │
│ │ - Gọi adapters để tương tác Milvus               │    │
│ └──────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────┘
			   │ imports & uses
┌─────────────────────────────────────────────────────────┐
│ Layer 3: ADAPTERS                                       │
│ ┌──────────────────────────────────────────────────┐    │
│ │ collection_adapters                              │    │
│ │ - connect_to_milvus()                            │    │
│ │ - build_collection_fields()                      │    │
│ │ - create_collection()                            │    │
│ │ - create_hnsw_index()                            │    │
│ │ - load_collection()                              │    │
│ │ - collection_exists() / get_collection()         │    │
│ └──────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────┘
			   │ imports & uses
┌─────────────────────────────────────────────────────────┐
│ Layer 2: ENTITIES (Configuration Objects)               │
│ ┌──────────────────────────────────────────────────┐    │
│ │ MilvusConfig (frozen dataclass)                  │    │
│ │ - host, port                                     │    │
│ │ - collection_name, vector_dim                    │    │
│ │ - index_params, metric_type                      │    │
│ │ - search_params                                  │    │
│ └──────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────┘
			   │
┌─────────────────────────────────────────────────────────┐
│ Layer 1: EXTERNAL (Milvus Vector Database)              │
│ ┌──────────────────────────────────────────────────┐    │
│ │ Milvus 2.4.x                                     │    │
│ │ - Collection storage                             │    │
│ │ - HNSW indexing                                  │    │
│ │ - Vector search execution                        │    │
│ └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Các Thành Phần Chính

### 1️⃣ **Entities Layer** - `collection_entities.py`

**Mục đích**: Định nghĩa các đối tượng cấu hình (configuration dataclasses).

**Trách nhiệm**:
- Chứa `MilvusConfig`: frozen dataclass với tất cả tham số cần thiết
- Validate kiểu dữ liệu thông qua type hints

**Không được**:
- Thực hiện logic Milvus
- Kết nối đến Milvus
- Tạo collection

**Ví dụ sử dụng**:
```python
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

---

### 2️⃣ **Adapters Layer** - `collection_adapters.py`

**Mục đích**: Cấp thấp Milvus API wrapping.

**Trách nhiệm**:
- Kết nối đến Milvus (`connect_to_milvus`)
- Kiểm tra collection tồn tại (`collection_exists`)
- Xây dựng schema fields (`build_collection_fields`)
- Tạo collection (`create_collection`)
- Tạo HNSW index (`create_hnsw_index`)
- Tải collection vào bộ nhớ (`load_collection`)
- Truy xuất collection hiện có (`get_collection`)

**Không được**:
- Thực hiện logic xác thực phức tạp
- Quyết định khi nào tạo/xác thực
- Gọi services

**Ví dụ adapter call**:
```python
# Thấp tầng, gọi trực tiếp pymilvus
fields = collection_adapters.build_collection_fields(vector_dim=512)
collection = collection_adapters.create_collection("sise_v1", fields)
collection_adapters.create_hnsw_index(collection, "vector", {...})
```

---

### 3️⃣ **Services Layer** - `collection_services.py`

**Mục đích**: Điều phối logic Collection Workflow.

**Trách nhiệm**:
- `ensure_collection()`: Hàm chính - tạo hoặc xác thực collection
- Xác thực schema (`_validate_collection_schema`)
- Xác thực index (`_validate_index`)
- Xử lý trường hợp collection đã tồn tại

**Không được**:
- Gọi Milvus trực tiếp (phải qua adapters)
- Xử lý CLI hoặc routing

**Ví dụ service logic**:
```python
def ensure_collection(config: MilvusConfig) -> None:
	# 1. Kết nối
	collection_adapters.connect_to_milvus(config.host, config.port)

	# 2. Nếu chưa tồn tại -> tạo mới
	if not collection_adapters.collection_exists(config.collection_name):
		fields = collection_adapters.build_collection_fields(config.vector_dim)
		collection = collection_adapters.create_collection(config.collection_name, fields)
		collection_adapters.create_hnsw_index(collection, "vector", config.index_params, config.metric_type)
		collection_adapters.load_collection(collection)
		return

	# 3. Nếu đã tồn tại -> xác thực
	collection = collection_adapters.get_collection(config.collection_name)
	_validate_collection_schema(collection, config.vector_dim)
	_validate_index(collection, config.index_params, config.metric_type)
	collection_adapters.load_collection(collection)
```

---

### 4️⃣ **Routers Layer** - `collection_routers.py`

**Mục đích**: Entry point cho Collection Workflow.

**Trách nhiệm**:
- `CollectionWorkflowRouter`: Class chứa workflow methods
- `setup_collection()`: Gọi `collection_services.ensure_collection()`

**Không được**:
- Thực hiện logic - chỉ dispatch
- Gọi adapters trực tiếp

**Ví dụ router usage**:
```python
config = MilvusConfig(...)
router = CollectionWorkflowRouter(config)
router.setup_collection()  # Thực hiện workflow
```

---

### 5️⃣ **Configuration** - `storage.env.local`

**Mục đích**: Lưu trữ collection workflow parameters.

**Nội dung**:
```ini
# Milvus connection
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Collection schema
COLLECTION_NAME=sise_v1
COLLECTION_VECTOR_DIM=512
COLLECTION_METRIC_TYPE=COSINE

# HNSW index parameters
COLLECTION_INDEX_TYPE=HNSW
COLLECTION_INDEX_M=16
COLLECTION_INDEX_EF_CONSTRUCTION=200

# Search parameters
COLLECTION_SEARCH_EF=64
```

---

### 6️⃣ **Main CLI** - `storage_main.py`

**Mục đích**: CLI entry point cho tất cả workflows.

**Trách nhiệm**:
- Parse command-line arguments
- Đọc `storage.env.local`
- Xây dựng `MilvusConfig` từ environment
- Tạo `CollectionWorkflowRouter`
- Gọi `setup_collection()`

**Ví dụ**:
```bash
py -3.13 modules/StorageModule/storage_main.py collection
```

---

### 7️⃣ **Test Script** - `test_collection_workflow.py`

**Mục đích**: Validation script để kiểm tra collection workflow riêng biệt.

**Trách nhiệm**:
- Tải environment variables từ `storage.env.local`
- Validate imports
- Instantiate entities
- Gọi router
- Report kết quả

---

## Danh Sách Kiểm Tra

### Tệp Bắt Buộc

Collection Workflow yêu cầu các tệp sau phải tồn tại:

```
modules/StorageModule/
├── app/
│   ├── entities/
│   │   └── collection_entities.py          ✓ MilvusConfig
│   ├── adapters/
│   │   └── collection_adapters.py          ✓ Low-level Milvus API
│   ├── services/
│   │   └── collection_services.py          ✓ Orchestration logic
│   └── routers/
│       └── collection_routers.py           ✓ Entry point
├── configs/
│   └── storage.env.local                   ✓ Environment variables
├── storage_main.py                         ✓ CLI dispatcher
├── storage_requirements.txt                ✓ Dependencies (pymilvus, etc.)
└── tests/
	└── test_collection_workflow.py         ✓ Validation script
```

### Cấu Hình Bắt Buộc

`storage.env.local` phải chứa:
- `MILVUS_HOST` (default: `localhost`)
- `MILVUS_PORT` (default: `19530`)
- `COLLECTION_NAME` (default: `sise_v1`)
- `COLLECTION_VECTOR_DIM` (phải = `512`)
- `COLLECTION_METRIC_TYPE` (default: `COSINE`)
- `COLLECTION_INDEX_M` (default: `16`)
- `COLLECTION_INDEX_EF_CONSTRUCTION` (default: `200`)
- `COLLECTION_SEARCH_EF` (default: `64`)

### Phụ Thuộc Ngoài

- **Milvus 2.4.x**: Phải đang chạy tại `MILVUS_HOST:MILVUS_PORT`
- **Python 3.13+**: pymilvus, dataclasses
- **Docker Compose**: `infra_compose_storage.yml` định nghĩa Milvus service

### Output Kỳ Vọng

Sau khi `ensure_collection(config)` thành công:
- Collection `sise_v1` tồn tại trong Milvus
- Schema với 4 fields được tạo (image_id, vector, user_id, privacy_level)
- HNSW index trên `vector` field được tạo
- Collection đã được tải vào bộ nhớ (ready for searches)

---

## Bắt Đầu Nhanh

### 1️⃣ Kiểm Tra Milvus Đang Chạy

```bash
# Từ E:\SISE\
cd modules/StorageModule
./start_storage_stack.ps1 status
```

Output: `milvus-0 is running`

### 2️⃣ Cấu Hình Environment

Mở `modules/StorageModule/configs/storage.env.local` và đảm bảo:

```ini
MILVUS_HOST=localhost
MILVUS_PORT=19530
COLLECTION_NAME=sise_v1
COLLECTION_VECTOR_DIM=512
```

### 3️⃣ Chạy Collection Workflow

**Cách 1: Qua CLI chính**
```bash
py -3.13 modules/StorageModule/storage_main.py collection
```

**Cách 2: Qua test script**
```bash
py -3.13 modules/StorageModule/tests/test_collection_workflow.py
```

### 4️⃣ Xác Thực Thành Công

Output:
```
[STEP 3] Calling setup_collection()...
✓ Collection setup completed successfully!
✓ Collection name: sise_v1
✓ Vector dimension: 512
✓ Index type: HNSW
```

---

## Sơ Đồ Luồng Hoàn Chỉnh

```
storage_main.py
	│
	├─ Đọc environment
	│
	├─ Xây dựng MilvusConfig
	│     ├─ host, port
	│     ├─ collection_name
	│     ├─ vector_dim
	│     ├─ index_params
	│     └─ metric_type
	│
	└─ Tạo CollectionWorkflowRouter
			│
			└─ setup_collection()
				  │
				  └─ collection_services.ensure_collection(config)
						│
						├─ connect_to_milvus()
						│
						├─ collection_exists() ?
						│     ├─ NO → Tạo mới:
						│     │       ├─ build_collection_fields()
						│     │       ├─ create_collection()
						│     │       ├─ create_hnsw_index()
						│     │       └─ load_collection()
						│     │
						│     └─ YES → Xác thực:
						│             ├─ validate_collection_schema()
						│             ├─ validate_index()
						│             └─ load_collection()
						│
						└─ ✓ Collection sẵn sàng
```

---

## Tóm Tắt

| Câu Hỏi | Câu Trả Lời |
|--------|----------|
| **Collection Workflow làm gì?** | Thiết lập Milvus collection để lưu trữ vector embedding ảnh |
| **Xử lý loại dữ liệu nào?** | 512-chiều vector embeddings + metadata (image_id, user_id, privacy_level) |
| **Cấu trúc là gì?** | 4 fields (image_id, vector, user_id, privacy_level) với HNSW indexing trên `vector` |
| **Thành phần bao gồm?** | Entities, Adapters, Services, Routers, Config, CLI, Test scripts |
| **Khi nào chạy?** | Trong Phase 1 setup; AG-03 sẽ gọi lại khi cần tìm kiếm vector |
| **Phụ thuộc?** | Milvus 2.4.x running, Python 3.13+, pymilvus library |

---

