## 🎯 HƯỚNG DẪN CHI TIẾT KHẮC PHỤC CÁC VẤN ĐỀ

### 📊 Tóm Tắt Nhanh

Từ logs test, tôi phát hiện **4 vấn đề chính**:

| # | Vấn Đề | Mức độ | Trạng thái | Giải pháp |
|---|--------|--------|-----------|-----------|
| **1** | Python 3.14.4 (default) thay vì 3.13 | 🔴 CRITICAL | ✅ **FIXED** | Dùng `py -3.13` |
| **2** | Stale import `redis_cache_adapters` | 🟡 MEDIUM | ✅ **FIXED** | Removed |
| **3** | Relative paths trong test scripts | 🟡 MEDIUM | ✅ **FIXED** | Path(__file__).parent |
| **4** | PostgreSQL không chạy | 🔴 EXPECTED | ⚠️ **NEED ACTION** | Start services |

---

## ✅ VẤN ĐỀ 1: Python Version Mismatch (ĐÃ KHẮC PHỤC)

### 🔍 Chẩn Đoán

```powershell
# Check Python versions
python --version
# Output: Python 3.14.4

py --list-paths
# Output:
# -3.14 (32 bit)           C:\Program Files\Python314\python.exe
# -3.13 (64 bit)           C:\Users\...\AppData\...\Python313\python.exe
# -3.11                    ...
```

**Vấn Đề**: Python 3.13 có tất cả dependencies, nhưng default là 3.14.4 (không có)

### 💊 Khắc Phục

✅ **Đã tự động khắc phục bằng cách dùng `py -3.13` trong mọi test script**

```powershell
# ĐÚNG ✓
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py

# SAI ✗
python .\modules\StorageModule\tests\test_schema_workflow.py
```

---

## ✅ VẤN ĐỀ 2: Missing redis_cache_adapters (ĐÃ KHẮC PHỤC)

### 🔍 Chẩn Đoán

**Logs hiển thị**: Không có lỗi này trong test vì đã được remove trước đó

**File bị ảnh hưởng**: `modules/StorageModule/app/adapters/__init__.py`

### 💊 Khắc Phục

✅ **Đã remove hoàn toàn - không cần thêm action**

```python
# TRƯỚC (SAI):
from app.adapters.redis_cache_adapters import create_redis_client
__all__ = [..., "create_redis_client"]

# SAU (ĐÚNG):
# (Removed completely)
```

**Verification**:
```powershell
py -3.13 -c "from app.adapters import schema_adapters; print('✓ Import OK')"
# Output: ✓ Import OK
```

---

## ✅ VẤN ĐỀ 3: Incorrect Relative Paths (ĐÃ KHẮC PHỤC)

### 🔍 Chẩn Đoán

**Logs hiển thị**: 
```
✗ File not found: modules/StorageModule/configs/storage.env.local
```

**Root cause**: Test scripts ở `/tests/` nhưng dùng hardcoded relative path

```
Test script:   E:\SISE\modules\StorageModule\tests\test_schema_workflow.py
Config file:   E:\SISE\modules\StorageModule\configs\storage.env.local
Old path used: "modules/StorageModule/configs/storage.env.local"
Result: ❌ Not found (looked in wrong place)
```

### 💊 Khắc Phục

✅ **Tất cả 4 test scripts đã được sửa**:

Files updated:
- `modules/StorageModule/tests/test_schema_workflow.py` ✓
- `modules/StorageModule/tests/test_collection_workflow.py` ✓
- `modules/StorageModule/tests/test_bucket_workflow.py` ✓
- `modules/StorageModule/tests/test_seed_workflow.py` ✓

**Thay đổi chi tiết**:
```python
# TRƯỚC (SAI):
env_file = "modules/StorageModule/configs/storage.env.local"
env_vars = load_env_from_file(env_file)

# SAU (ĐÚNG):
script_dir = Path(__file__).parent  # tests/ directory
workspace_root = script_dir.parent.parent  # E:\SISE\
env_file = workspace_root / "modules" / "StorageModule" / "configs" / "storage.env.local"
env_vars = load_env_from_file(str(env_file))
```

**Verification**:
```powershell
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
# Should show: ✓ Loaded from: E:\SISE\modules\StorageModule\configs\storage.env.local
```

---

## ⚠️ VẤN ĐỀ 4: PostgreSQL/Services Not Running (CẦN ACTION)

### 🔍 Chẩn Đoán

**Logs hiển thị**:
```
psycopg2.OperationalError: connection to server at "localhost" (::1), port 5432 
failed: Connection refused (0x0000274D/10061)
```

**Nguyên nhân**: PostgreSQL chưa chạy trong Docker

**Tuy nhiên**: ✅ Structural validation vẫn PASS ✓
```
✓ All imports successful
✓ Entity creation successful
✓ Adapter functions available
✓ Router creation successful
⚠ Database migration (PostgreSQL not running - expected)
```

### 💊 Khắc Phục (BƯỚC CẦN THỰC HIỆN)

#### 🔧 Bước 1: Khởi Động Storage Stack

**Method A - Dùng script (RECOMMENDED)**:
```powershell
# From workspace root (E:\SISE)
.\modules\StorageModule\start_storage_stack.ps1 -Action up

# Wait 30-60 seconds...
# Should see: ✅ Storage services started!
```

**Method B - Manual Docker Compose**:
```powershell
cd modules\StorageModule
docker-compose -f infra_compose_storage.yml up -d

# Wait 30-60 seconds
docker-compose ps
```

#### 🔧 Bước 2: Kiểm tra Services Ready

