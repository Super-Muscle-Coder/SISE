"""
AI Inference Service — Main Entry Point

FastAPI application for CLIP-based image & text embedding.

Architecture:
  5-Layer Workflow-Centric: configs → entities → adapters → services → routers

Workflows (Phase 2):
  T002-01: [workflow:warmup] — Model loading & warm-up COMPLETE
  T002-02: [workflow:image_embedding] — Image preprocessing pipeline COMPLETE
  T002-03: [workflow:image_embedding] — POST /embed/image endpoint (T002-02 includes this)
  T002-04: [workflow:text_embedding] — POST /embed/text endpoint
  T002-05: [workflow:batch_embedding] — Batch embedding endpoint
  T002-06: [workflow:ai_container] — Docker container

Environment Variables (from ai.env.local):
  AI_SERVICE_PORT=8001
  CLIP_MODEL_NAME=ViT-B/32
  CLIP_PRETRAINED_TAG=openai
  DEVICE=auto
  MODEL_CACHE_DIR=./models
  VECTOR_DIM=512
  WARMUP_ITERATIONS=5
  WARMUP_TIMEOUT_SEC=30
  IMAGE_TARGET_SIZE=224
  IMAGE_ENABLE_CACHE=False

Dependency Injection (T006-02 remediation):
  Services are constructed exactly once in `lifespan()` and published onto
  `app.state`. Routers resolve them per-request via FastAPI Depends()
  (see app/routers/*.py get_*_service() functions), never via closures bound
  at router-registration time. This eliminates the previous "temp_*" service
  pattern in create_app(), which never called initialize_and_warmup() and
  caused is_ready to be permanently False (openapi.yaml /health/readiness
  contract violation).
"""

import os
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Import components from app package layers
from app import (
    CLIPConfig,
    ImagePreprocessConfig,
    TextProcessConfig,
    BatchEmbeddingConfig,
    WarmupService,
    ImageEmbeddingService,
    TextEmbeddingService,
    BatchEmbeddingService,
    create_warmup_router,
    create_image_embedding_router,
    create_text_embedding_router,
    create_batch_embedding_router,
)


# ============================================================================
# Configuration Loading & Validation
# ============================================================================

def _get_required_env(name: str) -> str:
    """
    Get required environment variable.

    Args:
        name: Environment variable name

    Returns:
        Value of the environment variable

    Raises:
        RuntimeError: If variable is not set
    """
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}.")
    return value


def _get_int_env(name: str, default: int = None) -> int:
    """
    Get integer environment variable.

    Args:
        name: Environment variable name
        default: Default value if not set

    Returns:
        Integer value

    Raises:
        RuntimeError: If required but not set
    """
    value = os.getenv(name)
    if value is None:
        if default is not None:
            return default
        raise RuntimeError(f"Missing required environment variable: {name}.")
    return int(value)


def _get_float_env(name: str, default: float = None) -> float:
    """
    Get float environment variable.

    Args:
        name: Environment variable name
        default: Default value if not set

    Returns:
        Float value

    Raises:
        RuntimeError: If required but not set
    """
    value = os.getenv(name)
    if value is None:
        if default is not None:
            return default
        raise RuntimeError(f"Missing required environment variable: {name}.")
    return float(value)


def _get_bool_env(name: str, default: bool = None) -> bool:
    """
    Get boolean environment variable.

    Args:
        name: Environment variable name
        default: Default value if not set

    Returns:
        Boolean value

    Raises:
        RuntimeError: If required but not set
    """
    value = os.getenv(name)
    if value is None:
        if default is not None:
            return default
        raise RuntimeError(f"Missing required environment variable: {name}.")
    return value.lower() in ("true", "1", "yes", "on")


def _load_env_file(env_file: str = None) -> None:
    """
    Load environment variables from .env file.

    Args:
        env_file: Path to .env file. If None, auto-discovers ai.env.local or ai.env.example.
    """
    if env_file is None:
        base_dir = Path(__file__).parent / "configs"
        env_file_local = base_dir / "ai.env.local"
        env_file_example = base_dir / "ai.env.example"

        if env_file_local.exists():
            env_file = str(env_file_local)
        elif env_file_example.exists():
            env_file = str(env_file_example)
        else:
            return  # No env file found, use system environment

    if os.path.exists(env_file):
        from dotenv import load_dotenv
        load_dotenv(env_file)


