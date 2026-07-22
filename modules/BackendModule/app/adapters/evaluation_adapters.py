"""
Evaluation Workflow Adapters (PostgreSQL Data Access Layer)
"""

from __future__ import annotations

import logging
from typing import Optional, Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class EvaluationAdapter:
    """PostgreSQL adapter for evaluation_runs / evaluation_metrics."""

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def create_evaluation_run(
        self,
        created_by: int,
        limit_images: Optional[int],
        seed: Optional[int],
        status: str = "running",
    ) -> dict[str, Any]:
        stmt = text(
            """
            INSERT INTO evaluation_runs (status, query_count, limit_images, seed, created_by)
            VALUES (:status, 0, :limit_images, :seed, :created_by)
            RETURNING eval_id, status, query_count, limit_images, seed, created_by, started_at, completed_at
            """
        )
        params = {
            "status": status,
            "limit_images": limit_images,
            "seed": seed,
            "created_by": created_by,
        }
        try:
            result = await self.db_session.execute(stmt, params)
            row = result.mappings().first()
            await self.db_session.commit()
            if row is None:
                raise RuntimeError("Failed to create evaluation run")
            return {
                "eval_id": str(row["eval_id"]),
                "status": row["status"],
                "query_count": row["query_count"],
                "limit_images": row["limit_images"],
                "seed": row["seed"],
                "created_by": row["created_by"],
                "started_at": row["started_at"],
                "completed_at": row["completed_at"],
            }
        except Exception:
            await self.db_session.rollback()
            raise

    async def fetch_ready_images_for_evaluation(
        self,
        limit: int,
        seed: Optional[int],
    ) -> list[dict[str, Any]]:
        """
        Lấy N ảnh ngẫu nhiên đã index xong (index_status='ready') để làm
        query mẫu cho benchmark. Trả kèm tags/album_id ngay tại đây (thay
        vì query riêng sau) để ground truth builder dùng luôn cho ảnh mẫu.
        """
        if seed is None:
            stmt = text(
                """
                SELECT
                    id AS image_id,
                    minio_bucket,
                    minio_object_name,
                    album_id,
                    tags
                FROM images
                WHERE index_status = 'ready'
                  AND deleted_at IS NULL
                ORDER BY RANDOM()
                LIMIT :limit
                """
            )
            params = {"limit": limit}
        else:
            # Deterministic pseudo-random order by seed for reproducible runs.
            stmt = text(
                """
                SELECT
                    id AS image_id,
                    minio_bucket,
                    minio_object_name,
                    album_id,
                    tags
                FROM images
                WHERE index_status = 'ready'
                  AND deleted_at IS NULL
                ORDER BY md5(CAST(id AS TEXT) || :seed_text)
                LIMIT :limit
                """
            )
            params = {"limit": limit, "seed_text": str(seed)}

        result = await self.db_session.execute(stmt, params)
        rows = result.mappings().all()
        return [
            {
                "image_id": str(r["image_id"]),
                "minio_bucket": r["minio_bucket"],
                "minio_object_name": r["minio_object_name"],
                "album_id": r["album_id"],
                "tags": r["tags"] if r["tags"] is not None else [],
            }
            for r in rows
        ]

    async def fetch_metadata_for_images(
        self,
        image_ids: list[str],
    ) -> dict[str, dict[str, Any]]:
        """
        Lấy tags/album_id cho MỘT LOẠT ảnh cùng lúc (1 câu SELECT duy
        nhất, tránh N+1 query) — dùng để xây ground truth cho các ảnh
        NẰM TRONG top_k kết quả search (khác ảnh mẫu, vốn đã có sẵn tags/
        album_id từ fetch_ready_images_for_evaluation()).

        Trả về dict {image_id: {"tags": [...], "album_id": ...}} để tra
        cứu O(1) theo image_id khi build ground truth cho từng candidate.
        """
        if not image_ids:
            return {}

        stmt = text(
            """
            SELECT
                id AS image_id,
                album_id,
                tags,
                minio_object_name,
                minio_bucket
            FROM images
            WHERE id = ANY(:image_ids)
              AND deleted_at IS NULL
            """
        )
        result = await self.db_session.execute(stmt, {"image_ids": image_ids})
        rows = result.mappings().all()
        return {
            str(r["image_id"]): {
                "album_id": r["album_id"],
                "tags": r["tags"] if r["tags"] is not None else [],
                "minio_object_name": r["minio_object_name"],
                "minio_bucket": r["minio_bucket"],
            }
            for r in rows
        }

    async def complete_evaluation_run(
        self,
        eval_id: str,
        query_count: int,
        mrr: float,
        hit_rate: float,
        precision: float,
        recall: float,
    ) -> None:
        insert_metrics_stmt = text(
            """
            INSERT INTO evaluation_metrics (eval_id, mrr, hit_rate, precision, recall)
            VALUES (:eval_id, :mrr, :hit_rate, :precision, :recall)
            ON CONFLICT (eval_id)
            DO UPDATE SET
                mrr = EXCLUDED.mrr,
                hit_rate = EXCLUDED.hit_rate,
                precision = EXCLUDED.precision,
                recall = EXCLUDED.recall,
                computed_at = CURRENT_TIMESTAMP
            """
        )
        update_run_stmt = text(
            """
            UPDATE evaluation_runs
            SET status = 'completed',
                query_count = :query_count,
                completed_at = CURRENT_TIMESTAMP
            WHERE eval_id = :eval_id
            """
        )
        try:
            await self.db_session.execute(
                insert_metrics_stmt,
                {
                    "eval_id": eval_id,
                    "mrr": mrr,
                    "hit_rate": hit_rate,
                    "precision": precision,
                    "recall": recall,
                },
            )
            await self.db_session.execute(
                update_run_stmt,
                {"eval_id": eval_id, "query_count": query_count},
            )
            await self.db_session.commit()
        except Exception:
            await self.db_session.rollback()
            raise

    async def fail_evaluation_run(self, eval_id: str, query_count: int) -> None:
        stmt = text(
            """
            UPDATE evaluation_runs
            SET status = 'failed',
                query_count = :query_count,
                completed_at = CURRENT_TIMESTAMP
            WHERE eval_id = :eval_id
            """
        )
        try:
            await self.db_session.execute(stmt, {"eval_id": eval_id, "query_count": query_count})
            await self.db_session.commit()
        except Exception:
            await self.db_session.rollback()
            raise

    async def get_evaluation_result(self, eval_id: str) -> Optional[dict[str, Any]]:
        stmt = text(
            """
            SELECT
                r.eval_id,
                r.status,
                r.query_count,
                r.completed_at,
                m.mrr,
                m.hit_rate,
                m.precision,
                m.recall
            FROM evaluation_runs r
            LEFT JOIN evaluation_metrics m ON m.eval_id = r.eval_id
            WHERE r.eval_id = :eval_id
            """
        )
        result = await self.db_session.execute(stmt, {"eval_id": eval_id})
        row = result.mappings().first()
        if row is None:
            return None
        return {
            "eval_id": str(row["eval_id"]),
            "status": row["status"],
            "query_count": row["query_count"],
            "completed_at": row["completed_at"],
            "mrr": row["mrr"],
            "hit_rate": row["hit_rate"],
            "precision": row["precision"],
            "recall": row["recall"],
        }

    async def get_latest_metrics(self) -> Optional[dict[str, float]]:
        stmt = text(
            """
            SELECT m.mrr, m.hit_rate, m.precision, m.recall
            FROM evaluation_metrics m
            JOIN evaluation_runs r ON r.eval_id = m.eval_id
            WHERE r.status = 'completed'
            ORDER BY r.completed_at DESC NULLS LAST, r.started_at DESC
            LIMIT 1
            """
        )
        result = await self.db_session.execute(stmt)
        row = result.mappings().first()
        if row is None:
            return None
        return {
            "mrr": float(row["mrr"]),
            "hit_rate": float(row["hit_rate"]),
            "precision": float(row["precision"]),
            "recall": float(row["recall"]),
        }


__all__ = ["EvaluationAdapter"]