```powershell
# Check status
docker-compose -f modules\StorageModule\infra_compose_storage.yml ps

# All should show "Up X minutes" and PASS health checks:
# postgres    ✓ Up (health: healthy)
# etcd        ✓ Up (health: healthy)
# minio       ✓ Up
# milvus      ✓ Up (health: healthy)
# redis       ✓ Up

# If not healthy, wait longer
Start-Sleep -Seconds 30
```

#### 🔧 Bước 3: Re-run Tests

```powershell
# Run comprehensive test suite
.\modules\StorageModule\run_storage_tests.ps1

# Or run individual workflows
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
py -3.13 .\modules\StorageModule\tests\test_collection_workflow.py
py -3.13 .\modules\StorageModule\tests\test_bucket_workflow.py
py -3.13 .\modules\StorageModule\tests\test_seed_workflow.py
```

**Expected output** (after services running):
```
✓ All imports successful
✓ Entity creation successful
✓ Adapter functions available
✓ Router creation successful
✓ Database migration successful  ← Changed from ⚠ to ✓
```

---

## 📦 New Helper Scripts Created

Tôi đã tạo 2 script helper để dễ quản lý:

### 1. `start_storage_stack.ps1` - Quản lý Storage Stack

```powershell
# Start services
.\modules\StorageModule\start_storage_stack.ps1 -Action up

# Check status
.\modules\StorageModule\start_storage_stack.ps1 -Action status

# View logs
.\modules\StorageModule\start_storage_stack.ps1 -Action logs

# Stop services
.\modules\StorageModule\start_storage_stack.ps1 -Action down
```

**Features**:
- ✓ Automatic environment variable loading
- ✓ Health check verification
- ✓ Service endpoint display
- ✓ Color-coded output
- ✓ Error handling

### 2. `run_storage_tests.ps1` - Toàn Bộ Test Suite

```powershell
# Run all tests with comprehensive reporting
.\modules\StorageModule\run_storage_tests.ps1
```

**Features**:
- ✓ Verify Python 3.13
- ✓ Check Docker availability
- ✓ Verify all storage services running
- ✓ Run 4 workflow tests (schema, collection, bucket, seed)
- ✓ Detailed summary report
- ✓ Guidance for next steps

---

## 📚 New Documentation Created

### 1. `TESTING_GUIDE.md` - Comprehensive Testing Guide

Contains:
- Quick start checklists
- Detailed issue analysis với illustrations
- Step-by-step solutions
- Service management commands
- Workflow testing procedures
- Troubleshooting section
- Reference guide

### 2. This File - Quick Diagnostics & Actions

---

## 🚀 RECOMMENDED NEXT STEPS

### **Immediately** (5 minutes):

1. ✅ Verify fixes applied (relative paths, Python 3.13)
   ```powershell
   py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
   ```

2. ✅ Check import resolution works
   ```powershell
   py -3.13 -c "from app.adapters import schema_adapters; print('✓')"
   ```

### **Next** (10 minutes):

3. ⚠️ **START STORAGE SERVICES** (Main blocker)
   ```powershell
   .\modules\StorageModule\start_storage_stack.ps1 -Action up
   # Wait 60 seconds
   ```

4. ✅ Verify services running
   ```powershell
   docker-compose -f modules\StorageModule\infra_compose_storage.yml ps
   ```

### **Then** (5 minutes):

5. ✅ Run complete test suite
   ```powershell
   .\modules\StorageModule\run_storage_tests.ps1
   ```

6. ✅ Update knowledge base if any new issues found
   ```
   .knowledge/agent02/Log_02.md
   .knowledge/agent02/Skill_02.md
   ```

---

## ✅ VERIFICATION CHECKLIST

Before reporting any issues, verify:

- [ ] Using `py -3.13` (not `python`)
- [ ] Python 3.13 has all dependencies: `py -3.13 -m pip list | grep minio`
- [ ] Test scripts have relative path fix: `Select-String -Path .\modules\StorageModule\tests\test_schema_workflow.py -Pattern "Path\(__file__\).parent"`
- [ ] No redis import in adapters: `Select-String -Path .\modules\StorageModule\app\adapters\__init__.py -Pattern "redis"`
- [ ] Services running: `docker-compose -f modules\StorageModule\infra_compose_storage.yml ps`
- [ ] All services show "Up" status (waited 60+ seconds)
- [ ] Re-ran test suite: `.\modules\StorageModule\run_storage_tests.ps1`

---

## 📋 File Changes Summary

**Modified Files**:
- ✅ `modules/StorageModule/tests/test_schema_workflow.py` - Fixed relative paths
- ✅ `modules/StorageModule/tests/test_collection_workflow.py` - Fixed relative paths
- ✅ `modules/StorageModule/tests/test_bucket_workflow.py` - Fixed relative paths
- ✅ `modules/StorageModule/tests/test_seed_workflow.py` - Fixed relative paths
- ✅ `.knowledge/agent02/Skill_02.md` - Added Issue 003 & 004 documentation

**Created Files**:
- ✅ `modules/StorageModule/start_storage_stack.ps1` - Service management
- ✅ `modules/StorageModule/run_storage_tests.ps1` - Test automation
- ✅ `modules/StorageModule/TESTING_GUIDE.md` - Comprehensive guide

---

## 🔗 Quick Links

| Document | Mục Đích |
|----------|----------|
| [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) | Full testing & troubleshooting guide |
| [`.knowledge/agent02/Skill_02.md`](../../../.knowledge/agent02/Skill_02.md) | Issue log & solutions |
| [`.knowledge/agent02/Log_02.md`](../../../.knowledge/agent02/Log_02.md) | Event timeline |

