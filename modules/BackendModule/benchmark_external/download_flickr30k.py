"""
download_flickr30k.py
======================
Task 1 (GopY_29_07.md): Tải và lấy mẫu ngẫu nhiên tập con Flickr30K để
làm bộ dữ liệu thực nghiệm bổ sung — chạy HOÀN TOÀN ĐỘC LẬP với hạ tầng
SISE (không upload qua MinIO, không ghi PostgreSQL, không đi qua
BackendModule). Quyết định kiến trúc: dataset công khai chỉ dùng để
kiểm nghiệm khoa học, không mô phỏng hành vi người dùng thật của hệ
thống — xem ghi chú bàn bạc với Project Owner.

Nguồn dữ liệu: nlphuji/flickr30k trên Hugging Face.

LƯU Ý KỸ THUẬT QUAN TRỌNG (đã xác nhận qua thực nghiệm thật, không phải
suy đoán): kể từ datasets>=4.0.0, thư viện Hugging Face 'datasets' đã
LOẠI BỎ HOÀN TOÀN cơ chế "dataset loading script" (file flickr30k.py mà
repo này dùng) — datasets.load_dataset("nlphuji/flickr30k", ...) sẽ
raise RuntimeError: "Dataset scripts are no longer supported". Đây là
breaking change vĩnh viễn từ phía Hugging Face, KHÔNG PHẢI lỗi máy/môi
trường. Giải pháp: tải trực tiếp 2 file thô mà chính repo này cung cấp
sẵn (xác nhận qua file listing thật của nlphuji/flickr30k):
  - flickr_annotations_30k.csv (12.9 MB) — chứa caption + tên file ảnh
  - flickr30k-images.zip (4.39 GB) — toàn bộ ảnh gốc, nén ZIP
Dùng huggingface_hub.hf_hub_download() để tải 2 file này (không qua
datasets.load_dataset()), tự giải nén ZIP + parse CSV bằng pandas.

Cách chạy:
    pip install huggingface_hub pandas pillow --break-system-packages
    python download_flickr30k.py --sample_size 1000 --seed 42

Output:
    benchmark_external/data/flickr30k_sample/
        images/<img_id>.jpg          <- ảnh đã lấy mẫu
        metadata.json                 <- {img_id: {filename, captions: [...]}}
"""

from __future__ import annotations

import argparse
import json
import logging
import random
import zipfile
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(__file__).parent / "data" / "flickr30k_sample"
IMAGES_DIR = OUTPUT_DIR / "images"
METADATA_PATH = OUTPUT_DIR / "metadata.json"
RAW_CACHE_DIR = Path(__file__).parent / "data" / "raw_cache"

REPO_ID = "nlphuji/flickr30k"
ANNOTATIONS_FILENAME = "flickr_annotations_30k.csv"
IMAGES_ZIP_FILENAME = "flickr30k-images.zip"


def download_raw_files() -> tuple[Path, Path]:
    """Tải 2 file thô (CSV annotation + ZIP ảnh) trực tiếp từ Hugging
    Face Hub bằng hf_hub_download() — KHÔNG dùng datasets.load_dataset()
    vì cơ chế loading script của repo này đã bị deprecated vĩnh viễn."""
    try:
        from huggingface_hub import hf_hub_download
    except ImportError as exc:
        raise RuntimeError(
            "Thiếu thư viện 'huggingface_hub'. Cài đặt bằng: "
            "pip install huggingface_hub pandas pillow --break-system-packages"
        ) from exc

    RAW_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Đang tải %s (annotation, ~13MB)...", ANNOTATIONS_FILENAME)
    csv_path = hf_hub_download(
        repo_id=REPO_ID,
        filename=ANNOTATIONS_FILENAME,
        repo_type="dataset",
        local_dir=str(RAW_CACHE_DIR),
    )

    logger.info("Đang tải %s (ảnh, ~4.4GB — có thể mất vài phút)...", IMAGES_ZIP_FILENAME)
    zip_path = hf_hub_download(
        repo_id=REPO_ID,
        filename=IMAGES_ZIP_FILENAME,
        repo_type="dataset",
        local_dir=str(RAW_CACHE_DIR),
    )

    return Path(csv_path), Path(zip_path)


