"""
Evaluation Service Entities
============================
Defines Pydantic models for evaluation requests, responses, and metrics.

Entities in this layer:
- EvaluationRunRequest: Request to trigger an evaluation run
- EvaluationRunResponse: Response when evaluation is accepted
- EvaluationResult: Complete evaluation result with metrics
- EvaluationMetrics: Aggregated metrics (MRR, HitRate, Precision, Recall)
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EvaluationStatus(str, Enum):
    """Evaluation job status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class EvaluationRunRequest(BaseModel):
    """Request to trigger an evaluation run."""
    limit: Optional[int] = Field(default=100, description="Limit evaluation to N random indexed images")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    model_config = ConfigDict(str_strip_whitespace=True)


class EvaluationRunResponse(BaseModel):
    """Response when evaluation job is accepted (HTTP 202)."""
    eval_id: UUID = Field(description="Unique evaluation run ID")
    status: EvaluationStatus = Field(default=EvaluationStatus.RUNNING, description="Initial job status")

    model_config = ConfigDict(str_strip_whitespace=True)


class EvaluationMetrics(BaseModel):
    """Performance metrics for a completed evaluation."""
    mrr: float = Field(description="Mean Reciprocal Rank: average rank of first relevant result")
    hit_rate: float = Field(description="Hit Rate: proportion of queries with at least 1 relevant result in top-K")
    precision: float = Field(description="Precision@K: relevant results / total results returned")
    recall: float = Field(description="Recall: relevant results found / total relevant results in corpus")

    model_config = ConfigDict(str_strip_whitespace=True)


class EvaluationResult(BaseModel):
    """Complete evaluation result with all metadata."""
    eval_id: UUID = Field(description="Unique evaluation run ID")
    status: EvaluationStatus = Field(description="Final job status")
    metrics: EvaluationMetrics = Field(description="Computed metrics")
    query_count: int = Field(description="Number of evaluation queries performed")
    completed_at: datetime = Field(description="Timestamp when evaluation completed")

    model_config = ConfigDict(str_strip_whitespace=True)


class EvaluationResultResponse(BaseModel):
    """Response for GET /eval/results/{eval_id}."""
    eval_id: UUID = Field(description="Unique evaluation run ID")
    status: EvaluationStatus = Field(description="Job status")
    mrr: float = Field(description="Mean Reciprocal Rank")
    hit_rate: float = Field(description="Hit Rate@K")
    precision: float = Field(description="Precision@K")
    recall: float = Field(description="Recall")
    query_count: int = Field(description="Number of queries")
    completed_at: datetime = Field(description="Completion timestamp")

    model_config = ConfigDict(str_strip_whitespace=True)


class EvaluationMetricsResponse(BaseModel):
    """Response for GET /eval/metrics (aggregated metrics)."""
    mrr: float = Field(description="Overall Mean Reciprocal Rank")
    hit_rate: float = Field(description="Overall Hit Rate@K")
    precision: float = Field(description="Overall Precision@K")
    recall: float = Field(description="Overall Recall")

    model_config = ConfigDict(str_strip_whitespace=True)


__all__ = [
    "EvaluationStatus",
    "EvaluationRunRequest",
    "EvaluationRunResponse",
    "EvaluationMetrics",
    "EvaluationResult",
    "EvaluationResultResponse",
    "EvaluationMetricsResponse",
]
