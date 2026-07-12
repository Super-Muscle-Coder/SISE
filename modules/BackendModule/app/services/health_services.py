"""
Health Check Service
====================
Business logic for liveness and readiness probes.

Services:
- HealthService: Orchestrates dependency checks and aggregates results
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict
import logging

from app.entities.health_entities import (
    HealthStatus,
    DependencyState,
    ReadinessCheckResult,
    ReadinessCheckResults,
)
from app.adapters.health_adapters import (
    PostgreSQLHealthChecker,
    MinIOHealthChecker,
    AIServiceHealthChecker,
    RedisHealthChecker,
)
from app.services.scaffold_services import ScaffoldService

logger = logging.getLogger(__name__)


class HealthService:
    """
    Orchestrates health checks for backend service.
    """

    def __init__(
        self,
        database_url: str,
        minio_endpoint: str,
        minio_access_key: str,
        minio_secret_key: str,
        ai_service_url: str,
        redis_url: str,
        scaffold_service: ScaffoldService,
        vector_dim: int = 512,
        check_timeout_sec: float = 5.0,
        retry_attempts: int = 2,
        postgres_enabled: bool = True,
        minio_enabled: bool = True,
        ai_service_enabled: bool = True,
        redis_enabled: bool = True,
    ):
        self.vector_dim = vector_dim
        self.check_timeout_sec = check_timeout_sec
        self.retry_attempts = retry_attempts
        self.scaffold_service = scaffold_service

        self.postgres_checker = PostgreSQLHealthChecker(database_url)
        self.minio_checker = MinIOHealthChecker(
            minio_endpoint, minio_access_key, minio_secret_key
        )
        self.ai_service_checker = AIServiceHealthChecker(ai_service_url)
        self.redis_checker = RedisHealthChecker(redis_url)

        self.enabled_checks = {
            "postgres": postgres_enabled,
            "minio": minio_enabled,
            "ai_service": ai_service_enabled,
            "redis": redis_enabled,
        }

    async def check_liveness(self) -> HealthStatus:
        return HealthStatus(
            status="alive",
            timestamp=datetime.now(timezone.utc),
            config_validated=True,
            dependencies=None,
        )

    async def check_readiness(self) -> tuple[HealthStatus, int]:
        try:
            config_result = self.scaffold_service.get_validation_result()
            results = await self._run_all_checks()

            deps_ready = all(
                result.status in {
                    DependencyState.CONNECTED,
                    DependencyState.READY,
                    DependencyState.REACHABLE,
                    DependencyState.WARM,
                }
                for result in results.results.values()
            )

            all_ready = deps_ready and config_result.config_validated
            status_str = "ready" if all_ready else "degraded"
            http_code = 200 if all_ready else 503

            dependencies_dict = {
                name: result.status.value
                for name, result in results.results.items()
            }

            health_status = HealthStatus(
                status=status_str,
                timestamp=results.timestamp,
                config_validated=config_result.config_validated,
                dependencies=dependencies_dict,
            )

            logger.info(
                "Readiness check completed: status=%s config_validated=%s deps_ready=%s",
                status_str,
                config_result.config_validated,
                deps_ready,
            )
            return health_status, http_code

        except Exception as exc:
            logger.exception("Readiness check failed: %s", exc)
            return (
                HealthStatus(
                    status="error",
                    timestamp=datetime.now(timezone.utc),
                    config_validated=False,
                    dependencies=None,
                ),
                500,
            )

    async def _run_all_checks(self) -> ReadinessCheckResults:
        tasks = {}

        if self.enabled_checks["postgres"]:
            tasks["postgres"] = self._check_with_retry(
                self.postgres_checker.check, self.check_timeout_sec, self.retry_attempts
            )

        if self.enabled_checks["minio"]:
            tasks["minio"] = self._check_with_retry(
                self.minio_checker.check, self.check_timeout_sec, self.retry_attempts
            )

        if self.enabled_checks["ai_service"]:
            tasks["ai_service"] = self._check_with_retry(
                self.ai_service_checker.check, self.check_timeout_sec, self.retry_attempts
            )

        if self.enabled_checks["redis"]:
            tasks["redis"] = self._check_with_retry(
                self.redis_checker.check, self.check_timeout_sec, self.retry_attempts
            )

        results: Dict[str, ReadinessCheckResult] = {}
        if tasks:
            names = list(tasks.keys())
            values = await asyncio.gather(*tasks.values(), return_exceptions=False)
            for idx, item in enumerate(values):
                results[names[idx]] = item

        all_ready = all(
            r.status in {
                DependencyState.CONNECTED,
                DependencyState.READY,
                DependencyState.REACHABLE,
                DependencyState.WARM,
            }
            for r in results.values()
        )

        return ReadinessCheckResults(
            timestamp=datetime.now(timezone.utc),
            all_ready=all_ready,
            results=results,
            vector_dim=self.vector_dim,
        )

    async def _check_with_retry(
        self,
        check_func,
        timeout_sec: float,
        retry_attempts: int,
    ) -> ReadinessCheckResult:
        last_result: ReadinessCheckResult | None = None
        for attempt in range(retry_attempts + 1):
            result = await check_func(timeout_sec)
            last_result = result
            if result.status in {
                DependencyState.CONNECTED,
                DependencyState.READY,
                DependencyState.REACHABLE,
                DependencyState.WARM,
            }:
                return result
            if attempt < retry_attempts:
                await asyncio.sleep(0.2)

        if last_result is None:
            return ReadinessCheckResult(
                name="unknown",
                status=DependencyState.UNAVAILABLE,
                latency_ms=0.0,
                error="No check result produced",
            )
        return last_result


__all__ = ["HealthService"]