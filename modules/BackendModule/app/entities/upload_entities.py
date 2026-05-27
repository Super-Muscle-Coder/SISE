"""
Upload Workflow Entities (Pydantic Schemas)

This module defines request/response schemas for the upload pipeline (S1-S5).
All schemas align with openapi.yaml and data_schema.yaml constraints.

Constraints enforced:
- max_file_size_mb: 20
- allowed_content_types: [image/jpeg, image/png]
- presigned_url_expiry_sec: 3600
- privacy_level: 0 (Private), 1 (Friends), 2 (Public)
- vector_dim: 512 (ViT-B/32)
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import IntEnum


class PrivacyLevel(IntEnum):
    """Privacy level enum per data_schema.yaml"""
    PRIVATE = 0
    FRIENDS = 1
    PUBLIC = 2


class PresignedUploadRequest(BaseModel):
    """
    Request schema for POST /media/upload-url (S1: Presigned URL generation)

    Constraints:
    - filename: non-empty string
    - content_type: must be in allowed_content_types [image/jpeg, image/png]
    - expected_size_mb: optional hint for server-side validation
    """
    filename: str = Field(..., min_length=1, max_length=255, description="Filename (e.g., 'vacation.jpg')")
    content_type: str = Field(..., description="MIME type (image/jpeg, image/png)")
    expected_size_mb: Optional[int] = Field(None, ge=1, le=20, description="Expected file size in MB")

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        """Enforce allowed_content_types from data_schema.yaml"""
        allowed = {"image/jpeg", "image/png"}
        if v not in allowed:
            raise ValueError(f"content_type must be one of {allowed}, got {v}")
        return v

    @field_validator("expected_size_mb")
    @classmethod
    def validate_file_size(cls, v: Optional[int]) -> Optional[int]:
        """Enforce max_file_size_mb: 20 from data_schema.yaml"""
        if v is not None and v > 20:
            raise ValueError(f"expected_size_mb must be ≤ 20 MB, got {v}")
        return v

    model_config = {"from_attributes": True}


class PresignedUploadResponse(BaseModel):
    """
    Response schema for POST /media/upload-url success (200 OK)

    Matches openapi.yaml PresignedUploadResponse schema.
    """
    upload_url: str = Field(..., description="Presigned PUT URL for direct MinIO upload")
    object_key: str = Field(..., description="MinIO object key (e.g., raw-images/42/uuid/vacation.jpg)")
    expires_in_sec: int = Field(default=3600, description="URL expiry in seconds (per presigned_url_expiry_sec)")
    max_file_size_mb: int = Field(default=20, description="Max file size allowed")
    allowed_content_types: List[str] = Field(
        default=["image/jpeg", "image/png"],
        description="Allowed MIME types"
    )
    note: str = Field(
        default="Upload within 1 hour and respect allowed_content_types.",
        description="User guidance"
    )

    model_config = {"from_attributes": True}


class UploadConfirmRequest(BaseModel):
    """
    Request schema for POST /media/upload/confirm (S3: Metadata commit)

    Constraints:
    - object_key: must exist in MinIO (verified by backend)
    - album_id: optional, must reference existing album owned by user
    - privacy_level: 0, 1, or 2 per PrivacyLevel enum
    - tags: optional list of strings
    """
    object_key: str = Field(..., description="MinIO object key from presigned upload (S1)")
    album_id: Optional[int] = Field(None, ge=1, description="Album ID (optional)")
    privacy_level: PrivacyLevel = Field(
        default=PrivacyLevel.PRIVATE,
        description="Privacy level: 0=Private, 1=Friends, 2=Public"
    )
    tags: Optional[List[str]] = Field(
        default=None,
        max_length=10,
        description="Optional tags (max 10)"
    )

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Ensure tags are non-empty strings"""
        if v is None:
            return v
        for tag in v:
            if not isinstance(tag, str) or len(tag) == 0 or len(tag) > 50:
                raise ValueError(f"Each tag must be 1-50 characters, got '{tag}'")
        return v

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    """
    Response schema for POST /media/upload and POST /media/upload/confirm (201 Created)

    Matches openapi.yaml UploadResponse schema.
    Represents media after S3 (metadata committed but S4 may still be pending).
    """
    image_id: str = Field(..., format="uuid", description="Unique image identifier (UUID)")
    minio_url: str = Field(..., format="uri", description="MinIO access URL (presigned)")
    status: str = Field(default="pending", description="Media status (pending, ready, failed)")
    index_status: str = Field(
        default="pending",
        description="Vector indexing status: pending → ready (S5) or pending → failed (after max retries)"
    )

    model_config = {"from_attributes": True}


class ImageMetadata(BaseModel):
    """
    Represents complete image metadata (matches openapi.yaml ImageMetadata schema)

    Used in GET /media/{image_id} response and search result enrichment.
    Includes privacy filtering context for search queries.
    """
    image_id: str = Field(..., format="uuid", description="Image UUID")
    user_id: int = Field(..., ge=1, description="Owner user ID")
    album_id: Optional[int] = Field(None, ge=1, description="Album ID (optional)")
    minio_url: str = Field(..., format="uri", description="MinIO presigned GET URL")
    privacy_level: PrivacyLevel = Field(
        ...,
        description="Privacy level: 0=Private, 1=Friends, 2=Public"
    )
    tags: Optional[List[str]] = Field(default=None, description="Associated tags")
    created_at: datetime = Field(..., description="Creation timestamp")
    index_status: str = Field(
        default="pending",
        description="Vector DB index status: pending, ready, failed"
    )

    model_config = {"from_attributes": True}


class ImageMetadataList(BaseModel):
    """Paginated response for GET /media"""
    items: List[ImageMetadata] = Field(..., description="List of image metadata")
    total: int = Field(..., ge=0, description="Total count of images")
    offset: int = Field(default=0, ge=0, description="Query offset")
    limit: int = Field(default=20, ge=1, le=100, description="Query limit")

    model_config = {"from_attributes": True}


# Export public API
__all__ = [
    "PrivacyLevel",
    "PresignedUploadRequest",
    "PresignedUploadResponse",
    "UploadConfirmRequest",
    "UploadResponse",
    "ImageMetadata",
    "ImageMetadataList",
]
