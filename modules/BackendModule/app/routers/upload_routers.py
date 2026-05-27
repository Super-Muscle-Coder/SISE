"""
Upload Workflow Routers (HTTP Endpoints)

This module defines FastAPI routes for the upload pipeline (S1-S3 HTTP endpoints).
Routes handle request validation, dependency injection, and error mapping to HTTP status codes.

Endpoints (per openapi.yaml):
- POST /media/upload-url          → S1: Request presigned URL
- POST /media/upload/confirm      → S3: Confirm upload & finalize
- GET  /media/{image_id}          → Retrieve image metadata
- GET  /media                     → List user images
- PUT  /media/{image_id}/update   → Update image metadata
- DELETE /media/{image_id}/delete → Soft-delete image

Error responses per openapi.yaml:
- 200: Success
- 201: Created
- 204: No Content (delete success)
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (authorization failure)
- 404: Not Found
- 409: Conflict (idempotency duplicate)
- 500: Internal Server Error
"""

import logging
from typing import Optional, Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Header,
    Query,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.upload_services import UploadService
from ..entities.upload_entities import (
    PresignedUploadRequest,
    PresignedUploadResponse,
    UploadConfirmRequest,
    UploadResponse,
    ImageMetadata,
    ImageMetadataList,
)
from ..entities.auth_entities import User

logger = logging.getLogger(__name__)

# ============================================================================
# Router Setup
# ============================================================================

router = APIRouter(
    prefix="/media",
    tags=["Media"],
    responses={
        401: {"description": "Unauthorized (missing/invalid token)"},
        500: {"description": "Internal Server Error"},
    },
)


# ============================================================================
# Dependency: Get UploadService
# ============================================================================

async def get_upload_service() -> UploadService:
    """
    Dependency to provide UploadService instance.

    In production, this would be injected from the main app container
    with properly initialized adapters (MinIO, Redis, PostgreSQL).

    For now, returns a stub instance (to be completed).
    """
    # Placeholder: In real implementation, inject from DI container
    # return UploadService(minio_adapter, idempotency_adapter, postgres_adapter)
    raise NotImplementedError("UploadService DI not yet configured in main.py")


# ============================================================================
# S1: Presigned URL Endpoint
# ============================================================================

