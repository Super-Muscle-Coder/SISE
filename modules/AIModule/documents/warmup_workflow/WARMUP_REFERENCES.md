# Warmup Workflow - References

**Mục đích**: Tài liệu này cung cấp danh sách chi tiết các tệp, thư mục, cấu trúc dự án, và tài liệu tham khảo của warmup workflow. Sử dụng tài liệu này để định vị nhanh các thành phần, hiểu cây thư mục, và tìm kiếm các file cụ thể cần thiết.

**Mục tiêu sử dụng**: Tra cứu cấu trúc, duyệt mã nguồn, tìm file cấu hình, tìm test files.

**Thời gian tra cứu**: 5-10 phút

---

## 1. Directory Structure (Cấu trúc thư mục)

### 1.1 Warmup Workflow Component Tree

```
modules/AIModule/
├── app/
│   ├── entities/
│   │   ├── warmup_entities.py           - WarmupConfig, WarmupResult dataclasses
│   │   └── __init__.py                  - Exports warmup entities
│   │
│   ├── adapters/
│   │   ├── warmup_adapters.py           - DeviceManager, CLIPModelLoader, WarmupExecutor
│   │   └── __init__.py                  - Exports warmup adapters
│   │
│   ├── services/
│   │   ├── warmup_services.py           - WarmupService orchestration
│   │   └── __init__.py                  - Exports warmup service
│   │
│   ├── routers/
│   │   ├── warmup_routers.py            - WarmupRouter, get_warmup_startup_handler
│   │   └── __init__.py                  - Exports warmup router
│   │
│   └── __init__.py                      - App package exports (includes warmup)
│
├── configs/
│   ├── ai.env.example                   - Template env vars (includes WARMUP_TIMEOUT_MS)
│   └── ai.env.local                     - Local env vars (not committed, has values)
│
├── tests/
│   ├── test_warmup_workflow.py          - Warmup integration tests
│   ├── adapters/
│   │   └── test_warmup_adapters.py     - Unit tests for warmup adapters
│   ├── services/
│   │   └── test_warmup_services.py     - Unit tests for warmup service
│   └── fixtures/
│       └── warmup_fixtures.py           - Mock CLIP models, mock configs
│
├── documents/
│   └── warmup_workflow/
│       ├── WARMUP_QUICK_GUIDE.md        - Quick overview (you are here)
│       ├── WARMUP_DEEP_GUIDE.md         - In-depth technical details
│       ├── WARMUP_REFERENCES.md         - File inventory & structure
│       └── INDEX.md                     - Learning path
│
├── scripts/
│   ├── build.ps1                        - Build Docker image
│   ├── entrypoint.sh                    - Container entry point
│   ├── health-check.sh                  - Health check script
│   ├── container.sh                     - Container management
│   └── test-endpoints.bat               - Endpoint testing
│
├── ai_main.py                           - FastAPI app, calls warmup at startup
├── ai_requirements.txt                  - Python dependencies
├── ai_container_Dockerfile              - Container definition
└── .dockerignore                        - Docker ignore rules
```

---

## 2. File Inventory (Danh sách chi tiết các tệp)

### 2.1 Configuration Files

| File Path | File Name | Type | Owner | Purpose | Version | Last Updated |
|-----------|-----------|------|-------|---------|---------|-------------|
| `configs/ai.env.example` | ai.env.example | YAML-like Env | AIModule | Template env vars for all workflows | 1.0.0 | 2026-01-15 |
| `configs/ai.env.local` | ai.env.local | Env Vars | AIModule | Local development values (not committed) | N/A | 2026-01-15 |

### 2.2 Entity Layer Files

| File Path | Class/Function | Type | Purpose | Imports | Exports |
|-----------|----------------|------|---------|---------|---------|
| `app/entities/warmup_entities.py` | WarmupConfig, WarmupResult | Dataclass | Hold warmup config and result objects | pydantic, dataclasses | ['WarmupConfig', 'WarmupResult'] |

**WarmupConfig Fields**:
- `model_name: str` - CLIP model variant (ViT-B/32, ViT-L/14)
- `device: Optional[str]` - torch device (cuda/cpu/None for auto)
- `cache_dir: str` - Path to model cache directory
- `timeout_ms: int` - Warmup execution timeout in milliseconds

