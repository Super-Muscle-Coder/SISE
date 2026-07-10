"""
Media Workflow Routers (HTTP Endpoints)

FastAPI routes for Album and Image CRUD per openapi.yaml.
- GET /albums — List albums
- POST /albums — Create album
- GET /albums/{album_id} — Get album
- PUT /albums/{album_id} — Update album
- DELETE /albums/{album_id} — Delete album
- GET /media — List images
- GET /media/{image_id} — Get image
- PUT /media/{image_id}/update — Update image
- DELETE /media/{image_id}/delete — Delete image
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.dependencies import get_auth_service, get_media_service
from app.entities.auth_entities import User
from app.entities.media_entities import (
    AlbumCreateRequest,
    AlbumListResponse,
    AlbumResponse,
    AlbumUpdateRequest,
    ImageListResponse,
    ImageMetadata,
    ImageUpdateMetadataRequest,
)
from app.services.auth_services import AuthService
from app.services.media_services import MediaService

logger = logging.getLogger(__name__)

media_router = APIRouter(prefix="", tags=["Media", "Albums"])
bearer_scheme = HTTPBearer(auto_error=False)


# ============================================================================
# AUTH DEPENDENCY
# ============================================================================

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


# ============================================================================
# ALBUM ROUTES
# ============================================================================

@media_router.get("/albums", response_model=AlbumListResponse)
async def list_albums(
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("GET /albums user_id=%s", current_user.id)
    try:
        result = await service.list_albums(current_user.id, offset, limit)
        return AlbumListResponse(**result)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in list_albums")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to list albums"},
        )


@media_router.post("/albums", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
async def create_album(
    req: AlbumCreateRequest,
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("POST /albums user_id=%s", current_user.id)
    try:
        album = await service.create_album(current_user.id, req)
        return AlbumResponse(**album)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in create_album")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to create album"},
        )


@media_router.get("/albums/{album_id}", response_model=AlbumResponse)
async def get_album(
    album_id: int,
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("GET /albums/%s user_id=%s", album_id, current_user.id)
    try:
        album = await service.get_album(album_id, current_user.id)
        if album is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ALBUM_NOT_FOUND", "message": "Album not found"},
            )
        return AlbumResponse(**album)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in get_album")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to get album"},
        )


@media_router.put("/albums/{album_id}", response_model=AlbumResponse)
async def update_album(
    album_id: int,
    req: AlbumUpdateRequest,
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("PUT /albums/%s user_id=%s", album_id, current_user.id)
    try:
        album = await service.update_album(album_id, current_user.id, req)
        if album is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ALBUM_NOT_FOUND", "message": "Album not found"},
            )
        return AlbumResponse(**album)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in update_album")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to update album"},
        )


@media_router.delete("/albums/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_album(
    album_id: int,
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("DELETE /albums/%s user_id=%s", album_id, current_user.id)
    try:
        success = await service.delete_album(album_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ALBUM_NOT_FOUND", "message": "Album not found"},
            )
        return None
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in delete_album")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to delete album"},
        )


# ============================================================================
# IMAGE/MEDIA ROUTES
# ============================================================================

@media_router.get("/media", response_model=ImageListResponse)
async def list_images(
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    album_id: Optional[int] = Query(None, description="Filter by album ID"),
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info(
        "GET /media user_id=%s offset=%s limit=%s album_id=%s",
        current_user.id,
        offset,
        limit,
        album_id,
    )
    try:
        result = await service.list_images(current_user.id, offset, limit, album_id)
        return ImageListResponse(**result)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in list_images")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to list media"},
        )


@media_router.get("/media/{image_id}", response_model=ImageMetadata)
async def get_image(
    image_id: str,
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("GET /media/%s user_id=%s", image_id, current_user.id)
    try:
        image = await service.get_image(image_id, current_user.id)
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "IMAGE_NOT_FOUND", "message": "Image not found"},
            )
        return ImageMetadata(**image)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in get_image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to get media metadata"},
        )


@media_router.put("/media/{image_id}/update", response_model=ImageMetadata)
async def update_image_metadata(
    image_id: str,
    req: ImageUpdateMetadataRequest,
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("PUT /media/%s/update user_id=%s", image_id, current_user.id)
    try:
        image = await service.update_image_metadata(image_id, current_user.id, req)
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "IMAGE_NOT_FOUND", "message": "Image not found"},
            )
        return ImageMetadata(**image)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in update_image_metadata")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to update media metadata"},
        )


@media_router.delete("/media/{image_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: str,
    current_user: User = Depends(get_current_authenticated_user),
    service: MediaService = Depends(get_media_service),
):
    logger.info("DELETE /media/%s/delete user_id=%s", image_id, current_user.id)
    try:
        success = await service.delete_image(image_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "IMAGE_NOT_FOUND", "message": "Image not found"},
            )
        return None
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(exc)},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in delete_image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to delete media"},
        )


__all__ = ["media_router"]