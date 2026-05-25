# AI Container Workflow - References

**Mục đích**: Tài liệu này cung cấp danh sách chi tiết các tệp, thư mục, cấu trúc dự án, build scripts, và tài liệu tham khảo của ai_container workflow. Sử dụng tài liệu này để định vị nhanh các thành phần, hiểu cây thư mục, tìm kiếm các file cụ thể, và theo dõi CI/CD integration.

**Mục tiêu sử dụng**: Tra cứu cấu trúc, duyệt mã nguồn, tìm build scripts, tìm test files, tìm CI/CD configs.

**Thời gian tra cứu**: 5-10 phút

---

## 1. Directory Structure (Cấu trúc thư mục)

### 1.1 AI Container Workflow Component Tree

```
E:\SISE\ (Repository Root)
├── modules/AIModule/ (AI Module Owner)
│   ├── ai_container_Dockerfile ← MAIN BUILD FILE
│   │   └─ Multi-stage build: builder (compile wheels) → runtime (production image)
│   │   └─ Base: python:3.13-slim
│   │   └─ Output: docker image ai-service:1.0.0
│   │
│   ├── ai_requirements.txt ← DEPENDENCIES INPUT
│   │   └─ Direct dependencies: torch, open_clip, fastapi, uvicorn, pillow, pydantic, pytest
│   │   └─ Builder stage: compiles wheels (includes transitive deps)
│   │   └─ Runtime stage: installs from wheels (offline)
│   │
│   ├── scripts/ (AI Container Scripts)
│   │   ├── entrypoint.sh ← CONTAINER ENTRY POINT
│   │   │   └─ Copied to container: /app/ai-service/entrypoint.sh
│   │   │   └─ Validates env vars (AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR)
│   │   │   └─ Creates model cache directory
│   │   │   └─ Starts uvicorn: python -m uvicorn ai_main:create_app
│   │   │   └─ Owner: AIModule
│   │   │
│   │   ├── build.ps1 ← WINDOWS BUILD HELPER
│   │   │   └─ PowerShell script for Windows developers
│   │   │   └─ Actions: validate, build, test, run
│   │   │   └─ Usage: powershell .\modules/AIModule/scripts/build.ps1 -Action build
│   │   │   └─ Owner: AIModule
│   │   │
│   │   ├── health-check.sh ← HEALTH PROBE SCRIPT
│   │   │   └─ Tests /health/liveness and /health/readiness
│   │   │   └─ Retry logic with exponential backoff
│   │   │   └─ Usage: bash ./modules/AIModule/scripts/health-check.sh
│   │   │   └─ Owner: AIModule
│   │   │
│   │   ├── test-endpoints.bat ← WINDOWS SMOKE TEST
│   │   │   └─ Windows batch script for endpoint testing
│   │   │   └─ Tests: liveness, readiness, text embedding
│   │   │   └─ Owner: AIModule
│   │   │
│   │   └── container.sh ← CONTAINER MANAGEMENT
│   │       └─ Start/stop/restart/remove container
│   │       └─ View status and logs
│   │       └─ Owner: AIModule
│   │
│   ├── .dockerignore ← DOCKER BUILD CONTEXT FILTER
│   │   └─ Excludes: __pycache__/, *.pyc, .pytest_cache/, .env.local, docs/, tests/, .github/
│   │   └─ Prevents cache, local env, docs, tests from entering image context
│   │   └─ Owner: AIModule
│   │
│   ├── app/ (5-Layer App Structure)
│   │   ├── entities/
│   │   │   ├── warmup_entities.py
│   │   │   ├── image_embedding_entities.py
│   │   │   ├── text_embedding_entities.py
│   │   │   ├── batch_embedding_entities.py
│   │   │   └── __init__.py (exports all entities)
│   │   │
│   │   ├── adapters/
│   │   │   ├── warmup_adapters.py
│   │   │   ├── image_embedding_adapters.py
│   │   │   ├── text_embedding_adapters.py
│   │   │   ├── batch_embedding_adapters.py
│   │   │   └── __init__.py (exports all adapters)
│   │   │
│   │   ├── services/
│   │   │   ├── warmup_services.py
│   │   │   ├── image_embedding_services.py
│   │   │   ├── text_embedding_services.py
│   │   │   ├── batch_embedding_services.py
│   │   │   └── __init__.py (exports all services)
│   │   │
│   │   ├── routers/
│   │   │   ├── warmup_routers.py
│   │   │   ├── image_embedding_routers.py
│   │   │   ├── text_embedding_routers.py
│   │   │   ├── batch_embedding_routers.py
│   │   │   └── __init__.py (exports all routers)
│   │   │
│   │   └── __init__.py (package-level exports: entities, adapters, services, routers)
│   │
│   ├── ai_main.py ← FASTAPI APPLICATION BOOTSTRAP
│   │   └─ _load_env_file(): Load ai.env.local privately
│   │   └─ _build_*_config(): Build config objects from env vars
│   │   └─ create_app(): Instantiate FastAPI app with lifespan handler
│   │   └─ Lifespan startup: Execute warmup_service.execute_warmup()
│   │   └─ Include routers: warmup, image_embedding, text_embedding, batch_embedding
│   │   └─ Owner: AIModule
│   │
│   ├── configs/ (Configuration Files)
│   │   ├── ai.env.example ← TEMPLATE ENV VARS
│   │   │   └─ Template file (committed to repo)
│   │   │   └─ Shows all available env vars (keys only, no values)
│   │   │   └─ Used as reference for developers
│   │   │   └─ Owner: AIModule
│   │   │
│   │   └── ai.env.local ← LOCAL ENV VALUES
│   │       └─ Local development values (NOT committed to repo)
│   │       └─ In .gitignore to prevent accidental secret exposure
│   │       └─ Injected at container runtime
│   │       └─ Owner: AIModule (local development)
│   │
│   ├── tests/ (Test Suite)
│   │   ├── test_warmup_workflow.py
│   │   ├── test_image_embedding_workflow.py
│   │   ├── test_text_embedding_workflow.py
│   │   ├── test_batch_embedding_workflow.py
│   │   ├── adapters/
│   │   │   ├── test_warmup_adapters.py
│   │   │   ├── test_image_embedding_adapters.py
│   │   │   ├── test_text_embedding_adapters.py
│   │   │   ├── test_batch_embedding_adapters.py
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── test_warmup_services.py
│   │   │   ├── test_image_embedding_services.py
│   │   │   ├── test_text_embedding_services.py
│   │   │   ├── test_batch_embedding_services.py
│   │   │   └── __init__.py
│   │   ├── fixtures/
│   │   │   ├── warmup_fixtures.py (mock CLIP models)
│   │   │   ├── image_fixtures.py (mock images)
│   │   │   ├── text_fixtures.py (mock text)
│   │   │   ├── batch_fixtures.py (mock batches)
│   │   │   └── __init__.py
│   │   ├── conftest.py
│   │   └── __init__.py
│   │
│   └── documents/ (Documentation)
│       ├── warmup_workflow/
│       │   ├── WARMUP_QUICK_GUIDE.md
│       │   ├── WARMUP_DEEP_GUIDE.md
│       │   └── WARMUP_REFERENCES.md
│       ├── image_embedding_workflow/
│       │   ├── IMAGE_EMBEDDING_QUICK_GUIDE.md
│       │   ├── IMAGE_EMBEDDING_DEEP_GUIDE.md
│       │   └── IMAGE_EMBEDDING_REFERENCES.md
│       ├── text_embedding_workflow/
│       │   ├── TEXT_EMBEDDING_QUICK_GUIDE.md
│       │   ├── TEXT_EMBEDDING_DEEP_GUIDE.md
│       │   └── TEXT_EMBEDDING_REFERENCES.md
│       └── ai_container_workflow/ ← YOU ARE HERE
│           ├── AI_CONTAINER_QUICK_GUIDE.md (quick overview)
│           ├── AI_CONTAINER_DEEP_GUIDE.md (detailed technical)
│           └── AI_CONTAINER_REFERENCES.md (this file)
│
├── .github/ (CI/CD & Workflows)
│   └── workflows/
│       └── ai-container-build.yml ← CI/CD PIPELINE (if exists)
│           └─ Triggers on: push to master, PR to master
│           └─ Jobs:
│           │  ├─ validate: Check Dockerfile, scripts, requirements
│           │  ├─ build: Build Docker image, tag, push to registry
│           │  └─ smoke-test: Start container, verify health checks
│           └─ Secrets: DOCKER_REGISTRY_TOKEN (for registry push)
│
├── .context/ (Contract Files, Read-Only for AIModule)
│   ├── Tasks.yaml ← TASK DEFINITIONS
│   │   └─ T002-06: ai_container workflow definition
│   │   └─ Status: In Progress / Completed
│   │   └─ Owner: Project
│   │
│   ├── data_schema.yaml ← DATA CONTRACT
│   │   └─ global_configs.vector_dim: 512 (AI Module must match)
│   │   └─ input_schema.image_max_size_mb: 20
│   │   └─ input_schema.text_max_tokens: 77
│   │   └─ Owner: Project (read-only for AIModule)
│   │
│   ├── DOS.md ← DEPLOYMENT OPERATIONS & SLOs
│   │   └─ Specifies: warmup < 30s, embedding latency < 500ms (CPU)
│   │   └─ Specifies: container restart strategy, health check intervals
│   │   └─ Owner: Project (read-only for AIModule)
│   │
│   └── agent_boundaries.yaml ← ACCESS CONTROL
│       └─ AIModule working_dir: modules/AIModule/
│       └─ AIModule read-only: .context/, .knowledge/shared/
│       └─ AIModule read-write: .knowledge/agent01/
│
├── .knowledge/ (Shared & Module-Specific Knowledge)
│   ├── shared/
│   │   └── template/
│   │       ├── WORKFLOW_QUICK_GUIDE_TEMPLATE.md
│   │       ├── WORKFLOW_DEEP_GUIDE_TEMPLATE.md
│   │       └── WORKFLOW_REFERENCES_TEMPLATE.md
│   └── agent01/
│       ├── KnowledgeBase_01.md (trusted references discovered)
│       ├── Skill_01.md (unexpected issues + solutions)
│       ├── Log_01.md (significant events)
│       └── __init__.py
│
└── docker-compose.yml (or infra_compose_*.yml) ← ORCHESTRATION
	└─ If exists, defines ai-service container with env vars, volumes, health checks
	└─ Owner: Infrastructure / DevOps
```

