# Bucket Workflow - Deep Guide

**Mục đích**: Tài liệu này cung cấp chi tiết kỹ thuật sâu về Bucket Workflow cho các senior developer, architect, hoặc những ai cần modify/extend logic của workflow.

**Thời gian đọc**: 30-45 phút

**Độ khó**: Trung bình - nâng cao (yêu cầu hiểu biết về MinIO S3 API, lifecycle policies, Python dataclasses)

---

## 1. Kiến trúc chi tiết (Detailed Architecture)

### 1.1 Layered Architecture Breakdown

Bucket Workflow tuân theo kiến trúc 5 lớp chuẩn của dự án (xem `Workflow_Centric_Architecture.md`):

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL CALLER                            │
│              (main startup sequence, AG-00)                     │
└────────────────────────┬────────────────────────────────────────┘
						 │
						 v
┌─────────────────────────────────────────────────────────────────┐
│ 5. ROUTERS LAYER                                                │
│    ├─ BucketWorkflowRouter                                      │
│    │   └─ setup_buckets(self) -> None                           │
│    └─ Entry point duy nhất, điều hướng request tới Service      │
└────────────────────────┬────────────────────────────────────────┘
						 │
						 v
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVICES LAYER                                               │
│    ├─ bucket_services.ensure_buckets(config)                    │
│    │   ├─ Orchestrate: tạo bucket, apply policy, lifecycle rules│
│    │   └─ Gọi Adapters qua dependency injection pattern         │
│    ├─ bucket_services._apply_private_policy(client, bucket)     │
│    │   └─ Set bucket policy = "" (empty = private)              │
│    └─ bucket_services._apply_lifecycle_rule(client, rule)       │
│        └─ Build và apply LifecycleConfig tới MinIO              │
└────────────────────────┬────────────────────────────────────────┘
						 │
						 v
┌─────────────────────────────────────────────────────────────────┐
│ 3. ADAPTERS LAYER                                               │
│    └─ bucket_adapters.create_minio_client(...)                  │
│        ├─ Bọc thư viện `minio` (external dependency)            │
│        ├─ Tạo Minio instance với credentials                    │
│        └─ Return Minio client instance                          │
└────────────────────────┬────────────────────────────────────────┘
						 │
						 v
┌─────────────────────────────────────────────────────────────────┐
│ 2. ENTITIES LAYER                                               │
│    ├─ MinioConfig(dataclass)                                    │
│    │   ├─ endpoint: str                                         │
│    │   ├─ access_key: str                                       │
│    │   ├─ secret_key: str                                       │
│    │   ├─ secure: bool                                          │
│    │   ├─ buckets: List[str]                                    │
│    │   └─ lifecycle_rules: List[LifecycleRuleConfig]            │
│    └─ LifecycleRuleConfig(dataclass)                            │
│        ├─ bucket: str                                           │
│        ├─ rule: str ("expire" | "archive")                      │
│        └─ days: int                                             │
└────────────────────────┬────────────────────────────────────────┘
						 │
						 v
┌─────────────────────────────────────────────────────────────────┐
│ 1. CONFIGS LAYER                                                │
│    ├─ MINIO_ENDPOINT (env var)                                  │
│    ├─ MINIO_ACCESS_KEY (env var)                                │
│    ├─ MINIO_SECRET_KEY (env var)                                │
│    ├─ BUCKET_RAW_IMAGES (env var)                               │
│    ├─ BUCKET_THUMBNAILS (env var)                               │
│    ├─ BUCKET_THUMBNAILS_RULE (env var)                          │
│    ├─ BUCKET_THUMBNAILS_DAYS (env var)                          │
│    ├─ BUCKET_RAW_IMAGES_RULE (env var)                          │
│    └─ BUCKET_RAW_IMAGES_DAYS (env var)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow (Step-by-step Execution)

Khi `BucketWorkflowRouter.setup_buckets()` được gọi:

