"""
Adapters Layer — Low-level integrations with external systems (PyTorch, open_clip).

Exports adapter classes from workflow-specific modules using prefix convention.
"""

from app.adapters.warmup_adapters import DeviceManager, CLIPModelLoader, WarmupExecutor

__all__ = [
    "DeviceManager",
    "CLIPModelLoader",
    "WarmupExecutor",
]
