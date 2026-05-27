"""
Auth workflow entities — Pydantic models for authentication.

File prefix: auth_entities.py
Layer: entities
Responsibility: Define User, RegisterRequest, AuthRequest, AuthResponse schemas.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    """
    User model representing a registered user in the system.

    Attributes:
        id: Unique user identifier (from PostgreSQL)
        username: User's unique username
        email: User's email address
        created_at: Account creation timestamp
    """

    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterRequest(BaseModel):
    """
    Request schema for user registration endpoint.

    Attributes:
        username: 3-50 characters, must be unique
        email: Valid email format, must be unique
        password: Minimum 8 characters
    """

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class AuthRequest(BaseModel):
    """
    Request schema for login endpoint.

    Attributes:
        username: Registered username
        password: User's password
    """

    username: str
    password: str


class AuthResponse(BaseModel):
    """
    Response schema for authentication endpoints (register, login).

    Attributes:
        access_token: JWT access token for subsequent requests
        token_type: Token type (always "bearer" for OAuth2)
        expires_in: Token expiration time in seconds
    """

    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours in seconds


class TokenPayload(BaseModel):
    """
    JWT token payload structure.

    Used internally for token encoding/decoding.

    Attributes:
        user_id: User ID embedded in token
        username: Username embedded in token
        exp: Expiration timestamp (Unix time)
    """

    user_id: int
    username: str
    exp: int  # Expiration timestamp


__all__ = [
    "User",
    "RegisterRequest",
    "AuthRequest",
    "AuthResponse",
    "TokenPayload",
]
