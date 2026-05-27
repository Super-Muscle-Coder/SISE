"""
Search workflow service: orchestration of search logic with privacy filtering.
Prefix: search_
"""

import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.search_entities import (
    SearchResponse,
    SearchResultItem,
    MetricType,
    SearchByImageRequest,
    SearchByTextRequest,
)
from ..adapters.search_adapters import (
    MilvusSearchAdapter,
    PostgreSQLSearchAdapter,
    AIServiceSearchAdapter,
)

logger = logging.getLogger(__name__)


class SearchService:
    """
    Service for search operations with privacy filtering and metadata enrichment.

    Implements:
    - Image search: upload image → embed via AI Service → hybrid search → privacy filter
    - Text search: text query → embed via AI Service → hybrid search → privacy filter
    - Privacy filtering per data_schema.yaml → notes.privacy_level_1_query
    """

    def __init__(
        self,
        milvus_adapter: MilvusSearchAdapter,
        postgres_adapter: PostgreSQLSearchAdapter,
        ai_adapter: AIServiceSearchAdapter,
    ):
        """Initialize search service with adapters."""
        self.milvus = milvus_adapter
        self.postgres = postgres_adapter
        self.ai = ai_adapter

    async def search_by_image(
        self,
        image_bytes: bytes,
        current_user_id: int,
        request: SearchByImageRequest,
    ) -> SearchResponse:
        """
        Search for similar images using an uploaded image file.

        Flow:
        1. Embed image using AI Service (POST /inference/embed/image)
        2. Build privacy-aware filter expression
        3. Call hybrid search on Milvus
        4. Enrich results with PostgreSQL metadata
        5. Construct presigned URLs for results

        Args:
            image_bytes: Image file bytes
            current_user_id: Authenticated user ID
            request: Search parameters (top_k, metric, album_id)

        Returns:
            SearchResponse with top-k results

        Raises:
            ValueError: If image embedding fails or dimension mismatch
            Exception: If search operation fails
        """
        logger.info(f"Search by image initiated for user {current_user_id}, top_k={request.top_k}")
        start_time = time.time()

        try:
            # Step 1: Embed image using AI Service
            logger.debug("Calling AI Service to embed image")
            query_vector = await self.ai.embed_image(image_bytes)

            # Step 2: Build privacy-aware filter expression
            logger.debug("Building privacy filter expression")
            filter_expr = await self._build_privacy_filter(current_user_id)

            # Step 3: Optionally filter by album_id
            if request.album_id:
                album_filter = f"album_id == {request.album_id}"
                if filter_expr:
                    filter_expr = f"({filter_expr}) && ({album_filter})"
                else:
                    filter_expr = album_filter

            # Step 4: Call hybrid search on Milvus
            logger.debug(f"Performing hybrid search with metric={request.metric}, filter={filter_expr}")
            search_results = await self.milvus.hybrid_search(
                vector=query_vector,
                top_k=request.top_k,
                metric=request.metric,
                filter_expr=filter_expr,
            )

            # Step 5: Enrich results with metadata and presigned URLs
            enriched_results = await self._enrich_search_results(search_results)

            latency_ms = (time.time() - start_time) * 1000
            logger.info(f"Search completed in {latency_ms:.2f}ms with {len(enriched_results)} results")

            return SearchResponse(
                results=enriched_results,
                latency_ms=latency_ms,
                top_k=len(enriched_results),
            )

        except Exception as e:
            logger.error(f"Search by image failed: {str(e)}")
            raise

    async def search_by_text(
        self,
        query_text: str,
        current_user_id: int,
        request: SearchByTextRequest,
    ) -> SearchResponse:
        """
        Search for images using a text query.

        Flow:
        1. Embed text using AI Service (POST /inference/embed/text)
        2. Build privacy-aware filter expression
        3. Call hybrid search on Milvus
        4. Enrich results with PostgreSQL metadata
        5. Construct presigned URLs for results

        Args:
            query_text: Text query
            current_user_id: Authenticated user ID
            request: Search parameters (top_k, metric, album_id)

        Returns:
            SearchResponse with top-k results

        Raises:
            ValueError: If text embedding fails or dimension mismatch
            Exception: If search operation fails
        """
        logger.info(f"Search by text initiated for user {current_user_id}, query='{query_text[:50]}...', top_k={request.top_k}")
        start_time = time.time()

        try:
            # Step 1: Embed text using AI Service
            logger.debug("Calling AI Service to embed text")
            query_vector = await self.ai.embed_text(query_text)

            # Step 2: Build privacy-aware filter expression
            logger.debug("Building privacy filter expression")
            filter_expr = await self._build_privacy_filter(current_user_id)

            # Step 3: Optionally filter by album_id
            if request.album_id:
                album_filter = f"album_id == {request.album_id}"
                if filter_expr:
                    filter_expr = f"({filter_expr}) && ({album_filter})"
                else:
                    filter_expr = album_filter

            # Step 4: Call hybrid search on Milvus
            logger.debug(f"Performing hybrid search with metric={request.metric}, filter={filter_expr}")
            search_results = await self.milvus.hybrid_search(
                vector=query_vector,
                top_k=request.top_k,
                metric=request.metric,
                filter_expr=filter_expr,
            )

            # Step 5: Enrich results with metadata and presigned URLs
            enriched_results = await self._enrich_search_results(search_results)

            latency_ms = (time.time() - start_time) * 1000
            logger.info(f"Search completed in {latency_ms:.2f}ms with {len(enriched_results)} results")

            return SearchResponse(
                results=enriched_results,
                latency_ms=latency_ms,
                top_k=len(enriched_results),
            )

        except Exception as e:
            logger.error(f"Search by text failed: {str(e)}")
            raise

    async def _build_privacy_filter(self, current_user_id: int) -> Optional[str]:
        """
        Build Milvus filter expression for privacy levels.

        Per data_schema.yaml → notes.privacy_level_1_query:
        - privacy_level=0 (Private): only user's own images
        - privacy_level=1 (Friends): user's own images + friends' shared images
        - privacy_level=2 (Public): any public images

        Filter expression:
        (privacy_level == 2) OR (user_id == current_user_id) OR
        (privacy_level == 1 AND user_id IN [friend_ids])

        Args:
            current_user_id: Current authenticated user ID

        Returns:
            Milvus filter expression string, or None if error
        """
        try:
            # Base filter: user's own images or public images
            base_filter = f"(user_id == {current_user_id}) OR (privacy_level == 2)"

            # Fetch friend IDs (cache within 5 min per spec)
            friend_ids = await self.postgres.get_user_friends(current_user_id)

            if friend_ids:
                # Add friends' shared images
                friends_filter = f"(privacy_level == 1 AND user_id IN {friend_ids})"
                full_filter = f"({base_filter}) OR ({friends_filter})"
            else:
                full_filter = base_filter

            logger.debug(f"Privacy filter for user {current_user_id}: {full_filter}")
            return full_filter

        except Exception as e:
            logger.warning(f"Failed to build privacy filter: {str(e)}, using permissive default")
            # Fallback: only public and user's own images
            return f"(user_id == {current_user_id}) OR (privacy_level == 2)"

    async def _enrich_search_results(
        self, search_results: List[Dict[str, Any]]
    ) -> List[SearchResultItem]:
        """
        Enrich search results with additional metadata and presigned URLs.

        Args:
            search_results: Raw search results from Milvus

        Returns:
            List of enriched SearchResultItem objects
        """
        try:
            if not search_results:
                return []

            # Extract image IDs for enrichment
            image_ids = [r.get("image_id") for r in search_results]

            # Fetch additional metadata from PostgreSQL
            enriched_metadata = await self.postgres.enrich_image_metadata(image_ids)

            # Build result items with presigned URLs
            result_items = []
            for result in search_results:
                image_id = result.get("image_id")
                metadata = enriched_metadata.get(image_id, {})

                # Get presigned URL
                minio_url = await self.postgres.get_image_minio_url(image_id)

                result_items.append(
                    SearchResultItem(
                        image_id=image_id,
                        score=result.get("score", 0.0),
                        minio_url=minio_url or "",
                        metadata={
                            "user_id": result.get("user_id"),
                            "privacy_level": result.get("privacy_level"),
                            **metadata,
                        },
                    )
                )

            logger.info(f"Enriched {len(result_items)} search results with metadata")
            return result_items

        except Exception as e:
            logger.warning(f"Failed to enrich search results: {str(e)}")
            # Return results without enrichment rather than failing
            return [
                SearchResultItem(
                    image_id=r.get("image_id"),
                    score=r.get("score", 0.0),
                    minio_url="",
                    metadata=None,
                )
                for r in search_results
            ]
