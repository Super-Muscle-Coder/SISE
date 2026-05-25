# AI Container Workflow - Deep Guide

**Mục đích**: Tài liệu này cung cấp chi tiết toàn diện về ai_container workflow cho các developer chuyên sâu, các nhà kiến trúc hệ thống, DevOps engineers, và những người cần hiểu sâu sắc từng khía cạnh của containerization, build optimization, security hardening, và runtime orchestration.

**Mức độ**: Advanced / Specialist-level / DevOps
**Thời gian đọc**: 60-90 phút

---

## 1. Chi tiết: Workflow này là gì? Nó được thiết kế như thế nào?

### 1.1 Định nghĩa đầy đủ

**AI Container Workflow** (T002-06) là:
- **Mục tiêu chính**: Đóng gói AI Service thành Docker image production-ready, tối ưu cho deployment, security, và observability
- **Phạm vi**: Chạy tại CI/CD build stage, trước khi push to registry
- **Vai trò trong hệ thống**: 
  - Packaging layer giữa app development (T002-01 to T002-05) và orchestration (docker-compose, Kubernetes)
  - Ensures consistency: dev machine == staging == production
  - Minimal attack surface: non-root user, minimal dependencies, secrets not baked in
- **Lịch sử thiết kế**: AI Container được tách riêng để (1) Optimize build time via multi-stage (2) Security-by-design (non-root, minimal system libs) (3) Support heterogeneous deployments (GPU/CPU via env var)

### 1.2 Kiến trúc chi tiết (Detailed Architecture)

#### 1.2.1 Multi-Stage Build Rationale

```
Stage 1: Builder
├─ Purpose: Compile and prepare wheels
├─ Base Image: python:3.13-slim
├─ Build Tools: gcc, build-essential, git
├─ Input: ai_requirements.txt
├─ Process:
│  ├─ pip install --upgrade pip setuptools wheel
│  ├─ pip wheel --no-cache-dir --wheel-dir /build/wheels -r ai_requirements.txt
│  │  └─ CRITICAL: NO --no-deps flag
│  │      Reason: transitive dependencies must be included (e.g., fastapi -> starlette)
│  │      Impact: /build/wheels contains 50+ .whl files (torch, numpy, scipy, etc.)
│  └─ Output: /build/wheels/ (3-4 GB uncompressed)
├─ Final Output Size: Discarded (not shipped)
└─ Notes:
   ├─ Build tools (gcc, build-essential) not in final image
   ├─ Wheels cached by Docker (reuse if requirements unchanged)
   └─ Compile happens once per requirement change

Stage 2: Runtime
├─ Purpose: Minimal production image
├─ Base Image: python:3.13-slim
├─ System Libs: Only runtime deps (libgomp1, libopenblas0, ca-certificates)
├─ No build tools (gcc removed)
├─ Input:
│  ├─ /build/wheels/ (from builder)
│  ├─ ai_requirements.txt
│  ├─ modules/AIModule/app/
│  ├─ modules/AIModule/ai_main.py
│  ├─ modules/AIModule/scripts/entrypoint.sh
│  └─ modules/AIModule/configs/
├─ Process:
│  ├─ COPY --from=builder /build/wheels /build/wheels
│  ├─ pip install --no-cache-dir --no-index --find-links=/build/wheels -r ai_requirements.txt
│  │  └─ CRITICAL: --no-index means NO network access (offline install)
│  │      All wheels must be in /build/wheels, including transitive deps
│  │      This is why builder stage CANNOT use --no-deps
│  ├─ COPY app, ai_main.py, entrypoint.sh, configs
│  ├─ chmod +x entrypoint.sh
│  ├─ useradd -m -u 1000 aiservice (non-root user)
│  ├─ chown -R aiservice:aiservice /app/ai-service
│  └─ USER aiservice (switch to non-root)
├─ Environment Variables:
│  ├─ PYTHONUNBUFFERED=1 (no buffering, real-time logs)
│  ├─ PYTHONDONTWRITEBYTECODE=1 (no .pyc files)
│  ├─ PYTHONPATH=/app/ai-service (app can import itself)
│  └─ LOG_LEVEL=INFO (default, can be overridden at runtime)
├─ EXPOSE 8001 (informational, actual port from AI_SERVICE_PORT env var)
├─ Health Check:
│  ├─ Command: curl /health/liveness on localhost:8001
│  ├─ Interval: 30s
│  ├─ Timeout: 10s
│  ├─ Start Period: 60s (grace period before first check)
│  ├─ Retries: 3 (fail after 3 consecutive failures)
│  └─ Total failure time: 60s + (3 * 30s) + tolerance = ~150s
├─ ENTRYPOINT: /app/ai-service/entrypoint.sh (not CMD, enforced)
└─ Final Output Size: ~3-4 GB after torch cached
```

