"""
Media Workflow Service (Business Logic Layer)

Orchestrates Album and Image CRUD with permission checks and soft-delete logic.
Per openapi.yaml and data_schema.yaml constraints.

Permission Rules:
- Albums: User can only CRUD own albums (user_id == current_user_id)
- Images: User can only CRUD own images (user_id == current_user_id)
- Soft Delete: Set deleted_at timestamp, exclude from queries
"""

import logging
from typing import Optional, List, Dict, Any

from app.entities.media_entities import (
    AlbumCreateRequest,
    AlbumUpdateRequest,
    ImageUpdateMetadataRequest,
)
from app.adapters.media_adapters import AlbumAdapter, ImageAdapter

logger = logging.getLogger(__name__)


class MediaService:
    """Orchestration service for Album and Image operations."""

    def __init__(self, album_adapter: AlbumAdapter, image_adapter: ImageAdapter):
        """
        Initialize media service with adapters.

        Args:
            album_adapter: PostgreSQL adapter for albums
            image_adapter: PostgreSQL adapter for images
        """
        self.album_adapter = album_adapter
        self.image_adapter = image_adapter

    # ========================================================================
    # ALBUM OPERATIONS
    # ========================================================================

    async def create_album(
        self,
        user_id: int,
        req: AlbumCreateRequest,
    ) -> Dict[str, Any]:
        """
        Create a new album for user.

        Args:
            user_id: Current user ID
            req: Album creation request

        Returns:
            Created album record
        """
        logger.info(f"Service: Creating album for user {user_id}")

        album = await self.album_adapter.create_album(
            user_id=user_id,
            title=req.title,
            description=req.description,
            is_public=req.is_public,
        )

        return album

    async def get_album(self, album_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get album details (permission check: owner only).

        Args:
            album_id: Album ID
            user_id: Current user ID

        Returns:
            Album record or None if not found/not owned
        """
        logger.info(f"Service: Fetching album {album_id} for user {user_id}")

        album = await self.album_adapter.get_album(album_id, user_id)
        if album is None:
            logger.warning(f"Album {album_id} not found for user {user_id}")
            return None

        # Verify ownership
        if album["user_id"] != user_id:
            logger.warning(f"User {user_id} does not own album {album_id}")
            return None

        return album

    async def list_albums(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        List user's albums (excluding soft-deleted).

        Args:
            user_id: User ID
            offset: Pagination offset
            limit: Pagination limit

        Returns:
            Paginated album list response
        """
        logger.info(f"Service: Listing albums for user {user_id}")

        albums, total = await self.album_adapter.list_albums(user_id, offset, limit)

        return {
            "items": albums,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    async def update_album(
        self,
        album_id: int,
        user_id: int,
        req: AlbumUpdateRequest,
    ) -> Optional[Dict[str, Any]]:
        """
        Update album (permission check: owner only).

        Args:
            album_id: Album ID
            user_id: Current user ID
            req: Update request

        Returns:
            Updated album record or None if not found/not owned
        """
        logger.info(f"Service: Updating album {album_id} for user {user_id}")

        # Permission check
        existing = await self.album_adapter.get_album(album_id, user_id)
        if existing is None or existing["user_id"] != user_id:
            logger.warning(f"User {user_id} does not own album {album_id}")
            return None

        # Build update kwargs
        update_kwargs = {}
        if req.title is not None:
            update_kwargs["title"] = req.title
        if req.description is not None:
            update_kwargs["description"] = req.description
        if req.is_public is not None:
            update_kwargs["is_public"] = req.is_public

        if not update_kwargs:
            return existing

        album = await self.album_adapter.update_album(album_id, user_id, **update_kwargs)
        return album

    async def delete_album(self, album_id: int, user_id: int) -> bool:
        """
        Soft delete album (permission check: owner only).

        Args:
            album_id: Album ID
            user_id: Current user ID

        Returns:
            True if deleted, False if not found/not owned
        """
        logger.info(f"Service: Deleting album {album_id} for user {user_id}")

        # Permission check
        album = await self.album_adapter.get_album(album_id, user_id)
        if album is None or album["user_id"] != user_id:
            logger.warning(f"User {user_id} does not own album {album_id}")
            return False

        success = await self.album_adapter.soft_delete_album(album_id, user_id)
        return success

    # ========================================================================
    # IMAGE OPERATIONS
    # ========================================================================

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
        """
        Create image metadata record (called from upload confirm).

        Args:
            image_id: Image UUID
            user_id: Owner user ID
            minio_object_name: MinIO object key
            minio_bucket: MinIO bucket name
            album_id: Album ID (optional)
            privacy_level: Privacy level (0, 1, 2)
            tags: List of tags

        Returns:
            Created image metadata
        """
        logger.info(f"Service: Creating image metadata {image_id} for user {user_id}")

        image = await self.image_adapter.create_image_metadata(
            image_id=image_id,
            user_id=user_id,
            minio_object_name=minio_object_name,
            minio_bucket=minio_bucket,
            album_id=album_id,
            privacy_level=privacy_level,
            tags=tags,
        )

        return image

    async def get_image(self, image_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get image metadata (permission check: owner only).

        Args:
            image_id: Image UUID
            user_id: Current user ID

        Returns:
            Image metadata or None if not found/not owned
        """
        logger.info(f"Service: Fetching image {image_id} for user {user_id}")

        image = await self.image_adapter.get_image(image_id, user_id)
        if image is None:
            logger.warning(f"Image {image_id} not found for user {user_id}")
            return None

        # Verify ownership
        if image["user_id"] != user_id:
            logger.warning(f"User {user_id} does not own image {image_id}")
            return None

        return image

    async def list_images(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20,
        album_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        List user's images (excluding soft-deleted, optional album filter).

        Args:
            user_id: User ID
            offset: Pagination offset
            limit: Pagination limit
            album_id: Optional album filter

        Returns:
            Paginated image list response
        """
        logger.info(f"Service: Listing images for user {user_id} (album={album_id})")

        images, total = await self.image_adapter.list_images(
            user_id=user_id,
            offset=offset,
            limit=limit,
            album_id=album_id,
        )

        return {
            "items": images,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    async def update_image_metadata(
        self,
        image_id: str,
        user_id: int,
        req: ImageUpdateMetadataRequest,
    ) -> Optional[Dict[str, Any]]:
        """
        Update image metadata (permission check: owner only).

        Args:
            image_id: Image UUID
            user_id: Current user ID
            req: Update request

        Returns:
            Updated image metadata or None if not found/not owned
        """
        logger.info(f"Service: Updating image {image_id} for user {user_id}")

        # Permission check
        existing = await self.image_adapter.get_image(image_id, user_id)
        if existing is None or existing["user_id"] != user_id:
            logger.warning(f"User {user_id} does not own image {image_id}")
            return None

        # Build update kwargs
        update_kwargs = {}
        if req.album_id is not None:
            update_kwargs["album_id"] = req.album_id
        if req.privacy_level is not None:
            update_kwargs["privacy_level"] = req.privacy_level
        if req.tags is not None:
            update_kwargs["tags"] = req.tags

        if not update_kwargs:
            return existing

        image = await self.image_adapter.update_image_metadata(
            image_id, user_id, **update_kwargs
        )
        return image

    async def delete_image(self, image_id: str, user_id: int) -> bool:
        """
        Soft delete image (permission check: owner only).

        Args:
            image_id: Image UUID
            user_id: Current user ID

        Returns:
            True if deleted, False if not found/not owned
        """
        logger.info(f"Service: Deleting image {image_id} for user {user_id}")

        # Permission check
        image = await self.image_adapter.get_image(image_id, user_id)
        if image is None or image["user_id"] != user_id:
            logger.warning(f"User {user_id} does not own image {image_id}")
            return False

        success = await self.image_adapter.soft_delete_image(image_id, user_id)
        return success


__all__ = [
    "MediaService",
]
