"""
Health Check Workflow Test Suite
==================================
Comprehensive tests for health/liveness and health/readiness probes.

Test Coverage:
1. Entity schemas validation
2. Adapter dependency checks (mocking external services)
3. Service orchestration logic
4. Router endpoints and HTTP responses
5. Integration scenarios
"""

import asyncio
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

from app.entities.health_entities import (
    DependencyState,
    HealthStatus,
    ReadinessCheckResult,
    ReadinessCheckResults,
)
from app.adapters.health_adapters import (
    PostgreSQLHealthChecker,
    MilvusHealthChecker,
    MinIOHealthChecker,
    AIServiceHealthChecker,
)
from app.services.health_services import HealthService
from app.routers.health_routers import router, set_health_service


# ============================================================================
# 1. ENTITY SCHEMA TESTS
# ============================================================================
class TestHealthEntities:
    """Test health entity schemas and validation."""

    def test_dependency_state_enum(self):
        """Test DependencyState enum values."""
        assert DependencyState.CONNECTED.value == "connected"
        assert DependencyState.READY.value == "ready"
        assert DependencyState.REACHABLE.value == "reachable"
        assert DependencyState.WARM.value == "warm"
        assert DependencyState.UNAVAILABLE.value == "unavailable"
        assert DependencyState.UNKNOWN.value == "unknown"

    def test_readiness_check_result_creation(self):
        """Test ReadinessCheckResult entity creation."""
        result = ReadinessCheckResult(
            name="postgres",
            status=DependencyState.CONNECTED,
            latency_ms=42.5,
            error=None,
        )
        assert result.name == "postgres"
        assert result.status == DependencyState.CONNECTED
        assert result.latency_ms == 42.5
        assert result.error is None

    def test_readiness_check_result_with_error(self):
        """Test ReadinessCheckResult with error."""
        result = ReadinessCheckResult(
            name="minio",
            status=DependencyState.UNAVAILABLE,
            latency_ms=5000.0,
            error="Connection refused",
        )
        assert result.status == DependencyState.UNAVAILABLE
        assert result.error == "Connection refused"

    def test_health_status_creation(self):
        """Test HealthStatus entity creation."""
        status = HealthStatus(
            status="ready",
            timestamp=datetime.now(timezone.utc),
            dependencies={"postgres": "connected", "milvus": "ready"},
        )
        assert status.status == "ready"
        assert "postgres" in status.dependencies
        assert status.dependencies["postgres"] == "connected"

    def test_readiness_check_results_aggregation(self):
        """Test ReadinessCheckResults aggregation."""
        results = {
            "postgres": ReadinessCheckResult(
                name="postgres",
                status=DependencyState.CONNECTED,
                latency_ms=10.0,
            ),
            "milvus": ReadinessCheckResult(
                name="milvus",
                status=DependencyState.READY,
                latency_ms=20.0,
            ),
        }
        aggregated = ReadinessCheckResults(
            timestamp=datetime.now(timezone.utc),
            all_ready=True,
            results=results,
            vector_dim=512,
        )
        assert aggregated.all_ready is True
        assert len(aggregated.results) == 2
        assert aggregated.vector_dim == 512


# ============================================================================
# 2. ADAPTER TESTS
# ============================================================================
class TestPostgreSQLHealthChecker:
    """Test PostgreSQL health checker."""

    @pytest.mark.asyncio
    async def test_postgres_check_success(self):
        """Test successful PostgreSQL connection check."""
        checker = PostgreSQLHealthChecker("postgresql://localhost/test")

        with patch("asyncpg.connect", new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_connect.return_value = mock_conn

            result = await checker.check(timeout_sec=5.0)

            assert result.name == "postgres"
            assert result.status == DependencyState.CONNECTED
            assert result.latency_ms > 0
            assert result.error is None
            mock_conn.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_postgres_check_timeout(self):
        """Test PostgreSQL check with timeout."""
        checker = PostgreSQLHealthChecker("postgresql://localhost/test")

        with patch("asyncpg.connect", new_callable=AsyncMock) as mock_connect:
            mock_connect.side_effect = asyncio.TimeoutError()

            result = await checker.check(timeout_sec=0.1)

            assert result.name == "postgres"
            assert result.status == DependencyState.UNAVAILABLE
            assert "timeout" in result.error.lower()

    @pytest.mark.asyncio
    async def test_postgres_check_connection_error(self):
        """Test PostgreSQL check with connection error."""
        checker = PostgreSQLHealthChecker("postgresql://invalid/test")

        with patch("asyncpg.connect", new_callable=AsyncMock) as mock_connect:
            mock_connect.side_effect = Exception("Connection refused")

            result = await checker.check(timeout_sec=5.0)

            assert result.status == DependencyState.UNAVAILABLE
            assert result.error is not None


class TestMilvusHealthChecker:
    """Test Milvus health checker."""

    @pytest.mark.asyncio
    async def test_milvus_check_success(self):
        """Test successful Milvus connection check."""
        checker = MilvusHealthChecker("localhost", 19530)

        with patch("pymilvus.connections.connect") as mock_connect:
            result = await checker.check(timeout_sec=5.0)

            assert result.name == "milvus"
            assert result.status == DependencyState.READY
            assert result.latency_ms > 0


class TestMinIOHealthChecker:
    """Test MinIO health checker."""

    @pytest.mark.asyncio
    async def test_minio_check_success(self):
        """Test successful MinIO connectivity check."""
        checker = MinIOHealthChecker("localhost:9000", "minioadmin", "minioadmin")

        with patch("minio.Minio") as mock_minio_class:
            mock_client = MagicMock()
            mock_client.list_buckets.return_value = [MagicMock(name="test-bucket")]
            mock_minio_class.return_value = mock_client

            result = await checker.check(timeout_sec=5.0)

            assert result.name == "minio"
            assert result.status == DependencyState.REACHABLE
            assert result.error is None


class TestAIServiceHealthChecker:
    """Test AI Service health checker."""

    def test_ai_service_checker_initialization(self):
        """Test AI Service checker is properly initialized."""
        checker = AIServiceHealthChecker("http://localhost:8001")

        # Verify checker is properly initialized
        assert checker.ai_service_url == "http://localhost:8001"
        assert checker.name == "ai_service"

    def test_ai_service_url_normalization(self):
        """Test AI Service URL is normalized (trailing slash removed)."""
        checker = AIServiceHealthChecker("http://localhost:8001/")

        # Verify trailing slash is removed
        assert checker.ai_service_url == "http://localhost:8001"


# ============================================================================
# 3. SERVICE TESTS
# ============================================================================
class TestHealthService:
    """Test HealthService orchestration."""

    def create_health_service(self, **kwargs) -> HealthService:
        """Create HealthService with default or custom parameters."""
        defaults = {
            "database_url": "postgresql://localhost/test",
            "milvus_host": "localhost",
            "milvus_port": 19530,
            "minio_endpoint": "localhost:9000",
            "minio_access_key": "minioadmin",
            "minio_secret_key": "minioadmin",
            "ai_service_url": "http://localhost:8001",
            "vector_dim": 512,
            "check_timeout_sec": 5.0,
            "retry_attempts": 2,
            "postgres_enabled": True,
            "milvus_enabled": True,
            "minio_enabled": True,
            "ai_service_enabled": True,
        }
        defaults.update(kwargs)
        return HealthService(**defaults)

    @pytest.mark.asyncio
    async def test_liveness_check(self):
        """Test liveness check always succeeds."""
        service = self.create_health_service()
        result = await service.check_liveness()

        assert result.status == "alive"
        assert result.timestamp is not None
        assert result.dependencies is None

    @pytest.mark.asyncio
    async def test_readiness_check_all_ready(self):
        """Test readiness check when all dependencies are ready."""
        service = self.create_health_service()

        # Mock all checkers to return success
        service.postgres_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="postgres",
                status=DependencyState.CONNECTED,
                latency_ms=10.0,
            )
        )
        service.milvus_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="milvus",
                status=DependencyState.READY,
                latency_ms=20.0,
            )
        )
        service.minio_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="minio",
                status=DependencyState.REACHABLE,
                latency_ms=15.0,
            )
        )
        service.ai_service_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="ai_service",
                status=DependencyState.WARM,
                latency_ms=25.0,
            )
        )

        health_status, http_code = await service.check_readiness()

        assert health_status.status == "ready"
        assert http_code == 200
        assert health_status.dependencies is not None
        assert health_status.dependencies["postgres"] == "connected"
        assert health_status.dependencies["milvus"] == "ready"

    @pytest.mark.asyncio
    async def test_readiness_check_one_dependency_failed(self):
        """Test readiness check when one dependency is unavailable."""
        service = self.create_health_service()

        # Mock checkers: postgres OK, milvus FAILED
        service.postgres_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="postgres",
                status=DependencyState.CONNECTED,
                latency_ms=10.0,
            )
        )
        service.milvus_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="milvus",
                status=DependencyState.UNAVAILABLE,
                latency_ms=5000.0,
                error="Connection timeout",
            )
        )
        service.minio_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="minio",
                status=DependencyState.REACHABLE,
                latency_ms=15.0,
            )
        )
        service.ai_service_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="ai_service",
                status=DependencyState.WARM,
                latency_ms=25.0,
            )
        )

        health_status, http_code = await service.check_readiness()

        assert health_status.status == "degraded"
        assert http_code == 503
        assert health_status.dependencies["milvus"] == "unavailable"

    @pytest.mark.asyncio
    async def test_readiness_check_disabled_checkers(self):
        """Test readiness check with some checkers disabled."""
        service = self.create_health_service(
            milvus_enabled=False,
            ai_service_enabled=False,
        )

        # Only postgres and minio should be checked
        service.postgres_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="postgres",
                status=DependencyState.CONNECTED,
                latency_ms=10.0,
            )
        )
        service.minio_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="minio",
                status=DependencyState.REACHABLE,
                latency_ms=15.0,
            )
        )

        health_status, http_code = await service.check_readiness()

        assert http_code == 200
        assert health_status.dependencies is not None
        assert "postgres" in health_status.dependencies
        assert "minio" in health_status.dependencies
        # Disabled checkers should not be in the results
        assert "milvus" not in health_status.dependencies
        assert "ai_service" not in health_status.dependencies


# ============================================================================
# 4. ROUTER/ENDPOINT TESTS
# ============================================================================
class TestHealthRouters:
    """Test health check HTTP endpoints."""

    @pytest.fixture
    def app(self) -> FastAPI:
        """Create FastAPI app with health router."""
        app = FastAPI()
        app.include_router(router)

        # Create and inject HealthService
        health_service = HealthService(
            database_url="postgresql://localhost/test",
            milvus_host="localhost",
            milvus_port=19530,
            minio_endpoint="localhost:9000",
            minio_access_key="minioadmin",
            minio_secret_key="minioadmin",
            ai_service_url="http://localhost:8001",
            vector_dim=512,
        )
        set_health_service(health_service)

        return app

    @pytest.fixture
    def client(self, app: FastAPI) -> TestClient:
        """Create test client."""
        return TestClient(app)

    def test_liveness_endpoint_success(self, client: TestClient):
        """Test GET /health/liveness endpoint."""
        response = client.get("/health/liveness")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_readiness_endpoint_success(self):
        """Test GET /health/readiness endpoint when all deps are ready."""
        app = FastAPI()
        app.include_router(router)

        health_service = HealthService(
            database_url="postgresql://localhost/test",
            milvus_host="localhost",
            milvus_port=19530,
            minio_endpoint="localhost:9000",
            minio_access_key="minioadmin",
            minio_secret_key="minioadmin",
            ai_service_url="http://localhost:8001",
            vector_dim=512,
        )

        # Mock all checkers
        health_service.postgres_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="postgres",
                status=DependencyState.CONNECTED,
                latency_ms=10.0,
            )
        )
        health_service.milvus_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="milvus",
                status=DependencyState.READY,
                latency_ms=20.0,
            )
        )
        health_service.minio_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="minio",
                status=DependencyState.REACHABLE,
                latency_ms=15.0,
            )
        )
        health_service.ai_service_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="ai_service",
                status=DependencyState.WARM,
                latency_ms=25.0,
            )
        )

        set_health_service(health_service)
        client = TestClient(app)

        response = client.get("/health/readiness")

        assert response.status_code == 200
        assert "X-Expected-Vector-Dim" in response.headers
        assert response.headers["X-Expected-Vector-Dim"] == "512"
        data = response.json()
        assert data["status"] == "ready"
        assert "dependencies" in data

    @pytest.mark.asyncio
    async def test_readiness_endpoint_degraded(self):
        """Test GET /health/readiness endpoint when dependencies are unavailable."""
        app = FastAPI()
        app.include_router(router)

        health_service = HealthService(
            database_url="postgresql://localhost/test",
            milvus_host="localhost",
            milvus_port=19530,
            minio_endpoint="localhost:9000",
            minio_access_key="minioadmin",
            minio_secret_key="minioadmin",
            ai_service_url="http://localhost:8001",
            vector_dim=512,
        )

        # Mock checkers with one failure
        health_service.postgres_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="postgres",
                status=DependencyState.UNAVAILABLE,
                latency_ms=5000.0,
                error="Connection timeout",
            )
        )
        health_service.milvus_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="milvus",
                status=DependencyState.READY,
                latency_ms=20.0,
            )
        )
        health_service.minio_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="minio",
                status=DependencyState.REACHABLE,
                latency_ms=15.0,
            )
        )
        health_service.ai_service_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="ai_service",
                status=DependencyState.WARM,
                latency_ms=25.0,
            )
        )

        set_health_service(health_service)
        client = TestClient(app)

        response = client.get("/health/readiness")

        assert response.status_code == 503
        assert "X-Expected-Vector-Dim" in response.headers
        data = response.json()
        assert data["status"] == "degraded"


# ============================================================================
# 5. INTEGRATION TESTS
# ============================================================================
class TestHealthIntegration:
    """Integration tests for the health workflow."""

    @pytest.mark.asyncio
    async def test_full_health_check_flow(self):
        """Test complete health check flow: entities → adapters → service → router."""
        # Create service with mocked adapters
        service = HealthService(
            database_url="postgresql://localhost/test",
            milvus_host="localhost",
            milvus_port=19530,
            minio_endpoint="localhost:9000",
            minio_access_key="minioadmin",
            minio_secret_key="minioadmin",
            ai_service_url="http://localhost:8001",
            vector_dim=512,
        )

        # Mock all checkers
        service.postgres_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="postgres",
                status=DependencyState.CONNECTED,
                latency_ms=10.0,
            )
        )
        service.milvus_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="milvus",
                status=DependencyState.READY,
                latency_ms=20.0,
            )
        )
        service.minio_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="minio",
                status=DependencyState.REACHABLE,
                latency_ms=15.0,
            )
        )
        service.ai_service_checker.check = AsyncMock(
            return_value=ReadinessCheckResult(
                name="ai_service",
                status=DependencyState.WARM,
                latency_ms=25.0,
            )
        )

        # Run checks
        liveness = await service.check_liveness()
        readiness, http_code = await service.check_readiness()

        # Verify results
        assert liveness.status == "alive"
        assert readiness.status == "ready"
        assert http_code == 200
        assert service.vector_dim == 512


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
