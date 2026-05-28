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

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.entities.media_entities import (
    AlbumCreateRequest,
    AlbumUpdateRequest,
    AlbumResponse,
    AlbumListResponse,
    ImageUpdateMetadataRequest,
    ImageMetadata,
    ImageListResponse,
)
from app.services.media_services import MediaService
from app.adapters.media_adapters import AlbumAdapter, ImageAdapter

logger = logging.getLogger(__name__)

media_router = APIRouter(prefix="", tags=["Media", "Albums"])


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

async def get_current_user_id() -> int:
    """
    Extract current user ID from JWT token (placeholder).
    In real impl, use FastAPI Depends(get_current_user).
    """
    # Placeholder: return mock user ID 1
    return 1


async def get_media_service() -> MediaService:
    """
    Get MediaService instance (placeholder).
    In real impl, inject from FastAPI dependency container.
    """
    # Placeholder: create mock adapters
    album_adapter = AlbumAdapter(session=None)
    image_adapter = ImageAdapter(session=None)
    return MediaService(album_adapter, image_adapter)


# ============================================================================
# ALBUM ROUTES
# ============================================================================

@media_router.get("/albums", response_model=AlbumListResponse)
async def list_albums(
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    List albums for authenticated user.

    Query Parameters:
    - offset: Pagination offset (default 0)
    - limit: Pagination limit (default 20, max 100)

    Returns:
    - AlbumListResponse: Paginated list of albums
    """
    logger.info(f"GET /albums for user {user_id}")

    result = await service.list_albums(user_id, offset, limit)
    return AlbumListResponse(**result)


@media_router.post("/albums", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
async def create_album(
    req: AlbumCreateRequest,
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    Create a new album for authenticated user.

    Request Body:
    - title (required): Album title (1-100 chars)
    - description (optional): Album description (max 500 chars)
    - is_public (optional): Public visibility flag (default false)

    Returns:
    - AlbumResponse: Created album details (201 Created)
    """
    logger.info(f"POST /albums for user {user_id}")

    album = await service.create_album(user_id, req)
    return AlbumResponse(**album)


@media_router.get("/albums/{album_id}", response_model=AlbumResponse)
async def get_album(
    album_id: int,
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    Get album details (permission check: owner only).

    Path Parameters:
    - album_id: Album ID

    Returns:
    - AlbumResponse: Album details
    - 404: Album not found or not owned by user
    - 403: Forbidden (not owner)
    """
    logger.info(f"GET /albums/{album_id} for user {user_id}")

    album = await service.get_album(album_id, user_id)
    if album is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found or not owned by user"
        )

    return AlbumResponse(**album)


@media_router.put("/albums/{album_id}", response_model=AlbumResponse)
async def update_album(
    album_id: int,
    req: AlbumUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    Update album (permission check: owner only).

    Path Parameters:
    - album_id: Album ID

    Request Body:
    - title (optional): New album title
    - description (optional): New description
    - is_public (optional): New visibility flag

    Returns:
    - AlbumResponse: Updated album details
    - 404: Album not found or not owned by user
    - 403: Forbidden (not owner)
    """
    logger.info(f"PUT /albums/{album_id} for user {user_id}")

    album = await service.update_album(album_id, user_id, req)
    if album is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found or not owned by user"
        )

    return AlbumResponse(**album)


@media_router.delete("/albums/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_album(
    album_id: int,
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    Delete (soft delete) album (permission check: owner only).

    Path Parameters:
    - album_id: Album ID

    Returns:
    - 204: No Content (album deleted)
    - 404: Album not found or not owned by user
    - 403: Forbidden (not owner)
    """
    logger.info(f"DELETE /albums/{album_id} for user {user_id}")

    success = await service.delete_album(album_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found or not owned by user"
        )

    return None


# ============================================================================
# IMAGE/MEDIA ROUTES
# ============================================================================

@media_router.get("/media", response_model=ImageListResponse)
async def list_images(
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    album_id: Optional[int] = Query(None, description="Filter by album ID"),
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    List images for authenticated user (excluding soft-deleted).

    Query Parameters:
    - offset: Pagination offset (default 0)
    - limit: Pagination limit (default 20, max 100)
    - album_id (optional): Filter by album

    Returns:
    - ImageListResponse: Paginated list of images
    """
    logger.info(f"GET /media for user {user_id} (album={album_id})")

    result = await service.list_images(user_id, offset, limit, album_id)
    return ImageListResponse(**result)


@media_router.get("/media/{image_id}", response_model=ImageMetadata)
async def get_image(
    image_id: str,
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    Get image metadata and signed GET URL (permission check: owner only).

    Path Parameters:
    - image_id: Image UUID

    Returns:
    - ImageMetadata: Image metadata (includes presigned MinIO URL if authorized)
    - 404: Image not found or not owned by user
    - 403: Forbidden (not owner)
    """
    logger.info(f"GET /media/{image_id} for user {user_id}")

    image = await service.get_image(image_id, user_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found or not owned by user"
        )

    return ImageMetadata(**image)


@media_router.put("/media/{image_id}/update", response_model=ImageMetadata)
async def update_image(
    image_id: str,
    req: ImageUpdateMetadataRequest,
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    Update image metadata (permission check: owner only).

    Path Parameters:
    - image_id: Image UUID

    Request Body:
    - album_id (optional): Move to different album
    - privacy_level (optional): Change privacy level (0, 1, 2)
    - tags (optional): Update tags array

    Returns:
    - ImageMetadata: Updated image metadata
    - 404: Image not found or not owned by user
    - 403: Forbidden (not owner)
    """
    logger.info(f"PUT /media/{image_id}/update for user {user_id}")

    image = await service.update_image_metadata(image_id, user_id, req)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found or not owned by user"
        )

    return ImageMetadata(**image)


@media_router.delete("/media/{image_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: str,
    user_id: int = Depends(get_current_user_id),
    service: MediaService = Depends(get_media_service),
):
    """
    Delete (soft delete) image (permission check: owner only).

    Path Parameters:
    - image_id: Image UUID

    Returns:
    - 204: No Content (image deleted)
    - 404: Image not found or not owned by user
    - 403: Forbidden (not owner)
    """
    logger.info(f"DELETE /media/{image_id}/delete for user {user_id}")

    success = await service.delete_image(image_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found or not owned by user"
        )

    return None


__all__ = ["media_router"]
