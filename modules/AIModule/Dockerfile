# =============================================================================
# AI Service Container — Multi-Stage Dockerfile
# =============================================================================
# Target: Production-ready AI Inference Service
# Requirements:
#   1. Python 3.13 slim base image
#   2. Model weights NOT baked into image (downloaded at runtime)
#   3. NO secrets in image layers (configs/ excluded)
#   4. Health check endpoint (/health/liveness)
#   5. ASGI server (uvicorn) ready for orchestration
#
# Build stages:
#   1. builder: Install dependencies and compile wheels
#   2. runtime: Minimal runtime image with only necessary files
#
# Security: Configs & environment variables injected at container run time
# via docker-compose env_file or Kubernetes secrets, NOT baked in image.
# =============================================================================

# Stage 1: Builder
# Purpose: Compile dependencies into wheels for faster final image build
FROM python:3.13-slim AS builder

LABEL stage=builder

# Install system-level build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	git \
	&& rm -rf /var/lib/apt/lists/*

# Create build directory
WORKDIR /build

# Copy requirements (FIXED: removed "modules/AIModule/" prefix — build context is modules/AIModule/)
COPY ai_requirements.txt .

# Create wheels directory and build wheels
RUN pip install --upgrade pip setuptools wheel && \
	pip wheel --no-cache-dir --default-timeout=300 \
	--extra-index-url https://download.pytorch.org/whl/cpu \
	--wheel-dir /build/wheels -r ai_requirements.txt

# =============================================================================
# Stage 2: Runtime
# Purpose: Minimal production image with only necessary runtime dependencies
# =============================================================================
FROM python:3.13-slim AS runtime

LABEL maintainer="SISE Project"
LABEL module="AIModule"
LABEL version="1.1.0"
LABEL description="AI Inference Service for SISE — CLIP-based multimodal embeddings"

# Install runtime-only system dependencies
# Note: PyTorch requires only basic libs, no build tools needed
RUN apt-get update && apt-get install -y --no-install-recommends \
	libgomp1 \
	libopenblas0 \
	ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 aiservice

# Set working directory
WORKDIR /app/ai-service

# Copy wheels from builder stage
COPY --from=builder /build/wheels /build/wheels
COPY --from=builder /build/ai_requirements.txt .

# Install wheels (faster than pip install from source)
RUN pip install --no-cache-dir --no-index --find-links=/build/wheels -r ai_requirements.txt && \
	rm -rf /build/wheels

# Copy application code (entire app layer structure)
# NOTE: CONFIGS/ DELIBERATELY EXCLUDED (see .dockerignore)
# Environment variables injected at runtime via docker-compose env_file or Kubernetes
COPY app ./app
COPY ai_main.py .

# Create model cache directory with proper permissions
RUN mkdir -p /app/ai-service/model_cache

# Set environment variables for runtime (DEFAULTS ONLY — overrides at run time)
# All critical vars (AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR) 
# should be injected by orchestration layer (docker-compose env_file, Kubernetes, etc.)
ENV PYTHONUNBUFFERED=1 \
	PYTHONDONTWRITEBYTECODE=1 \
	PYTHONPATH=/app/ai-service \
	LOG_LEVEL=INFO

# ENV defaults (can be overridden at docker-compose / Kubernetes time)
# These are fallback values — DO NOT treat as production-ready configuration
# CLIP_MODEL_NAME updated to ViT-B-32-quickgelu (matches ai.env.local and prevents QuickGELU mismatch warning)
ENV AI_SERVICE_PORT=8001 \
	CLIP_MODEL_NAME=ViT-B-32-quickgelu \
	DEVICE=cpu \
	MODEL_CACHE_DIR=/app/ai-service/model_cache \
	VECTOR_DIM=512

# Expose port for FastAPI service
# Port is configurable via AI_SERVICE_PORT env var at runtime
EXPOSE 8001

# Change ownership to non-root user
RUN chown -R aiservice:aiservice /app/ai-service

# Switch to non-root user for runtime security
USER aiservice

# Health check: Verify process is alive
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
	CMD python -c "import http.client; \
	conn = http.client.HTTPConnection('localhost', 8001); \
	conn.request('GET', '/health/liveness'); \
	response = conn.getresponse(); \
	exit(0 if response.status == 200 else 1)"

# Entry point: ai_main.py is the only startup path
# Loads environment variables from:
#   1. docker-compose env_file (injected via -e or env_file: ./configs/ai.env.local)
#   2. System environment (if overridden at runtime)
#   3. Defaults defined above (fallback only)
ENTRYPOINT ["python", "ai_main.py"]

