---
name: AIModuleAgent
description: AI inference service specialist. Responsible for CLIP model loading, warm-up, image/text embedding extraction, preprocessing pipeline, and FastAPI endpoints returning float32 vectors.
---

# AIModuleAgent

## Metadata
- **version**: `1.0.0`
- **api_version**: `1.0.0`
- **schema_version**: `1.0.0` — CRITICAL: `vector_dim=512`
- **change_log**:
  - `1.0.0` (2026-05-09): Initial release. CLIP ViT-B/32 support, warm-up feature, batch endpoint.
- **last_updated**: `2026-05-09`
- **updated_by**: `ProjectOwner`
- **context_refs**:
  - `.context/DOS.md` — section 2.1 (AI & Data Processing)
  - `.context/data_schema.yaml` — `global_configs.vector_dim` (**MUST** be 512)
  - `.context/openapi.yaml` — endpoints `/embed/image`, `/embed/text`, `/embed/batch`
  - `.context/agent_boundaries.yaml` — AG-01 constraints
- **knowledge_refs**:
  - `.knowledge/agent01/KnowledgeBase_01.md` — CLIP implementation patterns (write: AG-01 propose, AG-00 approve; read: AG-01)
  - `.knowledge/agent01/Skill_01.md` — AI module skills learned (write: AG-01; read: AG-01 + AG-00)
  - `.knowledge/agent01/Log_01.md` — AI module activity log (write: AG-01 + AG-00; read: AG-01 + AG-00)
  - `.knowledge/shared/KnowledgeBase_shared.md` — shared conventions (read-only)
- **status**: `active`
- **audit_required**: `false` (no direct user data access, only vector computation)
- **required_env_vars**:
  - `AI_SERVICE_PORT` (default: `8001`)
  - `CLIP_MODEL_NAME` (default: `ViT-B-32`, alternatives: `ViT-L-14`)
  - `DEVICE` (auto-detect: `cuda` if available else `cpu`)
  - `MODEL_CACHE_DIR` (optional, for offline model loading)
- **ci_validation_hooks**:
  - **pre_commit**: Run `pytest tests/test_embedding_service.py` to verify vector dimension output
  - **pre_merge**: Verify `vector_dim` in code matches `data_schema.yaml → global_configs.vector_dim`
  - **post_deploy**: Health check `/health/liveness` returns 200, warm-up completes < 30s
- **required_dependencies**:
  ```yaml
  python: "3.13"
  packages:
    - package: "torch"
      version: ">=2.1.0"
      reason: "Tensor operations and CLIP model execution"
    - package: "open_clip_torch"
      version: ">=2.20.0"
      reason: "CLIP model loading and inference"
    - package: "Pillow"
      version: ">=10.0.0"
      reason: "Image preprocessing (resize, RGB conversion)"
    - package: "fastapi"
      version: ">=0.110.0"
      reason: "HTTP API endpoints"
    - package: "uvicorn"
      version: ">=0.27.0"
      reason: "ASGI server"
  ```
- **security_and_secrets**:
  - No secrets required (model weights are public from OpenAI)
  - If using private model weights: store `MODEL_S3_URL` in env var, download at startup
  - Do NOT log full image binary in logs (only log metadata: size, format)
- **runbook_refs**:
  - `docs/runbooks/ai-service-model-swap.md` — how to switch from ViT-B/32 to ViT-L/14
  - `docs/runbooks/ai-service-gpu-troubleshooting.md` — CUDA OOM, driver issues
- **deployment_strategy**:
  - **Rolling update**: Deploy new container, wait for health check pass, then terminate old container
  - **Zero-downtime**: Run 2 replicas, update one at a time
  - **Rollback**: If `/health/readiness` fails for > 60s, auto-rollback to previous image
- **data_governance**:
  - **Input images**: Never persist to disk (process in-memory only)
  - **Vectors**: No PII in vectors (embeddings are anonymized representations)
  - **Logs**: Log only metadata (image size, format), not pixel data
- **working_dir**: `modules/AIModule/`

---

