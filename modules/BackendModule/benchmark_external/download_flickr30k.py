"""
download_flickr30k.py
======================
Task 1 (GopY_29_07.md): Tải và lấy mẫu ngẫu nhiên tập con Flickr30K để
làm bộ dữ liệu thực nghiệm bổ sung — chạy HOÀN TOÀN ĐỘC LẬP với hạ tầng
SISE (không upload qua MinIO, không ghi PostgreSQL, không đi qua
BackendModule). Quyết định kiến trúc: dataset công khai chỉ dùng để
kiểm nghiệm khoa học, không mô phỏng hành vi người dùng thật của hệ
thống — xem ghi chú bàn bạc với Project Owner.

Nguồn dữ liệu: nlphuji/flickr30k trên Hugging Face — xác nhận cấu trúc
thật qua tài liệu chính thức (KHÔNG đoán từ trí nhớ):
  - Chỉ có 1 split "test" (31,014 ảnh) trên Hugging Face Hub.
  - Field: image (PIL.Image), caption (list[str], nhiều caption/ảnh —
    thường 5 caption tiếng Anh do con người viết), filename, img_id,
    sentids, split (cột nội bộ đánh dấu train/val/test theo Karpathy
    split gốc — KHÁC với HF split, không dùng cột này để lọc).

Cách chạy:
    pip install datasets pillow --break-system-packages
    python download_flickr30k.py --sample_size 1000 --seed 42

Output:
    benchmark_external/data/flickr30k_sample/
        images/<img_id>.jpg          <- ảnh đã lấy mẫu, lưu ra đĩa cục bộ
        metadata.json                 <- {img_id: {filename, captions: [...]}}
"""

from __future__ import annotations

import argparse
import json
import logging
import random
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(__file__).parent / "data" / "flickr30k_sample"
IMAGES_DIR = OUTPUT_DIR / "images"
METADATA_PATH = OUTPUT_DIR / "metadata.json"


def download_and_sample(sample_size: int, seed: int) -> None:
    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise RuntimeError(
            "Thiếu thư viện 'datasets'. Cài đặt bằng: "
            "pip install datasets pillow --break-system-packages"
        ) from exc

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Đang tải Flickr30K từ Hugging Face (nlphuji/flickr30k, split=test)...")
    # streaming=True: KHÔNG tải toàn bộ 31k ảnh (~4GB) về đĩa trước —
    # chỉ tải đúng số lượng ảnh cần lấy mẫu, tiết kiệm thời gian/dung
    # lượng đáng kể so với tải nguyên dataset rồi mới lọc.
    dataset = load_dataset("nlphuji/flickr30k", split="test", streaming=True)

    # Vì dataset ở dạng streaming (IterableDataset), không thể random-index
    # trực tiếp. Dùng reservoir sampling để lấy mẫu ngẫu nhiên KHÔNG cần
    # duyệt hết 31k ảnh trước (dừng sớm sau khi đã thu đủ 1 buffer lớn
    # hơn sample_size, đảm bảo tính ngẫu nhiên đồng đều qua toàn bộ dataset).
    random.seed(seed)
    reservoir: list[dict] = []
    scan_limit = max(sample_size * 5, 3000)  # quét đủ rộng để đảm bảo tính ngẫu nhiên

    for idx, item in enumerate(dataset):
        if idx >= scan_limit:
            break
        if len(reservoir) < sample_size:
            reservoir.append(item)
        else:
            replace_idx = random.randint(0, idx)
            if replace_idx < sample_size:
                reservoir[replace_idx] = item
        if (idx + 1) % 1000 == 0:
            logger.info("Đã quét %d/%d ảnh...", idx + 1, scan_limit)

    if len(reservoir) < sample_size:
        logger.warning(
            "Chỉ lấy được %d/%d ảnh (dataset có thể ít hơn scan_limit).",
            len(reservoir), sample_size,
        )

    logger.info("Đã lấy mẫu %d ảnh. Đang lưu ra đĩa...", len(reservoir))

    metadata: dict[str, dict] = {}
    for item in reservoir:
        img_id = str(item["img_id"])
        image = item["image"]
        captions = list(item["caption"])
        filename = f"{img_id}.jpg"

        image_path = IMAGES_DIR / filename
        if image.mode != "RGB":
            image = image.convert("RGB")
        image.save(image_path, format="JPEG", quality=90)

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


def main() -> None:
    parser = argparse.ArgumentParser(description="Tải và lấy mẫu Flickr30K cho benchmark bổ sung")
    parser.add_argument("--sample_size", type=int, default=1000, help="Số lượng ảnh cần lấy mẫu (mặc định 1000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed để tái lập kết quả")
    args = parser.parse_args()

    download_and_sample(sample_size=args.sample_size, seed=args.seed)


if __name__ == "__main__":
    main()