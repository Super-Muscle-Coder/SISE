"""
Media Workflow Adapters (Data Access Layer)

Low-level PostgreSQL CRUD for Album and Image entities.
Handles soft deletes, permission checks delegated to service layer.

Constraints from data_schema.yaml:
- albums: id, user_id, title, description, is_public, created_at, (no deleted_at in schema comment but implied)
- images: id (UUID), user_id, album_id, privacy_level, tags (JSONB), index_status, created_at, updated_at, deleted_at
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, desc, func
from sqlalchemy.orm import selectinload

import sys
from pathlib import Path

# Add app to path for imports
backend_module_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_module_path))

logger = logging.getLogger(__name__)


class AlbumAdapter:
    """PostgreSQL adapter for Album CRUD operations."""

    def __init__(self, session: AsyncSession):
        """Initialize adapter with async database session."""
        self.session = session

    async def create_album(
        self,
        user_id: int,
        title: str,
        description: Optional[str] = None,
        is_public: bool = False,
    ) -> Dict[str, Any]:
        """
        Create a new album.

        Args:
            user_id: Owner user ID
            title: Album title
            description: Optional description
            is_public: Public visibility flag

        Returns:
            Album record dict
        """
        logger.info(f"Creating album for user {user_id}: {title}")

        # Placeholder: In real impl, execute INSERT into albums table
        # For now, return mock response
        return {
            "id": 1,
            "user_id": user_id,
            "title": title,
            "description": description,
            "is_public": is_public,
            "created_at": datetime.now(timezone.utc),
        }

    async def get_album(self, album_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve album by ID (permission check: owner only).

        Args:
            album_id: Album ID
            user_id: Current user ID (for permission check)

        Returns:
            Album record or None if not found/not owned
        """
        logger.info(f"Fetching album {album_id} for user {user_id}")
        # Placeholder
        return {
            "id": album_id,
            "user_id": user_id,
            "title": "Sample Album",
            "description": None,
            "is_public": False,
            "created_at": datetime.now(timezone.utc),
        }

    async def list_albums(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List albums for a user (excluding soft-deleted).

        Args:
            user_id: User ID
            offset: Pagination offset
            limit: Pagination limit

        Returns:
            Tuple of (album list, total count)
        """
        logger.info(f"Listing albums for user {user_id} (offset={offset}, limit={limit})")
        # Placeholder
        return [], 0

    async def update_album(
        self,
        album_id: int,
        user_id: int,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Update album (title, description, is_public).

        Args:
            album_id: Album ID
            user_id: Current user ID (for permission check)
            **kwargs: Fields to update (title, description, is_public)

        Returns:
            Updated album record or None if not found/not owned
        """
        logger.info(f"Updating album {album_id} for user {user_id}")
        # Placeholder
        return await self.get_album(album_id, user_id)

    async def soft_delete_album(self, album_id: int, user_id: int) -> bool:
        """
        Soft delete an album (set deleted_at timestamp).

        Args:
            album_id: Album ID
            user_id: Current user ID (for permission check)

        Returns:
            True if deleted, False if not found/not owned
        """
        logger.info(f"Soft deleting album {album_id} for user {user_id}")
        # Placeholder
        return True


class ImageAdapter:
    """PostgreSQL adapter for Image CRUD operations."""

    def __init__(self, session: AsyncSession):
        """Initialize adapter with async database session."""
        self.session = session

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
        Create image metadata record (called after presigned upload).

        Args:
            image_id: Image UUID
            user_id: Owner user ID
            minio_object_name: MinIO object key
            minio_bucket: MinIO bucket name
            album_id: Album ID (optional)
            privacy_level: Privacy level (0, 1, or 2)
            tags: List of tags

        Returns:
            Image metadata dict
        """
        logger.info(f"Creating image metadata for {image_id} (user={user_id})")
        # Placeholder
        return {
            "image_id": image_id,
            "user_id": user_id,
            "album_id": album_id,
            "minio_object_name": minio_object_name,
            "minio_bucket": minio_bucket,
            "privacy_level": privacy_level,
            "tags": tags or [],
            "index_status": "pending",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "deleted_at": None,
        }

    async def get_image(self, image_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve image metadata (permission check: owner only).

        Args:
            image_id: Image UUID
            user_id: Current user ID (for permission check)

        Returns:
            Image metadata or None if not found/not owned
        """
        logger.info(f"Fetching image {image_id} for user {user_id}")
        # Placeholder
        return {
            "image_id": image_id,
            "user_id": user_id,
            "album_id": None,
            "minio_url": "https://minio.example.com/image.jpg",
            "privacy_level": 2,
            "tags": [],
            "index_status": "ready",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "deleted_at": None,
        }

    async def list_images(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20,
        album_id: Optional[int] = None,
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List images for user (excluding soft-deleted, optionally filter by album).

        Args:
            user_id: User ID
            offset: Pagination offset
            limit: Pagination limit
            album_id: Optional album filter

        Returns:
            Tuple of (image list, total count)
        """
        logger.info(f"Listing images for user {user_id} (offset={offset}, limit={limit}, album={album_id})")
        # Placeholder
        return [], 0

    async def update_image_metadata(
        self,
        image_id: str,
        user_id: int,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Update image metadata (album_id, privacy_level, tags).

        Args:
            image_id: Image UUID
            user_id: Current user ID (for permission check)
            **kwargs: Fields to update

        Returns:
            Updated image metadata or None if not found/not owned
        """
        logger.info(f"Updating image {image_id} for user {user_id}")
        # Placeholder
        return await self.get_image(image_id, user_id)

    async def soft_delete_image(self, image_id: str, user_id: int) -> bool:
        """
        Soft delete image (set deleted_at timestamp).

        Args:
            image_id: Image UUID
            user_id: Current user ID (for permission check)

        Returns:
            True if deleted, False if not found/not owned
        """
        logger.info(f"Soft deleting image {image_id} for user {user_id}")
        # Placeholder
        return True

    async def get_images_by_album(
        self,
        album_id: int,
        user_id: int,
    ) -> List[Dict[str, Any]]:
        """
        Get all images in an album (for cascade delete logic if needed).

        Args:
            album_id: Album ID
            user_id: Owner user ID (for permission check)

        Returns:
            List of image metadata
        """
        logger.info(f"Listing images in album {album_id} (user={user_id})")
        # Placeholder
        return []


__all__ = [
    "AlbumAdapter",
    "ImageAdapter",
]
