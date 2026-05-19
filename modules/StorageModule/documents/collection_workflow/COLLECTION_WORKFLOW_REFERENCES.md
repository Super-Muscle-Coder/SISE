# Collection Workflow - References

**Mục đích**: Danh sách chi tiết các tệp, API, config của Collection Workflow. Sử dụng để tra cứu, định vị file, tìm API reference.

**Thời gian tra cứu**: 5-10 phút (lookup)

---

## 1. Directory Structure

### 1.1 Full Tree View

```
modules/StorageModule/
├── app/
│   ├── entities/
│   │   ├── collection_entities.py           ← MilvusConfig
│   │   └── __init__.py
│   ├── adapters/
│   │   ├── collection_adapters.py           ← pymilvus wrapper
│   │   └── __init__.py
│   ├── services/
│   │   ├── collection_services.py           ← Orchestration
│   │   └── __init__.py
│   ├── routers/
│   │   ├── collection_routers.py            ← Public API
│   │   └── __init__.py
│   └── __init__.py
├── configs/
│   ├── storage.env.local                    ← MILVUS_HOST, MILVUS_PORT, vector_dim
│   └── ...
├── tests/
│   ├── adapters/
│   │   └── test_collection_adapters.py
│   ├── services/
│   │   └── test_collection_services.py
│   ├── routers/
│   │   └── test_collection_routers.py
│   └── __init__.py
├── scripts/
│   ├── setup_collection.py                  ← Main entry point
│   ├── validate_collection.py               ← Validation script
│   └── run_collection_tests.ps1
├── documents/
│   └── collection_workflow/
│       ├── COLLECTION_WORKFLOW_QUICK_GUIDE.md
│       ├── COLLECTION_WORKFLOW_DEEP_GUIDE.md
│       └── COLLECTION_WORKFLOW_REFERENCES.md
└── logs/
	└── collection_setup.log
```

### 1.2 Component-wise Tree View

```
Collection Workflow Components:

Config Layer:
├── configs/storage.env.local                - MILVUS_HOST, MILVUS_PORT, vector_dim

Entity Layer:
├── app/entities/collection_entities.py
│   ├── MilvusConfig(frozen=True)            - Host, port, collection_name, vector_dim, index_params
│   └── __all__ = ['MilvusConfig']
└── app/entities/__init__.py

Adapter Layer:
├── app/adapters/collection_adapters.py
│   ├── connect_to_milvus()
│   ├── collection_exists()
│   ├── build_collection_fields()
│   ├── create_collection()
│   ├── get_collection()
│   ├── create_hnsw_index()
│   ├── get_indexes()
│   ├── load_collection()
│   └── __all__ = [...]
└── app/adapters/__init__.py

Service Layer:
├── app/services/collection_services.py
│   ├── CollectionValidationError
│   ├── ensure_collection()                  - Main idempotent entry point
│   ├── _validate_collection_schema()        - Check fields, vector_dim
│   └── _validate_index()                    - Check HNSW index
└── app/services/__init__.py

Router Layer:
├── app/routers/collection_routers.py
│   ├── CollectionWorkflowRouter(class)
│   │   └── __init__(milvus_config)
│   └── __all__ = ['CollectionWorkflowRouter']
└── app/routers/__init__.py

Tests:
├── tests/adapters/test_collection_adapters.py
├── tests/services/test_collection_services.py
├── tests/routers/test_collection_routers.py
└── tests/__init__.py

Scripts:
├── scripts/setup_collection.py              - Entry point
├── scripts/validate_collection.py
└── scripts/run_collection_tests.ps1

Documentation:
├── documents/collection_workflow/COLLECTION_WORKFLOW_QUICK_GUIDE.md
├── documents/collection_workflow/COLLECTION_WORKFLOW_DEEP_GUIDE.md
└── documents/collection_workflow/COLLECTION_WORKFLOW_REFERENCES.md
```

---

## 2. File Inventory

### 2.1 Configuration Files

| File Path | Name | Type | Purpose | Version | Last Updated |
|-----------|------|------|---------|---------|-------------|
| `configs/storage.env.local` | storage.env.local | Env Vars | MILVUS_HOST, MILVUS_PORT, vector_dim, etc. | N/A | On change |

