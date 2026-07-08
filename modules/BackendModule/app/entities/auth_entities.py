"""
Auth workflow entities — Pydantic models for authentication.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    id: int
    username: str
    email: str
    role: Literal["user", "admin"]
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class AuthRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400


class TokenPayload(BaseModel):
    user_id: int
    username: str
    exp: int


__all__ = ["User", "RegisterRequest", "AuthRequest", "AuthResponse", "TokenPayload"]