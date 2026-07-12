"""
Batch Embedding Entities

Pure data structures for batch embedding workflow.
No business logic—only dataclasses and configuration.

Ownership: AG-01 (AIModuleAgent)
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class BatchEmbeddingConfig:
    """Configuration for batch embedding processing."""
    max_batch_size: int = 32
    enable_cache: bool = False
    cache_ttl_seconds: int = 3600
    timeout_ms: int = 10000
    vector_dim: int = 512  # data_schema.yaml -> global_configs.vector_dim


@dataclass
class BatchEmbeddingRequest:
    """Request payload for batch embedding extraction."""
    # Note: file_bytes and filenames are passed from router,
    # not part of the structured request body (multipart/form-data)
    pass


@dataclass
class BatchEmbeddingItem:
    """Per-image result item for batch embedding response."""
    index: int
    success: bool
    vector: List[float] | None = None
    error: str | None = None


@dataclass
class BatchEmbeddingResult:
    """Result of batch embedding extraction."""
    vectors: List[BatchEmbeddingItem] = field(default_factory=list)
    # List of per-item results, index-aligned with request files

    successful_count: int = 0
    # Number of images successfully processed

    failed_count: int = 0
    # Number of images that failed processing

    processing_time_ms: float = 0.0
    # Total processing time in milliseconds


# Export
__all__ = [
    "BatchEmbeddingConfig",
    "BatchEmbeddingRequest",
    "BatchEmbeddingItem",
    "BatchEmbeddingResult",
]