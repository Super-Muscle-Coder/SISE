"""
Search workflow routers.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..dependencies import get_auth_service, get_search_service
from ..entities.auth_entities import User
from ..entities.search_entities import MetricType, SearchByImageRequest, SearchByTextRequest, SearchResponse
from ..services.auth_services import AuthService
from ..services.search_services import SearchService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Search"])
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


@router.post("/image", response_model=SearchResponse, status_code=status.HTTP_200_OK)
async def search_by_image(
    file: UploadFile = File(...),
    top_k: int = Form(default=10),
    metric: MetricType = Form(default=MetricType.COSINE),
    album_id: int | None = Form(default=None),
    current_user: User = Depends(get_current_authenticated_user),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    search_service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    try:
        if credentials is None or credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "BAD_REQUEST", "message": "Uploaded file is empty"},
            )

        req = SearchByImageRequest(
            top_k=top_k,
            metric=metric,
            album_id=album_id,
        )

        return await search_service.search_by_image(
            request=req,
            image_bytes=file_bytes,
            filename=file.filename or "query_image.bin",
            current_user_id=current_user.id,
            bearer_token=credentials.credentials,
        )

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": str(exc)},
        ) from exc
    except RuntimeError as exc:
        logger.exception("Transient/internal error while searching by image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": str(exc)},
        ) from exc
    except Exception:
        logger.exception("Unexpected error while searching by image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


@router.post("/text", response_model=SearchResponse, status_code=status.HTTP_200_OK)
async def search_by_text(
    request: SearchByTextRequest,
    current_user: User = Depends(get_current_authenticated_user),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    search_service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    try:
        if credentials is None or credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
            )

        return await search_service.search_by_text(
            request=request,
            current_user_id=current_user.id,
            bearer_token=credentials.credentials,
        )

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": str(exc)},
        ) from exc
    except RuntimeError as exc:
        logger.exception("Transient/internal error while searching by text")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": str(exc)},
        ) from exc
    except Exception:
        logger.exception("Unexpected error while searching by text")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


__all__ = ["router"]