def _build_warmup_config() -> CLIPConfig:
    """
    Build warmup configuration from environment variables.

    All values are read from environment (loaded from .env file by _load_env_file).

    Returns:
        CLIPConfig instance with validated values

    Raises:
        RuntimeError: If required env vars are missing
    """
    pretrained = _get_required_env("CLIP_PRETRAINED_TAG") if os.getenv("CLIP_PRETRAINED_TAG") else "openai"

    return CLIPConfig(
        model_name=_get_required_env("CLIP_MODEL_NAME"),
        device=_get_required_env("DEVICE"),
        model_cache_dir=_get_required_env("MODEL_CACHE_DIR"),
        warmup_iterations=_get_int_env("WARMUP_ITERATIONS", default=5),
        warmup_timeout_sec=_get_float_env("WARMUP_TIMEOUT_SEC", default=30.0),
        vector_dim=_get_int_env("VECTOR_DIM", default=512),
        pretrained=pretrained,
    )


def _build_image_embedding_config() -> ImagePreprocessConfig:
    """
    Build image embedding configuration from environment variables.

    All values are read from environment (loaded from .env file by _load_env_file).

    Returns:
        ImagePreprocessConfig instance with validated values

    Raises:
        RuntimeError: If required env vars are missing
    """
    target_size = _get_int_env("IMAGE_TARGET_SIZE", default=224)
    vector_dim = _get_int_env("VECTOR_DIM", default=512)
    return ImagePreprocessConfig(target_size=target_size, vector_dim=vector_dim)


def _build_text_embedding_config() -> TextProcessConfig:
    """
    Build text embedding configuration from environment variables.

    All values are read from environment (loaded from .env file by _load_env_file).

    Returns:
        TextProcessConfig instance with validated values

    Raises:
        RuntimeError: If required env vars are missing
    """
    max_tokens = _get_int_env("TEXT_MAX_TOKENS", default=77)
    tokenizer_name = _get_required_env("TEXT_TOKENIZER_NAME") if os.getenv("TEXT_TOKENIZER_NAME") else "clip"
    enable_cache = _get_bool_env("TEXT_ENABLE_CACHE", default=False)
    truncate_strategy = _get_required_env("TEXT_TRUNCATE_STRATEGY") if os.getenv("TEXT_TRUNCATE_STRATEGY") else "truncate"
    vector_dim = _get_int_env("VECTOR_DIM", default=512)

    return TextProcessConfig(
        max_tokens=max_tokens,
        tokenizer_name=tokenizer_name,
        enable_cache=enable_cache,
        truncate_strategy=truncate_strategy,
        vector_dim=vector_dim,
    )


def _build_batch_embedding_config() -> BatchEmbeddingConfig:
    """
    Build batch embedding configuration from environment variables.

    All values are read from environment (loaded from .env file by _load_env_file).

    Returns:
        BatchEmbeddingConfig instance with validated values

    Raises:
        RuntimeError: If required env vars are missing
    """
    max_batch_size = _get_int_env("BATCH_MAX_SIZE", default=32)
    enable_cache = _get_bool_env("BATCH_ENABLE_CACHE", default=False)
    cache_ttl_seconds = _get_int_env("BATCH_CACHE_TTL_SECONDS", default=3600)
    timeout_ms = _get_int_env("BATCH_TIMEOUT_MS", default=10000)
    vector_dim = _get_int_env("VECTOR_DIM", default=512)

    return BatchEmbeddingConfig(
        max_batch_size=max_batch_size,
        enable_cache=enable_cache,
        cache_ttl_seconds=cache_ttl_seconds,
        timeout_ms=timeout_ms,
        vector_dim=vector_dim,
    )