@router.post(
    "/upload-url",
    response_model=PresignedUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Request presigned URL for direct upload (S1)",
    description="Generate a presigned PUT URL for direct client upload to MinIO. Supports idempotency via Idempotency-Key header.",
)
async def request_presigned_url(
    request: PresignedUploadRequest,
    current_user: Annotated[User, Depends(lambda: None)],  # Placeholder: use actual auth dependency
    upload_service: UploadService = Depends(get_upload_service),
    idempotency_key: Optional[str] = Header(None, description="Unique request key (UUID)"),
) -> PresignedUploadResponse:
    """
    POST /media/upload-url

    Request a presigned URL for direct upload to MinIO (S1 step).

    **Flow:**
    1. Validate request (filename, content_type)
    2. Check idempotency key (Redis)
    3. Generate object_key in MinIO
    4. Get presigned PUT URL (3600s expiry per data_schema)
    5. Store idempotency mapping
    6. Return PresignedUploadResponse

    **Request Body:**
    - filename: Image filename (e.g., "vacation.jpg")
    - content_type: MIME type (image/jpeg or image/png)
    - expected_size_mb: Optional file size hint

    **Response (200 OK):**
    - upload_url: Presigned PUT URL
    - object_key: MinIO object key
    - expires_in_sec: 3600 (1 hour)

    **Error Responses:**
    - 400: Invalid content_type or filename
    - 409: Duplicate Idempotency-Key (returns cached result)
    - 503: MinIO unavailable

    **Example Request:**
    ```json
    POST /media/upload-url
    Content-Type: application/json
    Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

    {
      "filename": "vacation.jpg",
      "content_type": "image/jpeg",
      "expected_size_mb": 5
    }
    ```

    **Example Response (200):**
    ```json
    {
      "upload_url": "http://minio:9000/raw-images/...",
      "object_key": "raw-images/42/uuid/vacation.jpg",
      "expires_in_sec": 3600,
      "max_file_size_mb": 20,
      "allowed_content_types": ["image/jpeg", "image/png"],
      "note": "Upload within 1 hour..."
    }
    ```
    """
    try:
        logger.info(f"[POST /media/upload-url] User {current_user.id if current_user else '?'}")

        # Validate idempotency-key format if provided
        if idempotency_key:
            try:
                UUID(idempotency_key)  # Validate UUID format
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Idempotency-Key must be a valid UUID",
                )

        # Call service (S1)
        response = await upload_service.request_presigned_url(
            request=request,
            current_user_id=current_user.id,
            idempotency_key=idempotency_key,
        )

        logger.info(f"[POST /media/upload-url] Success: object_key={response.object_key}")
        return response

    except ValueError as e:
        logger.warning(f"[POST /media/upload-url] Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        logger.error(f"[POST /media/upload-url] Service error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to generate presigned URL. MinIO may be unavailable.",
        )
    except Exception as e:
        logger.error(f"[POST /media/upload-url] Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


# ============================================================================
# S3: Upload Confirm Endpoint
# ============================================================================

@router.post(
    "/upload/confirm",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Confirm upload and finalize (S3-S4)",
    description="Commit metadata to PostgreSQL and enqueue async indexing. Supports idempotency via Idempotency-Key header.",
)
async def confirm_upload(
    request: UploadConfirmRequest,
    current_user: Annotated[User, Depends(lambda: None)],  # Placeholder
    upload_service: UploadService = Depends(get_upload_service),
    idempotency_key: Optional[str] = Header(None, description="Unique request key (UUID)"),
) -> UploadResponse:
    """
    POST /media/upload/confirm

    Confirm upload and finalize (S3-S4 steps).

    **Flow:**
    1. Verify object_key exists in MinIO
    2. Check idempotency key (Redis)
    3. Generate image_id (UUID)
    4. INSERT into PostgreSQL with index_status='pending'
       - If fails: DELETE object from MinIO (compensating action)
    5. Enqueue Celery task (S4) for async embedding + indexing
    6. Return UploadResponse

    **Request Body:**
    - object_key: MinIO object key from presigned upload (S1)
    - album_id: Optional album ID
    - privacy_level: 0=Private, 1=Friends, 2=Public
    - tags: Optional list of tags (max 10)

    **Response (200 OK):**
    - image_id: UUID of the created image
    - minio_url: Presigned GET URL to access image
    - status: "pending"
    - index_status: "pending" (will become "ready" after S5 completes)

    **Error Responses:**
    - 400: Object not found in MinIO, invalid album_id, invalid privacy_level
    - 409: Duplicate Idempotency-Key (returns cached result)
    - 500: Database error (compensating action executed: MinIO object deleted)

    **Example Request:**
    ```json
    POST /media/upload/confirm
    Content-Type: application/json
    Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

    {
      "object_key": "raw-images/42/uuid/vacation.jpg",
      "album_id": 10,
      "privacy_level": 2,
      "tags": ["nature", "sunset"]
    }
    ```

    **Example Response (200):**
    ```json
    {
      "image_id": "abc-def-uuid",
      "minio_url": "http://minio:9000/raw-images/42/uuid/vacation.jpg?...",
      "status": "pending",
      "index_status": "pending"
    }
    ```
    """
    try:
        logger.info(f"[POST /media/upload/confirm] User {current_user.id if current_user else '?'}")

        # Validate idempotency-key format if provided
        if idempotency_key:
            try:
                UUID(idempotency_key)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Idempotency-Key must be a valid UUID",
                )

        # Call service (S3-S4)
        response = await upload_service.confirm_upload(
            request=request,
            current_user_id=current_user.id,
            idempotency_key=idempotency_key,
        )

        logger.info(f"[POST /media/upload/confirm] Success: image_id={response.image_id}")
        return response

    except ValueError as e:
        logger.warning(f"[POST /media/upload/confirm] Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        logger.error(f"[POST /media/upload/confirm] Service error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to confirm upload. Check logs for details.",
        )
    except Exception as e:
        logger.error(f"[POST /media/upload/confirm] Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


# ============================================================================
# Media Metadata: GET, PUT, DELETE
# ============================================================================

@router.get(
    "/{image_id}",
    response_model=ImageMetadata,
    status_code=status.HTTP_200_OK,
    summary="Retrieve image metadata",
    description="Get metadata and presigned GET URL for an image (with privacy checks).",
)
async def get_media_metadata(
    image_id: str,
    current_user: Annotated[User, Depends(lambda: None)],  # Placeholder
    upload_service: UploadService = Depends(get_upload_service),
) -> ImageMetadata:
    """
    GET /media/{image_id}

    Retrieve image metadata and presigned GET URL (if authorized).

    **Response (200 OK):**
    - image_id: UUID
    - user_id: Owner ID
    - album_id: Album ID (if set)
    - minio_url: Presigned GET URL
    - privacy_level: 0/1/2
    - tags: Associated tags
    - created_at: Creation timestamp
    - index_status: Vector DB status

    **Error Responses:**
    - 401: Unauthorized (no token)
    - 403: Forbidden (privacy check failed)
    - 404: Image not found
    """
    try:
        # Validate image_id format
        try:
            UUID(image_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="image_id must be a valid UUID",
            )

        # Get image metadata
        metadata = await upload_service.get_image_metadata(image_id, current_user.id)
        return ImageMetadata(**metadata)

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        elif "unauthorized" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e),
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    except Exception as e:
        logger.error(f"[GET /media/{image_id}] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put(
    "/{image_id}/update",
    response_model=ImageMetadata,
    status_code=status.HTTP_200_OK,
    summary="Update image metadata",
    description="Update album_id, privacy_level, and tags for an image.",
)
async def update_media_metadata(
    image_id: str,
    request: dict,
    current_user: Annotated[User, Depends(lambda: None)],  # Placeholder
    upload_service: UploadService = Depends(get_upload_service),
) -> ImageMetadata:
    """
    PUT /media/{image_id}/update

    Update image metadata (album, privacy, tags).

    **Error Responses:**
    - 400: Invalid request
    - 401: Unauthorized
    - 403: Forbidden (not owner)
    - 404: Image not found
    """
    raise NotImplementedError("Update metadata not yet implemented")


