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
    """Configuration for CLIP model loading."""

    model_name: str
    """CLIP model identifier (e.g., 'ViT-B/32', 'ViT-L/14')."""

    device: str
    """Compute device: 'cuda', 'cpu', or 'auto' (auto-detect)."""

    model_cache_dir: str
    """Directory to cache model weights."""

    warmup_iterations: int = 5
    """Number of iterations for warm-up forward pass."""

    warmup_timeout_sec: float = 30.0
    """Maximum time allowed for warm-up (seconds)."""


@dataclass
class WarmupResult:
    """Result of model warm-up operation."""

    success: bool
    """Whether warm-up completed successfully."""

    device: str
    """Device where model is loaded (cuda/cpu)."""

    model_name: str
    """Name of loaded CLIP model."""

    warmup_time_ms: float
    """Time taken for warm-up (milliseconds)."""

    error_message: Optional[str] = None
    """Error message if warm-up failed."""

    vector_dimension: int = 512
    """Output vector dimension (hardcoded for ViT-B/32)."""


__all__ = ["CLIPConfig", "WarmupResult"]
