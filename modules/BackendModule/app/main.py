"""
FastAPI Application Factory: Main entry point for Backend Service.
Initializes the FastAPI app with middleware, routers, and lifecycle hooks.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import get_lifecycle_service
from .routers import scaffold_routers
from .routers import auth_routers


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    # Get lifecycle service for startup/shutdown hooks
    lifecycle_service = get_lifecycle_service()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Manage application startup and shutdown lifecycle."""
        await lifecycle_service.startup()
        yield
        await lifecycle_service.shutdown()

    # Create FastAPI app
    app = FastAPI(
        title="SISE Backend API",
        description="Multimodal Semantic Image Search Engine - Backend Service",
        version="1.0.0",
        lifespan=lifespan,
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # TODO: Configure based on environment
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(scaffold_routers.router)
    app.include_router(auth_routers.router)

    return app


# Create app instance for production (Uvicorn will import this)
app = create_app()


if __name__ == "__main__":
    import uvicorn

    # For local development
    uvicorn.run(
        "modules.BackendModule.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