---

## 2. File Inventory (Danh sách chi tiết các tệp)

### 2.1 Build & Container Files

| File Path | File Name | Type | Owner | Purpose | Version | Last Updated | Dependencies |
|-----------|-----------|------|-------|---------|---------|-------------|--------------|
| `ai_container_Dockerfile` | ai_container_Dockerfile | Docker | AIModule | Multi-stage build definition | 1.0.0 | 2026-01-15 | ai_requirements.txt, app/, scripts/entrypoint.sh, .dockerignore |
| `ai_requirements.txt` | ai_requirements.txt | Req File | AIModule | Python dependencies for builder wheel compilation | 1.0.0 | 2026-01-15 | PyPI packages (torch, fastapi, uvicorn, etc.) |
| `.dockerignore` | .dockerignore | Config | AIModule | Docker build context filters | 1.0.0 | 2026-01-15 | N/A |

### 2.2 Container Lifecycle Scripts

| File Path | File Name | Type | Owner | Purpose | Version | Executable | Last Updated |
|-----------|-----------|------|-------|---------|---------|-----------|-------------|
| `scripts/entrypoint.sh` | entrypoint.sh | Bash | AIModule | Container entry point (env validation, startup) | 1.0.0 | Yes (chmod +x) | 2026-01-15 |
| `scripts/build.ps1` | build.ps1 | PowerShell | AIModule | Windows build helper (validate, build, test, run) | 1.0.0 | N/A (PS script) | 2026-01-15 |
| `scripts/health-check.sh` | health-check.sh | Bash | AIModule | Health probe script (liveness, readiness) | 1.0.0 | Yes (chmod +x) | 2026-01-15 |
| `scripts/test-endpoints.bat` | test-endpoints.bat | Batch | AIModule | Windows endpoint smoke test | 1.0.0 | N/A (Batch) | 2026-01-15 |
| `scripts/container.sh` | container.sh | Bash | AIModule | Container management (start, stop, logs) | 1.0.0 | Yes (chmod +x) | 2026-01-15 |

