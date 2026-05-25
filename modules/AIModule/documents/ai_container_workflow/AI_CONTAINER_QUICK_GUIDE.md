# AI Container Workflow - Quick Guide

**Mục đích**: Tài liệu này cung cấp cái nhìn tổng thể nhanh về ai_container workflow cho các developer mới tham gia dự án hoặc cần nắm bắt nhanh cốt lõi của quá trình containerization AI Service.

**Thời gian đọc**: 10-15 phút

---

## 1. Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa

AI Container Workflow (T002-06) là quá trình xây dựng, cấu hình, và triển khai AI Inference Service vào một Docker container. Workflow này đóng gói toàn bộ Python application (ai_main.py, app layer, configs) cùng với dependencies vào một lightweight, secure, production-ready image.

**Vai trò trong hệ thống**:
- Đóng gói AI Service để dễ dàng triển khai trên mọi môi trường
- Chuẩn bị container cho orchestration (Docker Compose, Kubernetes)
- Đảm bảo consistency giữa dev, staging, và production
- Giảm thiểu image size thông qua multi-stage build

### Quy trình cơ bản (High-level Steps)

AI Container Workflow gồm các bước:

1. **Requirements Preparation**: Chuẩn bị tất cả Python dependencies (ai_requirements.txt)
2. **Builder Stage**: Compile wheels từ requirements (no-deps bị loại bỏ để có transitive dependencies)
3. **Runtime Stage**: Tạo lightweight image với Python 3.13-slim + wheels + app code
4. **Security Hardening**: 
   - Non-root user (aiservice)
   - Minimal system dependencies
   - Env vars as keys only (no secrets in image)
5. **Health Check Configuration**: `/health/liveness` endpoint probe
6. **Build Validation**: Docker build success, image size reasonable, startup OK

### Kiến trúc đơn giản (Simple Architecture)

```
Repository Root (E:\SISE\)
	|
	└── modules/AIModule/
		├── ai_requirements.txt (dependency list)
		├── ai_container_Dockerfile (multi-stage build)
		├── scripts/
		│   ├── entrypoint.sh (container startup validation)
		│   ├── build.ps1 (Windows build helper)
		│   ├── health-check.sh (probe endpoints)
		│   └── test-endpoints.bat (smoke test)
		├── app/ (complete 5-layer app structure)
		├── configs/ (ai.env.example, ai.env.local)
		├── ai_main.py (FastAPI bootstrap)
		└── documents/ai_container_workflow/
			├── AI_CONTAINER_QUICK_GUIDE.md (you are here)
			├── AI_CONTAINER_DEEP_GUIDE.md (detailed)
			└── AI_CONTAINER_REFERENCES.md (file inventory)
```

---

## 2. Input & Output

### Input
- **Source**: modules/AIModule/ directory (entire app structure)
- **Dependencies**: Python 3.13 runtime, apt packages (build-essential during build phase)
- **Env Vars**: Injected at container runtime (not build-time):
  - `AI_SERVICE_PORT`: Service port (default 8001)
  - `CLIP_MODEL_NAME`: ViT-B/32 or ViT-L/14
  - `DEVICE`: cuda or cpu (auto-detected if not set)
  - `MODEL_CACHE_DIR`: /app/ai-service/model_cache (or volume mount)

### Output
- **Primary**: Docker image `ai-service:1.0.0` (or custom tag)
- **Size**: ~3-4 GB (due to PyTorch + models cached after first run)
- **Artifact**: Stored in Docker daemon, tagged for registry push
- **Health Status**: Container starts, warmup completes < 30s, `/health/liveness` returns 200

---

## 3. Thành phần chính (Key Components)

### 3.1 ai_container_Dockerfile

**Chức năng**: Định nghĩa multi-stage build process.

**Hai stage chính**:
- **Builder**: Compile wheels từ `ai_requirements.txt`
  - Includes build tools (gcc, build-essential)
  - Output: `/build/wheels/` directory với tất cả .whl files
  - Transitive dependencies được bao gồm (không dùng `--no-deps`)

- **Runtime**: Production-ready minimal image
  - Base: `python:3.13-slim`
  - Copies wheels từ builder, installs via `pip install --no-index`
  - Copies app code, configs, entrypoint script
  - Exposes port 8001
  - Health check every 30s

### 3.2 entrypoint.sh

**Chức năng**: Container startup script.

