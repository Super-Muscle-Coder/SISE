"""
Indexing workflow adapters.
"""
from __future__ import annotations

import json
import mimetypes
from typing import Any

import httpx
from minio.error import S3Error
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..adapters.upload_adapters import MinIOAdapter
from ..entities.indexing_entities import (
    EmbeddingResult,
    ImageIndexSource,
    PermanentIndexingError,
    TransientIndexingError,
)


class IndexingAdapter:
    def __init__(
        self,
        db_session: AsyncSession,
        minio_adapter: MinIOAdapter,
        ai_service_url: str,
        vector_index_url: str,
        http_timeout_sec: float = 30.0,
    ):
        self.db_session = db_session
        self.minio_adapter = minio_adapter
        self.ai_service_url = ai_service_url.rstrip("/")
        self.vector_index_url = vector_index_url.rstrip("/")
        self.http_timeout_sec = http_timeout_sec

    async def get_image_source(self, image_id: str) -> ImageIndexSource:
        stmt = text(
            """
            SELECT
                i.id::text AS image_id,
                i.user_id,
                u.username,
                i.minio_object_name,
                i.minio_bucket
            FROM images i
            JOIN users u ON u.id = i.user_id
            WHERE i.id = :image_id
              AND i.deleted_at IS NULL
            LIMIT 1
            """
        )
        result = await self.db_session.execute(stmt, {"image_id": image_id})
        row = result.mappings().first()
        if row is None:
            raise PermanentIndexingError(f"Image not found or deleted: {image_id}")
        return ImageIndexSource(**dict(row))

    async def fetch_image_bytes(self, source: ImageIndexSource) -> bytes:
        try:
            response = self.minio_adapter.client.get_object(
                bucket_name=source.minio_bucket,
                object_name=source.minio_object_name,
            )
            try:
                data = response.read()
                if not data:
                    raise PermanentIndexingError(
                        f"Empty object content for image_id={source.image_id}"
                    )
                return data
            finally:
                response.close()
                response.release_conn()
        except PermanentIndexingError:
            raise
        except S3Error as exc:
            raise TransientIndexingError(f"MinIO read failed: {exc}") from exc
        except Exception as exc:
            raise TransientIndexingError(f"Unexpected MinIO read error: {exc}") from exc

    async def request_embedding(
        self,
        image_bytes: bytes,
        filename: str,
        bearer_token: str,
    ) -> EmbeddingResult:
        # Suy ra content-type thật từ đuôi file (ví dụ .jpg -> image/jpeg,
        # .png -> image/png) thay vì hardcode "application/octet-stream" —
        # AIModule validate chặt content-type của phần multipart và từ
        # chối "application/octet-stream" với 400 ERR_INVALID_CONTENT_TYPE.
        # mimetypes.guess_type trả về None nếu không đoán được -> fallback
        # về "image/jpeg" (định dạng phổ biến nhất trong pipeline upload).
        guessed_type, _ = mimetypes.guess_type(filename)
        content_type = guessed_type or "image/jpeg"

        url = f"{self.ai_service_url}/inference/embed/image"
        files = {
            "file": (filename, image_bytes, content_type),
        }
        headers = {"Authorization": f"Bearer {bearer_token}"}
        try:
            async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
                resp = await client.post(url, files=files, headers=headers)
        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as exc:
            raise TransientIndexingError(f"AI service transient error: {exc}") from exc
        except Exception as exc:
            raise TransientIndexingError(f"AI service unexpected transport error: {exc}") from exc

        if resp.status_code >= 500:
            raise TransientIndexingError(f"AI service 5xx: {resp.status_code}")

        if resp.status_code in (401, 403):
            raise PermanentIndexingError(f"AI service auth denied: {resp.status_code}")

        if resp.status_code >= 400:
            try:
                payload = resp.json()
                message = payload.get("message") or payload.get("detail") or resp.text
            except Exception:
                message = resp.text
            raise PermanentIndexingError(f"AI service bad request: {message}")

        try:
            data: dict[str, Any] = resp.json()
            # AIModule thực tế trả "vector_dimension" (không phải "dim" như
            # openapi.yaml VectorEmbeddingResponse ghi), và không có field
            # "model" — xác nhận qua gọi trực tiếp AI Service thật (response
            # {"success", "vector", "vector_dimension", "processing_time_ms"}).
            # Đọc đúng field thật thay vì field theo hợp đồng cũ — hợp đồng cần
            # cập nhật lại sau cho khớp thực tế (quyết định của Project Owner).
            return EmbeddingResult(
                vector=data["vector"],
                dim=int(data["vector_dimension"]),
                model=str(data.get("model", "")),
            )
        except Exception as exc:
            raise PermanentIndexingError(f"Invalid AI response schema: {exc}") from exc

    async def call_vector_index(
        self,
        image_id: str,
        vector: list[float],
        bearer_token: str,
    ) -> None:
        url = f"{self.vector_index_url}/vector/index"
        headers = {"Authorization": f"Bearer {bearer_token}"}
        payload = {"image_id": image_id, "vector": vector}

        try:
            async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
                resp = await client.post(url, json=payload, headers=headers)
        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as exc:
            raise TransientIndexingError(f"/vector/index transient error: {exc}") from exc
        except Exception as exc:
            raise TransientIndexingError(f"/vector/index transport error: {exc}") from exc

        if resp.status_code == 201:
            return

        if resp.status_code >= 500:
            raise TransientIndexingError(f"/vector/index 5xx: {resp.status_code}")

        if resp.status_code in (401, 403):
            raise PermanentIndexingError(f"/vector/index auth denied: {resp.status_code}")

        try:
            data = resp.json()
            code = data.get("code", "BAD_REQUEST")
            msg = data.get("message", resp.text)
        except Exception:
            code = "BAD_REQUEST"
            msg = resp.text

        if resp.status_code == 400 and code == "ERR_VECTOR_DIM_MISMATCH":
            raise PermanentIndexingError(f"/vector/index dim mismatch: {msg}")

        raise PermanentIndexingError(f"/vector/index failed [{resp.status_code}]: {msg}")

    async def update_index_status(self, image_id: str, status: str) -> None:
        if status not in {"ready", "failed", "pending"}:
            raise ValueError(f"Invalid index status: {status}")

        stmt = text(
            """
            UPDATE images
            SET index_status = :status
            WHERE id = :image_id
              AND deleted_at IS NULL
            """
        )

        try:
            result = await self.db_session.execute(
                stmt, {"status": status, "image_id": image_id}
            )
            if result.rowcount == 0:
                raise PermanentIndexingError(
                    f"Cannot update index_status, image not found: {image_id}"
                )
            await self.db_session.commit()
        except PermanentIndexingError:
            await self.db_session.rollback()
            raise
        except Exception as exc:
            await self.db_session.rollback()
            raise TransientIndexingError(f"Failed to update index_status: {exc}") from exc


__all__ = ["IndexingAdapter"]