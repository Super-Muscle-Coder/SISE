"""
Batch Embedding Router

FastAPI endpoint for batch embedding extraction.

Ownership: AG-01 (AIModuleAgent)
"""

from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from pydantic import BaseModel

from ..services.batch_embedding_services import BatchEmbeddingService


class BatchEmbedResponse(BaseModel):
    """Response payload for batch embedding endpoint."""
    vectors: List[List[float]]
    successful_count: int
    failed_count: int
    processing_time_ms: float


def get_batch_embedding_service(request: Request) -> BatchEmbeddingService:
    """
    FastAPI dependency: retrieve the initialized BatchEmbeddingService from app.state.

    Populated once during `lifespan` startup (see ai_main.py) — reading it
    per-request guarantees the live, warmed-up service is always used.
    """
    return request.app.state.batch_embedding_service


def create_batch_embedding_router() -> APIRouter:
    """
    Create FastAPI router for batch embedding endpoints.

    Returns:
        APIRouter with /inference/embed/batch endpoint
    """
    router = APIRouter(prefix="/inference", tags=["batch_embedding"])

    @router.post("/embed/batch", response_model=BatchEmbedResponse)
    async def batch_embed_images(
        files: List[UploadFile] = File(...),
        batch_embedding_service: BatchEmbeddingService = Depends(get_batch_embedding_service),
    ):
        """
        Extract embeddings for a batch of images.

        Args:
            files: List of image files (JPEG or PNG)

        Returns:
            BatchEmbedResponse with vectors and statistics

        Errors:
            - 400 Bad Request: Validation error (empty batch, invalid format, too large)
            - 503 Service Unavailable: Model not ready
            - 500 Internal Server Error: Processing error or vector dim mismatch
        """
        try:
            # Read all file bytes and collect filenames + content types
            file_bytes_list = []
            filenames_list = []
            content_types_list = []

            for file in files:
                content = await file.read()
                file_bytes_list.append(content)
                filenames_list.append(file.filename or "unknown")
                content_types_list.append(file.content_type or "application/octet-stream")

            # Extract batch embeddings
            # NOTE (bug fixed): extract_batch_embeddings() requires 3 positional
            # arguments (file_bytes_list, filenames_list, content_types_list).
            # The previous call only passed 2, which raised a guaranteed
            # TypeError on every request to this endpoint.
            result, error_code = batch_embedding_service.extract_batch_embeddings(
                file_bytes_list,
                filenames_list,
                content_types_list,
            )

            # Handle errors
            if error_code == batch_embedding_service.ERR_MODEL_NOT_READY:
                raise HTTPException(
                    status_code=503,
                    detail={"code": error_code, "message": "AI model not ready yet"},
                )
            elif error_code == batch_embedding_service.ERR_BATCH_EMPTY:
                raise HTTPException(
                    status_code=400,
                    detail={"code": error_code, "message": "Batch must contain at least 1 image"},
                )
            elif error_code == batch_embedding_service.ERR_BATCH_TOO_LARGE:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": error_code,
                        "message": f"Batch size exceeds maximum ({batch_embedding_service.config.max_batch_size})",
                    },
                )
            elif error_code == batch_embedding_service.ERR_PREPROCESSING_FAILED:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": error_code,
                        "message": "Image preprocessing failed for too many images",
                    },
                )
            elif error_code == batch_embedding_service.ERR_VECTOR_DIM_MISMATCH:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "code": error_code,
                        "message": "Internal error: vector dimension mismatch",
                    },
                )

            # Success
            return BatchEmbedResponse(
                vectors=result.vectors,
                successful_count=result.successful_count,
                failed_count=result.failed_count,
                processing_time_ms=result.processing_time_ms,
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={"code": "ERR_INTERNAL", "message": f"Unexpected error: {str(e)}"},
            )

    return router


__all__ = ["create_batch_embedding_router"]