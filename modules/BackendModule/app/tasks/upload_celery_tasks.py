"""
Upload Workflow Celery Tasks (Async Processing)

This module defines Celery tasks for S4-S5 (async embedding + indexing).
Tasks are enqueued from upload_services.py after S3 (metadata commit).

Task Flow (S4-S5):
1. Fetch image metadata from PostgreSQL
2. Retrieve image bytes from MinIO
3. Call AG-01 (AI Service) to extract embedding (vector_dim=512)
4. Validate embedding dimension
5. Insert embedding into Milvus with metadata
6. Update PostgreSQL index_status to 'ready' (S5)
7. On failure: Update index_status to 'failed', schedule retry

Constraints from data_schema.yaml:
- vector_dim: 512 (ViT-B/32)
- retry_policy: max_retries=3, backoff_ms=1000, factor=2 (1s, 2s, 4s)
- Exponential backoff: 1000ms, 2000ms, 4000ms
"""

import logging
import requests
from typing import Optional, Dict, Any
from uuid import UUID

from celery import Celery, Task
from celery.exceptions import Retry

logger = logging.getLogger(__name__)


# ============================================================================
# Celery Task Configuration
# ============================================================================

# Placeholder: In production, configure Celery app from environment
# celery_app = Celery("upload_tasks")
# celery_app.config_from_object("celery_config")


class UploadTaskBase(Task):
    """
    Base class for upload tasks with custom error handling.

    Implements retry logic with exponential backoff per data_schema.yaml.
    """

    autoretry_for = (Exception,)
    retry_kwargs = {
        "max_retries": 3,
    }
    retry_backoff = True
    retry_backoff_max = 4000  # 4 seconds max
    retry_backoff_base = 1000  # Start at 1 second
    retry_jitter = False


# ============================================================================
# S4-S5: Process Image Embedding and Indexing
# ============================================================================

