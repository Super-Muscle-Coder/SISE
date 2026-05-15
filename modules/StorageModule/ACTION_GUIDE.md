# 🎯 HÀNH ĐỘNG TIẾP THEO - ACTION GUIDE

## ⏱️ Timeline: 30 phút để hoàn thành validation

### Phase 1: Verification (5 phút) ✅

```powershell
# Step 1: Xác nhận Python 3.13
py -3.13 --version
# Expected: Python 3.13.12

# Step 2: Xác nhận imports
py -3.13 -c "from app.adapters import schema_adapters; print('✓ Imports OK')"
# Expected: ✓ Imports OK

# Step 3: Xác nhận đường dẫn config
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py | head -20
# Expected: ✓ Loaded from: E:\SISE\modules\StorageModule\configs\storage.env.local
```

### Phase 2: Start Infrastructure (60 phút) ⚠️

```powershell
# Step 4: Khởi động storage stack
.\modules\StorageModule\start_storage_stack.ps1 -Action up

# Expected output:
# 🚀 Starting storage services...
# ✅ Storage services started!
# Available services:
#   📦 PostgreSQL: postgresql://sise:sise_password@localhost:5432/sise
#   🪣  MinIO (API): http://minioadmin:minioadmin@localhost:9000
#   [...]

# Step 5: Đợi services healthy (60 giây)
Write-Host "⏳ Waiting for services to be healthy..."
Start-Sleep -Seconds 60

# Step 6: Kiểm tra status
docker-compose -f modules\StorageModule\infra_compose_storage.yml ps

# Expected: Tất cả services show "Up"
```

### Phase 3: Run End-to-End Tests (10 phút) 🚀

```powershell
# Step 7: Chạy toàn bộ test suite
.\modules\StorageModule\run_storage_tests.ps1

# Expected output:
# ✓ [PASS] Schema Workflow
# ✓ [PASS] Collection Workflow
# ✓ [PASS] Bucket Workflow
# ✓ [PASS] Seed Workflow
# 
# Summary:
#   ✓ Passed: 4
#   ✗ Failed: 0
#   ⊘ Skipped: 0
```

---

## 📋 QUICK CHECKLIST

Trước khi bắt đầu, đảm bảo bạn đã:

- [ ] Đọc file này và hiểu các bước
- [ ] Đã có Docker Desktop/Docker Engine cài
- [ ] Workspace là E:\SISE
- [ ] Terminal là PowerShell
- [ ] Internet connection ổn định (download Docker images)

---

## ❌ TROUBLESHOOTING - If Things Go Wrong

### Nếu Python 3.13 không tìm thấy

```powershell
# Check available versions
py --list-paths

# If Python 3.13 missing:
# 1. Install from python.org
# 2. Or add to PATH
```

### Nếu Docker không chạy

```powershell
# Check Docker
docker --version

# If error, need to:
# 1. Install Docker Desktop
# 2. Start Docker Desktop
# 3. Wait for it to be ready (1-2 minutes)
```

### Nếu services lỗi health check

```powershell
# View logs
.\modules\StorageModule\start_storage_stack.ps1 -Action logs

# Stop and restart
.\modules\StorageModule\start_storage_stack.ps1 -Action down
Start-Sleep -Seconds 10
.\modules\StorageModule\start_storage_stack.ps1 -Action up
# Wait 120 seconds
```

### Nếu tests still fail

```powershell
# Check each service individually
docker logs sise-postgres
docker logs sise-milvus
docker logs sise-minio
docker logs sise-redis
docker logs sise-etcd

# Or check specific workflow
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
# Review error message and check TESTING_GUIDE.md
```

---

## 📞 SUPPORT RESOURCES

| Vấn Đề | File | Section |
|--------|------|---------|
| "Connection refused" | `TESTING_GUIDE.md` | Troubleshooting |
| "ModuleNotFoundError" | `TESTING_GUIDE.md` | Troubleshooting |
| "File not found" | `TESTING_GUIDE.md` | Troubleshooting |
| "Docker not found" | `TESTING_GUIDE.md` | Troubleshooting |
| Details về các vấn đề | `ISSUE_ANALYSIS_AND_FIXES.md` | Main document |
| Issue solutions | `.knowledge/agent02/Skill_02.md` | Issues 001-004 |
| Event timeline | `.knowledge/agent02/Log_02.md` | Events 01-10 |

---

## ✅ SUCCESS CRITERIA

Khi hoàn thành, bạn sẽ thấy:

```
✅ Python 3.13 verified
✅ Imports working
✅ Config files loading
✅ PostgreSQL healthy
✅ Milvus healthy
✅ MinIO healthy
✅ Redis healthy
✅ etcd healthy
✅ Schema workflow: PASS
✅ Collection workflow: PASS
✅ Bucket workflow: PASS
✅ Seed workflow: PASS
```

---

## 🎓 LEARNING OUTCOMES

Sau khi hoàn thành:

1. ✅ Hiểu structure của StorageModule (5-layer workflow-centric)
2. ✅ Biết cách chạy tests với Python 3.13
3. ✅ Biết cách quản lý storage services via docker-compose
4. ✅ Biết location của tất cả helper scripts
5. ✅ Biết cách debug issues bằng logs và troubleshooting guide

---

## 📝 COMMAND REFERENCE

### Most Used Commands

```powershell
# Start services
.\modules\StorageModule\start_storage_stack.ps1 -Action up

# Run tests
.\modules\StorageModule\run_storage_tests.ps1

# Check status
docker-compose -f modules\StorageModule\infra_compose_storage.yml ps

# View logs
docker-compose -f modules\StorageModule\infra_compose_storage.yml logs -f

# Stop services
.\modules\StorageModule\start_storage_stack.ps1 -Action down

# Test specific workflow
py -3.13 .\modules\StorageModule\tests\test_schema_workflow.py
py -3.13 .\modules\StorageModule\tests\test_collection_workflow.py
py -3.13 .\modules\StorageModule\tests\test_bucket_workflow.py
py -3.13 .\modules\StorageModule\tests\test_seed_workflow.py
```

---

## 🔄 NEXT PHASE AFTER VALIDATION

Once tests pass completely:

1. Document any issues found
2. Update `.knowledge/agent02/Log_02.md` with completion event
3. Review Phase 1 against requirements
4. Plan Phase 2 (Business Logic Implementation)
5. Commit changes to git

```powershell
git status
git add modules/StorageModule/
git commit -m "feat: Complete StorageModule Phase 1 validation"
git push origin master
```

---

**Time Estimate**: 30-45 minutes total  
**Difficulty**: Easy (follow steps in order)  
**Prerequisites**: Docker Desktop, Python 3.13, PowerShell  
**Success Rate**: Very high (if steps followed)

---

Good luck! 🚀 You've got this!