**Trách nhiệm**:
- Validate required env vars (AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR)
- Create model cache directory (if not exists)
- Log startup info (keys only, no values)
- Start uvicorn: `python -m uvicorn ai_main:create_app --host 0.0.0.0 --port $AI_SERVICE_PORT`

### 3.3 build.ps1

**Chức năng**: Windows PowerShell build helper (for Windows developers).

**Actions**:
- `validate`: Check docker, entrypoint.sh exists
- `build`: Run `docker build` with proper tag
- `test`: Run containers, verify health checks
- `run`: Start container interactively

### 3.4 health-check.sh

**Chức năng**: Health probe script for Liveness and Readiness checks.

**Probes**:
- **Liveness**: `GET /health/liveness` (process alive?)
- **Readiness**: `GET /health/readiness` (model loaded + warmup done?)
- Retry logic with exponential backoff

### 3.5 test-endpoints.bat

**Chức năng**: Windows batch script for smoke testing.

**Tests**:
- Liveness probe
- Readiness probe
- Text embedding POST (sample request)

---

## 4. Yêu cầu & Tiền điều kiện (Requirements & Prerequisites)

### Build-time Requirements
- Docker installed and running
- Python 3.13 (for local testing, not required for build)
- git (included in builder base image)

### Runtime Requirements (in container)
- Python 3.13-slim base image
- PyTorch, open_clip, FastAPI, uvicorn
- Model cache directory (writable)

### Env Vars (must be injected at container start)
| Variable | Type | Default | Example |
|----------|------|---------|---------|
| AI_SERVICE_PORT | int | 8001 | 8001 |
| CLIP_MODEL_NAME | str | ViT-B/32 | ViT-B/32 or ViT-L/14 |
| DEVICE | str | auto-detect | cuda or cpu |
| MODEL_CACHE_DIR | path | /app/ai-service/model_cache | /models (if volume mount) |

---

## 5. Checklist (Quick Validation)

- [ ] Docker is installed and running
- [ ] modules/AIModule/ai_container_Dockerfile exists
- [ ] modules/AIModule/scripts/entrypoint.sh exists and is executable
- [ ] modules/AIModule/ai_requirements.txt has all dependencies (torch, open_clip, fastapi, uvicorn, pillow, pydantic, pytest)
- [ ] modules/AIModule/app/ contains warmup, image_embedding, text_embedding, batch_embedding workflows
- [ ] modules/AIModule/ai_main.py loads env vars privately, doesn't expose secrets
- [ ] Docker build runs without errors (check for missing transitive dependencies)
- [ ] Container starts successfully
- [ ] `/health/liveness` returns HTTP 200
- [ ] `/health/readiness` returns HTTP 200 (after warmup completes)
- [ ] Image is tagged and ready for registry push

---

## 6. Thường gặp (Common Questions)

**Q: Tại sao dùng multi-stage build?**
A: Multi-stage build giảm image size (builder tools không được ship). Build stage compile wheels (3-4GB), nhưng chỉ wheels + runtime code được copy to final image (~3-4GB sau caching).

**Q: Tại sao `--no-deps` bị loại bỏ?**
A: `pip wheel --no-deps` chỉ build direct dependencies mà không include transitive ones. Khi runtime stage chạy `pip install --no-index`, fastapi cần starlette>=0.46.0 nhưng nó không có. Removing `--no-deps` giải quyết vấn đề.

**Q: Model weights có được bake vào image không?**
A: Không. Models được download tại FIRST REQUEST via open_clip, cached trong MODEL_CACHE_DIR (typically volume mount). Warmup process tại startup pre-load model để loại bỏ cold-start latency.

**Q: Secrets có trong image không?**
A: Không. Env vars được inject tại container runtime (docker-compose), không bake into build. ai_main.py load từ ai.env.local at runtime, không store secrets in image layers.

---

## 7. Next Steps

1. **Build**: `cd E:\SISE && docker build -f modules/AIModule/ai_container_Dockerfile -t ai-service:1.0.0 .`
2. **Validate**: `modules/AIModule/scripts/health-check.sh` or `modules/AIModule/scripts/test-endpoints.bat`
3. **Deploy**: Push to registry, use docker-compose for orchestration
4. **Monitor**: Check logs via `docker logs <container_id>`, verify metrics in AI Service logs

---

**Tài liệu liên quan**: 
- [AI Container Deep Guide](./AI_CONTAINER_DEEP_GUIDE.md)
- [AI Container References](./AI_CONTAINER_REFERENCES.md)
- [Warmup Workflow](../warmup_workflow/WARMUP_QUICK_GUIDE.md)
