"""
Media Workflow Adapters (Data Access Layer)

Low-level PostgreSQL CRUD for Album and Image entities.
Handles soft deletes, permission checks delegated to service layer.

Constraints from data_schema.yaml:
- albums: id, user_id, title, description, is_public, created_at, deleted_at
- images: id (UUID), user_id, album_id, privacy_level, tags (JSONB), index_status,
          minio_object_name, minio_bucket, created_at, updated_at, deleted_at
- Do NOT touch images.embedding in this adapter.
"""

import json
import logging
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class AlbumAdapter:
    """PostgreSQL adapter for Album CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _album_row_to_dict(row: Any) -> Dict[str, Any]:
        return {
            "id": row.id,
            "user_id": row.user_id,
            "title": row.title,
            "description": row.description,
            "is_public": row.is_public,
            "created_at": row.created_at,
            "deleted_at": row.deleted_at,
        }

    async def create_album(
        self,
        user_id: int,
        title: str,
        description: Optional[str] = None,
        is_public: bool = False,
    ) -> Dict[str, Any]:
        logger.info("Creating album for user_id=%s title=%s", user_id, title)

        stmt = text(
            """
            INSERT INTO albums (user_id, title, description, is_public)
            VALUES (:user_id, :title, :description, :is_public)
            RETURNING id, user_id, title, description, is_public, created_at, deleted_at
            """
        )
        params = {
            "user_id": user_id,
            "title": title,
            "description": description,
            "is_public": is_public,
        }

        try:
            result = await self.session.execute(stmt, params)
            await self.session.commit()
            row = result.mappings().first()
            if row is None:
                raise RuntimeError("Failed to create album: no row returned")
            return self._album_row_to_dict(row)
        except Exception:
            await self.session.rollback()
            raise

    async def get_album(self, album_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        logger.info("Fetching album_id=%s for user_id=%s", album_id, user_id)

        stmt = text(
            """
            SELECT id, user_id, title, description, is_public, created_at, deleted_at
            FROM albums
            WHERE id = :album_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            """
        )
        result = await self.session.execute(
            stmt, {"album_id": album_id, "user_id": user_id}
        )
        row = result.mappings().first()
        if row is None:
            return None
        return self._album_row_to_dict(row)

    async def list_albums(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[List[Dict[str, Any]], int]:
        logger.info(
            "Listing albums for user_id=%s offset=%s limit=%s", user_id, offset, limit
        )

        count_stmt = text(
            """
            SELECT COUNT(*) AS total
            FROM albums
            WHERE user_id = :user_id
              AND deleted_at IS NULL
            """
        )
        list_stmt = text(
            """
            SELECT id, user_id, title, description, is_public, created_at, deleted_at
            FROM albums
            WHERE user_id = :user_id
              AND deleted_at IS NULL
            ORDER BY created_at DESC, id DESC
            OFFSET :offset
            LIMIT :limit
            """
        )
        total_result = await self.session.execute(count_stmt, {"user_id": user_id})
        total = int(total_result.scalar_one() or 0)

        rows_result = await self.session.execute(
            list_stmt,
            {"user_id": user_id, "offset": offset, "limit": limit},
        )
        items = [self._album_row_to_dict(row) for row in rows_result.mappings().all()]
        return items, total

    async def update_album(
        self,
        album_id: int,
        user_id: int,
        **kwargs: Any,
    ) -> Optional[Dict[str, Any]]:
        logger.info("Updating album_id=%s for user_id=%s", album_id, user_id)

        allowed_fields = {"title", "description", "is_public"}
        update_fields = {k: v for k, v in kwargs.items() if k in allowed_fields}

        if not update_fields:
            return await self.get_album(album_id, user_id)

        set_parts: List[str] = []
        params: Dict[str, Any] = {"album_id": album_id, "user_id": user_id}

        for field, value in update_fields.items():
            set_parts.append(f"{field} = :{field}")
            params[field] = value

        stmt = text(
            f"""
            UPDATE albums
            SET {", ".join(set_parts)}
            WHERE id = :album_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            RETURNING id, user_id, title, description, is_public, created_at, deleted_at
            """
        )

        try:
            result = await self.session.execute(stmt, params)
            row = result.mappings().first()
            if row is None:
                await self.session.rollback()
                return None
            await self.session.commit()
            return self._album_row_to_dict(row)
        except Exception:
            await self.session.rollback()
            raise

    async def soft_delete_album(self, album_id: int, user_id: int) -> bool:
        logger.info("Soft deleting album_id=%s for user_id=%s", album_id, user_id)

        stmt = text(
            """
            UPDATE albums
            SET deleted_at = NOW()
            WHERE id = :album_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            """
        )
        try:
            result = await self.session.execute(
                stmt, {"album_id": album_id, "user_id": user_id}
            )
            await self.session.commit()
            return (result.rowcount or 0) > 0
        except Exception:
            await self.session.rollback()
            raise


class ImageAdapter:
    """PostgreSQL adapter for Image CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _image_row_to_dict(self, row: Any) -> Dict[str, Any]:
        tags_value = row.tags if row.tags is not None else []
        return {
            "image_id": str(row.image_id),
            "user_id": row.user_id,
            "album_id": row.album_id,
            "privacy_level": row.privacy_level,
            "tags": tags_value,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "index_status": row.index_status,
            "deleted_at": row.deleted_at,
            # Internal/raw fields for service-layer orchestration:
            "minio_object_name": row.minio_object_name,
            "minio_bucket": row.minio_bucket,
        }

    async def create_image_metadata(
        self,
        image_id: str,
        user_id: int,
        minio_object_name: str,
        minio_bucket: str,
        album_id: Optional[int] = None,
        privacy_level: int = 2,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        logger.info("Creating image metadata image_id=%s user_id=%s", image_id, user_id)
        # SỬA: bỏ "::uuid" ngay sau ":image_id" — sqlalchemy.text() dùng
        # dấu ":" để nhận diện bind parameter; ":image_id::uuid" (không có
        # khoảng trắng) khiến parser của text() không tách đúng tên biến,
        # bind param không được compile, driver asyncpg nhận lại chuỗi
        # ":image_id" thô -> PostgresSyntaxError. asyncpg tự cast đúng
        # kiểu UUID khi bind 1 chuỗi UUID hợp lệ vào cột kiểu UUID, không
        # cần ép kiểu tường minh.
        stmt = text(
            """
            INSERT INTO images (
                id, user_id, album_id, minio_object_name, minio_bucket,
                privacy_level, tags
            )
            VALUES (
                :image_id, :user_id, :album_id, :minio_object_name, :minio_bucket,
                :privacy_level, CAST(:tags AS JSONB)
            )
            RETURNING
                id AS image_id, user_id, album_id, minio_object_name, minio_bucket,
                privacy_level, tags, created_at, updated_at, index_status, deleted_at
            """
        )

        params = {
            "image_id": image_id,
            "user_id": user_id,
            "album_id": album_id,
            "minio_object_name": minio_object_name,
            "minio_bucket": minio_bucket,
            "privacy_level": privacy_level,
            "tags": json.dumps(tags or []),
        }

        try:
            result = await self.session.execute(stmt, params)
            await self.session.commit()
            row = result.mappings().first()
            if row is None:
                raise RuntimeError("Failed to create image metadata: no row returned")
            return self._image_row_to_dict(row)
        except Exception:
            await self.session.rollback()
            raise

    async def get_image(self, image_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        logger.info("Fetching image_id=%s for user_id=%s", image_id, user_id)

        stmt = text(
            """
            SELECT
                id AS image_id,
                user_id,
                album_id,
                minio_object_name,
                minio_bucket,
                privacy_level,
                tags,
                created_at,
                updated_at,
                index_status,
                deleted_at
            FROM images
            WHERE id = :image_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            """
        )
        result = await self.session.execute(
            stmt,
            {"image_id": image_id, "user_id": user_id},
        )
        row = result.mappings().first()
        if row is None:
            return None
        return self._image_row_to_dict(row)

    async def list_images(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20,
        album_id: Optional[int] = None,
    ) -> tuple[List[Dict[str, Any]], int]:
        logger.info(
            "Listing images for user_id=%s offset=%s limit=%s album_id=%s",
            user_id,
            offset,
            limit,
            album_id,
        )

        base_where = """
            user_id = :user_id
            AND deleted_at IS NULL
        """
        params: Dict[str, Any] = {
            "user_id": user_id,
            "offset": offset,
            "limit": limit,
        }

        if album_id is not None:
            base_where += " AND album_id = :album_id"
            params["album_id"] = album_id

        count_stmt = text(
            f"""
            SELECT COUNT(*) AS total
            FROM images
            WHERE {base_where}
            """
        )
        list_stmt = text(
            f"""
            SELECT
                id AS image_id,
                user_id,
                album_id,
                minio_object_name,
                minio_bucket,
                privacy_level,
                tags,
                created_at,
                updated_at,
                index_status,
                deleted_at
            FROM images
            WHERE {base_where}
            ORDER BY created_at DESC
            OFFSET :offset
            LIMIT :limit
            """
        )
        total_result = await self.session.execute(count_stmt, params)
        total = int(total_result.scalar_one() or 0)

        rows_result = await self.session.execute(list_stmt, params)
        items = [self._image_row_to_dict(row) for row in rows_result.mappings().all()]
        return items, total

    async def update_image_metadata(
        self,
        image_id: str,
        user_id: int,
        **kwargs: Any,
    ) -> Optional[Dict[str, Any]]:
        logger.info("Updating image metadata image_id=%s user_id=%s", image_id, user_id)

        allowed_fields = {"album_id", "privacy_level", "tags"}
        update_fields = {k: v for k, v in kwargs.items() if k in allowed_fields}

        if not update_fields:
            return await self.get_image(image_id, user_id)

        set_parts: List[str] = ["updated_at = NOW()"]
        params: Dict[str, Any] = {"image_id": image_id, "user_id": user_id}

        for field, value in update_fields.items():
            if field == "tags":
                set_parts.append("tags = CAST(:tags AS JSONB)")
                params["tags"] = json.dumps(value if value is not None else [])
            else:
                set_parts.append(f"{field} = :{field}")
                params[field] = value

        stmt = text(
            f"""
            UPDATE images
            SET {", ".join(set_parts)}
            WHERE id = :image_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            RETURNING
                id AS image_id,
                user_id,
                album_id,
                minio_object_name,
                minio_bucket,
                privacy_level,
                tags,
                created_at,
                updated_at,
                index_status,
                deleted_at
            """
        )

        try:
            result = await self.session.execute(stmt, params)
            row = result.mappings().first()
            if row is None:
                await self.session.rollback()
                return None
            await self.session.commit()
            return self._image_row_to_dict(row)
        except Exception:
            await self.session.rollback()
            raise

    async def soft_delete_image(self, image_id: str, user_id: int) -> bool:
        logger.info("Soft deleting image_id=%s user_id=%s", image_id, user_id)

        stmt = text(
            """
            UPDATE images
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = :image_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            """
        )

        try:
            result = await self.session.execute(
                stmt, {"image_id": image_id, "user_id": user_id}
            )
            await self.session.commit()
            return (result.rowcount or 0) > 0
        except Exception:
            await self.session.rollback()
            raise


__all__ = ["AlbumAdapter", "ImageAdapter"]