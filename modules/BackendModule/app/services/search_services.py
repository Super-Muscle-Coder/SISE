"""
Search workflow services.
"""

from __future__ import annotations

from typing import Any

from ..adapters.search_adapters import (
    AIServiceSearchAdapter,
    FriendsQueryAdapter,
    StorageVectorSearchAdapter,
)
from ..entities.search_entities import (
    MetricType,
    SearchByImageRequest,
    SearchByTextRequest,
    SearchResponse,
)


class SearchService:
    def __init__(
        self,
        ai_adapter: AIServiceSearchAdapter,
        storage_vector_adapter: StorageVectorSearchAdapter,
        friends_adapter: FriendsQueryAdapter,
    ):
        self.ai_adapter = ai_adapter
        self.storage_vector_adapter = storage_vector_adapter
        self.friends_adapter = friends_adapter

    def _build_privacy_filter(self, current_user_id: int, friend_ids: list[int]) -> dict[str, Any]:
        or_branches: list[dict[str, Any]] = [
            {"field": "privacy_level", "op": "in", "value": [2]},
            {"field": "user_id", "op": "eq", "value": current_user_id},
        ]

        if friend_ids:
            or_branches.append(
                {
                    "and": [
                        {"field": "privacy_level", "op": "in", "value": [1]},
                        {"field": "user_id", "op": "in", "value": friend_ids},
                    ]
                }
            )

        return {"or": or_branches}

    def _apply_album_filter_if_needed(self, response: SearchResponse, album_id: int | None) -> SearchResponse:
        if album_id is None:
            return response

        filtered = [item for item in response.results if item.metadata.album_id == album_id]
        return SearchResponse(
            results=filtered,
            latency_ms=response.latency_ms,
            top_k=response.top_k,
        )

    async def search_by_image(
        self,
        request: SearchByImageRequest,
        image_bytes: bytes,
        filename: str,
        current_user_id: int,
        bearer_token: str,
    ) -> SearchResponse:
        vector = await self.ai_adapter.embed_image(
            file_bytes=image_bytes,
            filename=filename,
            bearer_token=bearer_token,
        )

        friend_ids = await self.friends_adapter.get_friend_ids(current_user_id=current_user_id)
        filter_payload = self._build_privacy_filter(current_user_id=current_user_id, friend_ids=friend_ids)

        response = await self.storage_vector_adapter.search_hybrid(
            vector=vector,
            top_k=request.top_k,
            metric=MetricType.COSINE,  # enforced by contract
            filter_payload=filter_payload,
            bearer_token=bearer_token,
        )

        return self._apply_album_filter_if_needed(response=response, album_id=request.album_id)

    async def search_by_text(
        self,
        request: SearchByTextRequest,
        current_user_id: int,
        bearer_token: str,
    ) -> SearchResponse:
        vector = await self.ai_adapter.embed_text(
            query_text=request.query_text,
            bearer_token=bearer_token,
        )

        friend_ids = await self.friends_adapter.get_friend_ids(current_user_id=current_user_id)
        filter_payload = self._build_privacy_filter(current_user_id=current_user_id, friend_ids=friend_ids)

        response = await self.storage_vector_adapter.search_hybrid(
            vector=vector,
            top_k=request.top_k,
            metric=MetricType.COSINE,  # enforced by contract
            filter_payload=filter_payload,
            bearer_token=bearer_token,
        )

        return self._apply_album_filter_if_needed(response=response, album_id=request.album_id)


__all__ = ["SearchService"]