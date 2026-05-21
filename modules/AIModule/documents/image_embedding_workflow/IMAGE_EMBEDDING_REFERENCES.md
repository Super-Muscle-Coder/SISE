# Image Embedding Workflow - References

**Mục đích**: Tài liệu này cung cấp danh sách chi tiết các tệp, thư mục, cấu trúc dự án, và tài liệu tham khảo của image embedding workflow. Sử dụng tài liệu này để định vị nhanh các thành phần, hiểu cây thư mục, và tìm kiếm các file cụ thể cần thiết.

**Mục tiêu sử dụng**: Tra cứu cấu trúc, duyệt mã nguồn, tìm file cấu hình, tìm test files.

**Thời gian tra cứu**: 5-10 phút

---

## 1. Directory Structure (Cấu trúc thư mục)

### 1.1 Image Embedding Workflow Component Tree

```
modules/AIModule/
├── app/
│   ├── entities/
│   │   ├── image_embedding_entities.py    - ImagePreprocessConfig, ImageEmbeddingRequest, ImageEmbeddingResult
│   │   └── __init__.py                    - Exports image embedding entities
│   │
│   ├── adapters/
│   │   ├── image_embedding_adapters.py    - ImageValidator, ImagePreprocessor, VectorNormalizer (shared)
│   │   └── __init__.py                    - Exports image embedding adapters
│   │
│   ├── services/
│   │   ├── image_embedding_services.py    - ImageEmbeddingService orchestration
│   │   └── __init__.py                    - Exports image embedding service
│   │
│   ├── routers/
│   │   ├── image_embedding_routers.py     - ImageEmbeddingRouter, create_image_embedding_router
│   │   └── __init__.py                    - Exports image embedding router
│   │
│   └── __init__.py                        - App package exports (includes image embedding)
│
├── configs/
│   ├── ai.env.example                     - Template env vars (IMAGE_SIZE, NORMALIZE_MEAN/STD)
│   └── ai.env.local                       - Local env vars (not committed, has values)
│
├── tests/
│   ├── test_image_embedding_workflow.py   - Image embedding integration tests
│   ├── adapters/
│   │   └── test_image_embedding_adapters.py - Unit tests for adapters
│   ├── services/
│   │   └── test_image_embedding_services.py - Unit tests for service
│   └── fixtures/
│       └── image_embedding_fixtures.py    - Mock images, test data
│
├── documents/
│   └── image_embedding_workflow/
│       ├── IMAGE_EMBEDDING_QUICK_GUIDE.md    - Quick overview
│       ├── IMAGE_EMBEDDING_DEEP_GUIDE.md     - In-depth technical details
│       ├── IMAGE_EMBEDDING_REFERENCES.md     - File inventory & structure
│       └── INDEX.md                          - Learning path
│
├── ai_main.py                            - FastAPI app, registers image embedding router
├── ai_requirements.txt                   - Python dependencies
└── .dockerignore                         - Docker ignore rules
```

---

## 2. File Inventory (Danh sách chi tiết các tệp)

### 2.1 Configuration Files

| File Path | File Name | Type | Owner | Purpose | Version |
|-----------|-----------|------|-------|---------|---------|
| `configs/ai.env.example` | ai.env.example | Env Template | AIModule | Template for IMAGE_SIZE, NORMALIZE_MEAN/STD | 1.0.0 |
| `configs/ai.env.local` | ai.env.local | Env Vars | AIModule | Local values (not committed) | N/A |

### 2.2 Entity Layer Files

| File Path | Class/Function | Type | Purpose | Imports | Exports |
|-----------|----------------|------|---------|---------|---------|
| `app/entities/image_embedding_entities.py` | ImagePreprocessConfig, ImageEmbeddingRequest, ImageEmbeddingResult | Dataclass | Configuration and request/result objects | pydantic, dataclasses | ['ImagePreprocessConfig', 'ImageEmbeddingRequest', 'ImageEmbeddingResult'] |

