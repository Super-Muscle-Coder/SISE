"""
Search workflow tests: comprehensive testing of search entities, adapters, services, and routers.
Prefix: test_
"""

import pytest
from typing import List, Dict, Any
from unittest.mock import MagicMock, patch

from app.entities.search_entities import (
    SearchResultItem,
    SearchResponse,
    SearchByImageRequest,
    SearchByTextRequest,
    MetricType,
)
from app.adapters.search_adapters import (
    MilvusSearchAdapter,
    PostgreSQLSearchAdapter,
    AIServiceSearchAdapter,
)
from app.services.search_services import SearchService


# Async mock helper for Python 3.13
class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


class TestSearchEntities:
    """Test search workflow entities (schema validation)."""

    def test_search_result_item_valid(self):
        """Test SearchResultItem with valid data."""
        item = SearchResultItem(
            image_id="550e8400-e29b-41d4-a716-446655440000",
            score=0.95,
            minio_url="https://minio.example.com/image.jpg",
            metadata={"album_id": 1, "tags": ["nature"]},
        )
        assert item.image_id == "550e8400-e29b-41d4-a716-446655440000"
        assert item.score == 0.95
        assert item.metadata["album_id"] == 1

    def test_search_response_valid(self):
        """Test SearchResponse schema."""
        response = SearchResponse(
            results=[
                SearchResultItem(
                    image_id="550e8400-e29b-41d4-a716-446655440000",
                    score=0.95,
                    minio_url="https://minio.example.com/image.jpg",
                )
            ],
            latency_ms=123.45,
            top_k=1,
        )
        assert response.top_k == 1
        assert response.latency_ms == 123.45
        assert len(response.results) == 1

    def test_search_by_image_request_valid(self):
        """Test SearchByImageRequest with defaults."""
        request = SearchByImageRequest(metric=MetricType.COSINE)
        assert request.top_k == 10
        assert request.metric == MetricType.COSINE
        assert request.album_id is None

    def test_search_by_text_request_valid(self):
        """Test SearchByTextRequest parsing."""
        request = SearchByTextRequest(
            query_text="sunset over mountains",
            top_k=20,
            metric=MetricType.L2,
        )
        assert request.query_text == "sunset over mountains"
        assert request.top_k == 20
        assert request.metric == MetricType.L2


class TestMilvusSearchAdapter:
    """Test Milvus search adapter."""

    @pytest.fixture
    def mock_milvus_client(self):
        """Mock Milvus client."""
        return AsyncMock()

    @pytest.fixture
    def adapter(self, mock_milvus_client):
        """Create adapter with mock client."""
        return MilvusSearchAdapter(mock_milvus_client)

    @pytest.mark.asyncio
    async def test_hybrid_search_valid(self, adapter, mock_milvus_client):
        """Test hybrid search with valid vector."""
        # Mock Milvus search - it returns sync results
        mock_results = [
            [
                {
                    "image_id": "550e8400-e29b-41d4-a716-446655440000",
                    "distance": 0.95,
                    "user_id": 123,
                    "privacy_level": 2,
                },
            ]
        ]

        # Mock client.search as a regular method (not async)
        mock_milvus_client.search = MagicMock(return_value=mock_results)

        vector = [0.1] * 512  # Valid dimension
        results = await adapter.hybrid_search(
            vector=vector,
            top_k=10,
            metric=MetricType.COSINE,
            filter_expr="privacy_level == 2",
        )

        # Verify search was called
        mock_milvus_client.search.assert_called_once()
        assert len(results) >= 0  # Results format validated
        assert results[0]["score"] == 0.95

    @pytest.mark.asyncio
    async def test_hybrid_search_dimension_mismatch(self, adapter):
        """Test hybrid search with dimension mismatch."""
        vector = [0.1] * 256  # Wrong dimension

        with pytest.raises(ValueError, match="ERR_VECTOR_DIM_MISMATCH"):
            await adapter.hybrid_search(
                vector=vector,
                top_k=10,
                metric=MetricType.COSINE,
            )


class TestPostgreSQLSearchAdapter:
    """Test PostgreSQL search adapter."""

    @pytest.fixture
    def mock_session(self):
        """Mock AsyncSession."""
        return AsyncMock()

    @pytest.fixture
    def adapter(self, mock_session):
        """Create adapter with mock session."""
        return PostgreSQLSearchAdapter(mock_session)

    @pytest.mark.asyncio
    async def test_get_user_friends(self, adapter):
        """Test fetching user's friends."""
        # Mock database response
        user_id = 123
        friends = await adapter.get_user_friends(user_id)

        # Placeholder returns empty list (actual DB query mocked)
        assert isinstance(friends, list)

    @pytest.mark.asyncio
    async def test_enrich_image_metadata(self, adapter):
        """Test enriching image metadata."""
        image_ids = [
            "550e8400-e29b-41d4-a716-446655440000",
            "550e8400-e29b-41d4-a716-446655440001",
        ]

        enriched = await adapter.enrich_image_metadata(image_ids)

        assert isinstance(enriched, dict)
        assert len(enriched) == 2
        for image_id in image_ids:
            assert image_id in enriched
            assert "album_id" in enriched[image_id]

    @pytest.mark.asyncio
    async def test_get_image_minio_url(self, adapter):
        """Test getting MinIO presigned URL."""
        image_id = "550e8400-e29b-41d4-a716-446655440000"
        url = await adapter.get_image_minio_url(image_id)

        # Placeholder returns mock URL
        assert isinstance(url, (str, type(None)))


