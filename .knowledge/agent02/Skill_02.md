# Skill_02.md

## Metadata
- id: SKILL_AG02_20260512
- agent_id: AG-02
- agent_name: StorageModuleAgent
- skill_version: 1.0.0
- created_at: 2026-05-12
- last_updated: 2026-05-12
- status: active
- retention_policy_days: 365

---

## Issue 001: Python Version Mismatch in StorageModule Execution

### Issue Summary
- **Issue ID**: ISS_AG02_001
- **Severity**: HIGH
- **Status**: RESOLVED
- **Detection Date**: 2026-05-12
- **Resolution Date**: 2026-05-12

### Problem Description
StorageModule requires **Python 3.13** per agent_boundaries.yaml. System has Python 3.14.4 as default, which lacks StorageModule dependencies (minio, psycopg, etc.).

### Root Cause
Multiple Python versions on system:
- Python 3.14.4 (default): Minimal dependencies
- Python 3.13.12 (user AppData): Has all required dependencies
- Python 3.11: Not tested

### Solution: Use Explicit Python Version
```bash
py -3.13 .\modules\StorageModule\test_schema_workflow.py
py -3.13 .\modules\StorageModule\storage_main.py schema
```

### Verification ✓
Schema workflow test passed:
```
✓ All imports successful
✓ Entity creation successful
✓ Adapter functions available
✓ Router creation successful
⚠ Database migration (PostgreSQL not running - expected)
```

### Prevention
1. Add Python version check to workflow entrypoints
2. Create venv or use `py -3.13` wrapper script
3. Document in module README

---

## Issue 002: Missing redis_cache_adapters Import

### Issue Summary
- **Issue ID**: ISS_AG02_002
- **Severity**: MEDIUM
- **Status**: RESOLVED
- **Detection Date**: 2026-05-12
- **Resolution Date**: 2026-05-12

### Problem
`modules/StorageModule/app/adapters/__init__.py` imported non-existent `redis_cache_adapters` module.

### Root Cause
Redis functionality reference added to exports without creating the implementation file.

### Solution
Removed the non-existent import:
```python
# BEFORE:
from app.adapters.redis_cache_adapters import create_redis_client
__all__ = [..., "create_redis_client"]

# AFTER:
# Import removed, export removed
```

### Lessons Learned
1. All items in `__all__` must have implementations
2. Test imports early to catch these issues
3. Clean removal: Remove all references, not just implementation

---

## Issue 003: Incorrect Relative Paths in Test Scripts

### Issue Summary
- **Issue ID**: ISS_AG02_003
- **Severity**: MEDIUM
- **Status**: RESOLVED
- **Detection Date**: 2026-05-12
- **Resolution Date**: 2026-05-12

### Problem
Test scripts in `modules/StorageModule/tests/` were using relative paths `modules/StorageModule/configs/storage.env.local` which assumed execution from workspace root, causing file-not-found errors when tests were run.

### Root Cause
Test scripts did not adjust relative paths based on their actual location in the file system hierarchy:
- Test script location: `E:\SISE\modules\StorageModule\tests\test_schema_workflow.py`
- Config file location: `E:\SISE\modules\StorageModule\configs\storage.env.local`
- Relative path used: `modules/StorageModule/configs/storage.env.local` (assumed E:\SISE\ as cwd)
- Actual problem: Path was relative to script location, not workspace root

### Solution
Updated all test scripts to compute absolute paths from script location:
```python
script_dir = Path(__file__).parent  # tests/ directory
workspace_root = script_dir.parent.parent  # E:\SISE\
env_file = workspace_root / "modules" / "StorageModule" / "configs" / "storage.env.local"
env_vars = load_env_from_file(str(env_file))
```

### Files Updated
- `modules/StorageModule/tests/test_schema_workflow.py`
- `modules/StorageModule/tests/test_collection_workflow.py`
- `modules/StorageModule/tests/test_bucket_workflow.py`
- `modules/StorageModule/tests/test_seed_workflow.py`

### Lessons Learned
1. Always use `Path(__file__).parent` to locate script directory
2. Never assume current working directory for cross-module file access
3. Test scripts must be runnable from any directory with consistent results

---

## Issue 004: PostgreSQL/Storage Services Not Running During Tests

### Issue Summary
- **Issue ID**: ISS_AG02_004
- **Severity**: CRITICAL (for end-to-end workflows)
- **Status**: DOCUMENTED (structural validation works, runtime needs services)
- **Detection Date**: 2026-05-12

### Problem
Schema migration test encountered:
```
psycopg2.OperationalError: connection to server at "localhost" (::1), port 5432 
failed: Connection refused
```

### Root Cause
Storage services (PostgreSQL, MinIO, Milvus, Redis, etcd) were not running. These services must be started via Docker Compose.

### Solution: Start Services

**Method 1 - Using provided script**:
```powershell
.\modules\StorageModule\start_storage_stack.ps1 -Action up
# Wait 30-60 seconds for services to be healthy
```

**Method 2 - Manual Docker Compose**:
```powershell
cd modules\StorageModule
docker-compose -f infra_compose_storage.yml up -d
# Wait 30-60 seconds for services
```

**Service Endpoints After Startup**:
```
PostgreSQL:    postgresql://sise:sise_password@localhost:5432/sise
MinIO API:     http://minioadmin:minioadmin@localhost:9000
MinIO Console: http://localhost:9001
Milvus:        localhost:19530
etcd:          localhost:2379
Redis:         redis://localhost:6379
```

### Workflow Execution After Services Ready

```powershell
# Using comprehensive test runner
.\modules\StorageModule\run_storage_tests.ps1

# Or individual workflows
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
py -3.13 .\modules\StorageModule\tests\test_collection_workflow.py
py -3.13 .\modules\StorageModule\tests\test_bucket_workflow.py
py -3.13 .\modules\StorageModule\tests\test_seed_workflow.py
```

### Important Notes
- **Structural validation** (imports, entities, adapters, routers) works WITHOUT services
- **Runtime execution** (migrations, collection setup, bucket creation, seeding) REQUIRES services
- Test suite automatically distinguishes between these two phases
- All tests use Python 3.13 via `py -3.13` explicit selection

### Lessons Learned
1. Separate infrastructure validation from business logic validation
2. Provide clear distinction: "structural OK" vs "runtime needs services"
3. Create helper scripts for service lifecycle (start/stop/status/logs)
4. Document all service endpoints and credentials clearly

---

## Summary of Resolved Issues

| ID | Issue | Severity | Status | Resolution |
|----|-------|----------|--------|------------|
| ISS_AG02_001 | Python version mismatch | HIGH | ✓ RESOLVED | Use `py -3.13` explicitly |
| ISS_AG02_002 | Missing redis_cache_adapters | MEDIUM | ✓ RESOLVED | Removed stale import |
| ISS_AG02_003 | Incorrect relative paths | MEDIUM | ✓ RESOLVED | Use `Path(__file__).parent` |
| ISS_AG02_004 | Services not running | CRITICAL | ✓ DOCUMENTED | Use `start_storage_stack.ps1` |

