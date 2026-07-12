"""
Scaffold Entities: pure data models for configuration bundles.
Depends on: None (domain layer only)
"""

from dataclasses import dataclass, field


@dataclass
class AppConfig:
    """Application-wide runtime configuration."""
    host: str
    port: int
    debug: bool
    log_level: str
    metrics_enabled: bool
    health_check_timeout_sec: int = 5


@dataclass
class DatabaseConfig:
    """PostgreSQL database configuration."""
    url: str
    echo: bool = False
    pool_size: int = 10
    max_overflow: int = 20


@dataclass
class StorageConfig:
    """Object storage (MinIO) configuration."""
    endpoint: str
    access_key: str
    secret_key: str
    bucket_images: str
    bucket_metadata: str
    secure: bool = False


@dataclass
class AIServiceConfig:
    """AI Service (AG-01) integration configuration."""
    url: str


@dataclass
class RetryPolicyConfig:
    """Retry policy for transient failures (Celery tasks, external calls)."""
    max_retries: int = 3
    backoff_ms: int = 1000
    factor: int = 2


@dataclass
class GlobalConfig:
    """Global shared configuration from contract-level global_configs."""
    vector_dim: int = 512
    retry_policy: RetryPolicyConfig = field(default_factory=RetryPolicyConfig)


@dataclass
class CacheConfig:
    """Redis cache configuration."""
    url: str
    default_ttl: int = 3600


@dataclass
class AuthConfig:
    """JWT authentication configuration."""
    secret: str
    algorithm: str
    expiration_seconds: int


@dataclass
class CeleryConfig:
    """Celery worker configuration."""
    broker_url: str
    result_backend: str
    worker_concurrency: int


@dataclass
class PresignedURLConfig:
    """Presigned URL policy configuration."""
    expiry_sec: int = 3600


__all__ = [
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
]