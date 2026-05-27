"""
Entities Layer: Domain models for scaffold, auth, and upload workflows.
Exported by workflow for use in adapters and services.
"""

from .scaffold_entities import (
    AppConfig,
    DatabaseConfig,
    StorageConfig,
    VectorConfig,
    CacheConfig,
    AuthConfig,
)
from .auth_entities import (
    User,
    RegisterRequest,
    AuthRequest,
    AuthResponse,
    TokenPayload,
)
from .upload_entities import (
    PrivacyLevel,
    PresignedUploadRequest,
    PresignedUploadResponse,
    UploadConfirmRequest,
    UploadResponse,
    ImageMetadata,
    ImageMetadataList,
)

__all__ = [
    "AppConfig",
    "DatabaseConfig",
    "StorageConfig",
    "VectorConfig",
    "CacheConfig",
    "AuthConfig",
    "User",
    "RegisterRequest",
    "AuthRequest",
    "AuthResponse",
    "TokenPayload",
    "PrivacyLevel",
    "PresignedUploadRequest",
    "PresignedUploadResponse",
    "UploadConfirmRequest",
    "UploadResponse",
    "ImageMetadata",
    "ImageMetadataList",
]
