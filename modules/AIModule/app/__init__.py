"""
AI Inference Service — FastAPI Application Package

Organized by workflow-centric 5-layer architecture:
  configs → entities → adapters → services → routers

Workflows:
  T002-01: warmup — Model loading & warm-up
  T002-02+: image_embedding — Image encoding & preprocessing
  T002-04: text_embedding — Text encoding
  ... (more workflows in Phase 2)

Import Strategy:
  - Entities layer: pure dataclasses only
  - Adapters layer: low-level integrations (utilities, tools)
  - Services layer: business logic & orchestration
  - Routers layer: FastAPI endpoints
  - Main (ai_main.py): environment loading & app initialization
"""

# Layer Exports (component-based workflow organization)
from app.entities import CLIPConfig, WarmupResult
from app.adapters import DeviceManager, CLIPModelLoader, WarmupExecutor
from app.services import WarmupService
from app.routers import create_warmup_router, get_warmup_startup_handler

__version__ = "0.1.0"
__all__ = [
    # Entities
    "CLIPConfig",
    "WarmupResult",
    # Adapters
    "DeviceManager",
    "CLIPModelLoader",
    "WarmupExecutor",
    # Services
    "WarmupService",
    # Routers
    "create_warmup_router",
    "get_warmup_startup_handler",
]

