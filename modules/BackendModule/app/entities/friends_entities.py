"""
Friends workflow entities.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from .auth_entities import User


class FriendRequestBody(BaseModel):
    target_user_id: int


class FriendResponse(BaseModel):
    user_id: int
    friend_id: int
    created_at: datetime


__all__ = ["FriendRequestBody", "FriendResponse", "User"]