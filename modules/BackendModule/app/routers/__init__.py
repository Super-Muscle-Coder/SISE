"""
Router registry for BackendModule.
"""

from __future__ import annotations

from fastapi import APIRouter

from .auth_routers import router as auth_router
from .friends_routers import router as friends_router

all_routers: list[APIRouter] = [
    auth_router,
    friends_router,
]

__all__ = ["all_routers"]