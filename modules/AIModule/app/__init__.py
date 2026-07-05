"""
AI Inference Service — FastAPI Application Package

Organized by workflow-centric 5-layer architecture:
  configs → entities → adapters → services → routers

Workflows:
  T002-01: warmup — Model loading & warm-up
  T002-02: image_embedding — Image preprocessing & embedding extraction
  T002-04: text_embedding — Text encoding
  ... (more workflows in Phase 2)

Import Strategy:
  - Entities layer: pure dataclasses only
  - Adapters layer: low-level integrations (utilities, tools)
  - Services layer: business logic & orchestration
  - Routers layer: FastAPI endpoints
  - Main (ai_main.py): environment loading & app initialization
"""

# Layer Exports (component-based workflow organization)
from app.entities import (
    CLIPConfig, WarmupResult,
    ImagePreprocessConfig, ImageEmbeddingResult,
    TextEmbeddingRequest, TextEmbeddingResult, TextProcessConfig,
    BatchEmbeddingConfig, BatchEmbeddingRequest, BatchEmbeddingResult,
)
from app.adapters import (
    DeviceManager, CLIPModelLoader, WarmupExecutor,
    ImageValidator, ImagePreprocessor, VectorNormalizer,
    TextValidator, TextTokenizer,
    BatchValidator, BatchPreprocessor,
)
from app.services import WarmupService, ImageEmbeddingService, TextEmbeddingService, BatchEmbeddingService
from app.routers import (
    create_warmup_router,
    create_image_embedding_router,
    create_text_embedding_router,
    create_batch_embedding_router,
)

__version__ = "1.1.0"
__all__ = [
    # Entities — Warmup
    "CLIPConfig",
    "WarmupResult",
    # Entities — Image embedding
    "ImagePreprocessConfig",
    "ImageEmbeddingRequest",
    "ImageEmbeddingResult",
    # Entities — Text embedding
    "TextEmbeddingRequest",
    "TextEmbeddingResult",
    "TextProcessConfig",
    # Entities — Batch embedding
    "BatchEmbeddingConfig",
    "BatchEmbeddingRequest",
    "BatchEmbeddingResult",

    # Adapters — Warmup
    "DeviceManager",
    "CLIPModelLoader",
    "WarmupExecutor",
    # Adapters — Image embedding
    "ImageValidator",
    "ImagePreprocessor",
    "VectorNormalizer",
    # Adapters — Text embedding
    "TextValidator",
    "TextTokenizer",
    # Adapters — Batch embedding
    "BatchValidator",
    "BatchPreprocessor",

    # Services
    "WarmupService",
    "ImageEmbeddingService",
    "TextEmbeddingService",
    "BatchEmbeddingService",

    # Routers
    "create_warmup_router",
    "create_image_embedding_router",
    "create_text_embedding_router",
    "create_batch_embedding_router",
]

