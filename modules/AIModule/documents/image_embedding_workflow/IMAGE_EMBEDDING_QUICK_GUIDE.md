# Image Embedding Workflow - Quick Guide

**Mục đích**: Tài liệu này cung cấp cái nhìn tổng thể nhanh về image embedding workflow cho các developer mới tham gia dự án hoặc cần nắm bắt nhanh cốt lõi của hệ thống.

**Thời gian đọc**: 10-15 phút

---

## 1. Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa

Image embedding workflow (T002-02, T002-03) là quá trình nhận ảnh từ client, tiền xử lý (resize, normalize), mã hóa bằng CLIP image encoder, và trả về vector embedding 512 chiều. Workflow này là thành phần lõi của AI Service, cung cấp khả năng chuyển đổi ảnh thành vector để tìm kiếm.

**Vai trò trong hệ thống**:
- Chuỗi tiền xử lý (preprocessing) ảnh theo chuẩn CLIP
- Mã hóa ảnh qua CLIP image encoder
- Trả về vector embedding chuẩn hóa L2
- Tích hợp trực tiếp vào endpoint POST /inference/embed/image

### Quy trình cơ bản (High-level Steps)

Image embedding workflow gồm các bước:

1. **Image Validation**: Kiểm tra file type (JPEG/PNG), kích thước (max 20MB)
2. **Image Preprocessing**: Load ảnh, convert RGB, resize 224x224, normalize CLIP mean/std
3. **Model Encoding**: Đưa vào CLIP image encoder từ warmup
4. **Vector Normalization**: L2-normalize output vector
5. **Response Formatting**: Return 512-dim float32 vector

### Kiến trúc đơn giản (Simple Architecture)

```
Client Request (file bytes + content_type)
	|
	v
Image Validation (file type, size)
	|
	v
Image Preprocessing (load, convert RGB, resize, normalize)
	|
	v
Model Encoding (CLIP image encoder)
	|
	v
Vector Normalization (L2-norm)
	|
	v
Response (512-dim float32 array)
```

---

## 2. Workflow này làm việc với dữ liệu gì? Input, Output là gì?

### Input

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Image File** | Binary bytes của JPEG hoặc PNG | file bytes từ multipart/form-data |
| **Content Type** | MIME type của file | image/jpeg, image/png |
| **Constraints** | File size, format, resolution | Max 20MB, valid JPEG/PNG |

### Output

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Embedding Vector** | 512-dim float32 array, L2-normalized | [0.123, -0.456, ..., 0.789] |
| **Metadata** | Kích thước ảnh, processing time | width, height, latency_ms |
| **HTTP Response** | JSON object với vector | {"vector": [...], "metadata": {...}} |

### Dữ liệu được xử lý

- **Loại**: Ảnh JPEG/PNG, variable resolution
- **Định dạng**: Binary pixels (variable format)
- **Kích thước**: 1KB - 20MB per request
- **Tần suất**: Per-request, real-time processing

---

## 3. Các thành phần trọng tâm của Workflow?

### Thành phần chính (Core Components)

| Thành phần | Chức năng | Loại |
|-----------|---------|------|
| **ImagePreprocessConfig** | Lưu trữ cấu hình tiền xử lý (target size, normalize params) | Config Entity |
| **ImageValidator** | Kiểm tra file type, size, integrity | Adapter |
| **ImagePreprocessor** | Load ảnh, resize, normalize theo CLIP | Adapter |
| **VectorNormalizer** | L2-normalize embedding vector | Adapter (Shared) |
| **ImageEmbeddingService** | Điều phối validation -> preprocessing -> encoding -> normalization | Service |
| **ImageEmbeddingRouter** | Expose /inference/embed/image endpoint | Router |

### Sơ đồ mối quan hệ (Component Relationships)

```
Client Request (image bytes + content_type)
	|
	v
ImageEmbeddingRouter (validation, marshalling)
	|
	v
ImageEmbeddingService (orchestration)
	|
	+-- ImageValidator (check file)
	|
	+-- ImagePreprocessor (load, resize, normalize)
	|
	+-- WarmupService.get_model() (get CLIP model)
	|
	+-- Model.encode_image() (forward pass)
	|
	+-- VectorNormalizer (L2-norm)
	|
	v
ImageEmbeddingResult (512-dim vector + metadata)
	|
	v
HTTP Response (JSON)
```

---

## Quick Checklist

Để sử dụng image embedding workflow:

- [ ] Warmup workflow đã hoàn thành (model loaded)
- [ ] ImagePreprocessor điều chỉnh chuẩn CLIP (224x224, mean/std đúng)
- [ ] ImageValidator hỗ trợ JPEG, PNG (content_type aware)
- [ ] VectorNormalizer L2-norm vectors
- [ ] Output dimension = 512 (verify vs data_schema.yaml)
- [ ] Endpoint POST /inference/embed/image accessible
- [ ] Latency < 500ms target (CPU)

---

## Bước tiếp theo

- **Muốn hiểu chi tiết hơn?** -> Xem IMAGE_EMBEDDING_DEEP_GUIDE.md
- **Cần tham khảo cấu trúc tệp/thư mục?** -> Xem IMAGE_EMBEDDING_REFERENCES.md
- **Muốn xem code mẫu?** -> Xem source files trong modules/AIModule/app/

---

## Tài liệu liên quan
- [Tasks.yaml](.context/Tasks.yaml) - T002-02, T002-03 task definitions
- [DOS.md](.context/DOS.md) - System design
- [data_schema.yaml](.context/data_schema.yaml) - Data contracts (vector_dim=512)
- [Warmup Workflow](../warmup_workflow/QUICK_GUIDE.md) - Depends on warmup
- [Text Embedding Workflow](../text_embedding_workflow/QUICK_GUIDE.md) - Parallel workflow
- [Batch Embedding Workflow](../batch_embedding_workflow/QUICK_GUIDE.md) - Uses image preprocessing
