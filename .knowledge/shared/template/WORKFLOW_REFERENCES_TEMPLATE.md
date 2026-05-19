# [WORKFLOW_NAME] - References

**Mục đích**: Tài liệu này cung cấp danh sách chi tiết các tệp, thư mục, cấu trúc dự án, và tài liệu tham khảo của [WORKFLOW_NAME] workflow. Sử dụng tài liệu này để định vị nhanh các thành phần, hiểu cây thư mục, và tìm kiếm các file cụ thể cần thiết.

**Mục tiêu sử dụng**: Tra cứu cấu trúc, duyệt mã nguồn, tìm file cấu hình, tìm test files.

**Thời gian tra cứu**: 5-10 phút (tùy vào độ chi tiết cần tìm)

---

## 1. Directory Structure (Cấu trúc thư mục)

### 1.1 Full Tree View

```
modules/StorageModule/
├── [WORKFLOW_NAME]-specific files here
├── configs/
│   ├── [config_1.yaml]
│   ├── [config_2.yaml]
│   └── [config_N.yaml]
├── app/
│   ├── entities/
│   │   ├── [entity_1.py]
│   │   ├── [entity_N.py]
│   │   └── __init__.py
│   ├── adapters/
│   │   ├── [adapter_1.py]
│   │   ├── [adapter_N.py]
│   │   └── __init__.py
│   ├── services/
│   │   ├── [service_1.py]
│   │   ├── [service_N.py]
│   │   └── __init__.py
│   ├── routers/
│   │   ├── [router_1.py]
│   │   ├── [router_N.py]
│   │   └── __init__.py
│   └── __init__.py
├── tests/
│   ├── [test_1.py]
│   ├── [test_N.py]
│   ├── fixtures/
│   │   └── [test_data.py]
│   └── __init__.py
├── scripts/
│   ├── [script_1.py]
│   ├── [script_N.sh]
│   └── [setup_script.ps1]
├── documents/
│   ├── [WORKFLOW_NAME]_workflow/
│   │   ├── QUICK_GUIDE.md
│   │   ├── DEEP_GUIDE.md
│   │   ├── REFERENCES.md
│   │   ├── EXAMPLES.md
│   │   └── ...
│   ├── diagrams/
│   └── ...
└── README.md
```

### 1.2 Component-wise Tree View

```
[WORKFLOW_NAME] Workflow Components:

Config Layer:
├── configs/[config_file_1].yaml       - [Description]
├── configs/[config_file_2].yaml       - [Description]
└── .env.local / .env.prod             - [Environment variables]

Entity Layer:
├── app/entities/[entity_1].py         - [Description]
├── app/entities/[entity_2].py         - [Description]
└── app/entities/__init__.py           - Exports: [__all__ list]

Adapter Layer:
├── app/adapters/[adapter_1].py        - [Description]
├── app/adapters/[adapter_2].py        - [Description]
└── app/adapters/__init__.py           - Exports: [__all__ list]

Service Layer:
├── app/services/[service_1].py        - [Description]
├── app/services/[service_2].py        - [Description]
└── app/services/__init__.py           - Exports: [__all__ list]

Router Layer:
├── app/routers/[router_1].py          - [Description]
├── app/routers/[router_2].py          - [Description]
└── app/routers/__init__.py            - Exports: [__all__ list]

Tests:
├── tests/test_[component_1].py        - [Test scope]
├── tests/test_[component_2].py        - [Test scope]
├── tests/fixtures/[fixture_file].py   - Test data & fixtures
└── tests/__init__.py

Scripts & Utilities:
├── scripts/[utility_1].py             - [Purpose]
├── scripts/[helper_1].sh              - [Purpose]
├── scripts/[setup_1].ps1              - [Purpose]
└── README.md                          - Script usage guide

Documentation:
├── documents/[WORKFLOW_NAME]_workflow/
│   ├── QUICK_GUIDE.md
│   ├── DEEP_GUIDE.md
│   ├── REFERENCES.md
│   ├── EXAMPLES.md
│   └── INDEX.md
└── diagrams/
	├── architecture.md
	└── data_flow.md
```

