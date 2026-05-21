# Image Embedding Workflow - Deep Guide

**Mục đích**: Tài liệu này cung cấp chi tiết toàn diện về image embedding workflow cho các developer chuyên sâu, các nhà kiến trúc hệ thống, và những người cần hiểu sâu sắc từng khía cạnh của workflow.

**Mức độ**: Advanced / Specialist-level
**Thời gian đọc**: 45-60 phút

---

## 1. Chi tiết: Workflow này là gì? Nó được thiết kế như thế nào?

### 1.1 Định nghĩa đầy đủ

**Image Embedding Workflow** (T002-02: preprocessing, T002-03: endpoint) là:
- **Mục tiêu chính**: Convert image bytes to 512-dim CLIP embeddings, support multipart form upload, return JSON vectors
- **Phạm vi**: HTTP POST /inference/embed/image endpoint, real-time request processing
- **Vai trò trong hệ thống**: Core inference capability, feeds vectors into Milvus (AG-03), supports batch processing
- **Lịch sử thiết kế**: T002-02 (preprocessing pipeline) and T002-03 (endpoint wiring) separated to allow independent testing of preprocessing logic vs HTTP integration

### 1.2 Kiến trúc chi tiết (Detailed Architecture)

#### 1.2.1 Tầng lớp kiến trúc (Layered Architecture)

1. **Config Layer** (Configuration & Contracts)
   - **Chức năng**: Define CLIP preprocessing params (target size 224x224, mean/std values)
   - **Trách nhiệm**: Validate config, ensure alignment with CLIP paper
   - **Ví dụ**: IMAGE_SIZE=224, NORMALIZE_MEAN=[0.48145466, 0.4578275, 0.40821073]

2. **Entity Layer** (Data Models & Config Objects)
   - **Chức năng**: ImagePreprocessConfig, ImageEmbeddingRequest, ImageEmbeddingResult
   - **Trách nhiệm**: Type-safe representation, immutable result
   - **Ví dụ**: ImageEmbeddingRequest(file_bytes, content_type, filename)

3. **Adapter Layer** (External Integration)
   - **Chức năng**: ImageValidator, ImagePreprocessor, VectorNormalizer
   - **Trách nhiệm**: PIL image ops, torch tensor ops, numpy operations
   - **Ví dụ**: ImagePreprocessor.preprocess(pil_image) -> torch.Tensor

4. **Service Layer** (Business Logic & Orchestration)
   - **Chức năng**: ImageEmbeddingService orchestrates entire flow
   - **Trách nhiệm**: Coordinate validators, preprocessors, encoders, normalizers
   - **Ví dụ**: ImageEmbeddingService.extract_embedding(request) -> result

5. **Router Layer** (Public API Interface)
   - **Chức năng**: ImageEmbeddingRouter exposes FastAPI endpoint
   - **Trách nhiệm**: Multipart form handling, error marshalling
   - **Ví dụ**: POST /inference/embed/image with file and content_type

#### 1.2.2 Flow chi tiết (Detailed Process Flow)

```
Client: POST /inference/embed/image
	|
	v
ImageEmbeddingRouter (HTTP request handler)
	|
	+-- Parse multipart/form-data
	+-- Extract file bytes, filename, content_type
	+-- Create ImageEmbeddingRequest
	|
	v
ImageEmbeddingService.extract_embedding()
	|
	+-- Step 1: Validate input
	|       v
	|   ImageValidator.validate_file()
	|   Check: content_type in [image/jpeg, image/png]
	|   Check: file_size <= 20MB
	|   Check: file bytes not corrupted (PIL.Image.open)
	|
	+-- Step 2: Preprocess image
	|       v
	|   ImagePreprocessor.preprocess()
	|   Load PIL.Image from bytes
	|   Handle grayscale (L) -> RGB
	|   Handle RGBA -> RGB
	|   Resize to 224x224 (preserve aspect, pad if needed)
	|   Normalize: (pixel - mean) / std
	|   Return torch.Tensor (1, 3, 224, 224)
	|
	+-- Step 3: Get warmup model
	|       v
	|   WarmupService.get_model()
	|   Return loaded CLIP model or fail if not ready
	|
	+-- Step 4: Encode image
	|       v
	|   model.encode_image(image_tensor)
	|   Forward pass through CLIP image encoder
	|   Output: (1, 512) tensor
	|
	+-- Step 5: Normalize vector
	|       v
	|   VectorNormalizer.normalize_vector(embedding)
	|   L2-norm: vector / ||vector||_2
	|   Check result magnitude ~= 1.0
	|
	+-- Step 6: Package result
	|       v
	|   ImageEmbeddingResult(
	|       vector=[512 float32 values],
	|       metadata={size, latency_ms}
	|   )
	|
	v
ImageEmbeddingRouter (format response)
	|
	v
HTTP 200 OK: JSON {"vector": [...], "metadata": {...}}
```

