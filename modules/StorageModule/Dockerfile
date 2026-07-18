# =============================================================================
# StorageModule — Dockerfile (Production-Ready, Python 3.13 Optimized)
# =============================================================================
# Multi-stage build for lean runtime
# Non-root user (security best practice)
# Python 3.13 with verified package compatibility
# pgvector (PostgreSQL extension `vector`) replaces pymilvus
# Version Dockerfile: 1.1.0
# =============================================================================

# ── Stage 1: Builder (compile dependencies) ──────────────────────────────────
FROM python:3.13-slim-bookworm AS builder

WORKDIR /build

# Install build dependencies (minimal set)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY storage_requirements.txt .

# Install setuptools FIRST (provides pkg_resources)
RUN pip install --no-cache-dir --upgrade \
    setuptools==78.1.1 \
    wheel==0.47.0

# Install all requirements
RUN pip install --no-cache-dir --user -r storage_requirements.txt

# Clean up build artifacts and tests
RUN find /root/.local -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /root/.local -type f -name "*.pyc" -delete && \
    find /root/.local -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true && \
    find /root/.local -type d -name "*.dist-info" -exec rm -rf {}/tests \; 2>/dev/null || true

# ── Stage 2: Runtime (lean production image) ─────────────────────────────────
FROM python:3.13-slim-bookworm AS runtime

LABEL maintainer="SISE Project"
LABEL module="StorageModule"
LABEL version="1.2.0"
LABEL description="Storage infrastructure: PostgreSQL schemas with pgvector (HNSW), MinIO buckets, Redis cache"

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install setuptools in runtime (for pkg_resources compatibility)
RUN pip install --no-cache-dir \
    setuptools==78.1.1 \
    wheel==0.47.0

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash --uid 1000 appuser

WORKDIR /app

# Copy compiled packages from builder
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Set environment variables
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application files
COPY --chown=appuser:appuser migrations/ ./migrations/
COPY --chown=appuser:appuser schema_alembic.ini .
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser storage_main.py .

# Switch to non-root user
USER appuser

# Verify imports work correctly
RUN python -c "import app; import pgvector; import redis; import psycopg; print('All imports verified')"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import app.routers; print('OK')" || exit 1

# Default command
CMD ["python", "storage_main.py", "init"]