---

## 2. File Inventory (Danh sách chi tiết các tệp)

### 2.1 Configuration Files

| File Path | File Name | Type | Owner | Purpose | Version | Last Updated |
|-----------|-----------|------|-------|---------|---------|-------------|
| `configs/[name].yaml` | [name].yaml | YAML Config | [Module Name] | [Describe purpose, what it configures] | [Version] | [Date] |
| `configs/.env.local` | .env.local | Env Vars | [Module Name] | Local development environment variables | N/A | [Date] |
| `configs/.env.prod` | .env.prod | Env Vars | [Module Name] | Production environment variables | N/A | [Date] |

**Ví dụ cho Collection Workflow**:

| File Path | File Name | Type | Owner | Purpose | Version | Last Updated |
|-----------|-----------|------|-------|---------|---------|-------------|
| `configs/collection_config.yaml` | collection_config.yaml | YAML | CollectionService | Define collection schema, index params, vector_dim | 1.0.0 | 2026-01-15 |
| `configs/.env.local` | .env.local | Env Vars | CollectionService | MILVUS_HOST, MILVUS_PORT, DEBUG=true | N/A | 2026-01-15 |
| `configs/.env.prod` | .env.prod | Env Vars | StorageModule | MILVUS_HOST, MILVUS_PORT, LOG_LEVEL=INFO | N/A | 2026-01-10 |

### 2.2 Entity Layer Files

| File Path | Class/Function | Type | Purpose | Imports | Exports (__all__) |
|-----------|----------------|------|---------|---------|-----------------|
| `app/entities/[name].py` | [ClassName] | Config Entity / Data Model | [Purpose description] | [Key imports] | [__all__ exports] |

**Ví dụ cho Collection Workflow**:

| File Path | Class/Function | Type | Purpose | Imports | Exports (__all__) |
|-----------|----------------|------|---------|---------|-----------------|
| `app/entities/milvus_config.py` | MilvusConfig, MilvusConnectionConfig | Dataclass | Hold parsed Milvus config (host, port, vector_dim, index params) | pydantic, typing | ['MilvusConfig', 'MilvusConnectionConfig'] |
| `app/entities/collection_schema.py` | CollectionSchema, FieldSchema | Dataclass | Represent Milvus collection schema in Python | pydantic, typing, enums | ['CollectionSchema', 'FieldSchema'] |

### 2.3 Adapter Layer Files

| File Path | Class/Function | Type | External System | Purpose | Key Methods |
|-----------|----------------|------|-----------------|---------|------------|
| `app/adapters/[name]_adapter.py` | [AdapterClassName] | External Integration | [System name] | [Purpose: wrap/abstract external API] | [Methods] |

**Ví dụ cho Collection Workflow**:

| File Path | Class/Function | Type | External System | Purpose | Key Methods |
|-----------|----------------|------|-----------------|---------|------------|
| `app/adapters/milvus_collection_adapter.py` | MilvusCollectionAdapter | External Integration | Milvus Server (pymilvus) | Wrap Milvus SDK, provide abstraction, handle connection pooling | create_collection(), create_index(), has_collection(), get_collection_stats() |
| `app/adapters/milvus_connection_adapter.py` | MilvusConnectionPool | Connection Manager | Milvus Server (pymilvus) | Manage connection pooling, health checks, retry logic | get_connection(), close_all(), health_check() |

### 2.4 Service Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Key Methods |
|-----------|----------------|------|---------|-----------|------------|
| `app/services/[name]_service.py` | [ServiceClassName] | Business Logic | [Workflow orchestration, main logic] | [Adapter classes, Entity classes] | [Key orchestration methods] |

**Ví dụ cho Collection Workflow**:

| File Path | Class/Function | Type | Purpose | Depends On | Key Methods |
|-----------|----------------|------|---------|-----------|------------|
| `app/services/collection_service.py` | CollectionService | Business Logic | Orchestrate collection creation, index setup, validation | MilvusCollectionAdapter, MilvusConfig, CollectionSchema | setup_collection(), validate_collection_ready(), get_collection_status() |
| `app/services/collection_orchestrator.py` | CollectionOrchestrator | Orchestration | Coordinate end-to-end workflow (config → adapter → service) | CollectionService, MilvusConfig | initialize_workflow() |

