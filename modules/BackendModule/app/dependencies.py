"""
Dependency Injection: FastAPI Depends factories for services and adapters.
Provides singleton-like instances across request lifecycle.
"""

from functools import lru_cache

from fastapi import Depends

from .adapters.scaffold_adapters import ScaffoldConfigAdapter, ConfigLoader
from .adapters.auth_adapters import AuthConfigAdapter, TokenGenerator
from .services.scaffold_services import ScaffoldService, AppLifecycleService
from .services.auth_services import AuthService
from .entities.scaffold_entities import DatabaseConfig


@lru_cache(maxsize=1)
def get_config_loader() -> ConfigLoader:
    """Get singleton ConfigLoader instance."""
    return ConfigLoader()


@lru_cache(maxsize=1)
def get_config_adapter() -> ScaffoldConfigAdapter:
    """Get singleton ScaffoldConfigAdapter instance."""
    loader = get_config_loader()
    return ScaffoldConfigAdapter(loader=loader)


@lru_cache(maxsize=1)
def get_scaffold_service() -> ScaffoldService:
    """Get singleton ScaffoldService instance."""
    adapter = get_config_adapter()
    return ScaffoldService(config_adapter=adapter)


@lru_cache(maxsize=1)
def get_lifecycle_service() -> AppLifecycleService:
    """Get singleton AppLifecycleService instance."""
    scaffold_service = get_scaffold_service()
    return AppLifecycleService(scaffold_service=scaffold_service)


@lru_cache(maxsize=1)
def get_auth_config_adapter() -> AuthConfigAdapter:
    """Get singleton AuthConfigAdapter instance."""
    return AuthConfigAdapter()


@lru_cache(maxsize=1)
def get_token_generator() -> TokenGenerator:
    """Get singleton TokenGenerator instance."""
    auth_config = get_auth_config_adapter()
    return auth_config.get_token_generator()


async def get_auth_service(
    token_generator: TokenGenerator = Depends(get_token_generator),
    scaffold_adapter: ScaffoldConfigAdapter = Depends(get_config_adapter),
) -> AuthService:
    """
    Get AuthService instance per request.

    Note: In production, we'd also pass a real AsyncSession here.
    For MVP, we simulate with None and add DB integration in next phase.
    """
    db_config = scaffold_adapter.get_database_config()
    # TODO: Inject real AsyncSession from connection pool
    return AuthService(
        db_session=None,  # type: ignore
        token_generator=token_generator,
        db_config=db_config,
    )
