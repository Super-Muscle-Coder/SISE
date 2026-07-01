# =============================================================================
# StorageModule — Dockerfile (Production-Ready Multi-Stage, patched setuptools+wheel)
# =============================================================================
# Goals:
#   1. Security: Run as non-root appuser
#   2. Lean: Only production dependencies, no build tools in runtime
#   3. Reliability: Verify imports at build time
# =============================================================================

# Stage 1: builder
FROM python:3.13-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY storage_requirements.txt .

# --- Patch setuptools + wheel trước khi cài requirements ---
RUN pip install --no-cache-dir --upgrade setuptools wheel==0.47.0 && \
    rm -rf /usr/local/lib/python3.13/site-packages/setuptools/_vendor/wheel* || true && \
    rm -rf /root/.local/lib/python3.13/site-packages/setuptools/_vendor/wheel* || true

RUN pip install --no-cache-dir --user -r storage_requirements.txt

RUN find /root/.local -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /root/.local -type f -name "*.pyc" -delete && \
    find /root/.local -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true

# Stage 2: runtime
FROM python:3.13-slim AS runtime

LABEL maintainer="SISE Project"
LABEL module="StorageModule"
LABEL version="1.0.0"
LABEL description="Storage infrastructure: PostgreSQL schemas, Milvus collections, MinIO buckets"

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# --- Xóa wheel/setuptools vendor cũ và cài lại bản mới ---
RUN pip uninstall -y wheel setuptools || true && \
    rm -rf /usr/local/lib/python3.13/site-packages/wheel* /usr/local/lib/python3.13/site-packages/setuptools/_vendor/wheel* || true && \
    pip install --no-cache-dir setuptools wheel==0.47.0

RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

COPY --chown=appuser:appuser migrations/ ./migrations/
COPY --chown=appuser:appuser schema_alembic.ini .
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser storage_main.py .

USER appuser

RUN python -c "import app; print('✓ StorageModule app imports verified')"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import app.routers; print('OK')" || exit 1

CMD ["python", "storage_main.py", "init"]
