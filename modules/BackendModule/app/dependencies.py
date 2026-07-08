"""
Dependency Injection factories for BackendModule scaffold.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from .adapters.scaffold_adapters import ConfigLoader, ScaffoldConfigAdapter
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


async def get_async_db_session() -> Any:
    raise NotImplementedError(
        "T003-00(scaffold): AsyncSession provider is not implemented in this scope. "
        "Implement in DB-owning workflow task before wiring request services."
    )


async def get_auth_service() -> Any:
    raise NotImplementedError(
        "T003-01(auth) pending: auth dependency must be wired with real AsyncSession "
        "and token service; scaffold task must not return placeholder None."
    )


__all__ = [
    "get_config_loader",
    "get_scaffold_config_adapter",
    "get_scaffold_service",
    "get_lifecycle_service",
    "get_async_db_session",
    "get_auth_service",
]