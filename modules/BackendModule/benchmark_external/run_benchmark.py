"""
run_benchmark.py
==================
Task 2 + Task 3 (GopY_29_07.md): Chạy benchmark image-to-text VÀ
text-to-image trên tập Flickr30K đã lấy mẫu (download_flickr30k.py),
đo đủ 4 chỉ số MRR/HitRate@K/Precision@K/Recall@K theo đúng công thức
đã dùng ở evaluation_services.py (Chương 5.2), đồng thời đo latency
trung bình mỗi bước.

QUYẾT ĐỊNH KIẾN TRÚC (đã bàn bạc với Project Owner): script này CHẠY
HOÀN TOÀN ĐỘC LẬP, không đi qua BackendModule/MinIO/PostgreSQL/pgvector
— chỉ gọi thẳng AIModule (CÙNG model CLIP mà hệ thống SISE đang chạy
thật, đảm bảo tính so sánh được với benchmark 750/1000 ảnh tự thu thập)
để lấy vector, rồi TỰ tính cosine similarity bằng numpy trong bộ nhớ.

Cách chạy:
    python run_benchmark.py --ai_service_url http://localhost:8001 --top_k 10

Output:
    benchmark_external/output/flickr30k_results.json
"""

from __future__ import annotations

import argparse
import json
import logging
import time
from pathlib import Path
from typing import Any

import httpx
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data" / "flickr30k_sample"
IMAGES_DIR = DATA_DIR / "images"
METADATA_PATH = DATA_DIR / "metadata.json"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_PATH = OUTPUT_DIR / "flickr30k_results.json"

OWN_DATASET_BENCHMARK = {
    "mrr": 0.4996190369129181,
    "hit_rate": 0.9980000257492065,
    "precision": 0.879800021648407,
    "recall": 0.9980000257492065,
    "query_count": 500,
}

REFERENCE_BENCHMARKS = {
    "clip_paper_mscoco_rn50_zeroshot_r1_i2t": 0.4806,
    "clip_paper_mscoco_rn50_zeroshot_r1_t2i": 0.2831,
    "andrespmd_flickr30k_zeroshot_r1_i2t": 0.360,
    "andrespmd_flickr30k_zeroshot_r1_t2i": 0.558,
    "andrespmd_mscoco1k_zeroshot_r1_i2t": 0.261,
    "andrespmd_mscoco1k_zeroshot_r1_t2i": 0.480,
}


