"""
Indexing workflow services.
"""

from __future__ import annotations

from ..adapters.auth_adapters import TokenGenerator
from ..adapters.indexing_adapters import IndexingAdapter
from ..entities.indexing_entities import (
    PermanentIndexingError,
    TransientIndexingError,
)


class IndexingService:
    def __init__(
        self,
        adapter: IndexingAdapter,
        token_generator: TokenGenerator,
        expected_vector_dim: int,
    ):
        self.adapter = adapter
        self.token_generator = token_generator
        self.expected_vector_dim = expected_vector_dim

    async def process_indexing(self, image_id: str) -> None:
        source = await self.adapter.get_image_source(image_id)

        # Temporary assumption (decision #6): mint internal token using image owner identity.
        internal_token = self.token_generator.generate_token(
            user_id=source.user_id,
            username=source.username,
            expires_in=300,
        )

        image_bytes = await self.adapter.fetch_image_bytes(source)

        embedding = await self.adapter.request_embedding(
            image_bytes=image_bytes,
            filename=source.minio_object_name.split("/")[-1],
            bearer_token=internal_token,
        )

        if embedding.dim != self.expected_vector_dim:
            raise PermanentIndexingError(
                f"Vector dim mismatch from AI service: got {embedding.dim}, expected {self.expected_vector_dim}"
            )

        if len(embedding.vector) != self.expected_vector_dim:
            raise PermanentIndexingError(
                f"Vector length mismatch: got {len(embedding.vector)}, expected {self.expected_vector_dim}"
            )

        await self.adapter.call_vector_index(
            image_id=image_id,
            vector=embedding.vector,
            bearer_token=internal_token,
        )

        await self.adapter.update_index_status(image_id=image_id, status="ready")


__all__ = ["IndexingService", "TransientIndexingError", "PermanentIndexingError"]