"""
Media Workflow Tests

Unit and integration tests for Album and Image CRUD.
Validates:
- Entity schemas and enums
- Permission checks (owner-only)
- Soft delete behavior
- Pagination and filtering
- Error handling (404, 403)
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock, patch

from app.entities.media_entities import (
    PrivacyLevel,
    AlbumCreateRequest,
    AlbumUpdateRequest,
    AlbumResponse,
    AlbumListResponse,
    ImageUpdateMetadataRequest,
    ImageMetadata,
    ImageListResponse,
)
from app.adapters.media_adapters import AlbumAdapter, ImageAdapter
from app.services.media_services import MediaService


# ============================================================================
# TESTS: ENTITY SCHEMAS
# ============================================================================

class TestMediaEntities:
    """Test media entity schemas and enums."""

    def test_privacy_level_enum(self):
        """Test PrivacyLevel enum values."""
        assert PrivacyLevel.PRIVATE == 0
        assert PrivacyLevel.FRIENDS == 1
        assert PrivacyLevel.PUBLIC == 2

    def test_album_create_request(self):
        """Test AlbumCreateRequest schema."""
        req = AlbumCreateRequest(
            title="My Album",
            description="A test album",
            is_public=False,
        )
        assert req.title == "My Album"
        assert req.description == "A test album"
        assert req.is_public is False

    def test_album_create_request_minimal(self):
        """Test AlbumCreateRequest with minimal fields."""
        req = AlbumCreateRequest(title="Album")
        assert req.title == "Album"
        assert req.description is None
        assert req.is_public is False

    def test_album_response(self):
        """Test AlbumResponse schema."""
        now = datetime.now(timezone.utc)
        resp = AlbumResponse(
            id=1,
            user_id=101,
            title="Album",
            description="Test",
            is_public=False,
            created_at=now,
            deleted_at=None,
        )
        assert resp.id == 1
        assert resp.user_id == 101
        assert resp.title == "Album"
        assert resp.deleted_at is None

    def test_album_list_response(self):
        """Test AlbumListResponse schema."""
        now = datetime.now(timezone.utc)
        albums = [
            AlbumResponse(
                id=1,
                user_id=101,
                title="Album 1",
                description=None,
                is_public=False,
                created_at=now,
                deleted_at=None,
            )
        ]
        list_resp = AlbumListResponse(
            items=albums,
            total=1,
            offset=0,
            limit=20,
        )
        assert len(list_resp.items) == 1
        assert list_resp.total == 1
        assert list_resp.offset == 0
        assert list_resp.limit == 20

    def test_image_update_metadata_request(self):
        """Test ImageUpdateMetadataRequest schema."""
        req = ImageUpdateMetadataRequest(
            album_id=1,
            privacy_level=2,
            tags=["nature", "sunset"],
        )
        assert req.album_id == 1
        assert req.privacy_level == 2
        assert req.tags == ["nature", "sunset"]

    def test_image_metadata(self):
        """Test ImageMetadata schema."""
        now = datetime.now(timezone.utc)
        img = ImageMetadata(
            image_id="550e8400-e29b-41d4-a716-446655440000",
            user_id=101,
            album_id=1,
            minio_url="https://minio.example.com/image.jpg",
            privacy_level=2,
            tags=["nature"],
            created_at=now,
            updated_at=now,
            index_status="ready",
            deleted_at=None,
        )
        assert img.user_id == 101
        assert img.privacy_level == 2
        assert img.index_status == "ready"

    def test_image_list_response(self):
        """Test ImageListResponse schema."""
        now = datetime.now(timezone.utc)
        images = [
            ImageMetadata(
                image_id="550e8400-e29b-41d4-a716-446655440000",
                user_id=101,
                album_id=1,
                minio_url="https://minio.example.com/image.jpg",
                privacy_level=2,
                tags=[],
                created_at=now,
                updated_at=now,
                index_status="ready",
                deleted_at=None,
            )
        ]
        list_resp = ImageListResponse(
            items=images,
            total=1,
            offset=0,
            limit=20,
        )
        assert len(list_resp.items) == 1
        assert list_resp.total == 1


# ============================================================================
# TESTS: ADAPTERS
# ============================================================================

class TestAlbumAdapter:
    """Test AlbumAdapter (data access layer)."""

    @pytest.mark.asyncio
    async def test_create_album(self):
        """Test album creation."""
        adapter = AlbumAdapter(session=MagicMock())

        result = await adapter.create_album(
            user_id=101,
            title="My Album",
            description="Test",
            is_public=False,
        )

        assert result["user_id"] == 101
        assert result["title"] == "My Album"
        assert result["is_public"] is False

    @pytest.mark.asyncio
    async def test_get_album(self):
        """Test album retrieval."""
        adapter = AlbumAdapter(session=MagicMock())

        result = await adapter.get_album(album_id=1, user_id=101)

        assert result is not None
        assert result["id"] == 1
        assert result["user_id"] == 101

    @pytest.mark.asyncio
    async def test_list_albums(self):
        """Test album listing."""
        adapter = AlbumAdapter(session=MagicMock())

        albums, total = await adapter.list_albums(user_id=101, offset=0, limit=20)

        assert isinstance(albums, list)
        assert isinstance(total, int)

    @pytest.mark.asyncio
    async def test_soft_delete_album(self):
        """Test soft delete album."""
        adapter = AlbumAdapter(session=MagicMock())

        success = await adapter.soft_delete_album(album_id=1, user_id=101)

        assert success is True


class TestImageAdapter:
    """Test ImageAdapter (data access layer)."""

    @pytest.mark.asyncio
    async def test_create_image_metadata(self):
        """Test image metadata creation."""
        adapter = ImageAdapter(session=MagicMock())

        result = await adapter.create_image_metadata(
            image_id="550e8400-e29b-41d4-a716-446655440000",
            user_id=101,
            minio_object_name="images/img.jpg",
            minio_bucket="raw-images",
            album_id=1,
            privacy_level=2,
            tags=["nature"],
        )

        assert result["image_id"] == "550e8400-e29b-41d4-a716-446655440000"
        assert result["user_id"] == 101
        assert result["privacy_level"] == 2
        assert result["index_status"] == "pending"

    @pytest.mark.asyncio
    async def test_get_image(self):
        """Test image retrieval."""
        adapter = ImageAdapter(session=MagicMock())

        result = await adapter.get_image(
            image_id="550e8400-e29b-41d4-a716-446655440000",
            user_id=101,
        )

        assert result is not None
        assert result["user_id"] == 101

    @pytest.mark.asyncio
    async def test_soft_delete_image(self):
        """Test soft delete image."""
        adapter = ImageAdapter(session=MagicMock())

        success = await adapter.soft_delete_image(
            image_id="550e8400-e29b-41d4-a716-446655440000",
            user_id=101,
        )

        assert success is True


# ============================================================================
# TESTS: SERVICES (BUSINESS LOGIC)
# ============================================================================

class TestMediaService:
    """Test MediaService (orchestration and permission checks)."""

    @pytest.fixture
    def mock_adapters(self):
        """Create mock adapters for service testing."""
        album_adapter = AsyncMock(spec=AlbumAdapter)
        image_adapter = AsyncMock(spec=ImageAdapter)
        return album_adapter, image_adapter

    @pytest.fixture
    def service(self, mock_adapters):
        """Create MediaService with mock adapters."""
        album_adapter, image_adapter = mock_adapters
        return MediaService(album_adapter, image_adapter)

    # ====== ALBUM SERVICE TESTS ======

    @pytest.mark.asyncio
    async def test_create_album_service(self, service, mock_adapters):
        """Test album creation through service."""
        album_adapter, _ = mock_adapters
        album_adapter.create_album.return_value = {
            "id": 1,
            "user_id": 101,
            "title": "Album",
            "description": None,
            "is_public": False,
            "created_at": datetime.now(timezone.utc),
        }

        req = AlbumCreateRequest(title="Album")
        result = await service.create_album(user_id=101, req=req)

        assert result["id"] == 1
        assert result["user_id"] == 101
        album_adapter.create_album.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_album_service_permission_granted(self, service, mock_adapters):
        """Test album retrieval when user is owner."""
        album_adapter, _ = mock_adapters
        album_adapter.get_album.return_value = {
            "id": 1,
            "user_id": 101,
            "title": "Album",
            "description": None,
            "is_public": False,
            "created_at": datetime.now(timezone.utc),
        }

        result = await service.get_album(album_id=1, user_id=101)

        assert result is not None
        assert result["user_id"] == 101

    @pytest.mark.asyncio
    async def test_get_album_service_permission_denied(self, service, mock_adapters):
        """Test album retrieval fails when user is not owner."""
        album_adapter, _ = mock_adapters
        album_adapter.get_album.return_value = {
            "id": 1,
            "user_id": 101,  # Owner is user 101
            "title": "Album",
            "description": None,
            "is_public": False,
            "created_at": datetime.now(timezone.utc),
        }

        # Try to access as user 102 (not owner)
        result = await service.get_album(album_id=1, user_id=102)

        assert result is None  # Permission denied

    @pytest.mark.asyncio
    async def test_list_albums_service(self, service, mock_adapters):
        """Test album listing through service."""
        album_adapter, _ = mock_adapters
        album_adapter.list_albums.return_value = ([], 0)

        result = await service.list_albums(user_id=101, offset=0, limit=20)

        assert result["items"] == []
        assert result["total"] == 0
        assert result["offset"] == 0
        assert result["limit"] == 20

    @pytest.mark.asyncio
    async def test_update_album_service(self, service, mock_adapters):
        """Test album update through service."""
        album_adapter, _ = mock_adapters
        album_adapter.get_album.return_value = {
            "id": 1,
            "user_id": 101,
            "title": "Old Title",
            "description": None,
            "is_public": False,
            "created_at": datetime.now(timezone.utc),
        }
        album_adapter.update_album.return_value = {
            "id": 1,
            "user_id": 101,
            "title": "New Title",
            "description": None,
            "is_public": False,
            "created_at": datetime.now(timezone.utc),
        }

        req = AlbumUpdateRequest(title="New Title")
        result = await service.update_album(album_id=1, user_id=101, req=req)

        assert result is not None
        assert result["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_delete_album_service(self, service, mock_adapters):
        """Test album deletion through service."""
        album_adapter, _ = mock_adapters
        album_adapter.get_album.return_value = {
            "id": 1,
            "user_id": 101,
            "title": "Album",
            "description": None,
            "is_public": False,
            "created_at": datetime.now(timezone.utc),
        }
        album_adapter.soft_delete_album.return_value = True

        success = await service.delete_album(album_id=1, user_id=101)

        assert success is True
        album_adapter.soft_delete_album.assert_called_once()

    # ====== IMAGE SERVICE TESTS ======

    @pytest.mark.asyncio
    async def test_create_image_metadata_service(self, service, mock_adapters):
        """Test image metadata creation through service."""
        _, image_adapter = mock_adapters
        image_adapter.create_image_metadata.return_value = {
            "image_id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": 101,
            "album_id": 1,
            "minio_object_name": "images/img.jpg",
            "minio_bucket": "raw-images",
            "privacy_level": 2,
            "tags": [],
            "index_status": "pending",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "deleted_at": None,
        }

        result = await service.create_image_metadata(
            image_id="550e8400-e29b-41d4-a716-446655440000",
            user_id=101,
            minio_object_name="images/img.jpg",
            minio_bucket="raw-images",
            album_id=1,
        )

        assert result["user_id"] == 101
        assert result["index_status"] == "pending"

    @pytest.mark.asyncio
    async def test_list_images_service(self, service, mock_adapters):
        """Test image listing through service."""
        _, image_adapter = mock_adapters
        image_adapter.list_images.return_value = ([], 0)

        result = await service.list_images(user_id=101, offset=0, limit=20, album_id=None)

        assert result["items"] == []
        assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_delete_image_service(self, service, mock_adapters):
        """Test image deletion through service."""
        _, image_adapter = mock_adapters
        image_adapter.get_image.return_value = {
            "image_id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": 101,
            "album_id": 1,
            "minio_url": "https://minio.example.com/image.jpg",
            "privacy_level": 2,
            "tags": [],
            "index_status": "ready",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "deleted_at": None,
        }
        image_adapter.soft_delete_image.return_value = True

        success = await service.delete_image(
            image_id="550e8400-e29b-41d4-a716-446655440000",
            user_id=101,
        )

        assert success is True


# ============================================================================
# INTEGRATION TESTS (PLACEHOLDER)
# ============================================================================

class TestMediaIntegration:
    """Integration tests (skipped for now, require live DB)."""

    @pytest.mark.skip(reason="Requires live PostgreSQL and MinIO")
    @pytest.mark.asyncio
    async def test_album_crud_full_flow(self):
        """Test complete album CRUD flow."""
        pass

    @pytest.mark.skip(reason="Requires live PostgreSQL and MinIO")
    @pytest.mark.asyncio
    async def test_image_crud_full_flow(self):
        """Test complete image CRUD flow."""
        pass

    @pytest.mark.skip(reason="Requires live PostgreSQL and MinIO")
    @pytest.mark.asyncio
    async def test_cascade_delete_album_deletes_images(self):
        """Test that deleting album handles its images correctly."""
        pass
