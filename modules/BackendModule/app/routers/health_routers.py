"""
Health Check Routers
====================
HTTP route handlers for health/liveness and health/readiness probes.

Routes:
- GET /health/liveness: Simple service liveness check
- GET /health/readiness: Comprehensive dependency readiness check with X-Expected-Vector-Dim header
"""

from fastapi import APIRouter, Depends, HTTPException, Response
import logging

from app.entities.health_entities import HealthStatus
from app.services.health_services import HealthService
from app.dependencies import get_health_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["System"])


@router.get(
    "/health/liveness",
    response_model=HealthStatus,
    summary="Service liveness probe",
    description="Simple check that the backend process is running. Used by container orchestrators to determine if the container should be restarted.",
)
async def get_liveness(
    health_service: HealthService = Depends(get_health_service),
) -> HealthStatus:
    try:
        return await health_service.check_liveness()
    except Exception as exc:
        logger.exception("Liveness check failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to run liveness check"},
        )


@router.get(
    "/health/readiness",
    response_model=HealthStatus,
    summary="Comprehensive readiness check (dependencies)",
    description="Deep readiness check that verifies all critical dependencies are available. Used by load balancers to determine if traffic should be routed to this instance.",
)
async def get_readiness(
    health_service: HealthService = Depends(get_health_service),
) -> Response:
    try:
        health_status, http_code = await health_service.check_readiness()
        response = Response(
            content=health_status.model_dump_json(),
            status_code=http_code,
            media_type="application/json",
        )
        response.headers["X-Expected-Vector-Dim"] = str(health_service.vector_dim)
        return response
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Readiness check failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to run readiness check"},
        )


__all__ = ["router"]