#### 1.2.2 Flow chi tiết (Detailed Build Flow)

```
Developer / CI Pipeline
		|
		v
[Source Code Repo]
├─ modules/AIModule/ai_requirements.txt
├─ modules/AIModule/ai_container_Dockerfile
├─ modules/AIModule/app/ (5-layer app structure)
├─ modules/AIModule/ai_main.py
└─ modules/AIModule/scripts/entrypoint.sh
		|
		v
[Docker Build Invocation]
   docker build -f modules/AIModule/ai_container_Dockerfile \
				-t ai-service:1.0.0 \
				-t ai-service:latest \
				.
		|
		+─────────────────────────────────────────────────────┐
		|                                                     |
		v                                                     |
[Stage 1: Builder Phase]                                      |
├─ FROM python:3.13-slim as builder                          |
├─ WORKDIR /build                                            |
├─ RUN apt-get install build-essential gcc git              |
├─ COPY ai_requirements.txt .                                |
├─ RUN pip wheel --no-cache-dir --wheel-dir /build/wheels \  |
│        -r ai_requirements.txt                              |
│   └─ Outputs: /build/wheels/*.whl (e.g., torch, numpy)    |
│                                                             |
└─────────────────────────────────────────────────────────┐  |
														  |  |
														  v  |
									 [Intermediate Layer: /build/wheels/]
									 ├─ torch-2.3.0-cp313-cp313-manylinux.whl
									 ├─ numpy-1.26.0-cp313-cp313-manylinux.whl
									 ├─ starlette-0.46.0-py3-none-any.whl
									 ├─ fastapi-0.111.0-py3-none-any.whl
									 ├─ uvicorn-0.27.0-py3-none-any.whl
									 ├─ open_clip_torch-2.26.1-py3-none-any.whl
									 ├─ pillow-10.0.0-cp313-cp313-manylinux.whl
									 ├─ pydantic-2.5.0-py3-none-any.whl
									 ├─ pytest-7.4.0-py3-none-any.whl
									 └─ [50+ more transitive deps]
									 |
		+────────────────────────────┘
		|
		v
[Stage 2: Runtime Phase]
├─ FROM python:3.13-slim as runtime
├─ RUN apt-get install libgomp1 libopenblas0 ca-certificates
│   └─ No build tools! Minimal runtime-only deps
├─ RUN useradd -m -u 1000 aiservice
├─ WORKDIR /app/ai-service
├─ COPY --from=builder /build/wheels /build/wheels
├─ COPY --from=builder ai_requirements.txt .
├─ RUN pip install --no-cache-dir --no-index --find-links=/build/wheels \
│        -r ai_requirements.txt
│   └─ CRITICAL: --no-index forces offline mode
│       All wheels must exist in /build/wheels (from builder)
├─ COPY modules/AIModule/app ./app
├─ COPY modules/AIModule/ai_main.py .
├─ COPY modules/AIModule/scripts/entrypoint.sh .
├─ COPY modules/AIModule/configs ./configs
├─ RUN chmod +x entrypoint.sh
├─ ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 ...
├─ EXPOSE 8001
├─ RUN chown -R aiservice:aiservice /app/ai-service
├─ USER aiservice
├─ HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
│   CMD python -c "..." (curl /health/liveness)
└─ ENTRYPOINT ["/app/ai-service/entrypoint.sh"]
		|
		v
[Final Docker Image]
├─ Image Name: ai-service:1.0.0 (or custom tag)
├─ Base OS: Debian 12 (from python:3.13-slim)
├─ Python: 3.13.x
├─ Size: ~3-4 GB (torch dominates)
├─ User: aiservice (UID 1000, non-root)
├─ Ports: 8001 (informational)
├─ Startup Sequence:
│  ├─ ENTRYPOINT /app/ai-service/entrypoint.sh
│  │  ├─ Validate env vars (AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR)
│  │  ├─ Create MODEL_CACHE_DIR if not exists
│  │  ├─ Log startup info (keys only, never values)
│  │  └─ exec python -m uvicorn ai_main:create_app --host 0.0.0.0 --port $AI_SERVICE_PORT
│  │     └─ Passes control to python process (PID 1)
│  │
│  └─ ai_main.py (FastAPI app creation)
│     ├─ _load_env_file(): Load ai.env.local (keys injected at runtime, not build)
│     ├─ _build_warmup_config(): Prepare warmup
│     ├─ create_app(): Build FastAPI app instance
│     │  ├─ Setup lifespan context manager
│     │  │  ├─ On startup: Run warmup_service.execute_warmup()
│     │  │  │  ├─ Device detection (cuda/cpu auto)
│     │  │  │  ├─ CLIP model load from HuggingFace (or cache)
│     │  │  │  ├─ Warmup forward pass (dummy tensors)
│     │  │  │  └─ Log warmup time, return model reference
│     │  │  └─ On shutdown: Cleanup (optional)
│     │  ├─ Register routers: warmup, image_embedding, text_embedding, batch_embedding
│     │  └─ Return app instance
│     └─ uvicorn starts ASGI server on 0.0.0.0:$AI_SERVICE_PORT
│
└─ Health Checks:
   ├─ /health/liveness (every 30s, timeout 10s)
   │  └─ Returns 200 if process alive
   ├─ /health/readiness (orchestration call)
   │  └─ Returns 200 if model loaded + warmup done
   └─ On 3 consecutive failures: container marked unhealthy
```

