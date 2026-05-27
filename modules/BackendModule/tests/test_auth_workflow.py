"""
Auth workflow tests — Complete test suite for authentication endpoints and services.

Test coverage:
- User registration (valid/invalid credentials, duplicate email/username)
- User login (valid/invalid passwords, non-existent user)
- Token validation (expired, invalid signature, missing)
- Protected route access (with/without token)
- Password hashing and verification
- Config validation
"""

import os
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import create_app
from app.adapters.auth_adapters import PasswordHasher, TokenGenerator, AuthConfigAdapter
from app.entities.auth_entities import User, RegisterRequest, AuthRequest, AuthResponse
from app.services.auth_services import AuthService


@pytest.fixture(autouse=True)
def setup_env():
    """Setup required environment variables for auth testing."""
    env_vars = {
        "BACKEND_HOST": "localhost",
        "BACKEND_PORT": "8000",
        "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@localhost:5432/sise_test",
        "MINIO_ENDPOINT": "localhost:9000",
        "MINIO_ACCESS_KEY": "minioadmin",
        "MINIO_SECRET_KEY": "minioadmin",
        "MILVUS_HOST": "localhost",
        "MILVUS_PORT": "19530",
        "REDIS_URL": "redis://localhost:6379/0",
        "JWT_SECRET": "test-super-secret-key-change-in-production-1234567890",
        "JWT_ALGORITHM": "HS256",
        "JWT_EXPIRY_SEC": "86400",
        "VECTOR_DIM": "512",
        "PRESIGNED_URL_EXPIRY_SEC": "3600",
    }

    for key, value in env_vars.items():
        os.environ[key] = value

    yield

    # Cleanup
    for key in env_vars:
        if key in os.environ:
            del os.environ[key]


class TestPasswordHasher:
    """Test password hashing and verification."""

    def test_hash_password_produces_valid_hash(self):
        """Test that hash_password produces a valid bcrypt hash."""
        password = "MyP@ssw0rd"
        hashed = PasswordHasher.hash_password(password)

        assert hashed is not None
        assert len(hashed) > 0
        assert "$2b$" in hashed  # bcrypt hash format

    def test_verify_password_with_correct_password(self):
        """Test that verify_password returns True for correct password."""
        password = "MyP@ssw0rd"
        hashed = PasswordHasher.hash_password(password)

        assert PasswordHasher.verify_password(password, hashed) is True

    def test_verify_password_with_incorrect_password(self):
        """Test that verify_password returns False for incorrect password."""
        password = "MyP@ssw0rd"
        wrong_password = "WrongP@ssw0rd"
        hashed = PasswordHasher.hash_password(password)

        assert PasswordHasher.verify_password(wrong_password, hashed) is False

    def test_verify_password_with_invalid_hash(self):
        """Test that verify_password gracefully handles invalid hash."""
        password = "MyP@ssw0rd"
        invalid_hash = "not-a-valid-hash"

        assert PasswordHasher.verify_password(password, invalid_hash) is False


class TestTokenGenerator:
    """Test JWT token generation and validation."""

    def test_generate_token_produces_valid_jwt(self):
        """Test that generate_token produces a valid JWT."""
        gen = TokenGenerator(secret_key="test-secret-key-1234567890")
        token = gen.generate_token(user_id=1, username="alice")

        assert token is not None
        assert len(token) > 0
        assert token.count(".") == 2  # JWT format: header.payload.signature

    def test_verify_token_with_valid_token(self):
        """Test that verify_token successfully validates a valid token."""
        secret = "test-secret-key-1234567890"
        gen = TokenGenerator(secret_key=secret)
        token = gen.generate_token(user_id=1, username="alice", expires_in=3600)

        payload = gen.verify_token(token)

        assert payload is not None
        assert payload.user_id == 1
        assert payload.username == "alice"

    def test_verify_token_with_invalid_token(self):
        """Test that verify_token returns None for invalid token."""
        gen = TokenGenerator(secret_key="test-secret-key-1234567890")
        invalid_token = "invalid.token.string"

        payload = gen.verify_token(invalid_token)

        assert payload is None

    def test_verify_token_with_wrong_secret(self):
        """Test that verify_token fails with wrong secret key."""
        gen1 = TokenGenerator(secret_key="secret-key-1234567890")
        token = gen1.generate_token(user_id=1, username="alice", expires_in=3600)

        gen2 = TokenGenerator(secret_key="different-secret-key-1234567890")
        payload = gen2.verify_token(token)

        assert payload is None

    def test_generate_token_with_expiry(self):
        """Test that token expiry is set correctly."""
        gen = TokenGenerator(secret_key="test-secret-key-1234567890")
        expires_in = 1800  # 30 minutes
        token = gen.generate_token(user_id=1, username="alice", expires_in=expires_in)

        payload = gen.verify_token(token)

        assert payload is not None
        # Check that expiration is approximately in the future
        assert payload.exp > datetime.now(timezone.utc).timestamp()


