# StorageModule Scripts Documentation

## Overview
Các scripts này quản lý Docker stack cho StorageModule bao gồm PostgreSQL, Milvus, MinIO, Redis, và etcd.

## Scripts Available

### 1. `start_stack.cmd` - Khởi động Storage Stack
```cmd
cd modules\StorageModule\scripts
start_stack.cmd
```

**Chức năng:**
- Kiểm tra file `configs/storage.env.local` tồn tại
- Pull các image mới nhất từ Docker registry
- Khởi động toàn bộ Docker Compose stack
- Hiển thị trạng thái các service
- Liệt kê các endpoint kết nối

**Output:** Hiển thị trạng thái các container và endpoint kết nối

---

### 2. `stop_stack.cmd` - Dừng Storage Stack
```cmd
cd modules\StorageModule\scripts
stop_stack.cmd
```

**Chức năng:**
- Dừng tất cả containers

**Tùy chọn:**
```cmd
stop_stack.cmd --remove-volumes      # Xóa tất cả volumes (mất dữ liệu)
stop_stack.cmd --remove-images       # Xóa tất cả images
stop_stack.cmd --remove-volumes --remove-images  # Xóa cả volume và image
```

---

### 3. `health_check.cmd` - Kiểm tra Sức khỏe Stack
```cmd
cd modules\StorageModule\scripts
health_check.cmd
```

**Chức năng:**
- Kiểm tra trạng thái Docker Compose
- Kiểm tra kết nối từng service:
  - PostgreSQL (port 5432)
  - Redis (port 6379)
  - etcd (port 2379)
  - MinIO (port 9000)
  - Milvus (port 19530)
- Báo cáo health status cho mỗi service

**Output:** ✅ OK hoặc ❌ FAIL cho từng service

---

### 4. `view_logs.cmd` - Xem Logs Services
```cmd
cd modules\StorageModule\scripts

# Xem logs tất cả services (50 dòng cuối)
view_logs.cmd

# Xem logs của một service cụ thể (100 dòng cuối)
view_logs.cmd postgres
view_logs.cmd redis
view_logs.cmd etcd
view_logs.cmd minio
view_logs.cmd milvus
```

**Chức năng:**
- Hiển thị logs từ Docker Compose services
- Giúp debug các vấn đề service

---

## Quick Start Workflow

### Lần đầu tiên khởi động:
```cmd
# 1. Đảm bảo file config tồn tại
dir modules\StorageModule\configs\storage.env.local

# 2. Khởi động stack
cd modules\StorageModule\scripts
start_stack.cmd

# 3. Chờ tất cả services ready (2-3 phút, Milvus chậm nhất)
# 4. Kiểm tra health
health_check.cmd
```

### Kiểm tra cụ thể từng service:
```cmd
# Xem logs lỗi
view_logs.cmd

# Kiểm tra một service cụ thể
view_logs.cmd milvus

# Kiểm tra kết nối
health_check.cmd
```

### Khi phát triển xong:
```cmd
# Dừng stack (giữ dữ liệu)
stop_stack.cmd

# Dừng và xóa tất cả (clean slate)
stop_stack.cmd --remove-volumes --remove-images
```

---

## Service Endpoints

| Service | Endpoint | Credentials | Notes |
|---------|----------|-------------|-------|
| PostgreSQL | `localhost:5432` | User: `sise`, Pass: `sise_password` | Database: `sise` |
| MinIO S3 | `localhost:9000` | `minioadmin` / `minioadmin` | S3-compatible API |
| MinIO Web | `http://localhost:9001` | `minioadmin` / `minioadmin` | Web console |
| Milvus | `localhost:19530` | None (no auth) | Vector DB |
| Redis | `localhost:6379` | None | Cache |
| etcd | `localhost:2379` | None | Milvus metadata store |

---

## Connection Strings

**PostgreSQL:**
```
postgresql://sise:sise_password@localhost:5432/sise
```

**MinIO:**
```
http://localhost:9000 (API)
http://localhost:9001 (Web UI)
```

**Milvus:**
```
localhost:19530
```

**Redis:**
```
redis://localhost:6379
```

---

## Troubleshooting

### Port conflicts
Nếu gặp lỗi "port already in use":
```cmd
# Dừng stack cũ
stop_stack.cmd --remove-volumes

# Khởi động lại
start_stack.cmd
```

### Services not responding
```cmd
# 1. Kiểm tra health
health_check.cmd

# 2. Xem logs chi tiết
view_logs.cmd

# 3. Nếu vẫn không ổn, xóa volumes và restart
stop_stack.cmd --remove-volumes
start_stack.cmd
```

### Milvus takes too long to start
Milvus có thể mất 2-5 phút khởi động lần đầu. Chờ log:
```cmd
view_logs.cmd milvus
```

Tìm dòng `"Milvus start successfully"` để xác nhận ready.

---

## Configuration

Tất cả biến môi trường được định nghĩa trong:
- `configs/storage.env.example` - Template (không edit)
- `configs/storage.env.local` - Local config (edit theo nhu cầu)

Để thay đổi cấu hình:
1. Sửa `configs/storage.env.local`
2. Restart stack: `stop_stack.cmd` → `start_stack.cmd`

---

## Notes

- Tất cả data được persist trong Docker volumes
- Scripts dùng cú pháp Windows Batch `.cmd`
- Compose file: `infra_compose_storage.yml` (định nghĩa services, volumes, networks)
- Không commit `configs/storage.env.local` (local credentials)
- Commit `configs/storage.env.example` như template

---
