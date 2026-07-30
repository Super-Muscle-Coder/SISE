"""
report_utils.py
=================
Các hàm tính toán DÙNG CHUNG giữa run_benchmark.py (chạy 1 lần, tốn thời
gian) và generate_report.py (chạy nhanh, đọc dữ liệu thô đã lưu). Tách
riêng để đảm bảo 2 script luôn dùng ĐÚNG CÙNG 1 công thức, không lệch
nhau nếu sửa sau này.

4 công thức cốt lõi (compute_mrr/hit_rate/precision_at_k/recall) COPY
NGUYÊN VĂN từ app/services/evaluation_services.py (BackendModule) —
không đổi, đảm bảo phương pháp nhất quán giữa benchmark nội bộ SISE và
benchmark Flickr30K.
"""

from __future__ import annotations

import random
from typing import Any


# ===== 4 CÔNG THỨC CỐT LÕI — GIỮ NGUYÊN theo evaluation_services.py =====
def compute_mrr(query_results: list[dict[str, Any]], k: int) -> float:
    if not query_results:
        return 0.0
    reciprocal_ranks: list[float] = []
    for result in query_results:
        ranked_ids = result["ranked_ids"][:k]
        relevant_ids = set(result["relevant_ids"])
        rr = 0.0
        for idx, candidate_id in enumerate(ranked_ids, start=1):
            if candidate_id in relevant_ids:
                rr = 1.0 / idx
                break
        reciprocal_ranks.append(rr)
    return float(sum(reciprocal_ranks) / len(reciprocal_ranks))


def compute_hit_rate(query_results: list[dict[str, Any]], k: int) -> float:
    if not query_results:
        return 0.0
    hits = 0
    for result in query_results:
        ranked_ids = result["ranked_ids"][:k]
        relevant_ids = set(result["relevant_ids"])
        if any(cid in relevant_ids for cid in ranked_ids):
            hits += 1
    return float(hits / len(query_results))


def compute_precision_at_k(query_results: list[dict[str, Any]], k: int) -> float:
    if not query_results or k <= 0:
        return 0.0
    precisions: list[float] = []
    for result in query_results:
        ranked_ids = result["ranked_ids"][:k]
        relevant_ids = set(result["relevant_ids"])
        if not ranked_ids:
            precisions.append(0.0)
            continue
        hit_count = sum(1 for cid in ranked_ids if cid in relevant_ids)
        precisions.append(hit_count / k)
    return float(sum(precisions) / len(precisions))


def compute_recall(query_results: list[dict[str, Any]], k: int) -> float:
    if not query_results:
        return 0.0
    recalls: list[float] = []
    for result in query_results:
        ranked_ids = result["ranked_ids"][:k]
        relevant_ids = set(result["relevant_ids"])
        if not relevant_ids:
            recalls.append(0.0)
            continue
        hit_count = sum(1 for cid in ranked_ids if cid in relevant_ids)
        recalls.append(hit_count / len(relevant_ids))
    return float(sum(recalls) / len(recalls))


def compute_metrics(query_results: list[dict[str, Any]], k: int) -> dict[str, float]:
    return {
        "mrr": compute_mrr(query_results, k),
        "hit_rate": compute_hit_rate(query_results, k),
        "precision": compute_precision_at_k(query_results, k),
        "recall": compute_recall(query_results, k),
    }


# ===== MỞ RỘNG: đa mức k, per-query rank, std, confidence interval =====

def compute_metrics_multi_k(
    query_results: list[dict[str, Any]], k_values: list[int]
) -> dict[int, dict[str, float]]:
    """Tính đủ 4 chỉ số ở NHIỀU mức k cùng lúc (ví dụ k=1,5,10) — dùng
    lại đúng query_results đã có, không cần tính toán lại similarity."""
    return {k: compute_metrics(query_results, k) for k in k_values}


def get_first_relevant_rank(result: dict[str, Any]) -> int | None:
    """
    Trả về rank (1-based) của kết quả ĐÚNG ĐẦU TIÊN trong toàn bộ danh
    sách ranked_ids (không cắt theo k) — dùng để dựng phân phối rank chi
    tiết. Trả None nếu không có kết quả đúng nào trong toàn bộ danh sách.
    """
    relevant_ids = set(result["relevant_ids"])
    for idx, candidate_id in enumerate(result["ranked_ids"], start=1):
        if candidate_id in relevant_ids:
            return idx
    return None


