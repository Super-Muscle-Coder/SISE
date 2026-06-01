"""
Health Check Routers
====================
HTTP route handlers for health/liveness and health/readiness probes.

Routes:
- GET /health/liveness: Simple service liveness check
- GET /health/readiness: Comprehensive dependency readiness check with X-Expected-Vector-Dim header
"""

from typing import Optional
from fastapi import APIRouter, Depends, Response, status
import logging

from app.entities.health_entities import HealthStatus
from app.services.health_services import HealthService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["System"])

# Placeholder for dependency injection
_health_service: Optional[HealthService] = None


def set_health_service(service: HealthService):
    """Inject HealthService instance (called during app initialization)."""
    global _health_service
    _health_service = service


def get_health_service() -> HealthService:
    """Retrieve injected HealthService."""
    if _health_service is None:
        raise RuntimeError("HealthService not initialized. Call set_health_service() during app startup.")
    return _health_service


@router.get(
    "/health/liveness",
    response_model=HealthStatus,
    summary="Service liveness probe",
    description="Simple check that the backend process is running. Used by container orchestrators to determine if the container should be restarted.",
)
async def get_liveness(health_service: HealthService = Depends(get_health_service)) -> HealthStatus:
    """
    GET /health/liveness

    Simple liveness probe. Returns 200 if the backend service process is running.
    Does NOT check dependencies.

    Returns:
        HealthStatus with status="alive"
    """
    return await health_service.check_liveness()


@router.get(
    "/health/readiness",
    response_model=HealthStatus,
    summary="Comprehensive readiness check (dependencies)",
    description="Deep readiness check that verifies all critical dependencies are available. Used by load balancers to determine if traffic should be routed to this instance.",
)
async def get_readiness(
    health_service: HealthService = Depends(get_health_service),
) -> tuple[HealthStatus, int]:
    """
    GET /health/readiness

    Comprehensive readiness probe. Returns 200 if all critical dependencies are ready.
    Returns 503 if one or more dependencies are unavailable.
    Includes X-Expected-Vector-Dim header for client validation.

    Dependencies checked:
    - PostgreSQL (database)
    - Milvus (vector DB)
    - MinIO (object storage)
    - AI Service (embedding service)

    Returns:
        HealthStatus with status="ready" or "degraded"
        Also includes X-Expected-Vector-Dim header in HTTP response
    """
    health_status, http_code = await health_service.check_readiness()

    # Prepare response with custom header
    response = Response(
        content=health_status.model_dump_json(),
        status_code=http_code,
        media_type="application/json",
    )
    response.headers["X-Expected-Vector-Dim"] = str(health_service.vector_dim)

    return response


__all__ = ["router", "set_health_service", "get_health_service"]
