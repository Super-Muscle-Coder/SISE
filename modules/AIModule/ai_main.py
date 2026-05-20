"""
AI Inference Service — Main Entry Point

FastAPI application for CLIP-based image & text embedding.

Architecture:
  5-Layer Workflow-Centric: configs → entities → adapters → services → routers

Workflows (Phase 2):
  T002-01: [workflow:warmup] — Model loading & warm-up ✅ IN PROGRESS
  T002-02: [workflow:image_embedding] — Image preprocessing pipeline
  T002-03: [workflow:image_embedding] — POST /embed/image endpoint
  T002-04: [workflow:text_embedding] — POST /embed/text endpoint
  T002-05: [workflow:batch_embedding] — Batch embedding endpoint
  T002-06: [workflow:ai_container] — Docker container

Environment Variables (from ai.env.local):
  AI_SERVICE_PORT=8001
  CLIP_MODEL_NAME=ViT-B/32
  DEVICE=auto
  MODEL_CACHE_DIR=./models
  WARMUP_ITERATIONS=5
  WARMUP_TIMEOUT_SEC=30
"""

import os
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Import components from app package layers
from app import CLIPConfig, WarmupService, create_warmup_router


# ============================================================================
# Configuration Loading (Environment Management)
# ============================================================================

def load_warmup_config(env_file: str = None) -> CLIPConfig:
    """
    Load warmup configuration from environment variables or .env file.

    This function is defined at the entrypoint (ai_main.py) because:
    - Environment configuration is managed at the application level
    - Allows easy override and testing of env vars
    - Central management of all configuration parameters

    Args:
        env_file: Optional path to .env file (e.g., 'configs/ai.env.local').
                 If None, automatically finds ai.env.local or ai.env.example.

    Returns:
        CLIPConfig instance with loaded values.
    """
    # Auto-discover env file if not provided
    if env_file is None:
        base_dir = Path(__file__).parent / "configs"
        env_file_local = base_dir / "ai.env.local"
        env_file_example = base_dir / "ai.env.example"

        if env_file_local.exists():
            env_file = str(env_file_local)
        elif env_file_example.exists():
            env_file = str(env_file_example)
        else:
            env_file = None

    # Load environment variables from file
    if env_file and os.path.exists(env_file):
        from dotenv import load_dotenv
        load_dotenv(env_file)

    # Read configuration from environment (with defaults matching ai.env.example)
    return CLIPConfig(
        model_name=os.getenv("CLIP_MODEL_NAME", "ViT-B/32"),
        device=os.getenv("DEVICE", "auto"),
        model_cache_dir=os.getenv("MODEL_CACHE_DIR", "./models"),
        warmup_iterations=int(os.getenv("WARMUP_ITERATIONS", "5")),
        warmup_timeout_sec=float(os.getenv("WARMUP_TIMEOUT_SEC", "30.0")),
    )


# ============================================================================
# Application Lifecycle
# ============================================================================

# Global warmup service instance (will be initialized on startup)
warmup_service: WarmupService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context: manage startup & shutdown events.

    Startup (before first request):
      - Load CLIP model
      - Run warm-up
      - Set model to eval() mode

    Shutdown (on graceful close):
      - Clean up resources
    """
    global warmup_service

    # ===== STARTUP =====
    print("\n" + "=" * 70)
    print("🚀 AI Inference Service Startup")
    print("=" * 70)

    try:
        # Load configuration from environment
        env_file = Path(__file__).parent / "configs" / "ai.env.local"
        if not env_file.exists():
            env_file = Path(__file__).parent / "configs" / "ai.env.example"

        print(f"📝 Loading config from: {env_file}")
        config = load_warmup_config(str(env_file))

        # Initialize warmup service
        warmup_service = WarmupService(config)

        # Run initialization & warm-up
        result = await asyncio.to_thread(warmup_service.initialize_and_warmup)

        if not result.success:
            raise RuntimeError(f"Warm-up failed: {result.error_message}")

        print("\n✅ AI Service ready\n")

    except Exception as e:
        print(f"\n❌ Startup failed: {e}\n")
        raise

    # ===== REQUEST HANDLING =====
    yield

    # ===== SHUTDOWN =====
    print("\n🛑 AI Service Shutdown\n")
    warmup_service = None


# ============================================================================
# FastAPI Application Factory
# ============================================================================

def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.

    Returns:
        Configured FastAPI instance
    """
    app = FastAPI(
        title="AI Inference Service",
        description="CLIP-based multimodal embedding extraction",
        version="0.1.0",
        lifespan=lifespan
    )

    # ===== Include Warmup Router =====
    # This registers /health/liveness, /health/readiness, /health/debug
    # Create a temporary warmup service for router setup
    temp_config = load_warmup_config()
    temp_service = WarmupService(temp_config)
    warmup_router = create_warmup_router(temp_service)
    app.include_router(warmup_router)

    # ===== Root Endpoint =====
    @app.get("/")
    async def root():
        """Root endpoint: API info."""
        return {
            "service": "AI Inference",
            "version": "0.1.0",
            "endpoints": {
                "health": {
                    "liveness": "GET /health/liveness",
                    "readiness": "GET /health/readiness"
                },
                "future": {
                    "image_embedding": "POST /inference/embed/image (T002-03)",
                    "text_embedding": "POST /inference/embed/text (T002-04)"
                }
            },
            "docs": "/docs"
        }

    # ===== Error Handlers =====
    @app.exception_handler(RuntimeError)
    async def runtime_error_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={"code": "ERR_INTERNAL", "message": str(exc)}
        )

    return app


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Read port from environment
    port = int(os.getenv("AI_SERVICE_PORT", "8001"))

    print(f"\n🚀 Starting AI Inference Service on port {port}...\n")

    app = create_app()

    # Run with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

