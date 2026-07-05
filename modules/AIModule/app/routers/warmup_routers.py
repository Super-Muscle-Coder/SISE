"""
Warmup Workflow — Routers Layer

FastAPI health endpoints and startup event handlers.
Prefix: warmup_*
"""

from fastapi import APIRouter, HTTPException, Request, Depends, Response

from app.services import WarmupService


def get_warmup_service(request: Request) -> WarmupService:
    """
    FastAPI dependency: retrieve the initialized WarmupService from app.state.

    The WarmupService instance is created and warmed up once during the
    FastAPI `lifespan` startup phase and stored on `app.state.warmup_service`
    (see ai_main.py). Reading it per-request instead of binding a throwaway
    instance at router-registration time guarantees this router always
    observes the live, warmed-up instance (fixes issue 1.4: is_ready was
    permanently False because routers were bound to a separate "temp_*"
    instance that never had initialize_and_warmup() called on it).
    """
    return request.app.state.warmup_service


def create_warmup_router() -> APIRouter:
    """
    Create FastAPI router with health check endpoints.

    Returns:
        APIRouter with /health/* endpoints
    """
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
    async def readiness_probe(
        response: Response,
        warmup_svc: WarmupService = Depends(get_warmup_service),
    ):
        """
        Readiness probe: model loaded and warm-up complete?

        Returns 200 only if:
          1. CLIP model is loaded
          2. Warm-up completed
          3. Device available

        Per openapi.yaml (/health/readiness, response '200'), the
        X-Expected-Vector-Dim header must be present so clients can validate
        vector dimensions before sending data. Fix_group A.1 (Round 3): this
        header is now set on BOTH the 200 and 503 outcomes, sourced from
        WarmupService.get_vector_dim() (a config-value getter that does not
        require is_ready=True, unlike get_model()/get_device()/get_tokenizer()).
        """
        health = warmup_svc.health_check()
        vector_dim = warmup_svc.get_vector_dim()

        if not health["is_ready"]:
            raise HTTPException(
                status_code=503,
                detail={
                    "status": "not_ready",
                    "reason": "Model not loaded or warm-up failed",
                    "health": health
                },
                headers={"X-Expected-Vector-Dim": str(vector_dim)},
            )

        response.headers["X-Expected-Vector-Dim"] = str(vector_dim)
        return {
            "status": "ready",
            "service": "ai_inference",
            "health": health
        }

    @router.get("/debug")
    async def debug_info(warmup_svc: WarmupService = Depends(get_warmup_service)):
        """Debug endpoint: return full warmup service state."""
        return warmup_svc.health_check()

    return router

__all__ = ["create_warmup_router",]