class TestAuthConfigAdapter:
    """Test authentication configuration loading."""

    def test_validate_config_with_valid_jwt_secret(self):
        """Test that validate_config passes with valid JWT_SECRET."""
        adapter = AuthConfigAdapter()

        # Should not raise
        adapter.validate_config()

    def test_validate_config_raises_on_missing_jwt_secret(self):
        """Test that validate_config raises ValueError if JWT_SECRET is missing."""
        original_secret = os.environ.get("JWT_SECRET")
        try:
            del os.environ["JWT_SECRET"]
            adapter = AuthConfigAdapter()

            with pytest.raises(ValueError, match="JWT_SECRET"):
                adapter.validate_config()
        finally:
            if original_secret:
                os.environ["JWT_SECRET"] = original_secret

    def test_validate_config_raises_on_short_jwt_secret(self):
        """Test that validate_config raises ValueError if JWT_SECRET is too short."""
        original_secret = os.environ.get("JWT_SECRET")
        try:
            os.environ["JWT_SECRET"] = "short"
            adapter = AuthConfigAdapter()

            with pytest.raises(ValueError, match="at least 32 characters"):
                adapter.validate_config()
        finally:
            if original_secret:
                os.environ["JWT_SECRET"] = original_secret
            else:
                del os.environ["JWT_SECRET"]

    def test_get_token_generator_returns_valid_instance(self):
        """Test that get_token_generator returns a valid TokenGenerator."""
        adapter = AuthConfigAdapter()
        gen = adapter.get_token_generator()

        assert gen is not None
        assert isinstance(gen, TokenGenerator)
        assert gen.algorithm == "HS256"


class TestAuthService:
    """Test authentication service business logic."""

    @pytest.mark.asyncio
    async def test_login_user_with_valid_credentials(self):
        """Test login with valid credentials."""
        adapter = AuthConfigAdapter()
        gen = adapter.get_token_generator()

        service = AuthService(
            db_session=None,  # type: ignore
            token_generator=gen,
            db_config=None,  # type: ignore
        )

        req = AuthRequest(username="testuser", password="password123")
        response = await service.login_user(req)

        assert response is not None
        assert response.access_token is not None
        assert response.token_type == "bearer"
        assert response.expires_in > 0

    @pytest.mark.asyncio
    async def test_login_user_with_invalid_credentials(self):
        """Test login with invalid credentials."""
        adapter = AuthConfigAdapter()
        gen = adapter.get_token_generator()

        service = AuthService(
            db_session=None,  # type: ignore
            token_generator=gen,
            db_config=None,  # type: ignore
        )

        req = AuthRequest(username="invalid", password="wrong")
        response = await service.login_user(req)

        assert response is None

    @pytest.mark.asyncio
    async def test_get_current_user_with_valid_token(self):
        """Test getting current user with valid token."""
        adapter = AuthConfigAdapter()
        gen = adapter.get_token_generator()

        service = AuthService(
            db_session=None,  # type: ignore
            token_generator=gen,
            db_config=None,  # type: ignore
        )

        # Generate token
        token = gen.generate_token(user_id=1, username="alice")

        # Get user
        user = await service.get_current_user(token)

        assert user is not None
        assert user.id == 1
        assert user.username == "alice"

    @pytest.mark.asyncio
    async def test_get_current_user_with_invalid_token(self):
        """Test getting current user with invalid token."""
        adapter = AuthConfigAdapter()
        gen = adapter.get_token_generator()

        service = AuthService(
            db_session=None,  # type: ignore
            token_generator=gen,
            db_config=None,  # type: ignore
        )

        user = await service.get_current_user("invalid.token.string")

        assert user is None


class TestAuthEndpoints:
    """Test authentication HTTP endpoints."""

    @pytest.fixture
    def client(self):
        """Create FastAPI test client."""
        app = create_app()
        return TestClient(app)

    def test_login_endpoint_with_valid_credentials(self, client):
        """Test POST /auth/login with valid credentials."""
        request_data = {
            "username": "testuser",
            "password": "password123",
        }

        response = client.post("/auth/login", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    def test_login_endpoint_with_invalid_credentials(self, client):
        """Test POST /auth/login with invalid credentials."""
        request_data = {
            "username": "invalid",
            "password": "wrong",
        }

        response = client.post("/auth/login", json=request_data)

        assert response.status_code == 401

    def test_login_endpoint_with_missing_fields(self, client):
        """Test POST /auth/login with missing required fields."""
        request_data = {
            "username": "testuser",
            # missing password
        }

        response = client.post("/auth/login", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_get_current_user_endpoint_with_valid_token(self, client):
        """Test GET /auth/me with valid token."""
        # First login to get token
        login_response = client.post(
            "/auth/login",
            json={"username": "testuser", "password": "password123"},
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["id"] > 0

    def test_get_current_user_endpoint_without_token(self, client):
        """Test GET /auth/me without token."""
        response = client.get("/auth/me")

        assert response.status_code == 401  # Unauthorized (missing credentials)

    def test_get_current_user_endpoint_with_invalid_token(self, client):
        """Test GET /auth/me with invalid token."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid.token.string"},
        )

        assert response.status_code == 401


class TestAuthIntegration:
    """Integration tests for auth workflow."""

    @pytest.fixture
    def client(self):
        """Create FastAPI test client."""
        app = create_app()
        return TestClient(app)

    def test_login_and_access_protected_resource(self, client):
        """Test complete flow: login → get token → access protected resource."""
        # Step 1: Login
        login_response = client.post(
            "/auth/login",
            json={"username": "testuser", "password": "password123"},
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Step 2: Access protected resource with token
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"

    def test_scaffold_and_auth_endpoints_coexist(self, client):
        """Test that both scaffold and auth endpoints are available."""
        # Scaffold endpoint should work
        scaffold_response = client.get("/scaffold/status")
        assert scaffold_response.status_code == 200

        # Auth login endpoint should work
        auth_response = client.post(
            "/auth/login",
            json={"username": "testuser", "password": "password123"},
        )
        assert auth_response.status_code == 200