### 2.3 Configuration Files

| File Path | File Name | Type | Owner | Purpose | Version | Committed | Last Updated |
|-----------|-----------|------|-------|---------|---------|-----------|-------------|
| `configs/ai.env.example` | ai.env.example | Env Template | AIModule | Template env vars (keys only) | 1.0.0 | ✓ Yes | 2026-01-15 |
| `configs/ai.env.local` | ai.env.local | Env File | AIModule | Local dev values (NOT committed) | N/A | ✗ No (.gitignore) | N/A |

### 2.4 Application Files (5-Layer Structure)

#### Entities Layer

| File Path | Class/Module | Purpose | Size | Owner | Last Updated |
|-----------|-------------|---------|------|-------|-------------|
| `app/entities/warmup_entities.py` | WarmupConfig, WarmupResult | Warmup workflow data models | ~100 lines | AIModule | 2026-01-15 |
| `app/entities/image_embedding_entities.py` | ImageEmbeddingRequest, ImageEmbeddingResponse | Image embedding data models | ~50 lines | AIModule | 2026-01-15 |
| `app/entities/text_embedding_entities.py` | TextEmbeddingRequest, TextEmbeddingResponse | Text embedding data models | ~50 lines | AIModule | 2026-01-15 |
| `app/entities/batch_embedding_entities.py` | BatchEmbeddingRequest, BatchEmbeddingResponse | Batch embedding data models | ~100 lines | AIModule | 2026-01-15 |
| `app/entities/__init__.py` | (exports) | Package exports | ~20 lines | AIModule | 2026-01-15 |

