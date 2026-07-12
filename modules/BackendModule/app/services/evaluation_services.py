"""
Evaluation Workflow Service (Business Logic Layer)
"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Optional, Any

import httpx

from app.adapters.evaluation_adapters import EvaluationAdapter
from app.adapters.upload_adapters import MinIOAdapter

logger = logging.getLogger(__name__)


class EvaluationService:
    def __init__(
        self,
        evaluation_adapter: EvaluationAdapter,
        minio_adapter: MinIOAdapter,
        ai_service_url: str,
        vector_service_base_url: str,
        http_timeout_sec: int = 30,
        eval_max_images: int = 100,
        top_k: int = 10,
    ):
        self.evaluation_adapter = evaluation_adapter
        self.minio_adapter = minio_adapter
        self.ai_service_url = ai_service_url.rstrip("/")
        self.vector_service_base_url = vector_service_base_url.rstrip("/")
        self.http_timeout_sec = http_timeout_sec
        self.eval_max_images = eval_max_images
        self.top_k = top_k

    async def _fetch_image_bytes(self, bucket_name: str, object_name: str) -> bytes:
        response = self.minio_adapter.client.get_object(
            bucket_name=bucket_name,
            object_name=object_name,
        )
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    async def _request_embedding(
        self,
        image_bytes: bytes,
        filename: str,
        bearer_token: str,
    ) -> list[float]:
        url = f"{self.ai_service_url}/inference/embed/image"
        files = {"file": (filename, image_bytes, "application/octet-stream")}
        headers = {"Authorization": f"Bearer {bearer_token}"}
        async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
            resp = await client.post(url, files=files, headers=headers)

        if resp.status_code >= 400:
            raise RuntimeError(f"Embedding request failed ({resp.status_code})")

        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise RuntimeError("Invalid embedding response schema")
        return vector

    async def _search_hybrid(
        self,
        vector: list[float],
        bearer_token: str,
    ) -> list[str]:
        url = f"{self.vector_service_base_url}/vector/search/hybrid"
        payload = {
            "vector": vector,
            "top_k": self.top_k,
            "metric": "COSINE",
            "filter": None,
        }
        headers = {"Authorization": f"Bearer {bearer_token}"}
        async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
            resp = await client.post(url, json=payload, headers=headers)

        if resp.status_code >= 400:
            raise RuntimeError(f"Vector search failed ({resp.status_code})")

        data = resp.json()
        items = data.get("results", [])
        ranked_ids: list[str] = []
        for item in items:
            image_id = item.get("image_id")
            if isinstance(image_id, str):
                ranked_ids.append(image_id)
        return ranked_ids

    # ===== GIỮ NGUYÊN CÔNG THỨC =====
    def compute_mrr(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results:
            return 0.0
        reciprocal_ranks: list[float] = []
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            rr = 0.0
            for idx, candidate_id in enumerate(ranked_ids, start=1):
                if candidate_id in relevant_ids:
                    rr = 1.0 / idx
                    break
            reciprocal_ranks.append(rr)
        return float(sum(reciprocal_ranks) / len(reciprocal_ranks))

    def compute_hit_rate(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results:
            return 0.0
        hits = 0
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            if any(candidate_id in relevant_ids for candidate_id in ranked_ids):
                hits += 1
        return float(hits / len(query_results))

    def compute_precision_at_k(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results or k <= 0:
            return 0.0
        precisions: list[float] = []
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            if not ranked_ids:
                precisions.append(0.0)
                continue
            hit_count = sum(1 for candidate_id in ranked_ids if candidate_id in relevant_ids)
            precisions.append(hit_count / k)
        return float(sum(precisions) / len(precisions))

    def compute_recall(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results:
            return 0.0
        recalls: list[float] = []
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            if not relevant_ids:
                recalls.append(0.0)
                continue
            hit_count = sum(1 for candidate_id in ranked_ids if candidate_id in relevant_ids)
            recalls.append(hit_count / len(relevant_ids))
        return float(sum(recalls) / len(recalls))

    def compute_metrics_from_queries(
        self,
        query_results: list[dict[str, Any]],
        k: int,
    ) -> dict[str, float]:
        return {
            "mrr": self.compute_mrr(query_results, k),
            "hit_rate": self.compute_hit_rate(query_results, k),
            "precision": self.compute_precision_at_k(query_results, k),
            "recall": self.compute_recall(query_results, k),
        }
    # ===== HẾT PHẦN CÔNG THỨC GIỮ NGUYÊN =====

    async def trigger_evaluation(
        self,
        created_by: int,
        bearer_token: str,
        limit: Optional[int] = None,
        seed: Optional[int] = None,
    ) -> dict[str, Any]:
        effective_limit = self.eval_max_images if limit is None else min(limit, self.eval_max_images)
        if effective_limit <= 0:
            effective_limit = 1

        run = await self.evaluation_adapter.create_evaluation_run(
            created_by=created_by,
            limit_images=effective_limit,
            seed=seed,
            status="running",
        )
        eval_id = run["eval_id"]
        processed_queries = 0

        try:
            sources = await self.evaluation_adapter.fetch_ready_images_for_evaluation(
                limit=effective_limit,
                seed=seed,
            )

            query_results: list[dict[str, Any]] = []

            for src in sources:
                image_id = src["image_id"]
                bucket = src["minio_bucket"]
                object_name = src["minio_object_name"]

                image_bytes = await self._fetch_image_bytes(bucket_name=bucket, object_name=object_name)
                vector = await self._request_embedding(
                    image_bytes=image_bytes,
                    filename=f"{image_id}.bin",
                    bearer_token=bearer_token,
                )
                ranked_ids = await self._search_hybrid(
                    vector=vector,
                    bearer_token=bearer_token,
                )

                query_results.append(
                    {
                        "ranked_ids": ranked_ids,
                        "relevant_ids": {image_id},  # self-retrieval relevance
                    }
                )
                processed_queries += 1

            metrics = self.compute_metrics_from_queries(query_results=query_results, k=self.top_k)

            await self.evaluation_adapter.complete_evaluation_run(
                eval_id=eval_id,
                query_count=processed_queries,
                mrr=metrics["mrr"],
                hit_rate=metrics["hit_rate"],
                precision=metrics["precision"],
                recall=metrics["recall"],
            )

            return {
                "eval_id": eval_id,
                "status": "completed",
            }

        except Exception:
            logger.exception("Evaluation run failed: eval_id=%s", eval_id)
            await self.evaluation_adapter.fail_evaluation_run(
                eval_id=eval_id,
                query_count=processed_queries,
            )
            raise

    async def get_evaluation_results(self, eval_id: str) -> Optional[dict[str, Any]]:
        row = await self.evaluation_adapter.get_evaluation_result(eval_id)
        if row is None:
            return None

        return {
            "eval_id": row["eval_id"],
            "status": row["status"],
            "mrr": float(row["mrr"] or 0.0),
            "hit_rate": float(row["hit_rate"] or 0.0),
            "precision": float(row["precision"] or 0.0),
            "recall": float(row["recall"] or 0.0),
            "query_count": int(row["query_count"] or 0),
            "completed_at": row["completed_at"],
        }

    async def get_latest_metrics(self) -> dict[str, float]:
        latest = await self.evaluation_adapter.get_latest_metrics()
        if latest is None:
            return {"mrr": 0.0, "hit_rate": 0.0, "precision": 0.0, "recall": 0.0}
        return latest


__all__ = ["EvaluationService"]