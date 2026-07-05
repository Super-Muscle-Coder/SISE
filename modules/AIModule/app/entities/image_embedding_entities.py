"""
Image Embedding Workflow — Entities Layer

Defines data structures for image preprocessing and embedding extraction.
Prefix: image_embedding_*

CONSTRAINT: This layer MUST contain only pure dataclasses (naive entities).
No business logic, no imports of workflow utilities, no I/O operations.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class ImagePreprocessConfig:
    """Configuration for image preprocessing pipeline."""
    target_size: int = 224  # CLIP standard size
    normalize_mean: tuple = (0.48145466, 0.4578275, 0.40821073)  # CLIP ImageNet mean
    normalize_std: tuple = (0.26862954, 0.26130258, 0.27577711)  # CLIP ImageNet std
    vector_dim: int = 512  # data_schema.yaml -> global_configs.vector_dim

@dataclass
class ImageEmbeddingResult:
    """Result structure for image embedding response."""
    success: bool
    vector: Optional[list] = None  # List of vector_dim float32 values
    vector_dimension: int = 512
    processing_time_ms: float = 0.0
    error_message: Optional[str] = None
    error_code: Optional[str] = None


# Export 
__all__ = [
    "ImagePreprocessConfig",
    "ImageEmbeddingResult",
]