"""
Search workflow entities: request/response schemas and validation.
Prefix: search_
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class MetricType(str, Enum):
    """Similarity metric for ANN search."""
    L2 = "L2"
    IP = "IP"
    COSINE = "COSINE"


class FilterExpressionLeaf(BaseModel):
    """Leaf node of recursive filter expression."""
    field: str = Field(..., description="Field name in metadata (e.g., privacy_level, user_id, tags)")
    op: str = Field(..., description="Operator: eq, in, gt, lt, contains")
    value: Any = Field(..., description="Value for comparison")


class FilterExpression(BaseModel):
    """Recursive boolean filter for metadata."""
    model_config = ConfigDict(populate_by_name=True)

    and_: Optional[List[Dict[str, Any]]] = Field(None, alias="and")
    or_: Optional[List[Dict[str, Any]]] = Field(None, alias="or")
    field: Optional[str] = None
    op: Optional[str] = None
    value: Optional[Any] = None


class SearchResultItem(BaseModel):
    """Individual search result item."""
    model_config = ConfigDict(from_attributes=True)

    image_id: str = Field(..., description="Image UUID (UUID format)")
    score: float = Field(..., description="Similarity score")
    minio_url: str = Field(..., description="Presigned MinIO URL")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Image metadata (user_id, album_id, tags, etc.)")


class SearchResponse(BaseModel):
    """Response schema for hybrid search endpoints."""
    results: List[SearchResultItem] = Field(..., description="List of search results")
    latency_ms: float = Field(..., description="Query latency in milliseconds")
    top_k: int = Field(..., description="Number of results returned")


class SearchByImageRequest(BaseModel):
    """Request schema for image search endpoint."""
    top_k: int = Field(10, description="Number of top results to return")
    metric: MetricType = Field(MetricType.COSINE, description="Similarity metric")
    album_id: Optional[int] = Field(None, description="Optional: filter results to specific album")


class SearchByTextRequest(BaseModel):
    """Request schema for text search endpoint."""
    query_text: str = Field(..., description="Text query for search")
    top_k: int = Field(10, description="Number of top results to return")
    metric: MetricType = Field(MetricType.COSINE, description="Similarity metric")
    album_id: Optional[int] = Field(None, description="Optional: filter results to specific album")


class VectorSearchRequest(BaseModel):
    """Internal request for vector/hybrid search."""
    vector: List[float] = Field(..., description="Query vector")
    top_k: int = Field(..., description="Number of top results")
    metric: MetricType = Field(..., description="Similarity metric")
    filter: Optional[Dict[str, Any]] = Field(None, description="Structured metadata filter")


__all__ = [
    "MetricType",
    "FilterExpressionLeaf",
    "FilterExpression",
    "SearchResultItem",
    "SearchResponse",
    "SearchByImageRequest",
    "SearchByTextRequest",
    "VectorSearchRequest",
]