# @celery_app.task(
#     bind=True,
#     base=UploadTaskBase,
#     name="upload_tasks.process_image_embedding_and_index"
# )
async def process_image_embedding_and_index(
    self,
    image_id: str,
) -> Dict[str, Any]:
    """
    S4-S5: Async task to extract embedding and index into Milvus.

    **Task Flow:**
    1. Fetch image metadata from PostgreSQL
    2. Retrieve image bytes from MinIO
    3. Call AG-01 (POST /inference/embed/image) to extract embedding
    4. Validate embedding dimension (must be 512 per data_schema)
    5. Insert embedding into Milvus with metadata filtering
    6. Update PostgreSQL index_status = 'ready' (S5)

    **On Failure:**
    - Update index_status = 'failed'
    - Schedule retry with exponential backoff (1s, 2s, 4s) if retries < 3
    - Log permanent failure for manual intervention

    **Args:**
    - image_id: UUID of the image to process

    **Returns:**
    - Dict with status, message, and vector_dim

    **Raises:**
    - RuntimeError: If embedding extraction or indexing fails
    """
    task_id = self.request.id if hasattr(self, "request") else "unknown"
    retry_count = self.request.retries if hasattr(self, "request") else 0

    logger.info(f"[S4-S5] Starting task {task_id} for image {image_id} (retry {retry_count})")

    try:
        # ====================================================================
        # Step 1: Fetch image metadata from PostgreSQL
        # ====================================================================
        logger.info(f"[S4] Step 1: Fetching image metadata for {image_id}")
        image_metadata = await _fetch_image_metadata(image_id)

        if not image_metadata:
            logger.error(f"[S4] Image not found in PostgreSQL: {image_id}")
            raise RuntimeError(f"Image metadata not found: {image_id}")

        user_id = image_metadata.get("user_id")
        album_id = image_metadata.get("album_id")
        privacy_level = image_metadata.get("privacy_level", 0)
        tags = image_metadata.get("tags", [])
        minio_object_name = image_metadata.get("minio_object_name")

        logger.info(f"[S4] Fetched metadata: user={user_id}, album={album_id}, privacy={privacy_level}")

        # ====================================================================
        # Step 2: Retrieve image bytes from MinIO
        # ====================================================================
        logger.info(f"[S4] Step 2: Retrieving image from MinIO: {minio_object_name}")
        image_bytes = await _fetch_image_from_minio(minio_object_name)

        if not image_bytes:
            logger.error(f"[S4] Failed to retrieve image from MinIO: {minio_object_name}")
            raise RuntimeError(f"Failed to retrieve image from MinIO")

        logger.info(f"[S4] Retrieved image bytes: {len(image_bytes)} bytes")

        # ====================================================================
        # Step 3: Call AG-01 to extract embedding
        # ====================================================================
        logger.info(f"[S4] Step 3: Calling AI Service to extract embedding")
        embedding_response = await _call_ai_service_embed_image(image_bytes)

        vector = embedding_response.get("vector")
        vector_dim = embedding_response.get("dim")
        model_name = embedding_response.get("model")

        logger.info(f"[S4] Received embedding: dim={vector_dim}, model={model_name}")

        # ====================================================================
        # Step 4: Validate vector dimension (constraint: 512 per data_schema)
        # ====================================================================
        EXPECTED_DIM = 512  # From data_schema.yaml → global_configs.vector_dim
        if vector_dim != EXPECTED_DIM:
            logger.error(f"[S4] Vector dimension mismatch: expected {EXPECTED_DIM}, got {vector_dim}")
            # Note: This is a permanent failure (no retry) per constraint
            await _update_image_index_status(image_id, "failed")
            raise RuntimeError(
                f"Vector dimension mismatch: expected {EXPECTED_DIM}, got {vector_dim}. "
                f"Marked as failed (no retry)."
            )

        logger.info(f"[S4] Vector dimension validated: {vector_dim}")

        # ====================================================================
        # Step 5: Insert embedding into Milvus
        # ====================================================================
        logger.info(f"[S4] Step 5: Inserting vector into Milvus")
        milvus_metadata = {
            "user_id": user_id,
            "album_id": album_id,
            "privacy_level": privacy_level,
            "tags": tags,
            "created_at": image_metadata.get("created_at"),
        }
        await _insert_vector_into_milvus(image_id, vector, milvus_metadata)

        logger.info(f"[S4] Successfully inserted vector into Milvus: {image_id}")

        # ====================================================================
        # Step 5 (S5): Update index_status to 'ready'
        # ====================================================================
        logger.info(f"[S5] Updating index_status to 'ready'")
        await _update_image_index_status(image_id, "ready")

        logger.info(f"[S5] Task completed successfully: image_id={image_id}, index_status=ready")
        return {
            "status": "success",
            "message": "Image embedded and indexed successfully",
            "image_id": image_id,
            "vector_dim": vector_dim,
            "model": model_name,
        }

    except RuntimeError as e:
        logger.error(f"[S4-S5] Runtime error: {str(e)}")
        # Update index_status to 'failed'
        await _update_image_index_status(image_id, "failed")

        # Retry with exponential backoff if retries < max_retries
        max_retries = 3
        if retry_count < max_retries:
            # Celery will handle exponential backoff via retry_backoff
            logger.warning(f"[S4-S5] Retrying task (attempt {retry_count + 1}/{max_retries})")
            # Note: In production, call self.retry() with appropriate backoff
            # raise self.retry(exc=e, countdown=...)
            raise RuntimeError(str(e))
        else:
            logger.error(f"[S4-S5] Max retries exceeded for image {image_id}, marking as failed")
            raise RuntimeError(f"Max retries exceeded: {str(e)}")

    except Exception as e:
        logger.error(f"[S4-S5] Unexpected error: {str(e)}")
        await _update_image_index_status(image_id, "failed")
        raise RuntimeError(f"Unexpected error during embedding/indexing: {str(e)}")