```
Step 1: Caller invokes router.setup_buckets()
		 |
		 v
Step 2: Router calls bucket_services.ensure_buckets(minio_config)
		 |
		 v
Step 3: Service creates Minio client via bucket_adapters.create_minio_client()
		 |
		 v
Step 4: Service loops through config.buckets:
		 +-- For each bucket:
		 |    |
		 |    +-- Check client.bucket_exists(bucket)
		 |    |
		 |    +-- If NOT exists:
		 |    |    └-- client.make_bucket(bucket)
		 |    |
		 |    +-- Apply private policy:
		 |         └-- client.set_bucket_policy(bucket, "")
		 |
		 v
Step 5: Service loops through config.lifecycle_rules:
		 +-- For each rule:
		 |    |
		 |    +-- Build LifecycleConfig object
		 |    |    ├-- If rule == "expire":
		 |    |    |    └-- Create Rule with Expiration(days=rule.days)
		 |    |    |
		 |    |    └-- Else if rule == "archive":
		 |    |         └-- Create Rule with Transition(days=rule.days, storage_class="GLACIER")
		 |    |
		 |    +-- Apply config to MinIO:
		 |         └-- client.set_bucket_lifecycle(bucket=rule.bucket, config=...)
		 |
		 v
Step 6: All operations complete, buckets ready for object operations
```

### 1.3 Idempotency & Error Handling

**Idempotency Design**:
- `client.bucket_exists()` check trước khi tạo → không error nếu bucket đã tồn tại
- `client.set_bucket_policy()` có thể gọi lặp lại mà không có side-effect
- `client.set_bucket_lifecycle()` có thể re-apply mà không conflict

**Error Scenarios & Handling**:

| Scenario | Current Behavior | Mitigation |
|----------|------------------|-----------|
| MinIO server not reachable | Exception raised by `minio.Minio` | Caller must implement retry/reconnect logic |
| Invalid credentials | `S3Error` from MinIO API | Validate credentials before calling setup_buckets() |
| Bucket policy conflict | MinIO API error (rare) | Log error, check MinIO documentation for policy format |
| Unsupported lifecycle rule | `ValueError` raised by `_build_lifecycle_config()` | Validate `rule` enum ("expire" \| "archive") in config |
| Disk/storage space full | MinIO API error | Check MinIO disk space health before operations |

---

## 2. Detailed Input/Output Contract

### 2.1 Input Specification

**Required Environment Variables** (when using `seed_test_data.py`):

```python
MINIO_ENDPOINT = str          # e.g., "http://localhost:9000" or "minio:9000"
MINIO_ACCESS_KEY = str        # e.g., "minioadmin"
MINIO_SECRET_KEY = str        # e.g., "minioadmin"
BUCKET_RAW_IMAGES = str       # e.g., "raw-images"
BUCKET_THUMBNAILS = str       # e.g., "thumbnails"
BUCKET_RAW_IMAGES_RULE = str  # "expire" | "archive"
BUCKET_RAW_IMAGES_DAYS = int  # e.g., 365
BUCKET_THUMBNAILS_RULE = str  # "expire" | "archive"
BUCKET_THUMBNAILS_DAYS = int  # e.g., 30
```

**Config Object Schema** (`MinioConfig`):

```python
@dataclass(frozen=True)
class MinioConfig:
	endpoint: str                          # MinIO host:port, e.g., "localhost:9000"
	access_key: str                        # S3 access key
	secret_key: str                        # S3 secret key
	secure: bool                           # Use HTTPS? (False for http)
	buckets: List[str]                     # Bucket names to create/verify
	lifecycle_rules: List[LifecycleRuleConfig]  # Lifecycle rules to apply
```

### 2.2 Output Specification

**Primary Output**: Buckets created in MinIO

```
MinIO State After Workflow:
├─ Bucket: "raw-images"
│  ├─ Policy: private (empty ACL)
│  ├─ Lifecycle Rule: [rule_type, days]
│  └─ Ready for: object upload/download
│
└─ Bucket: "thumbnails"
   ├─ Policy: private (empty ACL)
   ├─ Lifecycle Rule: [rule_type, days]
   └─ Ready for: object upload/download
```

**Validation Checks** (to confirm successful output):

```bash
# List buckets (should see raw-images, thumbnails)
mc ls minio/

# Check bucket policy (should be empty/private)
mc policy get minio/raw-images

# Check lifecycle config
mc ilm list minio/raw-images
```

---

## 3. Component Deep Dive

### 3.1 MinioConfig & LifecycleRuleConfig (Entities)

**Purpose**: Immutable data containers using Python `dataclass`.

