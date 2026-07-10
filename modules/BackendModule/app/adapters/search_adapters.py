"""
Search workflow adapters.
"""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.search_entities import MetricType, SearchResponse


class AIServiceSearchAdapter:
    def __init__(self, ai_service_base_url: str, timeout_sec: float = 30.0):
        self.ai_service_base_url = ai_service_base_url.rstrip("/")
        self.timeout_sec = timeout_sec

    async def embed_image(self, file_bytes: bytes, filename: str, bearer_token: str) -> list[float]:
        url = f"{self.ai_service_base_url}/inference/embed/image"
        headers = {"Authorization": f"Bearer {bearer_token}"}
        files = {"file": (filename, file_bytes, "application/octet-stream")}

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                resp = await client.post(url, files=files, headers=headers)
        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as exc:
            raise RuntimeError(f"AI service transient error (image embedding): {exc}") from exc

        if resp.status_code in (401, 403):
            raise PermissionError("Unauthorized while calling AI service")

        if resp.status_code >= 500:
            raise RuntimeError(f"AI service 5xx error: {resp.status_code}")

        if resp.status_code >= 400:
            try:
                payload = resp.json()
                message = payload.get("message") or payload.get("detail") or resp.text
            except Exception:
                message = resp.text
            raise ValueError(f"AI service rejected image embedding request: {message}")

        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise ValueError("AI service returned invalid vector payload for image embedding")
        return [float(v) for v in vector]

    async def embed_text(self, query_text: str, bearer_token: str) -> list[float]:
        url = f"{self.ai_service_base_url}/inference/embed/text"
        headers = {"Authorization": f"Bearer {bearer_token}"}

        # keep payload explicit and structured, no string interpolation
        payload: dict[str, Any] = {"query_text": query_text}

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                resp = await client.post(url, json=payload, headers=headers)
        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as exc:
            raise RuntimeError(f"AI service transient error (text embedding): {exc}") from exc

        if resp.status_code in (401, 403):
            raise PermissionError("Unauthorized while calling AI service")

        if resp.status_code >= 500:
            raise RuntimeError(f"AI service 5xx error: {resp.status_code}")

        if resp.status_code >= 400:
            try:
                payload = resp.json()
                message = payload.get("message") or payload.get("detail") or resp.text
            except Exception:
                message = resp.text
            raise ValueError(f"AI service rejected text embedding request: {message}")

        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise ValueError("AI service returned invalid vector payload for text embedding")
        return [float(v) for v in vector]


class StorageVectorSearchAdapter:
    def __init__(self, vector_service_base_url: str, timeout_sec: float = 30.0):
        self.vector_service_base_url = vector_service_base_url.rstrip("/")
        self.timeout_sec = timeout_sec

    async def search_hybrid(
        self,
        vector: list[float],
        top_k: int,
        metric: MetricType,
        filter_payload: dict[str, Any],
        bearer_token: str,
    ) -> SearchResponse:
        url = f"{self.vector_service_base_url}/vector/search/hybrid"
        headers = {"Authorization": f"Bearer {bearer_token}"}

        payload: dict[str, Any] = {
            "vector": vector,
            "top_k": top_k,
            "metric": metric.value,
            "filter": filter_payload,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                resp = await client.post(url, json=payload, headers=headers)
        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as exc:
            raise RuntimeError(f"Vector service transient error: {exc}") from exc

        if resp.status_code in (401, 403):
            raise PermissionError("Unauthorized while calling storage vector service")

        if resp.status_code >= 500:
            raise RuntimeError(f"Storage vector service 5xx error: {resp.status_code}")

        if resp.status_code >= 400:
            try:
                payload = resp.json()
                message = payload.get("message") or payload.get("detail") or resp.text
            except Exception:
                message = resp.text
            raise ValueError(f"Storage vector service rejected request: {message}")

        return SearchResponse.model_validate(resp.json())


class FriendsQueryAdapter:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def get_friend_ids(self, current_user_id: int) -> list[int]:
        stmt = text(
            """
            SELECT friend_id
            FROM friends
            WHERE user_id = :user_id
            ORDER BY friend_id
            """
        )
        result = await self.db_session.execute(stmt, {"user_id": current_user_id})
        rows = result.mappings().all()
        return [int(r["friend_id"]) for r in rows]


__all__ = [
    "AIServiceSearchAdapter",
    "StorageVectorSearchAdapter",
    "FriendsQueryAdapter",
]