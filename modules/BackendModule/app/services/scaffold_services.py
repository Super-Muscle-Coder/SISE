"""
Scaffold Services: startup/config orchestration logic.
Depends on: adapters
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from ..adapters.scaffold_adapters import ScaffoldConfigAdapter


@dataclass
class ConfigValidationResult:
    """Internal validation payload that can be consumed by workflow health."""
    config_validated: bool
    checked_at: str
    errors: list[str] = field(default_factory=list)


class ScaffoldService:
    """Orchestrates scaffold initialization and contract-aligned config validation."""

    def __init__(self, config_adapter: ScaffoldConfigAdapter):
        self.config_adapter = config_adapter
        self._config_cache: dict[str, Any] = {}

    def initialize(self) -> dict[str, Any]:
        configs = self.config_adapter.load_all_configs()
        self.config_adapter.validate_configuration()
        self._config_cache = configs
        return {
            "initialized": True,
            "configs_loaded": list(configs.keys()),
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_config(self, key: str) -> Any:
        if not self._config_cache:
            self.initialize()
        return self._config_cache.get(key)

    def get_validation_result(self) -> ConfigValidationResult:
        try:
            self.config_adapter.validate_configuration()
            return ConfigValidationResult(
                config_validated=True,
                checked_at=datetime.now(timezone.utc).isoformat(),
                errors=[],
            )
        except Exception as exc:
            return ConfigValidationResult(
                config_validated=False,
                checked_at=datetime.now(timezone.utc).isoformat(),
                errors=[str(exc)],
            )


class AppLifecycleService:
    """Manages startup/shutdown boundaries for composition root lifespan."""

    def __init__(
        self,
        scaffold_service: ScaffoldService,
        shutdown_handler: Callable[[], Awaitable[None]] | None = None,
    ):
        self.scaffold_service = scaffold_service
        self.shutdown_handler = shutdown_handler
        self._initialized = False

    async def startup(self) -> None:
        self.scaffold_service.initialize()
        self._initialized = True

    async def shutdown(self) -> None:
        if self.shutdown_handler is None:
            raise NotImplementedError(
                "T003-00(scaffold): real resource cleanup is not implemented yet. "
                "Connection/session ownership will be added by later workflows "
                "(e.g., auth/upload/indexing integration tasks)."
            )
        await self.shutdown_handler()
        self._initialized = False

    def is_initialized(self) -> bool:
        return self._initialized


__all__ = [
    "ConfigValidationResult",
    "ScaffoldService",
    "AppLifecycleService",
]