### 1.3 Dependency Resolution & Offline Installation

#### 1.3.1 The Transitive Dependency Problem

**Scenario**: FastAPI requires Starlette >= 0.46.0, but it's not in requirements.txt.

**Incorrect Approach** (causes build failure):
```dockerfile
# Builder stage: Don't include transitive deps
RUN pip wheel --no-deps --wheel-dir /build/wheels -r ai_requirements.txt
# Output: fastapi-0.111.0-py3-none-any.whl (missing starlette!)

# Runtime stage: Offline install fails
RUN pip install --no-index --find-links=/build/wheels -r ai_requirements.txt
# Error: Could not find a version that satisfies: starlette>=0.46.0
```

**Correct Approach** (now implemented):
```dockerfile
# Builder stage: Include ALL transitive deps
RUN pip wheel --no-cache-dir --wheel-dir /build/wheels -r ai_requirements.txt
# Output: fastapi, starlette, pydantic, all 50+ transitive wheels

# Runtime stage: Offline install succeeds
RUN pip install --no-index --find-links=/build/wheels -r ai_requirements.txt
# Success: All wheels available, installation complete
```

#### 1.3.2 Dependency Graph Example

```
ai_requirements.txt (direct dependencies)
├─ torch==2.3.0
├─ open_clip_torch==2.20.0+
├─ fastapi==0.110.0+
├─ uvicorn==0.27.0+
├─ pillow==10.0.0+
├─ pydantic==2.0.0+
└─ pytest==7.4.0+

Transitive Dependencies (built into wheels by builder stage)
├─ torch → numpy, sympy, filelock, jinja2, ...
├─ fastapi → starlette, pydantic, ...
├─ uvicorn → click, h11, httptools, ...
├─ open_clip_torch → torch, numpy, torchvision (partial, compiled), ...
└─ [And many more: 40+ total wheels in /build/wheels/]

/build/wheels/ output (after pip wheel):
├─ torch-2.3.0-cp313-cp313-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
├─ numpy-1.26.0-cp313-cp313-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
├─ starlette-0.46.0-py3-none-any.whl ← Transitive, not in ai_requirements.txt!
├─ fastapi-0.111.0-py3-none-any.whl
├─ uvicorn-0.27.0-py3-none-any.whl
├─ pillow-10.0.0-cp313-cp313-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
├─ pydantic-2.5.0-cp313-cp313-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
├─ open_clip_torch-2.20.0-py3-none-any.whl
├─ pytest-7.4.0-py3-none-any.whl
└─ [37 more wheels from transitive dependencies]
```