**ImagePreprocessConfig Fields**:
- `target_size: int` - Target image size for resize (224)
- `normalize_mean: List[float]` - Normalization mean values (CLIP defaults)
- `normalize_std: List[float]` - Normalization std values (CLIP defaults)

**ImageEmbeddingRequest Fields**:
- `file_bytes: bytes` - Binary image data
- `content_type: str` - MIME type (image/jpeg or image/png)
- `filename: str` - Original filename (metadata)

**ImageEmbeddingResult Fields**:
- `vector: List[float]` - 512-dim embedding vector
- `metadata: Dict` - Processing metadata (size, latency_ms)

### 2.3 Adapter Layer Files

| File Path | Class/Function | Type | External System | Purpose | Key Methods |
|-----------|----------------|------|-----------------|---------|------------|
| `app/adapters/image_embedding_adapters.py` | ImageValidator, ImagePreprocessor, VectorNormalizer | External Integration | PIL, numpy, torch | Image processing and validation | validate_file(), preprocess(), normalize_vector() |

**ImageValidator Methods**:
- `validate_file(file_bytes, content_type) -> bool` - Check file validity

**ImagePreprocessor Methods**:
- `preprocess(file_bytes) -> torch.Tensor` - Process image to (1, 3, 224, 224)

**VectorNormalizer Methods** (shared utility):
- `normalize_vector(vector) -> Tuple[List[float], float]` - L2-normalize, return (normalized_vector, magnitude)

### 2.4 Service Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Key Methods |
|-----------|----------------|------|---------|-----------|------------|
| `app/services/image_embedding_services.py` | ImageEmbeddingService | Business Logic | Orchestrate entire workflow | All adapters, WarmupService | extract_embedding(request) -> result |

**ImageEmbeddingService Methods**:
- `extract_embedding(request: ImageEmbeddingRequest) -> ImageEmbeddingResult` - Main entry point
- `_validate_input(request) -> bool` - Input validation
- `_get_model() -> model_instance` - Get loaded CLIP model

### 2.5 Router Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Exposed APIs |
|-----------|----------------|------|---------|-----------|------------|
| `app/routers/image_embedding_routers.py` | create_image_embedding_router() | FastAPI Router | FastAPI endpoint registration | ImageEmbeddingService | POST /inference/embed/image |

**Exported Functions**:
- `create_image_embedding_router() -> APIRouter` - Create FastAPI router with image embedding endpoint

**Endpoint Signature**:
```python
@router.post("/inference/embed/image")
async def embed_image(file: UploadFile, content_type: str = None) -> ImageEmbeddingResult
```

**Parameters**:
- `file`: UploadFile from multipart/form-data
- `content_type`: Optional override (defaults to file.content_type)

**Returns**: ImageEmbeddingResult with vector and metadata

### 2.6 Test Files

| File Path | Test Class/Function | Scope | Tests What | Coverage Target |
|-----------|-------------------|-------|-----------|-----------------|
| `tests/test_image_embedding_workflow.py` | TestImageEmbeddingWorkflow | Integration | Entire workflow end-to-end | 85% |
| `tests/adapters/test_image_embedding_adapters.py` | TestImageValidator, TestImagePreprocessor | Unit | Individual adapters | 95% |
| `tests/services/test_image_embedding_services.py` | TestImageEmbeddingService | Unit | Service orchestration | 90% |
| `tests/fixtures/image_embedding_fixtures.py` | fixture_* | Shared | Mock images, configs | N/A |

---

## 3. Key Dependencies (Phụ thuộc chính)

### 3.1 External Package Dependencies

| Package | Version | Purpose | Used In | License |
|---------|---------|---------|---------|---------|
| Pillow (PIL) | >= 10.0.0 | Image I/O, preprocessing | adapters/image_embedding_adapters.py | HPND |
| numpy | >= 1.20.0 | Array operations, normalization | adapters/image_embedding_adapters.py | BSD |
| torch | >= 2.1.0 | Tensor operations | adapters/image_embedding_adapters.py | BSD |
| fastapi | >= 0.110.0 | HTTP routing | routers/image_embedding_routers.py | MIT |
| pydantic | >= 2.0.0 | Request/response validation | entities/image_embedding_entities.py | MIT |
| pytest | >= 7.4.0 | Testing | tests/ | MIT |

