"""
Indexing workflow entities and exception contracts.
"""

from __future__ import annotations

from pydantic import BaseModel


class TransientIndexingError(Exception):
    """Temporary failure: should retry with backoff."""


class PermanentIndexingError(Exception):
    """Permanent failure: should not retry."""


class ImageIndexSource(BaseModel):
    image_id: str
    user_id: int
    username: str
    minio_object_name: str
    minio_bucket: str


class EmbeddingResult(BaseModel):
    vector: list[float]
    dim: int
    model: str


__all__ = [
    "TransientIndexingError",
    "PermanentIndexingError",
    "ImageIndexSource",
    "EmbeddingResult",
]