#### Adapters Layer

| File Path | Class/Module | Purpose | Size | Owner | Last Updated |
|-----------|-------------|---------|------|-------|-------------|
| `app/adapters/warmup_adapters.py` | DeviceManager, CLIPModelLoader, WarmupExecutor | Warmup workflow adapters | ~300 lines | AIModule | 2026-01-15 |
| `app/adapters/image_embedding_adapters.py` | ImagePreprocessor, CLIPImageEncoder, VectorNormalizer | Image preprocessing & encoding | ~200 lines | AIModule | 2026-01-15 |
| `app/adapters/text_embedding_adapters.py` | TextPreprocessor, CLIPTextEncoder, VectorNormalizer | Text preprocessing & encoding | ~150 lines | AIModule | 2026-01-15 |
| `app/adapters/batch_embedding_adapters.py` | BatchProcessor, ParallelEmbedder | Batch processing | ~250 lines | AIModule | 2026-01-15 |
| `app/adapters/__init__.py` | (exports) | Package exports | ~20 lines | AIModule | 2026-01-15 |

#### Services Layer

| File Path | Class/Module | Purpose | Size | Owner | Last Updated |
|-----------|-------------|---------|------|-------|-------------|
| `app/services/warmup_services.py` | WarmupService | Warmup orchestration | ~150 lines | AIModule | 2026-01-15 |
| `app/services/image_embedding_services.py` | ImageEmbeddingService | Image embedding orchestration | ~100 lines | AIModule | 2026-01-15 |
| `app/services/text_embedding_services.py` | TextEmbeddingService | Text embedding orchestration | ~100 lines | AIModule | 2026-01-15 |
| `app/services/batch_embedding_services.py` | BatchEmbeddingService | Batch embedding orchestration | ~150 lines | AIModule | 2026-01-15 |
| `app/services/__init__.py` | (exports) | Package exports | ~20 lines | AIModule | 2026-01-15 |

#### Routers Layer

| File Path | Class/Module | Purpose | Size | Owner | Last Updated |
|-----------|-------------|---------|------|-------|-------------|
| `app/routers/warmup_routers.py` | WarmupRouter, get_warmup_startup_handler | Warmup FastAPI endpoints & lifespan | ~100 lines | AIModule | 2026-01-15 |
| `app/routers/image_embedding_routers.py` | ImageEmbeddingRouter | /inference/embed/image endpoint | ~80 lines | AIModule | 2026-01-15 |
| `app/routers/text_embedding_routers.py` | TextEmbeddingRouter | /inference/embed/text endpoint | ~80 lines | AIModule | 2026-01-15 |
| `app/routers/batch_embedding_routers.py` | BatchEmbeddingRouter | /inference/embed/batch endpoint | ~100 lines | AIModule | 2026-01-15 |
| `app/routers/__init__.py` | (exports) | Package exports | ~20 lines | AIModule | 2026-01-15 |

#### Bootstrap

| File Path | Class/Module | Purpose | Size | Owner | Last Updated |
|-----------|-------------|---------|------|-------|-------------|
| `app/__init__.py` | (exports) | App package hub (exports all layers) | ~50 lines | AIModule | 2026-01-15 |
| `ai_main.py` | create_app, _load_env_file, _build_*_config | FastAPI app bootstrap & config | ~400 lines | AIModule | 2026-01-15 |

---

## 3. Build Process & CI/CD Integration