class AIServiceClient:
    def __init__(self, base_url: str, timeout_sec: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.timeout_sec = timeout_sec

    def embed_image(self, image_path: Path) -> tuple[list[float], float]:
        url = f"{self.base_url}/inference/embed/image"
        start = time.perf_counter()
        with open(image_path, "rb") as f:
            files = {"file": (image_path.name, f, "image/jpeg")}
            resp = httpx.post(url, files=files, timeout=self.timeout_sec)
        latency_ms = (time.perf_counter() - start) * 1000

        if resp.status_code != 200:
            raise RuntimeError(f"embed_image failed ({resp.status_code}): {resp.text}")
        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise RuntimeError(f"Invalid embed_image response schema: {data}")
        return vector, latency_ms

    def embed_text(self, query_text: str) -> tuple[list[float], float]:
        url = f"{self.base_url}/inference/embed/text"
        start = time.perf_counter()
        resp = httpx.post(url, json={"query_text": query_text}, timeout=self.timeout_sec)
        latency_ms = (time.perf_counter() - start) * 1000

        if resp.status_code != 200:
            raise RuntimeError(f"embed_text failed ({resp.status_code}): {resp.text}")
        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise RuntimeError(f"Invalid embed_text response schema: {data}")
        return vector, latency_ms


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


def cosine_similarity_matrix(query_vectors: np.ndarray, corpus_vectors: np.ndarray) -> np.ndarray:
    query_norm = query_vectors / np.linalg.norm(query_vectors, axis=1, keepdims=True)
    corpus_norm = corpus_vectors / np.linalg.norm(corpus_vectors, axis=1, keepdims=True)
    return query_norm @ corpus_norm.T


def main() -> None:
    parser = argparse.ArgumentParser(description="Chạy benchmark Flickr30K (image-to-text + text-to-image)")
    parser.add_argument("--ai_service_url", type=str, default="http://localhost:8001", help="URL AIModule")
    parser.add_argument("--top_k", type=int, default=10, help="Top-K dùng cho Precision/Recall/HitRate")
    args = parser.parse_args()

    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy {METADATA_PATH}. Chạy download_flickr30k.py trước.")

    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    image_ids = list(metadata.keys())
    logger.info("Đã nạp metadata: %d ảnh.", len(image_ids))

    client = AIServiceClient(base_url=args.ai_service_url)

    # ===== Embed toàn bộ ảnh (1 lần duy nhất) =====
    logger.info("Đang embed %d ảnh qua AIModule (%s)...", len(image_ids), args.ai_service_url)
    image_vectors: list[list[float]] = []
    image_embed_latencies: list[float] = []
    for idx, img_id in enumerate(image_ids):
        image_path = IMAGES_DIR / metadata[img_id]["filename"]
        vec, latency = client.embed_image(image_path)
        image_vectors.append(vec)
        image_embed_latencies.append(latency)
        if (idx + 1) % 100 == 0:
            logger.info("  Đã embed %d/%d ảnh...", idx + 1, len(image_ids))
    image_vectors_np = np.array(image_vectors, dtype=np.float32)

    # ===== Danh sách caption phẳng (mọi caption của mọi ảnh) =====
    all_captions: list[str] = []
    caption_to_image_id: list[str] = []
    for img_id in image_ids:
        for cap in metadata[img_id]["captions"]:
            all_captions.append(cap)
            caption_to_image_id.append(img_id)

    # ===== Embed toàn bộ caption (1 lần duy nhất, dùng chung cho cả 2 chiều) =====
    logger.info("Đang embed %d caption qua AIModule...", len(all_captions))
    caption_vectors: list[list[float]] = []
    caption_latencies: list[float] = []
    for idx, cap in enumerate(all_captions):
        vec, latency = client.embed_text(cap)
        caption_vectors.append(vec)
        caption_latencies.append(latency)
        if (idx + 1) % 200 == 0:
            logger.info("  Đã embed %d/%d caption...", idx + 1, len(all_captions))
    caption_vectors_np = np.array(caption_vectors, dtype=np.float32)

    # ===== Task 2a: image-to-text =====
    # Ground truth: caption "đúng" là caption thuộc CHÍNH ảnh đó (trong
    # số 5 caption gốc). Query = 1 ảnh, corpus = toàn bộ caption.
    logger.info("Đang tính image-to-text...")
    sim_i2t = cosine_similarity_matrix(image_vectors_np, caption_vectors_np)
    i2t_query_results = []
    for i, img_id in enumerate(image_ids):
        ranked_caption_indices = np.argsort(-sim_i2t[i]).tolist()
        relevant_indices = {j for j, owner_id in enumerate(caption_to_image_id) if owner_id == img_id}
        i2t_query_results.append({"ranked_ids": ranked_caption_indices, "relevant_ids": relevant_indices})
    i2t_metrics = compute_metrics(i2t_query_results, k=args.top_k)

    # ===== Task 2b: text-to-image =====
    # Ground truth: đúng DUY NHẤT 1 ảnh mà caption đó thuộc về (chuẩn
    # academic Flickr30K/MS-COCO retrieval). Query = 1 caption, corpus
    # = toàn bộ ảnh.
    logger.info("Đang tính text-to-image...")
    sim_t2i = cosine_similarity_matrix(caption_vectors_np, image_vectors_np)
    image_id_to_index = {img_id: idx for idx, img_id in enumerate(image_ids)}
    t2i_query_results = []
    for i, owner_img_id in enumerate(caption_to_image_id):
        ranked_image_indices = np.argsort(-sim_t2i[i]).tolist()
        relevant_index = {image_id_to_index[owner_img_id]}
        t2i_query_results.append({"ranked_ids": ranked_image_indices, "relevant_ids": relevant_index})
    t2i_metrics = compute_metrics(t2i_query_results, k=args.top_k)

    # ===== Task 3: Latency =====
    latency_stats = {
        "avg_image_embed_latency_ms": sum(image_embed_latencies) / len(image_embed_latencies),
        "avg_text_embed_latency_ms": sum(caption_latencies) / len(caption_latencies),
        "total_images": len(image_ids),
        "total_captions": len(all_captions),
    }

    result = {
        "dataset_info": {
            "name": "Flickr30K (subset, Karpathy test split via nlphuji/flickr30k)",
            "sample_size": len(image_ids),
            "total_captions": len(all_captions),
            "top_k": args.top_k,
        },
        "image_to_text": i2t_metrics,
        "text_to_image": t2i_metrics,
        "latency": latency_stats,
        "comparison_with_own_dataset": {
            "own_dataset": OWN_DATASET_BENCHMARK,
            "flickr30k_image_to_text": i2t_metrics,
            "flickr30k_text_to_image": t2i_metrics,
        },
        "reference_benchmarks": REFERENCE_BENCHMARKS,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    logger.info("=" * 60)
    logger.info("KẾT QUẢ BENCHMARK FLICKR30K")
    logger.info("Image-to-Text: MRR=%.4f HitRate=%.4f Precision=%.4f Recall=%.4f",
                i2t_metrics["mrr"], i2t_metrics["hit_rate"], i2t_metrics["precision"], i2t_metrics["recall"])
    logger.info("Text-to-Image: MRR=%.4f HitRate=%.4f Precision=%.4f Recall=%.4f",
                t2i_metrics["mrr"], t2i_metrics["hit_rate"], t2i_metrics["precision"], t2i_metrics["recall"])
    logger.info("Avg image embed latency: %.2f ms", latency_stats["avg_image_embed_latency_ms"])
    logger.info("Avg text embed latency: %.2f ms", latency_stats["avg_text_embed_latency_ms"])
    logger.info("Kết quả đầy đủ: %s", OUTPUT_PATH)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()