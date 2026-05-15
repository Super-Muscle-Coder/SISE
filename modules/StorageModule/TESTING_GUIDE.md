# StorageModule - Testing & Troubleshooting Guide

## 📋 Mục Lục

1. [Quick Start](#quick-start)
2. [Issue Analysis](#issue-analysis)
3. [Detailed Solutions](#detailed-solutions)
4. [Service Management](#service-management)
5. [Workflow Testing](#workflow-testing)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### ✅ Tóm Tắt Các Vấn Đề Đã Phát Hiện

| # | Vấn Đề | Mức Độ | Trạng Thái | Giải Pháp |
|---|--------|--------|-----------|----------|
| 1 | Python version mismatch | HIGH | ✓ FIXED | Use `py -3.13` |
| 2 | Missing redis_cache_adapters | MEDIUM | ✓ FIXED | Removed import |
| 3 | Incorrect relative paths | MEDIUM | ✓ FIXED | Use `Path(__file__).parent` |
| 4 | Services not running | CRITICAL | ⚠️ EXPECTED | Start with `start_storage_stack.ps1` |

---

## Issue Analysis

### 🔴 Vấn Đề 1: Python Version Mismatch

**Lỗi gốc**:
```
StorageModule requires Python 3.13, but system default is Python 3.14.4
```

**Nguyên nhân**: 
- Máy có nhiều phiên bản Python (3.11, 3.13.12, 3.14.4)
- `python` command mặc định dùng 3.14.4
- Dependencies (minio, psycopg, etc) chỉ cài trên Python 3.13.12

**Hiệu ứng**:
- Lỗi `ModuleNotFoundError: No module named 'minio'`
- Lỗi `ModuleNotFoundError: No module named 'pymilvus'`

**Giải pháp**: ✅ **ĐÃ KHẮC PHỤC**
```powershell
# ĐÚNG ✓
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py

# SAI ✗
python .\modules\StorageModule\tests\test_schema_workflow.py
```

---

### 🟡 Vấn Đề 2: Missing redis_cache_adapters Import

**Lỗi gốc**:
```
modules/StorageModule/app/adapters/__init__.py imported non-existent `redis_cache_adapters`
```

**Nguyên nhân**: 
- Thêm export vào `__all__` mà chưa tạo file implementation

**Hiệu ứng**:
- Lỗi `ModuleNotFoundError: No module named 'app.adapters.redis_cache_adapters'`

**Giải pháp**: ✅ **ĐÃ KHẮC PHỤC**
```python
# TRƯỚC:
from app.adapters.redis_cache_adapters import create_redis_client

# SAU (Removed):
# (No redis import)
```

---

### 🟡 Vấn Đề 3: Incorrect Relative Paths in Test Scripts

**Lỗi gốc**:
```
✗ File not found: modules/StorageModule/configs/storage.env.local
```

**Nguyên nhân**:
- Test scripts ở `/tests/` directory nhưng dùng relative path giả định cwd là workspace root
- Không tính đến thực tế vị trí của script

| Vị trí | Đường dẫn |
|--------|----------|
| Script | `E:\SISE\modules\StorageModule\tests\test_schema_workflow.py` |
| Config | `E:\SISE\modules\StorageModule\configs\storage.env.local` |
| **Path dùng** | ❌ `modules/StorageModule/configs/storage.env.local` |
| **Kết quả** | ❌ Tìm ở `E:\SISE\modules\StorageModule\tests\modules\StorageModule\configs\storage.env.local` |

**Giải pháp**: ✅ **ĐÃ KHẮC PHỤC**
```python
# TRƯỚC (SAI):
env_file = "modules/StorageModule/configs/storage.env.local"

# SAU (ĐÚNG):
script_dir = Path(__file__).parent  # tests/
workspace_root = script_dir.parent.parent  # E:\SISE\
env_file = workspace_root / "modules" / "StorageModule" / "configs" / "storage.env.local"
```

---

### 🔴 Vấn Đề 4: PostgreSQL/Storage Services Not Running

**Lỗi gốc**:
```
psycopg2.OperationalError: connection to server at "localhost" (::1), port 5432 
failed: Connection refused (0x0000274D/10061)
```

**Nguyên nhân**:
- Storage services (PostgreSQL, MinIO, Milvus, etc.) chưa được khởi động
- Services này chỉ chạy trong Docker containers định nghĩa trong `infra_compose_storage.yml`

**Hiệu ứng**:
- ✅ **Structural validation vẫn PASS** (imports, entities, adapters, routers)
- ❌ **Runtime execution FAIL** (schema migration, collection setup, etc.)

**Giải pháp**: ⚠️ **CẦN THỰC HIỆN** (Xem mục [Service Management](#service-management))

---

## Detailed Solutions

### 1️⃣ Khắc Phục Python Version

**Kiểm tra Python versions có sẵn**:
```powershell
py --list-paths
# Output:
# -3.14 (32 bit)           C:\Program Files\Python314\python.exe
# -3.13 (64 bit)           C:\Users\...\AppData\Local\Programs\Python\Python313\python.exe
# -3.11                    ...
```

**Kiểm tra dependencies trên Python 3.13**:
```powershell
py -3.13 -m pip list
# Should show: minio, pymilvus, psycopg[binary], sqlalchemy, alembic, redis
```

**Nếu thiếu dependencies**:
```powershell
cd modules\StorageModule
py -3.13 -m pip install -r storage_requirements.txt
```

---

### 2️⃣ Kiểm tra Imports Đã Fix

**Test imports mới**:
```powershell
py -3.13 -c "from app.adapters import schema_adapters; print('✓ Imports OK')"
```

**Nếu vẫn lỗi**, xóa Python cache:
```powershell
# Remove pycache
Get-ChildItem -Recurse -Path modules\StorageModule -Name __pycache__ | Remove-Item -Recurse -Force

# Retry test
py -3.13 -c "from app.adapters import schema_adapters; print('✓ Imports OK')"
```

---

### 3️⃣ Kiểm tra Relative Paths

**Test path resolution**:
```powershell
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
# Should show:
# ✓ Loaded from: E:\SISE\modules\StorageModule\configs\storage.env.local
# ✓ Loaded X env vars from E:\SISE\modules\StorageModule\configs\storage.env.local
```

---

### 4️⃣ Khởi Động Storage Services

**Xem chi tiết ở [Service Management](#service-management)**

---

## Service Management

### 📦 Khởi Động Services

**Phương pháp 1: Dùng script được cung cấp (RECOMMENDED)**
```powershell
# From E:\SISE directory:
.\modules\StorageModule\start_storage_stack.ps1 -Action up

# Expected output:
# 🚀 Starting storage services...
# [+] Running 6/6
#     ✓ postgres-postgres-1 Running
#     ✓ etcd-etcd-1 Running
#     ✓ minio-minio-1 Running
#     ✓ milvus-milvus-1 Running
#     ✓ redis-redis-1 Running

# ✅ Storage services started!
# Available services:
#   📦 PostgreSQL: postgresql://sise:sise_password@localhost:5432/sise
#   🪣  MinIO (API): http://minioadmin:minioadmin@localhost:9000
#   🪣  MinIO (Console): http://localhost:9001
#   🔍 Milvus: localhost:19530
#   📝 etcd: localhost:2379
#   💾 Redis: redis://localhost:6379
```

**Phương pháp 2: Manual Docker Compose**
```powershell
cd modules\StorageModule
docker-compose -f infra_compose_storage.yml up -d
```

### 🔍 Kiểm tra Status Services

```powershell
# Phương pháp 1: Dùng script
.\modules\StorageModule\start_storage_stack.ps1 -Action status

# Phương pháp 2: Manual
cd modules\StorageModule
docker-compose -f infra_compose_storage.yml ps
```

**Expected output**:
```
NAME              COMMAND                  SERVICE      STATUS         PORTS
sise-etcd         "etcd --enable-v2 ..."   etcd         Up 2 minutes   0.0.0.0:2379->2379/tcp
sise-minio        "minio server /data ..." minio        Up 2 minutes   0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
sise-milvus       "/tini -- milvus run ..." milvus      Up 2 minutes   0.0.0.0:19530->19530/tcp, 0.0.0.0:9091->9091/tcp
sise-postgres     "docker-entrypoint.s ..." postgres    Up 2 minutes   0.0.0.0:5432->5432/tcp
sise-redis        "redis-server --appe..." redis       Up 2 minutes   0.0.0.0:6379->6379/tcp
```

### 🧹 Dừng Services

```powershell
# Phương pháp 1: Dùng script
.\modules\StorageModule\start_storage_stack.ps1 -Action down

# Phương pháp 2: Manual
cd modules\StorageModule
docker-compose -f infra_compose_storage.yml down
```

### 📜 Xem Logs

```powershell
# Phương pháp 1: Tất cả services
.\modules\StorageModule\start_storage_stack.ps1 -Action logs

# Phương pháp 2: Specific service
cd modules\StorageModule
docker-compose -f infra_compose_storage.yml logs postgres -f
docker-compose -f infra_compose_storage.yml logs milvus -f
docker-compose -f infra_compose_storage.yml logs minio -f
```

---

## Workflow Testing

### ✅ Run Comprehensive Test Suite

```powershell
# From E:\SISE directory:
.\modules\StorageModule\run_storage_tests.ps1

# Expected output:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1 - Verify Python 3.13 Environment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✓ Python 3.13 is available
#   Python 3.13.12

# [STEP 2-5 output...]

# Test Summary Report:
#   ✓ [PASS] Schema Workflow
#   ✓ [PASS] Collection Workflow
#   ✓ [PASS] Bucket Workflow
#   ✓ [PASS] Seed Workflow
# 
# Summary:
#   ✓ Passed: 4
#   ✗ Failed: 0
#   ⊘ Skipped: 0
#
# ✅ All available tests completed successfully!
```

### 🔍 Run Individual Workflow Tests

**Schema Workflow**:
```powershell
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py

# Expected: ✓ Migration successful (or ⚠ Connection failed if DB not ready)
```

**Collection Workflow**:
```powershell
py -3.13 .\modules\StorageModule\tests\test_collection_workflow.py

# Expected: ✓ Collection setup successful
```

**Bucket Workflow**:
```powershell
py -3.13 .\modules\StorageModule\tests\test_bucket_workflow.py

# Expected: ✓ Buckets created
```

**Seed Workflow**:
```powershell
py -3.13 .\modules\StorageModule\tests\test_seed_workflow.py

# Expected: ✓ Sample data seeded
```

---

## Troubleshooting

### ❌ Problem: "ModuleNotFoundError: No module named 'minio'"

**Nguyên nhân**: Sử dụng Python sai hoặc dependencies chưa cài

**Giải pháp**:
```powershell
# Check Python version
py -3.13 --version

# Install dependencies
cd modules\StorageModule
py -3.13 -m pip install -r storage_requirements.txt

# Verify
py -3.13 -m pip list | grep -E "minio|pymilvus|psycopg|alembic"
```

---

### ❌ Problem: "psycopg2.OperationalError: connection refused"

**Nguyên nhân**: PostgreSQL chưa chạy

**Giải pháp**:
```powershell
# Check service status
docker ps | grep postgres

# Start services
.\modules\StorageModule\start_storage_stack.ps1 -Action up

# Wait 30-60 seconds
Start-Sleep -Seconds 60

# Verify PostgreSQL ready
docker-compose -f modules\StorageModule\infra_compose_storage.yml ps

# Retry test
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
```

---

### ❌ Problem: "File not found: modules/StorageModule/configs/storage.env.local"

**Nguyên nhân**: Relative path không đúng (ĐÃ FIX)

**Kiểm tra**: Đảm bảo bạn dùng phiên bản mới nhất của test scripts

```powershell
# Check if fixed
Select-String -Path .\modules\StorageModule\tests\test_schema_workflow.py `
  -Pattern "Path\(__file__\).parent"

# Should return:
# ...\test_schema_workflow.py:XX:script_dir = Path(__file__).parent
```

---

### ❌ Problem: Docker not found

**Giải pháp**:
1. Cài [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Khởi động Docker Desktop
3. Đợi Docker service ready (khoảng 1-2 phút)
4. Retry

```powershell
# Verify Docker
docker --version
docker-compose --version
```

---

### ⚠️ Problem: Services slow to start

**Giải pháp**:
```powershell
# Wait longer
Start-Sleep -Seconds 90

# Check logs
.\modules\StorageModule\start_storage_stack.ps1 -Action logs

# Check health
docker-compose -f modules\StorageModule\infra_compose_storage.yml ps
```

---

## 📝 Summary Checklist

Trước khi report issue, đảm bảo bạn đã:

- [ ] Dùng `py -3.13` (không phải `python`)
- [ ] Dependencies cài trên Python 3.13: `py -3.13 -m pip list`
- [ ] Relative paths fixed (test scripts có `Path(__file__).parent`)
- [ ] Redis import removed từ `app/adapters/__init__.py`
- [ ] Storage stack khởi động: `start_storage_stack.ps1 -Action up`
- [ ] Đợi 30-60 giây cho services healthy
- [ ] Kiểm tra service status: `docker-compose ps`
- [ ] Xem logs để tìm root cause: `docker-compose logs`

---

## 📚 Reference

| File | Mục Đích |
|------|----------|
| `modules/StorageModule/start_storage_stack.ps1` | Khởi động/dừng storage stack |
| `modules/StorageModule/run_storage_tests.ps1` | Chạy toàn bộ test suite |
| `modules/StorageModule/tests/test_schema_workflow.py` | Test schema workflow |
| `modules/StorageModule/tests/test_collection_workflow.py` | Test collection workflow |
| `modules/StorageModule/tests/test_bucket_workflow.py` | Test bucket workflow |
| `modules/StorageModule/tests/test_seed_workflow.py` | Test seed workflow |
| `modules/StorageModule/infra_compose_storage.yml` | Docker Compose định nghĩa |
| `.knowledge/agent02/Skill_02.md` | Issue log & solutions |
| `.knowledge/agent02/Log_02.md` | Event log |

