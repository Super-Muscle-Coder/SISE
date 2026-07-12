"""
Upload Workflow Entities (Pydantic Schemas)

This module defines request/response schemas for the upload pipeline (S1-S3).
All schemas align with openapi.yaml and data_schema.yaml constraints.

Constraints enforced:
- max_file_size_mb: 20
- allowed_content_types: [image/jpeg, image/png]
- presigned_url_expiry_sec: 3600
- privacy_level: 0 (Private), 1 (Friends), 2 (Public)
"""

from datetime import datetime
from enum import IntEnum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class PrivacyLevel(IntEnum):
    """Privacy level enum per data_schema.yaml"""
    PRIVATE = 0
    FRIENDS = 1
    PUBLIC = 2


class PresignedUploadRequest(BaseModel):
    """
    Request schema for POST /media/upload-url (S1: Presigned URL generation)
    """
    filename: str = Field(..., min_length=1, max_length=255, description="Filename (e.g., 'vacation.jpg')")
    content_type: str = Field(..., description="MIME type (image/jpeg, image/png)")
    expected_size_mb: Optional[int] = Field(None, ge=1, le=20, description="Expected file size in MB")

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        allowed = {"image/jpeg", "image/png"}
        if v not in allowed:
            raise ValueError(f"content_type must be one of {allowed}, got {v}")
        return v

    @field_validator("expected_size_mb")
    @classmethod
    def validate_file_size(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v > 20:
            raise ValueError(f"expected_size_mb must be ≤ 20 MB, got {v}")
        return v

    model_config = {"from_attributes": True}


class PresignedUploadResponse(BaseModel):
    """
    Response schema for POST /media/upload-url (200 OK, and 409 duplicate idempotency).
    """
    upload_url: str = Field(..., description="Presigned PUT URL for direct MinIO upload")
    object_key: str = Field(..., description="MinIO object key (e.g., raw-images/42/uuid/vacation.jpg)")
    expires_in_sec: int = Field(default=3600, description="URL expiry in seconds")
    max_file_size_mb: int = Field(default=20, description="Max file size allowed")
    allowed_content_types: List[str] = Field(
        default=["image/jpeg", "image/png"],
        description="Allowed MIME types",
    )
    note: str = Field(
        default="Upload within 1 hour and respect allowed_content_types.",
        description="User guidance",
    )

    model_config = {"from_attributes": True}


class UploadConfirmRequest(BaseModel):
    """
    Request schema for POST /media/upload/confirm (S3 metadata commit).
    """
    object_key: str = Field(..., description="MinIO object key from presigned upload (S1)")
    album_id: int = Field(..., ge=1, description="Album ID")
    privacy_level: PrivacyLevel = Field(
        ...,
        description="Privacy level: 0=Private, 1=Friends, 2=Public",
    )
    tags: Optional[List[str]] = Field(
        default=None,
        max_length=10,
        description="Optional tags (max 10)",
    )

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        for tag in v:
            if not isinstance(tag, str) or len(tag) == 0 or len(tag) > 50:
                raise ValueError(f"Each tag must be 1-50 characters, got '{tag}'")
        return v

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    """
    Response schema for:
    - POST /media/upload (201)
    - POST /media/upload/confirm (200)
    - corresponding 409 duplicate idempotency responses.
    """
    image_id: str = Field(..., description="Unique image identifier (UUID)", json_schema_extra={"format": "uuid"})
    minio_url: str = Field(..., description="MinIO access URL (presigned)", json_schema_extra={"format": "uri"})
    status: str = Field(default="pending", description="Media status (pending, ready, failed)")
    index_status: str = Field(
        default="pending",
        description="Vector indexing status: pending/ready/failed",
    )

    model_config = {"from_attributes": True}


class ImageMetadata(BaseModel):
    """
    Image metadata schema (kept for future media workflow).
    """
    image_id: str = Field(..., description="Image UUID", json_schema_extra={"format": "uuid"})
    user_id: int = Field(..., ge=1, description="Owner user ID")
    album_id: Optional[int] = Field(None, ge=1, description="Album ID (optional)")
    minio_url: str = Field(..., description="MinIO presigned GET URL", json_schema_extra={"format": "uri"})
    privacy_level: PrivacyLevel = Field(..., description="Privacy level: 0=Private, 1=Friends, 2=Public")
    tags: Optional[List[str]] = Field(default=None, description="Associated tags")
    created_at: datetime = Field(..., description="Creation timestamp")
    index_status: str = Field(default="pending", description="Vector DB index status")

    model_config = {"from_attributes": True}


class ImageMetadataList(BaseModel):
    """Paginated response for GET /media (kept for future media workflow)."""
    items: List[ImageMetadata] = Field(..., description="List of image metadata")
    total: int = Field(..., ge=0, description="Total count of images")
    offset: int = Field(default=0, ge=0, description="Query offset")
    limit: int = Field(default=20, ge=1, le=100, description="Query limit")

    model_config = {"from_attributes": True}


__all__ = [
    "PrivacyLevel",
    "PresignedUploadRequest",
    "PresignedUploadResponse",
    "UploadConfirmRequest",
    "UploadResponse",
    "ImageMetadata",
    "ImageMetadataList",
]