# ============================================================================
# Helper Functions (Placeholder Implementations)
# ============================================================================

async def _fetch_image_metadata(image_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch image metadata from PostgreSQL.

    Args:
        image_id: UUID of the image

    Returns:
        Image metadata dict or None if not found

    **In Production:**
    - Connect to PostgreSQL
    - Query images table
    - Return image row as dict
    """
    logger.debug(f"Fetching metadata for image {image_id} from PostgreSQL")
    # Placeholder implementation
    return {
        "id": image_id,
        "user_id": 42,
        "album_id": 10,
        "minio_object_name": f"raw-images/42/{image_id}/vacation.jpg",
        "privacy_level": 2,
        "tags": ["nature", "sunset"],
        "created_at": "2026-05-09T12:00:00Z",
    }


async def _fetch_image_from_minio(object_name: str) -> Optional[bytes]:
    """
    Retrieve image bytes from MinIO.

    Args:
        object_name: MinIO object key (e.g., "raw-images/42/uuid/file.jpg")

    Returns:
        Image bytes or None if not found

    **In Production:**
    - Connect to MinIO
    - GET object_name from raw-images bucket
    - Return binary content
    """
    logger.debug(f"Fetching image from MinIO: {object_name}")
    # Placeholder: return dummy image bytes
    return b"fake_image_bytes"


async def _call_ai_service_embed_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Call AG-01 (AI Service) to extract image embedding.

    Args:
        image_bytes: Binary image data

    Returns:
        Dict with keys: vector (list), dim (int), model (str)

    **In Production:**
    - HTTP POST to AG-01 /inference/embed/image
    - Send image as multipart/form-data
    - Validate response: vector dim == 512
    - Return embedding vector

    **Constraint:**
    - Vector dimension must be 512 (ViT-B/32)
    - If mismatch, raise RuntimeError (permanent failure, no retry)
    """
    logger.debug(f"Calling AI Service to embed image ({len(image_bytes)} bytes)")

    # Placeholder: return dummy embedding
    # In production, make actual HTTP request to AI_SERVICE_URL/inference/embed/image
    return {
        "vector": [0.1] * 512,  # Dummy 512-dim vector
        "dim": 512,
        "model": "clip-vit-b-32",
    }


async def _insert_vector_into_milvus(
    image_id: str,
    vector: list,
    metadata: Dict[str, Any],
) -> None:
    """
    Insert vector embedding into Milvus with metadata.

    Args:
        image_id: UUID of the image
        vector: Embedding vector (512-dim)
        metadata: Metadata dict for filtering (user_id, privacy_level, tags, etc.)

    **In Production:**
    - Connect to Milvus
    - UPSERT into collection with:
      - vector (512-dim float)
      - metadata fields (user_id, album_id, privacy_level, tags)
    - Handle constraint violations

    **Metadata Structure (for privacy-aware search):**
    - user_id: Integer, used for ownership filtering
    - album_id: Integer, used for album filtering
    - privacy_level: 0/1/2, used for privacy filtering
    - tags: Array, used for tag-based filtering
    """
    logger.debug(f"Inserting vector into Milvus for image {image_id}")
    # Placeholder implementation
    logger.info(f"Vector inserted: image_id={image_id}, dim={len(vector)}, metadata={metadata}")


async def _update_image_index_status(image_id: str, status: str) -> None:
    """
    Update image index_status in PostgreSQL.

    Args:
        image_id: UUID of the image
        status: New status (pending, ready, failed)

    **In Production:**
    - Connect to PostgreSQL
    - UPDATE images SET index_status = status WHERE id = image_id
    - Handle constraint violations
    """
    logger.debug(f"Updating index_status for image {image_id} to '{status}'")
    # Placeholder implementation
    logger.info(f"Index status updated: image_id={image_id}, status={status}")


# ============================================================================
# Task Registration & Export
# ============================================================================

__all__ = [
    "process_image_embedding_and_index",
]