### 3.2 Internal Module Dependencies

```
Image bytes (client upload)
	|
	v
ImageEmbeddingRouter (HTTP handler)
	|
	v
ImageEmbeddingRequest (parse multipart)
	|
	v
ImageEmbeddingService.extract_embedding()
	|
	+-- ImageValidator.validate_file()
	+-- ImagePreprocessor.preprocess()
	+-- WarmupService.get_model()
	+-- model.encode_image()
	+-- VectorNormalizer.normalize_vector()
	|
	v
ImageEmbeddingResult
	|
	v
HTTP Response (JSON)
```

### 3.3 Inter-workflow Dependencies

| Workflow | Dependency Type | Status | Description |
|----------|-----------------|--------|-------------|
| Warmup Workflow (T002-01) | depends-on | active | Image embedding requires loaded CLIP model |
| Batch Embedding (T002-05) | used-by | active | Batch reuses ImagePreprocessor |
| Text Embedding (T002-04) | sibling | independent | Both use VectorNormalizer, same vector space |

---

## 4. Configuration Reference (Tham chiếu cấu hình)

### 4.1 Environment Variables

| Env Variable | Type | Required | Default | Purpose | Example |
|-------------|------|----------|---------|---------|---------|
| IMAGE_SIZE | integer | No | 224 | Target size for image resize | 224 |
| IMAGE_NORMALIZE_MEAN | string (JSON array) | No | [0.481, 0.457, 0.408] | CLIP mean values | "[0.48145466, 0.4578275, 0.40821073]" |
| IMAGE_NORMALIZE_STD | string (JSON array) | No | [0.268, 0.261, 0.275] | CLIP std values | "[0.26862954, 0.26130258, 0.27577711]" |
| MAX_IMAGE_SIZE_MB | integer | No | 20 | Max file size (MB) | 20 |

**Notes**:
- IMAGE_SIZE: CLIP standard is 224x224 (do not change)
- IMAGE_NORMALIZE_MEAN/STD: From CLIP paper, format as JSON array string
- MAX_IMAGE_SIZE_MB: Aligns with data_schema.yaml max_file_size_mb

---

## 5. API Reference (Tham chiếu API)

### 5.1 Service API

**Class**: `ImageEmbeddingService`

#### Method: `extract_embedding(request: ImageEmbeddingRequest) -> ImageEmbeddingResult`

```
Signature: @staticmethod
		   def extract_embedding(request: ImageEmbeddingRequest) -> ImageEmbeddingResult
```

**Description**: Extract 512-dim embedding from image

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| request | ImageEmbeddingRequest | Yes | Image bytes, content_type, filename |

**Returns**:
| Type | Description |
|------|-------------|
| ImageEmbeddingResult | vector (512-dim), metadata (size, latency_ms) |

**Raises**:
| Exception | When |
|-----------|------|
| ValidationError | Invalid file type, too large |
| PreprocessingError | Corrupted image, unsupported mode |
| ModelNotReadyError | CLIP model not loaded |
| EncodingError | Encoding failed |

**Example**:
```python
from app.services.image_embedding_services import ImageEmbeddingService
from app.entities.image_embedding_entities import ImageEmbeddingRequest

# Read image file
with open("image.jpg", "rb") as f:
	image_bytes = f.read()

# Create request
request = ImageEmbeddingRequest(
	file_bytes=image_bytes,
	content_type="image/jpeg",
	filename="image.jpg"
)

# Extract embedding
result = ImageEmbeddingService.extract_embedding(request)
print(f"Vector: {result.vector}")
print(f"Latency: {result.metadata['latency_ms']}ms")
```

### 5.2 Router API (HTTP)

**Endpoint**: `POST /inference/embed/image`

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): Image file (JPEG or PNG)
- `content_type` (optional): MIME type override

**Response** (HTTP 200):
```json
{
  "vector": [0.123, -0.456, ..., 0.789],
  "metadata": {
	"image_size": [1920, 1080],
	"latency_ms": 125
  }
}
```