### 1.4 Security Hardening Strategy

#### 1.4.1 Non-Root User Enforcement

**Why**: CVE prevention. If container is compromised, attacker gains UID 1000 (non-root), not root.

**Implementation**:
```dockerfile
# Create non-root user during build
RUN useradd -m -u 1000 aiservice

# Change ownership
RUN chown -R aiservice:aiservice /app/ai-service

# Switch to non-root for runtime
USER aiservice
```

**Verification**:
```bash
docker exec <container> id
# Output: uid=1000(aiservice) gid=1000(aiservice) groups=1000(aiservice)
```

#### 1.4.2 Minimal System Dependencies

**Why**: Reduce attack surface. No build tools, no unnecessary libraries.

**Builder Stage**:
```dockerfile
RUN apt-get install -y --no-install-recommends \
	build-essential \  ← Only for build, discarded
	git                ← Only for build, discarded
```

**Runtime Stage**:
```dockerfile
RUN apt-get install -y --no-install-recommends \
	libgomp1 \         ← PyTorch parallelization
	libopenblas0 \     ← NumPy/SciPy linear algebra
	ca-certificates    ← For HTTPS (HuggingFace download)
```

**Size Benefit**: Runtime image ~150-200 MB base, torch layer ~2.5-3 GB.

#### 1.4.3 Secrets NOT in Image

**Never**:
- CLIP_MODEL_S3_TOKEN, API keys, credentials
- .git folder, .ssh keys, .aws config
- Unencrypted config files with passwords

**Always**:
- Inject secrets via docker-compose `secrets` or env var at runtime
- ai_main.py loads from ai.env.local (injected, not baked)
- .dockerignore prevents sensitive files from build context

**Example .dockerignore**:
```
__pycache__/
*.pyc
.pytest_cache/
.env.local
docs/
tests/
.github/
.git/
.venv/
```

#### 1.4.4 Environment Variable Hygiene

**At Build Time** (Dockerfile):
```dockerfile
ENV LOG_LEVEL=INFO              ← OK, non-sensitive
ENV PYTHONUNBUFFERED=1          ← OK, non-sensitive
# Never: ENV CLIP_MODEL_S3_TOKEN=... (secrets)
```

**At Runtime** (docker-compose or orchestration):
```yaml
services:
  ai-service:
	environment:
	  - AI_SERVICE_PORT=8001             ← Non-sensitive config
	  - CLIP_MODEL_NAME=ViT-B/32
	  - DEVICE=cpu
	  - MODEL_CACHE_DIR=/app/ai-service/model_cache
	  # Secrets injected via docker-compose secrets or Vault
	# Never: logging with secret values
```

**In entrypoint.sh**:
```bash
# Log only keys, never values
echo "Validating AI_SERVICE_PORT..."  ← OK
echo "AI_SERVICE_PORT = $AI_SERVICE_PORT"  ← BAD! Exposes value
```

---

## 2. Containerization Process (Quy trình chi tiết)

### 2.1 Pre-Build Phase

#### 2.1.1 Local Validation (Windows Developer)

```powershell
# 1. Check Docker is running
docker version

# 2. Validate Dockerfile syntax
docker build --dry-run -f modules/AIModule/ai_container_Dockerfile .

# 3. Check ai_requirements.txt
cat modules/AIModule/ai_requirements.txt

# 4. Verify scripts
ls -la modules/AIModule/scripts/entrypoint.sh
file modules/AIModule/scripts/entrypoint.sh  # Should be Unix line endings

# 5. Check .dockerignore
cat modules/AIModule/.dockerignore
```

#### 2.1.2 Build Context Preparation

**Build context** = directory passed to `docker build` (usually repo root).

```bash
# From E:\SISE
docker build -f modules/AIModule/ai_container_Dockerfile \
			 -t ai-service:1.0.0 \
			 .  ← This dot = current directory (repo root)

# Docker copies:
# - E:\SISE\modules\AIModule\* (app files)
# - E:\SISE\.dockerignore (what to skip)
# - Excludes: __pycache__, *.pyc, .env.local, docs/, tests/, .git/
```

