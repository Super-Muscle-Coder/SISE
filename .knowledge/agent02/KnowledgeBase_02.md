# =============================================================================
# KNOWLEDGE BASE — AG-02 StorageModuleAgent
# =============================================================================
# Writer  : Project Owner + AG-00 + AG-02 (đề xuất, AG-00 approve)
# Reader  : AG-02 chủ yếu
# =============================================================================

## 1. DOMAIN KNOWLEDGE: POSTGRESQL

### 1.1 Alembic Migration Workflow

AG-02 chịu trách nhiệm toàn bộ schema lifecycle. Quy trình chuẩn:

```bash
# Tạo migration mới
alembic revision --autogenerate -m "create_users_table"

# Chạy migration
alembic upgrade head

# Rollback 1 bước
alembic downgrade -1

# Xem lịch sử migration
alembic history --verbose
```

> ⚠️ **BẮT BUỘC**: Mỗi migration phải có cả `upgrade()` và `downgrade()`.
> Migration không có downgrade sẽ bị AG-00 reject khi review PR.

### 1.2 Schema chuẩn theo data_schema.yaml

Thứ tự tạo bảng phải đúng dependency (foreign key constraints):
```
1. users
2. friends      (FK → users)
3. albums       (FK → users)
4. images       (FK → users, albums)
```

### 1.3 Index strategy

```sql
-- Các index đã được định nghĩa trong data_schema.yaml, không được thêm/bớt tùy tiện:
CREATE INDEX IF NOT EXISTS idx_images_user_id      ON images (user_id);
CREATE INDEX IF NOT EXISTS idx_images_privacy_level ON images (privacy_level);
CREATE INDEX IF NOT EXISTS idx_images_created_at   ON images (created_at);
CREATE INDEX IF NOT EXISTS idx_images_tags_gin     ON images USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_images_index_status ON images (index_status);

-- friends table:
CREATE INDEX IF NOT EXISTS idx_friends_user_id   ON friends (user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends (friend_id);
```

### 1.4 Soft Delete pattern

Bảng `images` dùng soft delete qua cột `deleted_at`:
```sql
-- Xóa mềm (AG-03 gọi khi user delete ảnh)
UPDATE images SET deleted_at = NOW() WHERE id = $1;

-- AG-02 phải đảm bảo tất cả query đều filter deleted_at IS NULL
-- AG-03 chịu trách nhiệm logic, AG-02 chỉ cần biết convention này tồn tại
```

---

## 2. DOMAIN KNOWLEDGE: MILVUS

### 2.1 Collection lifecycle

```python
from pymilvus import MilvusClient, DataType

client = MilvusClient(uri=f"http://{MILVUS_HOST}:{MILVUS_PORT}")

# Schema definition — phải khớp CHÍNH XÁC với data_schema.yaml → milvus
schema = client.create_schema(auto_id=False, enable_dynamic_field=False)
schema.add_field("image_id",     DataType.VARCHAR,      is_primary=True, max_length=36)
schema.add_field("vector",       DataType.FLOAT_VECTOR, dim=512)   # = global_configs.vector_dim
schema.add_field("user_id",      DataType.INT64)
schema.add_field("privacy_level",DataType.INT32)

# Index params — theo data_schema.yaml → milvus.index_params
index_params = client.prepare_index_params()
index_params.add_index(
    field_name="vector",
    index_type="HNSW",
    metric_type="COSINE",
    params={"M": 16, "efConstruction": 200}
)

# Idempotent creation
if not client.has_collection("sise_v1"):
    client.create_collection("sise_v1", schema=schema)
    client.create_index("sise_v1", index_params)
    client.load_collection("sise_v1")
```

### 2.2 HNSW Parameters — tại sao chọn M=16, efConstruction=200

| Parameter | Giá trị | Ý nghĩa |
|---|---|---|
| `M` | 16 | Mỗi node có tối đa 16 cạnh kết nối. Tăng M → recall cao hơn, RAM nhiều hơn |
| `efConstruction` | 200 | Candidate pool khi build. Tăng → chính xác hơn, build chậm hơn |
| `ef` (search) | 64 | Candidate pool khi query. Tăng → chính xác hơn, query chậm hơn |

**Không tự ý thay đổi các giá trị này.** Nếu cần tune, đề xuất AG-00 cập nhật data_schema.yaml trước.

### 2.3 Collection backup (snapshot)

```bash
# Chạy weekly theo backup_and_dr trong data_schema.yaml
# Script: modules/StorageModule/scripts/backup_milvus.sh
curl -X POST "http://milvus-standalone:9091/api/v1/snapshot" \
  -H "Content-Type: application/json" \
  -d '{"collection_name": "sise_v1"}'
```

---

## 3. DOMAIN KNOWLEDGE: MINIO

### 3.1 Bucket initialization script (idempotent)

```python
from minio import Minio

client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)

for bucket in ["raw-images", "thumbnails"]:
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
```

### 3.2 Object naming convention

```
{user_id}/{album_id}/{image_id}.jpg
```

Ví dụ: `42/7/550e8400-e29b-41d4-a716-446655440000.jpg`

AG-02 **không tự generate** object_key. AG-03 generate và truyền vào khi gọi Storage.

### 3.3 Lifecycle rules

Được cấu hình theo `data_schema.yaml → minio.lifecycle_rules`:
- `thumbnails`: expire sau 365 ngày
- `raw-images`: archive sau 3650 ngày (10 năm)

---

## 4. DOMAIN KNOWLEDGE: REDIS

AG-02 chịu trách nhiệm **cài đặt và cấu hình** Redis container. AG-03 chịu trách nhiệm **sử dụng** Redis cho cache và Celery broker.

Cấu hình Redis container:
```yaml
# Trong docker-compose.storage.yml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
```

---

## 5. DOCKER COMPOSE RESPONSIBILITIES

AG-02 viết `docker-compose.storage.yml` bao gồm:
```yaml
services:
  postgres:    # image: postgres:16-alpine
  milvus-standalone:  # image: milvusdb/milvus:v2.4.x
  etcd:        # phụ trợ cho Milvus
  minio:       # image: minio/minio
  redis:       # image: redis:7-alpine
```

AG-02 **không** viết config cho: `backend`, `ai-service`, `frontend-web`, `celery-worker`.
AG-00 sẽ merge tất cả vào `docker-compose.yml` chính ở Phase 5.

---

## 6. RANH GIỚI CỨNG

- AG-02 **không** implement business logic (ví dụ: không viết "nếu user xóa album thì xóa tất cả ảnh" — đó là AG-03).
- AG-02 chỉ cung cấp **infrastructure layer**: schema, index, buckets, Docker configs, scripts.
- AG-02 **không** gọi AG-01 hay AG-03.
- Mọi thay đổi schema phải qua Alembic migration, **không** ALTER TABLE thủ công.