### 3.1 Docker Build Command

```bash
# From repository root (E:\SISE\)
docker build \
  --file modules/AIModule/ai_container_Dockerfile \
  --tag ai-service:1.0.0 \
  --tag ai-service:latest \
  --label org.opencontainers.image.version=1.0.0 \
  --label org.opencontainers.image.source=https://github.com/Super-Muscle-Coder/SISE \
  .

# Expected output:
# [1/2] FROM python:3.13-slim                           # Pull base image
# [2/2] COPY modules/AIModule/app ./app                 # Copy app files
# Successfully tagged ai-service:1.0.0
# Successfully tagged ai-service:latest
```

### 3.2 Windows Build Script (build.ps1)

**Location**: `modules/AIModule/scripts/build.ps1`

**Usage**:
```powershell
# Validate Dockerfile
powershell .\modules/AIModule/scripts/build.ps1 -Action validate

# Build image
powershell .\modules/AIModule/scripts/build.ps1 -Action build

# Run container
powershell .\modules/AIModule/scripts/build.ps1 -Action run

# Test health checks
powershell .\modules/AIModule/scripts/build.ps1 -Action test
```

### 3.3 CI/CD Pipeline (if configured)

**Pipeline File**: `.github/workflows/ai-container-build.yml` (if exists)

**Typical Pipeline Stages**:
1. **Validate**: Check Dockerfile syntax, verify scripts exist
2. **Build**: `docker build` from repository root, tag with commit hash
3. **Push**: Push to Docker registry (requires DOCKER_REGISTRY_TOKEN secret)
4. **Smoke Test**: Start container, verify `/health/liveness` returns 200

---

## 4. Dependency Graph

### 4.1 Build-Time Dependencies

```
ai_container_Dockerfile
├─ Input: ai_requirements.txt
│  └─ torch>=2.1.0
│  └─ open_clip_torch>=2.20.0
│  └─ fastapi>=0.110.0
│  │  └─ starlette>=0.46.0 (transitive)
│  │  └─ pydantic>=2.0.0 (transitive)
│  └─ uvicorn>=0.27.0
│  │  └─ click (transitive)
│  │  └─ h11 (transitive)
│  └─ pillow>=10.0.0
│  └─ pydantic>=2.0.0
│  └─ pytest>=7.4.0
│
├─ Builder stage outputs: /build/wheels/
│  └─ torch-2.3.0-cp313-cp313-manylinux2014_x86_64.whl (2.5 GB)
│  └─ numpy-1.26.0-cp313-cp313-manylinux2014_x86_64.whl
│  └─ starlette-0.46.0-py3-none-any.whl
│  └─ fastapi-0.111.0-py3-none-any.whl
│  └─ [47 more .whl files]
│
└─ Runtime stage inputs:
   ├─ /build/wheels/ (from builder)
   ├─ app/ (5-layer structure)
   ├─ ai_main.py
   ├─ scripts/entrypoint.sh
   ├─ configs/
   └─ .dockerignore
```

### 4.2 Runtime Dependencies

```
Docker Container (ai-service:1.0.0)
├─ Base image: python:3.13-slim (Debian 12)
├─ System libraries:
│  ├─ libgomp1 (OpenMP for PyTorch parallelization)
│  ├─ libopenblas0 (Linear algebra backend)
│  └─ ca-certificates (for HTTPS to HuggingFace)
├─ Python environment:
│  ├─ Python 3.13.x
│  └─ Site-packages (installed from /build/wheels/):
│     ├─ torch
│     ├─ numpy
│     ├─ fastapi
│     ├─ uvicorn
│     ├─ open_clip_torch
│     ├─ pillow
│     ├─ pydantic
│     └─ [pytest, and other packages for dev]
├─ Application code:
│  ├─ /app/ai-service/app/ (5-layer structure)
│  ├─ /app/ai-service/ai_main.py
│  ├─ /app/ai-service/configs/
│  └─ /app/ai-service/entrypoint.sh
├─ Runtime env vars (injected at container start):
│  ├─ AI_SERVICE_PORT=8001
│  ├─ CLIP_MODEL_NAME=ViT-B/32
│  ├─ DEVICE=cpu (or cuda)
│  ├─ MODEL_CACHE_DIR=/app/ai-service/model_cache
│  ├─ PYTHONUNBUFFERED=1
│  └─ LOG_LEVEL=INFO
├─ Model cache volume (mounted):
│  └─ /app/ai-service/model_cache (persists CLIP model weights)
└─ Health check:
   └─ /health/liveness endpoint on port 8001
```

