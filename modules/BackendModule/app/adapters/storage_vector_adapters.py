"""
Storage Vector adapters.
"""

from __future__ import annotations

from typing import Any, Dict

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class StorageVectorAdapter:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    @staticmethod
    def _serialize_vector(vector: list[float]) -> str:
        return "[" + ",".join(format(float(x), ".17g") for x in vector) + "]"

    async def index_vector(self, image_id: str, vector: list[float]) -> None:
        vector_str = self._serialize_vector(vector)

        stmt = text(
            """
            UPDATE images
            SET embedding = CAST(:vector_str AS vector)
            WHERE id = :image_id
              AND deleted_at IS NULL
            """
        )

        try:
            result = await self.db_session.execute(
                stmt,
                {
                    "vector_str": vector_str,
                    "image_id": image_id,
                },
            )
            if result.rowcount == 0:
                raise ValueError(f"Image not found or deleted: {image_id}")
            await self.db_session.commit()
        except Exception:
            await self.db_session.rollback()
            raise

    async def search_hybrid(
        self,
        vector: list[float],
        top_k: int,
        where_clause: str,
        where_params: Dict[str, Any],
    ) -> list[dict]:
        query_vector_str = self._serialize_vector(vector)

        base_sql = """
            SELECT
                id::text AS image_id,
                user_id,
                album_id,
                minio_object_name,
                minio_bucket,
                privacy_level,
                tags,
                created_at,
                index_status,
                (embedding <=> CAST(:query_vector_str AS vector)) AS distance
            FROM images
            WHERE deleted_at IS NULL
              AND embedding IS NOT NULL
              {where_sql}
            ORDER BY distance ASC
            LIMIT :top_k
        """

        where_sql = f" AND ({where_clause})" if where_clause else ""
        stmt = text(base_sql.format(where_sql=where_sql))

        params: Dict[str, Any] = {
            "query_vector_str": query_vector_str,
            "top_k": top_k,
        }
        params.update(where_params)

        result = await self.db_session.execute(stmt, params)
        rows = result.mappings().all()
        return [dict(r) for r in rows]


__all__ = ["StorageVectorAdapter"]