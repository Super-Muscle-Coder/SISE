"""
Search workflow entities.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from .storage_vector_entities import FilterExpression
from .upload_entities import ImageMetadata


class MetricType(str, Enum):
    COSINE = "COSINE"


class SearchByImageRequest(BaseModel):
    top_k: int = Field(default=10, ge=1)
    metric: MetricType = Field(default=MetricType.COSINE)
    album_id: Optional[int] = Field(default=None, ge=1)

    model_config = {"from_attributes": True}


class SearchByTextRequest(BaseModel):
    query_text: str = Field(..., min_length=1)
    top_k: int = Field(default=10, ge=1)
    metric: MetricType = Field(default=MetricType.COSINE)
    album_id: Optional[int] = Field(default=None, ge=1)

    model_config = {"from_attributes": True}


class VectorSearchRequest(BaseModel):
    vector: list[float]
    top_k: int = Field(default=10, ge=1)
    metric: MetricType = Field(default=MetricType.COSINE)
    filter: Optional[FilterExpression] = None

    model_config = {"from_attributes": True}


class SearchResultItem(BaseModel):
    image_id: str
    score: float
    minio_url: str
    metadata: ImageMetadata

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    latency_ms: float
    top_k: int

    model_config = {"from_attributes": True}


__all__ = [
    "MetricType",
    "SearchByImageRequest",
    "SearchByTextRequest",
    "VectorSearchRequest",
    "SearchResultItem",
    "SearchResponse",
]