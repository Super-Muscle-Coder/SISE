"""
Scaffold Adapters: Configuration loading from environment variables.
Depends on: entities (AppConfig, etc.)
"""

import os
from typing import Optional

from ..entities.scaffold_entities import (
    AppConfig,
    DatabaseConfig,
    StorageConfig,
    VectorConfig,
    CacheConfig,
    AuthConfig,
    CeleryConfig,
    PresignedURLConfig,
)


class ConfigLoader:
    """Loads configuration from environment variables."""

    @staticmethod
    def get_app_config() -> AppConfig:
        """Load application configuration."""
        return AppConfig(
            host=os.getenv("BACKEND_HOST", "localhost"),
            port=int(os.getenv("BACKEND_PORT", "8000")),
            debug=os.getenv("DEBUG", "False").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            metrics_enabled=os.getenv("METRICS_ENABLED", "True").lower() == "true",
        )

    @staticmethod
    def get_database_config() -> DatabaseConfig:
        """Load database configuration."""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        return DatabaseConfig(url=database_url)

    @staticmethod
    def get_storage_config() -> StorageConfig:
        """Load object storage configuration."""
        return StorageConfig(
            endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            bucket_images=os.getenv("MINIO_BUCKET_IMAGES", "images"),
            bucket_metadata=os.getenv("MINIO_BUCKET_METADATA", "metadata"),
        )

    @staticmethod
    def get_vector_config() -> VectorConfig:
        """Load vector store configuration."""
        return VectorConfig(
            host=os.getenv("MILVUS_HOST", "localhost"),
            port=int(os.getenv("MILVUS_PORT", "19530")),
            collection_images=os.getenv("MILVUS_COLLECTION_IMAGES", "images_collection"),
            vector_dim=int(os.getenv("VECTOR_DIM", "512")),
        )

    @staticmethod
    def get_cache_config() -> CacheConfig:
        """Load cache configuration."""
        return CacheConfig(
            url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        )

    @staticmethod
    def get_auth_config() -> AuthConfig:
        """Load authentication configuration."""
        jwt_secret = os.getenv("JWT_SECRET")
        if not jwt_secret:
            raise ValueError("JWT_SECRET environment variable is required")
        return AuthConfig(
            secret=jwt_secret,
            algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            expiration_hours=int(os.getenv("JWT_EXPIRATION_HOURS", "24")),
        )

    @staticmethod
    def get_celery_config() -> CeleryConfig:
        """Load Celery configuration."""
        broker_url = os.getenv("CELERY_BROKER_URL")
        result_backend = os.getenv("CELERY_RESULT_BACKEND")
        if not broker_url or not result_backend:
            raise ValueError("CELERY_BROKER_URL and CELERY_RESULT_BACKEND are required")
        return CeleryConfig(
            broker_url=broker_url,
            result_backend=result_backend,
            worker_concurrency=int(os.getenv("CELERY_WORKER_CONCURRENCY", "4")),
        )

    @staticmethod
    def get_presigned_url_config() -> PresignedURLConfig:
        """Load presigned URL configuration."""
        return PresignedURLConfig(
            expiry_sec=int(os.getenv("PRESIGNED_URL_EXPIRY_SEC", "3600")),
        )


class ScaffoldConfigAdapter:
    """Orchestrator adapter for all scaffold-related configuration."""

    def __init__(self, loader: Optional[ConfigLoader] = None):
        """Initialize the adapter with a config loader (default: ConfigLoader)."""
        self.loader = loader or ConfigLoader()

    def load_all_configs(self):
        """Load and validate all required configurations."""
        app_config = self.loader.get_app_config()
        db_config = self.loader.get_database_config()
        storage_config = self.loader.get_storage_config()
        vector_config = self.loader.get_vector_config()
        cache_config = self.loader.get_cache_config()
        auth_config = self.loader.get_auth_config()
        celery_config = self.loader.get_celery_config()
        presigned_url_config = self.loader.get_presigned_url_config()

        return {
            "app": app_config,
            "database": db_config,
            "storage": storage_config,
            "vector": vector_config,
            "cache": cache_config,
            "auth": auth_config,
            "celery": celery_config,
            "presigned_url": presigned_url_config,
        }

    def validate_configuration(self):
        """Validate all loaded configurations."""
        configs = self.load_all_configs()

        # Validate vector dimension (critical constraint from data_schema.yaml)
        if configs["vector"].vector_dim != 512:
            raise ValueError(
                f"VECTOR_DIM must be 512 (from data_schema.yaml), "
                f"got {configs['vector'].vector_dim}"
            )

        # Validate presigned URL TTL
        if configs["presigned_url"].expiry_sec <= 0:
            raise ValueError("PRESIGNED_URL_EXPIRY_SEC must be positive")

        return True

    def get_database_config(self) -> DatabaseConfig:
        """Convenience getter for database configuration."""
        return self.loader.get_database_config()

    def get_storage_config(self) -> StorageConfig:
        """Convenience getter for storage configuration."""
        return self.loader.get_storage_config()

    def get_vector_config(self) -> VectorConfig:
        """Convenience getter for vector configuration."""
        return self.loader.get_vector_config()

    def get_cache_config(self) -> CacheConfig:
        """Convenience getter for cache configuration."""
        return self.loader.get_cache_config()

    def get_auth_config(self) -> AuthConfig:
        """Convenience getter for auth configuration."""
        return self.loader.get_auth_config()

    def get_celery_config(self) -> CeleryConfig:
        """Convenience getter for Celery configuration."""
        return self.loader.get_celery_config()

    def get_presigned_url_config(self) -> PresignedURLConfig:
        """Convenience getter for presigned URL configuration."""
        return self.loader.get_presigned_url_config()

    def get_app_config(self) -> AppConfig:
        """Convenience getter for app configuration."""
        return self.loader.get_app_config()


__all__ = [
    "ConfigLoader",
    "ScaffoldConfigAdapter",
]
