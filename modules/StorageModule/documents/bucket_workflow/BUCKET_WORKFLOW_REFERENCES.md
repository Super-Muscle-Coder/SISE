# Bucket Workflow - References

**Mục đích**: Tài liệu này cung cấp lookup index cho tất cả file, dependency, config schema, API reference, test command, và navigation của Bucket Workflow.

**Loại tài liệu**: Reference/Index (quick lookup, không narrative)

---

## 1. Directory Tree

```
modules/StorageModule/
├── app/
│   ├── entities/
│   │   ├── bucket_entities.py         ← MinioConfig, LifecycleRuleConfig
│   │   ├── __init__.py
│   │   └── ...other_entities...
│   │
│   ├── adapters/
│   │   ├── bucket_adapters.py         ← create_minio_client()
│   │   ├── __init__.py
│   │   └── ...other_adapters...
│   │
│   ├── services/
│   │   ├── bucket_services.py         ← ensure_buckets(), helper functions
│   │   ├── __init__.py
│   │   └── ...other_services...
│   │
│   ├── routers/
│   │   ├── bucket_routers.py          ← BucketWorkflowRouter
│   │   ├── __init__.py
│   │   └── ...other_routers...
│   │
│   ├── __init__.py
│   └── main.py
│
├── tests/
│   ├── test_bucket_workflow.py        ← Integration & unit tests
│   ├── test_bucket_services.py        ← Service layer tests
│   ├── test_bucket_adapters.py        ← Adapter layer tests
│   └── ...other_tests...
│
├── scripts/
│   └── bucket/
│       ├── validate_buckets.py        ← Validation helper
│       └── setup_buckets.py           ← CLI entry point (optional)
│
├── configs/
│   └── bucket.env.example             ← Env var template
│
└── documents/
	└── bucket_workflow/
		├── BUCKET_WORKFLOW_QUICK_GUIDE.md      ← This guide
		├── BUCKET_WORKFLOW_DEEP_GUIDE.md       ← Deep technical guide
		└── BUCKET_WORKFLOW_REFERENCES.md       ← This file
```

---

## 2. File Inventory

| File | Type | Lines | Purpose | Owner |
|------|------|-------|---------|-------|
| `app/entities/bucket_entities.py` | Python | ~19 | Define MinioConfig & LifecycleRuleConfig dataclasses | AG-02 |
| `app/adapters/bucket_adapters.py` | Python | ~8 | Wrap minio.Minio library instantiation | AG-02 |
| `app/services/bucket_services.py` | Python | ~59 | Orchestrate bucket creation, policies, lifecycle rules | AG-02 |
| `app/routers/bucket_routers.py` | Python | ~10 | BucketWorkflowRouter public API | AG-02 |
| `tests/test_bucket_workflow.py` | Python | ~100+ | Integration tests (full flow) | AG-02 |
| `tests/test_bucket_services.py` | Python | ~50+ | Service layer unit tests | AG-02 |
| `tests/test_bucket_adapters.py` | Python | ~30+ | Adapter layer mocking tests | AG-02 |
| `scripts/bucket/validate_buckets.py` | Python | ~80+ | CLI tool to validate bucket setup | AG-02 |
| `configs/bucket.env.example` | Text | ~10 | Template for env vars | AG-02 |
| `documents/bucket_workflow/BUCKET_WORKFLOW_QUICK_GUIDE.md` | Markdown | ~200 | High-level overview | AG-02 |
| `documents/bucket_workflow/BUCKET_WORKFLOW_DEEP_GUIDE.md` | Markdown | ~450+ | Technical deep dive | AG-02 |
| `documents/bucket_workflow/BUCKET_WORKFLOW_REFERENCES.md` | Markdown | ~300+ | This reference file | AG-02 |

---

## 3. Dependencies & External Systems

### 3.1 Python Package Dependencies

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `minio` | >=7.1.0 | MinIO S3 client library | `bucket_adapters.py` |
| `dataclasses` | stdlib | Frozen dataclass support | `bucket_entities.py` |
| `typing` | stdlib | Type hints (`List`, `Tuple`) | all files |

### 3.2 External System Dependencies

| System | Version | Purpose | Connection |
|--------|---------|---------|------------|
| **MinIO** | 2024.x | S3-compatible object storage | `MINIO_ENDPOINT` env var |
| **Docker** | 20.10+ | Container runtime for MinIO | `infra_compose_storage.yml` |

### 3.3 Upstream Workflow Dependencies

| Dependency | Reason | Check |
|------------|--------|-------|
| **Schema Workflow** (Optional) | Database metadata, not strictly required | Can run independently |
| **Infra Compose** (Optional) | MinIO container orchestration | Recommended but not required |

---

## 4. Environment Variables & Configuration

### 4.1 Required Environment Variables

Set these before calling Bucket Workflow:

