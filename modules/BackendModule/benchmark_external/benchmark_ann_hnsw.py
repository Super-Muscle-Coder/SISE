"""
benchmark_ann_hnsw.py
=====================
Benchmark độc lập ANN HNSW vs Exact Search trên chính PostgreSQL/pgvector.

[FIX — 2026-08-09] Đổi nguồn credential: ban đầu tự ghép DSN từ
storage.env.local (POSTGRES_USER/PASSWORD) nhưng gặp lỗi "password
authentication failed" khi kết nối qua localhost:5432 từ host (nghi vấn
liên quan pg_hba.conf khớp sai dòng, chưa xác định dứt điểm nguyên nhân
gốc). Backend đã xác nhận kết nối THÀNH CÔNG bằng chính DATABASE_URL
trong backend.env.local (readiness: postgres connected) — dùng lại
đúng nguồn đó, chỉ đổi "+asyncpg" và "sise-postgres" -> "localhost" để
psycopg (chạy từ host) hiểu và kết nối được.
"""

from __future__ import annotations

import argparse
import json
import logging
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import psycopg
from dotenv import dotenv_values

from report_utils import compute_latency_percentiles

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

TOP_K_DEFAULT = 10
N_QUERIES_DEFAULT = 100
SEED_DEFAULT = 42
EF_SEARCH_VALUES = [40, 64, 128]

SEARCH_SQL = """
SELECT
    id,
    embedding <=> %s::vector AS distance
FROM images
WHERE index_status = 'ready'
  AND deleted_at IS NULL
  AND id != %s
ORDER BY distance
LIMIT %s
"""

LOAD_READY_SQL = """
SELECT
    id,
    embedding::text AS embedding_text
FROM images
WHERE index_status = 'ready'
  AND deleted_at IS NULL
  AND embedding IS NOT NULL
"""


def _load_backend_env() -> dict[str, str]:
    env_path = (
        Path(__file__).resolve().parents[2]
        / "BackendModule"
        / "configs"
        / "backend.env.local"
    )
    if not env_path.exists():
        raise FileNotFoundError(f"Không tìm thấy env file: {env_path}")

    env = dotenv_values(env_path)
    database_url = env.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("Thiếu DATABASE_URL trong backend.env.local")

    return {"DATABASE_URL": str(database_url)}


def _build_dsn_from_backend_env(env: dict[str, str]) -> str:
    raw_url = env["DATABASE_URL"]
    dsn = raw_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    dsn = dsn.replace("@sise-postgres:5432", "@localhost:5432")
    return dsn


def _fetch_query_pool(conn: psycopg.Connection) -> list[dict[str, str]]:
    with conn.cursor() as cur:
        cur.execute(LOAD_READY_SQL)
        rows = cur.fetchall()

    pool: list[dict[str, str]] = []
    for row in rows:
        image_id = str(row[0])
        embedding_text = row[1]
        if not embedding_text:
            continue
        pool.append({"image_id": image_id, "embedding_text": str(embedding_text)})
    return pool


def _sample_queries(
    pool: list[dict[str, str]],
    n_queries: int,
    seed: int,
) -> list[dict[str, str]]:
    if not pool:
        raise RuntimeError("Không có ảnh ready có embedding để benchmark.")
    if len(pool) < 2:
        raise RuntimeError("Cần ít nhất 2 ảnh ready để thực hiện top-k search.")

    rng = random.Random(seed)
    actual_n = min(n_queries, len(pool))
    return rng.sample(pool, actual_n)


def _run_exact_query(
    conn: psycopg.Connection,
    query_vector_text: str,
    query_id: str,
    top_k: int,
) -> tuple[list[str], float]:
    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute("SET LOCAL enable_indexscan = off")
            cur.execute("SET LOCAL enable_bitmapscan = off")

            start = time.perf_counter()
            cur.execute(SEARCH_SQL, (query_vector_text, query_id, top_k))
            rows = cur.fetchall()
            latency_ms = (time.perf_counter() - start) * 1000.0

    ranked_ids = [str(r[0]) for r in rows]
    return ranked_ids, latency_ms


def _run_hnsw_query(
    conn: psycopg.Connection,
    query_vector_text: str,
    query_id: str,
    top_k: int,
    ef_search: int,
) -> tuple[list[str], float]:
    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute(f"SET LOCAL hnsw.ef_search = {int(ef_search)}")

            start = time.perf_counter()
            cur.execute(SEARCH_SQL, (query_vector_text, query_id, top_k))
            rows = cur.fetchall()
            latency_ms = (time.perf_counter() - start) * 1000.0

    ranked_ids = [str(r[0]) for r in rows]
    return ranked_ids, latency_ms


