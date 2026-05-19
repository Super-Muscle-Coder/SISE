# Collection Workflow - Deep Guide

**Mục đích**: Giải thích chi tiết Collection Workflow cho specialist, architect, người cần hiểu sâu.

**Mức độ**: Advanced / Specialist-level  
**Thời gian đọc**: 45-60 phút

---

## 1. Chi tiết: Collection Workflow này là gì? Nó được thiết kế như thế nào?

### 1.1 Định nghĩa đầy đủ

**Collection Workflow** là quy trình tạo và quản lý Milvus collection cho vector search:

- **Mục tiêu chính**: 
  - Tạo collection `sise_v1` với schema định sẵn
  - Cấu hình HNSW index để tối ưu tốc độ tìm kiếm
  - Đảm bảo collection sẵn sàng phục vụ queries từ AG-03
  - Support idempotent operations (chạy lại an toàn)

- **Phạm vi**: 
  - Từ collection initialization (tạo mới) đến validation (kiểm tra sẵn sàng)
  - Manage collection lifecycle: create → index → load → ready
  - Support schema validation (kiểm tra fields, vector_dim)

- **Vai trò trong hệ thống**: 
  - **Tầng thứ hai**: Phụ thuộc Schema Workflow
  - **Vector Search Layer**: Cung cấp efficient vector search (~100ms for 1M vectors)
  - **Bridge to AG-03**: AG-03 insert/search vectors qua Collection

- **Lịch sử thiết kế**:
  - Chọn **HNSW** index vì:
	- Balanced: ~99% recall at high speed (< 100ms)
	- Memory efficient: O(n) not O(n²)
	- Production-proven (Meta, Qdrant use)
  - Alternative considered: IVF-Flat (rejected: slower, requires more tuning)
  - Alternative considered: Exhaustive search (rejected: too slow for 1M+ vectors)

### 1.2 Kiến trúc chi tiết (5-layer Architecture)

```
┌────────────────────────────────────────────┐
│  Config Layer: collection config files     │
│  - vector_dim, index params, metric_type   │
│  - Milvus connection (host, port)          │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Entity Layer: Data Models & Config        │
│  - MilvusConfig (host, port, params)       │
│  - Immutable, validated dataclasses        │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Adapter Layer: External Integration       │
│  - MilvusCollectionAdapter wraps pymilvus  │
│  - connect_to_milvus()                     │
│  - create_collection() / get_collection()  │
│  - create_hnsw_index()                     │
│  - load_collection()                       │
│  - Error handling, retry logic             │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Service Layer: Business Logic             │
│  - CollectionService orchestrates workflow │
│  - ensure_collection() (main entry)        │
│  - _validate_collection_schema()           │
│  - _validate_index()                       │
│  - Idempotency (check if exists first)     │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Router Layer: Public API                  │
│  - CollectionRouter (class-based)          │
│  - CLI entry points (collection_cli.py)    │
│  - expose: create_collection, check_ready  │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  External: Milvus Database + etcd backend  │
│  - Collection sise_v1 created              │
│  - HNSW index created on vector field      │
│  - Ready for vector insert/search          │
└────────────────────────────────────────────┘
```

### 1.2.2 Detailed Process Flow

**Setup Flow (Idempotent)**:

```
1. Load Config
   ├─ Read MilvusConfig (host, port, vector_dim, index_params)
   └─ Validate config (vector_dim matches global settings)

2. Connect to Milvus
   ├─ connections.connect(host, port)
   ├─ Validate connection (health check)
   └─ Check if server is responsive

3. Check if Collection Exists
   ├─ utility.has_collection("sise_v1")
   ├─ If YES: go to Validation (skip creation)
   └─ If NO: go to Creation

4a. CREATE PATH (if not exists):
	├─ Build collection fields (image_id, vector, user_id, privacy_level)
	├─ Create CollectionSchema
	├─ Collection.create(schema)
	├─ Create HNSW index (field=vector, metric_type=L2, params={m:16, ef:200})
	├─ Load collection into memory
	└─ Log success

4b. VALIDATION PATH (if exists):
	├─ Get collection object
	├─ Validate schema matches expected (fields, vector_dim)
	├─ Validate index exists and is HNSW
	├─ If valid: Load collection, continue
	└─ If invalid: Raise error

5. Final Readiness Check
   ├─ Check collection is loaded
   ├─ Check partition count > 0
   ├─ Health check query: count documents
   └─ Ready for insert/search
```

### 1.2.3 Step-by-Step Process Detail