```bash
# MinIO Server Connection
MINIO_ENDPOINT=http://localhost:9000       # MinIO server address
MINIO_ACCESS_KEY=minioadmin                # S3 access key
MINIO_SECRET_KEY=minioadmin                # S3 secret key

# Bucket Names
BUCKET_RAW_IMAGES=raw-images               # Bucket for original images
BUCKET_THUMBNAILS=thumbnails               # Bucket for thumbnails

# Lifecycle Rules for raw-images
BUCKET_RAW_IMAGES_RULE=archive             # "expire" | "archive"
BUCKET_RAW_IMAGES_DAYS=365                 # Days before action

# Lifecycle Rules for thumbnails
BUCKET_THUMBNAILS_RULE=expire              # "expire" | "archive"
BUCKET_THUMBNAILS_DAYS=30                  # Days before action
```

### 4.2 Optional Environment Variables

```bash
# MinIO Console UI (for debugging)
MINIO_CONSOLE_PORT=9001                    # MinIO web dashboard

# TLS/HTTPS (if using secure MinIO)
MINIO_SECURE=false                         # Use HTTPS? (bool)
```

### 4.3 Example `.env` File

```bash
# configs/bucket.env.local
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
BUCKET_RAW_IMAGES=raw-images
BUCKET_THUMBNAILS=thumbnails
BUCKET_RAW_IMAGES_RULE=archive
BUCKET_RAW_IMAGES_DAYS=365
BUCKET_THUMBNAILS_RULE=expire
BUCKET_THUMBNAILS_DAYS=30
```

---

## 5. API Reference

### 5.1 Router API (Public Interface)

#### Class: `BucketWorkflowRouter`

```python
class BucketWorkflowRouter:
	def __init__(self, minio_config: MinioConfig) -> None:
		"""Initialize router with MinIO configuration.

		Args:
			minio_config: MinioConfig object containing endpoint, credentials, buckets, rules

		Raises:
			None (validation happens during setup_buckets call)
		"""

	def setup_buckets(self) -> None:
		"""Setup all buckets, policies, and lifecycle rules.

		Idempotent: Safe to call multiple times.

		Raises:
			S3Error: If MinIO server is unreachable or credentials invalid
			ValueError: If lifecycle rule type is unsupported
		"""
```

### 5.2 Service API (Internal)

#### Function: `ensure_buckets(config: MinioConfig) -> None`

```python
def ensure_buckets(config: MinioConfig) -> None:
	"""Ensure all buckets in config exist with correct policies and lifecycle rules.

	Steps:
		1. Create Minio client from credentials
		2. For each bucket: create (if not exists) and apply private policy
		3. For each lifecycle rule: build and apply to MinIO

	Idempotent: Safe to call multiple times.

	Args:
		config: MinioConfig with buckets and lifecycle rules

	Raises:
		S3Error: Connection/auth/permission errors
		ValueError: Invalid lifecycle rule type
	"""
```

#### Function: `_apply_private_policy(client: Minio, bucket: str) -> None`

```python
def _apply_private_policy(client: Minio, bucket: str) -> None:
	"""Set bucket policy to private (empty string = no public access).

	Args:
		client: Minio client instance
		bucket: Bucket name

	Raises:
		S3Error: If policy setting fails
	"""
```

#### Function: `_apply_lifecycle_rule(client: Minio, rule: LifecycleRuleConfig) -> None`

```python
def _apply_lifecycle_rule(client: Minio, rule: LifecycleRuleConfig) -> None:
	"""Build and apply lifecycle configuration to bucket.

	Args:
		client: Minio client instance
		rule: LifecycleRuleConfig with bucket, rule type, and days

	Raises:
		S3Error: If lifecycle setting fails
		ValueError: If rule type not in ["expire", "archive"]
	"""
```

#### Function: `_build_lifecycle_config(rule: LifecycleRuleConfig) -> LifecycleConfig`

```python
def _build_lifecycle_config(rule: LifecycleRuleConfig) -> LifecycleConfig:
	"""Construct MinIO LifecycleConfig from rule specification.

	Args:
		rule: LifecycleRuleConfig with type ("expire" | "archive") and days

	Returns:
		LifecycleConfig: MinIO configuration object ready to apply

	Raises:
		ValueError: If rule.rule not in ["expire", "archive"]
	"""
```

### 5.3 Adapter API (External Library Wrapper)

#### Function: `create_minio_client(endpoint, access_key, secret_key, secure) -> Minio`

```python
def create_minio_client(
	endpoint: str,
	access_key: str,
	secret_key: str,
	secure: bool
) -> Minio:
	"""Create and return Minio client instance.

	Args:
		endpoint: MinIO server address (host:port), e.g., "localhost:9000"
		access_key: S3 access key
		secret_key: S3 secret key
		secure: Use HTTPS (True) or HTTP (False)

	Returns:
		Minio: Initialized Minio client ready to use

	Raises:
		ValueError: If endpoint format is invalid
	"""
```

### 5.4 Entity Schemas

#### Dataclass: `MinioConfig`