---

## 5. Key Components & Module Mapping

### 5.1 Dockerfile Stages Mapping

| Stage | Base Image | Purpose | Build Time | Output | Size |
|-------|-----------|---------|-----------|--------|------|
| **Builder** | python:3.13-slim | Compile wheels from requirements | 10-15 min | /build/wheels/ | ~4 GB (discarded) |
| **Runtime** | python:3.13-slim | Production image | 2-3 min (install), 5 min (first model download) | ai-service:1.0.0 | ~3-4 GB (shipped) |

### 5.2 Application Layer Exports

**Module**: `modules/AIModule/app/__init__.py`

**Exports**:
```python
from app.entities import (
	WarmupConfig, WarmupResult,
	ImageEmbeddingRequest, ImageEmbeddingResponse,
	TextEmbeddingRequest, TextEmbeddingResponse,
	BatchEmbeddingRequest, BatchEmbeddingResponse,
)

from app.adapters import (
	DeviceManager, CLIPModelLoader, WarmupExecutor,
	ImagePreprocessor, CLIPImageEncoder,
	TextPreprocessor, CLIPTextEncoder,
	VectorNormalizer,
	BatchProcessor, ParallelEmbedder,
)

from app.services import (
	WarmupService,
	ImageEmbeddingService,
	TextEmbeddingService,
	BatchEmbeddingService,
)

from app.routers import (
	get_warmup_startup_handler, WarmupRouter,
	ImageEmbeddingRouter,
	TextEmbeddingRouter,
	BatchEmbeddingRouter,
)

__all__ = [
	# Entities
	"WarmupConfig", "WarmupResult",
	"ImageEmbeddingRequest", "ImageEmbeddingResponse",
	"TextEmbeddingRequest", "TextEmbeddingResponse",
	"BatchEmbeddingRequest", "BatchEmbeddingResponse",
	# Adapters
	"DeviceManager", "CLIPModelLoader", "WarmupExecutor",
	"ImagePreprocessor", "CLIPImageEncoder",
	"TextPreprocessor", "CLIPTextEncoder",
	"VectorNormalizer",
	"BatchProcessor", "ParallelEmbedder",
	# Services
	"WarmupService",
	"ImageEmbeddingService",
	"TextEmbeddingService",
	"BatchEmbeddingService",
	# Routers
	"get_warmup_startup_handler", "WarmupRouter",
	"ImageEmbeddingRouter",
	"TextEmbeddingRouter",
	"BatchEmbeddingRouter",
]
```

### 5.3 ai_main.py Integration Points

| Function | Purpose | Imports | Outputs |
|----------|---------|---------|---------|
| `_load_env_file()` | Load ai.env.local privately | ai.env.local | dict of env key-value pairs |
| `_build_warmup_config()` | Create WarmupConfig from env | WarmupConfig entity | WarmupConfig instance |
| `_build_image_embedding_config()` | Create ImageConfig from env | image_embedding entities | Config instance |
| `_build_text_embedding_config()` | Create TextConfig from env | text_embedding entities | Config instance |
| `_build_batch_embedding_config()` | Create BatchConfig from env | batch_embedding entities | Config instance |
| `create_app()` | FastAPI app bootstrap | all configs, services, routers | FastAPI app instance |
| **Lifespan startup** | Execute warmup at startup | WarmupService | Warmup result + model reference |
| **Include routers** | Register endpoints | WarmupRouter, ImageRouter, TextRouter, BatchRouter | FastAPI app with routes |

---

## 6. Contract & Configuration References

### 6.1 Input Contracts (from .context/)

| Contract | Key | Value | Purpose | Validation |
|----------|-----|-------|---------|-----------|
| `data_schema.yaml` | `global_configs.vector_dim` | 512 | Output vector dimension | ai_main.py must match |
| `data_schema.yaml` | `input_schema.image_max_size_mb` | 20 | Max image size | image_embedding validation |
| `data_schema.yaml` | `input_schema.text_max_tokens` | 77 | Max text tokens | text_embedding validation |
| `DOS.md` | `warmup.target_latency_ms` | 30000 | Warmup SLO (CPU) | entrypoint.sh logs |
| `DOS.md` | `health_check.interval_ms` | 30000 | Probe interval | Dockerfile HEALTHCHECK |
| `agent_boundaries.yaml` | `enforced_python_version` | 3.13 | Python version | Dockerfile FROM python:3.13-slim |

