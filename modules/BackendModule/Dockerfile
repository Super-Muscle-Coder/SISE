# =============================================================================
# Dockerfile — Backend Module (BackendModule)
# =============================================================================
# Changelog:
#   v1.1.0 -> v1.1.1
#     [APPEND v1.1.1] Added non-root user (appuser, uid 1000) for runtime
#     security — resolves Celery's "SecurityWarning: You're running the
#     worker with superuser privileges" seen when the container ran as
#     root by default (python:3.13-slim has no non-root user configured
#     out of the box). Ownership of /app is transferred to appuser before
#     switching USER, since Celery/uvicorn need read access to
#     /app/app and /app/backend_main.py under the new user.
# =============================================================================

FROM python:3.13-slim

LABEL maintainer="SISE Project"
LABEL title="BackendModule"
LABEL version="1.1.1"
LABEL description="Backend API Service for SISE (AG-03)"

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend_requirements.txt /app/backend_requirements.txt
RUN pip install --no-cache-dir -r /app/backend_requirements.txt

COPY app/ /app/app/
COPY backend_main.py /app/backend_main.py

# Non-root user for runtime — avoids running uvicorn/Celery as root inside
# the container (see Changelog v1.1.1 above).
RUN useradd --create-home --shell /bin/bash --uid 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

ENTRYPOINT ["python", "backend_main.py"]