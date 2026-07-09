"""
Storage Vector workflow entities.
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, model_validator

from .upload_entities import ImageMetadata


class FilterExpression(BaseModel):
    and_: Optional[list["FilterExpression"]] = Field(default=None, alias="and")
    or_: Optional[list["FilterExpression"]] = Field(default=None, alias="or")
    field: Optional[str] = None
    op: Optional[Literal["eq", "in", "gt", "lt", "contains"]] = None
    value: Optional[int | str | list[int | str]] = None

    @model_validator(mode="after")
    def validate_one_of_shape(self) -> "FilterExpression":
        has_and = self.and_ is not None
        has_or = self.or_ is not None
        has_leaf = self.field is not None or self.op is not None or self.value is not None

        modes = sum([has_and, has_or, has_leaf])
        if modes != 1:
            raise ValueError("FilterExpression must be exactly one of: {and}, {or}, or {field, op, value}")

        if has_and:
            if not self.and_:
                raise ValueError("'and' must be a non-empty array")
        elif has_or:
            if not self.or_:
                raise ValueError("'or' must be a non-empty array")
        else:
            if self.field is None or self.op is None or self.value is None:
                raise ValueError("Leaf filter requires field, op, and value")

        return self

    model_config = {"populate_by_name": True, "from_attributes": True}


FilterExpression.model_rebuild()


class IndexVectorRequest(BaseModel):
    image_id: str = Field(..., description="Image ID (UUID)")
    vector: list[float]
    metadata: Optional[ImageMetadata] = None

    model_config = {"from_attributes": True}


class IndexVectorResponse(BaseModel):
    status: Literal["completed"] = "completed"
    job_id: Optional[str] = None

    model_config = {"from_attributes": True}


class SearchHybridRequest(BaseModel):
    vector: list[float]
    top_k: int = Field(default=10, ge=1)
    metric: Literal["COSINE"] = "COSINE"
    filter: Optional[FilterExpression] = None

    model_config = {"populate_by_name": True, "from_attributes": True}


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
    "FilterExpression",
    "IndexVectorRequest",
    "IndexVectorResponse",
    "SearchHybridRequest",
    "SearchResultItem",
    "SearchResponse",
]