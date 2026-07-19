"""
Dependency Injection factories for BackendModule scaffold + auth.
"""

from __future__ import annotations

from functools import lru_cache
from typing import AsyncGenerator
from minio import Minio
from redis.asyncio import Redis

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from .adapters.auth_adapters import AuthConfigAdapter, TokenGenerator
from .adapters.scaffold_adapters import ConfigLoader, ScaffoldConfigAdapter
from .entities.scaffold_entities import AuthConfig, DatabaseConfig
from .services.auth_services import AuthService
from .services.scaffold_services import AppLifecycleService, ScaffoldService
from .adapters.upload_adapters import IdempotencyAdapter, MinIOAdapter, PostgreSQLImageAdapter
from .entities.scaffold_entities import CacheConfig, StorageConfig
from .services.upload_services import UploadService
from .adapters.storage_vector_adapters import StorageVectorAdapter
from .services.storage_vector_services import StorageVectorService
from .adapters.search_adapters import AIServiceSearchAdapter, FriendsQueryAdapter, StorageVectorSearchAdapter
from .services.search_services import SearchService
from .adapters.media_adapters import AlbumAdapter, ImageAdapter
from .services.media_services import MediaService
from .adapters.upload_adapters import MinIOAdapter
from .adapters.evaluation_adapters import EvaluationAdapter
from .services.evaluation_services import EvaluationService
from .adapters.admin_adapters import AdminAdapter
from .services.admin_services import AdminService
from app.services.health_services import HealthService
from app.services.scaffold_services import ScaffoldService

@lru_cache(maxsize=1)
def get_config_loader() -> ConfigLoader:
    return ConfigLoader()


@lru_cache(maxsize=1)
def get_scaffold_config_adapter() -> ScaffoldConfigAdapter:
    return ScaffoldConfigAdapter(loader=get_config_loader())


@lru_cache(maxsize=1)
def get_scaffold_service() -> ScaffoldService:
    return ScaffoldService(config_adapter=get_scaffold_config_adapter())

async def _lifecycle_shutdown_handler() -> None:
    engine = get_async_engine()
    await engine.dispose()

    redis_client = get_redis_client()
    await redis_client.aclose()


@lru_cache(maxsize=1)
def get_lifecycle_service() -> AppLifecycleService:
    return AppLifecycleService(
        scaffold_service=get_scaffold_service(),
        shutdown_handler=_lifecycle_shutdown_handler,
    )

@lru_cache(maxsize=1)
def get_database_config() -> DatabaseConfig:
    return get_scaffold_config_adapter().get_database_config()


@lru_cache(maxsize=1)
def get_async_engine() -> AsyncEngine:
    db_config = get_database_config()
    return create_async_engine(
        db_config.url,
        echo=db_config.echo,
        pool_size=db_config.pool_size,
        max_overflow=db_config.max_overflow,
    )


@lru_cache(maxsize=1)
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=get_async_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session


@lru_cache(maxsize=1)
def get_auth_config() -> AuthConfig:
    return get_scaffold_config_adapter().get_auth_config()


@lru_cache(maxsize=1)
def get_auth_config_adapter() -> AuthConfigAdapter:
    return AuthConfigAdapter(auth_config=get_auth_config())


@lru_cache(maxsize=1)
def get_token_generator() -> TokenGenerator:
    return get_auth_config_adapter().get_token_generator()


async def get_auth_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    token_generator: TokenGenerator = Depends(get_token_generator),
    auth_config_adapter: AuthConfigAdapter = Depends(get_auth_config_adapter),
) -> AuthService:
    return AuthService(
        db_session=db_session,
        token_generator=token_generator,
        expiration_seconds=auth_config_adapter.get_expiration_seconds(),
    )

@lru_cache(maxsize=1)
def get_storage_config() -> StorageConfig:
    return get_scaffold_config_adapter().get_storage_config()


@lru_cache(maxsize=1)
def get_cache_config() -> CacheConfig:
    return get_scaffold_config_adapter().get_cache_config()


@lru_cache(maxsize=1)
def get_minio_client() -> Minio:
    storage_config = get_storage_config()
    endpoint = storage_config.endpoint
    secure = endpoint.startswith("https://")
    normalized_endpoint = endpoint.removeprefix("http://").removeprefix("https://")
    return Minio(
        endpoint=normalized_endpoint,
        access_key=storage_config.access_key,
        secret_key=storage_config.secret_key,
        secure=secure,
    )


@lru_cache(maxsize=1)
def get_redis_client() -> Redis:
    cache_config = get_cache_config()
    return Redis.from_url(cache_config.url, decode_responses=True)


@lru_cache(maxsize=1)
def get_public_minio_client() -> Minio:
    storage_config = get_storage_config()
    endpoint = storage_config.public_endpoint
    secure = endpoint.startswith("https://")
    normalized_endpoint = endpoint.removeprefix("http://").removeprefix("https://")
    return Minio(
        endpoint=normalized_endpoint,
        access_key=storage_config.access_key,
        secret_key=storage_config.secret_key,
        secure=secure,
        region="us-east-1",
    )

@lru_cache(maxsize=1)
def get_minio_adapter() -> MinIOAdapter:
    storage_config = get_storage_config()
    return MinIOAdapter(
        minio_client=get_minio_client(),
        public_minio_client=get_public_minio_client(),
        bucket_name="raw-images",
        endpoint=storage_config.endpoint,
    )

