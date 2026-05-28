"""
Search workflow adapters: data access and external system integration.
Prefix: search_
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.search_entities import (
    SearchResultItem,
    VectorSearchRequest,
    MetricType,
)

logger = logging.getLogger(__name__)

VECTOR_DIM = 512  # Must match global_configs.vector_dim from data_schema.yaml


class MilvusSearchAdapter:
    """Adapter for vector DB (Milvus) search operations."""

    def __init__(self, milvus_client):
        """
        Initialize Milvus search adapter.

        Args:
            milvus_client: Milvus client instance (will be passed by DI)
        """
        self.client = milvus_client

    async def hybrid_search(
        self,
        vector: List[float],
        top_k: int,
        metric: MetricType = MetricType.COSINE,
        filter_expr: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search (vector + metadata filter) on Milvus.

        Args:
            vector: Query vector (must have length VECTOR_DIM)
            top_k: Number of top results
            metric: Similarity metric (COSINE, L2, IP)
            filter_expr: Structured metadata filter expression

        Returns:
            List of search results with image_id, score, and metadata

        Raises:
            ValueError: If vector dimension does not match VECTOR_DIM
            Exception: If Milvus operation fails
        """
        if len(vector) != VECTOR_DIM:
            raise ValueError(
                f"Vector dimension mismatch: expected {VECTOR_DIM}, got {len(vector)}. "
                "Error code: ERR_VECTOR_DIM_MISMATCH"
            )

        try:
            # Map metric type to Milvus metric name
            metric_map = {
                MetricType.COSINE: "COSINE",
                MetricType.L2: "L2",
                MetricType.IP: "IP",
            }

            search_params = {
                "metric_type": metric_map.get(metric, "COSINE"),
                "params": {"ef": 64},  # efSearch from data_schema.yaml
            }

            # Perform search with optional metadata filter
            results = self.client.search(
                collection_name="sise_v1",
                data=[vector],
                anns_field="vector",
                search_params=search_params,
                limit=top_k,
                expr=filter_expr,  # Optional metadata filter
                output_fields=["image_id", "user_id", "privacy_level"],
            )

            # Flatten and format results
            formatted_results = []
            if results and len(results) > 0:
                for hit in results[0]:  # results is list of result groups
                    formatted_results.append(
                        {
                            "image_id": hit.get("image_id"),
                            "score": hit.get("distance"),
                            "user_id": hit.get("user_id"),
                            "privacy_level": hit.get("privacy_level"),
                        }
                    )

            logger.info(f"Milvus hybrid search returned {len(formatted_results)} results")
            return formatted_results

        except Exception as e:
            logger.error(f"Milvus hybrid search failed: {str(e)}")
            raise