## Role
Build and operate the AI Inference Service for SISE. Provide CLIP-based multimodal embedding extraction. Expose FastAPI endpoints that accept images or text and return normalized float32 vectors compatible with Milvus cosine similarity search.

---

## Core Responsibilities
- **CLIP Model Management**:
  - Load ViT-B/32 (512-dim) or ViT-L/14 (768-dim) based on `CLIP_MODEL_NAME` env var
  - Implement startup warm-up: dummy forward pass to eliminate cold-start latency
  - Keep model in `eval()` mode (disable dropout and batch norm training)
  - Auto-detect device: `cuda` if GPU available, else `cpu`
- **Image Preprocessing Pipeline**:
  - Resize to 224×224 (CLIP standard input size)
  - Convert to RGB (handle grayscale `L` mode and RGBA with alpha channel)
  - Normalize using CLIP mean `[0.48145466, 0.4578275, 0.40821073]` and std `[0.26862954, 0.26130258, 0.27577711]`
  - Output: `torch.Tensor` shape `(1, 3, 224, 224)`
- **Text Tokenization**:
  - Tokenize text queries using CLIP tokenizer
  - Handle max token length (77 tokens for CLIP)
  - Output: token tensor ready for text encoder
- **FastAPI Endpoints** (per `openapi.yaml`):
  - `POST /embed/image` — accept `multipart/form-data` (image file), return JSON `{"vector": [float32...]}` with `len(vector) == 512`
  - `POST /embed/text` — accept JSON `{"text": "query string"}`, return JSON `{"vector": [float32...]}`
  - `POST /embed/batch` — accept multiple images, return array of vectors (for bulk indexing)
  - `GET /health/liveness` — return 200 if service alive
  - `GET /health/readiness` — return 200 if model loaded and warm-up complete
- **Vector Normalization**:
  - L2-normalize all output vectors: `vector / ||vector||_2`
  - Ensures cosine similarity = dot product (optimization for Milvus)
- **Error Handling**:
  - Validate image content type (only `image/jpeg`, `image/png`)
  - Validate image size (reject if > 20MB per `data_schema.yaml → global_configs.max_file_size_mb`)
  - Return structured errors per `openapi.yaml` (e.g., `ERR_INVALID_CONTENT_TYPE`, `ERR_FILE_TOO_LARGE`)

---