def download_and_sample(sample_size: int, seed: int) -> None:
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError(
            "Thiếu thư viện 'pandas'. Cài đặt bằng: "
            "pip install huggingface_hub pandas pillow --break-system-packages"
        ) from exc

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    csv_path, zip_path = download_raw_files()

    logger.info("Đang đọc annotation CSV...")
    df = pd.read_csv(csv_path)
    # Xác nhận cấu trúc cột thật của flickr_annotations_30k.csv trước khi
    # dùng — file này có cột "raw" (chuỗi list caption dạng string hoặc
    # JSON-like) và "filename". Parse phòng thủ cả 2 khả năng.
    logger.info("Các cột có trong CSV: %s", list(df.columns))

    random.seed(seed)
    total_rows = len(df)
    sample_indices = random.sample(range(total_rows), min(sample_size, total_rows))
    df_sample = df.iloc[sample_indices]

    logger.info("Đang giải nén %d ảnh cần thiết từ ZIP (%s)...", len(df_sample), zip_path)
    filenames_needed = set(df_sample["filename"].astype(str))

    with zipfile.ZipFile(zip_path, "r") as zf:
        zip_namelist = zf.namelist()
        # Ảnh trong ZIP thường nằm trong 1 thư mục con (ví dụ
        # "flickr30k-images/xxxx.jpg") — tìm đúng đường dẫn thật bằng
        # cách khớp phần đuôi tên file, không giả định cấu trúc thư mục.
        name_lookup = {Path(n).name: n for n in zip_namelist if not n.endswith("/")}

        extracted_count = 0
        for fname in filenames_needed:
            zip_internal_name = name_lookup.get(fname)
            if zip_internal_name is None:
                logger.warning("Không tìm thấy %s trong ZIP, bỏ qua.", fname)
                continue
            target_path = IMAGES_DIR / fname
            with zf.open(zip_internal_name) as src, open(target_path, "wb") as dst:
                dst.write(src.read())
            extracted_count += 1
            if extracted_count % 100 == 0:
                logger.info("  Đã giải nén %d/%d ảnh...", extracted_count, len(filenames_needed))

    logger.info("Đã giải nén %d ảnh.", extracted_count)

    logger.info("Đang xây dựng metadata.json...")
    metadata: dict[str, dict] = {}
    for _, row in df_sample.iterrows():
        filename = str(row["filename"])
        if not (IMAGES_DIR / filename).exists():
            continue

        img_id = Path(filename).stem
        raw_captions = row.get("raw", row.get("caption", row.get("captions", "")))
        captions = _parse_captions(raw_captions)

        metadata[img_id] = {
            "filename": filename,
            "captions": captions,
        }

    METADATA_PATH.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    logger.info("Hoàn tất. Ảnh lưu tại: %s", IMAGES_DIR)
    logger.info("Metadata lưu tại: %s", METADATA_PATH)
    logger.info(
        "Tổng số ảnh: %d, tổng số caption: %d",
        len(metadata), sum(len(v["captions"]) for v in metadata.values()),
    )


def _parse_captions(raw_value) -> list[str]:
    """
    Cột caption trong flickr_annotations_30k.csv có thể ở nhiều định
    dạng tùy phiên bản file (chuỗi Python-list-literal, JSON array, hoặc
    đã là list thật nếu pandas tự parse) — xử lý phòng thủ cả 3 trường
    hợp thay vì giả định 1 định dạng cố định.
    """
    if isinstance(raw_value, list):
        return [str(c) for c in raw_value]

    text = str(raw_value).strip()
    if not text:
        return []

    # Thử parse như Python literal list trước (ví dụ "['a caption', 'b caption']")
    try:
        import ast
        parsed = ast.literal_eval(text)
        if isinstance(parsed, list):
            return [str(c) for c in parsed]
    except (ValueError, SyntaxError):
        pass

    # Thử parse như JSON
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(c) for c in parsed]
    except json.JSONDecodeError:
        pass

    # Fallback: coi toàn bộ chuỗi là 1 caption duy nhất
    return [text]


def main() -> None:
    parser = argparse.ArgumentParser(description="Tải và lấy mẫu Flickr30K cho benchmark bổ sung")
    parser.add_argument("--sample_size", type=int, default=1000, help="Số lượng ảnh cần lấy mẫu (mặc định 1000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed để tái lập kết quả")
    args = parser.parse_args()

    download_and_sample(sample_size=args.sample_size, seed=args.seed)


if __name__ == "__main__":
    main()