"""
Warmup Workflow — Entities Layer

Defines data structures for CLIP model loading and warm-up.
Prefix: warmup_*

CONSTRAINT: This layer MUST contain only pure dataclasses (naive entities).
No business logic, no imports of workflow utilities, no I/O operations.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class CLIPConfig:
    model_name: str
    device: str
    model_cache_dir: str
    warmup_iterations: int = 5
    warmup_timeout_sec: float = 30.0
    vector_dim: int = 512          # data_schema.yaml -> global_configs.vector_dim (single source of truth)
    pretrained: str = "openai"     # Pretrained weight tag for open_clip.create_model_and_transforms()


@dataclass
class WarmupResult:
    success: bool
    device: str
    model_name: str
    warmup_time_ms: float
    error_message: Optional[str] = None
    vector_dimension: int = 512

# Export 
__all__ = ["CLIPConfig", "WarmupResult"]