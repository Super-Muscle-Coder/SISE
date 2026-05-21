# Warmup Workflow - Deep Guide

**Mục đích**: Tài liệu này cung cấp chi tiết toàn diện về warmup workflow cho các developer chuyên sâu, các nhà kiến trúc hệ thống, và những người cần hiểu sâu sắc từng khía cạnh của workflow.

**Mức độ**: Advanced / Specialist-level
**Thời gian đọc**: 45-60 phút

---

## 1. Chi tiết: Workflow này là gì? Nó được thiết kế như thế nào?

### 1.1 Định nghĩa đầy đủ

**Warmup Workflow** (T002-01) là:
- **Mục tiêu chính**: Tải CLIP model, chuẩn bị cho inference, loại bỏ cold-start latency, cấu hình device (GPU/CPU)
- **Phạm vi**: Chạy tại startup AI Service, trước khi bất kỳ embedding request nào
- **Vai trò trong hệ thống**: Foundation layer cho image_embedding và text_embedding workflows
- **Lịch sử thiết kế**: Warmup được tách riêng để (1) Fail fast nếu model không load được (2) Measure actual startup time (3) Support device auto-detection (4) Reuse model instance across requests

### 1.2 Kiến trúc chi tiết (Detailed Architecture)

#### 1.2.1 Tầng lớp kiến trúc (Layered Architecture)

1. **Config Layer** (Configuration & Contracts)
   - **Chức năng**: Định nghĩa CLIP model name, device, cache directory, timeout
   - **Trách nhiệm**: Validate model name, check cache directory writable
   - **Ví dụ**: CLIP_MODEL_NAME=ViT-B/32, DEVICE=cpu, MODEL_CACHE_DIR=/cache

2. **Entity Layer** (Data Models & Config Objects)
   - **Chức năng**: WarmupConfig, WarmupResult dataclasses
   - **Trách nhiệm**: Type-safe config representation, immutable result object
   - **Ví dụ**: WarmupConfig(model_name="ViT-B/32", device="cpu")

3. **Adapter Layer** (External Integration)
   - **Chức năng**: DeviceManager, CLIPModelLoader, WarmupExecutor
   - **Trách nhiệm**: Interact with torch, open_clip, filesystem
   - **Ví dụ**: DeviceManager.auto_detect(), CLIPModelLoader.load_model()

4. **Service Layer** (Business Logic & Orchestration)
   - **Chức năng**: WarmupService orchestrates entire workflow
   - **Trách nhiệm**: Coordinate adapters, manage state, handle errors
   - **Ví dụ**: WarmupService.execute_warmup()

5. **Router Layer** (Public API Interface)
   - **Chức năng**: WarmupRouter exposes entry point
   - **Trách nhiệm**: FastAPI lifespan handler
   - **Ví dụ**: get_warmup_startup_handler()

#### 1.2.2 Flow chi tiết (Detailed Process Flow)

```
FastAPI lifespan.startup event
	|
	v
WarmupRouter.get_warmup_startup_handler() [called by ai_main.py]
	|
	v
WarmupService.execute_warmup()
	|
	+-- Step 1: Load WarmupConfig from env vars
	|       v
	|   WarmupConfig(model_name, device, cache_dir, timeout)
	|
	+-- Step 2: Detect device
	|       v
	|   DeviceManager.auto_detect() -> torch.device
	|
	+-- Step 3: Load CLIP model
	|       v
	|   CLIPModelLoader.load_model(model_name, device, cache_dir)
	|       |
	|       +-- Check cache_dir exists, create if needed
	|       +-- Download model if not cached (HuggingFace)
	|       +-- Load weights into memory
	|       +-- Return model instance
	|
	+-- Step 4: Prepare model
	|       v
	|   model.eval() [disable dropout, batch norm]
	|   model.to(device) [move to GPU/CPU]
	|
	+-- Step 5: Warmup forward pass
	|       v
	|   WarmupExecutor.execute_dummy_forward_pass(model)
	|       |
	|       +-- Create dummy image tensor (1, 3, 224, 224)
	|       +-- Create dummy text tokens
	|       +-- Forward pass image encoder
	|       +-- Forward pass text encoder
	|       +-- Verify output shapes & dims
	|
	+-- Step 6: Validation
	|       v
	|   Check: model in eval mode, model on correct device
	|   Check: output dims = 512 (global_configs.vector_dim)
	|
	+-- Step 7: Result
	|       v
	|   WarmupResult(status=success, duration_ms, device_type, message)
	|
	v
Log result, make model globally accessible
	|
	v
FastAPI ready to accept requests
```

