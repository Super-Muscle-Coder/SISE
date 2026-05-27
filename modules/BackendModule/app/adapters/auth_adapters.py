"""
Auth workflow adapters — Password hashing, JWT token generation, config loading.

File prefix: auth_adapters.py
Layer: adapters
Responsibility: PasswordHasher, TokenGenerator, AuthConfigAdapter for JWT secrets.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from ..entities.auth_entities import TokenPayload


class PasswordHasher:
    """
    Bcrypt-based password hashing adapter.

    Provides static methods for secure password handling.
    """

    ROUNDS = 12  # bcrypt rounds for hashing (configurable)

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a plaintext password using bcrypt.

        Args:
            password: Plaintext password

        Returns:
            Bcrypt hash string (suitable for storage in database)
        """
        salt = bcrypt.gensalt(rounds=PasswordHasher.ROUNDS)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """
        Verify a plaintext password against a bcrypt hash.

        Args:
            password: Plaintext password to verify
            password_hash: Bcrypt hash from database

        Returns:
            True if password matches hash, False otherwise
        """
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"), password_hash.encode("utf-8")
            )
        except Exception:
            return False


class TokenGenerator:
    """
    JWT token generation and validation adapter.

    Handles JWT encoding/decoding with python-jose library.
    """

    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        """
        Initialize TokenGenerator.

        Args:
            secret_key: Secret key for signing tokens (min 32 chars)
            algorithm: JWT algorithm (default: HS256)

        Raises:
            ValueError: If secret_key is empty
        """
        if not secret_key:
            raise ValueError("JWT_SECRET is required")
        self.secret_key = secret_key
        self.algorithm = algorithm

    def generate_token(
        self, user_id: int, username: str, expires_in: int = 86400
    ) -> str:
        """
        Generate JWT access token.

        Args:
            user_id: User ID to embed in token
            username: Username to embed in token
            expires_in: Token expiry in seconds (default 24h)

        Returns:
            Encoded JWT token string
        """
        now = datetime.now(timezone.utc)
        expire = now + timedelta(seconds=expires_in)

        payload: dict = {
            "user_id": user_id,
            "username": username,
            "exp": int(expire.timestamp()),
        }

        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token

    def verify_token(self, token: str) -> Optional[TokenPayload]:
        """
        Verify and decode JWT token.

        Args:
            token: JWT token string

        Returns:
            TokenPayload if valid, None if invalid or expired
        """
        try:
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            token_payload = TokenPayload(**payload)
            return token_payload
        except JWTError:
            return None


class AuthConfigAdapter:
    """
    Load and validate authentication configuration from environment.

    Reads JWT settings from environment variables with defaults.
    """

    def __init__(self):
        """Load JWT config from environment variables."""
        self.jwt_secret = os.getenv("JWT_SECRET")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_expiry_sec = int(os.getenv("JWT_EXPIRY_SEC", "86400"))  # 24h

    def validate_config(self) -> None:
        """
        Validate auth configuration.

        Checks that required environment variables are set and valid.

        Raises:
            ValueError: If required config is missing or invalid
        """
        if not self.jwt_secret:
            raise ValueError("JWT_SECRET environment variable is required")
        if len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")

    def get_token_generator(self) -> TokenGenerator:
        """
        Get initialized TokenGenerator instance.

        Validates config before returning.

        Returns:
            TokenGenerator instance configured from environment

        Raises:
            ValueError: If config validation fails
        """
        self.validate_config()
        return TokenGenerator(
            secret_key=self.jwt_secret, algorithm=self.jwt_algorithm
        )


__all__ = [
    "PasswordHasher",
    "TokenGenerator",
    "AuthConfigAdapter",
]