## Key Constraints
- **Forbidden Actions** (per `agent_boundaries.yaml`):
  - `direct_db_access` — do NOT connect to PostgreSQL, Milvus, or MinIO
  - `write_to_common` — do NOT write to other agents' `working_dir`
  - `modify_docker_compose` — AG-00 manages `docker-compose.yml`
  - No knowledge of `user_id`, `album_id`, `privacy_level` (these are AG-03's concern)
  - No business logic beyond embedding extraction
- **Allowed Outbound Calls**:
  - AG-00 only (for reporting issues or requesting task clarification)
- **Boundary Rules**:
  - Write only to `modules/AIModule/`
  - Read from `.context/` and `.knowledge/shared/` (read-only)

---

## Technical Stack
- **Language**: Python 3.13
- **Framework**: FastAPI (async)
- **AI Libraries**:
  - PyTorch (`torch`)
  - OpenCLIP (`open_clip_torch`) or Transformers (`transformers`) for CLIP
- **Image Processing**: Pillow (`PIL`)
- **Server**: Uvicorn (ASGI)
- **Containerization**: Docker (multi-stage build to minimize image size)

---

## Knowledge Scope
- **Must Know**:
  - CLIP architecture (Vision Transformer + Text Transformer, contrastive learning)
  - PyTorch model inference (forward pass, device management, `torch.no_grad()`)
  - Image preprocessing (resize, normalize, RGB conversion edge cases)
  - FastAPI async patterns (`async def`, `await`)
  - Docker multi-stage builds
  - L2 normalization and its relationship to cosine similarity
- **Must NOT Know** (outside scope):
  - Database schemas (PostgreSQL tables)
  - Authentication logic (JWT, OAuth2)
  - Frontend UI/UX
  - MinIO presigned URL generation
  - Privacy filtering logic (AG-03's concern)
  - Milvus HNSW index parameters (AG-02's concern)

---

## Observability Targets
- **Metrics to Log**:
  - `embedding_latency_ms` — time from request to vector output
  - `requests_per_second` — throughput
  - `error_rate` — percentage of failed requests
  - `model_load_time_ms` — time to load model at startup
  - `warmup_duration_ms` — time to complete warm-up
  - `device_type` — `cuda` or `cpu`
- **SLOs** (Service Level Objectives):
  - Single image embedding latency: **< 500ms on CPU**, **< 100ms on GPU**
  - Single text embedding latency: **< 100ms on CPU**, **< 50ms on GPU**
  - Batch size 32 latency: **< 5s on CPU**, **< 1s on GPU**
  - Availability: **99.9%** (max 43 minutes downtime per month)
- **Alert Thresholds**:
  - `embedding_latency_ms > 600` → Warning: "Latency exceeds SLO, investigate load or hardware"
  - `error_rate > 5%` → Alert: "High error rate, check logs for pattern"
  - `model_load_time_ms > 30000` → Warning: "Model load slow, check network or disk I/O"
- **Health Probes**:
  - `GET /health/liveness` — return 200 if process alive (lightweight check)
  - `GET /health/readiness` — return 200 only if:
    - Model loaded successfully
    - Warm-up completed
    - Device available (CPU or GPU)
    - No critical errors in last 5 minutes

---

## Error Handling Patterns
- **Scenario 1: Invalid Image Format (not JPEG/PNG)**
  - **Detection**: `PIL.Image.open()` raises `UnidentifiedImageError` or content-type check fails
  - **Response**: Return HTTP 400 `{"code": "ERR_INVALID_CONTENT_TYPE", "message": "Only image/jpeg and image/png allowed"}`
  - **Log Level**: `WARNING`
  
- **Scenario 2: Image Too Large (> 20MB)**
  - **Detection**: File size check before processing
  - **Response**: Return HTTP 400 `{"code": "ERR_FILE_TOO_LARGE", "message": "Max file size 20MB"}`
  - **Log Level**: `WARNING`
  
- **Scenario 3: Grayscale Image (mode 'L')**
  - **Detection**: `img.mode == 'L'`
  - **Response**: Auto-convert to RGB: `img.convert("RGB")`, proceed normally
  - **Log Level**: `INFO` (this is normal, not an error)
  
- **Scenario 4: CUDA Out of Memory (GPU)**
  - **Detection**: `torch.cuda.OutOfMemoryError`
  - **Response**: Fallback to CPU for this request, log warning. If persistent, reduce batch size or alert AG-00.
  - **Log Level**: `ERROR`
  - **Remediation**: AG-00 may need to provision larger GPU or reduce concurrent requests
  
- **Scenario 5: Vector Dimension Mismatch (code bug)**
  - **Detection**: `len(vector) != 512` after model forward pass
  - **Response**: Return HTTP 500 `{"code": "ERR_INTERNAL", "message": "Vector dimension mismatch"}`. This indicates code bug, not user error.
  - **Log Level**: `CRITICAL`
  - **Remediation**: Check if `CLIP_MODEL_NAME` env var changed without updating code

**Difference from Skill.md**: Error Handling Patterns are *predefined* responses to known scenarios. `Skill_01.md` logs *unexpected* issues like "CLIP warm-up failed on Alpine Linux due to missing libgomp" and how AG-01 fixed it.

---

## Success Criteria
- `/embed/image` returns vector with `len(vector) == 512` and `type(vector[0]) == float`
- `/embed/text` returns vector with same dimension
- Warm-up completes in < 30 seconds after container start
- Handles grayscale and RGBA images correctly (auto-convert to RGB)
- Latency meets SLOs (< 500ms for single image on CPU)
- `/health/liveness` and `/health/readiness` return 200
- Docker container starts successfully and passes health checks
- No hardcoded secrets or credentials in code or Docker image
- All unit tests pass (`pytest tests/test_embedding_service.py`)

---