**Error Responses**:
- HTTP 400: Invalid file (ERR_INVALID_CONTENT_TYPE, ERR_FILE_TOO_LARGE, ERR_INVALID_IMAGE)
- HTTP 503: Model not ready (ERR_MODEL_NOT_READY)
- HTTP 500: Internal error (ERR_INTERNAL)

---

## 6. Testing Reference

### 6.1 How to Run Tests

**Run all image embedding tests**:
```bash
pytest tests/test_image_embedding_workflow.py -v
```

**Run adapter tests**:
```bash
pytest tests/adapters/test_image_embedding_adapters.py -v
```

**Run service tests**:
```bash
pytest tests/services/test_image_embedding_services.py -v
```

**Run with coverage**:
```bash
pytest tests/ -k "image_embedding" --cov=app.services.image_embedding_services --cov-report=html
```

### 6.2 Test Fixtures

**Location**: `tests/fixtures/image_embedding_fixtures.py`

**Available Fixtures**:
| Fixture Name | Type | Purpose |
|-------------|------|---------|
| sample_rgb_image | bytes | Valid RGB JPEG image |
| sample_grayscale_image | bytes | Grayscale image (mode L) |
| sample_rgba_image | bytes | RGBA PNG image |
| oversized_image | bytes | Image > 20MB |
| corrupted_image | bytes | Invalid image file |
| mock_preprocessor | Mock | Mock ImagePreprocessor |

---

## 7. Quick Navigation

**Looking for...**

- **ImageValidator code?** -> app/adapters/image_embedding_adapters.py
- **ImagePreprocessor code?** -> app/adapters/image_embedding_adapters.py
- **Service orchestration?** -> app/services/image_embedding_services.py
- **HTTP endpoint?** -> app/routers/image_embedding_routers.py
- **Data models?** -> app/entities/image_embedding_entities.py
- **How to test validators?** -> tests/adapters/test_image_embedding_adapters.py
- **How to test service?** -> tests/services/test_image_embedding_services.py
- **What's the endpoint URL?** -> POST /inference/embed/image
- **What vector dimension?** -> 512 (see data_schema.yaml global_configs.vector_dim)

---

## 8. File Ownership & Contact

### 8.1 Component Owners

| Component | Owner | Team | Contact | Escalation |
|-----------|-------|------|---------|-----------|
| ImageValidator, ImagePreprocessor | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| ImageEmbeddingService | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| ImageEmbeddingRouter | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| Configuration (ai.env) | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |

---

## 9. Version History & Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-21 | Initial reference documentation for image embedding workflow | AG-01 |

---

## 10. Related Documentation & Links

### 10.1 Related Image Embedding Docs

- [IMAGE_EMBEDDING_QUICK_GUIDE.md](./IMAGE_EMBEDDING_QUICK_GUIDE.md) - Quick overview
- [IMAGE_EMBEDDING_DEEP_GUIDE.md](./IMAGE_EMBEDDING_DEEP_GUIDE.md) - In-depth details

### 10.2 Related Workflows

- [Warmup Workflow](../warmup_workflow/REFERENCES.md) - Dependency
- [Text Embedding Workflow](../text_embedding_workflow/REFERENCES.md) - Sibling
- [Batch Embedding Workflow](../batch_embedding_workflow/REFERENCES.md) - Uses preprocessing

### 10.3 External References

- [CLIP Paper](https://arxiv.org/abs/2103.14030)
- [Pillow Image Processing](https://pillow.readthedocs.io/)
- [PyTorch Tensor Operations](https://pytorch.org/docs/stable/tensors.html)

### 10.4 Project References

- [Tasks.yaml](.context/Tasks.yaml) - T002-02, T002-03 tasks
- [DOS.md](.context/DOS.md) - System design
- [data_schema.yaml](.context/data_schema.yaml) - Data contracts (vector_dim=512, max_file_size_mb=20)
- [ai_requirements.txt](../../ai_requirements.txt) - Dependencies
