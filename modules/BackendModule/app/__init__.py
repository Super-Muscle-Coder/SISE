"""
Backend FastAPI composition root.
Builds application instance, registers middleware/lifespan, and includes routers.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import get_lifecycle_service
from .routers import all_routers


@asynccontextmanager
async def app_lifespan(_: FastAPI):
    lifecycle_service = get_lifecycle_service()
    await lifecycle_service.startup()
    try:
        yield
    finally:
        await lifecycle_service.shutdown()


app = FastAPI(
    title="SISE - BackendModule",
    version="1.2.0",
    lifespan=app_lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in all_routers:
    app.include_router(router)

__all__ = ["app"]