**Step 1: Connection Setup**
- **Input**: host, port from MilvusConfig
- **Xử lý**: `connections.connect(alias="default", host=host, port=port)`
- **Output**: Milvus connection established
- **Validation**: Connection must succeed within timeout
- **Idempotency**: Yes - reconnecting safe
- **Error Handling**: Raise ConnectionError if unreachable

**Step 2: Schema Building**
- **Input**: vector_dim from config
- **Xử lý**: Build FieldSchema list:
  ```python
  [
	FieldSchema(name="image_id", dtype=VARCHAR, is_primary=True, max_length=36),
	FieldSchema(name="vector", dtype=FLOAT_VECTOR, dim=vector_dim),
	FieldSchema(name="user_id", dtype=INT64),
	FieldSchema(name="privacy_level", dtype=INT32)
  ]
  ```
- **Output**: List[FieldSchema]
- **Validation**: vector_dim must equal global_configs.vector_dim
- **Idempotency**: Yes - schema deterministic
- **Error Handling**: Raise ValueError if dimension mismatch

**Step 3: Collection Creation**
- **Input**: collection_name, fields, schema
- **Xử lý**: `Collection(name="sise_v1", schema=schema)`
- **Output**: Collection object
- **Validation**: Collection exists in Milvus
- **Idempotency**: Yes (checked before creation)
- **Error Handling**: Catch if already exists, validate instead

**Step 4: HNSW Index Creation**
- **Input**: Collection object, index_params (m=16, ef_construction=200), metric_type (L2)
- **Xử lý**: 
  ```python
  collection.create_index(
	field_name="vector",
	index_params={
	  "index_type": "HNSW",
	  "params": {"m": 16, "ef_construction": 200},
	  "metric_type": "L2"
	}
  )
  ```
- **Output**: Index created
- **Validation**: Index must be HNSW type
- **Idempotency**: Yes (checked before creation)
- **Error Handling**: Skip if already indexed

**Step 5: Load & Validation**
- **Input**: Collection object
- **Xử lý**: 
  - `collection.load()` (load into memory)
  - `collection.num_entities` (check entity count)
  - Run test query: `collection.query("", limit=1)`
- **Output**: Collection ready for search
- **Validation**: num_entities >= 0, query succeeds
- **Idempotency**: Yes - load idempotent
- **Error Handling**: Raise if load fails

---

## 2. Chi tiết: Workflow này xử lý dữ liệu gì? Input/Output?

### 2.1 Input Specification

#### 2.1.1 Configuration & Parameters

| Tên | Loại | Required | Default | Mô tả | Ví dụ |
|-----|------|----------|---------|-------|-------|
| MILVUS_HOST | String | Yes | N/A | Milvus server hostname | localhost |
| MILVUS_PORT | Integer | Yes | N/A | Milvus server port | 19530 |
| vector_dim | Integer | Yes | N/A | Vector dimension (must match model output) | 768 |
| collection_name | String | No | sise_v1 | Name of collection | sise_v1 |
| index_type | String | No | HNSW | Index algorithm | HNSW |
| metric_type | String | No | L2 | Distance metric for search | L2 or IP (Inner Product) |
| index_param_m | Integer | No | 16 | HNSW M (connections per node) | 16 |
| index_param_ef_construction | Integer | No | 200 | HNSW ef_construction | 200 |

#### 2.1.2 External Dependencies

| Tên | Loại | SLA | Health Check | Notes |
|-----|------|-----|--------------|-------|
| Milvus Server | Service | 99.9% | connections.connect() + health() | Must be running, 2.4+ |
| etcd | Service | 99.9% | Milvus health includes etcd | Backend for Milvus |
| Network | Network | N/A | Ping host:port | Connection to Milvus host |
| Schema Workflow | Workflow | 100% (prerequisite) | Verify tables exist in PostgreSQL | Must complete first |

#### 2.1.3 Prerequisites

- Milvus instance provisioned and running
- etcd backend for Milvus operational
- Network connectivity to Milvus host
- Schema Workflow completed (PostgreSQL schema ready)
- pymilvus, pandas packages installed

### 2.2 Output Specification

#### 2.2.1 Primary Output

| Tên | Loại | Nơi | Định dạng | Mô tả | Life cycle |
|-----|------|-----|-----------|-------|-----------|
| Collection `sise_v1` | Vector Index | Milvus | Internal Milvus format (binary graph) | Collection with schema + HNSW index | Until explicitly dropped |
| HNSW Index | Index Structure | Milvus | Graph-based quantized format | Index on vector field | Until collection dropped |

