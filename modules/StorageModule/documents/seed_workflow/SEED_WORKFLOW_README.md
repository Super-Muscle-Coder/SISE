# Seed Workflow - README

**Mục đích**: Tài liệu này mô tả vai trò, trách nhiệm, và cách sử dụng Seed Workflow - tạo dữ liệu mẫu để testing.

**Loại tài liệu**: README (simple operational guide)

---

## 1. Seed Workflow là gì?

**Seed Workflow** không phải là một workflow cốt lõi như Schema, Collection, hoặc Bucket. Thay vào đó, nó là một **test data generator** tạo dữ liệu mẫu để:
- Testing logic của backend (upload, search, indexing) mà không cần AI service
- Populate databases với realistic sample data
- Validate end-to-end flows trước khi production deployment

### Vai trò chính
- **Tạo sample users**: 5+ test users với email khác nhau
- **Tạo sample albums**: 10+ albums được assign cho các users
- **Tạo sample images**: 50+ image metadata records và dummy objects trong MinIO
- **Đảm bảo idempotency**: Chạy nhiều lần không sinh duplicate data

---

## 2. Cấu trúc chính (Main Components)

### 2.1 Core Files

| File | Purpose |
|------|---------|
| `app/entities/seed_entities.py` | SeedConfig dataclass |
| `app/adapters/seed_adapters.py` | Re-export adapters từ schema/bucket workflows |
| `app/services/seed_services.py` | Seed orchestration logic (seed_storage function) |
| `app/routers/seed_routers.py` | SeedWorkflowRouter public API |
| `scripts/seed/seed_test_data.py` | CLI entry point |

### 2.2 Data Generated

```
Test Dataset:
├── Users (N=5, configurable)
│   ├── user_id (UUID)
│   ├── username: "seed_user_1", "seed_user_2", ...
│   ├── email: "seed_user_1@example.com", ...
│   └── password_hash: "seed_password_hash"
│
├── Albums (N=10, configurable)
│   ├── album_id (UUID)
│   ├── user_id (assigned from users)
│   ├── title: "Seed Album 01", "Seed Album 02", ...
│   ├── description: "Seed album for testing"
│   └── is_public: true
│
└── Images (N=50, configurable)
	├── image_id (UUID)
	├── user_id (inherited from album)
	├── album_id (assigned from albums)
	├── minio_bucket: "raw-images"
	├── minio_object_name: "{user_id}/{album_id}/{image_id}.jpg"
	├── privacy_level: 2 (public)
	├── tags: ["seed", "sample"]
	└── index_status: "ready"
```

---

## 3. Cách sử dụng (Usage)

### 3.1 Chuẩn bị (Prerequisites)

```bash
# 1. Ensure PostgreSQL is running
docker compose -f infra_compose_storage.yml up -d postgres

# 2. Run Schema Workflow (creates tables)
python scripts/schema/run_schema_migrations.py

# 3. Ensure MinIO is running
docker compose -f infra_compose_storage.yml up -d minio

# 4. Run Bucket Workflow (creates buckets)
python -c "
from app.routers.bucket_routers import BucketWorkflowRouter
from app.entities.bucket_entities import MinioConfig, LifecycleRuleConfig
config = MinioConfig(...)  # Load from env
BucketWorkflowRouter(config).setup_buckets()
"
```

### 3.2 Chạy Seed Workflow qua CLI

```bash
# Set environment variables
export DATABASE_URL="postgresql://sise:sise_password@localhost:5432/sise"
export MINIO_ENDPOINT="http://localhost:9000"
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="minioadmin"
export BUCKET_RAW_IMAGES="raw-images"
export BUCKET_THUMBNAILS="thumbnails"
export SEED_USER_COUNT=5
export SEED_ALBUM_COUNT=10
export SEED_IMAGE_COUNT=50

# Run seed script
python modules/StorageModule/scripts/seed/seed_test_data.py

# Expected output:
# Seeding storage with sample data...
# Created 5 users
# Created 10 albums
# Created 50 images
# Seed complete!
```

### 3.3 Chạy Seed Workflow via Python API

