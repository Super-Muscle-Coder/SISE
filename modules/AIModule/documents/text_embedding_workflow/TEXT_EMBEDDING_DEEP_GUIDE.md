# Text Embedding Workflow - Deep Guide

**Mục đích**: Tài liệu này cung cấp chi tiết toàn diện về text embedding workflow cho các developer chuyên sâu, các nhà kiến trúc hệ thống, và những người cần hiểu sâu sắc từng khía cạnh của workflow.

**Mức độ**: Advanced / Specialist-level
**Thời gian đọc**: 45-60 phút

---

## 1. Chi tiết: Workflow này là gì? Nó được thiết kế như thế nào?

### 1.1 Định nghĩa đầy đủ

**Text Embedding Workflow** (T002-04) là:
- **Mục tiêu chính**: Convert text to 512-dim CLIP embeddings, support UTF-8 JSON input, return normalized vectors
- **Phạm vi**: HTTP POST /inference/embed/text endpoint, real-time request processing
- **Vai trò trong hệ thống**: Core inference capability for search-by-text, shares vector space with image embeddings
- **Lịch sử thiết kế**: Tách riêng khỏi image pipeline để tối ưu tokenization, validation, và simplify HTTP contract

### 1.2 Kiến trúc chi tiết (Detailed Architecture)

#### 1.2.1 Tầng lớp kiến trúc (Layered Architecture)

1. **Config Layer** (Configuration & Contracts)
   - **Chức năng**: Define text processing rules, tokenizer limits, model constraints
   - **Trách nhiệm**: Validate max tokens, enforce UTF-8 input
   - **Ví dụ**: MAX_TEXT_TOKENS=77, TRUNCATE_MODE=right

2. **Entity Layer** (Data Models & Config Objects)
   - **Chức năng**: TextProcessConfig, TextEmbeddingRequest, TextEmbeddingResult
   - **Trách nhiệm**: Type-safe request/response structures
   - **Ví dụ**: TextEmbeddingRequest(text="a cat on the table")

3. **Adapter Layer** (External Integration)
   - **Chức năng**: TextValidator, TextTokenizer, VectorNormalizer
   - **Trách nhiệm**: token counting, tokenizer integration, normalization
   - **Ví dụ**: TextTokenizer.tokenize(text) -> token tensor

4. **Service Layer** (Business Logic & Orchestration)
   - **Chức năng**: TextEmbeddingService orchestrates the full workflow
   - **Trách nhiệm**: coordinate validation, tokenization, encoding, normalization
   - **Ví dụ**: TextEmbeddingService.extract_embedding(request) -> result

5. **Router Layer** (Public API Interface)
   - **Chức năng**: TextEmbeddingRouter exposes FastAPI endpoint
   - **Trách nhiệm**: JSON parsing, response formatting, error marshalling
   - **Ví dụ**: POST /inference/embed/text with JSON body

#### 1.2.2 Flow chi tiết (Detailed Process Flow)

```
Client: POST /inference/embed/text
	|
	v
TextEmbeddingRouter (HTTP request handler)
	|
	+-- Parse JSON body {"text": "..."}
	+-- Create TextEmbeddingRequest
	|
	v
TextEmbeddingService.extract_embedding()
	|
	+-- Step 1: Validate input
	|       v
	|   TextValidator.validate_text()
	|   Check: non-empty
	|   Check: valid UTF-8
	|   Check: token count <= 77
	|
	+-- Step 2: Tokenize text
	|       v
	|   TextTokenizer.tokenize()
	|   CLIP tokenizer encode
	|   Pad/truncate to model context length
	|   Return token tensor
	|
	+-- Step 3: Get warmup model
	|       v
	|   WarmupService.get_model()
	|   Return loaded CLIP model or fail if not ready
	|
	+-- Step 4: Encode text
	|       v
	|   model.encode_text(token_tensor)
	|   Forward pass through CLIP text encoder
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
	|   TextEmbeddingResult(
	|       vector=[512 float32 values],
	|       metadata={token_count, latency_ms}
	|   )
	|
	v
TextEmbeddingRouter (format response)
	|
	v
HTTP 200 OK: JSON {"vector": [...], "metadata": {...}}
```

