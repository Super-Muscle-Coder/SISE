# Infra Workflow - README

**Mục đích**: Tài liệu này mô tả vai trò, trách nhiệm, và cách sử dụng Infra Workflow - quản lý orchestration toàn bộ storage infrastructure stack.

**Loại tài liệu**: README (simple operational guide)

---

## 1. Infra Workflow là gì?

**Infra Workflow** không phải là một workflow cốt lõi như Schema, Collection, hoặc Bucket. Thay vào đó, nó là một **orchestrator tổng** quản lý toàn bộ storage infrastructure bằng Docker Compose.

### Vai trò chính
- **Định nghĩa tất cả services**: PostgreSQL, MinIO, Milvus, etcd, Redis
- **Quản lý networking**: Internal storage network (`storage_net`)
- **Quản lý persistent volumes**: Dữ liệu không bị mất khi container restart
- **Định nghĩa health checks**: Đảm bảo tất cả services sẵn sàng
- **Khởi động/dừng toàn bộ stack**: Single command to rule them all

---

## 2. Cấu trúc chính (Main Components)

### 2.1 Docker Compose File

**File**: `modules/StorageModule/infra_compose_storage.yml`

**Services định nghĩa**:

| Service | Image | Port | Volume | Purpose |
|---------|-------|------|--------|---------|
| **postgres** | postgres:16 | 5432 | `postgres_data` | PostgreSQL database (từ Schema Workflow) |
| **etcd** | bitnami/etcd:3.5 | 2379 | `etcd_data` | Key-value store (Milvus metadata) |
| **minio** | minio/minio:2024.x | 9000, 9001 | `minio_data` | Object storage (từ Bucket Workflow) |
| **milvus** | milvusdb/milvus:2.4.8 | 19530, 9091 | `milvus_data` | Vector database (từ Collection Workflow) |
| **redis** | redis:7 | 6379 | `redis_data` | Cache layer |

### 2.2 Network & Volumes

```yaml
networks:
  storage_net:
	driver: bridge
	# All services connected internally

volumes:
  postgres_data:    # PostgreSQL data persistence
  etcd_data:        # etcd data persistence
  minio_data:       # MinIO data persistence
  milvus_data:      # Milvus data persistence
  redis_data:       # Redis data persistence
```

---

## 3. Cách sử dụng (Usage)

### 3.1 Khởi động toàn bộ storage stack

```bash
cd modules/StorageModule

# Start all services
docker compose -f infra_compose_storage.yml up -d

# Expected output:
# Creating sise-postgres ... done
# Creating sise-etcd ... done
# Creating sise-minio ... done
# Creating sise-milvus ... done
# Creating sise-redis ... done

# Verify all services running
docker compose -f infra_compose_storage.yml ps
```

### 3.2 Dừng toàn bộ storage stack

```bash
docker compose -f infra_compose_storage.yml down

# To also remove volumes (WARNING: data loss)
docker compose -f infra_compose_storage.yml down -v
```

### 3.3 Xem logs của một service cụ thể

```bash
# PostgreSQL logs
docker compose -f infra_compose_storage.yml logs -f postgres

# MinIO logs
docker compose -f infra_compose_storage.yml logs -f minio

# Milvus logs
docker compose -f infra_compose_storage.yml logs -f milvus
```

### 3.4 Restart một service

```bash
docker compose -f infra_compose_storage.yml restart postgres
```

---

## 4. Cấu hình môi trường (Configuration)

### 4.1 Environment Variables (từ .env file)

Infra Workflow đọc các biến từ `.env` file hoặc inline:

```bash
# PostgreSQL
POSTGRES_USER=sise
POSTGRES_PASSWORD=sise_password
POSTGRES_DB=sise

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Milvus (sử dụng etcd + minio)
ETCD_ENDPOINTS=http://etcd:2379
MINIO_ADDRESS=minio:9000
```

### 4.2 Cách override default values

```bash
# Method 1: Create .env file
cat > modules/StorageModule/.env << EOF
POSTGRES_PASSWORD=my_secure_password
MINIO_ACCESS_KEY=my_access_key
MINIO_SECRET_KEY=my_secret_key
EOF

# Method 2: Export env vars before docker compose
export POSTGRES_PASSWORD=my_secure_password
docker compose -f infra_compose_storage.yml up -d

# Method 3: Inline with docker compose
POSTGRES_PASSWORD=my_secure_password docker compose -f infra_compose_storage.yml up -d
```

---

## 5. Health Checks & Validation

### 5.1 Check tất cả services running

```bash
docker compose -f infra_compose_storage.yml ps

# Expect: All services in "running" state with health check "healthy"
```

### 5.2 Test connectivity đến từng service

```bash
# PostgreSQL
docker compose -f infra_compose_storage.yml exec postgres pg_isready -U sise

# MinIO
docker compose -f infra_compose_storage.yml exec minio mc ready local

# Milvus
docker compose -f infra_compose_storage.yml exec milvus curl -f http://localhost:9091/healthz

# Redis
docker compose -f infra_compose_storage.yml exec redis redis-cli ping
```

### 5.3 Test từ host machine

```bash
# Test PostgreSQL connection
psql -h localhost -U sise -d sise

# Test MinIO access (via web console)
# Open: http://localhost:9001
# Login: minioadmin / minioadmin

# Test Milvus connection
python -c "from pymilvus import connections; connections.connect(host='localhost', port=19530); print('OK')"

# Test Redis connection
redis-cli -h localhost -p 6379 ping
```

