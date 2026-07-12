"""
Entities Layer: Domain models for all workflows.
Exported by workflow for use in adapters, services, and routers.
"""

from .scaffold_entities import (
    AppConfig,
    DatabaseConfig,
    StorageConfig,
    GlobalConfig,
    CacheConfig,
    AuthConfig,
    CeleryConfig,
    PresignedURLConfig,
    AIServiceConfig,
    RetryPolicyConfig,
)
from .auth_entities import (
    User,
    RegisterRequest,
    AuthRequest,
    AuthResponse,
    TokenPayload,
)
from .friends_entities import (
    FriendRequestBody,
    FriendResponse,
)
from .upload_entities import (
    PrivacyLevel as UploadPrivacyLevel,
    PresignedUploadRequest,
    PresignedUploadResponse,
    UploadConfirmRequest,
    UploadResponse,
    ImageMetadata as UploadImageMetadata,
    ImageMetadataList,
)
from .storage_vector_entities import (
    FilterExpression,
    IndexVectorRequest,
    IndexVectorResponse,
    SearchHybridRequest,
    SearchResultItem as StorageVectorSearchResultItem,
    SearchResponse as StorageVectorSearchResponse,
)
from .indexing_entities import (
    TransientIndexingError,
    PermanentIndexingError,
    ImageIndexSource,
    EmbeddingResult,
)
from .search_entities import (
    MetricType,
    SearchByImageRequest,
    SearchByTextRequest,
    VectorSearchRequest,
    SearchResultItem,
    SearchResponse,
)
from .media_entities import (
    PrivacyLevel as MediaPrivacyLevel,
    AlbumCreateRequest,
    AlbumUpdateRequest,
    AlbumResponse,
    AlbumListResponse,
    ImageUpdateMetadataRequest,
    ImageMetadata as MediaImageMetadata,
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
from .admin_entities import (
    ReindexRequest,
    ReindexResponse,
)
from .health_entities import (
    DependencyState,
    HealthStatus,
    ReadinessCheckResult,
    ReadinessCheckResults,
)

__all__ = [
    # scaffold
    "AppConfig",
    "DatabaseConfig",
    "StorageConfig",
    "GlobalConfig",
    "CacheConfig",
    "AuthConfig",
    "CeleryConfig",
    "PresignedURLConfig",
    "AIServiceConfig",
    "RetryPolicyConfig",
    # auth
    "User",
    "RegisterRequest",
    "AuthRequest",
    "AuthResponse",
    "TokenPayload",
    # friends
    "FriendRequestBody",
    "FriendResponse",
    # upload
    "UploadPrivacyLevel",
    "PresignedUploadRequest",
    "PresignedUploadResponse",
    "UploadConfirmRequest",
    "UploadResponse",
    "UploadImageMetadata",
    "ImageMetadataList",
    # storage_vector
    "FilterExpression",
    "IndexVectorRequest",
    "IndexVectorResponse",
    "SearchHybridRequest",
    "StorageVectorSearchResultItem",
    "StorageVectorSearchResponse",
    # indexing
    "TransientIndexingError",
    "PermanentIndexingError",
    "ImageIndexSource",
    "EmbeddingResult",
    # search
    "MetricType",
    "SearchByImageRequest",
    "SearchByTextRequest",
    "VectorSearchRequest",
    "SearchResultItem",
    "SearchResponse",
    # media
    "MediaPrivacyLevel",
    "AlbumCreateRequest",
    "AlbumUpdateRequest",
    "AlbumResponse",
    "AlbumListResponse",
    "ImageUpdateMetadataRequest",
    "MediaImageMetadata",
    "ImageListResponse",
    # evaluation
    "EvaluationStatus",
    "EvaluationRunRequest",
    "EvaluationRunResponse",
    "EvaluationMetrics",
    "EvaluationResult",
    "EvaluationResultResponse",
    "EvaluationMetricsResponse",
    # admin
    "ReindexRequest",
    "ReindexResponse",
    # health
    "DependencyState",
    "HealthStatus",
    "ReadinessCheckResult",
    "ReadinessCheckResults",
]