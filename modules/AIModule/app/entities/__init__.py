"""
Entities Layer — Data structures for all workflows.

Exports entity classes from workflow-specific modules using prefix convention.

CONSTRAINT: Entities layer exports only pure dataclasses, no logic functions.
"""

from app.entities.warmup_entities import CLIPConfig, WarmupResult
from app.entities.image_embedding_entities import (
    ImagePreprocessConfig,
    ImageEmbeddingResult,
)
from app.entities.text_embedding_entities import (
    TextEmbeddingRequest,
    TextEmbeddingResult,
    TextProcessConfig,
)
from app.entities.batch_embedding_entities import (
    BatchEmbeddingConfig,
    BatchEmbeddingRequest,
    BatchEmbeddingResult,
)

__all__ = [
    # Warmup workflow
    "CLIPConfig",
    "WarmupResult",
    # Image embedding workflow
    "ImagePreprocessConfig",
    "ImageEmbeddingResult",
    # Text embedding workflow
    "TextEmbeddingRequest",
    "TextEmbeddingResult",
    "TextProcessConfig",
    # Batch embedding workflow
    "BatchEmbeddingConfig",
    "BatchEmbeddingRequest",
    "BatchEmbeddingResult",
]
