"""
Scaffold Adapters: environment readers and configuration validation.
Depends on: entities
"""

import os
from typing import Optional

from ..entities.scaffold_entities import (
    AppConfig,
    DatabaseConfig,
    StorageConfig,
    GlobalConfig,
    CacheConfig,
    AuthConfig,
    CeleryConfig,
    PresignedURLConfig,
)


def _read_required_env(var_name: str) -> str:
    value = os.getenv(var_name, "").strip()
    if not value:
        raise ValueError(f"{var_name} environment variable is required and must be non-empty")
    return value


class ConfigLoader:
    """Loads configuration groups from environment variables."""

    @staticmethod
    def get_app_config() -> AppConfig:
        return AppConfig(
            host=os.getenv("BACKEND_HOST", "localhost"),
            port=int(os.getenv("BACKEND_PORT", "8000")),
            debug=os.getenv("DEBUG", "False").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            metrics_enabled=os.getenv("METRICS_ENABLED", "True").lower() == "true",
        )

    @staticmethod
    def get_database_config() -> DatabaseConfig:
        return DatabaseConfig(url=_read_required_env("DATABASE_URL"))

    @staticmethod
    def get_storage_config() -> StorageConfig:
        return StorageConfig(
            endpoint=_read_required_env("MINIO_ENDPOINT"),
            access_key=_read_required_env("MINIO_ACCESS_KEY"),
            secret_key=_read_required_env("MINIO_SECRET_KEY"),
            bucket_images=_read_required_env("MINIO_BUCKET_IMAGES"),
            bucket_metadata=_read_required_env("MINIO_BUCKET_METADATA"),
        )

    @staticmethod
    def get_global_config() -> GlobalConfig:
        return GlobalConfig(vector_dim=int(os.getenv("VECTOR_DIM", "512")))

    @staticmethod
    def get_cache_config() -> CacheConfig:
        return CacheConfig(url=_read_required_env("REDIS_URL"))

    @staticmethod
    def get_auth_config() -> AuthConfig:
        jwt_secret = _read_required_env("JWT_SECRET")
        jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256").strip() or "HS256"

        expiry_sec = int(_read_required_env("JWT_EXPIRY_SEC"))
        if expiry_sec <= 0:
            raise ValueError("JWT_EXPIRY_SEC must be positive")

        return AuthConfig(
            secret=jwt_secret,
            algorithm=jwt_algorithm,
            expiration_seconds=expiry_sec,
        )

    @staticmethod
    def get_celery_config() -> CeleryConfig:
        return CeleryConfig(
            broker_url=_read_required_env("CELERY_BROKER_URL"),
            result_backend=_read_required_env("CELERY_RESULT_BACKEND"),
            worker_concurrency=int(os.getenv("CELERY_WORKER_CONCURRENCY", "4")),
        )

    @staticmethod
    def get_presigned_url_config() -> PresignedURLConfig:
        return PresignedURLConfig(
            expiry_sec=int(os.getenv("PRESIGNED_URL_EXPIRY_SEC", "3600")),
        )


class ScaffoldConfigAdapter:
    """Aggregates config readers and exposes central validation."""

    def __init__(self, loader: Optional[ConfigLoader] = None):
        self.loader = loader or ConfigLoader()

    def load_all_configs(self) -> dict[str, object]:
        return {
            "app": self.loader.get_app_config(),
            "database": self.loader.get_database_config(),
            "storage": self.loader.get_storage_config(),
            "global": self.loader.get_global_config(),
            "cache": self.loader.get_cache_config(),
            "auth": self.loader.get_auth_config(),
            "celery": self.loader.get_celery_config(),
            "presigned_url": self.loader.get_presigned_url_config(),
        }

    def validate_configuration(self) -> bool:
        required_vars = [
            "DATABASE_URL",
            "MINIO_ENDPOINT",
            "MINIO_ACCESS_KEY",
            "MINIO_SECRET_KEY",
            "MINIO_BUCKET_IMAGES",
            "MINIO_BUCKET_METADATA",
            "REDIS_URL",
            "JWT_SECRET",
            "AI_SERVICE_URL",
            "CELERY_BROKER_URL",
            "CELERY_RESULT_BACKEND",
            "PRESIGNED_URL_EXPIRY_SEC",
            "VECTOR_DIM",
            "JWT_EXPIRY_SEC",
        ]
        for var_name in required_vars:
            _read_required_env(var_name)

        configs = self.load_all_configs()

        global_config = configs["global"]
        if not isinstance(global_config, GlobalConfig):
            raise ValueError("Invalid global configuration type")
        if global_config.vector_dim != 512:
            raise ValueError(f"VECTOR_DIM must be 512 (contract v1.2.x), got {global_config.vector_dim}")

        presigned_cfg = configs["presigned_url"]
        if not isinstance(presigned_cfg, PresignedURLConfig):
            raise ValueError("Invalid presigned URL configuration type")
        if presigned_cfg.expiry_sec <= 0:
            raise ValueError("PRESIGNED_URL_EXPIRY_SEC must be positive")

        # NOTE (finding #1): /vector/index và /vector/search/hybrid sẽ được triển khai
        # trong namespace riêng storage_vector_* ở task T003-04 (workflow:indexing), không thuộc scaffold.
        return True

    def get_app_config(self) -> AppConfig:
        return self.loader.get_app_config()

    def get_database_config(self) -> DatabaseConfig:
        return self.loader.get_database_config()

    def get_storage_config(self) -> StorageConfig:
        return self.loader.get_storage_config()

    def get_global_config(self) -> GlobalConfig:
        return self.loader.get_global_config()

    def get_cache_config(self) -> CacheConfig:
        return self.loader.get_cache_config()

    def get_auth_config(self) -> AuthConfig:
        return self.loader.get_auth_config()

    def get_celery_config(self) -> CeleryConfig:
        return self.loader.get_celery_config()

    def get_presigned_url_config(self) -> PresignedURLConfig:
        return self.loader.get_presigned_url_config()


__all__ = [
    "ConfigLoader",
    "ScaffoldConfigAdapter",
]