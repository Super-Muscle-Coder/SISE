"""
Evaluation Workflow Routers (HTTP Endpoints)
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import (
    get_auth_service,
    get_async_db_session,
    get_evaluation_service,
)
from app.entities.auth_entities import User
from app.services.auth_services import AuthService
from app.services.evaluation_services import EvaluationService

logger = logging.getLogger(__name__)

evaluation_router = APIRouter(prefix="", tags=["EvaluationService"])
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
        )
    current_user = await auth_service.get_current_user(credentials.credentials)
    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Invalid or expired token"},
        )
    return current_user


async def verify_admin_role(db_session: AsyncSession, user_id: int) -> bool:
    stmt = text("SELECT role FROM users WHERE id = :user_id")
    result = await db_session.execute(stmt, {"user_id": user_id})
    role = result.scalar_one_or_none()
    return role == "admin"


@evaluation_router.post("/eval/run", status_code=status.HTTP_202_ACCEPTED)
async def run_evaluation(
    payload: Optional[dict] = Body(default=None),
    current_user: User = Depends(get_current_authenticated_user),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db_session: AsyncSession = Depends(get_async_db_session),
    service: EvaluationService = Depends(get_evaluation_service),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
        )

    is_admin = await verify_admin_role(db_session=db_session, user_id=current_user.id)
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ERR_FORBIDDEN_ADMIN_ONLY",
                "message": "This endpoint requires admin role",
            },
        )

    limit = 100
    seed: Optional[int] = None
    if payload:
        if "limit" in payload:
            try:
                limit = int(payload["limit"])
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail={"code": "BAD_REQUEST", "message": "limit must be integer"},
                )
        if "seed" in payload and payload["seed"] is not None:
            try:
                seed = int(payload["seed"])
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail={"code": "BAD_REQUEST", "message": "seed must be integer"},
                )

    if limit <= 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "BAD_REQUEST", "message": "limit must be > 0"},
        )

    try:
        result = await service.trigger_evaluation(
            created_by=current_user.id,
            bearer_token=credentials.credentials,
            limit=limit,
            seed=seed,
        )
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("run_evaluation failed")
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to run evaluation"},
        )


@evaluation_router.get("/eval/results/{eval_id}")
async def get_evaluation_results(
    eval_id: str = Path(..., description="Evaluation run ID"),
    _current_user: User = Depends(get_current_authenticated_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        result = await service.get_evaluation_results(eval_id)
        if result is None:
            raise HTTPException(
                status_code=404,
                detail={"code": "EVAL_NOT_FOUND", "message": "Evaluation result not found"},
            )
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_evaluation_results failed")
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to get evaluation results"},
        )


@evaluation_router.get("/eval/metrics")
async def get_evaluation_metrics(
    _current_user: User = Depends(get_current_authenticated_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        return await service.get_latest_metrics()
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_evaluation_metrics failed")
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to get evaluation metrics"},
        )


__all__ = ["evaluation_router"]