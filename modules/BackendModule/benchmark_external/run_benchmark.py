"""
run_benchmark.py  (v2 — bản đầy đủ, có bằng chứng chống giả mạo)
====================================================================
Task 2 + Task 3 (GopY_29_07.md): Chạy benchmark image-to-text VÀ
text-to-image trên tập Flickr30K đã lấy mẫu (download_flickr30k.py).

THIẾT KẾ 2 SCRIPT TÁCH BIỆT (đã thống nhất với Project Owner):
  - run_benchmark.py (file này): CHẠY 1 LẦN, TỐN THỜI GIAN (embed toàn
    bộ ảnh/caption qua AIModule thật) — lưu TOÀN BỘ dữ liệu thô chi tiết
    (không chỉ 4 số cuối) ra đĩa, làm "bằng chứng" cho việc benchmark
    được chạy thật.
  - generate_report.py: đọc dữ liệu thô đã lưu, sinh biểu đồ + báo cáo
    HTML trong VÀI GIÂY — dùng để trình bày/demo trước hội đồng mà
    KHÔNG cần chạy lại toàn bộ pipeline 30+ phút.

3 LỚP BẰNG CHỨNG CHỐNG GIẢ MẠO (đã bàn bạc với Project Owner — không có
cơ chế nào tuyệt đối chống giả mạo 100%, nhưng các lớp này khiến việc
giả mạo tốn công sức hơn nhiều so với chạy thật):
  1. raw_events.jsonl — ghi TỪNG dòng NGAY KHI request hoàn thành (không
     đợi tới cuối), gồm timestamp mili-giây, loại request, latency đo
     bằng time.perf_counter(), và SHA256 hash của response body.
  2. embeddings_cache.npz — lưu TOÀN BỘ vector CLIP thật (512 chiều) cho
     mọi ảnh/caption — cho phép kiểm chứng độc lập bằng cách tự tính lại
     cosine similarity từ vector thật.
  3. docker_stats_log.jsonl — lấy mẫu `docker stats` container AIModule
     mỗi 5 giây trong suốt quá trình chạy — bằng chứng resource usage do
     chính Docker sinh ra, không phải do script tự tính.

Cách chạy:
    python run_benchmark.py --ai_service_url http://localhost:8001 --top_k 10

Output (tất cả trong benchmark_external/output/):
    raw_events.jsonl          <- log từng request, có hash
    embeddings_cache.npz      <- vector CLIP thật
    docker_stats_log.jsonl    <- resource usage container AIModule
    checkpoint.json           <- tiến độ (dùng để resume nếu bị ngắt)
    flickr30k_results.json    <- kết quả tổng hợp cuối cùng (đầy đủ hơn v1)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import subprocess
import threading
import time
from pathlib import Path
from typing import Any

import httpx
import numpy as np

from report_utils import (
    bootstrap_confidence_interval,
    compute_latency_percentiles,
    compute_metrics,
    compute_metrics_multi_k,
    compute_mrr,
    compute_rank_distribution,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data" / "flickr30k_sample"
IMAGES_DIR = DATA_DIR / "images"
METADATA_PATH = DATA_DIR / "metadata.json"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_PATH = OUTPUT_DIR / "flickr30k_results.json"
RAW_EVENTS_PATH = OUTPUT_DIR / "raw_events.jsonl"
EMBEDDINGS_CACHE_PATH = OUTPUT_DIR / "embeddings_cache.npz"
DOCKER_STATS_PATH = OUTPUT_DIR / "docker_stats_log.jsonl"
CHECKPOINT_PATH = OUTPUT_DIR / "checkpoint.json"

# Đọc benchmark dataset tự thân từ file JSON riêng (Project Owner tự cập
# nhật file này sau mỗi lần chạy /eval/run mới trên BackendModule, KHÔNG
# cần sửa code ở đây mỗi lần có số liệu mới).
OWN_DATASET_BENCHMARK_PATH = Path(__file__).parent / "own_dataset_benchmark.json"

REFERENCE_BENCHMARKS = {
    "clip_paper_mscoco_rn50_zeroshot_r1_i2t": 0.4806,
    "clip_paper_mscoco_rn50_zeroshot_r1_t2i": 0.2831,
    "andrespmd_flickr30k_zeroshot_r1_i2t": 0.360,
    "andrespmd_flickr30k_zeroshot_r1_t2i": 0.558,
    "andrespmd_mscoco1k_zeroshot_r1_i2t": 0.261,
    "andrespmd_mscoco1k_zeroshot_r1_t2i": 0.480,
}

K_VALUES = [1, 5, 10]
RANK_BUCKETS = [(1, 1), (2, 5), (6, 10), (11, None)]


def sha256_of(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class EvidenceLogger:
    """
    Ghi log bằng chứng — MỞ FILE Ở CHẾ ĐỘ APPEND VÀ FLUSH NGAY sau mỗi
    dòng, để dữ liệu được ghi xuống đĩa THẬT SỰ theo thời gian thực
    (không bị buffer giữ trong RAM rồi mất nếu script bị ngắt giữa
    chừng) — đây chính là điều kiện để raw_events.jsonl có giá trị làm
    bằng chứng "quá trình chạy thật", không phải ghi 1 lần lúc cuối.
    """

    def __init__(self, path: Path):
        self.path = path
        self._file = open(path, "a", encoding="utf-8")

    def log_event(self, event_type: str, **fields: Any) -> None:
        record = {
            "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime()) + f".{int(time.time() * 1000) % 1000:03d}",
            "event_type": event_type,
            **fields,
        }
        self._file.write(json.dumps(record, ensure_ascii=False) + "\n")
        self._file.flush()

    def close(self) -> None:
        self._file.close()


class DockerStatsMonitor:
    """
    Chạy nền, lấy mẫu `docker stats` của container AIModule (sise-ai)
    mỗi interval_sec giây, ghi ra docker_stats_log.jsonl — bằng chứng
    resource usage do CHÍNH Docker sinh ra, không phải script tự ước
    lượng. Chạy trong 1 thread riêng, không chặn luồng benchmark chính.
    """

    def __init__(self, container_name: str, output_path: Path, interval_sec: float = 5.0):
        self.container_name = container_name
        self.output_path = output_path
        self.interval_sec = interval_sec
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def _sample_loop(self) -> None:
        with open(self.output_path, "a", encoding="utf-8") as f:
            while not self._stop_event.is_set():
                try:
                    result = subprocess.run(
                        ["docker", "stats", "--no-stream", "--format", "{{json .}}", self.container_name],
                        capture_output=True, text=True, timeout=10,
                    )
                    if result.returncode == 0 and result.stdout.strip():
                        stats = json.loads(result.stdout.strip())
                        record = {
                            "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime()),
                            "cpu_perc": stats.get("CPUPerc"),
                            "mem_usage": stats.get("MemUsage"),
                            "mem_perc": stats.get("MemPerc"),
                            "net_io": stats.get("NetIO"),
                        }
                        f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        f.flush()
                except Exception as exc:
                    logger.warning("docker stats sampling failed (bỏ qua, không dừng benchmark): %s", exc)
                self._stop_event.wait(self.interval_sec)

    def start(self) -> None:
        self._thread = threading.Thread(target=self._sample_loop, daemon=True)
        self._thread.start()
        logger.info("Bắt đầu giám sát docker stats container '%s' mỗi %.0fs...", self.container_name, self.interval_sec)

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=self.interval_sec + 2)
        logger.info("Đã dừng giám sát docker stats.")


class AIServiceClient:
    def __init__(self, base_url: str, evidence_logger: EvidenceLogger, timeout_sec: float = 30.0, max_retries: int = 3):
        self.base_url = base_url.rstrip("/")
        self.timeout_sec = timeout_sec
        self.max_retries = max_retries
        self.evidence_logger = evidence_logger

    def _post_with_retry(self, url: str, **kwargs: Any) -> httpx.Response:
        last_exc: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                return httpx.post(url, timeout=self.timeout_sec, **kwargs)
            except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as exc:
                last_exc = exc
                logger.warning("Request lỗi tạm thời (lần %d/%d): %s. Thử lại sau 2s...", attempt, self.max_retries, exc)
                time.sleep(2)
        raise RuntimeError(f"Request thất bại sau {self.max_retries} lần thử: {last_exc}")

    def embed_image(self, image_path: Path, item_id: str) -> tuple[list[float], float]:
        url = f"{self.base_url}/inference/embed/image"
        start = time.perf_counter()
        with open(image_path, "rb") as f:
            files = {"file": (image_path.name, f, "image/jpeg")}
            resp = self._post_with_retry(url, files=files)
        latency_ms = (time.perf_counter() - start) * 1000

        if resp.status_code != 200:
            raise RuntimeError(f"embed_image failed ({resp.status_code}): {resp.text}")
        response_hash = sha256_of(resp.content)
        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise RuntimeError(f"Invalid embed_image response schema: {data}")

        self.evidence_logger.log_event(
            "embed_image", item_id=item_id, filename=image_path.name,
            latency_ms=round(latency_ms, 3), status_code=resp.status_code,
            response_sha256=response_hash, vector_dim=len(vector),
        )
        return vector, latency_ms

    def embed_text(self, query_text: str, item_id: str) -> tuple[list[float], float]:
        url = f"{self.base_url}/inference/embed/text"
        start = time.perf_counter()
        resp = self._post_with_retry(url, json={"query_text": query_text})
        latency_ms = (time.perf_counter() - start) * 1000

        if resp.status_code != 200:
            raise RuntimeError(f"embed_text failed ({resp.status_code}): {resp.text}")
        response_hash = sha256_of(resp.content)
        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise RuntimeError(f"Invalid embed_text response schema: {data}")

        self.evidence_logger.log_event(
            "embed_text", item_id=item_id, text_preview=query_text[:50],
            latency_ms=round(latency_ms, 3), status_code=resp.status_code,
            response_sha256=response_hash, vector_dim=len(vector),
        )
        return vector, latency_ms


def load_checkpoint() -> dict[str, Any]:
    if CHECKPOINT_PATH.exists():
        return json.loads(CHECKPOINT_PATH.read_text(encoding="utf-8"))
    return {"embedded_images": {}, "embedded_captions": {}}


def save_checkpoint(checkpoint: dict[str, Any]) -> None:
    CHECKPOINT_PATH.write_text(json.dumps(checkpoint, ensure_ascii=False), encoding="utf-8")


def cosine_similarity_matrix(query_vectors: np.ndarray, corpus_vectors: np.ndarray) -> np.ndarray:
    query_norm = query_vectors / np.linalg.norm(query_vectors, axis=1, keepdims=True)
    corpus_norm = corpus_vectors / np.linalg.norm(corpus_vectors, axis=1, keepdims=True)
    return query_norm @ corpus_norm.T


def main() -> None:
    parser = argparse.ArgumentParser(description="Chạy benchmark Flickr30K (v2, đầy đủ bằng chứng)")
    parser.add_argument("--ai_service_url", type=str, default="http://localhost:8001")
    parser.add_argument("--top_k", type=int, default=10, help="Top-K chính dùng làm mặc định hiển thị (vẫn tính đủ k=1,5,10)")
    parser.add_argument("--ai_container_name", type=str, default="sise-ai", help="Tên container AIModule để giám sát docker stats")
    parser.add_argument("--skip_docker_stats", action="store_true", help="Bỏ qua giám sát docker stats (nếu không chạy Docker)")
    args = parser.parse_args()

    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy {METADATA_PATH}. Chạy download_flickr30k.py trước.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    image_ids = list(metadata.keys())
    logger.info("Đã nạp metadata: %d ảnh.", len(image_ids))

    evidence_logger = EvidenceLogger(RAW_EVENTS_PATH)
    evidence_logger.log_event("benchmark_started", sample_size=len(image_ids), ai_service_url=args.ai_service_url)

    docker_monitor = None
    if not args.skip_docker_stats:
        docker_monitor = DockerStatsMonitor(args.ai_container_name, DOCKER_STATS_PATH)
        docker_monitor.start()

    client = AIServiceClient(base_url=args.ai_service_url, evidence_logger=evidence_logger)
    checkpoint = load_checkpoint()

    try:
        # ===== Embed toàn bộ ảnh (với checkpoint/resume) =====
        logger.info("Đang embed %d ảnh qua AIModule (%s)...", len(image_ids), args.ai_service_url)
        image_vectors_dict: dict[str, list[float]] = {
            k: v for k, v in checkpoint["embedded_images"].items() if k in image_ids
        }
        image_embed_latencies: list[float] = []

        for idx, img_id in enumerate(image_ids):
            if img_id in image_vectors_dict:
                continue
            image_path = IMAGES_DIR / metadata[img_id]["filename"]
            vec, latency = client.embed_image(image_path, item_id=img_id)
            image_vectors_dict[img_id] = vec
            image_embed_latencies.append(latency)

            if (idx + 1) % 50 == 0:
                checkpoint["embedded_images"] = image_vectors_dict
                save_checkpoint(checkpoint)
                logger.info("  Đã embed %d/%d ảnh... (checkpoint đã lưu)", idx + 1, len(image_ids))

        checkpoint["embedded_images"] = image_vectors_dict
        save_checkpoint(checkpoint)
        image_vectors_np = np.array([image_vectors_dict[i] for i in image_ids], dtype=np.float32)

        # ===== Danh sách caption phẳng =====
        all_captions: list[str] = []
        caption_to_image_id: list[str] = []
        caption_item_ids: list[str] = []
        for img_id in image_ids:
            for cap_idx, cap in enumerate(metadata[img_id]["captions"]):
                all_captions.append(cap)
                caption_to_image_id.append(img_id)
                caption_item_ids.append(f"{img_id}__cap{cap_idx}")

        # ===== Embed toàn bộ caption (với checkpoint/resume) =====
        logger.info("Đang embed %d caption qua AIModule...", len(all_captions))
        caption_vectors_dict: dict[str, list[float]] = {
            k: v for k, v in checkpoint["embedded_captions"].items() if k in caption_item_ids
        }
        caption_latencies: list[float] = []

        for idx, (cap, cap_item_id) in enumerate(zip(all_captions, caption_item_ids)):
            if cap_item_id in caption_vectors_dict:
                continue
            vec, latency = client.embed_text(cap, item_id=cap_item_id)
            caption_vectors_dict[cap_item_id] = vec
            caption_latencies.append(latency)

            if (idx + 1) % 200 == 0:
                checkpoint["embedded_captions"] = caption_vectors_dict
                save_checkpoint(checkpoint)
                logger.info("  Đã embed %d/%d caption... (checkpoint đã lưu)", idx + 1, len(all_captions))

        checkpoint["embedded_captions"] = caption_vectors_dict
        save_checkpoint(checkpoint)
        caption_vectors_np = np.array([caption_vectors_dict[cid] for cid in caption_item_ids], dtype=np.float32)

        # ===== LỚP BẰNG CHỨNG 2: lưu toàn bộ vector CLIP thật =====
        logger.info("Đang lưu embeddings_cache.npz (bằng chứng — vector CLIP thật)...")
        np.savez_compressed(
            EMBEDDINGS_CACHE_PATH,
            image_ids=np.array(image_ids),
            image_vectors=image_vectors_np,
            caption_item_ids=np.array(caption_item_ids),
            caption_vectors=caption_vectors_np,
            caption_to_image_id=np.array(caption_to_image_id),
        )

        # ===== Tính similarity =====
        start_sim = time.perf_counter()
        sim_i2t = cosine_similarity_matrix(image_vectors_np, caption_vectors_np)
        sim_i2t_latency_ms = (time.perf_counter() - start_sim) * 1000

        start_sim2 = time.perf_counter()
        sim_t2i = cosine_similarity_matrix(caption_vectors_np, image_vectors_np)
        sim_t2i_latency_ms = (time.perf_counter() - start_sim2) * 1000

        evidence_logger.log_event(
            "similarity_computed",
            i2t_latency_ms=round(sim_i2t_latency_ms, 3),
            t2i_latency_ms=round(sim_t2i_latency_ms, 3),
        )

        # ===== Ground truth + query_results =====
        i2t_query_results = []
        for i, img_id in enumerate(image_ids):
            ranked_caption_indices = np.argsort(-sim_i2t[i]).tolist()
            relevant_indices = {j for j, owner_id in enumerate(caption_to_image_id) if owner_id == img_id}
            i2t_query_results.append({"ranked_ids": ranked_caption_indices, "relevant_ids": relevant_indices})

        image_id_to_index = {img_id: idx for idx, img_id in enumerate(image_ids)}
        t2i_query_results = []
        for i, owner_img_id in enumerate(caption_to_image_id):
            ranked_image_indices = np.argsort(-sim_t2i[i]).tolist()
            relevant_index = {image_id_to_index[owner_img_id]}
            t2i_query_results.append({"ranked_ids": ranked_image_indices, "relevant_ids": relevant_index})

        # ===== A.1: đa mức k =====
        i2t_metrics_by_k = compute_metrics_multi_k(i2t_query_results, K_VALUES)
        t2i_metrics_by_k = compute_metrics_multi_k(t2i_query_results, K_VALUES)

        # ===== A.2: phân phối rank chi tiết =====
        i2t_rank_distribution = compute_rank_distribution(i2t_query_results, RANK_BUCKETS)
        t2i_rank_distribution = compute_rank_distribution(t2i_query_results, RANK_BUCKETS)

        # ===== A.3: std cho MRR (qua reciprocal rank từng query) =====
        def per_query_reciprocal_ranks(query_results: list[dict[str, Any]], k: int) -> list[float]:
            out = []
            for r in query_results:
                ranked = r["ranked_ids"][:k]
                relevant = set(r["relevant_ids"])
                rr = 0.0
                for idx, cid in enumerate(ranked, start=1):
                    if cid in relevant:
                        rr = 1.0 / idx
                        break
                out.append(rr)
            return out

        from report_utils import compute_std
        i2t_mrr_std = compute_std(per_query_reciprocal_ranks(i2t_query_results, args.top_k))
        t2i_mrr_std = compute_std(per_query_reciprocal_ranks(t2i_query_results, args.top_k))

        # ===== A.4: khoảng tin cậy 95% (bootstrap) cho MRR ở top_k chính =====
        logger.info("Đang tính khoảng tin cậy 95% (bootstrap, 1000 lần lặp)...")
        i2t_mrr_ci = bootstrap_confidence_interval(i2t_query_results, compute_mrr, k=args.top_k)
        t2i_mrr_ci = bootstrap_confidence_interval(t2i_query_results, compute_mrr, k=args.top_k)

        # ===== B: latency percentiles =====
        image_latency_stats = compute_latency_percentiles(image_embed_latencies)
        caption_latency_stats = compute_latency_percentiles(caption_latencies)

        # ===== Đọc benchmark dataset tự thân từ file riêng =====
        own_dataset_benchmark: dict[str, Any] = {}
        if OWN_DATASET_BENCHMARK_PATH.exists():
            own_dataset_benchmark = json.loads(OWN_DATASET_BENCHMARK_PATH.read_text(encoding="utf-8"))
        else:
            logger.warning(
                "Không tìm thấy %s — bỏ qua so sánh với dataset tự thân. "
                "Tạo file này (xem own_dataset_benchmark.example.json) nếu muốn so sánh.",
                OWN_DATASET_BENCHMARK_PATH,
            )

        # ===== Tổng hợp output =====
        result = {
            "run_info": {
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "ai_service_url": args.ai_service_url,
                "top_k_default": args.top_k,
                "k_values_computed": K_VALUES,
            },
            "dataset_info": {
                "name": "Flickr30K (subset, Karpathy test split via nlphuji/flickr30k)",
                "sample_size": len(image_ids),
                "total_captions": len(all_captions),
            },
            "image_to_text": {
                "metrics_by_k": i2t_metrics_by_k,
                "rank_distribution": i2t_rank_distribution,
                "mrr_std": i2t_mrr_std,
                "mrr_confidence_interval_95": i2t_mrr_ci,
            },
            "text_to_image": {
                "metrics_by_k": t2i_metrics_by_k,
                "rank_distribution": t2i_rank_distribution,
                "mrr_std": t2i_mrr_std,
                "mrr_confidence_interval_95": t2i_mrr_ci,
            },
            "latency": {
                "image_embed": image_latency_stats,
                "text_embed": caption_latency_stats,
                "similarity_computation_ms": {
                    "image_to_text": round(sim_i2t_latency_ms, 3),
                    "text_to_image": round(sim_t2i_latency_ms, 3),
                },
            },
            "own_dataset_comparison": own_dataset_benchmark,
            "reference_benchmarks": REFERENCE_BENCHMARKS,
            "evidence_files": {
                "raw_events_jsonl": str(RAW_EVENTS_PATH.name),
                "embeddings_cache_npz": str(EMBEDDINGS_CACHE_PATH.name),
                "docker_stats_log_jsonl": str(DOCKER_STATS_PATH.name) if docker_monitor else None,
            },
        }

        OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        evidence_logger.log_event("benchmark_completed", output_path=str(OUTPUT_PATH))

        logger.info("=" * 70)
        logger.info("KẾT QUẢ BENCHMARK FLICKR30K (k=%d)", args.top_k)
        i2t_k = i2t_metrics_by_k[args.top_k]
        t2i_k = t2i_metrics_by_k[args.top_k]
        logger.info("Image-to-Text: MRR=%.4f (±%.4f, 95%% CI [%.4f, %.4f]) HitRate=%.4f Precision=%.4f Recall=%.4f",
                    i2t_k["mrr"], i2t_mrr_std, i2t_mrr_ci["lower"], i2t_mrr_ci["upper"],
                    i2t_k["hit_rate"], i2t_k["precision"], i2t_k["recall"])
        logger.info("Text-to-Image: MRR=%.4f (±%.4f, 95%% CI [%.4f, %.4f]) HitRate=%.4f Precision=%.4f Recall=%.4f",
                    t2i_k["mrr"], t2i_mrr_std, t2i_mrr_ci["lower"], t2i_mrr_ci["upper"],
                    t2i_k["hit_rate"], t2i_k["precision"], t2i_k["recall"])
        logger.info("Latency ảnh: P50=%.1fms P95=%.1fms P99=%.1fms", image_latency_stats["p50"], image_latency_stats["p95"], image_latency_stats["p99"])
        logger.info("Latency text: P50=%.1fms P95=%.1fms P99=%.1fms", caption_latency_stats["p50"], caption_latency_stats["p95"], caption_latency_stats["p99"])
        logger.info("Kết quả đầy đủ: %s", OUTPUT_PATH)
        logger.info("Bằng chứng: %s, %s, %s", RAW_EVENTS_PATH.name, EMBEDDINGS_CACHE_PATH.name, DOCKER_STATS_PATH.name)
        logger.info("=" * 70)
        logger.info("XONG. Từ giờ chỉ cần chạy generate_report.py để xem báo cáo/biểu đồ (vài giây, không cần chạy lại benchmark).")

    finally:
        if docker_monitor is not None:
            docker_monitor.stop()
        evidence_logger.close()


if __name__ == "__main__":
    main()