#### 1.2.3 Quy trình chi tiết từng bước (Step-by-Step Process)

**Bước 1: Validate Input**
- **Input**: file_bytes, content_type, filename
- **Xử lý**: 
  - Check content_type in ["image/jpeg", "image/png"]
  - Check len(file_bytes) <= 20MB (20 * 1024 * 1024 bytes)
  - Try PIL.Image.open(io.BytesIO(file_bytes)) to verify not corrupted
- **Validation**: File must be valid JPEG/PNG, not corrupted
- **Output**: Validated file_bytes
- **Error Handling**: 
  - Invalid content_type: raise ValidationError ERR_INVALID_CONTENT_TYPE
  - File too large: raise ValidationError ERR_FILE_TOO_LARGE
  - Corrupted file: raise ValidationError ERR_INVALID_IMAGE
- **Idempotency**: Yes - same file bytes always validate same way

**Bước 2: Preprocess Image**
- **Input**: file_bytes (validated)
- **Xử lý**:
  - Load: img = PIL.Image.open(io.BytesIO(file_bytes))
  - Handle modes:
	- If mode == 'L' (grayscale): convert to 'RGB' (duplicate channels)
	- If mode == 'RGBA': convert to 'RGB' (drop alpha channel)
	- If mode == 'RGB': keep as-is
  - Resize: target 224x224
	- Compute aspect ratio
	- Resize to fit 224x224 (preserve ratio)
	- Pad with black if needed to reach exactly 224x224
  - Normalize: Convert to numpy, then torch tensor
	- pixels = numpy array (3, 224, 224) with values [0, 255]
	- normalized = (pixels / 255.0 - mean) / std
	- CLIP mean = [0.48145466, 0.4578275, 0.40821073]
	- CLIP std = [0.26862954, 0.26130258, 0.27577711]
  - Convert to torch tensor: shape (1, 3, 224, 224), dtype float32
- **Validation**: Output tensor shape must be exactly (1, 3, 224, 224)
- **Output**: torch.Tensor (1, 3, 224, 224)
- **Error Handling**: If any step fails, raise PreprocessingError
- **Idempotency**: Yes - repeated preprocessing of same file produces identical tensor

**Bước 3: Get Warmup Model**
- **Input**: None
- **Xử lý**: Call WarmupService.get_model()
- **Validation**: Model must be loaded (not None)
- **Output**: Model instance
- **Error Handling**: If model not ready, raise ModelNotReadyError
- **Idempotency**: Yes - get_model returns same instance

**Bước 4: Encode Image**
- **Input**: image_tensor (1, 3, 224, 224), model
- **Xử lý**:
  - Call model.encode_image(image_tensor)
  - Forward pass with torch.no_grad() context (no gradient computation)
  - Output embeddings before normalization
- **Validation**: Output shape must be (1, 512)
- **Output**: Embedding tensor (1, 512)
- **Error Handling**: If encoding fails, raise EncodingError
- **Idempotency**: No - repeated encoding may produce slightly different values due to model stochasticity or precision rounding