### 6.2 Configuration Template (ai.env.example)

**Location**: `configs/ai.env.example`

**Content**:
```bash
# AI Service Configuration Template
# Usage: Copy to ai.env.local and fill in values
# NOTE: Never commit ai.env.local; add to .gitignore

# Core Service Config
AI_SERVICE_PORT=8001
LOG_LEVEL=INFO

# CLIP Model Configuration
CLIP_MODEL_NAME=ViT-B/32
# Options: ViT-B/32, ViT-L/14
# Default: ViT-B/32 (smaller, faster, 512-dim vector)

# Device Configuration
DEVICE=cpu
# Options: cuda (NVIDIA GPU), cpu (CPU-only)
# Leave empty for auto-detection

# Model Cache Directory
MODEL_CACHE_DIR=/app/ai-service/model_cache
# Must be writable; can be volume mount in docker-compose

# Additional Options (optional)
WARMUP_TIMEOUT_MS=30000
# Timeout for warmup execution (ms)
# Default: 30000 (30 seconds on CPU)

BATCH_MAX_SIZE=32
# Maximum batch size for batch embedding
# Default: 32

ENABLE_METRICS=true
# Enable Prometheus metrics export
# Default: true
```

---

## 7. Testing & Validation

### 7.1 Unit Tests

| Test File | Purpose | Workflow | Owner | Status |
|-----------|---------|----------|-------|--------|
| `tests/adapters/test_warmup_adapters.py` | Test DeviceManager, CLIPModelLoader, WarmupExecutor | Warmup | AIModule | ✓ Completed |
| `tests/services/test_warmup_services.py` | Test WarmupService orchestration | Warmup | AIModule | ✓ Completed |
| `tests/adapters/test_image_embedding_adapters.py` | Test image preprocessing, encoding | Image Embedding | AIModule | ✓ Completed |
| `tests/services/test_image_embedding_services.py` | Test image service | Image Embedding | AIModule | ✓ Completed |
| `tests/adapters/test_text_embedding_adapters.py` | Test text preprocessing, encoding | Text Embedding | AIModule | ✓ Completed |
| `tests/services/test_text_embedding_services.py` | Test text service | Text Embedding | AIModule | ✓ Completed |
| `tests/adapters/test_batch_embedding_adapters.py` | Test batch processing | Batch Embedding | AIModule | ✓ Completed |
| `tests/services/test_batch_embedding_services.py` | Test batch service | Batch Embedding | AIModule | ✓ Completed |

### 7.2 Integration Tests

| Test File | Purpose | Scope | Command | Expected Result |
|-----------|---------|-------|---------|-----------------|
| `tests/test_warmup_workflow.py` | End-to-end warmup | Full warmup flow | `pytest tests/test_warmup_workflow.py` | ✓ Pass (warmup completes) |
| `tests/test_image_embedding_workflow.py` | End-to-end image embedding | Full flow | `pytest tests/test_image_embedding_workflow.py` | ✓ Pass (512-dim vector) |
| `tests/test_text_embedding_workflow.py` | End-to-end text embedding | Full flow | `pytest tests/test_text_embedding_workflow.py` | ✓ Pass (512-dim vector) |
| `tests/test_batch_embedding_workflow.py` | End-to-end batch embedding | Full flow | `pytest tests/test_batch_embedding_workflow.py` | ✓ Pass (batch output) |

### 7.3 Container Validation

**Pre-Build Validation**:
```bash
# Syntax check
docker build --dry-run -f modules/AIModule/ai_container_Dockerfile .

# Lint Dockerfile
docker run --rm -i hadolint/hadolint < modules/AIModule/ai_container_Dockerfile
```

**Post-Build Validation**:
```bash
# Image inspection
docker inspect ai-service:1.0.0

# Image layers
docker history ai-service:1.0.0

# Security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image ai-service:1.0.0
```

**Runtime Validation**:
```bash
# Start container
docker run -d --name ai-test -p 8001:8001 \
  -e AI_SERVICE_PORT=8001 \
  -e CLIP_MODEL_NAME=ViT-B/32 \
  -e DEVICE=cpu \
  -e MODEL_CACHE_DIR=/app/ai-service/model_cache \
  ai-service:1.0.0

# Health checks
./modules/AIModule/scripts/health-check.sh

# Endpoint tests
./modules/AIModule/scripts/test-endpoints.bat

# Cleanup
docker stop ai-test
docker rm ai-test
```

