"""
Admin Workflow Routers
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_admin_service, get_async_db_session, get_auth_service
from app.entities.admin_entities import ReindexRequest, ReindexResponse
from app.entities.auth_entities import User
from app.services.admin_services import AdminService
from app.services.auth_services import AuthService

logger = logging.getLogger(__name__)

admin_router = APIRouter(prefix="", tags=["Admin"])
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


@admin_router.post(
    "/admin/reindex",
    response_model=ReindexResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_reindex(
    req: ReindexRequest = ReindexRequest(),
    current_user: User = Depends(get_current_authenticated_user),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db_session: AsyncSession = Depends(get_async_db_session),
    admin_service: AdminService = Depends(get_admin_service),
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

    try:
        result = await admin_service.trigger_reindex(
            bearer_token=credentials.credentials,
            batch_size=req.batch_size,
            resume_from=req.resume_from,
        )
        return ReindexResponse(**result)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to trigger admin reindex")
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to trigger reindex"},
        )


__all__ = ["admin_router"]