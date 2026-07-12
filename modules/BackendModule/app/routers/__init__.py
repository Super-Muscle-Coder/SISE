"""
Router registry for BackendModule.
"""

from __future__ import annotations

from fastapi import APIRouter

from .auth_routers import router as auth_router
from .friends_routers import router as friends_router
from .upload_routers import router as upload_router
from .storage_vector_routers import router as storage_vector_router
from .search_routers import router as search_router
from .media_routers import media_router
from .evaluation_routers import evaluation_router
from .admin_rounters import admin_router
from .health_routers import router as health_router

all_routers: list[APIRouter] = [
    auth_router,
    friends_router,
    upload_router,
    storage_vector_router,
    search_router,
    media_router,
    evaluation_router,
    admin_router,
    health_router,
]

__all__ = ["all_routers"]