#### 1.2.3 Quy trình chi tiết từng bước (Step-by-Step Process)

**Bước 1: Load Configuration**
- **Input**: Environment variables (CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR, WARMUP_TIMEOUT_MS)
- **Xử lý**: Parse env, validate model name against supported list (ViT-B/32, ViT-L/14), validate cache dir writable
- **Validation**: model_name in ["ViT-B/32", "ViT-L/14"], cache_dir path valid and writable
- **Output**: WarmupConfig object
- **Error Handling**: Raise ConfigValidationError if invalid
- **Idempotency**: Yes - same env vars always produce same config

**Bước 2: Device Detection**
- **Input**: Optional DEVICE env var
- **Xử lý**: If DEVICE set, use it; else auto-detect (check torch.cuda.is_available())
- **Validation**: device must be "cuda" or "cpu"
- **Output**: torch.device object, device_type string
- **Error Handling**: Log warning if CUDA not available despite DEVICE=cuda, fallback to CPU
- **Idempotency**: Yes - same hardware state produces same device

**Bước 3: Model Loading**
- **Input**: model_name, device, cache_dir
- **Xử lý**: 
  - Check cache_dir exists, create if needed
  - Check if model cached locally (pytorch_model.bin)
  - If not cached: download from HuggingFace (first time only, slow ~1-2 min)
  - If cached: load from disk (fast, ~5s)
  - Load weights into memory
- **Validation**: Check model loaded successfully, verify model has expected attributes (encode_image, encode_text)
- **Output**: Loaded model instance
- **Error Handling**: 
  - If download fails (network): raise NetworkError with retry guidance
  - If disk full: raise DiskFullError
  - If model corrupted: raise ModelCorruptedError, suggest re-download
- **Idempotency**: Yes - repeated loads with cached model produce identical result

**Bước 4: Model Preparation**
- **Input**: Loaded model, device
- **Xử lý**: 
  - model.eval() - disable dropout, batch norm stats update
  - model.to(device) - transfer to GPU/CPU
  - torch.no_grad() context - disable gradient computation
- **Validation**: model.training == False, verify model tensors on correct device
- **Output**: Prepared model, ready for inference
- **Error Handling**: If device transfer fails (e.g., not enough GPU memory): raise OutOfMemoryError, fallback to CPU
- **Idempotency**: Yes - repeated preparation idempotent

**Bước 5: Warmup Forward Pass**
- **Input**: Prepared model
- **Xử lý**:
  - Create dummy image tensor: shape (1, 3, 224, 224), random values [0, 1]
  - Create dummy text tokens: tokenized "a cat on the table", padded to max length
  - Forward pass through image encoder: model.encode_image(image_tensor)
  - Forward pass through text encoder: model.encode_text(text_tokens)
  - Verify outputs: check shapes, dims, values not NaN/Inf
- **Validation**: 
  - image_output shape = (1, 512), dtype = float32
  - text_output shape = (1, 512), dtype = float32
  - No NaN/Inf values in outputs
  - Values in reasonable range [-5, 5]
- **Output**: Confirmation forward pass successful
- **Error Handling**: If forward pass fails, raise WarmupExecutionError with details
- **Idempotency**: Yes - repeated warmup forward passes produce different results (due to model stochasticity) but all valid

**Bước 6: Validation**
- **Input**: Model, output from forward pass
- **Xử lý**: Run checks (model in eval, correct device, output dims, no errors)
- **Validation**: All checks pass
- **Output**: Validation result (pass/fail)
- **Error Handling**: Fail fast with detailed error message
- **Idempotency**: Yes

**Bước 7: Logging & Result**
- **Input**: All previous results, timing
- **Xử lý**: Aggregate results, compute total duration, format log message
- **Output**: WarmupResult(status, duration_ms, device_type, message)
- **Error Handling**: Include error details if any step failed

---

## 2. Chi tiết: Workflow này xử lý dữ liệu gì? Input, Output là gì?

