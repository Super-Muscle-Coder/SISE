"""
benchmark_ann_hnsw_scale.py
===========================
Benchmark scalability HNSW theo quy mô dữ liệu tổng hợp:
N = 1k, 10k, 50k, 100k (vector ngẫu nhiên chuẩn hóa L2=1, dim=512).

Mục tiêu:
- Đo Recall@10 của HNSW so với exact search (trên cùng tập truy vấn).
- Đo latency P50/P95/P99 của HNSW theo từng mốc N.

An toàn dữ liệu:
- CHỈ dùng bảng tạm images_scale_test.
- KHÔNG đụng bảng images thật.
- Luôn DROP bảng tạm trong finally.
"""

from __future__ import annotations

import argparse
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, urlunparse

import numpy as np
import psycopg
from dotenv import dotenv_values

from report_utils import compute_latency_percentiles

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

TABLE_NAME = "images_scale_test"
INDEX_NAME = "idx_images_scale_test_hnsw"
VECTOR_DIM = 512
TOP_K = 10
QUERY_COUNT_DEFAULT = 50
SEED_DEFAULT = 42
SCALES_DEFAULT = [10000, 50000, 100000]
HNSW_M = 16
HNSW_EF_CONSTRUCTION = 200
HNSW_EF_SEARCH_DEFAULT = 64
BATCH_SIZE_DEFAULT = 1000

CREATE_TABLE_SQL = f"""
CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding vector({VECTOR_DIM}) NOT NULL
);
"""

CREATE_INDEX_SQL = f"""
CREATE INDEX IF NOT EXISTS {INDEX_NAME}
ON {TABLE_NAME}
USING hnsw (embedding vector_cosine_ops)
WITH (m = {HNSW_M}, ef_construction = {HNSW_EF_CONSTRUCTION});
"""

COUNT_ROWS_SQL = f"SELECT COUNT(*) FROM {TABLE_NAME};"

SAMPLE_QUERIES_SQL = f"""
SELECT id, embedding::text AS embedding_text
FROM {TABLE_NAME}
ORDER BY random()
LIMIT %s;
"""

SEARCH_SQL_EXACT = f"""
-- exact_search_variant
SELECT id
FROM {TABLE_NAME}
WHERE id != %s
ORDER BY embedding <=> %s::vector
LIMIT %s;
"""

SEARCH_SQL_HNSW = f"""
-- hnsw_search_variant
SELECT id
FROM {TABLE_NAME}
WHERE id != %s
ORDER BY embedding <=> %s::vector
LIMIT %s;
"""


def load_database_url_from_backend_env() -> str:
    """
    Đọc DATABASE_URL từ modules/BackendModule/configs/backend.env.local
    rồi chuẩn hóa:
      - bỏ '+asyncpg'
      - đổi host sise-postgres -> localhost
    """
    env_path = (
        Path(__file__).resolve().parents[1]
        / "configs"
        / "backend.env.local"
    )
    if not env_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file env: {env_path}")

    env_values = dotenv_values(env_path)
    raw_url = env_values.get("DATABASE_URL")
    if not raw_url:
        raise RuntimeError("Thiếu DATABASE_URL trong backend.env.local")

    # Ví dụ: postgresql+asyncpg://user:pass@sise-postgres:5432/db
    # ->    postgresql://user:pass@localhost:5432/db
    normalized = str(raw_url).replace("+asyncpg", "")
    parsed = urlparse(normalized)
    host = parsed.hostname or "localhost"
    if host == "sise-postgres":
        host = "localhost"

    # rebuild netloc preserving user/pass/port
    userinfo = ""
    if parsed.username:
        userinfo = parsed.username
        if parsed.password:
            userinfo += f":{parsed.password}"
        userinfo += "@"
    port = parsed.port or 5432
    netloc = f"{userinfo}{host}:{port}"

    rebuilt = parsed._replace(netloc=netloc)
    return urlunparse(rebuilt)


