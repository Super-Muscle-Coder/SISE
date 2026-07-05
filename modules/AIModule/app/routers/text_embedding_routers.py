"""
Text Embedding Workflow — Routers Layer

FastAPI endpoints for text embedding extraction.
Prefix: text_embedding_*
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel

from app.services import TextEmbeddingService


class TextEmbedRequestBody(BaseModel):
    """Request body for POST /embed/text endpoint."""
    text: str


def get_text_embedding_service(request: Request) -> TextEmbeddingService:
    """
    FastAPI dependency: retrieve the initialized TextEmbeddingService from app.state.

    Populated once during `lifespan` startup (see ai_main.py) — reading it
    per-request guarantees the live, warmed-up service is always used.
    """
    return request.app.state.text_embedding_service


def create_text_embedding_router() -> APIRouter:
    """
    Create FastAPI router with text embedding endpoints.

    Returns:
        APIRouter with /inference/embed/text endpoint
    """
    router = APIRouter(prefix="/inference/embed", tags=["text_embedding"])

    @router.post("/text")
    async def embed_text(
        request: TextEmbedRequestBody,
        text_embedding_svc: TextEmbeddingService = Depends(get_text_embedding_service),
    ):
        """
        Extract embedding from text input.

        Request:
          - Content-Type: application/json
          - Body: {"text": "..."}
          - Max text length: 4096 characters

        Returns:
          - success: bool
          - vector: List of vector_dim float32 values (L2-normalized)
          - vector_dimension: int
          - processing_time_ms: float
          - error_code: str (if failed)
          - error_message: str (if failed)

        Errors:
          - 400: Invalid input (empty, invalid UTF-8, too long)
          - 503: Model not ready
          - 500: Internal processing error
        """
        try:
            # Extract embedding
            result = text_embedding_svc.extract_text_embedding(request.text)

            # Handle errors
            if not result.success:
                if result.error_code in [
                    "ERR_EMPTY_TEXT",
                    "ERR_TEXT_TOO_LONG",
                    "ERR_INVALID_UTF8",
                    "ERR_INVALID_TEXT",
                ]:
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
                    "message": f"Internal server error: {str(e)}",
                }
            )

    return router


__all__ = ["create_text_embedding_router"]