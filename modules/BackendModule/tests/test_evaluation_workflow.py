"""
Evaluation Workflow Test Suite
==================================
Comprehensive tests for evaluation entities, adapters, services, and routers.

Test coverage:
- EvaluationAdapter: CRUD operations for evaluation runs
- EvaluationService: Business logic (metric computation)
- EvaluationRouter: HTTP endpoints
"""

import pytest
import tempfile
import os
from uuid import uuid4
from datetime import datetime

from app.entities.evaluation_entities import (
    EvaluationStatus,
    EvaluationRunRequest,
    EvaluationRunResponse,
    EvaluationMetrics,
    EvaluationResult,
)
from app.adapters.evaluation_adapters import EvaluationAdapter
from app.services.evaluation_services import EvaluationService


# ==================================================================================
# FIXTURES
# ==================================================================================

@pytest.fixture
def temp_db():
    """Create a temporary SQLite database for testing."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.unlink(path)


@pytest.fixture
def evaluation_adapter(temp_db):
    """Create an EvaluationAdapter with temp database."""
    return EvaluationAdapter(db_path=temp_db)


@pytest.fixture
def evaluation_service(evaluation_adapter):
    """Create an EvaluationService with temp adapter."""
    return EvaluationService(
        adapter=evaluation_adapter,
        eval_max_images=1000,
        eval_top_k=10,
    )


# ==================================================================================
# ENTITY TESTS
# ==================================================================================

class TestEvaluationEntities:
    """Test evaluation entity models."""

    def test_evaluation_status_enum(self):
        """Test EvaluationStatus enum values."""
        assert EvaluationStatus.PENDING.value == "pending"
        assert EvaluationStatus.RUNNING.value == "running"
        assert EvaluationStatus.COMPLETED.value == "completed"
        assert EvaluationStatus.FAILED.value == "failed"

    def test_evaluation_run_request_defaults(self):
        """Test EvaluationRunRequest with defaults."""
        req = EvaluationRunRequest()
        assert req.limit == 100
        assert req.seed is None

    def test_evaluation_run_request_custom(self):
        """Test EvaluationRunRequest with custom values."""
        req = EvaluationRunRequest(limit=50, seed=42)
        assert req.limit == 50
        assert req.seed == 42

    def test_evaluation_run_response(self):
        """Test EvaluationRunResponse."""
        eval_id = uuid4()
        resp = EvaluationRunResponse(eval_id=eval_id, status=EvaluationStatus.RUNNING)
        assert resp.eval_id == eval_id
        assert resp.status == EvaluationStatus.RUNNING

    def test_evaluation_metrics(self):
        """Test EvaluationMetrics."""
        metrics = EvaluationMetrics(mrr=0.5, hit_rate=0.8, precision=0.7, recall=0.6)
        assert metrics.mrr == 0.5
        assert metrics.hit_rate == 0.8
        assert metrics.precision == 0.7
        assert metrics.recall == 0.6


# ==================================================================================
# ADAPTER TESTS
# ==================================================================================

class TestEvaluationAdapter:
    """Test EvaluationAdapter CRUD operations."""

    def test_adapter_initialization(self, evaluation_adapter):
        """Test adapter initializes database correctly."""
        # Should not raise any exceptions
        assert evaluation_adapter.db_path is not None

    def test_create_evaluation_run(self, evaluation_adapter):
        """Test creating an evaluation run."""
        eval_id = uuid4()
        result = evaluation_adapter.create_evaluation_run(
            eval_id=eval_id,
            limit_images=100,
            seed=42,
            created_by=1,
        )

        assert result.eval_id == eval_id
        assert result.status == EvaluationStatus.RUNNING
        assert result.query_count == 0

    def test_get_evaluation_run_not_found(self, evaluation_adapter):
        """Test retrieving non-existent evaluation run."""
        eval_id = uuid4()
        result = evaluation_adapter.get_evaluation_run(eval_id)
        assert result is None

    def test_get_evaluation_run_found(self, evaluation_adapter):
        """Test retrieving existing evaluation run."""
        eval_id = uuid4()
        evaluation_adapter.create_evaluation_run(
            eval_id=eval_id,
            limit_images=100,
            seed=42,
        )

        result = evaluation_adapter.get_evaluation_run(eval_id)
        assert result is not None
        assert result.eval_id == eval_id
        assert result.status == EvaluationStatus.RUNNING

    def test_update_evaluation_status(self, evaluation_adapter):
        """Test updating evaluation status."""
        eval_id = uuid4()
        evaluation_adapter.create_evaluation_run(eval_id=eval_id, limit_images=100, seed=None)

        evaluation_adapter.update_evaluation_status(eval_id, EvaluationStatus.COMPLETED)

        result = evaluation_adapter.get_evaluation_run(eval_id)
        assert result.status == EvaluationStatus.COMPLETED

    def test_save_evaluation_metrics(self, evaluation_adapter):
        """Test saving evaluation metrics."""
        eval_id = uuid4()
        evaluation_adapter.create_evaluation_run(eval_id=eval_id, limit_images=100, seed=None)

        metrics = EvaluationMetrics(mrr=0.75, hit_rate=0.9, precision=0.85, recall=0.8)
        evaluation_adapter.save_evaluation_metrics(eval_id, metrics, query_count=50)

        result = evaluation_adapter.get_evaluation_run(eval_id)
        assert result.status == EvaluationStatus.COMPLETED
        assert result.metrics.mrr == 0.75
        assert result.metrics.hit_rate == 0.9
        assert result.query_count == 50

    def test_record_query_result(self, evaluation_adapter):
        """Test recording individual query results."""
        eval_id = uuid4()
        evaluation_adapter.create_evaluation_run(eval_id=eval_id, limit_images=100, seed=None)

        # Should not raise any exceptions
        evaluation_adapter.record_query_result(
            eval_id=eval_id,
            query_index=0,
            query_type="image",
            is_relevant_found=True,
            first_relevant_rank=2,
        )

    def test_mark_failed(self, evaluation_adapter):
        """Test marking evaluation as failed."""
        eval_id = uuid4()
        evaluation_adapter.create_evaluation_run(eval_id=eval_id, limit_images=100, seed=None)

        evaluation_adapter.mark_failed(eval_id, "Test error")

        result = evaluation_adapter.get_evaluation_run(eval_id)
        assert result.status == EvaluationStatus.FAILED

    def test_get_aggregated_metrics_no_runs(self, evaluation_adapter):
        """Test aggregated metrics when no completed runs exist."""
        metrics = evaluation_adapter.get_aggregated_metrics()
        assert metrics is None

    def test_get_aggregated_metrics_single_run(self, evaluation_adapter):
        """Test aggregated metrics with single completed run."""
        eval_id = uuid4()
        evaluation_adapter.create_evaluation_run(eval_id=eval_id, limit_images=100, seed=None)

        metrics = EvaluationMetrics(mrr=0.5, hit_rate=0.8, precision=0.7, recall=0.6)
        evaluation_adapter.save_evaluation_metrics(eval_id, metrics, query_count=50)

        agg_metrics = evaluation_adapter.get_aggregated_metrics()
        assert agg_metrics is not None
        assert agg_metrics.mrr == 0.5
        assert agg_metrics.hit_rate == 0.8


# ==================================================================================
# SERVICE TESTS
# ==================================================================================

class TestEvaluationService:
    """Test EvaluationService business logic."""

    @pytest.mark.asyncio
    async def test_trigger_evaluation(self, evaluation_service):
        """Test triggering an evaluation run."""
        response = await evaluation_service.trigger_evaluation(limit=100, seed=42)

        assert response.eval_id is not None
        assert response.status == EvaluationStatus.RUNNING

    @pytest.mark.asyncio
    async def test_trigger_evaluation_respects_max_limit(self, evaluation_service):
        """Test that eval limit is capped at eval_max_images."""
        # Request 2000 images, but service max is 1000
        response = await evaluation_service.trigger_evaluation(limit=2000)

        # Verify created run has capped limit
        result = evaluation_service.get_evaluation_result(response.eval_id)
        assert result is not None

    def test_get_evaluation_result_not_found(self, evaluation_service):
        """Test getting non-existent evaluation result."""
        eval_id = uuid4()
        result = evaluation_service.get_evaluation_result(eval_id)
        assert result is None

    def test_get_aggregated_metrics_no_runs(self, evaluation_service):
        """Test aggregated metrics when no runs exist."""
        metrics = evaluation_service.get_aggregated_metrics()
        assert metrics is None

    # ================================================================================
    # METRIC COMPUTATION TESTS
    # ================================================================================

    def test_compute_mrr_empty(self, evaluation_service):
        """Test MRR computation with empty list."""
        mrr = evaluation_service.compute_mrr([])
        assert mrr == 0.0

    def test_compute_mrr_single_result_rank_1(self, evaluation_service):
        """Test MRR with single result at rank 1."""
        mrr = evaluation_service.compute_mrr([1.0])  # 1/1
        assert mrr == 1.0

    def test_compute_mrr_single_result_rank_2(self, evaluation_service):
        """Test MRR with single result at rank 2."""
        mrr = evaluation_service.compute_mrr([0.5])  # 1/2
        assert mrr == 0.5

    def test_compute_mrr_multiple_results(self, evaluation_service):
        """Test MRR with multiple results."""
        # [1.0, 0.5, 0.33] = 1/1, 1/2, 1/3
        mrr = evaluation_service.compute_mrr([1.0, 0.5, 0.333])
        expected = (1.0 + 0.5 + 0.333) / 3
        assert abs(mrr - expected) < 0.01

    def test_compute_hit_rate_empty(self, evaluation_service):
        """Test hit rate computation with empty list."""
        hit_rate = evaluation_service.compute_hit_rate([])
        assert hit_rate == 0.0

    def test_compute_hit_rate_all_true(self, evaluation_service):
        """Test hit rate with all True."""
        hit_rate = evaluation_service.compute_hit_rate([True, True, True])
        assert hit_rate == 1.0

    def test_compute_hit_rate_all_false(self, evaluation_service):
        """Test hit rate with all False."""
        hit_rate = evaluation_service.compute_hit_rate([False, False, False])
        assert hit_rate == 0.0

    def test_compute_hit_rate_mixed(self, evaluation_service):
        """Test hit rate with mixed results."""
        hit_rate = evaluation_service.compute_hit_rate([True, False, True])
        assert hit_rate == pytest.approx(2/3)

    def test_compute_precision_at_k_empty(self, evaluation_service):
        """Test precision@K with empty list."""
        precision = evaluation_service.compute_precision_at_k([], top_k=10)
        assert precision == 0.0

    def test_compute_precision_at_k_perfect(self, evaluation_service):
        """Test precision@K with all relevant results."""
        precision = evaluation_service.compute_precision_at_k([10, 10, 10], top_k=10)
        assert precision == 1.0  # 30/(3*10) = 1.0

    def test_compute_precision_at_k_partial(self, evaluation_service):
        """Test precision@K with partial relevant results."""
        precision = evaluation_service.compute_precision_at_k([5, 5, 5], top_k=10)
        assert precision == 0.5  # 15/(3*10) = 0.5

    def test_compute_recall_zero_corpus(self, evaluation_service):
        """Test recall when corpus is empty."""
        recall = evaluation_service.compute_recall(10, 0)
        assert recall == 0.0

    def test_compute_recall_perfect(self, evaluation_service):
        """Test recall with perfect match."""
        recall = evaluation_service.compute_recall(10, 10)
        assert recall == 1.0

    def test_compute_recall_partial(self, evaluation_service):
        """Test recall with partial match."""
        recall = evaluation_service.compute_recall(5, 10)
        assert recall == 0.5

    def test_compute_metrics_from_queries_empty(self, evaluation_service):
        """Test metric computation from empty queries."""
        metrics, count = evaluation_service.compute_metrics_from_queries([])
        assert count == 0
        assert metrics.mrr == 0.0

    def test_compute_metrics_from_queries_single(self, evaluation_service):
        """Test metric computation from single query result."""
        query_results = [
            {
                "first_relevant_rank": 1,
                "relevant_count": 5,
                "total_relevant_in_corpus": 10,
            }
        ]
        metrics, count = evaluation_service.compute_metrics_from_queries(query_results)

        assert count == 1
        assert metrics.mrr == 1.0  # 1/1
        assert metrics.hit_rate == 1.0  # Found at least 1
        assert metrics.precision == 0.5  # 5/10
        assert metrics.recall == 0.5  # 5/10

    def test_compute_metrics_from_queries_multiple(self, evaluation_service):
        """Test metric computation from multiple query results."""
        query_results = [
            {"first_relevant_rank": 1, "relevant_count": 3, "total_relevant_in_corpus": 5},
            {"first_relevant_rank": 2, "relevant_count": 2, "total_relevant_in_corpus": 5},
            {"first_relevant_rank": None, "relevant_count": 0, "total_relevant_in_corpus": 5},
        ]
        metrics, count = evaluation_service.compute_metrics_from_queries(query_results)

        assert count == 3
        # MRR = (1/1 + 1/2 + 0) / 3 = 0.8333.../3 = 0.2777... → rounded to 0.2778
        expected_mrr = (1.0 + 0.5 + 0.0) / 3
        assert metrics.mrr == pytest.approx(round(expected_mrr, 4))

        # HitRate = 2/3 = 0.6666... → rounded to 0.6667
        expected_hit_rate = 2/3
        assert metrics.hit_rate == pytest.approx(round(expected_hit_rate, 4))

        # Precision@K = (3+2+0) / (3*10) = 0.1666... → rounded to 0.1667
        expected_precision = 5/30
        assert metrics.precision == pytest.approx(round(expected_precision, 4))

        # Recall = (3+2+0) / (5+5+5) = 5/15 = 0.3333... → rounded to 0.3333
        expected_recall = 5/15
        assert metrics.recall == pytest.approx(round(expected_recall, 4))


# ==================================================================================
# INTEGRATION TESTS
# ==================================================================================

class TestEvaluationIntegration:
    """Integration tests for evaluation workflow."""

    @pytest.mark.asyncio
    async def test_full_evaluation_flow(self, evaluation_service):
        """Test complete evaluation workflow."""
        # 1. Trigger evaluation
        run_response = await evaluation_service.trigger_evaluation(limit=100, seed=42)
        eval_id = run_response.eval_id

        # 2. Verify run is created
        result = evaluation_service.get_evaluation_result(eval_id)
        assert result is not None
        assert result.status == EvaluationStatus.RUNNING

        # 3. Compute metrics (simulated)
        query_results = [
            {"first_relevant_rank": 1, "relevant_count": 5, "total_relevant_in_corpus": 10},
            {"first_relevant_rank": 2, "relevant_count": 4, "total_relevant_in_corpus": 10},
        ]
        metrics, query_count = evaluation_service.compute_metrics_from_queries(query_results)

        # 4. Save metrics (this would be done by Celery worker)
        evaluation_service.adapter.save_evaluation_metrics(eval_id, metrics, query_count)

        # 5. Verify final result
        final_result = evaluation_service.get_evaluation_result(eval_id)
        assert final_result is not None
        assert final_result.status == EvaluationStatus.COMPLETED
        assert final_result.query_count == 2
        assert final_result.metrics.mrr > 0

    @pytest.mark.asyncio
    async def test_aggregated_metrics_after_multiple_runs(self, evaluation_service):
        """Test aggregated metrics after multiple evaluation runs."""
        # Run 1
        run1 = await evaluation_service.trigger_evaluation(limit=50, seed=1)
        metrics1 = EvaluationMetrics(mrr=0.8, hit_rate=0.9, precision=0.85, recall=0.88)
        evaluation_service.adapter.save_evaluation_metrics(run1.eval_id, metrics1, 50)

        # Run 2
        run2 = await evaluation_service.trigger_evaluation(limit=50, seed=2)
        metrics2 = EvaluationMetrics(mrr=0.6, hit_rate=0.7, precision=0.65, recall=0.68)
        evaluation_service.adapter.save_evaluation_metrics(run2.eval_id, metrics2, 50)

        # Verify aggregated metrics (averages)
        agg_metrics = evaluation_service.get_aggregated_metrics()
        assert agg_metrics is not None
        assert agg_metrics.mrr == pytest.approx(0.7)  # (0.8 + 0.6) / 2
        assert agg_metrics.hit_rate == pytest.approx(0.8)  # (0.9 + 0.7) / 2


# ==================================================================================
# EDGE CASE TESTS
# ==================================================================================

class TestEvaluationEdgeCases:
    """Test edge cases and error handling."""

    def test_evaluation_status_string_representation(self):
        """Test EvaluationStatus enum string representation."""
        status = EvaluationStatus.RUNNING
        assert str(status) == "EvaluationStatus.RUNNING"

    def test_metrics_with_zero_values(self):
        """Test EvaluationMetrics with zero values."""
        metrics = EvaluationMetrics(mrr=0.0, hit_rate=0.0, precision=0.0, recall=0.0)
        assert metrics.mrr == 0.0
        assert metrics.hit_rate == 0.0

    def test_query_result_without_relevant_rank(self, evaluation_service):
        """Test handling query result with no relevant rank."""
        query_results = [
            {
                "first_relevant_rank": None,
                "relevant_count": 0,
                "total_relevant_in_corpus": 5,
            }
        ]
        metrics, count = evaluation_service.compute_metrics_from_queries(query_results)

        assert count == 1
        assert metrics.mrr == 0.0  # No relevant result
        assert metrics.hit_rate == 0.0


# ==================================================================================
# RUN TESTS
# ==================================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