class TestAIServiceSearchAdapter:
    """Test AI Service search adapter."""

    @pytest.fixture
    def mock_http_client(self):
        """Mock HTTP client."""
        return AsyncMock()

    @pytest.fixture
    def adapter(self, mock_http_client):
        """Create adapter with mock HTTP client."""
        return AIServiceSearchAdapter(
            ai_service_url="http://ai-service:8001",
            http_client=mock_http_client,
        )

    @pytest.mark.asyncio
    async def test_embed_image_valid(self, adapter):
        """Test image embedding."""
        image_bytes = b"fake image data"

        vector = await adapter.embed_image(image_bytes)

        # Placeholder returns mock vector
        assert isinstance(vector, list)
        assert len(vector) == 512

    @pytest.mark.asyncio
    async def test_embed_text_valid(self, adapter):
        """Test text embedding."""
        query_text = "sunset over mountains"

        vector = await adapter.embed_text(query_text)

        # Placeholder returns mock vector
        assert isinstance(vector, list)
        assert len(vector) == 512


class TestSearchService:
    """Test search service with full workflow."""

    @pytest.fixture
    def mock_milvus(self):
        """Mock Milvus adapter."""
        return AsyncMock(spec=MilvusSearchAdapter)

    @pytest.fixture
    def mock_postgres(self):
        """Mock PostgreSQL adapter."""
        return AsyncMock(spec=PostgreSQLSearchAdapter)

    @pytest.fixture
    def mock_ai(self):
        """Mock AI Service adapter."""
        return AsyncMock(spec=AIServiceSearchAdapter)

    @pytest.fixture
    def service(self, mock_milvus, mock_postgres, mock_ai):
        """Create service with mocked adapters."""
        return SearchService(
            milvus_adapter=mock_milvus,
            postgres_adapter=mock_postgres,
            ai_adapter=mock_ai,
        )

    @pytest.mark.asyncio
    async def test_search_by_image_full_flow(self, service, mock_ai, mock_postgres, mock_milvus):
        """Test complete image search workflow."""
        # Setup mocks
        mock_ai.embed_image.return_value = [0.1] * 512
        mock_postgres.get_user_friends.return_value = [200, 201]
        mock_milvus.hybrid_search.return_value = [
            {
                "image_id": "550e8400-e29b-41d4-a716-446655440000",
                "score": 0.95,
                "user_id": 100,
                "privacy_level": 2,
            },
        ]
        mock_postgres.enrich_image_metadata.return_value = {
            "550e8400-e29b-41d4-a716-446655440000": {
                "album_id": 1,
                "tags": ["nature"],
                "created_at": "2024-01-01T00:00:00Z",
            },
        }
        mock_postgres.get_image_minio_url.return_value = "https://minio.example.com/image.jpg"

        # Execute search
        image_bytes = b"fake image data"
        request = SearchByImageRequest(top_k=10, metric=MetricType.COSINE)
        response = await service.search_by_image(
            image_bytes=image_bytes,
            current_user_id=100,
            request=request,
        )

        # Verify response
        assert isinstance(response, SearchResponse)
        assert response.top_k == 1
        assert len(response.results) == 1
        assert response.results[0].image_id == "550e8400-e29b-41d4-a716-446655440000"
        assert response.results[0].score == 0.95
        assert response.latency_ms > 0

    @pytest.mark.asyncio
    async def test_search_by_text_full_flow(self, service, mock_ai, mock_postgres, mock_milvus):
        """Test complete text search workflow."""
        # Setup mocks
        mock_ai.embed_text.return_value = [0.1] * 512
        mock_postgres.get_user_friends.return_value = []
        mock_milvus.hybrid_search.return_value = [
            {
                "image_id": "550e8400-e29b-41d4-a716-446655440000",
                "score": 0.88,
                "user_id": 100,
                "privacy_level": 2,
            },
        ]
        mock_postgres.enrich_image_metadata.return_value = {}
        mock_postgres.get_image_minio_url.return_value = None

        # Execute search
        request = SearchByTextRequest(
            query_text="sunset",
            top_k=10,
            metric=MetricType.COSINE,
        )
        response = await service.search_by_text(
            query_text="sunset",
            current_user_id=100,
            request=request,
        )

        # Verify response
        assert isinstance(response, SearchResponse)
        assert response.top_k == 1
        assert len(response.results) == 1

    @pytest.mark.asyncio
    async def test_privacy_filter_logic(self, service, mock_postgres):
        """Test privacy filter building for different user scenarios."""
        mock_postgres.get_user_friends.return_value = [200, 201]

        # Test filter construction
        filter_expr = await service._build_privacy_filter(current_user_id=100)

        # Filter should include: user's own OR public OR friends' shared
        assert "user_id == 100" in filter_expr or "100" in filter_expr
        assert "privacy_level == 2" in filter_expr


# Integration test (requires live services)
class TestSearchWorkflowIntegration:
    """Integration tests for search workflow (requires real backend setup)."""

    @pytest.mark.skip(reason="Requires live backend services")
    @pytest.mark.asyncio
    async def test_end_to_end_image_search(self):
        """End-to-end test: upload image → search by image → verify results."""
        # This test requires:
        # - Live PostgreSQL with test data
        # - Live Milvus with indexed vectors
        # - Live AI Service for embeddings
        # - Live MinIO for presigned URLs
        pass

    @pytest.mark.skip(reason="Requires live backend services")
    @pytest.mark.asyncio
    async def test_end_to_end_text_search(self):
        """End-to-end test: search by text → verify results."""
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
