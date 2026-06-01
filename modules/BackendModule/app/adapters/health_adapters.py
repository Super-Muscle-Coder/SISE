"""
Health Check Adapters
======================
Low-level adapters for checking individual service dependencies.

Adapters:
- PostgreSQLHealthChecker: Check PostgreSQL connectivity
- MilvusHealthChecker: Check Milvus vector DB connectivity
- MinIOHealthChecker: Check MinIO object storage connectivity
- AIServiceHealthChecker: Check AI Service (AG-01) availability
"""

import asyncio
import time
from typing import Optional
import aiohttp
import asyncpg
from pymilvus import Collection

from app.entities.health_entities import DependencyState, ReadinessCheckResult


class PostgreSQLHealthChecker:
    """Check PostgreSQL database connectivity."""

    def __init__(self, database_url: str):
        """Initialize with PostgreSQL connection string."""
        self.database_url = database_url
        self.name = "postgres"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        """
        Perform PostgreSQL connectivity check.

        Args:
            timeout_sec: Timeout in seconds for the check

        Returns:
            ReadinessCheckResult with status and latency
        """
        start_time = time.time()
        try:
            # Create a connection pool to test connectivity
            conn = await asyncio.wait_for(
                asyncpg.connect(self.database_url),
                timeout=timeout_sec
            )
            await conn.close()
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.CONNECTED,
                latency_ms=latency_ms
            )
        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Connection timeout after {timeout_sec}s"
            )
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(e)
            )


class MilvusHealthChecker:
    """Check Milvus vector DB connectivity."""

    def __init__(self, milvus_host: str, milvus_port: int):
        """Initialize with Milvus connection parameters."""
        self.milvus_host = milvus_host
        self.milvus_port = milvus_port
        self.name = "milvus"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        """
        Perform Milvus connectivity check.

        Args:
            timeout_sec: Timeout in seconds for the check

        Returns:
            ReadinessCheckResult with status and latency
        """
        start_time = time.time()
        try:
            from pymilvus import connections

            # Attempt to connect and check if it's ready
            await asyncio.wait_for(
                self._connect_milvus(),
                timeout=timeout_sec
            )
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.READY,
                latency_ms=latency_ms
            )
        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Connection timeout after {timeout_sec}s"
            )
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(e)
            )

    @staticmethod
    async def _connect_milvus():
        """Async wrapper for Milvus connection."""
        from pymilvus import connections
        # Milvus connection is synchronous; wrap in executor
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: connections.connect("default"))


class MinIOHealthChecker:
    """Check MinIO object storage connectivity."""

    def __init__(self, minio_endpoint: str, access_key: str, secret_key: str):
        """Initialize with MinIO connection parameters."""
        self.minio_endpoint = minio_endpoint
        self.access_key = access_key
        self.secret_key = secret_key
        self.name = "minio"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        """
        Perform MinIO connectivity check.

        Args:
            timeout_sec: Timeout in seconds for the check

        Returns:
            ReadinessCheckResult with status and latency
        """
        start_time = time.time()
        try:
            from minio import Minio

            # Create MinIO client and attempt to list buckets
            client = Minio(
                self.minio_endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=False
            )

            await asyncio.wait_for(
                self._check_minio_buckets(client),
                timeout=timeout_sec
            )
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.REACHABLE,
                latency_ms=latency_ms
            )
        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Connection timeout after {timeout_sec}s"
            )
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(e)
            )

    @staticmethod
    async def _check_minio_buckets(client):
        """Async wrapper for MinIO bucket list."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: list(client.list_buckets()))


class AIServiceHealthChecker:
    """Check AI Service (AG-01) availability."""

    def __init__(self, ai_service_url: str):
        """Initialize with AI Service URL."""
        self.ai_service_url = ai_service_url.rstrip("/")
        self.name = "ai_service"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        """
        Perform AI Service availability check via HTTP health endpoint.

        Args:
            timeout_sec: Timeout in seconds for the check

        Returns:
            ReadinessCheckResult with status and latency
        """
        start_time = time.time()
        try:
            # Attempt to check AI Service health endpoint
            async with aiohttp.ClientSession() as session:
                health_url = f"{self.ai_service_url}/health"
                async with session.get(
                    health_url,
                    timeout=aiohttp.ClientTimeout(total=timeout_sec)
                ) as response:
                    if response.status == 200:
                        latency_ms = (time.time() - start_time) * 1000
                        return ReadinessCheckResult(
                            name=self.name,
                            status=DependencyState.WARM,
                            latency_ms=latency_ms
                        )
                    else:
                        latency_ms = (time.time() - start_time) * 1000
                        return ReadinessCheckResult(
                            name=self.name,
                            status=DependencyState.UNAVAILABLE,
                            latency_ms=latency_ms,
                            error=f"Health endpoint returned {response.status}"
                        )
        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Connection timeout after {timeout_sec}s"
            )
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(e)
            )


__all__ = [
    "PostgreSQLHealthChecker",
    "MilvusHealthChecker",
    "MinIOHealthChecker",
    "AIServiceHealthChecker",
]
