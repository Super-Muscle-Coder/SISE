"""
Scaffold Routers: API endpoints for application health and status.
Depends on: services (ScaffoldService)
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from ..services.scaffold_services import ScaffoldService
from ..dependencies import get_scaffold_service

router = APIRouter(prefix="/scaffold", tags=["scaffold"])


@router.get("/status")
async def get_status(scaffold_service: ScaffoldService = Depends(get_scaffold_service)) -> Dict[str, Any]:
    """Get scaffold initialization and health status."""
    health = scaffold_service.health_check()
    return {
        "status": "ok",
        "data": health,
    }


@router.post("/validate-config")
async def validate_config(scaffold_service: ScaffoldService = Depends(get_scaffold_service)) -> Dict[str, Any]:
    """Validate all application configurations."""
    try:
        result = scaffold_service.config_adapter.validate_configuration()
        return {
            "status": "ok",
            "validation_passed": result,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


__all__ = ["router"]
