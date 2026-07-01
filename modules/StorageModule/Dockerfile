# =============================================================================
# StorageModule — Dockerfile (Production-Ready Multi-Stage)
# =============================================================================
# Goals:
#   1. Security: Run as non-root appuser
#   2. Lean: Only production dependencies, no build tools in runtime
#   3. Reliability: Verify imports at build time
# =============================================================================

# Stage 1: builder
# Purpose: Compile/install all dependencies into isolated location
FROM python:3.13-slim AS builder

WORKDIR /build

# Install only build tools needed (gcc for psycopg binary compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY storage_requirements.txt .

# Install packages to /root/.local (--user flag)
# --no-cache-dir: don't cache pip downloads in image
RUN pip install --no-cache-dir --user -r storage_requirements.txt

# Cleanup: remove unnecessary files to reduce bloat
RUN find /root/.local -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /root/.local -type f -name "*.pyc" -delete && \
    find /root/.local -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true

# Stage 2: runtime
# Purpose: Minimal production image with only runtime requirements
FROM python:3.13-slim AS runtime

LABEL maintainer="SISE Project"
LABEL module="StorageModule"
LABEL version="1.0.0"
LABEL description="Storage infrastructure: PostgreSQL schemas, Milvus collections, MinIO buckets"

# Install ONLY runtime dependencies (no build tools like gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user BEFORE copying files (for proper ownership)
RUN useradd --create-home --shell /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy dependencies from builder → appuser's home
# This ensures appuser can import packages without permission issues
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Set PATH + PYTHONPATH for imports to work
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

# Copy application code (ordered by change frequency for optimal layer caching)
COPY --chown=appuser:appuser migrations/ ./migrations/
COPY --chown=appuser:appuser schema_alembic.ini .
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser storage_main.py .

# FILES NOT COPIED (security + reduce image size):
#   configs/          → secrets, injected via --env-file at runtime
#   tests/            → not needed in production
#   documents/        → not needed in production
#   scripts/          → Windows utilities, not runnable in Linux container
#   verify_imports.py → no longer needed
#   .pyproj, *.sln    → IDE project files
#   __pycache__/      → already cleaned in builder stage

# Switch to non-root user for all subsequent operations (security best practice)
USER appuser

# Build-time verification: ensure all module imports work
# This catches import errors BEFORE image is marked successful
# If this fails, docker build fails immediately (no broken images pushed)
RUN python -c "import app; print('✓ StorageModule app imports verified')"

# Health check for container orchestrators (e.g., Kubernetes)
# Verifies app.routers module can load (sanity check)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import app.routers; print('OK')" || exit 1

# Default command: "init" = schema + collection + bucket (NO seed in production)
# Container will run: python storage_main.py init
#
# Override examples:
#   docker run ... sise-storage:v1.0.0 all    (include seed, dev only)
#   docker run ... sise-storage:v1.0.0 seed   (seed standalone)
CMD ["python", "storage_main.py", "init"]