"""
Routers Layer — FastAPI route handlers and event manager factories.

Exports router and handler factories from workflow-specific modules using prefix convention.
"""

from app.routers.warmup_routers import create_warmup_router, get_warmup_startup_handler
from app.routers.image_embedding_routers import create_image_embedding_router
from app.routers.text_embedding_routers import create_text_embedding_router
from app.routers.batch_embedding_routers import create_batch_embedding_router

__all__ = [
    # Warmup workflow
    "create_warmup_router",
    "get_warmup_startup_handler",
    # Image embedding workflow
    "create_image_embedding_router",
    # Text embedding workflow
    "create_text_embedding_router",
    # Batch embedding workflow
    "create_batch_embedding_router",
]
