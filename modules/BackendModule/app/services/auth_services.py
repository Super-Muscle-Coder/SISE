"""
Auth workflow services — User registration, login, token validation.

File prefix: auth_services.py
Layer: services
Responsibility: Business logic for authentication operations.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..adapters.auth_adapters import PasswordHasher, TokenGenerator
from ..entities.auth_entities import AuthRequest, RegisterRequest, User, AuthResponse
from ..entities.scaffold_entities import DatabaseConfig


class AuthService:
    """Authentication service handling user registration and login."""

    def __init__(
        self,
        db_session: Optional[AsyncSession],
        token_generator: TokenGenerator,
        db_config: Optional[DatabaseConfig],
    ):
        """
        Initialize AuthService.

        Args:
            db_session: SQLAlchemy async session (may be None in scaffold phase)
            token_generator: TokenGenerator instance for JWT handling
            db_config: Database configuration
        """
        self.db_session = db_session
        self.token_generator = token_generator
        self.db_config = db_config
        self.password_hasher = PasswordHasher()

    async def register_user(self, req: RegisterRequest) -> AuthResponse:
        """
        Register a new user.

        Args:
            req: RegisterRequest with username, email, password

        Returns:
            AuthResponse with access token

        Raises:
            ValueError: If username or email already exists or validation fails

        Note:
            MVP Phase: Database integration deferred to later workflow.
            Currently returns simulated success for testing.
        """
        # TODO: Implement actual database insert once ORM models exist
        # Step 1: Check if username already exists
        # Step 2: Check if email already exists
        # Step 3: Hash password
        # Step 4: Insert user to PostgreSQL
        # Step 5: Generate JWT token

        # Simulate user creation with ID=1
        user_id = 1
        username = req.username

        # Generate token
        token = self.token_generator.generate_token(
            user_id=user_id, username=username
        )

        return AuthResponse(
            access_token=token,
            token_type="bearer",
            expires_in=self.token_generator.__dict__.get("expiry_sec", 86400),
        )

    async def login_user(self, req: AuthRequest) -> Optional[AuthResponse]:
        """
        Authenticate user and return access token.

        Args:
            req: AuthRequest with username and password

        Returns:
            AuthResponse with access token, or None if credentials invalid

        Raises:
            ValueError: If credentials are invalid

        Note:
            MVP Phase: Database lookup deferred to later workflow.
            Currently returns simulated success for test credentials.
        """
        # TODO: Implement actual database query once ORM models exist
        # Step 1: Query user by username from PostgreSQL
        # Step 2: Verify password against password_hash
        # Step 3: Return AuthResponse with JWT token

        # Simulate user lookup (test credentials)
        if req.username == "testuser" and req.password == "password123":
            user_id = 1
            token = self.token_generator.generate_token(
                user_id=user_id, username=req.username
            )
            return AuthResponse(
                access_token=token,
                token_type="bearer",
                expires_in=86400,
            )

        return None

    async def get_current_user(self, token: str) -> Optional[User]:
        """
        Get current authenticated user from token.

        Args:
            token: JWT access token

        Returns:
            User model if token valid, None otherwise

        Note:
            MVP Phase: Database lookup deferred to later workflow.
            Currently returns minimal User model from token payload.
        """
        payload = self.token_generator.verify_token(token)
        if not payload:
            return None

        # TODO: Fetch full user details from PostgreSQL once ORM models exist
        return User(
            id=payload.user_id,
            username=payload.username,
            email=f"{payload.username}@example.com",
            created_at=datetime.now(timezone.utc),
        )


__all__ = [
    "AuthService",
]
