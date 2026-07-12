"""
Health Check Adapters
======================
Low-level adapters for checking individual service dependencies.

Adapters:
- PostgreSQLHealthChecker: Check PostgreSQL connectivity + pgvector extension
- MinIOHealthChecker: Check MinIO object storage connectivity
- AIServiceHealthChecker: Check AI Service (AG-01) availability
- RedisHealthChecker: Check Redis connectivity (PING)
"""

import asyncio
import time

import asyncpg
import httpx
import redis.asyncio as redis
from minio import Minio

from app.entities.health_entities import DependencyState, ReadinessCheckResult


class PostgreSQLHealthChecker:
    """Check PostgreSQL database connectivity and pgvector extension."""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.name = "postgres"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        start_time = time.time()
        conn: asyncpg.Connection | None = None
        try:
            conn = await asyncio.wait_for(asyncpg.connect(self.database_url), timeout=timeout_sec)
            row = await asyncio.wait_for(
                conn.fetchrow("SELECT extname FROM pg_extension WHERE extname = 'vector'"),
                timeout=timeout_sec,
            )
            latency_ms = (time.time() - start_time) * 1000
            if row is None:
                return ReadinessCheckResult(
                    name=self.name,
                    status=DependencyState.UNAVAILABLE,
                    latency_ms=latency_ms,
                    error="pgvector extension 'vector' is not installed",
                )
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.CONNECTED,
                latency_ms=latency_ms,
            )
        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Connection timeout after {timeout_sec}s",
            )
        except Exception as exc:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(exc),
            )
        finally:
            if conn is not None:
                await conn.close()


class MinIOHealthChecker:
    """Check MinIO object storage connectivity."""

    def __init__(self, minio_endpoint: str, access_key: str, secret_key: str):
        self.minio_endpoint = minio_endpoint
        self.access_key = access_key
        self.secret_key = secret_key
        self.name = "minio"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        start_time = time.time()
        try:
            client = Minio(
                self.minio_endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=False,
            )
            await asyncio.wait_for(self._check_minio_buckets(client), timeout=timeout_sec)
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.REACHABLE,
                latency_ms=latency_ms,
            )
        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Connection timeout after {timeout_sec}s",
            )
        except Exception as exc:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(exc),
            )

    @staticmethod
    async def _check_minio_buckets(client: Minio):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, client.list_buckets)


class AIServiceHealthChecker:
    """Check AI Service liveness endpoint (/health/liveness)."""

    def __init__(self, ai_service_url: str):
        self.ai_service_url = ai_service_url.rstrip("/")
        self.name = "ai_service"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        start_time = time.time()
        url = f"{self.ai_service_url}/health/liveness"
        try:
            async with httpx.AsyncClient(timeout=timeout_sec) as client:
                resp = await client.get(url)
            latency_ms = (time.time() - start_time) * 1000
            if resp.status_code == 200:
                return ReadinessCheckResult(
                    name=self.name,
                    status=DependencyState.WARM,
                    latency_ms=latency_ms,
                )
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Unexpected status code: {resp.status_code}",
            )
        except Exception as exc:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(exc),
            )


class RedisHealthChecker:
    """Check Redis connectivity via PING."""

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.name = "redis"

    async def check(self, timeout_sec: float = 5.0) -> ReadinessCheckResult:
        start_time = time.time()
        client = redis.from_url(self.redis_url, socket_timeout=timeout_sec, socket_connect_timeout=timeout_sec)
        try:
            pong = await asyncio.wait_for(client.ping(), timeout=timeout_sec)
            latency_ms = (time.time() - start_time) * 1000
            if pong:
                return ReadinessCheckResult(
                    name=self.name,
                    status=DependencyState.CONNECTED,
                    latency_ms=latency_ms,
                )
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error="Redis PING returned false",
            )
        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=f"Connection timeout after {timeout_sec}s",
            )
        except Exception as exc:
            latency_ms = (time.time() - start_time) * 1000
            return ReadinessCheckResult(
                name=self.name,
                status=DependencyState.UNAVAILABLE,
                latency_ms=latency_ms,
                error=str(exc),
            )
        finally:
            await client.close()


__all__ = [
    "PostgreSQLHealthChecker",
    "MinIOHealthChecker",
    "AIServiceHealthChecker",
    "RedisHealthChecker",
]