---

## 6. Troubleshooting

### 6.1 Service không khởi động

**Problem**: `docker compose up` bị fail, service không running

**Solutions**:
```bash
# 1. Check logs
docker compose -f infra_compose_storage.yml logs postgres

# 2. Xóa data cũ và restart
docker compose -f infra_compose_storage.yml down -v
docker compose -f infra_compose_storage.yml up -d

# 3. Kiểm tra port conflicts
netstat -tuln | grep 5432   # Check PostgreSQL port
netstat -tuln | grep 9000   # Check MinIO port
```

### 6.2 Milvus không kết nối được tới etcd/minio

**Problem**: Milvus service stuck in "starting" state

**Solutions**:
```bash
# 1. Check etcd is healthy
docker compose -f infra_compose_storage.yml exec etcd etcdctl endpoint health

# 2. Check MinIO is reachable from Milvus
docker compose -f infra_compose_storage.yml exec minio mc ready local

# 3. Restart Milvus after etcd/minio ready
docker compose -f infra_compose_storage.yml restart milvus
```

### 6.3 Volume mount permissions (Linux)

**Problem**: `Permission denied` when writing to volumes

**Solutions**:
```bash
# Fix ownership
sudo chown -R 999:999 /var/lib/docker/volumes/sise_postgres_data/_data
sudo chown -R 999:999 /var/lib/docker/volumes/sise_minio_data/_data

# Or restart with proper permissions
docker compose -f infra_compose_storage.yml restart postgres minio
```

---

## 7. Data Persistence & Backup

### 7.1 Verificar data persistence

```bash
# 1. Insert data
docker compose -f infra_compose_storage.yml exec postgres psql -U sise -d sise -c "CREATE TABLE test (id INT);"

# 2. Stop and remove containers (but keep volumes)
docker compose -f infra_compose_storage.yml down

# 3. Start again
docker compose -f infra_compose_storage.yml up -d

# 4. Verify data still there
docker compose -f infra_compose_storage.yml exec postgres psql -U sise -d sise -c "\dt"
# Expected: test table still exists
```

### 7.2 Backup strategy (Recommended)

```bash
# Backup PostgreSQL
docker compose -f infra_compose_storage.yml exec postgres pg_dump -U sise sise > backup_sise.sql

# Backup MinIO (S3-like)
docker compose -f infra_compose_storage.yml exec minio mc mirror local/raw-images ./backup_raw_images/

# Backup volumes directory
tar -czf storage_volumes_backup.tar.gz /var/lib/docker/volumes/sise_*
```

---

## 8. Integration với workflow khác

### 8.1 Schema Workflow sử dụng Infra

```python
# Schema Workflow cần PostgreSQL running
# Infra Workflow cung cấp: postgres service at localhost:5432
DATABASE_URL = "postgresql://sise:sise_password@postgres:5432/sise"
```

### 8.2 Bucket Workflow sử dụng Infra

```python
# Bucket Workflow cần MinIO running
# Infra Workflow cung cấp: minio service at localhost:9000
MINIO_ENDPOINT = "http://minio:9000"  # Internal network
# OR from host: http://localhost:9000
```

### 8.3 Collection Workflow sử dụng Infra

```python
# Collection Workflow cần Milvus running
# Infra Workflow cung cấp: milvus service at milvus:19530
MILVUS_HOST = "milvus"
MILVUS_PORT = 19530
```

---

## 9. Advanced Operations

### 9.1 Scale up service (e.g., multiple Redis instances)

```yaml
# Modify infra_compose_storage.yml
redis-cache-1:
  image: redis:7
  container_name: sise-redis-cache-1
  ports:
	- "6379:6379"
  # ...

redis-cache-2:
  image: redis:7
  container_name: sise-redis-cache-2
  ports:
	- "6380:6379"
  # ...
```

### 9.2 Add custom network bridge

```yaml
networks:
  storage_net:
	driver: bridge
  api_net:
	driver: bridge
	# For communication with BackendModule

services:
  postgres:
	networks:
	  - storage_net
	  - api_net  # Exposed to backend
```

### 9.3 Health check customization

```yaml
postgres:
  healthcheck:
	test: ["CMD-SHELL", "pg_isready -U sise -d sise"]
	interval: 5s      # Check every 5 seconds
	timeout: 3s       # Timeout after 3 seconds
	retries: 10       # Mark unhealthy after 10 failures
	start_period: 20s # Wait 20s before first check
```

---

## 10. Related Resources

- **Infra Compose File**: `modules/StorageModule/infra_compose_storage.yml`
- **Schema Workflow Docs**: `modules/StorageModule/documents/schema_workflow/`
- **Bucket Workflow Docs**: `modules/StorageModule/documents/bucket_workflow/`
- **Collection Workflow Docs**: `modules/StorageModule/documents/collection_workflow/`
- **Docker Compose Manual**: https://docs.docker.com/compose/
- **MinIO Documentation**: https://docs.min.io/

---

## 11. Version & Maintenance

| Field | Value |
|-------|-------|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-05-12 |
| **Owner** | AG-02 (StorageModuleAgent) |
| **Maintenance Frequency** | As needed (when services updated) |

---