```python
from app.entities.bucket_entities import MinioConfig, LifecycleRuleConfig
from app.entities.schema_entities import PostgresConfig
from app.entities.seed_entities import SeedConfig
from app.routers.seed_routers import SeedWorkflowRouter

# Prepare configs
postgres_config = PostgresConfig(
	database_url="postgresql://sise:sise_password@localhost:5432/sise"
)

minio_config = MinioConfig(
	endpoint="localhost:9000",
	access_key="minioadmin",
	secret_key="minioadmin",
	secure=False,
	buckets=["raw-images", "thumbnails"],
	lifecycle_rules=[]  # Don't need for seed
)

seed_config = SeedConfig(
	user_count=5,
	album_count=10,
	image_count=50
)

# Run workflow
router = SeedWorkflowRouter(postgres_config, minio_config)
router.run_seed(seed_config)

# Data now in PostgreSQL and MinIO
```

---

## 4. Cấu hình (Configuration)

### 4.1 Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `MINIO_ENDPOINT` | Yes | - | MinIO server address |
| `MINIO_ACCESS_KEY` | Yes | - | MinIO access key |
| `MINIO_SECRET_KEY` | Yes | - | MinIO secret key |
| `BUCKET_RAW_IMAGES` | Yes | - | Raw images bucket name |
| `BUCKET_THUMBNAILS` | Yes | - | Thumbnails bucket name |
| `SEED_USER_COUNT` | No | 5 | Number of users to create |
| `SEED_ALBUM_COUNT` | No | 10 | Number of albums to create |
| `SEED_IMAGE_COUNT` | No | 50 | Number of images to create |

### 4.2 Example .env file

```bash
# configs/seed.env.local
DATABASE_URL=postgresql://sise:sise_password@localhost:5432/sise
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
BUCKET_RAW_IMAGES=raw-images
BUCKET_THUMBNAILS=thumbnails
SEED_USER_COUNT=5
SEED_ALBUM_COUNT=10
SEED_IMAGE_COUNT=50
```

---

## 5. Data Validation

### 5.1 Verify data created

```bash
# Check users created
psql -h localhost -U sise -d sise -c "SELECT COUNT(*) FROM users;"
# Expected: 5

# Check albums created
psql -h localhost -U sise -d sise -c "SELECT COUNT(*) FROM albums;"
# Expected: 10

# Check images created
psql -h localhost -U sise -d sise -c "SELECT COUNT(*) FROM images;"
# Expected: 50

# Check objects in MinIO
mc ls minio/raw-images
# Expected: 50 objects with names like "user_id/album_id/image_id.jpg"
```

### 5.2 Query sample data

```sql
-- List all seed users
SELECT id, username, email FROM users WHERE username LIKE 'seed_%';

-- List albums with their users
SELECT a.id, a.title, a.user_id, u.username 
FROM albums a 
JOIN users u ON a.user_id = u.id 
WHERE a.title LIKE 'Seed Album%';

-- List image metadata
SELECT id, user_id, album_id, minio_object_name, privacy_level, index_status
FROM images
WHERE tags @> ARRAY['seed']
LIMIT 10;
```

---

## 6. Idempotency & Re-running

### 6.1 Is Seed Workflow idempotent?

**Yes**, with caveats:

```python
# First run
seed_test_data.py  # Creates 5 users, 10 albums, 50 images

# Second run
seed_test_data.py  # Detects existing data via ON CONFLICT DO NOTHING
				   # Does NOT create duplicates
				   # But may fail on MinIO if objects already exist
```

### 6.2 How to safely re-run

```bash
# Option 1: Delete seed data manually (recommended for testing)
psql -h localhost -U sise -d sise << EOF
DELETE FROM images WHERE tags @> ARRAY['seed'];
DELETE FROM albums WHERE title LIKE 'Seed Album%';
DELETE FROM users WHERE username LIKE 'seed_%';
EOF

# Delete from MinIO
mc rm --recursive --force minio/raw-images/

# Then run again
python scripts/seed/seed_test_data.py
```

```bash
# Option 2: Clean entire databases (careful!)
docker compose -f infra_compose_storage.yml down -v  # Remove volumes
docker compose -f infra_compose_storage.yml up -d    # Recreate

# Then run schema + bucket + seed workflows again
```

---

## 7. Testing with Seed Data

### 7.1 Test Upload Workflow

```bash
# Query a seed image
psql -h localhost -U sise -d sise -c \
  "SELECT minio_object_name FROM images LIMIT 1;"
# Returns: e.g., "1/1/image-uuid.jpg"

# Verify object in MinIO
mc cat minio/raw-images/1/1/image-uuid.jpg
# Should return dummy image data "seed-image"
```

### 7.2 Test Search Workflow