**WarmupResult Fields**:
- `status: str` - "success" or "failed"
- `duration_ms: int` - Total warmup duration
- `device_type: str` - "cuda" or "cpu"
- `message: str` - Descriptive message
- `model: Optional[object]` - Loaded model instance (success only)

### 2.3 Adapter Layer Files

| File Path | Class/Function | Type | External System | Purpose | Key Methods |
|-----------|----------------|------|-----------------|---------|------------|
| `app/adapters/warmup_adapters.py` | DeviceManager, CLIPModelLoader, WarmupExecutor | External Integration | torch, open_clip, huggingface_hub | Wrap external APIs | auto_detect(), load_model(), execute_forward_pass() |

**DeviceManager Methods**:
- `auto_detect() -> torch.device` - Detect GPU/CPU, return device

**CLIPModelLoader Methods**:
- `load_model(model_name, device, cache_dir) -> model_instance`
- `_ensure_cache_dir_exists(cache_dir) -> bool`
- `_download_model(model_name, cache_dir) -> bool`

**WarmupExecutor Methods**:
- `execute_dummy_forward_pass(model, device) -> bool`
- `_create_dummy_image_tensor(device) -> torch.Tensor`
- `_create_dummy_text_tokens(device) -> torch.Tensor`
- `_validate_outputs(image_output, text_output) -> bool`

### 2.4 Service Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Key Methods |
|-----------|----------------|------|---------|-----------|------------|
| `app/services/warmup_services.py` | WarmupService | Business Logic | Orchestrate entire warmup workflow | All adapters + entities | execute_warmup(), get_model(), is_ready() |

**WarmupService Methods**:
- `execute_warmup() -> WarmupResult` - Main entry point
- `get_model() -> model_instance` - Get loaded model (singleton)
- `is_ready() -> bool` - Check if warmup completed successfully
- `get_warmup_result() -> WarmupResult` - Get warmup result details

**WarmupService Attributes** (class-level):
- `_model_instance: Optional[model]` - Singleton model
- `_warmup_result: Optional[WarmupResult]` - Result of last warmup
- `_lock: threading.Lock` - Thread-safe access (if multi-threaded)

### 2.5 Router Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Exposed APIs |
|-----------|----------------|------|---------|-----------|------------|
| `app/routers/warmup_routers.py` | create_warmup_router(), get_warmup_startup_handler() | FastAPI Router | Entry point for warmup | WarmupService | HTTP endpoints (FastAPI lifespan) |

**Exported Functions**:
- `create_warmup_router() -> APIRouter` - Create FastAPI router (if needed)
- `get_warmup_startup_handler() -> Callable` - Get startup handler for lifespan event

**Startup Handler Usage** (in ai_main.py):
```python
async def startup_handler():
	result = WarmupService.execute_warmup()
	if result.status != "success":
		raise RuntimeError(f"Warmup failed: {result.message}")
```

### 2.6 Test Files

| File Path | Test Class/Function | Scope | Tests What | Coverage Target |
|-----------|-------------------|-------|-----------|-----------------|
| `tests/test_warmup_workflow.py` | TestWarmupWorkflow | Integration | Entire warmup end-to-end | 85% |
| `tests/adapters/test_warmup_adapters.py` | TestDeviceManager, TestCLIPModelLoader, TestWarmupExecutor | Unit | Individual adapters (mocked) | 95% |
| `tests/services/test_warmup_services.py` | TestWarmupService | Unit | Service orchestration | 90% |
| `tests/fixtures/warmup_fixtures.py` | fixture_* | Shared | Mock models, configs | N/A |

### 2.7 Bootstrap File

| File Path | Function/Method | Purpose |
|-----------|-----------------|---------|
| `ai_main.py` | create_app() | Create FastAPI app with lifespan including warmup startup handler |

**Key Integration Point** (in create_app):
```python
async def lifespan(app):
	# Startup
	warmup_handler = get_warmup_startup_handler()
	await warmup_handler()

	yield

	# Shutdown (if needed)
```

---

## 3. Key Dependencies (Phụ thuộc chính)

### 3.1 External Package Dependencies