### 2.1 Input Specification (Chi tiết Input)

#### 2.1.1 Configuration & Parameters

| Tên | Loại | Required | Default | Mô tả | Ví dụ |
|-----|------|----------|---------|-------|-------|
| CLIP_MODEL_NAME | String | Yes | ViT-B/32 | CLIP model variant | ViT-B/32 hoặc ViT-L/14 |
| DEVICE | String | No | auto-detect | torch device | cpu hoặc cuda |
| MODEL_CACHE_DIR | String | Yes | /app/ai-service/model_cache | Local cache for models | /app/ai-service/model_cache |
| WARMUP_TIMEOUT_MS | Integer | No | 30000 | Max warmup time (ms) | 30000 (30 seconds) |

#### 2.1.2 External Dependencies

| Tên | Loại | SLA | Health Check | Notes |
|-----|------|-----|--------------|-------|
| Network/Internet | Service | 99% | ping huggingface.co | Only on first download |
| Disk Storage | System | 99% | Check free space | >= 2GB recommended |
| GPU (if CUDA) | Hardware | 99% | torch.cuda.is_available() | Optional, CPU fallback |

#### 2.1.3 Prerequisites

- Python 3.13 installed
- PyTorch >= 2.1.0 installed
- open_clip >= 2.20.0 installed
- MODEL_CACHE_DIR path writable (or permission to create)
- If using GPU: CUDA 11.8+ compatible drivers

### 2.2 Output Specification (Chi tiết Output)

#### 2.2.1 Primary Output (Artifact chính)

| Tên | Loại | Nơi lưu | Định dạng | Mô tả | Life cycle |
|-----|------|---------|-----------|-------|-----------|
| Loaded CLIP Model | Object | Memory | PyTorch model instance | Model in eval mode, on correct device, ready for inference | Until container stops |
| WarmupResult | Object | Memory + Logs | WarmupResult dataclass | Status, duration_ms, device_type, message | Accessible during app lifetime |

#### 2.2.2 Side Effects & Logs

| Tên | Loại | Nơi | Mô tả | Retention |
|-----|------|-----|-------|-----------|
| Warmup log entry | Log | Stdout / LogFile | Timestamp, status, duration, device type | Until app log rotation |
| Model cache files | Files | MODEL_CACHE_DIR | pytorch_model.bin, config.json | Until manual cleanup |
| Warmup duration metric | Metric | Memory / Prometheus | warmup_duration_ms gauge | App lifetime |
| Device type label | Metric | Logs / Metrics | device_type label (cpu/cuda) | App lifetime |

#### 2.2.3 State Changes

- **Before**: AI Service process started, model not loaded, device unknown
- **After**: CLIP model loaded in memory, eval mode, correct device, ready to process embedding requests

### 2.3 Data Processing Characteristics

#### 2.3.1 Data Types

| Loại dữ liệu | Định dạng | Kích thước | Chi tiết |
|-------------|-----------|-----------|---------|
| Model weights | PyTorch .bin | 600MB (ViT-B/32) / 1.5GB (ViT-L/14) | Cached locally |
| Dummy image tensor | float32 tensor | ~300KB | (1, 3, 224, 224) shape |
| Dummy text tokens | int64 tensor | ~1KB | Max 77 tokens |
| Output vectors | float32 tensor | ~2KB per vector | (1, 512) shape |

#### 2.3.2 Data Volume & Throughput

- **Expected volume**: 1 CLIP model per container (~600MB - 1.5GB)
- **Throughput**: Model loading 5-30s (cached), 60-120s (download)
- **Peak load**: Single startup event

#### 2.3.3 Data Lifecycle

```
Environment Variables (runtime injection)
	|
	v
WarmupConfig (parsed in memory)
	|
	v
Model Download (if not cached) / Model Load (if cached)
	|
	v
Model in Memory (eval mode, correct device)
	|
	v
Warmup Forward Pass (dummy tensors)
	|
	v
Validation Pass
	|
	v
Model Ready for Embedding Requests
	|
	v
Model Persists Until Container Stops
```

---

## 3. Chi tiết: Các thành phần trọng tâm của Workflow?

### 3.1 Component Inventory (Danh sách chi tiết)