**Bước 5: Normalize Vector**
- **Input**: embedding tensor (1, 512)
- **Xử lý**:
  - Flatten to (512,) or keep as is
  - Compute L2 norm: ||v||_2 = sqrt(sum(v^2))
  - Normalize: v_norm = v / ||v||_2
  - Verify result magnitude is approximately 1.0 (tolerance +/- 0.01)
- **Validation**: 
  - Output shape = (512,) or equivalent
  - Output dtype = float32
  - Magnitude approximately 1.0
  - No NaN/Inf values
- **Output**: Normalized vector (512,) float32
- **Error Handling**: If normalization fails or result invalid, raise NormalizationError
- **Idempotency**: Yes - normalized result deterministic

**Bước 6: Package Result**
- **Input**: normalized_vector, metadata (latency_ms)
- **Xử lý**: Create ImageEmbeddingResult object
- **Output**: ImageEmbeddingResult with vector array and metadata
- **Error Handling**: None (all data already validated)
- **Idempotency**: Yes

---

## 2. Chi tiết: Workflow này xử lý dữ liệu gì? Input, Output là gì?

### 2.1 Input Specification (Chi tiết Input)

#### 2.1.1 Configuration & Parameters

| Tên | Loại | Required | Default | Mô tả | Ví dụ |
|-----|------|----------|---------|-------|-------|
| IMAGE_SIZE | Integer | No | 224 | Target image size for resize | 224 |
| IMAGE_NORMALIZE_MEAN | List[float] | No | [0.481, 0.457, 0.408] | CLIP normalization mean | [0.48145466, 0.4578275, 0.40821073] |
| IMAGE_NORMALIZE_STD | List[float] | No | [0.268, 0.261, 0.275] | CLIP normalization std | [0.26862954, 0.26130258, 0.27577711] |
| MAX_IMAGE_SIZE_MB | Integer | No | 20 | Max image file size in MB | 20 |

#### 2.1.2 External Dependencies

| Tên | Loại | SLA | Health Check | Notes |
|-----|------|-----|--------------|-------|
| CLIP Model (Warmup) | Service | 99.9% | WarmupService.is_ready() | Must be loaded before requests |
| PIL (Pillow) | Library | 99% | import PIL | Image I/O |
| PyTorch | Library | 99% | import torch | Tensor ops |

#### 2.1.3 Prerequisites

- Warmup workflow completed successfully
- PyTorch >= 2.1.0
- Pillow >= 10.0.0
- numpy >= 1.20.0

### 2.2 Output Specification (Chi tiết Output)

#### 2.2.1 Primary Output

| Tên | Loại | Định dạng | Mô tả | Life cycle |
|-----|------|-----------|-------|-----------|
| Embedding Vector | Array | 512-dim float32 | L2-normalized CLIP embedding | Returned to client, not persisted |
| ImageEmbeddingResult | Object | JSON | Result object with vector + metadata | Until response sent |

#### 2.2.2 Side Effects & Logs

| Tên | Loại | Nơi | Mô tả | Retention |
|-----|------|-----|-------|-----------|
| Processing log | Log | Stdout/Logs | Request timestamp, file size, latency | Until log rotation |
| Embedding latency metric | Metric | Prometheus | embedding_latency_ms gauge | App lifetime |

#### 2.2.3 State Changes

- **Before**: Request received, model ready
- **After**: Vector computed, returned to client

### 2.3 Data Processing Characteristics

#### 2.3.1 Data Types

| Loại dữ liệu | Định dạng | Kích thước | Chi tiết |
|-------------|-----------|-----------|---------|
| Input image | JPEG/PNG bytes | 1KB - 20MB | Variable resolution |
| Preprocessed tensor | float32 array | ~300KB | (1, 3, 224, 224) shape |
| Output vector | float32 array | ~2KB | (512,) shape |

#### 2.3.2 Data Volume & Throughput

- **Expected volume**: Per-request, highly variable (depends on image size)
- **Throughput**: ~10-50 images/second (depends on hardware)
- **Peak load**: Batch requests from frontend

#### 2.3.3 Data Lifecycle

