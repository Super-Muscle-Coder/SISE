"""
Scaffold Services: Core application logic and lifecycle management.
Depends on: adapters (ScaffoldConfigAdapter)
"""

from typing import Dict, Any
from ..adapters.scaffold_adapters import ScaffoldConfigAdapter


class ScaffoldService:
    """Service to orchestrate scaffold-level setup and validation."""

    def __init__(self, config_adapter: ScaffoldConfigAdapter):
        """Initialize with configuration adapter (via dependency injection)."""
        self.config_adapter = config_adapter
        self._config_cache: Dict[str, Any] = {}

    def initialize(self) -> Dict[str, Any]:
        """Initialize scaffold by loading and validating all configurations."""
        try:
            # Load all configurations
            configs = self.config_adapter.load_all_configs()
            self._config_cache = configs

            # Validate all configurations
            if self.config_adapter.validate_configuration():
                return {
                    "status": "success",
                    "message": "Scaffold initialization successful",
                    "configs_loaded": list(configs.keys()),
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Scaffold initialization failed: {str(e)}",
            }

    def get_config(self, key: str) -> Any:
        """Retrieve cached configuration by key."""
        if not self._config_cache:
            self.initialize()
        return self._config_cache.get(key)

    def health_check(self) -> Dict[str, Any]:
        """Perform basic scaffold health check."""
        return {
            "status": "healthy",
            "configs_initialized": len(self._config_cache) > 0,
            "vector_dim": self.get_config("vector").vector_dim if self.get_config("vector") else None,
        }


class AppLifecycleService:
    """Service to manage application startup and shutdown hooks."""

    def __init__(self, scaffold_service: ScaffoldService):
        """Initialize with scaffold service."""
        self.scaffold_service = scaffold_service
        self._initialized = False

    async def startup(self) -> None:
        """Execute startup sequence."""
        print("[APP] Starting up Backend Application...")
        result = self.scaffold_service.initialize()
        if result["status"] != "success":
            raise RuntimeError(f"Startup failed: {result['message']}")
        self._initialized = True
        print("[APP] Backend Application startup complete")

    async def shutdown(self) -> None:
        """Execute shutdown sequence."""
        print("[APP] Shutting down Backend Application...")
        # TODO: Close database connections, Redis, Milvus clients, etc.
        self._initialized = False
        print("[APP] Backend Application shutdown complete")

    def is_initialized(self) -> bool:
        """Check if application is initialized."""
        return self._initialized
