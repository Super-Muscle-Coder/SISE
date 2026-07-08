"""
Dependency Injection factories for BackendModule scaffold + auth.
"""

from __future__ import annotations

from functools import lru_cache
from typing import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from .adapters.auth_adapters import AuthConfigAdapter, TokenGenerator
from .adapters.scaffold_adapters import ConfigLoader, ScaffoldConfigAdapter
from .entities.scaffold_entities import AuthConfig, DatabaseConfig
from .services.auth_services import AuthService
from .services.scaffold_services import AppLifecycleService, ScaffoldService


@lru_cache(maxsize=1)
def get_config_loader() -> ConfigLoader:
    return ConfigLoader()


@lru_cache(maxsize=1)
def get_scaffold_config_adapter() -> ScaffoldConfigAdapter:
    return ScaffoldConfigAdapter(loader=get_config_loader())


@lru_cache(maxsize=1)
def get_scaffold_service() -> ScaffoldService:
    return ScaffoldService(config_adapter=get_scaffold_config_adapter())


@lru_cache(maxsize=1)
def get_lifecycle_service() -> AppLifecycleService:
    return AppLifecycleService(scaffold_service=get_scaffold_service())


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
]