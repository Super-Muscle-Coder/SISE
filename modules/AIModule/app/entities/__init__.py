"""
Entities Layer — Data structures for all workflows.

Exports entity classes from workflow-specific modules using prefix convention.

CONSTRAINT: Entities layer exports only pure dataclasses, no logic functions.
"""

from app.entities.warmup_entities import CLIPConfig, WarmupResult

__all__ = [
    "CLIPConfig",
    "WarmupResult",
]

