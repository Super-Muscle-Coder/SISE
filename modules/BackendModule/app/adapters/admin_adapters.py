"""
Admin Workflow Adapters
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.upload_adapters import MinIOAdapter

logger = logging.getLogger(__name__)


class AdminAdapter:
    def __init__(
        self,
        db_session: AsyncSession,
        minio_adapter: MinIOAdapter,
        ai_service_url: str,
        vector_service_base_url: str,
        http_timeout_sec: int = 60,
    ):
        self.db_session = db_session
        self.minio_adapter = minio_adapter
        self.ai_service_url = ai_service_url.rstrip("/")
        self.vector_service_base_url = vector_service_base_url.rstrip("/")
        self.http_timeout_sec = http_timeout_sec

    async def fetch_images_for_reindex(
        self,
        batch_size: int,
        resume_from: Optional[str],
    ) -> list[dict[str, Any]]:
        stmt = text(
            """
            SELECT
                id AS image_id,
                minio_bucket,
                minio_object_name
            FROM images
            WHERE (:resume_from IS NULL OR id > :resume_from::uuid)
              AND deleted_at IS NULL
            ORDER BY id
            LIMIT :batch_size
            """
        )
        result = await self.db_session.execute(
            stmt,
            {"resume_from": resume_from, "batch_size": batch_size},
        )
        rows = result.mappings().all()
        return [
            {
                "image_id": str(row["image_id"]),
                "minio_bucket": row["minio_bucket"],
                "minio_object_name": row["minio_object_name"],
            }
            for row in rows
        ]

    async def fetch_image_bytes(self, bucket_name: str, object_name: str) -> bytes:
        response = self.minio_adapter.client.get_object(
            bucket_name=bucket_name,
            object_name=object_name,
        )
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    async def request_batch_embeddings(
        self,
        images: list[dict[str, Any]],
        bearer_token: str,
    ) -> list[dict[str, Any]]:
        if not images:
            return []

        files_payload: list[tuple[str, tuple[str, bytes, str]]] = []
        for item in images:
            data = await self.fetch_image_bytes(
                bucket_name=item["minio_bucket"],
                object_name=item["minio_object_name"],
            )
            filename = f'{item["image_id"]}.bin'
            files_payload.append(("files", (filename, data, "application/octet-stream")))

        url = f"{self.ai_service_url}/inference/embed/batch"
        headers = {"Authorization": f"Bearer {bearer_token}"}

        async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
            resp = await client.post(url, files=files_payload, headers=headers)

        if resp.status_code >= 400:
            raise RuntimeError(f"Batch embedding request failed: {resp.status_code}")

        payload = resp.json()
        items_raw = payload.get("vectors", [])
        successful_count = int(payload.get("successful_count", 0))
        failed_count = int(payload.get("failed_count", 0))

        logger.info(
            "Batch embedding done: total=%s success=%s failed=%s items_len=%s",
            len(images), successful_count, failed_count,
            len(items_raw) if isinstance(items_raw, list) else -1,
        )

        if not isinstance(items_raw, list):
            raise RuntimeError("Invalid batch embedding response: vectors must be an array")

        aligned: list[dict[str, Any]] = []
        for raw_item in items_raw:
            if not isinstance(raw_item, dict):
                continue
            idx = raw_item.get("index")
            if not isinstance(idx, int) or idx < 0 or idx >= len(images):
                logger.warning("Batch embedding response has out-of-range index: %s", idx)
                continue
            vector = raw_item.get("vector") if raw_item.get("success") else None
            aligned.append(
                {
                    "image_id": images[idx]["image_id"],
                    "vector": vector,
                }
            )

        return aligned

    async def call_vector_index(
        self,
        image_id: str,
        vector: list[float],
        bearer_token: str,
    ) -> bool:
        url = f"{self.vector_service_base_url}/vector/index"
        headers = {"Authorization": f"Bearer {bearer_token}"}
        payload = {"image_id": image_id, "vector": vector}

        async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
            resp = await client.post(url, json=payload, headers=headers)

        return resp.status_code == 201

    async def update_index_status(self, image_id: str, status_value: str) -> None:
        stmt = text(
            """
            UPDATE images
            SET index_status = :status_value, updated_at = CURRENT_TIMESTAMP
            WHERE id = :image_id::uuid
            """
        )
        try:
            await self.db_session.execute(
                stmt,
                {"image_id": image_id, "status_value": status_value},
            )
            await self.db_session.commit()
        except Exception:
            await self.db_session.rollback()
            raise


__all__ = ["AdminAdapter"]