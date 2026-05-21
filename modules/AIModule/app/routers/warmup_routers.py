"""
Warmup Workflow — Routers Layer

FastAPI health endpoints and startup event handlers.
Prefix: warmup_*
"""

from fastapi import APIRouter, HTTPException

from app.services import WarmupService


# Global warmup service instance
warmup_service: WarmupService = None


def create_warmup_router(warmup_svc: WarmupService) -> APIRouter: # Phương thức tạo router FastAPI với các endpoint kiểm tra sức khỏe (/health/liveness, /health/readiness, /health/debug) sử dụng dịch vụ warm-up đã khởi tạo. Nó cũng lưu trữ instance của WarmupService trong một biến toàn cục để sử dụng trong các endpoint.
    """
    Create FastAPI router with health check endpoints.

    Args:
        warmup_svc: Initialized WarmupService instance

    Returns:
        APIRouter with /health/* endpoints
    """
    global warmup_service
    warmup_service = warmup_svc

    router = APIRouter(prefix="/health", tags=["health"])

    @router.get("/liveness")
    async def liveness_probe():
        """
        Liveness probe: process alive?

        Returns 200 if process is running (always true if endpoint reached).
        """
        return {
            "status": "alive",
            "service": "ai_inference"
        }

    @router.get("/readiness")
    async def readiness_probe():
        """
        Readiness probe: model loaded and warm-up complete?

        Returns 200 only if:
          1. CLIP model is loaded
          2. Warm-up completed
          3. Device available
        """
        health = warmup_service.health_check()

        if not health["is_ready"]:
            raise HTTPException(
                status_code=503,
                detail={
                    "status": "not_ready",
                    "reason": "Model not loaded or warm-up failed",
                    "health": health
                }
            )

        return {
            "status": "ready",
            "service": "ai_inference",
            "health": health
        }

    @router.get("/debug")
    async def debug_info():
        """Debug endpoint: return full warmup service state."""
        return warmup_service.health_check()

    return router


def get_warmup_startup_handler(warmup_svc: WarmupService):
    """
    Create FastAPI startup event handler for warm-up.

    Args:
        warmup_svc: WarmupService instance

    Returns:
        Async function suitable for app.add_event_handler("startup", ...)
    """
    async def startup_handler():
        """Initialize and warm-up CLIP model on app startup."""
        result = warmup_svc.initialize_and_warmup()
        if not result.success:
            raise RuntimeError(
                f"Failed to initialize AI service: {result.error_message}"
            )

    return startup_handler


__all__ = ["create_warmup_router", "get_warmup_startup_handler"]
