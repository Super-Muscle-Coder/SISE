"""
Health Check Service
====================
Business logic for liveness and readiness probes.

Services:
- HealthService: Orchestrates dependency checks and aggregates results
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, Optional
import logging

from app.entities.health_entities import (
    HealthStatus,
    DependencyState,
    ReadinessCheckResult,
    ReadinessCheckResults,
)
from app.adapters.health_adapters import (
    PostgreSQLHealthChecker,
    MilvusHealthChecker,
    MinIOHealthChecker,
    AIServiceHealthChecker,
)

logger = logging.getLogger(__name__)


class HealthService:
    """
    Orchestrates health checks for backend service.

    Responsibilities:
    - Liveness: Simple check that the service process is running
    - Readiness: Comprehensive check that all critical dependencies are available
    """

    def __init__(
        self,
        database_url: str,
        milvus_host: str,
        milvus_port: int,
        minio_endpoint: str,
        minio_access_key: str,
        minio_secret_key: str,
        ai_service_url: str,
        vector_dim: int = 512,
        check_timeout_sec: float = 5.0,
        retry_attempts: int = 2,
        postgres_enabled: bool = True,
        milvus_enabled: bool = True,
        minio_enabled: bool = True,
        ai_service_enabled: bool = True,
    ):
        """
        Initialize HealthService with dependency checkers.

        Args:
            database_url: PostgreSQL connection string
            milvus_host: Milvus host address
            milvus_port: Milvus port number
            minio_endpoint: MinIO endpoint (host:port)
            minio_access_key: MinIO access key
            minio_secret_key: MinIO secret key
            ai_service_url: AI Service base URL
            vector_dim: Expected vector dimension for this deployment
            check_timeout_sec: Timeout for individual dependency checks
            retry_attempts: Number of retry attempts for failed checks
            postgres_enabled: Enable PostgreSQL readiness check
            milvus_enabled: Enable Milvus readiness check
            minio_enabled: Enable MinIO readiness check
            ai_service_enabled: Enable AI Service readiness check
        """
        self.vector_dim = vector_dim
        self.check_timeout_sec = check_timeout_sec
        self.retry_attempts = retry_attempts

        # Initialize checkers
        self.postgres_checker = PostgreSQLHealthChecker(database_url)
        self.milvus_checker = MilvusHealthChecker(milvus_host, milvus_port)
        self.minio_checker = MinIOHealthChecker(
            minio_endpoint, minio_access_key, minio_secret_key
        )
        self.ai_service_checker = AIServiceHealthChecker(ai_service_url)

        # Feature flags for each checker
        self.enabled_checks = {
            "postgres": postgres_enabled,
            "milvus": milvus_enabled,
            "minio": minio_enabled,
            "ai_service": ai_service_enabled,
        }

    async def check_liveness(self) -> HealthStatus:
        """
        Perform liveness check.

        Liveness is a simple check that the service process is running.
        It does NOT check dependencies.

        Returns:
            HealthStatus with status="alive"

        Raises:
            No exceptions; liveness always succeeds if this code runs
        """
        return HealthStatus(
            status="alive",
            timestamp=datetime.now(timezone.utc),
            dependencies=None,
        )

    async def check_readiness(self) -> tuple[HealthStatus, int]:
        """
        Perform comprehensive readiness check.

        Checks all enabled dependencies in parallel.

        Returns:
            Tuple of (HealthStatus, http_status_code)
            - HealthStatus: Overall status and per-dependency info
            - http_status_code: 200 if all ready, 503 if any failed, 500 if error
        """
        try:
            results = await self._run_all_checks()

            # Determine overall status
            all_ready = all(
                result.status == DependencyState.CONNECTED
                or result.status == DependencyState.READY
                or result.status == DependencyState.REACHABLE
                or result.status == DependencyState.WARM
                for result in results.results.values()
            )

            status_str = "ready" if all_ready else "degraded"
            http_code = 200 if all_ready else 503

            # Build dependencies dict for response
            dependencies_dict = {
                name: result.status.value
                for name, result in results.results.items()
            }

            health_status = HealthStatus(
                status=status_str,
                timestamp=results.timestamp,
                dependencies=dependencies_dict,
            )

            logger.info(
                f"Readiness check completed: {status_str} "
                f"({sum(1 for r in results.results.values() if r.status in [DependencyState.CONNECTED, DependencyState.READY, DependencyState.REACHABLE, DependencyState.WARM])}/{len(results.results)} ready)"
            )

            return health_status, http_code

        except Exception as e:
            logger.error(f"Readiness check failed with error: {e}")
            return (
                HealthStatus(
                    status="error",
                    timestamp=datetime.now(timezone.utc),
                    dependencies=None,
                ),
                500,
            )

    async def _run_all_checks(self) -> ReadinessCheckResults:
        """
        Run all enabled dependency checks in parallel.

        Returns:
            ReadinessCheckResults with per-dependency results
        """
        tasks = {}

        if self.enabled_checks["postgres"]:
            tasks["postgres"] = self.postgres_checker.check(self.check_timeout_sec)

        if self.enabled_checks["milvus"]:
            tasks["milvus"] = self.milvus_checker.check(self.check_timeout_sec)

        if self.enabled_checks["minio"]:
            tasks["minio"] = self.minio_checker.check(self.check_timeout_sec)

        if self.enabled_checks["ai_service"]:
            tasks["ai_service"] = self.ai_service_checker.check(self.check_timeout_sec)

        # Run all checks concurrently
        results = {}
        if tasks:
            check_results = await asyncio.gather(*tasks.values(), return_exceptions=False)
            for (name, _), result in zip(tasks.items(), check_results):
                results[name] = result

        return ReadinessCheckResults(
            timestamp=datetime.now(timezone.utc),
            all_ready=all(
                result.status in [
                    DependencyState.CONNECTED,
                    DependencyState.READY,
                    DependencyState.REACHABLE,
                    DependencyState.WARM,
                ]
                for result in results.values()
            ),
            results=results,
            vector_dim=self.vector_dim,
        )


__all__ = ["HealthService"]
