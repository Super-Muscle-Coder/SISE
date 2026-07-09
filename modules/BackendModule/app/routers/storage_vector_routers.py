"""
Storage Vector routers.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..dependencies import get_auth_service, get_storage_vector_service
from ..entities.auth_entities import User
from ..entities.storage_vector_entities import (
    IndexVectorRequest,
    IndexVectorResponse,
    SearchHybridRequest,
    SearchResponse,
)
from ..services.auth_services import AuthService
from ..services.storage_vector_services import StorageVectorService, VectorDimensionMismatchError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vector", tags=["StorageModule"])
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
        )
    current_user = await auth_service.get_current_user(credentials.credentials)
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid or expired token"},
        )
    return current_user


@router.post("/index", response_model=IndexVectorResponse, status_code=status.HTTP_201_CREATED)
async def index_vector(
    body: IndexVectorRequest,
    _current_user: User = Depends(get_current_authenticated_user),
    service: StorageVectorService = Depends(get_storage_vector_service),
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
) -> IndexVectorResponse:
    # decision #5: endpoint accepts Idempotency-Key but ignores it in this phase.
    _ = idempotency_key
    try:
        return await service.index_vector(image_id=body.image_id, vector=body.vector)
    except VectorDimensionMismatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ERR_VECTOR_DIM_MISMATCH", "message": str(exc)},
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        ) from exc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while indexing vector")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


@router.post("/search/hybrid", response_model=SearchResponse, status_code=status.HTTP_200_OK)
async def search_hybrid(
    body: SearchHybridRequest,
    _current_user: User = Depends(get_current_authenticated_user),
    service: StorageVectorService = Depends(get_storage_vector_service),
) -> SearchResponse:
    try:
        return await service.search_hybrid(body)
    except VectorDimensionMismatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ERR_VECTOR_DIM_MISMATCH", "message": str(exc)},
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        ) from exc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while searching vectors")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


__all__ = ["router"]