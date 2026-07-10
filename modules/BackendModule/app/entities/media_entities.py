"""
Media Workflow Entities (Request/Response Schemas)

Pydantic schemas for Album and Image CRUD operations.
Per openapi.yaml and data_schema.yaml.

Constraints:
- soft_delete: Use deleted_at timestamp (NULL = active)
- privacy_level: 0 (Private), 1 (Friends), 2 (Public)
- tags: JSONB array of strings
"""

from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class PrivacyLevel(int, Enum):
    """Privacy level enumeration per openapi.yaml and data_schema.yaml.

    - 0: Private (only owner can access)
    - 1: Friends (owner + friends can access)
    - 2: Public (anyone can access)
    """
    PRIVATE = 0
    FRIENDS = 1
    PUBLIC = 2


# ============================================================================
# ALBUM SCHEMAS
# ============================================================================

class AlbumCreateRequest(BaseModel):
    """Request schema for creating a new album."""
    title: str = Field(..., min_length=1, max_length=100, description="Album title")
    description: Optional[str] = Field(None, max_length=500, description="Album description")
    is_public: bool = Field(False, description="Whether album is publicly visible")


class AlbumUpdateRequest(BaseModel):
    """Request schema for updating an album."""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None


class AlbumResponse(BaseModel):
    """Response schema for album details."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Album ID")
    user_id: int = Field(..., description="Owner user ID")
    title: str = Field(..., description="Album title")
    description: Optional[str] = Field(None, description="Album description")
    is_public: bool = Field(..., description="Public visibility flag")
    created_at: datetime = Field(..., description="Creation timestamp")
    deleted_at: Optional[datetime] = Field(None, description="Soft delete timestamp (NULL = active)")


class AlbumListResponse(BaseModel):
    """Response schema for album list."""
    items: List[AlbumResponse] = Field(..., description="List of albums")
    total: int = Field(..., description="Total number of albums")
    offset: int = Field(..., description="Pagination offset")
    limit: int = Field(..., description="Pagination limit")


# ============================================================================
# IMAGE/MEDIA SCHEMAS
# ============================================================================

class ImageUpdateMetadataRequest(BaseModel):
    """Request schema for updating image metadata."""
    album_id: Optional[int] = Field(None, description="Album ID (move image)")
    privacy_level: Optional[int] = Field(
        None,
        ge=0,
        le=2,
        description="Privacy level: 0=Private, 1=Friends, 2=Public"
    )
    tags: Optional[List[str]] = Field(None, description="Array of tags")


class ImageMetadata(BaseModel):
    """Image metadata response schema."""
    model_config = ConfigDict(from_attributes=True)

    image_id: str = Field(..., description="Image UUID")
    user_id: int = Field(..., description="Owner user ID")
    album_id: Optional[int] = Field(None, description="Album ID")
    minio_url: str = Field(..., description="MinIO URL")
    privacy_level: int = Field(..., ge=0, le=2, description="Privacy level")
    tags: Optional[List[str]] = Field(None, description="Tags array")
    created_at: datetime = Field(..., description="Creation timestamp")
    index_status: str = Field(..., description="Index status: pending/ready/failed")


class ImageListResponse(BaseModel):
    """Response schema for image list."""
    items: List[ImageMetadata] = Field(..., description="List of images")
    total: int = Field(..., description="Total number of images")
    offset: int = Field(..., description="Pagination offset")
    limit: int = Field(..., description="Pagination limit")


__all__ = [
    "PrivacyLevel",
    "AlbumCreateRequest",
    "AlbumUpdateRequest",
    "AlbumResponse",
    "AlbumListResponse",
    "ImageUpdateMetadataRequest",
    "ImageMetadata",
    "ImageListResponse",
]