### 2.2 Build Phase (Multi-Stage)

#### 2.2.1 Builder Stage Execution

```bash
# Step 1: FROM python:3.13-slim as builder
# Pulls image ~160MB

# Step 2: Install build tools
apt-get update && apt-get install -y build-essential gcc git
# Adds ~500MB

# Step 3: Copy requirements
COPY modules/AIModule/ai_requirements.txt .

# Step 4: Compile wheels (CRITICAL STEP)
pip wheel --no-cache-dir --wheel-dir /build/wheels -r ai_requirements.txt
# ✓ torch: 2.5 GB
# ✓ numpy, scipy, scikit-learn, etc.
# ✓ starlette, pydantic, httptools (transitive from fastapi/uvicorn)
# Takes ~10-15 minutes on modern CPU
# Output: /build/wheels/ (~3-4 GB)

# Step 5: Stage discarded
# Final builder size: ~4 GB (not shipped to final image)
```

**Common Issues**:
- `error: Microsoft Visual C++ 14.0 or greater is required` (Windows, requires build tools)
- `pip: command not found` (Python not in PATH)
- `Wheel building for torch failed` (likely network issue, retry)

#### 2.2.2 Runtime Stage Execution

```bash
# Step 1: FROM python:3.13-slim as runtime
# Pulls image ~160MB (fresh, smaller builder base not reused)

# Step 2: Install minimal system deps
apt-get install -y libgomp1 libopenblas0 ca-certificates
# Adds ~50MB

# Step 3: Create non-root user
useradd -m -u 1000 aiservice
# Adds ~10MB (user account)

# Step 4: Copy wheels from builder
COPY --from=builder /build/wheels /build/wheels
# Adds ~3-4 GB

# Step 5: Install wheels (offline)
pip install --no-cache-dir --no-index --find-links=/build/wheels -r ai_requirements.txt
# Extracts and installs from wheels, no network access
# Takes ~2-3 minutes
# Result: Site-packages now has torch, fastapi, etc.

# Step 6: Copy application code
COPY modules/AIModule/app ./app
COPY modules/AIModule/ai_main.py .
COPY modules/AIModule/scripts/entrypoint.sh .
COPY modules/AIModule/configs ./configs
# Adds ~20MB

# Step 7: Permissions & ownership
chmod +x entrypoint.sh
chown -R aiservice:aiservice /app/ai-service

# Step 8: Environment & health check
ENV PYTHONUNBUFFERED=1 ...
HEALTHCHECK --interval=30s ...

# Step 9: User switch & entrypoint
USER aiservice
ENTRYPOINT ["/app/ai-service/entrypoint.sh"]

# Final runtime image size: ~3-4 GB
```

### 2.3 Post-Build Phase

#### 2.3.1 Image Tagging & Registry Push

```bash
# Local tagging
docker tag ai-service:1.0.0 ai-service:latest

# Registry tagging
docker tag ai-service:1.0.0 registry.example.com/ai-service:1.0.0
docker tag ai-service:1.0.0 registry.example.com/ai-service:latest

# Push to registry (requires login)
docker login registry.example.com
docker push registry.example.com/ai-service:1.0.0
docker push registry.example.com/ai-service:latest

# Verify
docker images | grep ai-service
```

#### 2.3.2 Local Smoke Test

```bash
# 1. Start container with env vars
docker run -d \
  --name ai-service-test \
  -p 8001:8001 \
  -e AI_SERVICE_PORT=8001 \
  -e CLIP_MODEL_NAME=ViT-B/32 \
  -e DEVICE=cpu \
  -e MODEL_CACHE_DIR=/app/ai-service/model_cache \
  ai-service:1.0.0

# 2. Wait for warmup (60-90s on CPU)
sleep 90

# 3. Check liveness
curl http://localhost:8001/health/liveness
# Expected: HTTP 200, {"status":"alive"}

# 4. Check readiness
curl http://localhost:8001/health/readiness
# Expected: HTTP 200, {"status":"ready","warmup_time_ms":45000, ...}

# 5. Test text embedding
curl -X POST http://localhost:8001/inference/embed/text \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world"}'
# Expected: HTTP 200, {"vector": [float, float, ..., float]} (512 dims)

# 6. Cleanup
docker stop ai-service-test
docker rm ai-service-test
```