def _recall_at_k_vs_exact(exact_ids: list[str], approx_ids: list[str], k: int) -> float:
    if k <= 0:
        return 0.0
    exact_set = set(exact_ids[:k])
    approx_set = set(approx_ids[:k])
    return len(exact_set & approx_set) / float(k)


def _summarize_result(
    config_name: str,
    recalls: list[float],
    latencies_ms: list[float],
) -> dict[str, Any]:
    latency_stats = compute_latency_percentiles(latencies_ms)
    recall_avg = (sum(recalls) / len(recalls)) if recalls else 0.0
    return {
        "config": config_name,
        "recall_vs_exact": round(recall_avg, 6),
        "latency_p50_ms": round(latency_stats["p50"], 3),
        "latency_p95_ms": round(latency_stats["p95"], 3),
        "latency_p99_ms": round(latency_stats["p99"], 3),
    }


def _print_summary_table(results: list[dict[str, Any]]) -> None:
    logger.info("---------------------------------------------------------------")
    logger.info("| %-32s | %-23s | %-15s |", "Cấu hình", "Recall@10 vs exact", "Latency P50 (ms)")
    logger.info("---------------------------------------------------------------")
    for row in results:
        logger.info(
            "| %-32s | %-23.3f | %-15.3f |",
            row["config"],
            row["recall_vs_exact"],
            row["latency_p50_ms"],
        )
    logger.info("---------------------------------------------------------------")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark ANN HNSW vs Exact Search trên PostgreSQL/pgvector"
    )
    parser.add_argument("--n_queries", type=int, default=N_QUERIES_DEFAULT)
    parser.add_argument("--seed", type=int, default=SEED_DEFAULT)
    parser.add_argument("--top_k", type=int, default=TOP_K_DEFAULT)
    parser.add_argument(
        "--output_path",
        type=str,
        default=str(Path(__file__).resolve().parent / "output" / "ann_hnsw_benchmark.json"),
    )
    args = parser.parse_args()

    if args.n_queries <= 0:
        raise ValueError("--n_queries phải > 0")
    if args.top_k <= 0:
        raise ValueError("--top_k phải > 0")

    env = _load_backend_env()
    dsn = _build_dsn_from_backend_env(env)

    logger.info("Kết nối PostgreSQL qua localhost:5432 (dùng credential từ backend.env.local) ...")
    with psycopg.connect(dsn) as conn:
        pool = _fetch_query_pool(conn)
        queries = _sample_queries(pool, args.n_queries, args.seed)
        logger.info("Tổng ảnh ready có embedding: %d", len(pool))
        logger.info("Số truy vấn benchmark: %d (seed=%d)", len(queries), args.seed)

        exact_latencies: list[float] = []
        exact_recall: list[float] = []
        exact_topk_by_query_id: dict[str, list[str]] = {}
        for q in queries:
            qid = q["image_id"]
            qvec = q["embedding_text"]
            exact_ids, latency_ms = _run_exact_query(conn, qvec, qid, args.top_k)
            exact_topk_by_query_id[qid] = exact_ids
            exact_latencies.append(latency_ms)
            exact_recall.append(1.0)

        results: list[dict[str, Any]] = []
        results.append(_summarize_result("exact", exact_recall, exact_latencies))

        for ef in EF_SEARCH_VALUES:
            recalls: list[float] = []
            latencies: list[float] = []

            for q in queries:
                qid = q["image_id"]
                qvec = q["embedding_text"]
                approx_ids, latency_ms = _run_hnsw_query(conn, qvec, qid, args.top_k, ef)

                recall = _recall_at_k_vs_exact(
                    exact_ids=exact_topk_by_query_id[qid],
                    approx_ids=approx_ids,
                    k=args.top_k,
                )
                recalls.append(recall)
                latencies.append(latency_ms)

            results.append(_summarize_result(f"hnsw_ef{ef}", recalls, latencies))

    output = {
        "run_info": {
            "n_queries": len(queries),
            "seed": args.seed,
            "top_k": args.top_k,
            "measured_at": datetime.now(timezone.utc).isoformat(),
        },
        "hnsw_config": {
            "m": 16,
            "ef_construction": 200,
        },
        "results": results,
    }

    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    _print_summary_table(results)
    logger.info("Đã lưu kết quả: %s", output_path)


if __name__ == "__main__":
    main()