```python
@dataclass(frozen=True)
class LifecycleRuleConfig:
	bucket: str    # Which bucket this rule applies to
	rule: str      # "expire" = delete, "archive" = move to GLACIER
	days: int      # After how many days to apply action

@dataclass(frozen=True)
class MinioConfig:
	endpoint: str                              # MinIO server address
	access_key: str                            # S3 access key
	secret_key: str                            # S3 secret key
	secure: bool                               # HTTPS flag
	buckets: List[str]                        # Bucket names
	lifecycle_rules: List[LifecycleRuleConfig] # Lifecycle configs
```

**Why frozen=True?**
- Prevents accidental mutation during workflow execution
- Makes it safe to pass around without defensive copying
- Signals to readers: "This is configuration, not mutable state"

### 3.2 bucket_adapters.create_minio_client() (Adapter Layer)

**Purpose**: Isolate external dependency (`minio` library) in a single, testable function.

```python
from minio import Minio

def create_minio_client(
	endpoint: str,
	access_key: str,
	secret_key: str,
	secure: bool
) -> Minio:
	"""Create and return a Minio client instance.

	Args:
		endpoint: MinIO server address (host:port)
		access_key: S3 access key
		secret_key: S3 secret key
		secure: Use HTTPS (True) or HTTP (False)

	Returns:
		Minio: Initialized Minio client instance

	Raises:
		ValueError: If endpoint format is invalid
	"""
	return Minio(
		endpoint,
		access_key=access_key,
		secret_key=secret_key,
		secure=secure
	)

__all__ = ["create_minio_client"]
```

**Why Adapter Pattern?**
- Isolates `minio` library usage to one place → easier to mock in tests
- Easy to swap MinIO with another S3-compatible service (e.g., AWS S3)
- Clearer dependency graph: Services depend on Adapters, not external libraries

### 3.3 bucket_services.ensure_buckets() (Service Layer)

**Purpose**: Pure business logic orchestration without direct external library calls.

**Main function**:
```python
def ensure_buckets(config: MinioConfig) -> None:
	"""Ensure all buckets in config exist with correct policies and lifecycle rules.

	Idempotent: Safe to call multiple times.
	"""
	client = bucket_adapters.create_minio_client(
		config.endpoint,
		config.access_key,
		config.secret_key,
		config.secure,
	)

	# Step 1: Create buckets and apply private policy
	for bucket in config.buckets:
		if not client.bucket_exists(bucket):
			client.make_bucket(bucket)
		_apply_private_policy(client, bucket)

	# Step 2: Apply lifecycle rules
	for rule in config.lifecycle_rules:
		_apply_lifecycle_rule(client, rule)
```

**Helper: _apply_private_policy()**
```python
def _apply_private_policy(client, bucket: str) -> None:
	"""Apply private access policy to bucket (no public read).

	Setting policy to empty string = deny all public access.
	"""
	client.set_bucket_policy(bucket, "")
```

**Helper: _apply_lifecycle_rule()**
```python
def _apply_lifecycle_rule(client, rule: LifecycleRuleConfig) -> None:
	"""Build and apply lifecycle configuration to bucket."""
	lifecycle_config = _build_lifecycle_config(rule)
	client.set_bucket_lifecycle(bucket_name=rule.bucket, config=lifecycle_config)
```

**Helper: _build_lifecycle_config()**
```python
def _build_lifecycle_config(rule: LifecycleRuleConfig) -> LifecycleConfig:
	"""Construct MinIO LifecycleConfig based on rule type.

	Raises:
		ValueError: If rule.rule is not "expire" or "archive"
	"""
	if rule.rule == "expire":
		# Delete objects after N days
		return LifecycleConfig(
			rules=[
				Rule(
					rule_id=f"{rule.bucket}-expire",
					status="Enabled",
					filter=Filter(prefix=""),  # Apply to all objects
					expiration=Expiration(days=rule.days),
				)
			]
		)

	if rule.rule == "archive":
		# Move objects to GLACIER storage after N days
		return LifecycleConfig(
			rules=[
				Rule(
					rule_id=f"{rule.bucket}-archive",
					status="Enabled",
					filter=Filter(prefix=""),
					transition=Transition(days=rule.days, storage_class="GLACIER"),
				)
			]
		)

	raise ValueError(f"Unsupported lifecycle rule: {rule.rule}.")
```