### 2.5 Router Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Exposed APIs |
|-----------|----------------|------|---------|-----------|------------|
| `app/routers/[name]_router.py` | [RouterClassName] or functions | Public API | Entry point for external callers, request/response handling | Service classes | [Functions/methods exposed] |

**Ví dụ cho Collection Workflow**:

| File Path | Class/Function | Type | Purpose | Depends On | Exposed APIs |
|-----------|----------------|------|---------|-----------|------------|
| `app/routers/collection_router.py` | CollectionRouter or route functions | Public API | Expose collection operations, handle CLI/API requests | CollectionService, CollectionOrchestrator | create_collection(), check_readiness(), list_collections() |
| `app/routers/collection_cli.py` | CLI commands | CLI Interface | Command-line entry point for collection operations | CollectionRouter | Commands: setup, validate, health-check |

### 2.6 Test Files

| File Path | Test Class/Function | Scope | Tests What | Fixtures Used | Coverage Target |
|-----------|-------------------|-------|-----------|-------------|-----------------|
| `tests/test_[component].py` | Test[ClassName] | Unit / Integration / E2E | [Component testing scope] | [Fixtures] | [% target] |

**Ví dụ cho Collection Workflow**:

| File Path | Test Class/Function | Scope | Tests What | Fixtures Used | Coverage Target |
|-----------|-------------------|-------|-----------|-------------|-----------------|
| `tests/test_collection_adapter.py` | TestMilvusCollectionAdapter | Unit | MilvusCollectionAdapter methods, error handling | mock_milvus_client | 95% |
| `tests/test_collection_service.py` | TestCollectionService | Integration | CollectionService workflow, orchestration | mock_adapter, mock_config | 90% |
| `tests/test_collection_workflow_e2e.py` | TestCollectionWorkflowE2E | End-to-End | Full workflow from config to collection ready | docker_milvus, real_config | 85% |
| `tests/fixtures/collection_test_data.py` | fixture_* functions | Shared Fixtures | Test data, mock configs, setup/teardown | pytest | N/A |

### 2.7 Script & Utility Files

| File Path | File Name | Type | Purpose | Usage |
|-----------|-----------|------|---------|-------|
| `scripts/[name].py` | [name].py | Python Script | [Purpose: setup, migration, utility] | `python scripts/[name].py [args]` |
| `scripts/[name].sh` | [name].sh | Shell Script | [Purpose] | `bash scripts/[name].sh [args]` |
| `scripts/[name].ps1` | [name].ps1 | PowerShell Script | [Purpose: Windows automation] | `powershell scripts/[name].ps1 [args]` |

**Ví dụ cho Collection Workflow**:

| File Path | File Name | Type | Purpose | Usage |
|-----------|-----------|------|---------|-------|
| `scripts/setup_collection.py` | setup_collection.py | Python Script | Initialize collection, create index, validate setup | `python scripts/setup_collection.py --config configs/collection_config.yaml` |
| `scripts/validate_collection.py` | validate_collection.py | Python Script | Health check, collection stats, readiness check | `python scripts/validate_collection.py --host localhost` |
| `scripts/run_collection_tests.ps1` | run_collection_tests.ps1 | PowerShell | Run test suite for collection workflow (Windows) | `powershell scripts/run_collection_tests.ps1 -TestFilter "collection"` |

### 2.8 Documentation Files

| File Path | File Name | Type | Purpose | Audience | Related Docs |
|-----------|-----------|------|---------|----------|------------|
| `documents/[WORKFLOW_NAME]_workflow/QUICK_GUIDE.md` | QUICK_GUIDE.md | Documentation | Overview for newcomers | Beginners, New devs | DEEP_GUIDE.md |
| `documents/[WORKFLOW_NAME]_workflow/DEEP_GUIDE.md` | DEEP_GUIDE.md | Documentation | In-depth technical details | Specialist devs, Architects | QUICK_GUIDE.md, EXAMPLES.md |
| `documents/[WORKFLOW_NAME]_workflow/REFERENCES.md` | REFERENCES.md | Reference | File inventory, structure, API reference | All devs | All source files |
| `documents/[WORKFLOW_NAME]_workflow/EXAMPLES.md` | EXAMPLES.md | Code Examples | Practical code samples, usage patterns | All devs | Source code files |