```
Image bytes (from client)
	|
	v
Validation (1ms)
	|
	v
Preprocessing (50-100ms on CPU)
	|
	v
Encoding (100-300ms on CPU)
	|
	v
Normalization (1ms)
	|
	v
Response (returned to client)
	|
	v
Discarded (not persisted)
```

---

## 3. Chi tiết: Các thành phần trọng tâm của Workflow?

### 3.1 Component Inventory (Danh sách chi tiết)

| Component | Category | Chức năng | Trách nhiệm | Dependencies | Owner |
|-----------|----------|----------|-----------|--------------|-------|
| ImagePreprocessConfig | Entity | Hold preprocessing config (size, mean, std) | Type-safe config | Pydantic | app/entities/image_embedding_entities.py |
| ImageEmbeddingRequest | Entity | HTTP request object (file_bytes, content_type) | Request validation | Pydantic | app/entities/image_embedding_entities.py |
| ImageEmbeddingResult | Entity | Result object (vector, metadata) | Immutable result | dataclasses | app/entities/image_embedding_entities.py |
| ImageValidator | Adapter | Validate image file type, size, integrity | Input validation | PIL | app/adapters/image_embedding_adapters.py |
| ImagePreprocessor | Adapter | Load, resize, normalize image | Image processing | PIL, numpy, torch | app/adapters/image_embedding_adapters.py |
| VectorNormalizer | Adapter | L2-normalize embedding vector | Shared normalization | numpy | app/adapters/image_embedding_adapters.py (shared) |
| ImageEmbeddingService | Service | Orchestrate entire workflow | Coordination | All adapters | app/services/image_embedding_services.py |
| ImageEmbeddingRouter | Router | FastAPI endpoint | HTTP handling | FastAPI | app/routers/image_embedding_routers.py |

### 3.2 Component Interaction

#### 3.2.1 Dependency Graph

```
HTTP Request: multipart/form-data
	|
	v
ImageEmbeddingRouter
	|
	+-- Parse multipart form
	+-- Create ImageEmbeddingRequest
	|
	v
ImageEmbeddingService.extract_embedding()
	|
	+-- ImageValidator.validate_file(file_bytes, content_type)
	|
	+-- ImagePreprocessor.preprocess(file_bytes)
	|       |
	|       v
	|   PIL.Image operations
	|
	+-- WarmupService.get_model()
	|
	+-- model.encode_image(tensor)
	|
	+-- VectorNormalizer.normalize_vector(embedding)
	|
	v
ImageEmbeddingResult (vector + metadata)
	|
	v
HTTP Response: JSON
```

### 3.3 Component Responsibilities Detail

#### Component: ImageValidator (Adapter)

- **Định nghĩa**: Validate image file input
- **Loại**: Adapter
- **Trách nhiệp chính**: 
  - Check content_type in ["image/jpeg", "image/png"]
  - Check file_size <= 20MB
  - Verify file is valid image (PIL.Image.open)
- **Không nên làm gì**: 
  - Không modify file bytes
  - Không perform preprocessing
  - Không load entire file to memory twice
- **Phụ thuộc**: PIL, io
- **Người phụ thuộc**: ImageEmbeddingService
- **Test coverage**: tests/adapters/test_image_embedding_adapters.py

#### Component: ImagePreprocessor (Adapter)

- **Định nghĩa**: Preprocess image to CLIP-ready tensor
- **Loại**: Adapter
- **Trách nhiệp chính**: 
  - Load PIL.Image from bytes
  - Convert to RGB (handle grayscale, RGBA)
  - Resize to 224x224
  - Normalize using CLIP mean/std
  - Return torch.Tensor (1, 3, 224, 224)
