"""
Scaffold Entities: Domain models and configuration data classes.
Depends on: None (pure domain layer)
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class AppConfig:
    """Application-wide configuration."""
    host: str
    port: int
    debug: bool
    log_level: str
    metrics_enabled: bool


@dataclass
class DatabaseConfig:
    """PostgreSQL database configuration."""
    url: str
    echo: bool = False
    pool_size: int = 10
    max_overflow: int = 20


@dataclass
class StorageConfig:
    """MinIO object storage configuration."""
    endpoint: str
    access_key: str
    secret_key: str
    bucket_images: str
    bucket_metadata: str
    secure: bool = False


@dataclass
class VectorConfig:
    """Milvus vector database configuration."""
    host: str
    port: int
    collection_images: str
    vector_dim: int = 512


@dataclass
class CacheConfig:
    """Redis cache configuration."""
    url: str
    default_ttl: int = 3600


@dataclass
class AuthConfig:
    """JWT Authentication configuration."""
    secret: str
    algorithm: str
    expiration_hours: int


@dataclass
class CeleryConfig:
    """Celery task queue configuration."""
    broker_url: str
    result_backend: str
    worker_concurrency: int


@dataclass
class PresignedURLConfig:
    """Presigned URL configuration."""
    expiry_sec: int = 3600


__all__ = [
    "AppConfig",
    "DatabaseConfig",
    "StorageConfig",
    "VectorConfig",
    "CacheConfig",
    "AuthConfig",
    "CeleryConfig",
    "PresignedURLConfig",
]