@lru_cache(maxsize=1)
def get_idempotency_adapter() -> IdempotencyAdapter:
    return IdempotencyAdapter(redis_client=get_redis_client(), ttl_hours=24)

async def get_upload_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    minio_adapter: MinIOAdapter = Depends(get_minio_adapter),
    idempotency_adapter: IdempotencyAdapter = Depends(get_idempotency_adapter),
) -> UploadService:
    postgres_adapter = PostgreSQLImageAdapter(db_session=db_session)
    return UploadService(
        minio_adapter=minio_adapter,
        idempotency_adapter=idempotency_adapter,
        postgres_adapter=postgres_adapter,
    )

async def get_storage_vector_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    minio_adapter: MinIOAdapter = Depends(get_minio_adapter),
) -> StorageVectorService:
    adapter = StorageVectorAdapter(db_session=db_session)
    global_config = get_scaffold_config_adapter().get_global_config()
    return StorageVectorService(
        adapter=adapter,
        expected_vector_dim=global_config.vector_dim,
        minio_adapter=minio_adapter,
    )

async def get_search_service(
    db_session: AsyncSession = Depends(get_async_db_session),
) -> SearchService:
    config_adapter = get_scaffold_config_adapter()
    ai_service_url = config_adapter.get_ai_service_config().url
    app_config = config_adapter.get_app_config()

    ai_adapter = AIServiceSearchAdapter(ai_service_base_url=ai_service_url)
    storage_vector_adapter = StorageVectorSearchAdapter(
        vector_service_base_url=f"http://{app_config.host}:{app_config.port}"
    )
    friends_adapter = FriendsQueryAdapter(db_session=db_session)

    return SearchService(
        ai_adapter=ai_adapter,
        storage_vector_adapter=storage_vector_adapter,
        friends_adapter=friends_adapter,
    )

async def get_media_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    minio_adapter: MinIOAdapter = Depends(get_minio_adapter),
) -> MediaService:
    album_adapter = AlbumAdapter(session=db_session)
    image_adapter = ImageAdapter(session=db_session)
    return MediaService(
        album_adapter=album_adapter,
        image_adapter=image_adapter,
        minio_adapter=minio_adapter,
    )

async def get_evaluation_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    minio_adapter: MinIOAdapter = Depends(get_minio_adapter),
) -> EvaluationService:
    scaffold_adapter = get_scaffold_config_adapter()
    app_config = scaffold_adapter.get_app_config()
    ai_config = scaffold_adapter.get_ai_service_config()

    ai_service_url = ai_config.url
    vector_service_base_url = f"http://{app_config.host}:{app_config.port}"

    adapter = EvaluationAdapter(db_session=db_session)

    return EvaluationService(
        evaluation_adapter=adapter,
        minio_adapter=minio_adapter,
        ai_service_url=ai_service_url,
        vector_service_base_url=vector_service_base_url,
        http_timeout_sec=30,
        eval_max_images=100,
        top_k=10,
    )

async def get_admin_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    minio_adapter: MinIOAdapter = Depends(get_minio_adapter),
) -> AdminService:
    scaffold_adapter = get_scaffold_config_adapter()
    app_config = scaffold_adapter.get_app_config()
    ai_config = scaffold_adapter.get_ai_service_config()

    ai_service_url = ai_config.url
    vector_service_base_url = f"http://{app_config.host}:{app_config.port}"

    adapter = AdminAdapter(
        db_session=db_session,
        minio_adapter=minio_adapter,
        ai_service_url=ai_service_url,
        vector_service_base_url=vector_service_base_url,
    )
    return AdminService(adapter=adapter)

async def get_health_service() -> HealthService:
    scaffold_adapter = get_scaffold_config_adapter()
    app_config = scaffold_adapter.get_app_config()
    database_config = scaffold_adapter.get_database_config()
    storage_config = scaffold_adapter.get_storage_config()
    cache_config = scaffold_adapter.get_cache_config()
    ai_config = scaffold_adapter.get_ai_service_config()
    global_config = scaffold_adapter.get_global_config()
    scaffold_service = get_scaffold_service()

    return HealthService(
        database_url=database_config.url,
        minio_endpoint=storage_config.endpoint,
        minio_access_key=storage_config.access_key,
        minio_secret_key=storage_config.secret_key,
        redis_url=cache_config.url,
        ai_service_url=ai_config.url,
        vector_dim=global_config.vector_dim,
        check_timeout_sec=app_config.health_check_timeout_sec,
        scaffold_service=scaffold_service,
    )

__all__ = [
    "get_config_loader",
    "get_scaffold_config_adapter",
    "get_scaffold_service",
    "get_lifecycle_service",
    "get_database_config",
    "get_async_engine",
    "get_session_factory",
    "get_async_db_session",
    "get_auth_config",
    "get_auth_config_adapter",
    "get_token_generator",
    "get_auth_service",
    "get_storage_config",
    "get_cache_config",
    "get_minio_client",
    "get_redis_client",
    "get_minio_adapter",
    "get_idempotency_adapter",
    "get_upload_service",
    "get_storage_vector_service",
    "get_search_service",
    "get_media_service",
    "get_evaluation_service",
    "get_admin_service",
    "get_health_service",
    "get_public_minio_client"
]