---

## 3. Key Dependencies (Phụ thuộc chính)

### 3.1 External Package Dependencies

| Package | Version | Purpose | Used In | License |
|---------|---------|---------|---------|---------|
| [Package 1] | [Version] | [Purpose] | [Files using] | [License] |
| [Package 2] | [Version] | [Purpose] | [Files using] | [License] |

**Ví dụ cho Collection Workflow**:

| Package | Version | Purpose | Used In | License |
|---------|---------|---------|---------|---------|
| pymilvus | >= 2.4.0 | Milvus Python SDK | adapters/milvus_collection_adapter.py | Apache 2.0 |
| pydantic | >= 2.0.0 | Data validation, config parsing | entities/* | MIT |
| pytest | >= 7.0.0 | Testing framework | tests/* | MIT |
| pytest-cov | >= 4.0.0 | Coverage reporting | tests/* | MIT |

### 3.2 Internal Module Dependencies

```
Dependency Graph:

config_files (collection_config.yaml, .env)
	↓ (loaded by)
entities/ (MilvusConfig, CollectionSchema)
	↓ (used by)
adapters/ (MilvusCollectionAdapter, MilvusConnectionPool)
	↓ (used by)
services/ (CollectionService, CollectionOrchestrator)
	↓ (used by)
routers/ (CollectionRouter, collection_cli.py)
	↓ (exposed to)
External Callers (AG-03, CLI, Tests)
```

### 3.3 Inter-workflow Dependencies

| Workflow | Dependency Type | Status | Description |
|----------|-----------------|--------|-------------|
| [Workflow 1] | [Type: depends-on / used-by / parallel] | [active/optional] | [Why/when] |

**Ví dụ**:

| Workflow | Dependency Type | Status | Description |
|----------|-----------------|--------|-------------|
| Schema Workflow | depends-on | active | Collection requires PostgreSQL schema to exist first |
| Seed Workflow | used-by | active | Seed reads from Collection for vector operations |
| Bucket Workflow | parallel | optional | Both independent, can run concurrently |

---

## 4. Configuration Reference (Tham chiếu cấu hình)

### 4.1 Config File Schemas

#### [Config File Name]: `[config_file].yaml`

**Location**: `configs/[config_file].yaml`

**Purpose**: [What this config controls]

**Schema Structure**:

```yaml
# Section 1: [Section Name]
[param_1]: 
  description: "[Description of parameter]"
  type: "[type]"
  required: "[yes/no]"
  default: "[default value]"
  example: "[example value]"

[param_2]:
  description: "[Description]"
  type: "[type]"
  required: "[yes/no]"
  default: "[default value]"
  example: "[example value]"

# Section 2: [Section Name]
...
```

**Example Content**:

```yaml
[Full example config]
```

**Validation Rules**:
- [Rule 1]: [Description]
- [Rule 2]: [Description]

**Ví dụ cho Collection Workflow - collection_config.yaml**:

**Schema Structure**:

```yaml
# Milvus Connection Parameters
milvus:
  host:
	description: "Milvus server hostname"
	type: "string"
	required: "yes"
	default: "localhost"
	example: "milvus.example.com"
  port:
	description: "Milvus server port"
	type: "integer"
	required: "yes"
	default: 19530
	example: 19530
  username:
	description: "Milvus username (if enabled)"
	type: "string"
	required: "no"
	default: null
	example: "admin"
  password:
	description: "Milvus password (if enabled)"
	type: "string"
	required: "no"
	default: null
	example: "[stored in vault]"

# Collection Definition
collection:
  name:
	description: "Collection name"
	type: "string"
	required: "yes"
	default: "sise_v1"
	example: "sise_v1"
  description:
	description: "Collection description"
	type: "string"
	required: "no"
	default: ""
	example: "SISE vector collection for image embeddings"

# Vector Schema
vectors:
  vector_dim:
	description: "Vector dimension (must match model output)"
	type: "integer"
	required: "yes"
	default: 768
	example: 768
  vector_dtype:
	description: "Data type for vectors"
	type: "string"
	required: "yes"
	default: "float32"
	example: "float32"
  vector_field_name:
	description: "Field name for vector column"
	type: "string"
	required: "yes"
	default: "vector"
	example: "vector"

# Index Configuration (HNSW)
index:
  index_type:
	description: "Index algorithm"
	type: "string"
	required: "yes"
	default: "HNSW"
	example: "HNSW"
  metric_type:
	description: "Distance metric"
	type: "string"
	required: "yes"
	default: "L2"
	example: "L2 or IP"
  hnsw_params:
	m:
	  description: "HNSW M parameter (connections per node)"
	  type: "integer"
	  default: 16
	  example: 16
	ef_construction:
	  description: "HNSW ef_construction"
	  type: "integer"
	  default: 200
	  example: 200
```

**Example Content**:

```yaml
milvus:
  host: localhost
  port: 19530
  username: null
  password: null

collection:
  name: sise_v1
  description: "SISE vector collection for image embeddings"

vectors:
  vector_dim: 768
  vector_dtype: float32
  vector_field_name: vector

index:
  index_type: HNSW
  metric_type: L2
  hnsw_params:
	m: 16
	ef_construction: 200
```

**Validation Rules**:
- `vector_dim` must equal `global_configs.vector_dim` from main project config
- `index_type` must be one of: HNSW, IVF_FLAT, IVF_SQ8
- `metric_type` must be one of: L2, IP, COSINE
- `milvus.port` must be 1-65535

### 4.2 Environment Variables

| Env Variable | Type | Required | Default | Purpose | Example |
|-------------|------|----------|---------|---------|---------|
| [VAR_1] | [type] | yes/no | [default] | [Purpose] | [Example] |

**Ví dụ**:

| Env Variable | Type | Required | Default | Purpose | Example |
|-------------|------|----------|---------|---------|---------|
| MILVUS_HOST | string | yes | localhost | Milvus server hostname | milvus.prod.svc.cluster.local |
| MILVUS_PORT | integer | yes | 19530 | Milvus server port | 19530 |
| VECTOR_DIM | integer | yes | 768 | Vector dimension | 768 |
| LOG_LEVEL | string | no | INFO | Logging level | DEBUG, INFO, WARNING, ERROR |

---

## 5. API Reference (Tham chiếu API)

### 5.1 Router/Public API Reference

**File**: `app/routers/[router_name].py`

#### Function/Method: [Function Name]

```
Signature: [function_signature]
```

**Description**: [What it does]

**Parameters**:
| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| [param_1] | [type] | yes/no | [Description] | [default] |

**Returns**:
| Type | Description |
|------|-------------|
| [return_type] | [What it returns] |

**Raises**:
| Exception | When | How to handle |
|-----------|------|---------------|
| [Exception 1] | [When raised] | [How to handle] |

**Example**:
```python
[Usage example]
```

**Ví dụ**:

#### Function: `create_collection(config_path: str) -> CollectionStatus`

```
Signature: create_collection(config_path: str, validate: bool = True) -> CollectionStatus
```

**Description**: Create a new Milvus collection from config file

**Parameters**:
| Name | Type | Required | Description | Default |
|------|------|----------|-------------|---------|
| config_path | str | yes | Path to collection_config.yaml | N/A |
| validate | bool | no | Run validation after creation | True |

**Returns**:
| Type | Description |
|------|-------------|
| CollectionStatus | Object with status, timestamp, message, collection_name |

**Raises**:
| Exception | When | How to handle |
|-----------|------|---------------|
| ConfigNotFoundError | config_path doesn't exist | Check file path |
| ConfigValidationError | Schema validation fails | Fix config, check vector_dim |
| MilvusConnectionError | Can't connect to Milvus | Check MILVUS_HOST, MILVUS_PORT |
| CollectionAlreadyExistsError | Collection name already exists | Use different name or drop existing |

**Example**:
```python
from app.routers.collection_router import create_collection

status = create_collection(
	config_path="configs/collection_config.yaml",
	validate=True
)
print(f"Collection {status.collection_name} created: {status.message}")
```

---

## 6. Testing Reference

### 6.1 How to Run Tests

**Run all tests**:
```bash
pytest tests/
```

**Run specific test file**:
```bash
pytest tests/test_collection_service.py
```

**Run with coverage**:
```bash
pytest tests/ --cov=app --cov-report=html
```

**Run with verbose output**:
```bash
pytest tests/ -v
```

### 6.2 Test Data & Fixtures

**Location**: `tests/fixtures/collection_test_data.py`

**Available Fixtures**:
| Fixture Name | Type | Purpose | Usage |
|-------------|------|---------|-------|
| [fixture_1] | [type] | [Purpose] | @pytest.fixture / conftest.py |

---

## 7. Related Documentation & Links

### 7.1 Internal Documentation

- [QUICK_GUIDE.md](./[WORKFLOW_NAME]_WORKFLOW_QUICK_GUIDE.md): Quick overview for newcomers
- [DEEP_GUIDE.md](./[WORKFLOW_NAME]_WORKFLOW_DEEP_GUIDE.md): In-depth technical details
- [EXAMPLES.md](./[WORKFLOW_NAME]_WORKFLOW_EXAMPLES.md): Code examples and usage patterns
- [INDEX.md](./[WORKFLOW_NAME]_WORKFLOW_INDEX.md): Learning path and concept map

### 7.2 Related Workflows

- [Schema Workflow](../schema_workflow/): Database schema setup
- [Bucket Workflow](../bucket_workflow/): Object storage setup
- [Seed Workflow](../seed_workflow/): Data seeding
- [Infra Compose](../infra_compose_workflow/): Docker Compose orchestration

### 7.3 External References

- [Milvus Official Documentation](https://milvus.io/docs): Vector database docs
- [pymilvus Python SDK](https://pymilvus.readthedocs.io/): Python client library
- [SISE Project Repository](https://github.com/Super-Muscle-Coder/SISE): Main project repo

### 7.4 Troubleshooting & Runbooks

- [Database Restore Runbook](docs/runbooks/db-restore.md): Backup/restore procedures
- [Collection Setup Troubleshooting](./troubleshooting.md): Common issues and solutions
- [Performance Tuning Guide](./performance-tuning.md): Optimization tips

---

## 8. File Ownership & Contact

### 8.1 Component Owners

| Component | Owner | Team | Contact | Escalation |
|-----------|-------|------|---------|-----------|
| [Component 1] | [Name] | [Team] | [Email/Slack] | [Escalation path] |

**Ví dụ**:

| Component | Owner | Team | Contact | Escalation |
|-----------|-------|------|---------|-----------|
| MilvusCollectionAdapter | [Developer Name] | StorageModule | [email@example.com] | StorageModule Lead → PM |
| CollectionService | [Developer Name] | StorageModule | [email@example.com] | StorageModule Lead → PM |
| collection_config.yaml | [DevOps Name] | Infrastructure | [email@example.com] | Infrastructure Lead → PM |

### 8.2 How to Update This Reference

1. Update ONLY when code/structure changes
2. Keep file paths, class names, and method signatures current
3. Update "Last Updated" timestamp
4. Link related documentation changes
5. Reference this REFERENCES.md from commit message

---

## 9. Version History & Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | [Date] | Initial reference documentation | [Author] |
| [Version] | [Date] | [Changes made] | [Author] |

---

## 10. Quick Navigation

**Looking for...**

- **Where to find config files?** → Section 2.1
- **What classes exist?** → Sections 2.2-2.5
- **How to run tests?** → Section 6
- **API reference?** → Section 5
- **Directory structure?** → Section 1
- **External dependencies?** → Section 3
- **Configuration schema?** → Section 4
- **Related workflows?** → Section 7.2
