"""
Upload Workflow Adapters (Data Access Layer)
"""

from __future__ import annotations

import json
import logging
from datetime import timedelta
from io import BytesIO
from typing import Any, Dict, Optional

from minio import Minio
from minio.error import S3Error
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class MinIOAdapter:
    """
    Adapter for MinIO object storage operations.
    """

    def __init__(self, minio_client: Minio, bucket_name: str = "raw-images", endpoint: str = ""):
        self.client = minio_client
        self.bucket_name = bucket_name
        self.endpoint = endpoint.rstrip("/")

    async def generate_presigned_put_url(
        self,
        object_key: str,
        expires_in_sec: int = 3600,
        content_type: str = "image/jpeg",
    ) -> str:
        try:
            url = self.client.get_presigned_url(
                method="PUT",
                bucket_name=self.bucket_name,
                object_name=object_key,
                expires=timedelta(seconds=expires_in_sec),
            )
            logger.info("Generated presigned PUT URL for %s", object_key)
            return url
        except S3Error:
            logger.exception("MinIO presigned PUT URL generation failed for %s", object_key)
            raise

    async def generate_presigned_get_url(
        self,
        object_key: str,
        expires_in_sec: int = 3600,
    ) -> str:
        try:
            return self.client.get_presigned_url(
                method="GET",
                bucket_name=self.bucket_name,
                object_name=object_key,
                expires=timedelta(seconds=expires_in_sec),
            )
        except S3Error:
            logger.exception("MinIO presigned GET URL generation failed for %s", object_key)
            raise

    async def verify_object_exists(self, object_key: str) -> bool:
        try:
            self.client.stat_object(self.bucket_name, object_key)
            return True
        except S3Error as exc:
            if exc.code in {"NoSuchKey", "NoSuchObject"}:
                return False
            logger.exception("MinIO stat_object failed for %s", object_key)
            raise

    async def upload_object_bytes(
        self,
        object_key: str,
        payload: bytes,
        content_type: str,
    ) -> None:
        try:
            data = BytesIO(payload)
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_key,
                data=data,
                length=len(payload),
                content_type=content_type,
            )
        except S3Error:
            logger.exception("MinIO put_object failed for %s", object_key)
            raise

    async def delete_object(self, object_key: str) -> None:
        try:
            self.client.remove_object(self.bucket_name, object_key)
        except S3Error:
            logger.exception("MinIO remove_object failed for %s", object_key)
            raise

    def build_object_url(self, object_key: str) -> str:
        if not self.endpoint:
            return object_key
        normalized = self.endpoint if self.endpoint.startswith(("http://", "https://")) else f"http://{self.endpoint}"
        return f"{normalized}/{self.bucket_name}/{object_key}"


class IdempotencyAdapter:
    """
    Adapter for idempotency key storage (Redis).
    """

    def __init__(self, redis_client: Redis, ttl_hours: int = 24):
        self.redis = redis_client
        self.ttl_hours = ttl_hours

    def _make_key(self, user_id: int, idempotency_key: str) -> str:
        return f"idempotency:{user_id}:{idempotency_key}"

    async def store_key(
        self,
        user_id: int,
        idempotency_key: str,
        result: Dict[str, Any],
    ) -> None:
        key = self._make_key(user_id, idempotency_key)
        ttl_seconds = self.ttl_hours * 3600
        await self.redis.setex(key, ttl_seconds, json.dumps(result, default=str))

    async def retrieve_key(
        self,
        user_id: int,
        idempotency_key: str,
    ) -> Optional[Dict[str, Any]]:
        key = self._make_key(user_id, idempotency_key)
        data = await self.redis.get(key)
        if data is None:
            return None
        return json.loads(data)

    async def exists(self, user_id: int, idempotency_key: str) -> bool:
        key = self._make_key(user_id, idempotency_key)
        exists = await self.redis.exists(key)
        return exists > 0


