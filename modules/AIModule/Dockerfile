# =============================================================================
# AI Service Container — Multi-Stage Dockerfile
# =============================================================================
# Target: Production-ready AI Inference Service
# Requirements:
#   1. Python 3.13 slim base image
#   2. Model weights NOT baked into image (downloaded at runtime)
#   3. No secrets in image layers
#   4. Health check endpoint (/health/liveness)
#   5. ASGI server (uvicorn) ready for orchestration
#
# Build stages:
#   1. builder: Install dependencies and compile wheels
#   2. runtime: Minimal runtime image with only necessary files
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

# Copy requirements
COPY modules/AIModule/ai_requirements.txt .

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
COPY modules/AIModule/app ./app
COPY modules/AIModule/ai_main.py .
COPY modules/AIModule/scripts/entrypoint.py .
COPY modules/AIModule/configs ./configs

# Create model cache directory with proper permissions
RUN mkdir -p /app/ai-service/model_cache

# Make entrypoint script executable
RUN chmod +x entrypoint.py

# Set environment variables for runtime
# CRITICAL: All AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR must be set
# at container startup via docker-compose or orchestration
# However, we provide sensible defaults to allow container to start
ENV PYTHONUNBUFFERED=1 \
	PYTHONDONTWRITEBYTECODE=1 \
	PYTHONPATH=/app/ai-service \
	LOG_LEVEL=INFO \
	AI_SERVICE_PORT=8001 \
	CLIP_MODEL_NAME=ViT-B/32 \
	DEVICE=cpu \
	MODEL_CACHE_DIR=/app/ai-service/model_cache

# Expose port for FastAPI service
# Port is configurable via AI_SERVICE_PORT env var
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

# Entry point: Use Python script for validation and startup
ENTRYPOINT ["python", "/app/ai-service/entrypoint.py"]

# =============================================================================
# Notes:
# =============================================================================
# 1. ENV VARS AT RUNTIME:
#    - AI_SERVICE_PORT: Port to run service (default 8001)
#    - CLIP_MODEL_NAME: CLIP model variant (default "ViT-B/32")
#    - DEVICE: torch device ("cuda" or "cpu", auto-detected if not set)
#    - MODEL_CACHE_DIR: Path to cache directory for downloaded models
#    - Plus all standard config keys from ai.env.local (loaded by ai_main.py)
#
#    Example docker-compose injection:
#      environment:
#        - AI_SERVICE_PORT=8001
#        - CLIP_MODEL_NAME=ViT-B/32
#        - DEVICE=cpu
#        - MODEL_CACHE_DIR=/app/ai-service/model_cache
#
# 2. SECRETS HANDLING:
#    - NO secrets are embedded in the image
#    - ai_main.py loads env vars from ai.env.local at runtime
#    - docker-compose passes env vars securely (not logged or exposed)
#    - Never use --build-arg for secrets; always use secrets or env var injection
#
# 3. MODEL WEIGHTS:
#    - Models downloaded at FIRST REQUEST via open_clip
#    - Cached in MODEL_CACHE_DIR (can be a volume mount)
#    - Warmup process (ai_main.py) executes on startup to pre-load model
#    - Warm-up eliminates cold-start latency for first requests
#
# 4. HEALTHCHECK:
#    - Probes /health/liveness every 30s after 60s startup grace period
#    - If 3 consecutive probes fail, container is marked unhealthy
#    - Orchestration (docker-compose) should restart unhealthy containers
#
# 5. LOGGING:
#    - PYTHONUNBUFFERED ensures logs stream in real-time
#    - PYTHONDONTWRITEBYTECODE prevents .pyc file generation
#    - LOG_LEVEL controls verbosity (INFO, DEBUG, WARNING, etc.)
#    - Structured logs via loguru (see ai_main.py)
#
# 6. NON-ROOT USER:
#    - Image runs as aiservice (UID 1000) for security
#    - Prevents container breakout and privilege escalation
#    - FastAPI and model loading work fine under non-root
#
# 7. BUILD & PUSH:
#    Build:   docker build -f modules/AIModule/ai_container_Dockerfile -t ai-service:1.1.0 .
#    Push:    docker tag ai-service:1.1.0 <registry>/ai-service:1.1.0
#             docker push <registry>/ai-service:1.1.0
#    Run:     docker-compose -f docker-compose.yml up ai-service
#
# =============================================================================