"""
measure_own_dataset_latency.py
================================
Task 3 (GopY_29_07.md), phần còn thiếu: đo Latency và Resource Usage
cho DATASET TỰ THÂN (1000 ảnh / 20 danh tính) — bổ sung cho phần đã có
sẵn của Flickr30K (đo trong run_benchmark.py).

THIẾT KẾ: KHÔNG chạy lại POST /eval/run (endpoint đó không trả latency
chi tiết trong response, đã audit). Thay vào đó:
  1. Đăng nhập BackendModule thật (POST /auth/login).
  2. Lấy danh sách ảnh mẫu qua GET /media (endpoint thật, đã có sẵn).
  3. Tải ảnh về TẠM THỜI qua presigned URL (minio_url trong response).
  4. Gọi thẳng AIModule (POST /inference/embed/image) để đo latency —
     CÙNG cách đo với run_benchmark.py, đảm bảo 2 bộ số liệu so sánh
     được với nhau (cùng phương pháp đo, cùng model CLIP).
  5. Giám sát docker stats container AIModule song song.
  6. Xóa ảnh tạm sau khi đo xong (không để lại rác trên đĩa).

Cách chạy:
    python measure_own_dataset_latency.py \
        --backend_url http://localhost:8000 \
        --ai_service_url http://localhost:8001 \
        --username testuser1 --password testpass123 \
        --sample_size 200

Output:
    output/own_dataset_latency.json
    output/own_dataset_docker_stats.jsonl
"""

from __future__ import annotations

import argparse
import json
import logging
import subprocess
import tempfile
import threading
import time
from pathlib import Path

import httpx

from report_utils import compute_latency_distribution_detail, compute_latency_percentiles