| Component | Category | Chức năng | Trách nhiệm | Dependencies | Owner |
|-----------|----------|----------|-----------|--------------|-------|
| WarmupConfig | Entity | Hold warmup config (model_name, device, cache_dir, timeout) | Type-safe config, validation | Pydantic | app/entities/warmup_entities.py |
| WarmupResult | Entity | Hold warmup result (status, duration, device, message) | Immutable result object | dataclasses | app/entities/warmup_entities.py |
| DeviceManager | Adapter | Auto-detect and manage torch device (CUDA/CPU) | Detect GPU availability, handle device transfer | torch | app/adapters/warmup_adapters.py |
| CLIPModelLoader | Adapter | Download and load CLIP model from open_clip | Model caching, download, error handling | open_clip, huggingface_hub | app/adapters/warmup_adapters.py |
| WarmupExecutor | Adapter | Execute dummy forward pass, validation | Tensor creation, forward pass, validation | torch, open_clip | app/adapters/warmup_adapters.py |
| WarmupService | Service | Orchestrate entire warmup workflow | Coordinate adapters, manage state, logging | All adapters above | app/services/warmup_services.py |
| WarmupRouter | Router | Expose warmup as FastAPI lifespan handler | FastAPI startup hook | WarmupService | app/routers/warmup_routers.py |
| ai_main.py | Bootstrap | Call warmup at startup | Create app with lifespan | WarmupRouter | ai_main.py |

### 3.2 Component Interaction (Chi tiết tương tác)

#### 3.2.1 Dependency Graph

```
CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR env vars
	|
	v
WarmupConfig (entity)
	|
	+-- DeviceManager (auto-detect)
	|       |
	|       v
	|   torch.device
	|
	+-- CLIPModelLoader (load model)
	|       |
	|       v
	|   Model instance
	|
	+-- WarmupExecutor (forward pass)
	|       |
	|       v
	|   Validation result
	|
	v
WarmupService (orchestrates all above)
	|
	v
WarmupResult (status, duration, device_type)
	|
	v
WarmupRouter (expose to FastAPI)
	|
	v
ai_main.py (lifespan.startup)
	|
	v
AI Service Ready
```

### 3.3 Component Responsibilities Detail

#### Component: DeviceManager (Adapter)

- **Định nghĩa**: Manages torch device detection and configuration
- **Loại**: Adapter
- **Trách nhiệm chính**: 
  - Auto-detect CUDA availability: torch.cuda.is_available()
  - Return torch.device("cuda") or torch.device("cpu")
  - Log device info (CUDA version, GPU name if available)
- **Không nên làm gì**: 
  - Không modify CLIP model
  - Không perform warmup forward pass
  - Không access network
- **Phụ thuộc**: torch
- **Người phụ thuộc**: WarmupService
- **Test coverage**: tests/adapters/test_warmup_adapters.py

#### Component: CLIPModelLoader (Adapter)

- **Định nghĩa**: Download and load CLIP model from open_clip
- **Loại**: Adapter
- **Trách nhiệm chính**: 
  - Check/create model cache directory
  - Download model if not cached (pymilvus.download_model or open_clip.load)
  - Load model weights from disk
  - Return model instance
- **Không nên làm gì**: 
  - Không run inference
  - Không modify model weights
  - Không log model internals
- **Phụ thuộc**: open_clip, huggingface_hub, torch, pathlib
- **Người phụ thuộc**: WarmupService
- **Test coverage**: tests/adapters/test_warmup_adapters.py (mocking HF downloads)

#### Component: WarmupExecutor (Adapter)

- **Định nghĩa**: Execute dummy forward pass and validation
- **Loại**: Adapter
- **Trách nhiệm chính**: 
  - Create dummy tensors (image, text)
  - Run forward pass through model encoders
  - Validate output shapes, dtypes, values
  - Return validation result
- **Không nên làm ghi**: 
  - Không modify model
  - Không persist outputs
  - Không access external resources
- **Phụ thuộc**: torch, numpy
- **Người phụ thuộc**: WarmupService
- **Test coverage**: tests/adapters/test_warmup_adapters.py

#### Component: WarmupService (Service)

