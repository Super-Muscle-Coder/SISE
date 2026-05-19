# Bucket Workflow - Quick Guide

**Mục đích**: Tài liệu này cung cấp cái nhìn tổng thể nhanh về Bucket Workflow cho các developer mới tham gia dự án hoặc cần nắm bắt nhanh cốt lõi của hệ thống.

**Thời gian đọc**: 10-15 phút

---

## 1. Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa
**Bucket Workflow** là quy trình khởi tạo và quản lý các bucket lưu trữ object trong MinIO. Workflow này đảm bảo tạo đúng số lượng bucket, cấu hình chính sách truy cập (private), và thiết lập các lifecycle rules (retention/archival) theo cấu hình từ `data_schema.yaml`.

**Vai trò trong hệ thống**: Cung cấp lớp lưu trữ object dạng S3-compatible để lưu ảnh gốc (`raw-images`) và hình thu nhỏ (`thumbnails`). Là tiền đề cho Upload Workflow và các thao tác object trên backend.

### Quy trình cơ bản (High-level Steps)

Bucket Workflow gồm các quy trình nhỏ bên trong:

1. **MinIO Client Setup**: Khởi tạo kết nối tới MinIO endpoint với credentials
2. **Bucket Existence Check**: Kiểm tra từng bucket trong config có tồn tại, nếu không thì tạo
3. **Private Policy Application**: Áp dụng chính sách truy cập private (không public read)
4. **Lifecycle Rule Configuration**: Áp dụng lifecycle rules (expiration hoặc archive) cho từng bucket

### Kiến trúc đơn giản (Simple Architecture)

```
MinioConfig (Entities)
	  |
	  v
bucket_adapters.create_minio_client()
	  |
	  v
bucket_services.ensure_buckets()
	  |
	  +-- Check bucket existence
	  |
	  +-- Create bucket (if not exists)
	  |
	  +-- Apply private policy
	  |
	  +-- Apply lifecycle rules
	  |
	  v
BucketWorkflowRouter.setup_buckets()
```

---

## 2. Workflow này làm việc với dữ liệu gì? Input, Output là gì?

### Input

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Config/Parameters** | MinIO endpoint, access key, secret key, bucket names, lifecycle rules | `MINIO_ENDPOINT=http://localhost:9000`, `BUCKET_RAW_IMAGES=raw-images` |
| **External Dependencies** | MinIO server sẵn sàng, endpoint có thể kết nối được | MinIO 2024.x running on `localhost:9000` |
| **Prerequisites** | Không có (Bucket Workflow độc lập, không phụ thuộc workflow khác) | N/A |

### Output

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Primary Output** | 2 buckets được tạo: `raw-images` và `thumbnails` | MinIO buckets ready, visible via CLI/web console |
| **Side Effects** | Lifecycle rules được ghi vào MinIO configuration | Thumbnails object tự động xóa sau N ngày |
| **State Changes** | MinIO từ "unconfigured" → "ready for object operations" | Object upload/download operations enabled |

### Dữ liệu được xử lý

- **Loại**: Bucket configuration (JSON-like structures), lifecycle rule specs
- **Định dạng**: MinIO S3 XML configuration format (automatically handled by `minio-py`)
- **Kích thước**: Nhỏ (kilobytes), chỉ là metadata cấu hình
- **Tần suất**: Một lần tại startup/initialization, có thể re-apply nếu cấu hình thay đổi

---

## 3. Các thành phần trọng tâm của Workflow?

### Thành phần chính (Core Components)

| Thành phần | Chức năng | Loại | File |
|-----------|---------|------|------|
| **MinioConfig** | Lưu trữ cấu hình MinIO endpoint, credentials, bucket names, lifecycle rules | Config Entity | `bucket_entities.py` |
| **LifecycleRuleConfig** | Định nghĩa cấu hình lifecycle rule (bucket, rule type, days) | Config Entity | `bucket_entities.py` |
| **bucket_adapters.create_minio_client()** | Đóng gói khởi tạo Minio client với endpoint và credentials | Adapter | `bucket_adapters.py` |
| **bucket_services.ensure_buckets()** | Điều phối toàn bộ quy trình: tạo bucket, áp dụng policy, lifecycle rules | Service | `bucket_services.py` |
| **BucketWorkflowRouter** | Cung cấp entry point duy nhất `setup_buckets()` cho caller bên ngoài | Router | `bucket_routers.py` |

### Sơ đồ mối quan hệ (Component Relationships)

```
bucket_entities.py (MinioConfig, LifecycleRuleConfig)
		 |
		 v
  bucket_adapters.py (create_minio_client)
		 |
		 v
  bucket_services.py (ensure_buckets)
		 |
		 +-- _apply_private_policy()
		 |
		 +-- _apply_lifecycle_rule() --> _build_lifecycle_config()
		 |
		 v
 bucket_routers.py (BucketWorkflowRouter)
		 |
		 v
  External Caller (e.g., main startup sequence)
```

---

## Quick Checklist

Để khởi động Bucket Workflow:

- [ ] MinIO server đang chạy trên endpoint đã cấu hình
- [ ] `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` được set trong env vars
- [ ] `BUCKET_RAW_IMAGES`, `BUCKET_THUMBNAILS` được cấu hình
- [ ] Lifecycle rules đã được định nghĩa trong env vars hoặc config file
- [ ] MinIO connection test thành công (health check passed)
- [ ] Kiểm tra 2 bucket tồn tại với policy là private
- [ ] Lifecycle rules được apply thành công (xác nhận qua MinIO console)

---

## Cách sử dụng cơ bản (Quick Start Code)

```python
from app.entities.bucket_entities import MinioConfig, LifecycleRuleConfig
from app.routers.bucket_routers import BucketWorkflowRouter

# 1. Chuẩn bị config
minio_config = MinioConfig(
	endpoint="localhost:9000",
	access_key="minioadmin",
	secret_key="minioadmin",
	secure=False,
	buckets=["raw-images", "thumbnails"],
	lifecycle_rules=[
		LifecycleRuleConfig(bucket="thumbnails", rule="expire", days=30),
		LifecycleRuleConfig(bucket="raw-images", rule="archive", days=365),
	]
)

# 2. Khởi tạo router và chạy
router = BucketWorkflowRouter(minio_config)
router.setup_buckets()

# Kết quả: 2 buckets được tạo, lifecycle rules được apply
```

---