---

## 3. Runtime Execution & Orchestration

### 3.1 Container Startup Sequence

```
1. Docker daemon starts container
   ├─ Allocates resources (CPU, memory, network)
   └─ Mounts filesystem layers

2. Entrypoint: /app/ai-service/entrypoint.sh
   ├─ Validate env vars (AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR)
   ├─ Create MODEL_CACHE_DIR if not exists
   ├─ Log startup info (keys only)
   └─ exec python -m uvicorn ai_main:create_app --host 0.0.0.0 --port $AI_SERVICE_PORT
	  └─ Passes control to Python process (replaces shell, PID 1)

3. ai_main:create_app() executes
   ├─ _load_env_file(): Load ai.env.local (keys + values injected at runtime)
   ├─ _build_warmup_config()
   ├─ _build_image_embedding_config()
   ├─ _build_text_embedding_config()
   ├─ _build_batch_embedding_config()
   ├─ create_app()
   │  ├─ Lifespan context manager (setup on startup)
   │  │  └─ warmup_service.execute_warmup()
   │  │     ├─ Device detection
   │  │     ├─ CLIP model load (~30s on CPU, ~5s on GPU)
   │  │     ├─ Warmup forward pass
   │  │     └─ Return model reference (stored globally)
   │  ├─ Include routers (warmup, image_embedding, text_embedding, batch_embedding)
   │  └─ Return app instance
   └─ uvicorn ASGI server starts on 0.0.0.0:$AI_SERVICE_PORT

4. Server ready
   ├─ Accepts connections on port $AI_SERVICE_PORT
   ├─ /health/liveness and /health/readiness available
   └─ Ready for embedding requests

5. Docker health check (every 30s)
   ├─ Probe /health/liveness
   ├─ If 200: Container marked HEALTHY
   └─ If non-200 for 3 consecutive: Container marked UNHEALTHY
	  └─ Orchestration decides: restart, replace, or log alert
```

### 3.2 Environment Variable Injection (docker-compose)

```yaml
# docker-compose.yml (example)
version: '3.8'
services:
  ai-service:
	build:
	  context: .
	  dockerfile: modules/AIModule/ai_container_Dockerfile
	image: ai-service:1.0.0
	container_name: ai-service-container
	ports:
	  - "8001:8001"  # HOST:CONTAINER
	environment:
	  - AI_SERVICE_PORT=8001
	  - CLIP_MODEL_NAME=ViT-B/32
	  - DEVICE=cpu
	  - MODEL_CACHE_DIR=/app/ai-service/model_cache
	  - LOG_LEVEL=INFO
	volumes:
	  - ai-model-cache:/app/ai-service/model_cache  # Persist models
	  - ./modules/AIModule/configs/ai.env.local:/app/ai-service/configs/ai.env.local  # Inject config at runtime
	restart: on-failure
	healthcheck:
	  test: ["CMD", "curl", "-f", "http://localhost:8001/health/liveness"]
	  interval: 30s
	  timeout: 10s
	  retries: 3
	  start_period: 60s

volumes:
  ai-model-cache:
	driver: local
```

### 3.3 GPU Support (NVIDIA Runtime)

**If GPU available**, device auto-detection in warmup_adapters.py will switch to CUDA:

```yaml
services:
  ai-service:
	# ... (as above)
	runtime: nvidia  # ← Enable NVIDIA runtime
	environment:
	  - NVIDIA_VISIBLE_DEVICES=all
	  - DEVICE=cuda  # Or let warmup auto-detect
	deploy:
	  resources:
		reservations:
		  devices:
			- driver: nvidia
			  count: 1  # Request 1 GPU
			  capabilities: [compute, utility]
```

---

## 4. Observability & Monitoring

### 4.1 Logging Strategy

**In Container**:
- PYTHONUNBUFFERED=1 ensures real-time log streaming
- ai_main.py uses loguru for structured logging
- entrypoint.sh logs startup validation (keys only, no secrets)

