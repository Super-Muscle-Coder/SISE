"""
Health Check Entities
======================
Pydantic models for health check probes (liveness and readiness).

Entities:
- HealthStatus: Response for both /health/liveness and /health/readiness
- DependencyStatus: Individual dependency health information
"""

from datetime import datetime
from typing import Dict, Optional
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DependencyState(str, Enum):
    """Dependency health states."""
    CONNECTED = "connected"
    READY = "ready"
    REACHABLE = "reachable"
    WARM = "warm"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


class HealthStatus(BaseModel):
    """
    Health status response for both liveness and readiness probes.

    Matches openapi.yaml HealthStatus schema.
    Used by orchestrators (Kubernetes, Docker Swarm, etc.) to determine service health.
    """
    status: str = Field(
        default="unknown",
        description="Overall service status: ready, degraded, or unavailable"
    )
    timestamp: datetime = Field(
        description="Timestamp when health check was performed"
    )
    config_validated: bool = Field(
        default=False,
        description=(
            "Kết quả validate cấu hình scaffold. false nghĩa là có ít nhất 1 config sai, "
            "service không nên coi là sẵn sàng phục vụ."
        ),
    )
    dependencies: Optional[Dict[str, str]] = Field(
        default=None,
        description="Individual dependency statuses (postgres, minio, ai_service, redis)"
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class ReadinessCheckResult(BaseModel):
    """Result of a single dependency readiness check."""
    name: str = Field(description="Dependency name (postgres, minio, ai_service, redis)")
    status: DependencyState = Field(description="Current state of the dependency")
    latency_ms: float = Field(description="Milliseconds taken to check this dependency")
    error: Optional[str] = Field(default=None, description="Error message if check failed")

    model_config = ConfigDict(str_strip_whitespace=True)


class ReadinessCheckResults(BaseModel):
    """Aggregated results of all readiness checks."""
    timestamp: datetime = Field(description="When checks were performed")
    all_ready: bool = Field(description="True if all enabled checks passed")
    results: Dict[str, ReadinessCheckResult] = Field(description="Per-dependency results")
    vector_dim: int = Field(description="Expected vector dimension for this deployment")

    model_config = ConfigDict(str_strip_whitespace=True)


__all__ = [
    "DependencyState",
    "HealthStatus",
    "ReadinessCheckResult",
    "ReadinessCheckResults",
]