#### 2.2.2 Side Effects & Logs

| Tên | Loại | Nơi | Mô tả | Retention |
|-----|------|-----|-------|-----------|
| Setup Log | Log | logs/collection_setup.log | Timestamp, status, errors, index build progress | 30 days |
| Collection Stats | Metric | Milvus internal | num_entities, num_partitions, memory_usage | 7 days |
| Index Info | Metadata | Milvus | Index type, metric, params | Persists |

#### 2.2.3 State Changes

- **Before**: Milvus running, no `sise_v1` collection
- **After**: Collection `sise_v1` exists, HNSW index created, loaded in memory, ready for vectors

### 2.3 Data Processing Characteristics

#### 2.3.1 Data Types Handled

| Loại dữ liệu | Định dạng | Kích thước | Chi tiết |
|-------------|-----------|-----------|---------|
| Vector embeddings | float32 array | 768 dimensions | ~3 KB per vector (768 * 4 bytes) |
| Collection schema | Metadata | ~ 5 KB | Field definitions, constraints |
| Index metadata | Binary graph | Variable | HNSW graph structure, ~varies per vector count |
| Image metadata | Integer/String | Small | image_id (36 bytes), user_id (8 bytes), privacy_level (4 bytes) |

#### 2.3.2 Data Volume & Throughput

- **Expected volume**: Millions of vectors (10M-100M range typical)
- **Throughput**: ~10k vectors/second during initial batch indexing
- **Peak load**: 100k concurrent queries possible with HNSW
- **Memory**: ~10 GB for 1M 768-dim vectors (with HNSW)

#### 2.3.3 Data Lifecycle

```
Vector Embeddings (from CLIP model)
		↓ (uploaded via AG-03)
AG-03 Upload Service
		↓ (calls)
Collection API (insert vectors)
		↓
Milvus Collection (stores)
		↓ (searches via)
AG-03 Search Service (vector search queries)
		↓ (returns)
Matching results with privacy filters
```

---

## 3. Chi tiết: Các thành phần trọng tâm của Workflow?

### 3.1 Component Inventory

| Component | Category | Chức năng | Trách nhiệm | Dependencies | Owner |
|-----------|----------|----------|-----------|--------------|-------|
| MilvusConfig | Entity | Hold Milvus connection params | Type safety, validation | None | Collection module |
| build_collection_fields() | Adapter | Build FieldSchema list | Create schema fields programmatically | pymilvus | Collection adapter |
| MilvusCollectionAdapter | Adapter | Wrap pymilvus SDK | API abstraction, error handling | pymilvus | Collection adapter |
| CollectionService | Service | Orchestrate creation, validation | Main workflow logic, idempotency | Adapter, Entity | Collection service |
| _validate_collection_schema() | Service helper | Validate schema matches expected | Check fields, vector_dim, pk | None | Collection service |
| _validate_index() | Service helper | Validate HNSW index | Check index type, metric, params | None | Collection service |
| ensure_collection() | Service | Main entry point (idempotent) | Create or validate collection | All above | Collection service |

### 3.2 Component Interaction

#### Sequence Diagram

```
AG-03 or Test Caller
		|
		| ensure_collection(config)
		↓
CollectionService
		├─ connect_to_milvus(config.host, port)
		|   ↓ MilvusCollectionAdapter.connect_to_milvus()
		|   └─ connections.connect()
		|
		├─ collection_exists(config.collection_name)?
		|   ↓ utility.has_collection()
		|   └─ YES: go to Validation Path
		|   └─ NO: go to Creation Path
		|
		├─ CREATION PATH (if not exists):
		|   ├─ build_collection_fields(config.vector_dim)
		|   |   └─ → List[FieldSchema]
		|   ├─ create_collection()
		|   |   ├─ CollectionSchema(fields)
		|   |   └─ Collection(schema)
		|   ├─ create_hnsw_index(collection, config.index_params)
		|   |   └─ collection.create_index(...)
		|   └─ load_collection(collection)
		|       └─ collection.load()
		|
		└─ VALIDATION PATH (if exists):
			├─ get_collection()
			├─ _validate_collection_schema(collection, vector_dim)
			├─ _validate_index(collection, index_params)
			└─ load_collection()
```

#### Dependency Graph

```
MilvusConfig (from env/config)
	↓ (used by)
CollectionService
	├─ calls MilvusCollectionAdapter functions
	├─ calls build_collection_fields()
	├─ calls _validate_collection_schema()
	└─ calls _validate_index()
		↓ (all use)
pymilvus SDK
		↓ (interacts with)
Milvus Server ← etcd backend
		↓
Collection sise_v1 (created & ready)
```