```bash
# With seed data in PostgreSQL + MinIO, test search API
curl -X POST http://localhost:8000/search/image \
  -H "Authorization: Bearer <token>" \
  -F "image=@test_image.jpg"

# Should return results with privacy_level=2 (public)
```

### 7.3 Benchmark with Seed Data

```bash
# Use seed dataset as ground truth for evaluation
python scripts/bench/mrr_benchmark.py \
  --dataset seed \
  --queries 100 \
  --output benchmark_results.json
```

---

## 8. Troubleshooting

### 8.1 "Cannot INSERT data: users table does not exist"

**Problem**: Schema Workflow didn't run

**Solution**:
```bash
# Run Schema Workflow first
python scripts/schema/run_schema_migrations.py

# Verify tables exist
psql -h localhost -U sise -d sise -c "\dt"
```

### 8.2 "MinIO bucket does not exist"

**Problem**: Bucket Workflow didn't run

**Solution**:
```bash
# Run Bucket Workflow first
python -c "
from app.routers.bucket_routers import BucketWorkflowRouter
router = BucketWorkflowRouter(...)
router.setup_buckets()
"

# Verify buckets exist
mc ls minio/
```

### 8.3 "Cannot connect to PostgreSQL"

**Problem**: PostgreSQL not running or wrong credentials

**Solution**:
```bash
# Start PostgreSQL
docker compose -f infra_compose_storage.yml up -d postgres

# Test connection
psql -h localhost -U sise -d sise -c "SELECT 1"

# Check credentials in env vars
echo $DATABASE_URL
```

### 8.4 "Constraint violation: duplicate key"

**Problem**: Running seed multiple times and ON CONFLICT isn't working

**Solution**:
```bash
# Clean seed data
psql -h localhost -U sise -d sise << EOF
DELETE FROM images WHERE tags @> ARRAY['seed'];
DELETE FROM albums WHERE title LIKE 'Seed Album%';
DELETE FROM users WHERE username LIKE 'seed_%';
EOF

# Then re-run
python scripts/seed/seed_test_data.py
```

---

## 9. Advanced Usage

### 9.1 Generate larger dataset

```bash
# Create 100 users, 200 albums, 1000 images
SEED_USER_COUNT=100 \
SEED_ALBUM_COUNT=200 \
SEED_IMAGE_COUNT=1000 \
python scripts/seed/seed_test_data.py

# Warning: May take 1-5 minutes depending on hardware
```

### 9.2 Custom seed data (not just dummy)

```python
# Extend seed_services.py to generate realistic data
# Example: Use Faker library for names
from faker import Faker

fake = Faker()

for i in range(user_count):
	username = fake.user_name()
	email = fake.email()
	# ... insert to PostgreSQL
```

### 9.3 Generate images with real PIL/numpy data (not just placeholders)

```python
# Extend seed_services.py to create real dummy images
from PIL import Image
import numpy as np

# Create 224x224 RGB image (CLIP format)
img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
img = Image.fromarray(img_array, 'RGB')

# Convert to bytes
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Upload to MinIO
client.put_object(bucket, object_name, img_bytes, len(img_bytes.getvalue()))
```

---

## 10. Related Resources

- **Seed Workflow Code**: `modules/StorageModule/app/services/seed_services.py`
- **Seed CLI**: `modules/StorageModule/scripts/seed/seed_test_data.py`
- **Schema Workflow Docs**: `modules/StorageModule/documents/schema_workflow/`
- **Bucket Workflow Docs**: `modules/StorageModule/documents/bucket_workflow/`
- **Database Schema**: `data_schema.yaml` → `database_spec.postgresql`

---

## 11. Integration with other workflows

### 11.1 Dependency Chain

```
Infra Workflow (start containers)
	↓
Schema Workflow (create tables)
	↓
Bucket Workflow (create buckets)
	↓
Seed Workflow (populate test data)
	↓
Backend API / AI Inference (test with real data)
```

### 11.2 When to use Seed Workflow

| Scenario | Use Seed? |
|----------|-----------|
| Local development | ✓ Yes |
| Integration testing | ✓ Yes (with seed dataset) |
| Performance benchmarking | ✓ Yes |
| Production deployment | ✗ No (use production data) |
| New feature testing | ✓ Yes (quick feedback loop) |

---

## 12. Version & Maintenance

| Field | Value |
|-------|-------|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-05-12 |
| **Owner** | AG-02 (StorageModuleAgent) |
| **Maintenance Frequency** | As needed (when schema changes) |

---
