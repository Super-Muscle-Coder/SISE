"""
Auth workflow adapters — Password hashing, JWT token generation, config binding.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from ..entities.auth_entities import TokenPayload
from ..entities.scaffold_entities import AuthConfig


class PasswordHasher:
    ROUNDS = 12

    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt(rounds=PasswordHasher.ROUNDS)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
        except Exception:
            return False


class TokenGenerator:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        if not secret_key:
            raise ValueError("JWT_SECRET is required")
        self.secret_key = secret_key
        self.algorithm = algorithm

    def generate_token(self, user_id: int, username: str, expires_in: int) -> str:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(seconds=expires_in)
        payload: dict = {
            "user_id": user_id,
            "username": username,
            "exp": int(expire.timestamp()),
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[TokenPayload]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return TokenPayload(**payload)
        except JWTError:
            return None


class AuthConfigAdapter:
    def __init__(self, auth_config: AuthConfig):
        self.auth_config = auth_config

    def validate_config(self) -> None:
        if not self.auth_config.secret:
            raise ValueError("JWT_SECRET environment variable is required")
        if len(self.auth_config.secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        if self.auth_config.expiration_seconds <= 0:
            raise ValueError("JWT_EXPIRY_SEC must be positive")

    def get_token_generator(self) -> TokenGenerator:
        self.validate_config()
        return TokenGenerator(
            secret_key=self.auth_config.secret,
            algorithm=self.auth_config.algorithm,
        )

    def get_expiration_seconds(self) -> int:
        self.validate_config()
        return self.auth_config.expiration_seconds


__all__ = ["PasswordHasher", "TokenGenerator", "AuthConfigAdapter"]