@router.delete(
    "/{image_id}/delete",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete image",
    description="Soft-delete an image.",
)
async def delete_media(
    image_id: str,
    current_user: Annotated[User, Depends(lambda: None)],  # Placeholder
    upload_service: UploadService = Depends(get_upload_service),
) -> None:
    """
    DELETE /media/{image_id}/delete

    Soft-delete an image (sets deleted_at timestamp).

    **Response (204 No Content):** Success

    **Error Responses:**
    - 401: Unauthorized
    - 403: Forbidden (not owner)
    - 404: Image not found
    """
    try:
        # Validate image_id format
        try:
            UUID(image_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="image_id must be a valid UUID",
            )

        # Delete image
        await upload_service.delete_image(image_id, current_user.id)
        logger.info(f"[DELETE /media/{image_id}] Success")

    except ValueError as e:
        if "not found" in str(e).lower() or "unauthorized" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower()
                else status.HTTP_403_FORBIDDEN,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"[DELETE /media/{image_id}] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


# ============================================================================
# Media List: GET /media
# ============================================================================

@router.get(
    "",
    response_model=ImageMetadataList,
    status_code=status.HTTP_200_OK,
    summary="List user's media",
    description="List all media for authenticated user with optional album filter.",
)
async def list_media(
    current_user: Annotated[User, Depends(lambda: None)],  # Placeholder
    upload_service: UploadService = Depends(get_upload_service),
    album_id: Optional[int] = Query(None, ge=1, description="Filter by album ID"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
) -> ImageMetadataList:
    """
    GET /media

    List images for authenticated user with optional album filter.

    **Query Parameters:**
    - album_id: Optional album ID to filter by
    - offset: Pagination offset (default: 0)
    - limit: Pagination limit (default: 20, max: 100)

    **Response (200 OK):**
    - items: List of ImageMetadata
    - total: Total count
    - offset: Pagination offset
    - limit: Pagination limit

    **Error Responses:**
    - 401: Unauthorized
    """
    try:
        result = await upload_service.list_user_images(
            current_user.id,
            album_id=album_id,
            offset=offset,
            limit=limit,
        )
        return ImageMetadataList(**result)

    except Exception as e:
        logger.error(f"[GET /media] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


# Export public API
__all__ = [
    "router",
    "get_upload_service",
]