def ensure_temp_table_and_index(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
        cur.execute(CREATE_INDEX_SQL)
    conn.commit()


def count_rows(conn: psycopg.Connection) -> int:
    with conn.cursor() as cur:
        cur.execute(COUNT_ROWS_SQL)
        row = cur.fetchone()
    return int(row[0]) if row else 0


def analyze_temp_table(conn: psycopg.Connection) -> None:
    """
    Cập nhật statistics cho planner sau khi COPY/INSERT hàng loạt.
    """
    with conn.cursor() as cur:
        cur.execute(f"ANALYZE {TABLE_NAME};")
    conn.commit()
    logger.info("  Đã ANALYZE bảng %s.", TABLE_NAME)


def vector_to_pgvector_text(vec: np.ndarray) -> str:
    # pgvector text format: [v1,v2,...]
    return "[" + ",".join(f"{float(x):.8f}" for x in vec.tolist()) + "]"


def generate_unit_vectors(n: int, dim: int, rng: np.random.Generator) -> np.ndarray:
    """
    Sinh n vector ngẫu nhiên chuẩn hóa L2=1.
    """
    arr = rng.standard_normal(size=(n, dim), dtype=np.float32)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    # tránh chia 0 cực hiếm
    norms[norms == 0.0] = 1.0
    arr = arr / norms
    return arr


def copy_insert_vectors(
    conn: psycopg.Connection,
    vectors: np.ndarray,
    batch_size: int,
) -> None:
    """
    Chèn vector theo batch qua COPY để tối ưu tốc độ.
    """
    total = vectors.shape[0]
    if total == 0:
        return

    inserted = 0
    while inserted < total:
        end = min(inserted + batch_size, total)
        chunk = vectors[inserted:end]

        with conn.cursor() as cur:
            with cur.copy(f"COPY {TABLE_NAME} (embedding) FROM STDIN") as copy:
                for vec in chunk:
                    copy.write_row((vector_to_pgvector_text(vec),))
        conn.commit()

        inserted = end
        logger.info("  Đã chèn %d/%d vector...", inserted, total)


def reindex_temp_hnsw(conn: psycopg.Connection) -> None:
    """
    REINDEX để đảm bảo index ở trạng thái nhất quán hoàn chỉnh trước đo.
    """
    with conn.cursor() as cur:
        cur.execute(f"REINDEX INDEX {INDEX_NAME};")
    conn.commit()


def sample_queries(conn: psycopg.Connection, n_queries: int, seed: int) -> list[dict[str, str]]:
    """
    Lấy ngẫu nhiên truy vấn trực tiếp từ bảng tạm.
    Dùng setseed để tái lập.
    """
    with conn.cursor() as cur:
        # setseed nhận float trong [-1, 1]
        seed_float = ((seed % 10000) / 10000.0) * 2.0 - 1.0
        cur.execute("SELECT setseed(%s);", (seed_float,))
        cur.execute(SAMPLE_QUERIES_SQL, (n_queries,))
        rows = cur.fetchall()

    queries: list[dict[str, str]] = []
    for row in rows:
        queries.append(
            {
                "id": str(row[0]),
                "embedding_text": str(row[1]),
            }
        )
    return queries


def verify_index_scan_used(
    conn: psycopg.Connection,
    query_vector_text: str,
    query_id: str,
    top_k: int,
    ef_search: int,
    n_vectors: int,
) -> bool:
    """
    Chạy EXPLAIN cho SEARCH_SQL ở chế độ HNSW, kiểm tra planner có dùng
    Index Scan / index name hay không.
    """
    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute(f"SET LOCAL hnsw.ef_search = {int(ef_search)};")
            cur.execute(f"EXPLAIN ANALYZE {SEARCH_SQL_HNSW}", (query_id, query_vector_text, top_k))
            plan_lines = [str(row[0]) for row in cur.fetchall()]

    plan_text = "\n".join(plan_lines)
    uses_index = ("Index Scan" in plan_text) or (INDEX_NAME in plan_text)

    if uses_index:
        logger.info("  [OK] Xác nhận query dùng Index Scan (%s) ở mốc N=%d.", INDEX_NAME, n_vectors)
    else:
        logger.warning(
            "  [CẢNH BÁO] Query KHÔNG dùng Index Scan ở mốc N=%d.\nQuery plan:\n%s",
            n_vectors,
            plan_text,
        )
    return uses_index


def run_exact_query(
    conn: psycopg.Connection,
    query_id: str,
    query_vector_text: str,
    top_k: int,
) -> tuple[list[str], float]:
    """
    Exact: tắt index scan trong transaction bằng SET LOCAL.
    """
    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute("SET LOCAL enable_indexscan = off;")
            cur.execute("SET LOCAL enable_bitmapscan = off;")
            cur.execute("SET LOCAL plan_cache_mode = force_custom_plan;")

            start = time.perf_counter()
            cur.execute(SEARCH_SQL_EXACT, (query_id, query_vector_text, top_k))
            rows = cur.fetchall()
            latency_ms = (time.perf_counter() - start) * 1000.0

    ranked_ids = [str(r[0]) for r in rows]
    return ranked_ids, latency_ms


def run_hnsw_query(
    conn: psycopg.Connection,
    query_id: str,
    query_vector_text: str,
    top_k: int,
    ef_search: int,
) -> tuple[list[str], float]:
    """
    HNSW: set ef_search theo transaction bằng SET LOCAL.
    """
    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute(f"SET LOCAL hnsw.ef_search = {int(ef_search)};")
            cur.execute("SET LOCAL plan_cache_mode = force_custom_plan;")

            start = time.perf_counter()
            cur.execute(SEARCH_SQL_HNSW, (query_id, query_vector_text, top_k))
            rows = cur.fetchall()
            latency_ms = (time.perf_counter() - start) * 1000.0

    ranked_ids = [str(r[0]) for r in rows]
    return ranked_ids, latency_ms


def recall_vs_exact(exact_ids: list[str], hnsw_ids: list[str], k: int) -> float:
    exact_set = set(exact_ids[:k])
    hnsw_set = set(hnsw_ids[:k])
    if k <= 0:
        return 0.0
    return len(exact_set & hnsw_set) / float(k)


def benchmark_scale(
    conn: psycopg.Connection,
    n_vectors: int,
    n_queries: int,
    top_k: int,
    ef_search: int,
    seed: int,
) -> dict[str, Any]:
    current = count_rows(conn)
    if current > n_vectors:
        raise RuntimeError(
            f"Số dòng hiện tại ({current}) > mốc cần đo ({n_vectors}). "
            "Script này chỉ tăng dần quy mô."
        )

    need = n_vectors - current
    if need > 0:
        logger.info("Mốc N=%d: cần sinh/chèn thêm %d vector...", n_vectors, need)
        rng = np.random.default_rng(seed + n_vectors)
        vectors = generate_unit_vectors(need, VECTOR_DIM, rng)
        copy_insert_vectors(conn, vectors, batch_size=BATCH_SIZE_DEFAULT)
    else:
        logger.info("Mốc N=%d: đã đủ dữ liệu, không cần chèn thêm.", n_vectors)

    # Bắt buộc cập nhật thống kê planner trước đo
    analyze_temp_table(conn)

    logger.info("Mốc N=%d: REINDEX HNSW để đảm bảo sẵn sàng đo...", n_vectors)
    reindex_temp_hnsw(conn)

    queries = sample_queries(conn, n_queries=n_queries, seed=seed + n_vectors)
    if len(queries) < 1:
        raise RuntimeError(f"Mốc N={n_vectors}: không lấy được query nào.")
    logger.info("Mốc N=%d: số query đo thực tế = %d", n_vectors, len(queries))

    # Xác minh planner dùng index trước khi đo thật
    index_verified = verify_index_scan_used(
        conn=conn,
        query_vector_text=queries[0]["embedding_text"],
        query_id=queries[0]["id"],
        top_k=top_k,
        ef_search=ef_search,
        n_vectors=n_vectors,
    )
    if not index_verified:
        raise RuntimeError(
            f"Mốc N={n_vectors}: PostgreSQL planner không dùng Index Scan cho HNSW. "
            "Dừng đo để tránh sinh dữ liệu vô nghĩa."
        )

    exact_latencies: list[float] = []
    hnsw_latencies: list[float] = []
    recalls: list[float] = []

    for q in queries:
        qid = q["id"]
        qvec = q["embedding_text"]

        exact_ids, exact_ms = run_exact_query(conn, qid, qvec, top_k)
        hnsw_ids, hnsw_ms = run_hnsw_query(conn, qid, qvec, top_k, ef_search)

        exact_latencies.append(exact_ms)
        hnsw_latencies.append(hnsw_ms)
        recalls.append(recall_vs_exact(exact_ids, hnsw_ids, top_k))

    hnsw_stats = compute_latency_percentiles(hnsw_latencies)
    _ = compute_latency_percentiles(exact_latencies)  # vẫn đo để kiểm tra nội bộ khi cần

    return {
        "n_vectors": n_vectors,
        "index_scan_verified": index_verified,
        "recall_vs_exact": round(sum(recalls) / len(recalls), 6) if recalls else 0.0,
        "latency_p50_ms": round(hnsw_stats["p50"], 3),
        "latency_p95_ms": round(hnsw_stats["p95"], 3),
        "latency_p99_ms": round(hnsw_stats["p99"], 3),
    }


def print_summary_table(rows: list[dict[str, Any]]) -> None:
    logger.info("--------------------------------------------------------------------------------")
    logger.info("| %-10s | %-10s | %-19s | %-14s |", "N vectors", "IndexScan", "Recall@10 vs exact", "Latency P50")
    logger.info("--------------------------------------------------------------------------------")
    for r in rows:
        logger.info(
            "| %-10d | %-10s | %-19.3f | %-14.3f |",
            r["n_vectors"],
            str(r.get("index_scan_verified", False)),
            r["recall_vs_exact"],
            r["latency_p50_ms"],
        )
    logger.info("--------------------------------------------------------------------------------")


def drop_temp_table_safely(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(f"DROP TABLE IF EXISTS {TABLE_NAME};")
    conn.commit()
    logger.info("Đã DROP bảng tạm %s.", TABLE_NAME)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark scalability HNSW theo quy mô vector tổng hợp"
    )
    parser.add_argument("--seed", type=int, default=SEED_DEFAULT)
    parser.add_argument("--top_k", type=int, default=TOP_K)
    parser.add_argument("--n_queries", type=int, default=QUERY_COUNT_DEFAULT)
    parser.add_argument("--ef_search", type=int, default=HNSW_EF_SEARCH_DEFAULT)
    parser.add_argument(
        "--scales",
        type=str,
        default="10000,50000,100000",
        help="Danh sách mốc N, phân tách bằng dấu phẩy",
    )
    parser.add_argument(
        "--output_path",
        type=str,
        default=str(
            Path(__file__).resolve().parent / "output" / "ann_hnsw_scale_benchmark.json"
        ),
    )
    args = parser.parse_args()

    scales = [int(x.strip()) for x in args.scales.split(",") if x.strip()]
    scales = sorted(scales)
    if not scales:
        scales = SCALES_DEFAULT

    dsn = load_database_url_from_backend_env()
    logger.info("Kết nối PostgreSQL: host=localhost (đọc từ backend.env.local)")

    conn: psycopg.Connection | None = None
    try:
        conn = psycopg.connect(dsn, prepare_threshold=None)
        ensure_temp_table_and_index(conn)

        results_by_scale: list[dict[str, Any]] = []
        for n in scales:
            row = benchmark_scale(
                conn=conn,
                n_vectors=n,
                n_queries=args.n_queries,
                top_k=args.top_k,
                ef_search=args.ef_search,
                seed=args.seed,
            )
            results_by_scale.append(row)

        all_verified = all(r.get("index_scan_verified", False) for r in results_by_scale)

        disclaimer = (
            "Vector ngẫu nhiên tổng hợp (không phải embedding CLIP thật) — dùng để đo "
            "đặc tính thuật toán/cấu trúc dữ liệu HNSW theo quy mô, tách biệt với "
            "benchmark độ chính xác ngữ nghĩa ở ann_hnsw_benchmark.json "
            "(dữ liệu CLIP thật, N=1000). "
        )
        if all_verified:
            disclaimer += "Đã xác minh planner dùng Index Scan cho mọi mốc đo."
        else:
            disclaimer += "CẢNH BÁO: Có mốc không xác minh được Index Scan."

        output = {
            "disclaimer": disclaimer,
            "run_info": {
                "seed": args.seed,
                "measured_at": datetime.now(timezone.utc).isoformat(),
                "hnsw_config": {
                    "m": HNSW_M,
                    "ef_construction": HNSW_EF_CONSTRUCTION,
                    "ef_search": args.ef_search,
                },
                "n_queries_per_scale": args.n_queries,
                "top_k": args.top_k,
            },
            "results_by_scale": results_by_scale,
        }

        output_path = Path(args.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

        print_summary_table(results_by_scale)
        logger.info("Đã lưu kết quả: %s", output_path)

    finally:
        if conn is not None:
            try:
                drop_temp_table_safely(conn)
            finally:
                conn.close()


if __name__ == "__main__":
    main()