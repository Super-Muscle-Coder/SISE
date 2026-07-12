"""
Upload Workflow Services (Business Logic Layer)
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional

from ..adapters.upload_adapters import IdempotencyAdapter, MinIOAdapter, PostgreSQLImageAdapter
from ..entities.upload_entities import PresignedUploadRequest, PresignedUploadResponse, UploadConfirmRequest, UploadResponse
from ..tasks.indexing_celery_tasks import process_image_indexing

logger = logging.getLogger(__name__)


class DuplicateIdempotencyKeyError(Exception):
    """Raised when idempotency key already exists and cached response should be returned with HTTP 409."""

    def __init__(self, cached_response: Dict[str, Any]):
        super().__init__("Duplicate idempotency key")
        self.cached_response = cached_response


class UploadService:
    def __init__(
        self,
        minio_adapter: MinIOAdapter,
        idempotency_adapter: IdempotencyAdapter,
        postgres_adapter: PostgreSQLImageAdapter,
    ):
        self.minio = minio_adapter
        self.idempotency = idempotency_adapter
        self.postgres = postgres_adapter

    async def request_presigned_url(
        self,
        request: PresignedUploadRequest,
        current_user_id: int,
        idempotency_key: Optional[str] = None,
    ) -> PresignedUploadResponse:
        self._validate_presigned_request(request)

        if idempotency_key:
            cached = await self.idempotency.retrieve_key(current_user_id, idempotency_key)
            if cached is not None:
                raise DuplicateIdempotencyKeyError(cached_response=cached)

        image_id = str(uuid.uuid4())
        object_key = f"raw-images/{current_user_id}/{image_id}/{request.filename}"

        upload_url = await self.minio.generate_presigned_put_url(
            object_key=object_key,
            expires_in_sec=3600,
            content_type=request.content_type,
        )

        response = PresignedUploadResponse(
            upload_url=upload_url,
            object_key=object_key,
            expires_in_sec=3600,
            max_file_size_mb=20,
            allowed_content_types=["image/jpeg", "image/png"],
            note="Upload within 1 hour and respect allowed_content_types.",
        )

        if idempotency_key:
            await self.idempotency.store_key(current_user_id, idempotency_key, response.model_dump())

        return response

    async def confirm_upload(
        self,
        request: UploadConfirmRequest,
        current_user_id: int,
        idempotency_key: Optional[str] = None,
    ) -> UploadResponse:
        self._validate_confirm_request(request)

        if idempotency_key:
            cached = await self.idempotency.retrieve_key(current_user_id, idempotency_key)
            if cached is not None:
                raise DuplicateIdempotencyKeyError(cached_response=cached)

        exists = await self.minio.verify_object_exists(request.object_key)
        if not exists:
            raise ValueError(f"Object not found in MinIO: {request.object_key}")

        image_id = str(uuid.uuid4())

        try:
            await self.postgres.insert_image_metadata(
                image_id=image_id,
                user_id=current_user_id,
                album_id=request.album_id,
                minio_object_name=request.object_key,
                minio_bucket="raw-images",
                privacy_level=int(request.privacy_level),
                tags=request.tags,
            )
        except Exception as exc:
            try:
                await self.minio.delete_object(request.object_key)
                logger.warning("[S3] Compensating action executed: deleted object %s", request.object_key)
            except Exception:
                logger.exception("[S3] Compensating action failed for object %s", request.object_key)
            raise RuntimeError(f"Failed to commit metadata: {exc}") from exc

        await self.enqueue_indexing_task(image_id=image_id)

        try:
            minio_url = await self.minio.generate_presigned_get_url(
                object_key=request.object_key,
                expires_in_sec=3600,
            )
        except Exception:
            logger.warning("[S3] Failed to generate presigned GET URL, using endpoint fallback")
            minio_url = self.minio.build_object_url(request.object_key)

        response = UploadResponse(
            image_id=image_id,
            minio_url=minio_url,
            status="pending",
            index_status="pending",
        )

        if idempotency_key:
            await self.idempotency.store_key(current_user_id, idempotency_key, response.model_dump())

        return response

    async def upload_legacy(
        self,
        *,
        file_name: str,
        content_type: str,
        file_bytes: bytes,
        current_user_id: int,
        album_id: Optional[int],
        privacy_level: int,
        idempotency_key: Optional[str] = None,
    ) -> UploadResponse:
        self._validate_legacy_upload_input(content_type=content_type, file_bytes=file_bytes, privacy_level=privacy_level)

        if idempotency_key:
            cached = await self.idempotency.retrieve_key(current_user_id, idempotency_key)
            if cached is not None:
                raise DuplicateIdempotencyKeyError(cached_response=cached)

        image_id = str(uuid.uuid4())
        object_key = f"raw-images/{current_user_id}/{image_id}/{file_name}"

        await self.minio.upload_object_bytes(
            object_key=object_key,
            payload=file_bytes,
            content_type=content_type,
        )

        try:
            await self.postgres.insert_image_metadata(
                image_id=image_id,
                user_id=current_user_id,
                album_id=album_id,
                minio_object_name=object_key,
                minio_bucket="raw-images",
                privacy_level=privacy_level,
                tags=None,
            )
        except Exception as exc:
            try:
                await self.minio.delete_object(object_key)
                logger.warning("[Legacy Upload] Compensating action executed: deleted object %s", object_key)
            except Exception:
                logger.exception("[Legacy Upload] Compensating action failed for object %s", object_key)
            raise RuntimeError(f"Failed to commit metadata: {exc}") from exc

        await self.enqueue_indexing_task(image_id=image_id)

        try:
            minio_url = await self.minio.generate_presigned_get_url(object_key=object_key, expires_in_sec=3600)
        except Exception:
            logger.warning("[Legacy Upload] Failed to generate presigned GET URL, using endpoint fallback")
            minio_url = self.minio.build_object_url(object_key)

        response = UploadResponse(
            image_id=image_id,
            minio_url=minio_url,
            status="pending",
            index_status="pending",
        )

        if idempotency_key:
            await self.idempotency.store_key(current_user_id, idempotency_key, response.model_dump())

        return response

    async def enqueue_indexing_task(self, image_id: str) -> None:
        process_image_indexing.delay(image_id)

    def _validate_presigned_request(self, request: PresignedUploadRequest) -> None:
        allowed_types = {"image/jpeg", "image/png"}
        if request.content_type not in allowed_types:
            raise ValueError(f"content_type must be one of {allowed_types}, got {request.content_type}")
        if request.expected_size_mb is not None and request.expected_size_mb > 20:
            raise ValueError(f"expected_size_mb must be ≤ 20 MB, got {request.expected_size_mb}")

    def _validate_confirm_request(self, request: UploadConfirmRequest) -> None:
        if int(request.privacy_level) not in (0, 1, 2):
            raise ValueError(f"privacy_level must be 0/1/2, got {request.privacy_level}")
        if request.tags is not None:
            if len(request.tags) > 10:
                raise ValueError(f"tags must have max 10 items, got {len(request.tags)}")
            for tag in request.tags:
                if not (1 <= len(tag) <= 50):
                    raise ValueError(f"Each tag must be 1-50 characters, got '{tag}'")

    def _validate_legacy_upload_input(self, *, content_type: str, file_bytes: bytes, privacy_level: int) -> None:
        if content_type not in {"image/jpeg", "image/png"}:
            raise ValueError("Unsupported content type. Allowed: image/jpeg, image/png")
        if len(file_bytes) > 20 * 1024 * 1024:
            raise ValueError("File too large. Maximum allowed size is 20 MB")
        if privacy_level not in (0, 1, 2):
            raise ValueError(f"privacy_level must be 0/1/2, got {privacy_level}")


__all__ = ["UploadService", "DuplicateIdempotencyKeyError"]