#### 1.2.3 Quy trình chi tiết từng bước (Step-by-Step Process)

**Bước 1: Validate Input**
- **Input**: text string
- **Xử lý**:
  - Ensure text is not empty or whitespace only
  - Ensure text is valid UTF-8 (FastAPI/Pydantic handles basic decoding)
  - Tokenize and count tokens using CLIP tokenizer
  - Verify token count <= 77
- **Validation**: Text must be non-empty and within token limit
- **Output**: Validated text string
- **Error Handling**:
  - Empty text: raise ValidationError ERR_EMPTY_TEXT
  - Too many tokens: raise ValidationError ERR_TEXT_TOO_LONG
  - Invalid UTF-8: raise ValidationError ERR_INVALID_UTF8
- **Idempotency**: Yes

**Bước 2: Tokenize Text**
- **Input**: validated text string
- **Xử lý**:
  - Use CLIP tokenizer to convert text to token ids
  - Pad to context length expected by model
  - Truncate if needed at token limit
  - Return torch tensor of token ids
- **Validation**: token tensor shape matches model expectation
- **Output**: token tensor
- **Error Handling**: tokenizer errors -> TokenizationError
- **Idempotency**: Yes

**Bước 3: Get Warmup Model**
- **Input**: None
- **Xử lý**: Call WarmupService.get_model()
- **Validation**: Model must be loaded and ready
- **Output**: model instance
- **Error Handling**: if model missing, raise ModelNotReadyError
- **Idempotency**: Yes

**Bước 4: Encode Text**
- **Input**: token tensor, model
- **Xử lý**:
  - Call model.encode_text(token_tensor)
  - Use torch.no_grad() context
  - Output embeddings before normalization
- **Validation**: Output shape must be (1, 512)
- **Output**: embedding tensor
- **Error Handling**: EncodingError if forward pass fails
- **Idempotency**: No strict bitwise guarantee, but output stable enough for cosine search

**Bước 5: Normalize Vector**
- **Input**: embedding tensor (1, 512)
- **Xử lý**:
  - Compute L2 norm and divide vector by norm
  - Ensure finite values and magnitude close to 1.0
- **Validation**: shape and magnitude checks
- **Output**: float32 normalized vector
- **Error Handling**: NormalizationError on invalid output
- **Idempotency**: Yes

**Bước 6: Package Result**
- **Input**: normalized vector, metadata
- **Xử lý**: Create TextEmbeddingResult
- **Output**: response object
- **Error Handling**: None expected after successful normalization

---

## 2. Chi tiết: Workflow này xử lý dữ liệu gì? Input, Output là gì?

### 2.1 Input Specification (Chi tiết Input)

#### 2.1.1 Configuration & Parameters

| Tên | Loại | Required | Default | Mô tả | Ví dụ |
|-----|------|----------|---------|-------|-------|
| MAX_TEXT_TOKENS | Integer | No | 77 | Max CLIP token length | 77 |
| TEXT_TRUNCATE_MODE | String | No | right | Truncate strategy | right |
| TEXT_NORMALIZE_OUTPUT | Boolean | No | true | Normalize output vector | true |

#### 2.1.2 External Dependencies

| Tên | Loại | SLA | Health Check | Notes |
|-----|------|-----|--------------|-------|
| CLIP Model (Warmup) | Service | 99.9% | WarmupService.is_ready() | Must be loaded before requests |
| CLIP Tokenizer | Library | 99% | import open_clip | Tokenization |
| PyTorch | Library | 99% | import torch | Tensor ops |

#### 2.1.3 Prerequisites

- Warmup workflow completed successfully
- open_clip tokenizer available
- PyTorch >= 2.1.0
- CLIP model loaded on correct device

### 2.2 Output Specification (Chi tiết Output)

#### 2.2.1 Primary Output

| Tên | Loại | Định dạng | Mô tả | Life cycle |
|-----|------|-----------|-------|-----------|
| Embedding Vector | Array | 512-dim float32 | L2-normalized CLIP embedding | Returned to client only |
| TextEmbeddingResult | Object | JSON | Result object with vector + metadata | Until response sent |

#### 2.2.2 Side Effects & Logs

