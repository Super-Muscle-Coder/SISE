# Text Embedding Workflow - References

**Mục đích**: Tài liệu này cung cấp danh sách chi tiết các tệp, thư mục, cấu trúc dự án, và tài liệu tham khảo của text embedding workflow. Sử dụng tài liệu này để định vị nhanh các thành phần, hiểu cây thư mục, và tìm kiếm các file cụ thể cần thiết.

**Mục tiêu sử dụng**: Tra cứu cấu trúc, duyệt mã nguồn, tìm file cấu hình, tìm test files.

**Thời gian tra cứu**: 5-10 phút

---

## 1. Directory Structure (Cấu trúc thư mục)

### 1.1 Text Embedding Workflow Component Tree

```
modules/AIModule/
├── app/
│   ├── entities/
│   │   ├── text_embedding_entities.py    - TextProcessConfig, TextEmbeddingRequest, TextEmbeddingResult
│   │   └── __init__.py                  - Exports text embedding entities
│   │
│   ├── adapters/
│   │   ├── text_embedding_adapters.py    - TextValidator, TextTokenizer, VectorNormalizer (shared)
│   │   └── __init__.py                  - Exports text embedding adapters
│   │
│   ├── services/
│   │   ├── text_embedding_services.py    - TextEmbeddingService orchestration
│   │   └── __init__.py                  - Exports text embedding service
│   │
│   ├── routers/
│   │   ├── text_embedding_routers.py     - TextEmbeddingRouter, create_text_embedding_router
│   │   └── __init__.py                  - Exports text embedding router
│   │
│   └── __init__.py                        - App package exports (includes text embedding)
│
├── configs/
│   ├── ai.env.example                     - Template env vars (MAX_TEXT_TOKENS, truncation)
│   └── ai.env.local                       - Local env vars (not committed, has values)
│
├── tests/
│   ├── test_text_embedding_workflow.py    - Text embedding integration tests
│   ├── adapters/
│   │   └── test_text_embedding_adapters.py - Unit tests for adapters
│   ├── services/
│   │   └── test_text_embedding_services.py - Unit tests for service
│   └── fixtures/
│       └── text_embedding_fixtures.py     - Mock texts, token fixtures
│
├── documents/
│   └── text_embedding_workflow/
│       ├── TEXT_EMBEDDING_QUICK_GUIDE.md    - Quick overview
│       ├── TEXT_EMBEDDING_DEEP_GUIDE.md     - In-depth technical details
│       ├── TEXT_EMBEDDING_REFERENCES.md     - File inventory & structure
│       └── INDEX.md                        - Learning path
│
├── ai_main.py                            - FastAPI app, registers text embedding router
├── ai_requirements.txt                   - Python dependencies
└── .dockerignore                         - Docker ignore rules
```

---

## 2. File Inventory (Danh sách chi tiết các tệp)

### 2.1 Configuration Files

| File Path | File Name | Type | Owner | Purpose | Version |
|-----------|-----------|------|-------|---------|---------|
| `configs/ai.env.example` | ai.env.example | Env Template | AIModule | Template for MAX_TEXT_TOKENS and text processing config | 1.0.0 |
| `configs/ai.env.local` | ai.env.local | Env Vars | AIModule | Local values (not committed) | N/A |

### 2.2 Entity Layer Files

| File Path | Class/Function | Type | Purpose | Imports | Exports |
|-----------|----------------|------|---------|---------|---------|
| `app/entities/text_embedding_entities.py` | TextProcessConfig, TextEmbeddingRequest, TextEmbeddingResult | Dataclass | Configuration and request/result objects | pydantic, dataclasses | ['TextProcessConfig', 'TextEmbeddingRequest', 'TextEmbeddingResult'] |

**TextProcessConfig Fields**:
- `max_tokens: int` - Maximum token length allowed (77)
- `truncate_mode: str` - Token truncation strategy
- `normalize_output: bool` - Whether to L2-normalize output vector

**TextEmbeddingRequest Fields**:
- `text: str` - UTF-8 text query from client

**TextEmbeddingResult Fields**:
- `vector: List[float]` - 512-dim embedding vector
- `metadata: Dict` - Processing metadata (token_count, latency_ms)

### 2.3 Adapter Layer Files

| File Path | Class/Function | Type | External System | Purpose | Key Methods |
|-----------|----------------|------|-----------------|---------|------------|
| `app/adapters/text_embedding_adapters.py` | TextValidator, TextTokenizer, VectorNormalizer | External Integration | open_clip, torch, numpy | Text validation, tokenization, normalization | validate_text(), tokenize(), normalize_vector() |

**TextValidator Methods**:
- `validate_text(text) -> bool` - Check non-empty, UTF-8, token limit

**TextTokenizer Methods**:
- `tokenize(text) -> torch.Tensor` - Convert text to CLIP token tensor

**VectorNormalizer Methods** (shared utility):
- `normalize_vector(vector) -> Tuple[List[float], float]` - L2-normalize, return (normalized_vector, magnitude)