### 2.2 Entity Layer Files

| File Path | Class | Type | Purpose | Exports |
|-----------|-------|------|---------|---------|
| `app/entities/collection_entities.py` | MilvusConfig | Dataclass | Host, port, collection_name, vector_dim, index_params, metric_type, search_params | ['MilvusConfig'] |

### 2.3 Adapter Layer Files

| File Path | Function | Purpose | Signature |
|-----------|----------|---------|-----------|
| `app/adapters/collection_adapters.py` | connect_to_milvus() | Setup Milvus connection | (host: str, port: int, alias: str) → None |
| `app/adapters/collection_adapters.py` | collection_exists() | Check if collection exists | (collection_name: str) → bool |
| `app/adapters/collection_adapters.py` | build_collection_fields() | Build FieldSchema list | (vector_dim: int) → List[FieldSchema] |
| `app/adapters/collection_adapters.py` | create_collection() | Create collection from fields | (collection_name: str, fields: List[FieldSchema]) → Collection |
| `app/adapters/collection_adapters.py` | get_collection() | Get collection object | (collection_name: str) → Collection |
| `app/adapters/collection_adapters.py` | create_hnsw_index() | Create HNSW index | (collection, field_name, index_params, metric_type) → None |
| `app/adapters/collection_adapters.py` | get_indexes() | Get collection indexes | (collection) → List[Index] |
| `app/adapters/collection_adapters.py` | load_collection() | Load collection into memory | (collection) → None |

### 2.4 Service Layer Files

| File Path | Function | Purpose | Signature |
|-----------|----------|---------|-----------|
| `app/services/collection_services.py` | ensure_collection() | Main idempotent entry point | (config: MilvusConfig) → None |
| `app/services/collection_services.py` | _validate_collection_schema() | Validate schema fields | (collection, vector_dim: int) → None |
| `app/services/collection_services.py` | _validate_index() | Validate HNSW index | (collection, index_params, metric_type) → None |

### 2.5 Router Layer Files

| File Path | Class | Purpose | Methods |
|-----------|-------|---------|---------|
| `app/routers/collection_routers.py` | CollectionWorkflowRouter | Public API | (see section 5) |

### 2.6 Test Files

| File Path | Scope | Tests What | Coverage |
|-----------|-------|-----------|----------|
| `tests/adapters/test_collection_adapters.py` | Unit | Adapter functions (mock pymilvus) | 95% |
| `tests/services/test_collection_services.py` | Unit | Service logic, validation | 90% |
| `tests/routers/test_collection_routers.py` | Unit | Router initialization | 85% |

### 2.7 Script Files

| File Path | Name | Purpose | Usage |
|-----------|------|---------|-------|
| `scripts/setup_collection.py` | setup_collection.py | Main setup script | `python scripts/setup_collection.py` |
| `scripts/validate_collection.py` | validate_collection.py | Validation script | `python scripts/validate_collection.py` |

---

## 3. Key Dependencies

### 3.1 External Package Dependencies

| Package | Version | Purpose | Used In | License |
|---------|---------|---------|---------|---------|
| pymilvus | >= 2.4.0 | Milvus Python SDK | adapters/collection_adapters.py | Apache 2.0 |
| pydantic | >= 2.0.0 | Data validation (if used) | entities/ | MIT |
| pytest | >= 7.0.0 | Testing | tests/ | MIT |

### 3.2 Internal Module Dependencies

```
MilvusConfig (entity)
	↓ (used by)
collection_adapters functions (pymilvus SDK)
	↓ (used by)
collection_services (orchestration)
	↓ (used by)
CollectionWorkflowRouter (public API)
	↓ (called by)
External: scripts, AG-03, tests
	↓ (interacts with)
Milvus Server + etcd backend
```

### 3.3 Inter-workflow Dependencies

| Workflow | Dependency | Status | Notes |
|----------|-----------|--------|-------|
| Schema Workflow | used-by | active | Collection phụ thuộc Schema (PostgreSQL ready) |
| Seed Workflow | used-by | active | Seed phụ thuộc Collection (insert data after) |
| Bucket Workflow | parallel | optional | Independent, no dependency |

---

## 4. Configuration Reference

### 4.1 Environment Variables