| Tên | Loại | Nơi | Mô tả | Retention |
|-----|------|-----|-------|-----------|
| Processing log | Log | Stdout/Logs | Request text length, token count, latency | Until log rotation |
| Embedding latency metric | Metric | Prometheus | embedding_latency_ms histogram | App lifetime |

#### 2.2.3 State Changes

- **Before**: Request received, model ready
- **After**: Text vector computed and returned to client

### 2.3 Data Processing Characteristics

#### 2.3.1 Data Types

| Loại dữ liệu | Định dạng | Kích thước | Chi tiết |
|-------------|-----------|-----------|---------|
| Input text | UTF-8 string | 1 - 77 tokens | Natural language query |
| Token tensor | int64 tensor | ~1KB | Token ids padded to context length |
| Output vector | float32 array | ~2KB | (512,) shape |

#### 2.3.2 Data Volume & Throughput

- **Expected volume**: Per-request, short text queries
- **Throughput**: ~50-100 texts/second (CPU dependent)
- **Peak load**: Search UI or backend search service bursts

#### 2.3.3 Data Lifecycle

```
Text string (from client)
	|
	v
Validation (1-2ms)
	|
	v
Tokenization (1-10ms)
	|
	v
Encoding (10-50ms on CPU)
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
| TextProcessConfig | Entity | Hold text processing config (token limits, truncate mode) | Type-safe config | Pydantic | app/entities/text_embedding_entities.py |
| TextEmbeddingRequest | Entity | HTTP request object (text) | Request validation | Pydantic | app/entities/text_embedding_entities.py |
| TextEmbeddingResult | Entity | Result object (vector, metadata) | Immutable result | dataclasses | app/entities/text_embedding_entities.py |
| TextValidator | Adapter | Validate text and token count | Input validation | open_clip tokenizer | app/adapters/text_embedding_adapters.py |
| TextTokenizer | Adapter | Tokenize/pad/truncate CLIP text | Token processing | open_clip, torch | app/adapters/text_embedding_adapters.py |
| VectorNormalizer | Adapter | L2-normalize embedding vector | Shared normalization | numpy | app/adapters/text_embedding_adapters.py (shared) |
| TextEmbeddingService | Service | Orchestrate validation -> tokenization -> encoding -> normalization | Coordination | All adapters | app/services/text_embedding_services.py |
| TextEmbeddingRouter | Router | FastAPI endpoint | HTTP handling | FastAPI | app/routers/text_embedding_routers.py |

### 3.2 Component Interaction

#### 3.2.1 Dependency Graph

```
HTTP Request: JSON {"text": "..."}
	|
	v
TextEmbeddingRouter
	|
	+-- Parse JSON body
	+-- Create TextEmbeddingRequest
	|
	v
TextEmbeddingService.extract_embedding()
	|
	+-- TextValidator.validate_text(text)
	|
	+-- TextTokenizer.tokenize(text)
	|       |
	|       v
	|   open_clip tokenizer
	|
	+-- WarmupService.get_model()
	|
	+-- model.encode_text(token_tensor)
	|
	+-- VectorNormalizer.normalize_vector(embedding)
	|
	v
TextEmbeddingResult (vector + metadata)
	|
	v
