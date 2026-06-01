"""
Evaluation Routers
===================
HTTP route handlers for evaluation endpoints.

Endpoints:
- POST /eval/run → Trigger evaluation (admin-only)
- GET /eval/results/{eval_id} → Get evaluation results
- GET /eval/metrics → Get aggregated metrics
"""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.entities.evaluation_entities import (
    EvaluationRunRequest,
    EvaluationRunResponse,
    EvaluationResultResponse,
    EvaluationMetricsResponse,
)
from app.services.evaluation_services import EvaluationService


# Placeholder dependency functions (to be replaced with real DI)
def get_evaluation_service() -> EvaluationService:
    """Placeholder: Get evaluation service instance."""
    # TODO: Wire to FastAPI Depends() with real initialization
    from app.adapters.evaluation_adapters import EvaluationAdapter

    adapter = EvaluationAdapter(db_path="./data/evaluation.db")
    return EvaluationService(adapter=adapter, eval_max_images=1000, eval_top_k=10)


def get_current_user_id() -> int:
    """Placeholder: Extract user ID from JWT token."""
    # TODO: Wire to auth middleware
    return 1


def verify_admin_role(user_id: int) -> bool:
    """Placeholder: Verify user is admin."""
    # TODO: Check user roles from database
    return True


# Create router
router = APIRouter(prefix="/eval", tags=["EvaluationService"])


@router.post(
    "/run",
    response_model=EvaluationRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger an evaluation run on indexed images",
    description="Start an asynchronous evaluation job. Admin-only endpoint.",
)
async def run_evaluation(
    request: Optional[EvaluationRunRequest] = None,
    user_id: int = Depends(get_current_user_id),
    eval_service: EvaluationService = Depends(get_evaluation_service),
) -> EvaluationRunResponse:
    """
    Trigger an evaluation run on indexed images (HTTP 202 Accepted).

    This endpoint queues an async evaluation job. The actual evaluation
    runs in a background worker (Celery).

    Args:
        request: Evaluation parameters (limit, seed)
        user_id: Authenticated user ID
        eval_service: Evaluation service instance

    Returns:
        EvaluationRunResponse with eval_id and status='running'

    Raises:
        HTTPException(403): If user is not admin
        HTTPException(500): If job cannot be created
    """
    # Verify admin role
    if not verify_admin_role(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    # Use defaults if no request body provided
    if request is None:
        request = EvaluationRunRequest()

    try:
        response = await eval_service.trigger_evaluation(
            limit=request.limit,
            seed=request.seed,
            created_by=user_id,
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start evaluation: {str(e)}",
        )


@router.get(
    "/results/{eval_id}",
    response_model=EvaluationResultResponse,
    summary="Retrieve results of a completed evaluation run",
    description="Get detailed evaluation results including MRR, HitRate, Precision, Recall.",
)
async def get_evaluation_results(
    eval_id: UUID,
    user_id: int = Depends(get_current_user_id),
    eval_service: EvaluationService = Depends(get_evaluation_service),
) -> EvaluationResultResponse:
    """
    Retrieve results of a completed evaluation run.

    Args:
        eval_id: Unique evaluation ID
        user_id: Authenticated user ID (for audit)
        eval_service: Evaluation service instance

    Returns:
        EvaluationResultResponse with metrics and status

    Raises:
        HTTPException(404): If evaluation not found
    """
    result = eval_service.get_evaluation_result(eval_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation run {eval_id} not found",
        )

    return EvaluationResultResponse(
        eval_id=result.eval_id,
        status=result.status,
        mrr=result.metrics.mrr,
        hit_rate=result.metrics.hit_rate,
        precision=result.metrics.precision,
        recall=result.metrics.recall,
        query_count=result.query_count,
        completed_at=result.completed_at,
    )


@router.get(
    "/metrics",
    response_model=EvaluationMetricsResponse,
    summary="Retrieve performance benchmarking indices (MRR, HitRate, Precision, Recall)",
    description="Get aggregated metrics across all completed evaluation runs.",
)
async def get_evaluation_metrics(
    user_id: int = Depends(get_current_user_id),
    eval_service: EvaluationService = Depends(get_evaluation_service),
) -> EvaluationMetricsResponse:
    """
    Retrieve performance benchmarking indices.

    Returns aggregated metrics (averages) across all completed evaluations.

    Args:
        user_id: Authenticated user ID
        eval_service: Evaluation service instance

    Returns:
        EvaluationMetricsResponse with aggregated metrics

    Raises:
        HTTPException(500): If metrics cannot be computed
    """
    try:
        metrics = eval_service.get_aggregated_metrics()

        if metrics is None:
            # No completed evaluations yet; return zeros
            metrics = EvaluationMetricsResponse(
                mrr=0.0,
                hit_rate=0.0,
                precision=0.0,
                recall=0.0,
            )
            return metrics

        return EvaluationMetricsResponse(
            mrr=metrics.mrr,
            hit_rate=metrics.hit_rate,
            precision=metrics.precision,
            recall=metrics.recall,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve metrics: {str(e)}",
        )


__all__ = ["router"]