| Var | Type | Required | Default | Purpose | Example |
|-----|------|----------|---------|---------|---------|
| MILVUS_HOST | String | Yes | N/A | Milvus server hostname | localhost |
| MILVUS_PORT | Integer | Yes | N/A | Milvus server port | 19530 |
| vector_dim | Integer | Yes | N/A | Vector dimension (must match CLIP output) | 768 |
| collection_name | String | No | sise_v1 | Collection name | sise_v1 |
| index_type | String | No | HNSW | Index algorithm | HNSW |
| metric_type | String | No | L2 | Distance metric | L2 or IP |
| HNSW_M | Integer | No | 16 | HNSW M parameter | 16 |
| HNSW_EF_CONSTRUCTION | Integer | No | 200 | HNSW ef_construction | 200 |

**Example `.env.local`**:
```
MILVUS_HOST=localhost
MILVUS_PORT=19530
vector_dim=768
collection_name=sise_v1
metric_type=L2
```

---

## 5. API Reference

### 5.1 CollectionWorkflowRouter

**File**: `app/routers/collection_routers.py`

#### Class: CollectionWorkflowRouter

```python
class CollectionWorkflowRouter:
	def __init__(self, milvus_config: MilvusConfig) -> None
```

**Constructor**:
```python
from app.entities.collection_entities import MilvusConfig
from app.routers.collection_routers import CollectionWorkflowRouter

config = MilvusConfig(
	host="localhost",
	port=19530,
	collection_name="sise_v1",
	vector_dim=768,
	index_params={"m": 16, "ef_construction": 200},
	metric_type="L2",
	search_params={"ef": 64}
)
router = CollectionWorkflowRouter(config)
```

**No methods exposed** (see ensure_collection() in service)

### 5.2 Service API Reference

**File**: `app/services/collection_services.py`

#### Function: ensure_collection()

```python
def ensure_collection(config: MilvusConfig) -> None
```

**Description**: Idempotent collection setup (create if not exists, validate if exists)

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| config | MilvusConfig | Yes | Milvus connection + collection config |

**Returns**: None

**Raises**:
- `CollectionValidationError`: Schema or index mismatch
- `ConnectionError`: Cannot connect to Milvus
- `ValueError`: Invalid config

**Example**:
```python
from app.services import collection_services
from app.entities.collection_entities import MilvusConfig

config = MilvusConfig(...)
collection_services.ensure_collection(config)
# Collection sise_v1 now ready for insert/search
```

---

## 6. Testing Reference

### 6.1 How to Run Tests

```bash
# All collection tests
pytest tests/ -k collection

# Specific test file
pytest tests/adapters/test_collection_adapters.py -v

# With coverage
pytest tests/ -k collection --cov=app --cov-report=html

# Integration tests (requires Docker Milvus)
pytest tests/integration/test_collection_integration.py -v
```

### 6.2 Test Fixtures

| Fixture | Type | Purpose |
|---------|------|---------|
| milvus_config | MilvusConfig | Mock config |
| mock_pymilvus | Mock | Mock pymilvus SDK |
| docker_milvus | Container | Real Milvus in Docker |

---

## 7. Related Documentation & Links

### 7.1 Internal Documentation

- **COLLECTION_WORKFLOW_QUICK_GUIDE.md**: Quick overview
- **COLLECTION_WORKFLOW_DEEP_GUIDE.md**: Detailed explanation
- **../schema_workflow/**: Schema Workflow (prerequisite)
- **../INDEX.md**: StorageModule documentation index

### 7.2 External References

- **Milvus Docs**: https://milvus.io/docs
- **pymilvus SDK**: https://pymilvus.readthedocs.io/
- **HNSW Algorithm**: https://arxiv.org/abs/1802.02413

---

## 8. File Ownership & Contact

| Component | Owner | Contact |
|-----------|-------|---------|
| MilvusConfig | StorageModule | See project README |
| collection_adapters.py | StorageModule | See project README |
| collection_services.py | StorageModule | See project README |

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-15 | Initial reference |

---

## 10. Quick Navigation

- **Where is config?** → Section 4
- **What are the functions?** → Section 2
- **How to use API?** → Section 5
- **How to run tests?** → Section 6
- **Files location?** → Section 1