### 3.4 BucketWorkflowRouter (Router/Entry Point Layer)

**Purpose**: Single entry point for external callers; hides internal complexity.

```python
class BucketWorkflowRouter:
	"""Public API for Bucket Workflow."""

	def __init__(self, minio_config: MinioConfig) -> None:
		"""Constructor receives pre-built config object."""
		self._minio_config = minio_config

	def setup_buckets(self) -> None:
		"""Setup all buckets: create, apply policies, and lifecycle rules.

		Idempotent: Safe to call multiple times.
		"""
		bucket_services.ensure_buckets(self._minio_config)
```

**Why Router Pattern?**
- Single interface `setup_buckets()` for all bucket operations
- Encapsulates internal service/adapter complexity
- Easy to extend with additional methods (e.g., `delete_buckets()`, `validate_buckets()`)

---

## 4. Design Rationale & Trade-offs

### 4.1 Why Lifecycle Rules Support Both "Expire" and "Archive"?

| Strategy | Pros | Cons |
|----------|------|------|
| **Expire** (Delete) | Immediate cost savings, simple cleanup | Data loss, no recovery option |
| **Archive** (GLACIER) | Data preserved in cheaper tier, compliance-friendly | Slower retrieval (hours), costs for retrieval |

**Use Case**:
- `raw-images`: Archive after 365 days (keep for compliance/deep archive)
- `thumbnails`: Expire after 30 days (regenerable from raw images)

### 4.2 Why Empty Policy for "Private"?

In MinIO S3 API:
- Empty policy `""` = deny all public access
- This is the safest default for image storage (GDPR, privacy compliance)

### 4.3 Why Bucket Existence Check Before Creation?

Idempotency + graceful upgrades:
- If bucket already exists (e.g., from previous workflow run), don't fail
- Re-applying policy and lifecycle rules is safe (overwrite)
- Allows workflow to run multiple times without disruption

---

## 5. Testing Strategy

### 5.1 Unit Testing

```python
# tests/test_bucket_services.py
def test_ensure_buckets_idempotent():
	"""Calling ensure_buckets() twice should be safe."""
	config = build_test_config()
	ensure_buckets(config)
	ensure_buckets(config)  # Should not raise error

def test_apply_lifecycle_expire_rule():
	"""Verify expire rule generates correct LifecycleConfig."""
	rule = LifecycleRuleConfig(bucket="thumbnails", rule="expire", days=30)
	config = _build_lifecycle_config(rule)
	assert config.rules[0].expiration.days == 30

def test_apply_lifecycle_archive_rule():
	"""Verify archive rule generates correct LifecycleConfig."""
	rule = LifecycleRuleConfig(bucket="raw-images", rule="archive", days=365)
	config = _build_lifecycle_config(rule)
	assert config.rules[0].transition.storage_class == "GLACIER"
```

### 5.2 Integration Testing

```bash
# Setup MinIO in Docker
docker compose -f infra_compose_storage.yml up -d minio

# Run integration tests
pytest tests/test_bucket_workflow.py -v

# Verify buckets created
mc ls minio/

# Check policies
mc policy get minio/raw-images
mc policy get minio/thumbnails
```

---

## 6. Troubleshooting Common Issues

| Issue | Symptom | Root Cause | Solution |
|-------|---------|-----------|----------|
| Connection refused | `requests.exceptions.ConnectionError` | MinIO server not running | Start MinIO: `docker compose up minio` |
| Invalid credentials | `S3Error (Invalid Access Key...)` | Wrong access_key or secret_key | Check env vars match MinIO config |
| Bucket policy fails | `S3Error (Access Denied)` | Insufficient MinIO permissions | Use root credentials for setup |
| Lifecycle rule not applied | `S3Error (The specified bucket does not support...)` | Unsupported rule type | Check `rule` enum in config |
| Bucket already exists error | No error, but existing data at risk | Bucket creation conflict | Check `bucket_exists()` is called first |

---

## 7. Future Enhancements

- [ ] **Multi-region replication**: Add bucket replication config for disaster recovery
- [ ] **Versioning**: Enable object versioning for compliance
- [ ] **Encryption**: Add server-side encryption configuration
- [ ] **Monitoring**: Emit metrics (bucket size, object count) for observability
- [ ] **Health checks**: Add `validate_buckets()` to verify health periodically

---