def compute_rank_distribution(
    query_results: list[dict[str, Any]], buckets: list[tuple[int, int | None]]
) -> dict[str, dict[str, Any]]:
    """
    Phân phối % câu trả lời đúng theo từng khoảng rank — ví dụ buckets
    [(1,1), (2,5), (6,10), (11,None)] cho biết % rơi vào rank=1,
    rank 2-5, rank 6-10, ngoài top-10 (None nghĩa là không giới hạn trên).
    Đây là chỉ số bổ sung cho biết mô hình "sai gần" hay "sai xa", không
    thể thấy được chỉ từ 4 chỉ số tổng hợp MRR/HitRate/Precision/Recall.
    """
    total = len(query_results)
    if total == 0:
        return {}

    ranks = [get_first_relevant_rank(r) for r in query_results]
    result: dict[str, dict[str, Any]] = {}

    for low, high in buckets:
        if high is None:
            label = f"rank_{low}_plus"
            count = sum(1 for r in ranks if r is not None and r >= low)
        elif low == high:
            label = f"rank_{low}"
            count = sum(1 for r in ranks if r == low)
        else:
            label = f"rank_{low}_{high}"
            count = sum(1 for r in ranks if r is not None and low <= r <= high)
        result[label] = {"count": count, "percentage": round(count / total * 100, 2)}

    not_found_count = sum(1 for r in ranks if r is None)
    result["not_found_in_results"] = {
        "count": not_found_count,
        "percentage": round(not_found_count / total * 100, 2),
    }
    return result


def compute_std(values: list[float]) -> float:
    """Độ lệch chuẩn mẫu (sample standard deviation), dùng thư viện chuẩn
    Python (statistics), không cần thêm dependency ngoài."""
    if len(values) < 2:
        return 0.0
    import statistics
    return statistics.stdev(values)


def bootstrap_confidence_interval(
    query_results: list[dict[str, Any]],
    metric_fn,
    k: int,
    n_bootstrap: int = 1000,
    confidence: float = 0.95,
    seed: int = 42,
) -> dict[str, float]:
    """
    Khoảng tin cậy 95% cho 1 chỉ số, tính bằng bootstrap resampling —
    kỹ thuật thống kê chuẩn mực (không cần giả định phân phối chuẩn của
    dữ liệu gốc, phù hợp vì các chỉ số retrieval thường không phân phối
    chuẩn). Lấy mẫu CÓ HOÀN LẠI (with replacement) từ query_results
    n_bootstrap lần, mỗi lần tính lại chỉ số, rồi lấy percentile 2.5%/
    97.5% của phân phối kết quả làm cận dưới/trên khoảng tin cậy 95%.
    """
    rng = random.Random(seed)
    n = len(query_results)
    if n == 0:
        return {"lower": 0.0, "upper": 0.0, "mean": 0.0}

    bootstrap_estimates: list[float] = []
    for _ in range(n_bootstrap):
        resample = [query_results[rng.randrange(n)] for _ in range(n)]
        bootstrap_estimates.append(metric_fn(resample, k))

    bootstrap_estimates.sort()
    alpha = 1 - confidence
    lower_idx = int((alpha / 2) * n_bootstrap)
    upper_idx = int((1 - alpha / 2) * n_bootstrap) - 1
    lower_idx = max(0, min(lower_idx, n_bootstrap - 1))
    upper_idx = max(0, min(upper_idx, n_bootstrap - 1))

    return {
        "lower": bootstrap_estimates[lower_idx],
        "upper": bootstrap_estimates[upper_idx],
        "mean": sum(bootstrap_estimates) / len(bootstrap_estimates),
    }


def compute_latency_percentiles(latencies_ms: list[float]) -> dict[str, float]:
    """P50/P95/P99 — phản ánh đúng 'trường hợp xấu' thực tế hơn trung
    bình đơn thuần (trung bình dễ bị méo bởi vài lần gọi chậm bất thường)."""
    if not latencies_ms:
        return {"p50": 0.0, "p95": 0.0, "p99": 0.0, "mean": 0.0, "std": 0.0}
    sorted_lat = sorted(latencies_ms)
    n = len(sorted_lat)

    def percentile(p: float) -> float:
        idx = min(int(p * n), n - 1)
        return sorted_lat[idx]

    return {
        "p50": percentile(0.50),
        "p95": percentile(0.95),
        "p99": percentile(0.99),
        "mean": sum(latencies_ms) / n,
        "std": compute_std(latencies_ms),
    }


__all__ = [
    "compute_mrr",
    "compute_hit_rate",
    "compute_precision_at_k",
    "compute_recall",
    "compute_metrics",
    "compute_metrics_multi_k",
    "get_first_relevant_rank",
    "compute_rank_distribution",
    "compute_std",
    "bootstrap_confidence_interval",
    "compute_latency_percentiles",
]