```python
@dataclass(frozen=True)
class MinioConfig:
	endpoint: str                              # e.g., "localhost:9000"
	access_key: str                            # S3 access key
	secret_key: str                            # S3 secret key
	secure: bool                               # HTTPS flag
	buckets: List[str]                        # Bucket names
	lifecycle_rules: List[LifecycleRuleConfig] # Lifecycle configs
```

#### Dataclass: `LifecycleRuleConfig`

```python
@dataclass(frozen=True)
class LifecycleRuleConfig:
	bucket: str  # Which bucket this rule applies to
	rule: str    # "expire" | "archive"
	days: int    # After how many days to apply action
```

---

## 6. Test Commands

### 6.1 Unit Tests

```bash
# Run all bucket workflow tests
pytest modules/StorageModule/tests/test_bucket_*.py -v

# Run specific test file
pytest modules/StorageModule/tests/test_bucket_services.py -v

# Run with coverage
pytest modules/StorageModule/tests/test_bucket_*.py --cov=app.services.bucket --cov-report=html
```

### 6.2 Integration Tests

```bash
# Setup MinIO in Docker first
docker compose -f modules/StorageModule/infra_compose_storage.yml up -d minio

# Run integration tests
pytest modules/StorageModule/tests/test_bucket_workflow.py::TestBucketWorkflowIntegration -v

# Verify buckets created (using MinIO CLI)
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local/
```

### 6.3 Manual Validation Script

```bash
# Run validation helper
python modules/StorageModule/scripts/bucket/validate_buckets.py

# Expected output:
# ✓ MinIO server reachable at localhost:9000
# ✓ Bucket 'raw-images' exists and is private
# ✓ Bucket 'thumbnails' exists and is private
# ✓ Lifecycle rule for 'raw-images': archive after 365 days
# ✓ Lifecycle rule for 'thumbnails': expire after 30 days
```

---

## 7. Troubleshooting Command Reference

### 7.1 Check MinIO Health

```bash
# Check MinIO container status
docker ps | grep minio

# Access MinIO console
# Open browser: http://localhost:9001
# Login with credentials from env vars

# Check MinIO logs
docker logs sise-minio -f
```

### 7.2 Inspect Bucket Configuration

```bash
# List all buckets
mc ls minio/

# Check bucket policy
mc policy get minio/raw-images
mc policy get minio/thumbnails

# List lifecycle rules
mc ilm list minio/raw-images
mc ilm list minio/thumbnails

# Check object count in bucket
mc du minio/raw-images
```

### 7.3 Debug Connectivity Issues

```bash
# Test MinIO endpoint connectivity
telnet localhost 9000

# Test with MinIO CLI
mc alias set debug http://localhost:9000 minioadmin minioadmin
mc health info debug

# View detailed error logs
export MINIO_DEBUG=on
python -m app.main
```

---

## 8. Related Documentation

### 8.1 Same Workflow (Bucket)
- `BUCKET_WORKFLOW_QUICK_GUIDE.md` → High-level overview
- `BUCKET_WORKFLOW_DEEP_GUIDE.md` → Technical deep dive
- `test_bucket_workflow.py` → Integration test examples

### 8.2 Adjacent Workflows (StorageModule)
- `SCHEMA_WORKFLOW_REFERENCES.md` → Database schema docs
- `COLLECTION_WORKFLOW_REFERENCES.md` → Milvus collection docs
- `INFRA_COMPOSE_README.md` → Docker Compose orchestration

### 8.3 Downstream Consumers (BackendModule)
- `UPLOAD_WORKFLOW_REFERENCES.md` → Uses Bucket Workflow for object storage
- `SEARCH_WORKFLOW_REFERENCES.md` → May read from buckets

### 8.4 Cross-project Standards
- `.context/Workflow_Centric_Architecture.md` → 5-layer architecture standard
- `.context/data_schema.yaml` → Global data contracts
- `.context/Tasks.yaml` → Task definitions (T001-03: Bucket Workflow)

---

## 9. Navigation Index

### Quick Links
- **Setup Instructions**: See BUCKET_WORKFLOW_QUICK_GUIDE.md § 1-2
- **API Details**: See this file § 5
- **Troubleshooting**: See BUCKET_WORKFLOW_DEEP_GUIDE.md § 6
- **Testing**: See this file § 6
- **Code Examples**: See BUCKET_WORKFLOW_QUICK_GUIDE.md "Cách sử dụng cơ bản"

### By Role
- **New Developer**: Start with QUICK_GUIDE, then REFERENCES for lookup
- **Architect**: Read DEEP_GUIDE for design rationale and trade-offs
- **DevOps**: Use REFERENCES for troubleshooting commands and health checks
- **QA/Tester**: See section 6 for test commands and validation steps

---

## 10. Version & Maintenance Info

| Field | Value |
|-------|-------|
| **Document Version** | 1.0.0 |
| **Workflow Version** | 1.0.0 |
| **Last Updated** | 2026-05-12 |
| **Owner** | AG-02 (StorageModuleAgent) |
| **Next Review** | 2026-05-19 (weekly audit by AG-00) |
| **Status** | Active (enforced via CI/CD) |

---
