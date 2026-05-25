# Skill_01.md

## Metadata
- **id**: SKILL_AG01_01
- **agent_id**: AG-01
- **agent_name**: AIModuleAgent
- **skill_version**: 1.0.0
- **created_at**: 2026-05-09
- **last_updated**: 2026-05-09
- **status**: active
- **owner**: AIModuleAgent
- **source_type**: problem_resolution

---

## Skill Registry

### Skill 1: Docker PyTorch CPU-Only Wheel Optimization

**Problem Trigger:**
- State: Container build failure with excessive CUDA dependencies
- Symptom: Image size bloating to 5GB+, build time >10 minutes
- Root Cause: PyTorch wheel resolver fetching full CUDA stack when building for CPU-only deployment

**Unexpected Challenge:**
- Initial attempt using `--index-url` in requirements.txt did not propagate to `pip wheel` command
- `pip wheel` ignores inline flags in requirements.txt; must pass via CLI

**Resolution Pattern:**
```dockerfile
RUN pip wheel --no-cache-dir --default-timeout=300 \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    --wheel-dir /build/wheels -r ai_requirements.txt
```

**Key Learning:**
- Use `--extra-index-url` (supplements PyPI), not `--index-url` (replaces PyPI)
- Pass index flags to `pip wheel` CLI, not requirements.txt
- Avoid `--only-binary=:all:` which breaks source-compiled packages

**Metrics:**
- Image size: 5GB → 2.13GB (60% reduction)
- Build time: 10+ minutes → 2-3 minutes (70% reduction)

---

### Skill 2: Dockerfile ENV Variables with Startup Defaults

**Problem Trigger:**
- State: Container startup crash
- Symptom: entrypoint.py validation fails: "Required env var not set"
- Root Cause: Dockerfile ENV section empty; entrypoint expected orchestration injection

**Resolution Pattern:**
```dockerfile
ENV AI_SERVICE_PORT=8001 \
    CLIP_MODEL_NAME=ViT-B/32 \
    DEVICE=cpu \
    MODEL_CACHE_DIR=/app/ai-service/model_cache
```

**Key Learning:**
- Set bootstrap defaults in Dockerfile ENV
- Defaults are overridable by docker-compose/orchestration
- Prevents startup crashes when orchestration unavailable

**Metrics:**
- Container startup success: 0% → 100%

---

### Skill 3: FastAPI Factory Pattern with Uvicorn --factory Flag

**Problem Trigger:**
- State: Uvicorn cannot locate app instance
- Root Cause: Uvicorn 0.27+ requires `--factory` flag for factory functions

**Resolution Pattern:**
```python
cmd = [
    sys.executable, "-m", "uvicorn",
    "ai_main:create_app",
    "--factory",  # Critical flag
    "--host", "0.0.0.0", "--port", str(port),
]
```

**Key Learning:**
- Use `--factory` with factory functions (create_app pattern)
- Factory defers app creation to async lifespan
- Enables model loading without blocking startup

---

### Skill 4: Python Entrypoint Script Over Bash for Container Portability

**Problem Trigger:**
- State: Container runtime crash
- Symptom: "/bin/sh: entrypoint.sh: No such file or directory"
- Root Cause: Bash script path resolution fails in container; Python is guaranteed

**Resolution Pattern:**
```dockerfile
COPY modules/AIModule/scripts/entrypoint.py .
ENTRYPOINT ["python", "/app/ai-service/entrypoint.py"]
```

**Key Learning:**
- Python entrypoint universal across Windows dev + Linux container
- Use os.execvp() to replace process (no zombie)
- Eliminates bash portability issues

---

### Skill 5: Model Cache Directory Pre-creation in Dockerfile

**Problem Trigger:**
- State: Runtime permission denied error
- Root Cause: Directory creation at runtime fails; non-root user insufficient permissions

**Resolution Pattern:**
```dockerfile
RUN mkdir -p /app/ai-service/model_cache
RUN chown -R aiservice:aiservice /app/ai-service
USER aiservice
```

**Key Learning:**
- Pre-create directories needed by non-root user
- Set ownership before USER directive
- Prevents runtime permission errors

---

### Skill 6: Dockerfile Multi-Stage Build with CPU-Optimized Runtime Layer

**Problem Trigger:**
- State: Image too large with unnecessary build dependencies
- Root Cause: Build tools (build-essential, git) present in final layer

**Resolution Pattern:**
```dockerfile
FROM python:3.13-slim AS builder
RUN apt-get install build-essential && pip wheel ...

FROM python:3.13-slim AS runtime
COPY --from=builder /build/wheels .
RUN pip install --no-index --find-links=/build/wheels
```

**Key Learning:**
- Separate builder (with tools) from runtime (minimal)
- Final image only contains wheels + app
- Builder stage size irrelevant; runtime stage size critical

**Metrics:**
- Image size: 5GB (with tools) → 2.13GB (runtime only)

---

## Validation & Testing

- ✅ 67 unit tests passed (pytest)
- ✅ Container build successful (2.13GB)
- ✅ Container startup: 30-60 seconds (warmup included)
- ✅ /health/liveness: 200 OK
- ✅ /health/readiness: 200 OK (after warmup)

---

## Tags

- **tags**: [docker, pytorch, cpu-optimization, entrypoint, multi-stage-build, fastapi, uvicorn, container]
- **severity**: [critical, major, major, major, major, major]
