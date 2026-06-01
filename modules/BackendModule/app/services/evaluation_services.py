"""
Evaluation Service
===================
Business logic for running evaluations, computing metrics, and managing evaluation lifecycle.

Responsibilities:
- Trigger evaluation jobs
- Compute MRR, HitRate, Precision, Recall
- Persist results
- Provide aggregated metrics
"""

import asyncio
import random
from uuid import UUID, uuid4
from typing import Optional, List, Tuple
from datetime import datetime

from app.adapters.evaluation_adapters import EvaluationAdapter
from app.entities.evaluation_entities import (
    EvaluationStatus,
    EvaluationMetrics,
    EvaluationResult,
    EvaluationRunResponse,
)


class EvaluationService:
    """
    Service for running and managing evaluation jobs.
    Computes metrics like MRR, HitRate, Precision, and Recall.
    """

    def __init__(
        self,
        adapter: EvaluationAdapter,
        eval_max_images: int = 1000,
        eval_top_k: int = 10,
    ):
        """
        Initialize the evaluation service.

        Args:
            adapter: EvaluationAdapter for persistence
            eval_max_images: Maximum number of images to evaluate
            eval_top_k: Top-K results to consider for evaluation metrics
        """
        self.adapter = adapter
        self.eval_max_images = eval_max_images
        self.eval_top_k = eval_top_k

    async def trigger_evaluation(
        self,
        limit: Optional[int] = None,
        seed: Optional[int] = None,
        created_by: Optional[int] = None,
    ) -> EvaluationRunResponse:
        """
        Trigger a new evaluation run (async).

        This is a placeholder implementation that:
        1. Creates an evaluation run record
        2. Returns immediately with eval_id (job runs in background)
        3. Actual evaluation would be queued to Celery worker

        Args:
            limit: Max number of images to evaluate (default: eval_max_images)
            seed: Random seed for reproducibility
            created_by: User ID (optional)

        Returns:
            EvaluationRunResponse with eval_id and status
        """
        eval_id = uuid4()
        limit = limit or self.eval_max_images
        limit = min(limit, self.eval_max_images)

        # Create run record
        self.adapter.create_evaluation_run(
            eval_id=eval_id,
            limit_images=limit,
            seed=seed,
            created_by=created_by,
        )

        # TODO: Queue to Celery worker for async execution
        # For now, this just accepts the request

        return EvaluationRunResponse(
            eval_id=eval_id,
            status=EvaluationStatus.RUNNING,
        )

    def get_evaluation_result(self, eval_id: UUID) -> Optional[EvaluationResult]:
        """
        Retrieve a completed evaluation result.

        Args:
            eval_id: Unique evaluation ID

        Returns:
            EvaluationResult if found, None otherwise
        """
        return self.adapter.get_evaluation_run(eval_id)

    def get_aggregated_metrics(self) -> Optional[EvaluationMetrics]:
        """
        Get aggregated metrics across all completed evaluations.

        Returns:
            EvaluationMetrics with aggregated values, or None if no completed runs
        """
        return self.adapter.get_aggregated_metrics()

    # ==================================================================================
    # INTERNAL: Metric Computation Functions (used by Celery worker or batch jobs)
    # ==================================================================================

    def compute_mrr(self, reciprocal_ranks: List[float]) -> float:
        """
        Compute Mean Reciprocal Rank (MRR).

        MRR = (1/Q) * Σ(1 / rank_of_first_relevant_result)

        Args:
            reciprocal_ranks: List of 1/rank for each query

        Returns:
            MRR score (0.0 to 1.0)
        """
        if not reciprocal_ranks:
            return 0.0
        return sum(reciprocal_ranks) / len(reciprocal_ranks)

    def compute_hit_rate(self, hits: List[bool]) -> float:
        """
        Compute Hit Rate.

        HitRate = (number of queries with at least 1 relevant result) / total queries

        Args:
            hits: List of booleans (True if at least 1 relevant result found)

        Returns:
            Hit rate (0.0 to 1.0)
        """
        if not hits:
            return 0.0
        return sum(hits) / len(hits)

    def compute_precision_at_k(
        self,
        relevant_per_query: List[int],
        top_k: int,
    ) -> float:
        """
        Compute Precision@K.

        Precision@K = (sum of relevant results in top K for all queries) / (Q * K)

        Args:
            relevant_per_query: List of counts of relevant results in top K for each query
            top_k: K value (usually 10)

        Returns:
            Precision@K score (0.0 to 1.0)
        """
        if not relevant_per_query:
            return 0.0
        total_relevant = sum(relevant_per_query)
        total_results = len(relevant_per_query) * top_k
        if total_results == 0:
            return 0.0
        return total_relevant / total_results

    def compute_recall(
        self,
        total_relevant_found: int,
        total_relevant_in_corpus: int,
    ) -> float:
        """
        Compute Recall.

        Recall = (total relevant results found) / (total relevant results in corpus)

        Args:
            total_relevant_found: Number of relevant results found across all queries
            total_relevant_in_corpus: Total number of relevant results available

        Returns:
            Recall score (0.0 to 1.0)
        """
        if total_relevant_in_corpus == 0:
            return 0.0
        return total_relevant_found / total_relevant_in_corpus

    def compute_metrics_from_queries(
        self,
        query_results: List[dict],
    ) -> Tuple[EvaluationMetrics, int]:
        """
        Compute all metrics from query results.

        Each query_result should have:
        - first_relevant_rank (int or None): rank where first relevant result appears
        - relevant_count (int): number of relevant results in top-K
        - total_relevant_in_corpus (int): total relevant items for this query

        Args:
            query_results: List of query result dictionaries

        Returns:
            Tuple of (EvaluationMetrics, total_query_count)
        """
        if not query_results:
            return (
                EvaluationMetrics(mrr=0.0, hit_rate=0.0, precision=0.0, recall=0.0),
                0,
            )

        reciprocal_ranks = []
        hits = []
        relevant_per_query = []
        total_relevant_found = 0
        total_relevant_corpus = 0

        for qr in query_results:
            first_rank = qr.get("first_relevant_rank")
            relevant_count = qr.get("relevant_count", 0)
            total_relevant_in_corpus = qr.get("total_relevant_in_corpus", 0)

            # MRR: 1/rank if relevant found, else 0
            if first_rank and first_rank > 0:
                reciprocal_ranks.append(1.0 / first_rank)
                hits.append(True)
            else:
                reciprocal_ranks.append(0.0)
                hits.append(False)

            # Precision@K
            relevant_per_query.append(relevant_count)

            # Recall
            total_relevant_found += relevant_count
            total_relevant_corpus += total_relevant_in_corpus

        mrr = self.compute_mrr(reciprocal_ranks)
        hit_rate = self.compute_hit_rate(hits)
        precision = self.compute_precision_at_k(relevant_per_query, self.eval_top_k)
        recall = self.compute_recall(total_relevant_found, total_relevant_corpus)

        metrics = EvaluationMetrics(
            mrr=round(mrr, 4),
            hit_rate=round(hit_rate, 4),
            precision=round(precision, 4),
            recall=round(recall, 4),
        )

        return metrics, len(query_results)

    def record_query_for_audit(
        self,
        eval_id: UUID,
        query_index: int,
        query_type: str,
        is_relevant_found: bool,
        first_relevant_rank: Optional[int],
    ) -> None:
        """
        Record individual query result for audit trail.

        Args:
            eval_id: Unique evaluation ID
            query_index: 0-based query index
            query_type: "image" or "text"
            is_relevant_found: Whether at least 1 relevant result found
            first_relevant_rank: Rank of first relevant result (1-indexed)
        """
        self.adapter.record_query_result(
            eval_id=eval_id,
            query_index=query_index,
            query_type=query_type,
            is_relevant_found=is_relevant_found,
            first_relevant_rank=first_relevant_rank,
        )


__all__ = ["EvaluationService"]