### 2.4 Service Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Key Methods |
|-----------|----------------|------|---------|-----------|------------|
| `app/services/text_embedding_services.py` | TextEmbeddingService | Business Logic | Orchestrate entire workflow | All adapters, WarmupService | extract_embedding(request) -> result |

**TextEmbeddingService Methods**:
- `extract_embedding(request: TextEmbeddingRequest) -> TextEmbeddingResult` - Main entry point
- `_validate_input(request) -> bool` - Input validation
- `_get_model() -> model_instance` - Get loaded CLIP model

### 2.5 Router Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Exposed APIs |
|-----------|----------------|------|---------|-----------|------------|
| `app/routers/text_embedding_routers.py` | create_text_embedding_router() | FastAPI Router | FastAPI endpoint registration | TextEmbeddingService | POST /inference/embed/text |

**Exported Functions**:
- `create_text_embedding_router() -> APIRouter` - Create FastAPI router with text embedding endpoint

**Endpoint Signature**:
```python
@router.post("/inference/embed/text")
async def embed_text(payload: TextEmbeddingRequest) -> TextEmbeddingResult
```

**Parameters**:
- `payload`: JSON body containing `text` field

**Returns**: TextEmbeddingResult with vector and metadata

### 2.6 Test Files

| File Path | Test Class/Function | Scope | Tests What | Coverage Target |
|-----------|-------------------|-------|-----------|-----------------|
| `tests/test_text_embedding_workflow.py` | TestTextEmbeddingWorkflow | Integration | Entire workflow end-to-end | 85% |
| `tests/adapters/test_text_embedding_adapters.py` | TestTextValidator, TestTextTokenizer | Unit | Individual adapters | 95% |
| `tests/services/test_text_embedding_services.py` | TestTextEmbeddingService | Unit | Service orchestration | 90% |
| `tests/fixtures/text_embedding_fixtures.py` | fixture_* | Shared | Mock text inputs, configs | N/A |

---

## 3. Key Dependencies (Phụ thuộc chính)

### 3.1 External Package Dependencies

| Package | Version | Purpose | Used In | License |
|---------|---------|---------|---------|---------|
| open_clip_torch | >= 2.20.0 | CLIP tokenizer and text encoder | adapters/text_embedding_adapters.py | MIT |
| torch | >= 2.1.0 | Tensor operations | adapters/text_embedding_adapters.py | BSD |
| numpy | >= 1.20.0 | Array operations, normalization | adapters/text_embedding_adapters.py | BSD |
| fastapi | >= 0.110.0 | HTTP routing | routers/text_embedding_routers.py | MIT |
| pydantic | >= 2.0.0 | Request/response validation | entities/text_embedding_entities.py | MIT |
| pytest | >= 7.4.0 | Testing | tests/ | MIT |

### 3.2 Internal Module Dependencies

```
Text query (client payload)
	|
	v
TextEmbeddingRouter (HTTP handler)
	|
	v
TextEmbeddingRequest (parse JSON)
	|
	v
TextEmbeddingService.extract_embedding()
	|
	+-- TextValidator.validate_text()
	+-- TextTokenizer.tokenize()
	+-- WarmupService.get_model()
	+-- model.encode_text()
	+-- VectorNormalizer.normalize_vector()
	|
	v
TextEmbeddingResult
	|
	v
HTTP Response (JSON)
```

### 3.3 Inter-workflow Dependencies

| Workflow | Dependency Type | Status | Description |
|----------|-----------------|--------|-------------|
| Warmup Workflow (T002-01) | depends-on | active | Text embedding requires loaded CLIP model |
| Image Embedding (T002-02/T002-03) | sibling | independent | Both share vector dimension and normalization contract |
| Batch Embedding (T002-05) | used-by | active | Batch may reuse normalization and warmup model access |

---

## 4. Configuration Reference (Tham chiếu cấu hình)

### 4.1 Environment Variables

| Env Variable | Type | Required | Default | Purpose | Example |
|-------------|------|----------|---------|---------|---------|
| MAX_TEXT_TOKENS | integer | No | 77 | Max CLIP token count | 77 |
| TEXT_TRUNCATE_MODE | string | No | right | Truncate mode | right |
| TEXT_NORMALIZE_OUTPUT | boolean | No | true | Normalize output vector | true |

**Notes**:
- MAX_TEXT_TOKENS: CLIP context limit for text encoder
- TEXT_TRUNCATE_MODE: Right truncation is commonly used to preserve prompt prefix
- TEXT_NORMALIZE_OUTPUT: Must remain enabled for cosine similarity compatibility

---

## 5. API Reference (Tham chiếu API)

### 5.1 Service API

**Class**: `TextEmbeddingService`

#### Method: `extract_embedding(request: TextEmbeddingRequest) -> TextEmbeddingResult`

```
Signature: @staticmethod
		   def extract_embedding(request: TextEmbeddingRequest) -> TextEmbeddingResult
```

