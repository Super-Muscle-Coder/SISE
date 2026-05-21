"""
Image Embedding Workflow — Routers Layer

FastAPI endpoints for image embedding extraction.
Prefix: image_embedding_*
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from app.services import ImageEmbeddingService


def create_image_embedding_router(image_embedding_svc: ImageEmbeddingService) -> APIRouter:
    """
    Create FastAPI router with image embedding endpoints.

    Args:
        image_embedding_svc: Initialized ImageEmbeddingService instance

    Returns:
        APIRouter with /inference/embed/* endpoints
    """
    router = APIRouter(prefix="/inference/embed", tags=["image_embedding"])

    @router.post("/image")
    async def embed_image(file: UploadFile = File(...)):
        """
        Extract embedding from image file.

        Accepts:
          - Content-Type: multipart/form-data
          - File field: image file (JPEG or PNG)
          - Max size: 20MB

        Returns:
          - success: bool
          - vector: List of 512 float32 values (L2-normalized)
          - vector_dimension: 512
          - processing_time_ms: float
          - error_code: str (if failed)
          - error_message: str (if failed)

        Errors:
          - 400: Invalid input (file format, size)
          - 503: Model not ready
          - 500: Internal processing error
        """
        try:
            # Read file bytes
            file_bytes = await file.read()

            # Get content type
            content_type = file.content_type or "application/octet-stream"

            # Extract embedding
            result = image_embedding_svc.extract_image_embedding(file_bytes, content_type)

            # Handle errors
            if not result.success:
                if result.error_code in ["ERR_FILE_TOO_LARGE", "ERR_INVALID_CONTENT_TYPE", "ERR_UNSUPPORTED_IMAGE_MODE"]:
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "code": result.error_code,
                            "message": result.error_message,
                        }
                    )
                elif result.error_code == "ERR_MODEL_NOT_READY":
                    raise HTTPException(
                        status_code=503,
                        detail={
                            "code": result.error_code,
                            "message": result.error_message,
                        }
                    )
                else:
                    raise HTTPException(
                        status_code=500,
                        detail={
                            "code": result.error_code,
                            "message": result.error_message,
                        }
                    )

            # Success response
            return {
                "success": True,
                "vector": result.vector,
                "vector_dimension": result.vector_dimension,
                "processing_time_ms": result.processing_time_ms,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "ERR_INTERNAL",
                    "message": str(e),
                }
            )

    return router


__all__ = ["create_image_embedding_router"]
