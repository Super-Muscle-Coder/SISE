# Text Embedding Workflow - Quick Guide

**Mục đích**: Tài liệu này cung cấp cái nhìn tổng thể nhanh về text embedding workflow cho các developer mới tham gia dự án hoặc cần nắm bắt nhanh cốt lõi của hệ thống.

**Thời gian đọc**: 10-15 phút

---

## 1. Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa

Text embedding workflow (T002-04) là quá trình nhận chuỗi văn bản UTF-8, kiểm tra độ dài token, mã hóa bằng CLIP text encoder, và trả về vector embedding 512 chiều. Workflow này cung cấp khả năng chuyển đổi truy vấn text thành vector trong cùng không gian với image embeddings.

**Vai trò trong hệ thống**:
- Chuyển đổi text query thành vector search input
- Dùng cùng CLIP latent space với image embedding
- Là thành phần cần thiết cho search by text
- Hỗ trợ endpoint POST /inference/embed/text

### Quy trình cơ bản (High-level Steps)

Text embedding workflow gồm các bước:

1. **Text Validation**: Kiểm tra chuỗi không rỗng, hợp lệ UTF-8, tối đa 77 token
2. **Text Tokenization**: Tokenize và pad/truncate theo CLIP tokenizer
3. **Model Encoding**: Đưa token vào CLIP text encoder từ warmup
4. **Vector Normalization**: L2-normalize output vector
5. **Response Formatting**: Return 512-dim float32 vector

### Kiến trúc đơn giản (Simple Architecture)

```
Client Request (JSON text payload)
	|
	v
Text Validation (non-empty, UTF-8, token limit)
	|
	v
Text Tokenization (CLIP tokenizer)
	|
	v
Model Encoding (CLIP text encoder)
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
| **Text Query** | Chuỗi UTF-8 do client gửi | "a cat on the table" |
| **Content Constraints** | Không rỗng, tối đa 77 tokens | 1-77 tokens |
| **Encoding Context** | Chuỗi dùng chung vector space với image embeddings | search query |

### Output

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Embedding Vector** | 512-dim float32 array, L2-normalized | [0.123, -0.456, ..., 0.789] |
| **Metadata** | token count, processing time | token_count, latency_ms |
| **HTTP Response** | JSON object với vector | {"vector": [...], "metadata": {...}} |

### Dữ liệu được xử lý

- **Loại**: Text UTF-8, natural language, short queries
- **Định dạng**: JSON string payload
- **Kích thước**: Tối đa 77 tokens (theo CLIP constraint)
- **Tần suất**: Per-request, real-time processing

---

## 3. Các thành phần trọng tâm của Workflow?

### Thành phần chính (Core Components)

| Thành phần | Chức năng | Loại |
|-----------|---------|------|
| **TextProcessConfig** | Lưu trữ cấu hình text processing (max tokens, truncation) | Config Entity |
| **TextValidator** | Kiểm tra text, UTF-8, token count | Adapter |
| **TextTokenizer** | Tokenize / pad / truncate theo CLIP tokenizer | Adapter |
| **VectorNormalizer** | L2-normalize embedding vector | Adapter (Shared) |
| **TextEmbeddingService** | Điều phối validation -> tokenization -> encoding -> normalization | Service |
| **TextEmbeddingRouter** | Expose /inference/embed/text endpoint | Router |

### Sơ đồ mối quan hệ (Component Relationships)

```
Client Request (text payload)
	|
	v
TextEmbeddingRouter (validation, marshalling)
	|
	v
TextEmbeddingService (orchestration)
	|
	+-- TextValidator (check text)
	|
	+-- TextTokenizer (tokenize, pad, truncate)
	|
	+-- WarmupService.get_model() (get CLIP model)
	|
	+-- Model.encode_text() (forward pass)
	|
	+-- VectorNormalizer (L2-norm)
	|
	v
TextEmbeddingResult (512-dim vector + metadata)
	|
	v
HTTP Response (JSON)
```

---

## Quick Checklist

Để sử dụng text embedding workflow:

- [ ] Warmup workflow đã hoàn thành (model loaded)
- [ ] TextValidator kiểm tra UTF-8, non-empty, token limit
- [ ] TextTokenizer dùng CLIP tokenizer chuẩn
- [ ] VectorNormalizer L2-norm vectors
- [ ] Output dimension = 512 (verify vs data_schema.yaml)
- [ ] Endpoint POST /inference/embed/text accessible
- [ ] Latency < 100ms target (CPU)

---

## Bước tiếp theo

- **Muốn hiểu chi tiết hơn?** -> Xem TEXT_EMBEDDING_DEEP_GUIDE.md
- **Cần tham khảo cấu trúc tệp/thư mục?** -> Xem TEXT_EMBEDDING_REFERENCES.md
- **Muốn xem code mẫu?** -> Xem source files trong modules/AIModule/app/

---

## Tài liệu liên quan
- [Tasks.yaml](.context/Tasks.yaml) - T002-04 task definition
- [DOS.md](.context/DOS.md) - System design
- [data_schema.yaml](.context/data_schema.yaml) - Data contracts (vector_dim=512)
- [Warmup Workflow](../warmup_workflow/QUICK_GUIDE.md) - Depends on warmup
- [Image Embedding Workflow](../image_embedding_workflow/QUICK_GUIDE.md) - Sibling workflow
- [Batch Embedding Workflow](../batch_embedding_workflow/QUICK_GUIDE.md) - Uses same vector space