HTTP Response: JSON
```

### 3.3 Component Responsibilities Detail

#### Component: TextValidator (Adapter)

- **Định nghĩa**: Validate text input and token length
- **Loại**: Adapter
- **Trách nhiệm chính**:
  - Ensure text is non-empty
  - Ensure valid UTF-8 input
  - Count tokens and enforce max 77 tokens
- **Không nên làm gì**:
  - Không tokenize twice
  - Không encode text
  - Không modify request data
- **Phụ thuộc**: open_clip tokenizer utilities
- **Người phụ thuộc**: TextEmbeddingService
- **Test coverage**: tests/adapters/test_text_embedding_adapters.py

#### Component: TextTokenizer (Adapter)

- **Định nghĩa**: Tokenize text for CLIP model
- **Loại**: Adapter
- **Trách nhiệm chính**:
  - Convert text to token ids
  - Pad/truncate to model context length
  - Return torch tensor ready for model
- **Không nên làm gì**:
  - Không validate content semantics
  - Không perform encoding
  - Không normalize vectors
- **Phụ thuộc**: open_clip, torch
- **Người phụ thuộc**: TextEmbeddingService
- **Test coverage**: tests/adapters/test_text_embedding_adapters.py

#### Component: TextEmbeddingService (Service)

- **Định nghĩa**: Orchestrate full text embedding workflow
- **Loại**: Service
- **Trách nhiệm chính**:
  - Validate input text
  - Tokenize text
  - Get warmup model
  - Encode text
  - Normalize result
  - Return TextEmbeddingResult
- **Không nên làm gì**:
  - Không expose internal state
  - Không skip token limits
  - Không modify input text
- **Phụ thuộc**: All adapters above, WarmupService
- **Người phụ thuộc**: TextEmbeddingRouter
- **Test coverage**: tests/services/test_text_embedding_services.py

---

## 4. Design Decisions & Rationale

### 4.1 Architectural Choices

- **Separate text workflow from image workflow**:
  - Pro: Cleaner API contract (JSON text vs multipart image)
  - Pro: Independent validation/tokenization logic
  - Con: More files and tests
  - Decision: Accept con for clarity

- **Use CLIP tokenizer directly**:
  - Pro: Guarantees compatibility with model encoder
  - Pro: Token limit matches model constraints
  - Con: Tokenization overhead
  - Decision: Required by model contract

- **L2-normalize output**:
  - Pro: Compatible with cosine similarity search in Milvus
  - Pro: Matches CLIP embedding semantics
  - Con: One extra math step
  - Decision: Required by data schema and vector search contract

---

## 5. Error Handling & Failure Modes

### 5.1 Expected Failures & Recovery

| Failure Scenario | Root Cause | Detection | Recovery | SLA Impact |
|-----------------|-----------|-----------|----------|-----------|
| Empty text | Client sends blank string | Validation check | Return HTTP 400 ERR_EMPTY_TEXT | None |
| Too many tokens | Text exceeds 77 token limit | Token count check | Return HTTP 400 ERR_TEXT_TOO_LONG | None |
| Invalid UTF-8 | Malformed input | Decoding / validation error | Return HTTP 400 ERR_INVALID_UTF8 | None |
| Model not ready | Warmup not completed | WarmupService.is_ready() | Return HTTP 503 SERVICE_UNAVAILABLE | Retry after warmup |
| Tokenizer mismatch | Wrong tokenizer/model version | Encoding failure | Return HTTP 500 ERR_INTERNAL | Requires fix |

### 5.2 Unexpected Failures

- **What to do**: Check logs, verify tokenization output, verify model state
- **Who to contact**: AG-00 or project owner
- **Where to log**: .knowledge/agent01/Skill_01.md if novel

---

## 6. Performance & Monitoring

### 6.1 Key Metrics

| Metric Name | Type | Unit | Target | Alert Threshold |
|------------|------|------|--------|-----------------|
| embedding_latency_ms | Histogram | ms | p95 < 100 (CPU) | p95 > 150 for 3 windows |
| embedding_requests_total | Counter | count | N/A | N/A |
| embedding_errors_total | Counter | count | error_rate < 1% | error_rate > 5% |
| tokenization_time_ms | Gauge | ms | < 10 | > 25 |

### 6.2 Observability

- **Logging**: Log text length, token count, latency, errors
- **Metrics**: Prometheus histograms for latency
- **Tracing**: Correlation ID from HTTP request

---

## 7. Related Workflows & Integration Points

- **Warmup Workflow**: Text embedding depends on loaded CLIP model
- **Image Embedding Workflow**: Shares the same vector space and normalization contract
- **Batch Embedding Workflow**: Shares normalization, may reuse warmup model access
- **Backend (AG-03)**: Consumes text embeddings for search service

---

## 8. References & Further Reading

- CLIP Paper: https://arxiv.org/abs/2103.14030
- OpenCLIP Documentation: https://github.com/mlfoundations/open_clip
- PyTorch Tensor Operations: https://pytorch.org/docs/stable/tensors.html
- Tasks.yaml - T002-04: .context/Tasks.yaml
