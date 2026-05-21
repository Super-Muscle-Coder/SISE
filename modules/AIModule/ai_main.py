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
  DEVICE=auto
  MODEL_CACHE_DIR=./models
  WARMUP_ITERATIONS=5
  WARMUP_TIMEOUT_SEC=30
  IMAGE_TARGET_SIZE=224
  IMAGE_ENABLE_CACHE=False
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
    return CLIPConfig(
        model_name=_get_required_env("CLIP_MODEL_NAME"),
        device=_get_required_env("DEVICE"),
        model_cache_dir=_get_required_env("MODEL_CACHE_DIR"),
        warmup_iterations=_get_int_env("WARMUP_ITERATIONS", default=5),
        warmup_timeout_sec=_get_float_env("WARMUP_TIMEOUT_SEC", default=30.0),
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
    return ImagePreprocessConfig(target_size=target_size)


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

    return TextProcessConfig(
        max_tokens=max_tokens,
        tokenizer_name=tokenizer_name,
        enable_cache=enable_cache,
        truncate_strategy=truncate_strategy,
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

    return BatchEmbeddingConfig(
        max_batch_size=max_batch_size,
        enable_cache=enable_cache,
        cache_ttl_seconds=cache_ttl_seconds,
        timeout_ms=timeout_ms,
        vector_dim=512,
    )


# ============================================================================

# Global service instances (will be initialized on startup)
warmup_service: WarmupService = None
image_embedding_service: ImageEmbeddingService = None
text_embedding_service: TextEmbeddingService = None
batch_embedding_service: BatchEmbeddingService = None


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

    Shutdown (on graceful close):
      - Clean up resources
    """
    global warmup_service, image_embedding_service, text_embedding_service, batch_embedding_service

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
    warmup_service = None
    image_embedding_service = None
    text_embedding_service = None
    batch_embedding_service = None


# ============================================================================
# FastAPI Application Factory
# ============================================================================

def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.

    Initializes:
      1. Warmup workflow router (health checks)
      2. Image embedding workflow router (POST /inference/embed/image)
      3. Text embedding workflow router (POST /inference/embed/text)
      4. Batch embedding workflow router (POST /inference/embed/batch)

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
    _load_env_file()  # Load environment
    temp_warmup_config = _build_warmup_config()
    temp_warmup_service = WarmupService(temp_warmup_config)
    warmup_router = create_warmup_router(temp_warmup_service)
    app.include_router(warmup_router)

    # ===== Include Image Embedding Router =====
    # This registers POST /inference/embed/image
    # Create a temporary image embedding service for router setup
    temp_image_config = _build_image_embedding_config()
    temp_image_service = ImageEmbeddingService(temp_warmup_service, temp_image_config)
    image_router = create_image_embedding_router(temp_image_service)
    app.include_router(image_router)

    # ===== Include Text Embedding Router =====
    # This registers POST /inference/embed/text
    # Create a temporary text embedding service for router setup
    temp_text_config = _build_text_embedding_config()
    temp_text_service = TextEmbeddingService(temp_warmup_service, temp_text_config)
    text_router = create_text_embedding_router(temp_text_service)
    app.include_router(text_router)

    # ===== Include Batch Embedding Router =====
    # This registers POST /inference/embed/batch
    # Create a temporary batch embedding service for router setup
    temp_batch_config = _build_batch_embedding_config()
    temp_batch_service = BatchEmbeddingService(temp_warmup_service, temp_image_service, temp_batch_config)
    batch_router = create_batch_embedding_router(temp_batch_service)
    app.include_router(batch_router)

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

