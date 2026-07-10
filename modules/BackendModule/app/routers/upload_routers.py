"""
Upload Workflow Routers (HTTP Endpoints)
"""

from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..dependencies import get_auth_service, get_upload_service
from ..entities.auth_entities import User
from ..entities.upload_entities import PresignedUploadRequest, PresignedUploadResponse, UploadConfirmRequest, UploadResponse
from ..services.auth_services import AuthService
from ..services.upload_services import DuplicateIdempotencyKeyError, UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["Media"])
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


def _validate_idempotency_key(idempotency_key: Optional[str]) -> None:
    if not idempotency_key:
        return
    try:
        UUID(idempotency_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IDEMPOTENCY_KEY", "message": "Idempotency-Key must be a valid UUID"},
        ) from exc


@router.post("/upload-url", response_model=PresignedUploadResponse, status_code=status.HTTP_200_OK)
async def request_presigned_url(
    request: PresignedUploadRequest,
    current_user: User = Depends(get_current_authenticated_user),
    upload_service: UploadService = Depends(get_upload_service),
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
) -> PresignedUploadResponse | JSONResponse:
    try:
        _validate_idempotency_key(idempotency_key)

        response = await upload_service.request_presigned_url(
            request=request,
            current_user_id=current_user.id,
            idempotency_key=idempotency_key,
        )
        return response

    except DuplicateIdempotencyKeyError as exc:
        validated = PresignedUploadResponse(**exc.cached_response)
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content=validated.model_dump())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        ) from exc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while requesting presigned upload URL")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_legacy(
    file: UploadFile = File(...),
    album_id: Optional[int] = Form(default=None),
    privacy_level: int = Form(default=0),
    current_user: User = Depends(get_current_authenticated_user),
    upload_service: UploadService = Depends(get_upload_service),
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
) -> UploadResponse | JSONResponse:
    try:
        _validate_idempotency_key(idempotency_key)

        file_bytes = await file.read()
        response = await upload_service.upload_legacy(
            file_name=file.filename or "upload.bin",
            content_type=file.content_type or "",
            file_bytes=file_bytes,
            current_user_id=current_user.id,
            album_id=album_id,
            privacy_level=privacy_level,
            idempotency_key=idempotency_key,
        )
        return response

    except DuplicateIdempotencyKeyError as exc:
        validated = UploadResponse(**exc.cached_response)
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content=validated.model_dump())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        ) from exc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while handling legacy upload")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


@router.post("/upload/confirm", response_model=UploadResponse, status_code=status.HTTP_200_OK)
async def confirm_upload(
    request: UploadConfirmRequest,
    current_user: User = Depends(get_current_authenticated_user),
    upload_service: UploadService = Depends(get_upload_service),
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
) -> UploadResponse | JSONResponse:
    try:
        _validate_idempotency_key(idempotency_key)

        response = await upload_service.confirm_upload(
            request=request,
            current_user_id=current_user.id,
            idempotency_key=idempotency_key,
        )
        return response

    except DuplicateIdempotencyKeyError as exc:
        validated = UploadResponse(**exc.cached_response)
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content=validated.model_dump())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "METADATA_COMMIT_FAILED", "message": str(exc)},
        ) from exc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while confirming upload")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


__all__ = ["router"]