---

## 8. Troubleshooting Guide

### 8.1 Build Issues

| Issue | Root Cause | Solution | References |
|-------|-----------|----------|-----------|
| `pip wheel` fails with dependency error | `--no-deps` flag in builder | Remove `--no-deps` | AI_CONTAINER_DEEP_GUIDE.md § 1.3.1 |
| `pip install --no-index` fails | Missing transitive deps in /build/wheels/ | Rebuild wheels without `--no-deps` | AI_CONTAINER_DEEP_GUIDE.md § 1.3.1 |
| Out of disk space | Builder stage + large wheels | Run `docker system prune -a` | AI_CONTAINER_DEEP_GUIDE.md § 5.1 |
| FROM casing warning | Lowercase `as` in FROM | Use uppercase `AS` | AI_CONTAINER_DEEP_GUIDE.md § 5.2 |

### 8.2 Runtime Issues

| Issue | Root Cause | Solution | References |
|-------|-----------|----------|-----------|
| Container exits immediately | Missing env var | Check entrypoint.sh validation | entrypoint.sh |
| Health check fails | Warmup not complete | Increase `--start-period` in HEALTHCHECK | AI_CONTAINER_DEEP_GUIDE.md § 5.2 |
| Model download fails | Network issue | Pre-download model, volume-mount | AI_CONTAINER_DEEP_GUIDE.md § 5.2 |
| `/health/liveness` returns 500 | Internal error in ai_main.py | Check `docker logs` | health-check.sh |

---

## 9. Ownership & Maintenance

| Component | Owner | Contact | Responsibility | Update Frequency |
|-----------|-------|---------|-----------------|-----------------|
| ai_container_Dockerfile | AIModule | @AIModuleOwner | Multi-stage build, base image, security | As needed |
| ai_requirements.txt | AIModule | @AIModuleOwner | Dependencies, versions, transitive deps | Per dependency update |
| scripts/entrypoint.sh | AIModule | @AIModuleOwner | Container startup, env validation | As needed |
| scripts/build.ps1 | AIModule | @AIModuleOwner | Windows build helper | As needed |
| health-check.sh | AIModule | @AIModuleOwner | Health probes | As needed |
| .dockerignore | AIModule | @AIModuleOwner | Build context filtering | As needed |
| app/ (5-layer) | AIModule | @AIModuleOwner | All workflows | Per workflow update |
| ai_main.py | AIModule | @AIModuleOwner | FastAPI bootstrap, config loading | Per workflow update |
| configs/ | AIModule | @AIModuleOwner | Environment variables | As needed |
| tests/ | AIModule | @AIModuleOwner | Unit & integration tests | Per workflow update |
| documents/ | AIModule | @AIModuleOwner | Workflow documentation | Per document update |

---

## 10. Quick Reference Links

### Documentation
- [AI Container Quick Guide](./AI_CONTAINER_QUICK_GUIDE.md) — High-level overview
- [AI Container Deep Guide](./AI_CONTAINER_DEEP_GUIDE.md) — Technical deep dive
- [Warmup Workflow](../warmup_workflow/WARMUP_QUICK_GUIDE.md) — Pre-build warmup
- [Image Embedding Workflow](../image_embedding_workflow/IMAGE_EMBEDDING_QUICK_GUIDE.md) — Image processing
- [Text Embedding Workflow](../text_embedding_workflow/TEXT_EMBEDDING_QUICK_GUIDE.md) — Text processing
- [Batch Embedding Workflow](../batch_embedding_workflow/BATCH_EMBEDDING_QUICK_GUIDE.md) — Batch processing (if exists)

### External References
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Python 3.13 Documentation](https://docs.python.org/3.13/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [Open CLIP GitHub](https://github.com/mlfoundations/open_clip)

### Contract Files (Read-Only)
- `.context/Tasks.yaml` — Task definitions
- `.context/data_schema.yaml` — Data contracts
- `.context/DOS.md` — Deployment & SLOs
- `.context/agent_boundaries.yaml` — Access control

---

**Tài liệu liên quan**: 
- [AI Container Quick Guide](./AI_CONTAINER_QUICK_GUIDE.md)
- [AI Container Deep Guide](./AI_CONTAINER_DEEP_GUIDE.md)