**Log Collection**:
```bash
# View container logs
docker logs -f ai-service-container

# Example log output:
# [AI Service] Initializing container...
# [AI Service] Validating environment variables...
# [AI Service] AI_SERVICE_PORT... OK
# [AI Service] Model cache directory: /app/ai-service/model_cache
# [2026-01-15 10:30:45.123] INFO: Warmup initiated (process_id=1)
# [2026-01-15 10:30:48.456] INFO: Device detected: cpu
# [2026-01-15 10:31:15.789] INFO: CLIP model loaded (ViT-B/32)
# [2026-01-15 10:31:20.123] INFO: Warmup completed (45000ms)
# [2026-01-15 10:31:20.456] INFO: FastAPI server started on 0.0.0.0:8001
```

### 4.2 Metrics from entrypoint.sh & Uvicorn

| Metric | Source | Value |
|--------|--------|-------|
| `startup_time_ms` | entrypoint.sh | ~1000ms (validation + Python startup) |
| `warmup_time_ms` | warmup_service | ~45000ms (CPU), ~5000ms (GPU) |
| `server_start_time_ms` | uvicorn | ~500ms |
| `total_startup_latency_ms` | sum | ~45000-50000ms (CPU) |
| `health_check_latency_ms` | /health/liveness | ~10-50ms |

### 4.3 Container Health Status

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' ai-service-container
# Output: healthy / unhealthy / none

# See last 10 health checks
docker inspect --format='{{json .State.Health.Log}}' ai-service-container | jq '.[-10:]'

# Example:
# {
#   "Start": "2026-01-15T10:31:50.123456789Z",
#   "End": "2026-01-15T10:31:50.189456789Z",
#   "ExitCode": 0,
#   "Output": ""  // Empty on success
# }
```

---

## 5. Troubleshooting

### 5.1 Build Failures

#### Issue: `pip wheel` fails with dependency error

**Symptom**:
```
ERROR: Could not find a version that satisfies: starlette>=0.46.0
```

**Root Cause**: Using `pip wheel --no-deps` in builder stage.

**Solution**: Remove `--no-deps`:
```dockerfile
# WRONG
RUN pip wheel --no-deps --wheel-dir /build/wheels -r ai_requirements.txt

# CORRECT
RUN pip wheel --no-cache-dir --wheel-dir /build/wheels -r ai_requirements.txt
```

#### Issue: `pip install --no-index` fails in runtime stage

**Symptom**:
```
ERROR: Could not find a version that satisfies: starlette>=0.46.0
```

**Root Cause**: Missing transitive dependencies in /build/wheels/.

**Solution**: Check builder stage includes all transitive deps (see section 1.3.1).

#### Issue: Out of disk space during build

**Symptom**:
```
failed to register layer: ... no space left on device
```

**Solution**:
```bash
# Clean up Docker artifacts
docker system prune -a --volumes  # Warning: removes all images
docker builder prune  # Clean build cache

# Or specify build output directory
docker build --output type=docker -f modules/AIModule/ai_container_Dockerfile -t ai-service:1.0.0 .
```

### 5.2 Runtime Issues

#### Issue: Container exits immediately

**Symptom**:
```
docker: Error response from daemon: OCI runtime create failed: ...
```

**Diagnosis**:
```bash
docker logs ai-service-container
# Check for missing env vars, validation errors
```

**Common Causes**:
- Missing required env var (AI_SERVICE_PORT, CLIP_MODEL_NAME, etc.)
- entrypoint.sh not executable (`chmod +x entrypoint.sh`)
- entrypoint.sh has Windows line endings (LF, not CRLF)

**Fix**:
```bash
# Verify entrypoint.sh is Unix format
file modules/AIModule/scripts/entrypoint.sh
# Should show: ... shell script, ASCII text

# Convert if needed (Windows)
dos2unix modules/AIModule/scripts/entrypoint.sh

# Or in PowerShell:
(Get-Content modules/AIModule/scripts/entrypoint.sh -Raw) -replace "`r`n", "`n" | Set-Content modules/AIModule/scripts/entrypoint.sh -NoNewline
```

#### Issue: Health check failing (container marked unhealthy)

**Symptom**:
```
docker inspect ... | grep -i unhealthy
```

**Diagnosis**:
```bash
# Check container logs
docker logs ai-service-container

