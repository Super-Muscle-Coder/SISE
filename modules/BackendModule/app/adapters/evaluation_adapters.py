"""
Evaluation Service Adapters
=============================
Data access layer for evaluation runs, results, and metrics persistence.

Responsibilities:
- CRUD operations for evaluation runs
- Store and retrieve evaluation results
- Calculate and cache aggregated metrics
"""

import json
import sqlite3
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional, Tuple

from app.entities.evaluation_entities import (
    EvaluationStatus,
    EvaluationMetrics,
    EvaluationResult,
)


class EvaluationAdapter:
    """
    Adapter for persisting and retrieving evaluation data.
    Uses SQLite for simplicity; can be replaced with PostgreSQL adapter later.
    """

    def __init__(self, db_path: str = "./data/evaluation.db"):
        """Initialize SQLite connection and create tables if needed."""
        self.db_path = db_path
        self._init_db()

    def _init_db(self) -> None:
        """Create evaluation tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # evaluation_runs table: tracks evaluation job metadata
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_runs (
                eval_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                query_count INTEGER DEFAULT 0,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                seed INTEGER,
                limit_images INTEGER,
                created_by INTEGER
            )
        """)

        # evaluation_metrics table: stores computed metrics for each run
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_metrics (
                eval_id TEXT PRIMARY KEY,
                mrr REAL NOT NULL,
                hit_rate REAL NOT NULL,
                precision REAL NOT NULL,
                recall REAL NOT NULL,
                computed_at TEXT NOT NULL,
                FOREIGN KEY (eval_id) REFERENCES evaluation_runs(eval_id) ON DELETE CASCADE
            )
        """)

        # evaluation_queries table: individual query results (for debugging/audit)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                eval_id TEXT NOT NULL,
                query_index INTEGER NOT NULL,
                query_type TEXT,  -- 'image' or 'text'
                is_relevant_found INTEGER NOT NULL,  -- 1 or 0
                first_relevant_rank INTEGER,  -- rank where first relevant result was found (or NULL)
                FOREIGN KEY (eval_id) REFERENCES evaluation_runs(eval_id) ON DELETE CASCADE
            )
        """)

        conn.commit()
        conn.close()

    def create_evaluation_run(
        self,
        eval_id: UUID,
        limit_images: int,
        seed: Optional[int],
        created_by: Optional[int] = None,
    ) -> EvaluationResult:
        """
        Create a new evaluation run record.

        Args:
            eval_id: Unique evaluation ID
            limit_images: Number of images to evaluate
            seed: Random seed for reproducibility
            created_by: User ID (optional)

        Returns:
            EvaluationResult with initial state
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
            INSERT INTO evaluation_runs (eval_id, status, started_at, seed, limit_images, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(eval_id), EvaluationStatus.RUNNING.value, now, seed, limit_images, created_by))

        conn.commit()
        conn.close()

        return EvaluationResult(
            eval_id=eval_id,
            status=EvaluationStatus.RUNNING,
            metrics=EvaluationMetrics(mrr=0.0, hit_rate=0.0, precision=0.0, recall=0.0),
            query_count=0,
            completed_at=datetime.fromisoformat(now),
        )

    def get_evaluation_run(self, eval_id: UUID) -> Optional[EvaluationResult]:
        """
        Retrieve an evaluation run by ID (with metrics if completed).

        Args:
            eval_id: Unique evaluation ID

        Returns:
            EvaluationResult or None if not found
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Fetch run metadata
        cursor.execute("""
            SELECT eval_id, status, query_count, completed_at FROM evaluation_runs WHERE eval_id = ?
        """, (str(eval_id),))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return None

        eval_id_str, status, query_count, completed_at_str = row

        # Fetch metrics if available
        cursor.execute("""
            SELECT mrr, hit_rate, precision, recall FROM evaluation_metrics WHERE eval_id = ?
        """, (str(eval_id),))
        metrics_row = cursor.fetchone()

        conn.close()

        if metrics_row:
            mrr, hit_rate, precision, recall = metrics_row
            metrics = EvaluationMetrics(mrr=mrr, hit_rate=hit_rate, precision=precision, recall=recall)
        else:
            metrics = EvaluationMetrics(mrr=0.0, hit_rate=0.0, precision=0.0, recall=0.0)

        return EvaluationResult(
            eval_id=UUID(eval_id_str),
            status=EvaluationStatus(status),
            metrics=metrics,
            query_count=query_count or 0,
            completed_at=datetime.fromisoformat(completed_at_str) if completed_at_str else datetime.now(timezone.utc),
        )

    def update_evaluation_status(
        self,
        eval_id: UUID,
        status: EvaluationStatus,
    ) -> None:
        """
        Update evaluation run status.

        Args:
            eval_id: Unique evaluation ID
            status: New status
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE evaluation_runs SET status = ? WHERE eval_id = ?
        """, (status.value, str(eval_id)))

        conn.commit()
        conn.close()

    def save_evaluation_metrics(
        self,
        eval_id: UUID,
        metrics: EvaluationMetrics,
        query_count: int,
    ) -> None:
        """
        Save computed metrics for a completed evaluation.

        Args:
            eval_id: Unique evaluation ID
            metrics: Computed metrics
            query_count: Number of queries performed
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        now = datetime.now(timezone.utc).isoformat()

        # Update run metadata
        cursor.execute("""
            UPDATE evaluation_runs 
            SET status = ?, query_count = ?, completed_at = ?
            WHERE eval_id = ?
        """, (EvaluationStatus.COMPLETED.value, query_count, now, str(eval_id)))

        # Insert metrics
        cursor.execute("""
            INSERT OR REPLACE INTO evaluation_metrics (eval_id, mrr, hit_rate, precision, recall, computed_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(eval_id), metrics.mrr, metrics.hit_rate, metrics.precision, metrics.recall, now))

        conn.commit()
        conn.close()

    def record_query_result(
        self,
        eval_id: UUID,
        query_index: int,
        query_type: str,  # "image" or "text"
        is_relevant_found: bool,
        first_relevant_rank: Optional[int] = None,
    ) -> None:
        """
        Record a single evaluation query result (for audit trail).

        Args:
            eval_id: Unique evaluation ID
            query_index: 0-based query index
            query_type: "image" or "text"
            is_relevant_found: Whether at least one relevant result was found
            first_relevant_rank: Rank of first relevant result (1-indexed, or None)
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO evaluation_queries (eval_id, query_index, query_type, is_relevant_found, first_relevant_rank)
            VALUES (?, ?, ?, ?, ?)
        """, (str(eval_id), query_index, query_type, 1 if is_relevant_found else 0, first_relevant_rank))

        conn.commit()
        conn.close()

    def get_aggregated_metrics(self) -> Optional[EvaluationMetrics]:
        """
        Get aggregated metrics across all completed evaluation runs.
        Computes average of all runs' metrics.

        Returns:
            EvaluationMetrics with aggregated values, or None if no completed runs
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Join runs and metrics, filter for completed runs
        cursor.execute("""
            SELECT AVG(m.mrr), AVG(m.hit_rate), AVG(m.precision), AVG(m.recall)
            FROM evaluation_metrics m
            INNER JOIN evaluation_runs r ON m.eval_id = r.eval_id
            WHERE r.status = ?
        """, (EvaluationStatus.COMPLETED.value,))

        row = cursor.fetchone()
        conn.close()

        if not row or row[0] is None:
            return None

        mrr, hit_rate, precision, recall = row
        return EvaluationMetrics(
            mrr=float(mrr) if mrr is not None else 0.0,
            hit_rate=float(hit_rate) if hit_rate is not None else 0.0,
            precision=float(precision) if precision is not None else 0.0,
            recall=float(recall) if recall is not None else 0.0,
        )

    def mark_failed(
        self,
        eval_id: UUID,
        error_message: str,
    ) -> None:
        """
        Mark an evaluation run as failed.

        Args:
            eval_id: Unique evaluation ID
            error_message: Error details
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
            UPDATE evaluation_runs 
            SET status = ?, completed_at = ?
            WHERE eval_id = ?
        """, (EvaluationStatus.FAILED.value, now, str(eval_id)))

        conn.commit()
        conn.close()


__all__ = ["EvaluationAdapter"]