logging.basicConfig(level=logging.INFO, format="%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(__file__).parent / "output"
RESULT_PATH = OUTPUT_DIR / "own_dataset_latency.json"
DOCKER_STATS_PATH = OUTPUT_DIR / "own_dataset_docker_stats.jsonl"


def login(backend_url: str, username: str, password: str) -> str:
    resp = httpx.post(
        f"{backend_url.rstrip('/')}/auth/login",
        json={"username": username, "password": password},
        timeout=15.0,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Đăng nhập thất bại ({resp.status_code}): {resp.text}")
    token = resp.json().get("access_token")
    if not token:
        raise RuntimeError(f"Response đăng nhập không có access_token: {resp.json()}")
    return token


def fetch_image_list(backend_url: str, token: str, sample_size: int) -> list[dict]:
    headers = {"Authorization": f"Bearer {token}"}
    collected: list[dict] = []
    offset = 0
    limit = 100

    while len(collected) < sample_size:
        resp = httpx.get(
            f"{backend_url.rstrip('/')}/media",
            params={"offset": offset, "limit": limit},
            headers=headers,
            timeout=15.0,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"GET /media thất bại ({resp.status_code}): {resp.text}")
        data = resp.json()
        items = data.get("items", [])
        if not items:
            break
        collected.extend(items)
        offset += limit
        if len(items) < limit:
            break

    if not collected:
        raise RuntimeError(
            "GET /media không trả về ảnh nào. Xác nhận tài khoản đăng nhập "
            "có ảnh đã upload và index_status='ready'."
        )

    return collected[:sample_size]


def download_temp(minio_url: str, dest_dir: Path, filename: str) -> Path:
    resp = httpx.get(minio_url, timeout=30.0)
    if resp.status_code != 200:
        raise RuntimeError(f"Tải ảnh thất bại từ presigned URL ({resp.status_code})")
    dest_path = dest_dir / filename
    dest_path.write_bytes(resp.content)
    return dest_path


class DockerStatsMonitor:
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
                        }
                        f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        f.flush()
                except Exception as exc:
                    logger.warning("docker stats sampling failed: %s", exc)
                self._stop_event.wait(self.interval_sec)

    def start(self) -> None:
        self._thread = threading.Thread(target=self._sample_loop, daemon=True)
        self._thread.start()
        logger.info("Bắt đầu giám sát docker stats container '%s'...", self.container_name)

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=self.interval_sec + 2)
        logger.info("Đã dừng giám sát docker stats.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Đo Latency + Resource Usage cho dataset tự thân")
    parser.add_argument("--backend_url", type=str, default="http://localhost:8000")
    parser.add_argument("--ai_service_url", type=str, default="http://localhost:8001")
    parser.add_argument("--username", type=str, required=True)
    parser.add_argument("--password", type=str, required=True)
    parser.add_argument("--sample_size", type=int, default=200, help="Số ảnh lấy mẫu để đo latency (mặc định 200)")
    parser.add_argument("--ai_container_name", type=str, default="sise-ai")
    parser.add_argument("--skip_docker_stats", action="store_true")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Đang đăng nhập BackendModule...")
    token = login(args.backend_url, args.username, args.password)
    logger.info("Đăng nhập thành công.")

    logger.info("Đang lấy danh sách %d ảnh mẫu qua GET /media...", args.sample_size)
    images = fetch_image_list(args.backend_url, token, args.sample_size)
    logger.info("Đã lấy %d ảnh (yêu cầu %d — có thể ít hơn nếu dataset không đủ).", len(images), args.sample_size)

    docker_monitor = None
    if not args.skip_docker_stats:
        docker_monitor = DockerStatsMonitor(args.ai_container_name, DOCKER_STATS_PATH)
        docker_monitor.start()

    latencies_ms: list[float] = []
    errors = 0

    try:
        with tempfile.TemporaryDirectory(prefix="sise_latency_") as tmp_dir_str:
            tmp_dir = Path(tmp_dir_str)
            logger.info("Đang tải ảnh tạm về %s và đo latency embed qua AIModule...", tmp_dir)

            for idx, item in enumerate(images):
                image_id = item.get("image_id", f"unknown_{idx}")
                minio_url = item.get("minio_url")
                if not minio_url:
                    logger.warning("Ảnh %s không có minio_url, bỏ qua.", image_id)
                    errors += 1
                    continue

                try:
                    local_path = download_temp(minio_url, tmp_dir, f"{image_id}.jpg")

                    start = time.perf_counter()
                    with open(local_path, "rb") as f:
                        files = {"file": (f"{image_id}.jpg", f, "image/jpeg")}
                        resp = httpx.post(
                            f"{args.ai_service_url.rstrip('/')}/inference/embed/image",
                            files=files, timeout=30.0,
                        )
                    latency_ms = (time.perf_counter() - start) * 1000

                    if resp.status_code != 200:
                        logger.warning("embed_image lỗi cho %s (%s)", image_id, resp.status_code)
                        errors += 1
                        continue

                    latencies_ms.append(latency_ms)
                    local_path.unlink(missing_ok=True)

                    if (idx + 1) % 50 == 0:
                        logger.info("  Đã đo %d/%d ảnh...", idx + 1, len(images))

                except Exception as exc:
                    logger.warning("Lỗi khi xử lý ảnh %s: %s", image_id, exc)
                    errors += 1
                    continue

        latency_stats = compute_latency_percentiles(latencies_ms)
        latency_detail = compute_latency_distribution_detail(latencies_ms)

        result = {
            "dataset_info": {
                "name": "Dataset tự thân (1000 ảnh / 20 danh tính)",
                "sample_size_requested": args.sample_size,
                "sample_size_actual": len(images),
                "successful_measurements": len(latencies_ms),
                "errors": errors,
            },
            "latency": latency_stats,
            "latency_detail": latency_detail,
            "measured_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }

        RESULT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

        logger.info("=" * 70)
        logger.info("KẾT QUẢ LATENCY — DATASET TỰ THÂN")
        logger.info("Số ảnh đo thành công: %d/%d (lỗi: %d)", len(latencies_ms), len(images), errors)
        logger.info("Latency: P50=%.1fms P95=%.1fms P99=%.1fms Mean=%.1fms",
                    latency_stats["p50"], latency_stats["p95"], latency_stats["p99"], latency_stats["mean"])
        logger.info("Kết quả: %s", RESULT_PATH)
        logger.info("=" * 70)

    finally:
        if docker_monitor is not None:
            docker_monitor.stop()


if __name__ == "__main__":
    main()