| Package | Version | Purpose | Used In | License |
|---------|---------|---------|---------|---------|
| torch | >= 2.1.0 | Tensor operations, device management | adapters/warmup_adapters.py | BSD |
| open_clip_torch | >= 2.20.0 | CLIP model loading and inference | adapters/warmup_adapters.py | MIT |
| huggingface_hub | >= 0.17.0 | Model download from HuggingFace | adapters/warmup_adapters.py | Apache 2.0 |
| pydantic | >= 2.0.0 | Config validation and serialization | entities/warmup_entities.py | MIT |
| pytest | >= 7.4.0 | Testing framework | tests/ | MIT |

### 3.2 Internal Module Dependencies

```
Environment Variables (CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR, WARMUP_TIMEOUT_MS)
	|
	v
WarmupConfig (entity, loaded from env)
	|
	v
DeviceManager (adapter, auto-detect device)
	|
	v
CLIPModelLoader (adapter, load model)
	|
	v
WarmupExecutor (adapter, forward pass)
	|
	v
WarmupService (service, orchestrate)
	|
	v
WarmupResult (entity, output)
	|
	v
WarmupRouter (router, expose startup handler)
	|
	v
ai_main.py (call at lifespan.startup)
	|
	v
FastAPI App Ready
```

### 3.3 Inter-workflow Dependencies

| Workflow | Dependency Type | Status | Description |
|----------|-----------------|--------|-------------|
| Image Embedding (T002-02, T002-03) | depends-on | active | Image embedding uses model loaded by warmup |
| Text Embedding (T002-04) | depends-on | active | Text embedding uses model loaded by warmup |
| Batch Embedding (T002-05) | depends-on | active | Batch embedding uses model loaded by warmup |

---

## 4. Configuration Reference (Tham chiếu cấu hình)

### 4.1 Environment Variables

| Env Variable | Type | Required | Default | Purpose | Example |
|-------------|------|----------|---------|---------|---------|
| CLIP_MODEL_NAME | string | No | ViT-B/32 | CLIP model variant to load | ViT-B/32 or ViT-L/14 |
| DEVICE | string | No | auto-detect | torch device (cpu/cuda) | cpu or cuda |
| MODEL_CACHE_DIR | string | Yes | N/A | Path for model cache | /app/ai-service/model_cache |
| WARMUP_TIMEOUT_MS | integer | No | 30000 | Max warmup execution time (ms) | 30000 (30 seconds) |

**Notes**:
- CLIP_MODEL_NAME: Must be supported by open_clip. Run `import open_clip; open_clip.list_pretrained()` to see options
- DEVICE: If set to "cuda" but CUDA unavailable, logs warning and falls back to CPU
- MODEL_CACHE_DIR: Must be writable. Will create if doesn't exist
- WARMUP_TIMEOUT_MS: If warmup exceeds this, execution times out and fails

---

## 5. API Reference (Tham chiếu API)

### 5.1 Service API Reference

**Class**: `WarmupService`

#### Method: `execute_warmup() -> WarmupResult`

```
Signature: @classmethod
		   async def execute_warmup(cls) -> WarmupResult
```

**Description**: Execute entire warmup workflow (config load -> device detect -> model load -> forward pass -> validation)

**Parameters**: None (reads from env vars internally)

**Returns**:
| Type | Description |
|------|-------------|
| WarmupResult | Object with status, duration_ms, device_type, message, and model instance if successful |

**Raises**: None (all errors caught and reported in WarmupResult.status)

**Example**:
```python
from app.services.warmup_services import WarmupService

result = await WarmupService.execute_warmup()
print(f"Warmup status: {result.status}")
print(f"Duration: {result.duration_ms}ms on device {result.device_type}")
if result.status == "success":
	model = result.model
	# Use model for inference
```

#### Method: `get_model() -> Optional[object]`

```
Signature: @classmethod
		   def get_model(cls) -> Optional[object]
```

**Description**: Get loaded CLIP model instance (singleton)

**Returns**: Model instance or None if warmup not completed

**Example**:
```python
model = WarmupService.get_model()
if model is not None:
	# Use model for inference
	embeddings = model.encode_image(image_tensor)
```

#### Method: `is_ready() -> bool`