**Description**: Extract 512-dim embedding from text

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| request | TextEmbeddingRequest | Yes | Text query payload |

**Returns**:
| Type | Description |
|------|-------------|
| TextEmbeddingResult | vector (512-dim), metadata (token_count, latency_ms) |

**Raises**:
| Exception | When |
|-----------|------|
| ValidationError | Empty text, token limit exceeded |
| TokenizationError | Tokenizer failure |
| ModelNotReadyError | CLIP model not loaded |
| EncodingError | Encoding failed |

**Example**:
```python
from app.services.text_embedding_services import TextEmbeddingService
from app.entities.text_embedding_entities import TextEmbeddingRequest

request = TextEmbeddingRequest(text="a cat on the table")
result = TextEmbeddingService.extract_embedding(request)
print(result.vector)
print(result.metadata)
```

### 5.2 Router API (HTTP)

**Endpoint**: `POST /inference/embed/text`

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "text": "a cat on the table"
}
```

**Response** (HTTP 200):
```json
{
  "vector": [0.123, -0.456, ..., 0.789],
  "metadata": {
	"token_count": 5,
	"latency_ms": 32
  }
}
```

**Error Responses**:
- HTTP 400: Invalid text (ERR_EMPTY_TEXT, ERR_TEXT_TOO_LONG, ERR_INVALID_UTF8)
- HTTP 503: Model not ready (ERR_MODEL_NOT_READY)
- HTTP 500: Internal error (ERR_INTERNAL)

---

## 6. Testing Reference

### 6.1 How to Run Tests

**Run all text embedding tests**:
```bash
pytest tests/test_text_embedding_workflow.py -v
```

**Run adapter tests**:
```bash
pytest tests/adapters/test_text_embedding_adapters.py -v
```

**Run service tests**:
```bash
pytest tests/services/test_text_embedding_services.py -v
```

**Run with coverage**:
```bash
pytest tests/ -k "text_embedding" --cov=app.services.text_embedding_services --cov-report=html
```

### 6.2 Test Fixtures

**Location**: `tests/fixtures/text_embedding_fixtures.py`

**Available Fixtures**:
| Fixture Name | Type | Purpose |
|-------------|------|---------|
| sample_short_text | str | Valid short query |
| sample_long_text | str | Text near token limit |
| empty_text | str | Empty string |
| invalid_utf8_text | bytes | Malformed input |
| mock_tokenizer | Mock | Mock CLIP tokenizer |

---

## 7. Quick Navigation

**Looking for...**

- **TextValidator code?** -> app/adapters/text_embedding_adapters.py
- **TextTokenizer code?** -> app/adapters/text_embedding_adapters.py
- **Service orchestration?** -> app/services/text_embedding_services.py
- **HTTP endpoint?** -> app/routers/text_embedding_routers.py
- **Data models?** -> app/entities/text_embedding_entities.py
- **How to test validators?** -> tests/adapters/test_text_embedding_adapters.py
- **How to test service?** -> tests/services/test_text_embedding_services.py
- **What's the endpoint URL?** -> POST /inference/embed/text
- **What vector dimension?** -> 512 (see data_schema.yaml global_configs.vector_dim)

---

## 8. File Ownership & Contact

### 8.1 Component Owners

| Component | Owner | Team | Contact | Escalation |
|-----------|-------|------|---------|-----------|
| TextValidator, TextTokenizer | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| TextEmbeddingService | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| TextEmbeddingRouter | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| Configuration (ai.env) | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |

---

## 9. Version History & Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-21 | Initial reference documentation for text embedding workflow | AG-01 |

---

## 10. Related Documentation & Links

### 10.1 Related Text Embedding Docs

- [TEXT_EMBEDDING_QUICK_GUIDE.md](./TEXT_EMBEDDING_QUICK_GUIDE.md) - Quick overview
- [TEXT_EMBEDDING_DEEP_GUIDE.md](./TEXT_EMBEDDING_DEEP_GUIDE.md) - In-depth details

### 10.2 Related Workflows

- [Warmup Workflow](../warmup_workflow/REFERENCES.md) - Dependency
- [Image Embedding Workflow](../image_embedding_workflow/REFERENCES.md) - Sibling
- [Batch Embedding Workflow](../batch_embedding_workflow/REFERENCES.md) - Shared normalization and warmup access

### 10.3 External References

- [CLIP Paper](https://arxiv.org/abs/2103.14030)
- [OpenCLIP GitHub](https://github.com/mlfoundations/open_clip)
- [PyTorch Tensor Operations](https://pytorch.org/docs/stable/tensors.html)

### 10.4 Project References

- [Tasks.yaml](.context/Tasks.yaml) - T002-04 task
- [DOS.md](.context/DOS.md) - System design
- [data_schema.yaml](.context/data_schema.yaml) - Data contracts (vector_dim=512)
- [ai_requirements.txt](../../ai_requirements.txt) - Dependencies