# ============================================================================
# FastAPI Lifespan — single source of truth for service construction
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context: manage startup & shutdown events.

    Startup (before first request):
      - Load environment variables from .env file
      - Load configuration from environment (values read-only, never exposed)
      - Initialize CLIP model (warmup workflow)
      - Initialize image embedding service (image_embedding workflow)
      - Initialize text embedding service (text_embedding workflow)
      - Initialize batch embedding service (batch_embedding workflow)
      - Run warm-up
      - Set model to eval() mode
      - Publish every service onto app.state so routers can resolve them
        per-request via FastAPI Depends() (see app/routers/*.py)

    Shutdown (on graceful close):
      - Clean up resources
    """
    # ===== STARTUP =====
    print("\n" + "=" * 70)
    print("AI Inference Service Startup")
    print("=" * 70)

    try:
        # Step 1: Load environment from .env file
        env_file = Path(__file__).parent / "configs" / "ai.env.local"
        if not env_file.exists():
            env_file = Path(__file__).parent / "configs" / "ai.env.example"

        print(f"Loading environment from: {env_file.name}")
        _load_env_file(str(env_file))

        # Step 2: Build warmup configuration from environment (values read only, not exposed)
        print("\n[1/3] Building warmup configuration...")
        warmup_config = _build_warmup_config()
        print(f"   ✓ Model configured (from environment)")
        print(f"   ✓ Device auto-detection enabled")

        # Step 3: Initialize warmup service
        print("[2/3] Initializing warmup service...")
        warmup_service = WarmupService(warmup_config)

        # Step 4: Run initialization & warm-up
        result = await asyncio.to_thread(warmup_service.initialize_and_warmup)

        if not result.success:
            raise RuntimeError(f"Warm-up failed: {result.error_message}")

        # Step 5: Build image embedding configuration from environment
        print("\n[3/4] Building image embedding configuration...")
        image_config = _build_image_embedding_config()
        print(f"   ✓ Image preprocessing configured (from environment)")

        # Step 6: Initialize image embedding service
        image_embedding_service = ImageEmbeddingService(warmup_service, image_config)
        print(f"   ✓ Image embedding service ready")

        # Step 7: Build text embedding configuration from environment
        print("\n[4/5] Building text embedding configuration...")
        text_config = _build_text_embedding_config()
        print(f"   ✓ Text processing configured (from environment)")

        # Step 8: Initialize text embedding service
        text_embedding_service = TextEmbeddingService(warmup_service, text_config)
        print(f"   ✓ Text embedding service ready")

        # Step 9: Build batch embedding configuration from environment
        print("\n[5/6] Building batch embedding configuration...")
        batch_config = _build_batch_embedding_config()
        print(f"   ✓ Batch processing configured (from environment)")

        # Step 10: Initialize batch embedding service
        batch_embedding_service = BatchEmbeddingService(warmup_service, image_embedding_service, batch_config)
        print(f"   ✓ Batch embedding service ready")

        # Step 11: Publish services on app.state for per-request Depends() resolution.
        # This is THE fix for issue 1.4 — routers read these via
        # get_warmup_service / get_image_embedding_service / get_text_embedding_service /
        # get_batch_embedding_service (see app/routers/*.py), so they always see
        # these exact, already-warmed-up instances.
        app.state.warmup_service = warmup_service
        app.state.image_embedding_service = image_embedding_service
        app.state.text_embedding_service = text_embedding_service
        app.state.batch_embedding_service = batch_embedding_service

        print("\n" + "=" * 70)
        print("AI Service Ready")
        print("=" * 70 + "\n")

    except Exception as e:
        print(f"\n❌ Startup failed: {e}\n")
        raise

    # ===== REQUEST HANDLING =====
    yield

    # ===== SHUTDOWN =====
    print("\nAI Service Shutdown\n")
    app.state.warmup_service = None
    app.state.image_embedding_service = None
    app.state.text_embedding_service = None
    app.state.batch_embedding_service = None


# ============================================================================
# FastAPI Application Factory
# ============================================================================

def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.

    Registers routers for:
      1. Warmup workflow (health checks: /health/liveness, /health/readiness, /health/debug)
      2. Image embedding workflow (POST /inference/embed/image)
      3. Text embedding workflow (POST /inference/embed/text)
      4. Batch embedding workflow (POST /inference/embed/batch)

    Dependency Injection (fix for issue 1.4):
      Routers no longer receive a service instance as a fixed parameter at
      registration time. Each router file defines its own get_*_service()
      FastAPI dependency, which reads the live instance from
      `request.app.state` at request time. Those app.state.* attributes are
      populated exactly once during the `lifespan` startup phase above. This
      removes the previous "temp_*" service pattern entirely (temp_warmup_service,
      temp_image_service, temp_text_service, temp_batch_service no longer exist),
      which used to bind routers to throwaway instances that never had
      initialize_and_warmup() called on them.

    Returns:
        Configured FastAPI instance
    """
    app = FastAPI(
        title="AI Inference Service",
        description="CLIP-based multimodal embedding extraction",
        version="0.1.0",
        lifespan=lifespan
    )

    # ===== Include Routers =====
    # Service resolution happens per-request via Depends() (see docstring above).
    # No config/service construction happens here anymore — lifespan() owns that.
    app.include_router(create_warmup_router())
    app.include_router(create_image_embedding_router())
    app.include_router(create_text_embedding_router())
    app.include_router(create_batch_embedding_router())

    # ===== Root Endpoint =====
    @app.get("/")
    async def root():
        """Root endpoint: API info."""
        return {
            "service": "AI Inference",
            "version": "0.1.0",
            "workflows": {
                "warmup": "T002-01 ✅",
                "image_embedding": "T002-02 ✅",
                "text_embedding": "T002-04 ✅",
                "batch_embedding": "T002-05 ✅",
            },
            "endpoints": {
                "health": {
                    "liveness": "GET /health/liveness",
                    "readiness": "GET /health/readiness",
                    "debug": "GET /health/debug"
                },
                "inference": {
                    "image_embedding": "POST /inference/embed/image",
                    "text_embedding": "POST /inference/embed/text",
                    "batch_embedding": "POST /inference/embed/batch",
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

    # Load environment first
    _load_env_file()

    # Read port from environment
    port = _get_int_env("AI_SERVICE_PORT", default=8001)

    print(f"\nStarting AI Inference Service on port {port}...\n")

    app = create_app()

    # Run with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )