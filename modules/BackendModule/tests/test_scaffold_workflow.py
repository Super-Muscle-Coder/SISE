"""
Test Suite for Scaffold Workflow.
Tests configuration loading, validation, dependency injection, and API endpoints.
"""

import pytest
import os
from fastapi.testclient import TestClient

from app.adapters.scaffold_adapters import ConfigLoader, ScaffoldConfigAdapter
from app.services.scaffold_services import ScaffoldService
from app.entities.scaffold_entities import (
    AppConfig,
    DatabaseConfig,
    VectorConfig,
)
from app.main import create_app


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch):
    """Setup test environment with required variables."""
    # Set up minimal environment for tests
    monkeypatch.setenv("BACKEND_HOST", "localhost")
    monkeypatch.setenv("BACKEND_PORT", "8000")
    monkeypatch.setenv("DEBUG", "False")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-for-testing-only")
    monkeypatch.setenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    monkeypatch.setenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
    monkeypatch.setenv("VECTOR_DIM", "512")
    monkeypatch.setenv("PRESIGNED_URL_EXPIRY_SEC", "3600")
    yield


class TestConfigLoader:
    """Test ConfigLoader functionality."""

    def test_load_app_config(self):
        """Test loading app configuration."""
        loader = ConfigLoader()
        config = loader.get_app_config()

        assert isinstance(config, AppConfig)
        assert config.host is not None
        assert config.port > 0

    def test_load_vector_config(self):
        """Test loading vector configuration."""
        loader = ConfigLoader()
        config = loader.get_vector_config()

        assert isinstance(config, VectorConfig)
        assert config.vector_dim == 512, "Vector dimension must be exactly 512 per data_schema.yaml"

    def test_load_auth_config_missing_secret(self, monkeypatch):
        """Test that auth config fails when JWT_SECRET is missing."""
        # Temporarily unset JWT_SECRET
        monkeypatch.delenv("JWT_SECRET", raising=False)

        loader = ConfigLoader()
        with pytest.raises(ValueError, match="JWT_SECRET environment variable is required"):
            loader.get_auth_config()

    def test_load_database_config_missing_url(self, monkeypatch):
        """Test that database config fails when DATABASE_URL is missing."""
        # Clear pytest fixture's DATABASE_URL
        monkeypatch.delenv("DATABASE_URL", raising=False)

        loader = ConfigLoader()
        with pytest.raises(ValueError, match="DATABASE_URL environment variable is required"):
            loader.get_database_config()

    def test_load_celery_config_missing_broker(self, monkeypatch):
        """Test that celery config fails when CELERY_BROKER_URL is missing."""
        monkeypatch.delenv("CELERY_BROKER_URL", raising=False)
        monkeypatch.delenv("CELERY_RESULT_BACKEND", raising=False)

        loader = ConfigLoader()
        with pytest.raises(ValueError, match="CELERY_BROKER_URL and CELERY_RESULT_BACKEND are required"):
            loader.get_celery_config()


class TestScaffoldConfigAdapter:
    """Test ScaffoldConfigAdapter functionality."""

    def test_load_all_configs(self):
        """Test loading all configurations together."""
        adapter = ScaffoldConfigAdapter()
        configs = adapter.load_all_configs()

        assert "app" in configs
        assert "database" in configs
        assert "storage" in configs
        assert "vector" in configs
        assert "cache" in configs
        assert "auth" in configs
        assert "celery" in configs
        assert "presigned_url" in configs

    def test_validate_configuration(self):
        """Test configuration validation."""
        adapter = ScaffoldConfigAdapter()
        result = adapter.validate_configuration()

        assert result is True

    def test_validate_vector_dim_constraint(self, monkeypatch):
        """Test that vector dimension must be exactly 512."""
        monkeypatch.setenv("VECTOR_DIM", "256")

        adapter = ScaffoldConfigAdapter()
        with pytest.raises(ValueError, match="VECTOR_DIM must be 512"):
            adapter.validate_configuration()


class TestScaffoldService:
    """Test ScaffoldService functionality."""

    def test_initialize(self):
        """Test service initialization."""
        adapter = ScaffoldConfigAdapter()
        service = ScaffoldService(config_adapter=adapter)
        result = service.initialize()

        assert result["status"] == "success"
        assert "configs_loaded" in result

    def test_get_config(self):
        """Test retrieving cached configuration."""
        adapter = ScaffoldConfigAdapter()
        service = ScaffoldService(config_adapter=adapter)
        service.initialize()

        vector_config = service.get_config("vector")
        assert vector_config is not None
        assert vector_config.vector_dim == 512

    def test_health_check(self):
        """Test health check endpoint."""
        adapter = ScaffoldConfigAdapter()
        service = ScaffoldService(config_adapter=adapter)
        service.initialize()

        health = service.health_check()
        assert health["status"] == "healthy"
        assert health["vector_dim"] == 512


class TestFastAPIApp:
    """Test FastAPI application and endpoints."""

    @pytest.fixture
    def client(self):
        """Create FastAPI test client."""
        app = create_app()
        return TestClient(app)

    def test_app_creation(self):
        """Test that app is created successfully."""
        app = create_app()
        assert app is not None
        assert app.title == "SISE Backend API"

    def test_scaffold_status_endpoint(self, client):
        """Test /scaffold/status endpoint."""
        response = client.get("/scaffold/status")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "data" in data

    def test_scaffold_validate_config_endpoint(self, client):
        """Test /scaffold/validate-config endpoint."""
        response = client.post("/scaffold/validate-config")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["validation_passed"] is True


class TestDependencyInjection:
    """Test FastAPI dependency injection."""

    def test_singleton_scaffold_service(self):
        """Test that ScaffoldService is a singleton."""
        from app.dependencies import get_scaffold_service

        service1 = get_scaffold_service()
        service2 = get_scaffold_service()

        assert service1 is service2

    def test_singleton_config_adapter(self):
        """Test that ScaffoldConfigAdapter is a singleton."""
        from app.dependencies import get_config_adapter

        adapter1 = get_config_adapter()
        adapter2 = get_config_adapter()

        assert adapter1 is adapter2


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])