```
Signature: @classmethod
		   def is_ready(cls) -> bool
```

**Description**: Check if warmup completed successfully

**Returns**: True if warmup succeeded and model ready, False otherwise

**Example**:
```python
if WarmupService.is_ready():
	# Safe to process embedding requests
	pass
else:
	# Warmup still running or failed
	pass
```

---

## 6. Testing Reference

### 6.1 How to Run Tests

**Run all warmup tests**:
```bash
pytest tests/test_warmup_workflow.py -v
```

**Run warmup adapters unit tests**:
```bash
pytest tests/adapters/test_warmup_adapters.py -v
```

**Run warmup service unit tests**:
```bash
pytest tests/services/test_warmup_services.py -v
```

**Run with coverage**:
```bash
pytest tests/ -k warmup --cov=app.services.warmup_services --cov-report=html
```

### 6.2 Test Fixtures

**Location**: `tests/fixtures/warmup_fixtures.py`

**Available Fixtures**:
| Fixture Name | Type | Purpose | Usage |
|-------------|------|---------|-------|
| mock_device | Mock | Mock torch.device | Patch DeviceManager.auto_detect |
| mock_clip_model | Mock | Mock CLIP model instance | Patch CLIPModelLoader.load_model |
| warmup_config_default | WarmupConfig | Default config for tests | Inject into service |
| mock_cache_dir | tempfile.TemporaryDirectory | Temporary cache dir | Use in tests |

---

## 7. Quick Navigation

**Looking for...**

- **Where is WarmupConfig defined?** -> app/entities/warmup_entities.py
- **Where is warmup orchestration logic?** -> app/services/warmup_services.py
- **Where is model loading code?** -> app/adapters/warmup_adapters.py (CLIPModelLoader)
- **Where is startup hook?** -> app/routers/warmup_routers.py (get_warmup_startup_handler)
- **Where do I see warmup called?** -> ai_main.py (create_app lifespan)
- **How to test adapters?** -> tests/adapters/test_warmup_adapters.py
- **How to test service?** -> tests/services/test_warmup_services.py
- **What are env vars?** -> Section 4.1 of this document
- **What are warmup metrics?** -> WARMUP_DEEP_GUIDE.md Section 6.1

---

## 8. File Ownership & Contact

### 8.1 Component Owners

| Component | Owner | Team | Contact | Escalation |
|-----------|-------|------|---------|-----------|
| WarmupConfig, WarmupResult (entities) | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| DeviceManager, CLIPModelLoader, WarmupExecutor (adapters) | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| WarmupService | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| WarmupRouter, startup handler | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |
| ai.env config keys | AG-01 | AIModuleAgent | project-owner@example.com | AG-00 |

---

## 9. Version History & Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-21 | Initial reference documentation for warmup workflow | AG-01 |

---

## 10. Related Documentation & Links

### 10.1 Related Warmup Docs

- [WARMUP_QUICK_GUIDE.md](./WARMUP_QUICK_GUIDE.md) - Quick overview
- [WARMUP_DEEP_GUIDE.md](./WARMUP_DEEP_GUIDE.md) - In-depth details

### 10.2 Related Workflows

- [Image Embedding Workflow](../image_embedding_workflow/REFERENCES.md)
- [Text Embedding Workflow](../text_embedding_workflow/REFERENCES.md)
- [Batch Embedding Workflow](../batch_embedding_workflow/REFERENCES.md)
- [AI Container Workflow](../ai_container_workflow/REFERENCES.md)

### 10.3 External References

- [PyTorch Device Documentation](https://pytorch.org/docs/stable/tensor_attributes.html#torch.device)
- [OpenCLIP GitHub](https://github.com/mlfoundations/open_clip)
- [CLIP Paper](https://arxiv.org/abs/2103.14030)
- [HuggingFace Hub Documentation](https://huggingface.co/docs/hub/)

### 10.4 Project References

- [Tasks.yaml](.context/Tasks.yaml) - T002-01 warmup task
- [DOS.md](.context/DOS.md) - System design and constraints
- [data_schema.yaml](.context/data_schema.yaml) - Data contracts (vector_dim=512)
- [ai_requirements.txt](../../ai_requirements.txt) - Python dependencies
