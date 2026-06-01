"""
Entities Layer: Domain models for all workflows.
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
from .search_entities import (
    MetricType,
    FilterExpressionLeaf,
    FilterExpression,
    SearchResultItem,
    SearchResponse,
    SearchByImageRequest,
    SearchByTextRequest,
    VectorSearchRequest,
)
from .media_entities import (
    AlbumCreateRequest,
    AlbumUpdateRequest,
    AlbumResponse,
    AlbumListResponse,
    ImageUpdateMetadataRequest,
    ImageListResponse,
)
from .evaluation_entities import (
    EvaluationStatus,
    EvaluationRunRequest,
    EvaluationRunResponse,
    EvaluationMetrics,
    EvaluationResult,
    EvaluationResultResponse,
    EvaluationMetricsResponse,
)
from .health_entities import (
    DependencyState,
    HealthStatus,
    ReadinessCheckResult,
    ReadinessCheckResults,
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
    "MetricType",
    "FilterExpressionLeaf",
    "FilterExpression",
    "SearchResultItem",
    "SearchResponse",
    "SearchByImageRequest",
    "SearchByTextRequest",
    "VectorSearchRequest",
    "AlbumCreateRequest",
    "AlbumUpdateRequest",
    "AlbumResponse",
    "AlbumListResponse",
    "ImageUpdateMetadataRequest",
    "ImageListResponse",
    "EvaluationStatus",
    "EvaluationRunRequest",
    "EvaluationRunResponse",
    "EvaluationMetrics",
    "EvaluationResult",
    "EvaluationResultResponse",
    "EvaluationMetricsResponse",
    "DependencyState",
    "HealthStatus",
    "ReadinessCheckResult",
    "ReadinessCheckResults",
]