# Manual health check
docker exec ai-service-container curl -f http://localhost:8001/health/liveness
# Should return HTTP 200

# Check if process is running
docker exec ai-service-container ps aux
# Should show: python -m uvicorn ai_main:create_app
```

**Common Causes**:
- Warmup still in progress (60s+ for CPU)
- Model download failed (network issue)
- Out of memory (torch model load failed)

**Fix**:
```bash
# Increase start_period in healthcheck or docker-compose
HEALTHCHECK --start-period=120s ...  # 2 minutes instead of 60s

# Check available memory
docker stats ai-service-container
```

#### Issue: Model download fails (network isolation)

**Symptom**:
```
Failed to download CLIP model from HuggingFace
```

**Cause**: Network issue or HuggingFace rate limiting.

**Solution**:
```bash
# Pre-download model (before container build)
# Run locally:
python -c "import open_clip; open_clip.create_model_and_transforms('ViT-B/32')"

# This downloads to ~/.cache/clip, then volume-mount it:
docker run ... -v ~/.cache/clip:/app/ai-service/model_cache ...
```

---

## 6. Best Practices & Guidelines

### 6.1 Build Optimization

- **Cache Reuse**: Docker caches layer results; change ai_requirements.txt → rebuild wheels (10-15 min), change app code → reuse wheels, copy app (30 sec)
- **Build Arguments**: Use `--build-arg` for non-secrets (e.g., `--build-arg BASE_IMAGE=python:3.13-alpine`), never for secrets
- **Parallel Builds**: Multi-stage builds compile builder and runtime in parallel (when possible)
- **Image Tagging**: Use semantic versioning (1.0.0, 1.0.1, 2.0.0) and label with commit hash for traceability

### 6.2 Runtime Best Practices

- **Resource Limits**: Set CPU/memory limits in docker-compose to prevent runaway processes
- **Restart Policies**: Use `restart: on-failure` to auto-restart unhealthy containers
- **Logging**: Redirect stdout/stderr to Docker daemon for log aggregation (e.g., ELK, Splunk)
- **Security**: Use read-only root filesystem (not applicable here due to model cache writes), drop capabilities, use AppArmor/SELinux

### 6.3 Deployment & Orchestration

- **Zero-Downtime Deployment**: Rolling updates with two replicas, liveness/readiness probes
- **Rollback Strategy**: Keep previous image tags (ai-service:1.0.0, ai-service:1.1.0), use helm rollback or manual docker-compose revert
- **Monitoring Alerts**: Alert on health check failures, high error rates, latency SLO breaches
- **Documentation**: Link Dockerfile to runbook (e.g., docs/runbooks/ai-service-troubleshooting.md)

---

## 7. Validation Checklist (Advanced)

- [ ] Dockerfile syntax validated (no FROM casing issues, proper escaping)
- [ ] Builder stage compiles all transitive dependencies (pip wheel succeeds, /build/wheels contains 40+ .whl files)
- [ ] Runtime stage performs offline installation (--no-index succeeds, no network access during install)
- [ ] Image size is within limits (~3-4 GB due to torch)
- [ ] Non-root user enforced (USER aiservice in Dockerfile, container runs as UID 1000)
- [ ] Secrets NOT baked into image (.dockerignore excludes .env.local, .git, credentials)
- [ ] Entrypoint script is executable and has Unix line endings (LF, not CRLF)
- [ ] Health check configured (--interval=30s, --start-period=60s, --retries=3)
- [ ] Environment variables injected at runtime (docker-compose, not build-time)
- [ ] Model weights downloaded at first request (not baked into image)
- [ ] Warmup completes in < 30s on GPU, < 60s on CPU
- [ ] `/health/liveness` returns 200 within 10s
- [ ] `/health/readiness` returns 200 after warmup completes
- [ ] Container logs are real-time (PYTHONUNBUFFERED=1)
- [ ] Graceful shutdown on SIGTERM (optional, not yet implemented)

---

**Tài liệu liên quan**: 
- [AI Container Quick Guide](./AI_CONTAINER_QUICK_GUIDE.md)
- [AI Container References](./AI_CONTAINER_REFERENCES.md)
- [Warmup Deep Guide](../warmup_workflow/WARMUP_DEEP_GUIDE.md)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
