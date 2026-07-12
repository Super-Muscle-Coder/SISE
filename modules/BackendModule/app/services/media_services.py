"""
Media Workflow Service (Business Logic Layer)
"""

import logging
from typing import Optional, List, Dict, Any

from app.entities.media_entities import (
    AlbumCreateRequest,
    AlbumUpdateRequest,
    ImageUpdateMetadataRequest,
)
from app.adapters.media_adapters import AlbumAdapter, ImageAdapter
from app.adapters.upload_adapters import MinIOAdapter

logger = logging.getLogger(__name__)


class MediaService:
    def __init__(
        self,
        album_adapter: AlbumAdapter,
        image_adapter: ImageAdapter,
        minio_adapter: MinIOAdapter,
    ):
        self.album_adapter = album_adapter
        self.image_adapter = image_adapter
        self.minio_adapter = minio_adapter

    async def list_albums(self, user_id: int, offset: int = 0, limit: int = 20) -> Dict[str, Any]:
        items, total = await self.album_adapter.list_albums(user_id=user_id, offset=offset, limit=limit)
        return {"items": items, "total": total, "offset": offset, "limit": limit}

    async def create_album(self, user_id: int, req: AlbumCreateRequest) -> Dict[str, Any]:
        return await self.album_adapter.create_album(
            user_id=user_id,
            title=req.title,
            description=req.description,
            is_public=req.is_public,
        )

    async def get_album(self, album_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        album = await self.album_adapter.get_album(album_id, user_id)
        if album is None:
            return None
        if album["user_id"] != user_id:
            return None
        return album

    async def update_album(
        self, album_id: int, user_id: int, req: AlbumUpdateRequest,
    ) -> Optional[Dict[str, Any]]:
        existing = await self.album_adapter.get_album(album_id, user_id)
        if existing is None or existing["user_id"] != user_id:
            return None

        update_kwargs: Dict[str, Any] = {}
        if req.title is not None:
            update_kwargs["title"] = req.title
        if req.description is not None:
            update_kwargs["description"] = req.description
        if req.is_public is not None:
            update_kwargs["is_public"] = req.is_public

        if not update_kwargs:
            return existing

        return await self.album_adapter.update_album(album_id, user_id, **update_kwargs)

    async def delete_album(self, album_id: int, user_id: int) -> bool:
        existing = await self.album_adapter.get_album(album_id, user_id)
        if existing is None or existing["user_id"] != user_id:
            return False
        return await self.album_adapter.soft_delete_album(album_id, user_id)

    async def create_image_metadata(
        self, image_id: str, user_id: int, minio_object_name: str, minio_bucket: str,
        album_id: Optional[int] = None, privacy_level: int = 2, tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        image = await self.image_adapter.create_image_metadata(
            image_id=image_id, user_id=user_id, minio_object_name=minio_object_name,
            minio_bucket=minio_bucket, album_id=album_id, privacy_level=privacy_level, tags=tags,
        )
        return image

    async def get_image(self, image_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        image = await self.image_adapter.get_image(image_id, user_id)
        if image is None:
            return None
        if image["user_id"] != user_id:
            return None

        image["minio_url"] = await self.minio_adapter.generate_presigned_get_url(
            object_key=image["minio_object_name"],
            expires_in_sec=3600,
        )
        return image

    async def list_images(
        self, user_id: int, offset: int = 0, limit: int = 20, album_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        images, total = await self.image_adapter.list_images(
            user_id=user_id, offset=offset, limit=limit, album_id=album_id,
        )

        for image in images:
            image["minio_url"] = await self.minio_adapter.generate_presigned_get_url(
                object_key=image["minio_object_name"],
                expires_in_sec=3600,
            )

        return {"items": images, "total": total, "offset": offset, "limit": limit}

    async def update_image_metadata(
        self, image_id: str, user_id: int, req: ImageUpdateMetadataRequest,
    ) -> Optional[Dict[str, Any]]:
        existing = await self.image_adapter.get_image(image_id, user_id)
        if existing is None or existing["user_id"] != user_id:
            return None

        update_kwargs = {}
        if req.album_id is not None:
            update_kwargs["album_id"] = req.album_id
        if req.privacy_level is not None:
            update_kwargs["privacy_level"] = req.privacy_level
        if req.tags is not None:
            update_kwargs["tags"] = req.tags

        if not update_kwargs:
            existing["minio_url"] = await self.minio_adapter.generate_presigned_get_url(
                object_key=existing["minio_object_name"],
                expires_in_sec=3600,
            )
            return existing

        image = await self.image_adapter.update_image_metadata(image_id, user_id, **update_kwargs)
        if image is None:
            return None

        image["minio_url"] = await self.minio_adapter.generate_presigned_get_url(
            object_key=image["minio_object_name"],
            expires_in_sec=3600,
        )
        return image

    async def delete_image(self, image_id: str, user_id: int) -> bool:
        image = await self.image_adapter.get_image(image_id, user_id)
        if image is None or image["user_id"] != user_id:
            return False
        success = await self.image_adapter.soft_delete_image(image_id, user_id)
        return success


__all__ = ["MediaService"]