### 3.3 Component Responsibilities Detail

#### Component: MilvusConfig

- **Định nghĩa**: Immutable dataclass for Milvus connection + collection params
- **Loại**: Entity
- **Trách nhiệm**:
  - Store host, port, collection_name, vector_dim, index_params, metric_type
  - Validate params (vector_dim > 0, port in 1-65535, etc.)
- **Test**: `tests/entities/test_collection_entities.py`

#### Component: MilvusCollectionAdapter

- **Định nghĩa**: Wrapper around pymilvus SDK
- **Loại**: Adapter
- **Trách nhiệm**:
  - `connect_to_milvus()`: Setup connection
  - `collection_exists()`: Check if collection already created
  - `build_collection_fields()`: Programmatically build schema
  - `create_collection()`, `get_collection()`: Collection access
  - `create_hnsw_index()`: Index creation
  - `load_collection()`: Memory loading
- **Test**: `tests/adapters/test_collection_adapters.py`

#### Component: CollectionService

- **Định nghĩa**: Main orchestration service
- **Loại**: Service
- **Trách nhiệm**:
  - `ensure_collection()`: Main idempotent entry point
  - `_validate_collection_schema()`: Schema validation
  - `_validate_index()`: Index validation
  - Orchestrate full workflow
- **Test**: `tests/services/test_collection_services.py`

---

## 4. Design Decisions & Rationale

### 4.1 Architectural Choices

**Choice 1: Idempotent Design**
- **Pro**: Safe to rerun, no errors on retry
- **Con**: Must check collection exists before creating
- **Rationale**: CI/CD pipelines may rerun; idempotency prevents failures

**Choice 2: HNSW Index**
- **Pro**: ~99% recall, fast (< 100ms for 1M vectors), memory efficient
- **Con**: Need to tune m and ef_construction parameters
- **Rationale**: Best balance for SISE requirements (image search at scale)

**Choice 3: Validation after creation**
- **Pro**: Catch schema mismatches early
- **Con**: Extra validation queries
- **Rationale**: Fail-fast principle; errors caught immediately

### 4.2 Trade-offs

| Trade-off | Pro | Con | Decision |
|-----------|-----|-----|----------|
| Eager load vs lazy load | Ready immediately | Uses memory | Accept eager: search consistency |
| Single collection vs multiple | Simple, less config | Limits flexibility | Accept single: clear ownership |
| HNSW vs IVF-Flat | Faster, less tuning | Slightly less stable | Accept HNSW: proven at scale |

---

## 5. Error Handling & Failure Modes

### 5.1 Expected Failures & Recovery

| Failure | Root Cause | Detection | Recovery | Impact |
|---------|-----------|-----------|----------|--------|
| Milvus unreachable | Network/server down | Connection timeout | Retry with backoff | 5-10 min delay |
| Collection already exists | Idempotent rerun | utility.has_collection() returns true | Validate & load | None |
| Schema mismatch | Config changed | _validate_collection_schema() fails | Raise error, update config | Requires manual fix |
| Index creation failed | Milvus bug or constraints | create_index() error | Raise error, retry later | Requires retry |

### 5.2 Unexpected Failures

Check Milvus logs: `/var/log/milvus/` or container logs

---

## 6. Testing Strategy

### 6.1 Unit Tests
- Mock pymilvus
- Test adapter functions, service logic, validation

### 6.2 Integration Tests
- Docker Milvus container
- Real collection creation/validation

### 6.3 E2E Tests
- Production-like setup
- Full workflow from config to ready

---

## 7. Performance & Monitoring

### 7.1 Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| collection_setup_duration | < 30s | > 60s |
| collection_ready | true | false |
| index_build_progress | 100% | < 80% for 5 min |

---

## 8. Known Limitations & Future Work

### 8.1 Current Limitations

- Single collection (not multi-partition yet)
- No automatic schema versioning

### 8.2 Future Improvements

- Multi-partition support
- Auto schema migration
- GPU acceleration for indexing

---

## 9. Related Workflows & Integration Points

- **Schema Workflow**: Prerequisite (must complete first)
- **Seed Workflow**: Depends on Collection (seed data after collection ready)
- **AG-03**: Consumes Collection (insert/search vectors)

---

## 10. References & Further Reading

- **Milvus Official Docs**: https://milvus.io/docs
- **pymilvus Python SDK**: https://pymilvus.readthedocs.io/
- **HNSW Algorithm Paper**: https://arxiv.org/abs/1802.02413