- **Không nên làm gì**: 
  - Không validate (ImageValidator's job)
  - Không encode (Service or Model's job)
  - Không normalize output (VectorNormalizer's job)
- **Phụ thuộc**: PIL, numpy, torch
- **Người phụ thuộc**: ImageEmbeddingService
- **Test coverage**: tests/adapters/test_image_embedding_adapters.py

#### Component: ImageEmbeddingService (Service)

- **Định nghĩa**: Orchestrate entire image embedding workflow
- **Loại**: Service
- **Trách nhiệp chính**: 
  - Call validators in sequence
  - Call preprocessor
  - Get model from WarmupService
  - Encode image via model
  - Normalize result
  - Return ImageEmbeddingResult
  - Handle errors and logging
- **Không nên làm gì**: 
  - Không expose internal state
  - Không skip validation steps
  - Không modify request data
- **Phụ thuộc**: All adapters above, WarmupService
- **Người phụ thuộc**: ImageEmbeddingRouter
- **Test coverage**: tests/services/test_image_embedding_services.py

---

## 4. Design Decisions & Rationale

### 4.1 Architectural Choices

- **Separate T002-02 (preprocessing) and T002-03 (endpoint)**: Why?
  - Pro: Can test preprocessing independently of HTTP layer
  - Pro: Reuse preprocessing in batch workflow
  - Con: Extra documentation/code
  - Decision: Accept con for testability

- **Shared VectorNormalizer**: Why not normalize in each service?
  - Pro: Consistent normalization across image/text/batch
  - Pro: Easy to tune normalization in one place
  - Con: Extra adapter layer
  - Decision: Accept con for consistency

- **L2-normalization required**: Why not cosine similarity without norm?
  - Pro: CLIP paper uses L2-normalized vectors
  - Pro: Milvus COSINE metric expects normalized vectors
  - Con: Extra computation
  - Decision: Required by contract

---

## 5. Error Handling & Failure Modes

### 5.1 Expected Failures & Recovery

| Failure Scenario | Root Cause | Detection | Recovery | SLA Impact |
|-----------------|-----------|-----------|----------|-----------|
| Invalid image format | Client sends non-JPEG/PNG | Content-type check | Return HTTP 400 ERR_INVALID_CONTENT_TYPE | None (client error) |
| File too large | Client uploads >20MB image | Size check | Return HTTP 400 ERR_FILE_TOO_LARGE | None (client error) |
| Grayscale image | Input has mode 'L' | PIL mode check | Convert to RGB (2 lines code) | None (transparent handling) |
| RGBA image | PNG with alpha channel | PIL mode check | Drop alpha, convert to RGB | None (transparent handling) |
| Model not ready | Warmup still running or failed | WarmupService.is_ready() | Return HTTP 503 SERVICE_UNAVAILABLE | Retry after warmup |

### 5.2 Unexpected Failures

- **What to do**: Check logs for stack trace, verify file integrity, verify model loaded
- **Who to contact**: AG-00 or project owner
- **Where to log**: .knowledge/agent01/Skill_01.md if novel

---

## 6. Performance & Monitoring

### 6.1 Key Metrics

| Metric Name | Type | Unit | Target | Alert Threshold |
|------------|------|------|--------|-----------------|
| embedding_latency_ms | Histogram | ms | p95 < 500 (CPU) | p95 > 600 for 3 windows |
| embedding_requests_total | Counter | count | N/A | N/A |
| embedding_errors_total | Counter | count | error_rate < 1% | error_rate > 5% |
| preprocessing_time_ms | Gauge | ms | < 100 | > 200 |

### 6.2 Observability

- **Logging**: Log latency, image size, errors
- **Metrics**: Prometheus histograms for latency
- **Tracing**: Correlation ID from HTTP request

---

## 7. Related Workflows & Integration Points

- **Warmup Workflow**: Image embedding depends on loaded CLIP model
- **Text Embedding Workflow**: Uses same VectorNormalizer contract
- **Batch Embedding Workflow**: Reuses ImagePreprocessor from image workflow
- **Backend (AG-03)**: Consumes image embeddings, feeds to Milvus

---

## 8. References & Further Reading

- CLIP Paper: https://arxiv.org/abs/2103.14030
- Pillow Documentation: https://pillow.readthedocs.io/
- PyTorch Tensor Operations: https://pytorch.org/docs/stable/tensors.html
- Tasks.yaml - T002-02, T002-03: .context/Tasks.yaml
