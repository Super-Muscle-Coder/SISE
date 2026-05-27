"""
Search workflow routers: HTTP endpoints for search operations.
Prefix: search_
"""

import logging
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from ..entities.search_entities import (
    SearchResponse,
    SearchByImageRequest,
    SearchByTextRequest,
)
from ..services.search_services import SearchService

logger = logging.getLogger(__name__)

# Create router with /search prefix
search_router = APIRouter(prefix="/search", tags=["Search"])


async def get_search_service() -> SearchService:
    """
    Dependency injection placeholder for SearchService.
    In production, this will be wired with real adapters via DI container.
    """
    # Placeholder - real implementation will inject MilvusSearchAdapter, etc.
    raise NotImplementedError("DI wiring for SearchService not yet implemented")


@search_router.post(
    "/image",
    response_model=SearchResponse,
    summary="Search by image (app-level wrapper around inference + hybrid search)",
    status_code=status.HTTP_200_OK,
)
async def search_by_image(
    file: UploadFile = File(..., description="Image file for search"),
    top_k: int = Form(10, description="Number of top results"),
    metric: str = Form("COSINE", description="Similarity metric: L2, IP, COSINE"),
    album_id: Optional[int] = Form(None, description="Optional album filter"),
    current_user_id: int = Depends(lambda: 1),  # Placeholder - will be from JWT token
    search_service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    """
    Search for similar images using an uploaded image query.

    Args:
        file: Image file to search by
        top_k: Number of results (default 10)
        metric: Similarity metric (default COSINE)
        album_id: Optional album filter
        current_user_id: Authenticated user ID from JWT token
        search_service: SearchService from DI

    Returns:
        SearchResponse with top-k similar images, latency, and metadata

    Raises:
        400: Bad request (invalid image, dimension mismatch, etc.)
        401: Unauthorized (invalid JWT)
        500: Internal server error
    """
    logger.info(f"POST /search/image called by user {current_user_id}")

    try:
        # Read image file bytes
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image file is empty",
            )

        # Parse request parameters
        search_request = SearchByImageRequest(
            top_k=top_k,
            metric=metric,
            album_id=album_id,
        )

        # Perform search
        response = await search_service.search_by_image(
            image_bytes=image_bytes,
            current_user_id=current_user_id,
            request=search_request,
        )

        return response

    except ValueError as e:
        # Vector dimension mismatch or other validation error
        logger.warning(f"Validation error in image search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error in image search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during image search",
        )


@search_router.post(
    "/text",
    response_model=SearchResponse,
    summary="Search by text query (app-level wrapper around text embedding + hybrid search)",
    status_code=status.HTTP_200_OK,
)
async def search_by_text(
    request: SearchByTextRequest,
    current_user_id: int = Depends(lambda: 1),  # Placeholder - will be from JWT token
    search_service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    """
    Search for images using a text query.

    Args:
        request: SearchByTextRequest with query_text, top_k, metric, album_id
        current_user_id: Authenticated user ID from JWT token
        search_service: SearchService from DI

    Returns:
        SearchResponse with top-k images matching text query

    Raises:
        400: Bad request (invalid query, dimension mismatch, etc.)
        401: Unauthorized (invalid JWT)
        500: Internal server error
    """
    logger.info(f"POST /search/text called by user {current_user_id}, query='{request.query_text[:50]}...'")

    try:
        # Perform search
        response = await search_service.search_by_text(
            query_text=request.query_text,
            current_user_id=current_user_id,
            request=request,
        )

        return response

    except ValueError as e:
        # Vector dimension mismatch or other validation error
        logger.warning(f"Validation error in text search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error in text search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during text search",
        )