class PostgreSQLImageAdapter:
    """
    Adapter for image metadata operations in PostgreSQL (table images).
    """

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def insert_image_metadata(
        self,
        image_id: str,
        user_id: int,
        album_id: Optional[int],
        minio_object_name: str,
        minio_bucket: str,
        privacy_level: int,
        tags: Optional[list] = None,
    ) -> Dict[str, Any]:
        insert_stmt = text(
            """
            INSERT INTO images (
                id,
                user_id,
                album_id,
                minio_object_name,
                minio_bucket,
                privacy_level,
                tags,
                index_status
            )
            VALUES (
                :image_id,
                :user_id,
                :album_id,
                :minio_object_name,
                :minio_bucket,
                :privacy_level,
                CAST(:tags AS jsonb),
                'pending'
            )
            RETURNING
                id::text AS image_id,
                user_id,
                album_id,
                minio_object_name,
                minio_bucket,
                privacy_level,
                tags,
                index_status,
                created_at,
                deleted_at
            """
        )

        try:
            result = await self.db_session.execute(
                insert_stmt,
                {
                    "image_id": image_id,
                    "user_id": user_id,
                    "album_id": album_id,
                    "minio_object_name": minio_object_name,
                    "minio_bucket": minio_bucket,
                    "privacy_level": privacy_level,
                    "tags": json.dumps(tags or []),
                },
            )
            row = result.mappings().first()
            if row is None:
                raise RuntimeError("Failed to insert image metadata")
            await self.db_session.commit()
            return dict(row)
        except Exception:
            await self.db_session.rollback()
            raise

    async def get_image(
        self,
        image_id: str,
        user_id: int,
        check_ownership: bool = True,
    ) -> Optional[Dict[str, Any]]:
        if check_ownership:
            query = text(
                """
                SELECT
                    id::text AS image_id,
                    user_id,
                    album_id,
                    minio_object_name,
                    minio_bucket,
                    privacy_level,
                    tags,
                    index_status,
                    created_at,
                    deleted_at
                FROM images
                WHERE id = :image_id
                  AND user_id = :user_id
                  AND deleted_at IS NULL
                LIMIT 1
                """
            )
            params = {"image_id": image_id, "user_id": user_id}
        else:
            query = text(
                """
                SELECT
                    id::text AS image_id,
                    user_id,
                    album_id,
                    minio_object_name,
                    minio_bucket,
                    privacy_level,
                    tags,
                    index_status,
                    created_at,
                    deleted_at
                FROM images
                WHERE id = :image_id
                  AND deleted_at IS NULL
                LIMIT 1
                """
            )
            params = {"image_id": image_id}

        result = await self.db_session.execute(query, params)
        row = result.mappings().first()
        return dict(row) if row else None

    async def update_index_status(self, image_id: str, status: str) -> None:
        valid_statuses = {"pending", "ready", "failed"}
        if status not in valid_statuses:
            raise ValueError(f"Invalid index_status: {status}")

        stmt = text(
            """
            UPDATE images
            SET index_status = :status
            WHERE id = :image_id
              AND deleted_at IS NULL
            """
        )

        try:
            await self.db_session.execute(stmt, {"status": status, "image_id": image_id})
            await self.db_session.commit()
        except Exception:
            await self.db_session.rollback()
            raise

    async def delete_image_soft(
        self,
        image_id: str,
        user_id: int,
    ) -> None:
        stmt = text(
            """
            UPDATE images
            SET deleted_at = NOW()
            WHERE id = :image_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            """
        )

        try:
            await self.db_session.execute(stmt, {"image_id": image_id, "user_id": user_id})
            await self.db_session.commit()
        except Exception:
            await self.db_session.rollback()
            raise

    async def list_images_for_user(
        self,
        user_id: int,
        album_id: Optional[int] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        if album_id is None:
            count_stmt = text(
                """
                SELECT COUNT(*)::int AS total
                FROM images
                WHERE user_id = :user_id
                  AND deleted_at IS NULL
                """
            )
            list_stmt = text(
                """
                SELECT
                    id::text AS image_id,
                    user_id,
                    album_id,
                    minio_object_name,
                    minio_bucket,
                    privacy_level,
                    tags,
                    index_status,
                    created_at,
                    deleted_at
                FROM images
                WHERE user_id = :user_id
                  AND deleted_at IS NULL
                ORDER BY created_at DESC
                OFFSET :offset
                LIMIT :limit
                """
            )
            params = {"user_id": user_id, "offset": offset, "limit": limit}
            count_params = {"user_id": user_id}
        else:
            count_stmt = text(
                """
                SELECT COUNT(*)::int AS total
                FROM images
                WHERE user_id = :user_id
                  AND album_id = :album_id
                  AND deleted_at IS NULL
                """
            )
            list_stmt = text(
                """
                SELECT
                    id::text AS image_id,
                    user_id,
                    album_id,
                    minio_object_name,
                    minio_bucket,
                    privacy_level,
                    tags,
                    index_status,
                    created_at,
                    deleted_at
                FROM images
                WHERE user_id = :user_id
                  AND album_id = :album_id
                  AND deleted_at IS NULL
                ORDER BY created_at DESC
                OFFSET :offset
                LIMIT :limit
                """
            )
            params = {
                "user_id": user_id,
                "album_id": album_id,
                "offset": offset,
                "limit": limit,
            }
            count_params = {"user_id": user_id, "album_id": album_id}

        count_result = await self.db_session.execute(count_stmt, count_params)
        total = int(count_result.scalar_one())

        list_result = await self.db_session.execute(list_stmt, params)
        rows = list_result.mappings().all()

        return {
            "items": [dict(r) for r in rows],
            "total": total,
            "offset": offset,
            "limit": limit,
        }


__all__ = [
    "MinIOAdapter",
    "IdempotencyAdapter",
    "PostgreSQLImageAdapter",
]