- **Định nghĩa**: Orchestrate entire warmup workflow
- **Loại**: Service
- **Trách nhiệm chính**: 
  - Load config from env
  - Call DeviceManager, CLIPModelLoader, WarmupExecutor in sequence
  - Handle errors, log results
  - Return WarmupResult
  - Store model instance globally (singleton pattern)
- **Không nên làm gì**: 
  - Không expose internal state directly
  - Không modify config after loading
  - Không skip any validation steps
- **Phụ thuộc**: All adapters above, WarmupConfig, WarmupResult
- **Người phụ thuộc**: WarmupRouter, ai_main.py
- **Test coverage**: tests/services/test_warmup_services.py

---

## 4. Design Decisions & Rationale (Quyết định thiết kế)

### 4.1 Architectural Choices

- **Tách Warmup riêng**: Tại sao không tích hợp vào image/text embedding?
  - Pro: Fail fast (if model not load, entire app fails at startup, not first request)
  - Pro: Measure actual startup time separate from first inference
  - Pro: Allow config reload without restarting app (future)
  - Con: Extra code, extra layer
  - Decision: Accept cons for pro benefits

- **Singleton Model Instance**: Tại sao không load model mỗi request?
  - Pro: Huge latency reduction, 30-100ms vs 60s+ per request
  - Pro: Low memory overhead (model loaded once)
  - Con: Can't swap models without restart
  - Decision: Accept con for massive latency win

- **Auto-detect Device**: Tại sao không force GPU hoặc CPU?
  - Pro: Works in any environment (dev laptop CPU, prod server GPU)
  - Pro: Transparent fallback if GPU unavailable
  - Con: Different performance on different hardware
  - Decision: Accept con for flexibility

---

## 5. Error Handling & Failure Modes

### 5.1 Expected Failures & Recovery

| Failure Scenario | Root Cause | Detection | Recovery | SLA Impact |
|-----------------|-----------|-----------|----------|-----------|
| Model download timeout | Slow internet | Timeout exception after 30s | Retry with exponential backoff | Startup delay 1-5 min |
| Disk full | Insufficient space for model | OSError (ENOSPC) | Fail with error, suggest cleanup | Startup fails |
| CUDA not available | GPU not detected | torch.cuda.is_available() = False | Fallback to CPU (log warning) | None (CPU slower but works) |
| Model corrupted | Downloaded file corrupted | Hash mismatch, load failure | Delete cache, re-download | Startup delay 1-2 min |
| Model already cached | Re-run warmup | Model exists in cache | Skip download, load from disk (5s) | None (fast) |

### 5.2 Unexpected Failures (Unknown Unknowns)

- **What to do**: Check logs for stack trace, verify env vars, check disk space, verify model cache dir writable
- **Who to contact**: AG-00 OrchestratorAgent or project owner
- **Where to log**: .knowledge/agent01/Skill_01.md if novel, Log_01.md if significant event

---

## 6. Performance & Monitoring

### 6.1 Key Metrics

| Metric Name | Type | Unit | Target | Alert Threshold |
|------------|------|------|--------|-----------------|
| warmup_duration_ms | Gauge | ms | < 5000 | > 30000 (30s) |
| model_load_time_ms | Gauge | ms | < 1000 (cached) | > 5000 |
| device_type | Label | categorical | cpu or cuda | N/A |
| warmup_status | Gauge | boolean | 1 (success) | 0 (failure) |

### 6.2 Observability

- **Logging**: WarmupService logs at startup: "Warmup completed in Xms on device Y"
- **Metrics**: Prometheus gauge: warmup_duration_ms
- **Tracing**: Log correlation ID from app startup

---

## 7. Related Workflows & Integration Points

- **Image Embedding Workflow (T002-02, T002-03)**: Depends on Warmup to provide loaded model
- **Text Embedding Workflow (T002-04)**: Depends on Warmup to provide loaded model
- **Batch Embedding Workflow (T002-05)**: Depends on Warmup to provide loaded model
- **AI Container (T002-06)**: Warmup triggered at container startup

---

## 8. References & Further Reading

- PyTorch Documentation: https://pytorch.org/docs/stable/
- OpenCLIP Repository: https://github.com/mlfoundations/open_clip
- CLIP Paper: https://arxiv.org/abs/2103.14030
- Tasks.yaml - T002-01 definition: .context/Tasks.yaml