class PostgreSQLSearchAdapter:
    """Adapter for PostgreSQL-based search metadata enrichment and privacy filtering."""

    def __init__(self, db_session: AsyncSession):
        """Initialize PostgreSQL adapter for search operations."""
        self.session = db_session

    async def get_user_friends(self, user_id: int) -> List[int]:
        """
        Fetch friend IDs for a user (for privacy_level=1 filtering).

        Args:
            user_id: User ID

        Returns:
            List of friend IDs
        """
        try:
            # Query friends table: SELECT friend_id FROM friends WHERE user_id = ?
            from sqlalchemy import Table, MetaData

            # This assumes friends table exists in the schema
            # In production, use proper ORM models
            result = await self.session.execute(
                select(
                    # Assuming there's a friends table with user_id and friend_id columns
                    # This is a placeholder - actual implementation depends on ORM setup
                ).where(
                    # WHERE user_id = user_id
                )
            )

            friends = [row[0] for row in result.fetchall()]
            logger.info(f"Fetched {len(friends)} friends for user {user_id}")
            return friends

        except Exception as e:
            logger.warning(f"Failed to fetch friends for user {user_id}: {str(e)}")
            return []

    async def enrich_image_metadata(
        self, image_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Enrich search results with additional metadata from PostgreSQL.

        Args:
            image_ids: List of image IDs to enrich

        Returns:
            Dict mapping image_id to enriched metadata (album_id, tags, created_at, etc.)
        """
        try:
            if not image_ids:
                return {}

            # Query images table for additional metadata
            # SELECT id, album_id, tags, created_at FROM images WHERE id IN (image_ids)
            # This is a placeholder - actual implementation depends on ORM

            enriched = {}
            for image_id in image_ids:
                enriched[image_id] = {
                    "album_id": None,
                    "tags": [],
                    "created_at": None,
                }

            logger.info(f"Enriched metadata for {len(enriched)} images")
            return enriched

        except Exception as e:
            logger.warning(f"Failed to enrich image metadata: {str(e)}")
            return {}

    async def get_image_minio_url(self, image_id: str) -> Optional[str]:
        """
        Get presigned MinIO URL for an image.

        Args:
            image_id: Image ID

        Returns:
            Presigned URL or None if image not found
        """
        try:
            # Query images table for minio_object_name and minio_bucket
            # Construct presigned URL using MinIO client
            # This is a placeholder
            return f"https://minio.example.com/presigned-url-for-{image_id}"

        except Exception as e:
            logger.warning(f"Failed to get MinIO URL for image {image_id}: {str(e)}")
            return None


class AIServiceSearchAdapter:
    """Adapter for AI Service embedding requests during search."""

    def __init__(self, ai_service_url: str, http_client):
        """
        Initialize AI Service adapter for search embedding requests.

        Args:
            ai_service_url: Base URL of AI Service (e.g., http://ai-service:8001)
            http_client: Async HTTP client instance
        """
        self.base_url = ai_service_url
        self.http_client = http_client

    async def embed_image(self, image_bytes: bytes) -> List[float]:
        """
        Call AI Service to embed an image file.

        Args:
            image_bytes: Image file bytes

        Returns:
            Vector embedding of shape [VECTOR_DIM]

        Raises:
            ValueError: If vector dimension does not match
            Exception: If AI Service request fails
        """
        try:
            # POST /inference/embed/image with multipart file
            url = f"{self.base_url}/inference/embed/image"
            files = {"file": ("query.jpg", image_bytes, "image/jpeg")}

            # This is a placeholder - actual HTTP call depends on setup
            response = {"vector": [0.0] * VECTOR_DIM, "dim": VECTOR_DIM, "model": "clip-vit-b-32"}

            if response.get("dim") != VECTOR_DIM:
                raise ValueError(
                    f"Vector dimension mismatch from AI Service: expected {VECTOR_DIM}, got {response.get('dim')}. "
                    "Error code: ERR_VECTOR_DIM_MISMATCH"
                )

            logger.info(f"AI Service image embedding returned vector of dim {response.get('dim')}")
            return response.get("vector")

        except Exception as e:
            logger.error(f"AI Service image embedding failed: {str(e)}")
            raise

    async def embed_text(self, query_text: str) -> List[float]:
        """
        Call AI Service to embed a text query.

        Args:
            query_text: Text query

        Returns:
            Vector embedding of shape [VECTOR_DIM]

        Raises:
            ValueError: If vector dimension does not match
            Exception: If AI Service request fails
        """
        try:
            # POST /inference/embed/text with JSON {"query_text": "..."}
            url = f"{self.base_url}/inference/embed/text"

            # This is a placeholder - actual HTTP call depends on setup
            response = {"vector": [0.0] * VECTOR_DIM, "dim": VECTOR_DIM, "model": "clip-vit-b-32"}

            if response.get("dim") != VECTOR_DIM:
                raise ValueError(
                    f"Vector dimension mismatch from AI Service: expected {VECTOR_DIM}, got {response.get('dim')}. "
                    "Error code: ERR_VECTOR_DIM_MISMATCH"
                )

            logger.info(f"AI Service text embedding returned vector of dim {response.get('dim')}")
            return response.get("vector")

        except Exception as e:
            logger.error(f"AI Service text embedding failed: {str(e)}")
            raise


__all__ = [
    "MilvusSearchAdapter",
    "PostgreSQLSearchAdapter",
    "AIServiceSearchAdapter",
]
