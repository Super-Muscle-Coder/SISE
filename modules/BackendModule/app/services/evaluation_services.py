"""
Evaluation Workflow Service (Business Logic Layer)
"""

from __future__ import annotations

import logging
import mimetypes
import re
from typing import Optional, Any

import httpx

from app.adapters.evaluation_adapters import EvaluationAdapter
from app.adapters.upload_adapters import MinIOAdapter

logger = logging.getLogger(__name__)

# Số lượng tag chung tối thiểu (sau chuẩn hóa) để 2 ảnh được coi là cùng
# đối tượng/danh tính. QUYẾT ĐỊNH THIẾT KẾ (Project Owner): mỗi ảnh chỉ
# được gắn ĐÚNG 1 TAG DUY NHẤT, mang ý nghĩa định danh người trong ảnh
# (ví dụ toàn bộ ảnh trong album Elon Musk đều có tag "Elon Musk") — mô
# phỏng đúng cách các nền tảng ảnh chuyên nghiệp thường chỉ gắn tag định
# danh, không gắn nhiều tag mô tả phụ. Vì mỗi ảnh chỉ có tối đa 1 tag,
# ngưỡng hợp lý là >= 1 — 2 ảnh được coi là cùng đối tượng khi và chỉ
# khi tag định danh (sau chuẩn hóa) khớp nhau tuyệt đối.
MIN_SHARED_TAGS_THRESHOLD = 1


def normalize_tag(raw_tag: str) -> str:
    """
    Chuẩn hóa 1 tag để so khớp: lowercase, bỏ khoảng trắng thừa ở đầu/
    cuối, thu gọn khoảng trắng bên trong về 1 dấu cách, bỏ ký tự không
    phải chữ/số/khoảng trắng (dấu câu, ký tự đặc biệt).

    GIỚI HẠN ĐÃ BIẾT: hàm này CHỈ xử lý biến thể viết hoa/thường, khoảng
    trắng, dấu câu (ví dụ "Lionel Messi" == "lionel   messi", "GOAT" ==
    "goat."). KHÔNG xử lý viết tắt hoàn toàn khác chữ cái (ví dụ "MJ" sẽ
    KHÔNG được nhận diện là cùng đối tượng với "michael jackson" — 2
    chuỗi này không có overlap ký tự nào để thuật toán chuẩn hóa dựa vào)
    và KHÔNG tự sửa lỗi chính tả (ví dụ "Mesi" sẽ KHÔNG khớp "Messi").
    Đây là hạn chế thiết kế đã được Project Owner xác nhận chấp nhận —
    xử lý viết tắt/lỗi chính tả cần 1 bảng alias thủ công hoặc thuật toán
    fuzzy distance phức tạp hơn, nằm ngoài phạm vi benchmark hiện tại.
    """
    if not raw_tag:
        return ""
    normalized = raw_tag.strip().lower()
    normalized = re.sub(r"[^\w\s]", "", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def normalize_tag_set(raw_tags: list[str]) -> set[str]:
    """Chuẩn hóa 1 danh sách tag thô thành set các tag đã chuẩn hóa, bỏ chuỗi rỗng."""
    return {normalize_tag(t) for t in raw_tags if normalize_tag(t)}


def is_relevant(
    query_tags_normalized: set[str],
    query_album_id: Optional[int],
    candidate_tags_normalized: set[str],
    candidate_album_id: Optional[int],
) -> bool:
    """
    Ground truth builder — xác định ảnh candidate có được coi là "đúng"
    (relevant) so với ảnh query hay không.

    Thiết kế đã thống nhất với Project Owner (mô hình 1-tag-định-danh):
      1. ĐIỀU KIỆN CHÍNH: query và candidate có tag định danh khớp nhau
         (sau chuẩn hóa, >= MIN_SHARED_TAGS_THRESHOLD=1) -> ĐÚNG, bất kể
         album_id có khớp hay không. Tag là tín hiệu định danh trực
         tiếp, đáng tin cậy hơn album_id (vốn chỉ là 1 "thùng chứa"
         người dùng tự phân loại, dễ bấm nhầm — ví dụ ảnh Michael
         Jackson bị lưu nhầm vào album Elon Musk vẫn phải được tính
         đúng nếu tag định danh khớp).
      2. FALLBACK (chỉ áp dụng khi QUERY hoàn toàn không có tag nào):
         cùng album_id -> ĐÚNG. Đây là phương án dự phòng duy nhất khi
         không còn tín hiệu nào khác để dựa vào — CHẤP NHẬN RỦI RO ảnh
         có thể bị để nhầm album (hạn chế đã biết, không có trường name/
         description để đối chiếu thêm).
    """
    if query_tags_normalized:
        shared = query_tags_normalized & candidate_tags_normalized
        return len(shared) >= MIN_SHARED_TAGS_THRESHOLD

    # Query không có tag nào -> fallback duy nhất là album_id.
    if query_album_id is not None and candidate_album_id is not None:
        return query_album_id == candidate_album_id

    return False


class EvaluationService:
    def __init__(
        self,
        evaluation_adapter: EvaluationAdapter,
        minio_adapter: MinIOAdapter,
        ai_service_url: str,
        vector_service_base_url: str,
        http_timeout_sec: int = 30,
        eval_max_images: int = 100,
        top_k: int = 10,
    ):
        self.evaluation_adapter = evaluation_adapter
        self.minio_adapter = minio_adapter
        self.ai_service_url = ai_service_url.rstrip("/")
        self.vector_service_base_url = vector_service_base_url.rstrip("/")
        self.http_timeout_sec = http_timeout_sec
        self.eval_max_images = eval_max_images
        self.top_k = top_k

    async def _fetch_image_bytes(self, bucket_name: str, object_name: str) -> bytes:
        response = self.minio_adapter.client.get_object(
            bucket_name=bucket_name,
            object_name=object_name,
        )
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    async def _request_embedding(
        self,
        image_bytes: bytes,
        filename: str,
        bearer_token: str,
    ) -> list[float]:
        url = f"{self.ai_service_url}/inference/embed/image"
        # Suy ra content-type thật từ đuôi file (image/jpeg, image/png...)
        # thay vì hardcode "application/octet-stream" — AIModule validate
        # chặt content-type của phần multipart và từ chối request với
        # 400 ERR_INVALID_CONTENT_TYPE nếu không nhận diện được định dạng.
        guessed_type, _ = mimetypes.guess_type(filename)
        content_type = guessed_type or "image/jpeg"
        files = {"file": (filename, image_bytes, content_type)}
        headers = {"Authorization": f"Bearer {bearer_token}"}
        async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
            resp = await client.post(url, files=files, headers=headers)

        if resp.status_code >= 400:
            raise RuntimeError(f"Embedding request failed ({resp.status_code})")

        data = resp.json()
        vector = data.get("vector")
        if not isinstance(vector, list):
            raise RuntimeError("Invalid embedding response schema")
        return vector

    async def _search_hybrid(
        self,
        vector: list[float],
        bearer_token: str,
    ) -> list[dict[str, Any]]:
        """
        Trả về list các dict {"image_id": str, "score": float} theo đúng
        thứ tự rank (vị trí 0 = hạng 1). Giữ lại "score" (cosine similarity,
        thang 0.0-1.0, đúng field SearchResultItem.score đã dùng nhất
        quán ở workflow search) — cần cho Frontend vẽ biểu đồ phân bố
        score trong misclassified_queries.top_k_results (yêu cầu bổ sung
        từ AG-04, không đổi ý nghĩa/đơn vị score so với các nơi khác
        trong hệ thống).
        """
        url = f"{self.vector_service_base_url}/vector/search/hybrid"
        payload = {
            "vector": vector,
            "top_k": self.top_k,
            "metric": "COSINE",
            "filter": None,
        }
        headers = {"Authorization": f"Bearer {bearer_token}"}
        async with httpx.AsyncClient(timeout=self.http_timeout_sec) as client:
            resp = await client.post(url, json=payload, headers=headers)

        if resp.status_code >= 400:
            raise RuntimeError(f"Vector search failed ({resp.status_code})")

        data = resp.json()
        items = data.get("results", [])
        ranked_results: list[dict[str, Any]] = []
        for item in items:
            image_id = item.get("image_id")
            score = item.get("score")
            if isinstance(image_id, str) and isinstance(score, (int, float)):
                ranked_results.append({"image_id": image_id, "score": float(score)})
        return ranked_results

    # ===== GIỮ NGUYÊN CÔNG THỨC (không đổi theo yêu cầu Project Owner) =====
    def compute_mrr(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results:
            return 0.0
        reciprocal_ranks: list[float] = []
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            rr = 0.0
            for idx, candidate_id in enumerate(ranked_ids, start=1):
                if candidate_id in relevant_ids:
                    rr = 1.0 / idx
                    break
            reciprocal_ranks.append(rr)
        return float(sum(reciprocal_ranks) / len(reciprocal_ranks))

    def compute_hit_rate(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results:
            return 0.0
        hits = 0
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            if any(candidate_id in relevant_ids for candidate_id in ranked_ids):
                hits += 1
        return float(hits / len(query_results))

    def compute_precision_at_k(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results or k <= 0:
            return 0.0
        precisions: list[float] = []
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            if not ranked_ids:
                precisions.append(0.0)
                continue
            hit_count = sum(1 for candidate_id in ranked_ids if candidate_id in relevant_ids)
            precisions.append(hit_count / k)
        return float(sum(precisions) / len(precisions))

    def compute_recall(self, query_results: list[dict[str, Any]], k: int) -> float:
        if not query_results:
            return 0.0
        recalls: list[float] = []
        for result in query_results:
            ranked_ids = result.get("ranked_ids", [])[:k]
            relevant_ids = set(result.get("relevant_ids", set()))
            if not relevant_ids:
                recalls.append(0.0)
                continue
            hit_count = sum(1 for candidate_id in ranked_ids if candidate_id in relevant_ids)
            recalls.append(hit_count / len(relevant_ids))
        return float(sum(recalls) / len(recalls))

    def compute_metrics_from_queries(
        self,
        query_results: list[dict[str, Any]],
        k: int,
    ) -> dict[str, float]:
        return {
            "mrr": self.compute_mrr(query_results, k),
            "hit_rate": self.compute_hit_rate(query_results, k),
            "precision": self.compute_precision_at_k(query_results, k),
            "recall": self.compute_recall(query_results, k),
        }
    # ===== HẾT PHẦN CÔNG THỨC GIỮ NGUYÊN =====

    async def _build_ground_truth_for_query(
        self,
        query_image_id: str,
        query_tags_raw: list[str],
        query_album_id: Optional[int],
        ranked_ids: list[str],
    ) -> tuple[set[str], dict[str, dict[str, Any]]]:
        """
        Xây tập "relevant_ids" cho 1 query cụ thể, dựa trên ground truth
        tag-định-danh. Ảnh mẫu (query_image_id) LUÔN bị loại khỏi tập
        relevant — chuẩn academic, không tự đếm chính mình.

        Trả về CẢ metadata_map (tags/album_id của từng candidate) để tái
        sử dụng cho việc xác định "class thật" của top-1 khi build
        cross-class confusion matrix — tránh phải query DB lần thứ 2 cho
        cùng 1 danh sách candidate_ids.

        Chỉ cần lấy metadata của các ảnh THỰC SỰ xuất hiện trong top_k
        kết quả search (ranked_ids) — không cần quét toàn bộ database,
        giữ chi phí tính toán ở mức O(top_k) mỗi query.
        """
        query_tags_normalized = normalize_tag_set(query_tags_raw)

        candidate_ids = [cid for cid in ranked_ids if cid != query_image_id]
        if not candidate_ids:
            return set(), {}

        metadata_map = await self.evaluation_adapter.fetch_metadata_for_images(candidate_ids)

        relevant_ids: set[str] = set()
        for candidate_id in candidate_ids:
            meta = metadata_map.get(candidate_id)
            if meta is None:
                # Ảnh có thể đã bị xóa mềm giữa lúc search và lúc build
                # ground truth (race condition hiếm) — bỏ qua an toàn,
                # không tính là relevant.
                continue

            candidate_tags_normalized = normalize_tag_set(meta["tags"])
            candidate_album_id = meta["album_id"]

            if is_relevant(
                query_tags_normalized=query_tags_normalized,
                query_album_id=query_album_id,
                candidate_tags_normalized=candidate_tags_normalized,
                candidate_album_id=candidate_album_id,
            ):
                relevant_ids.add(candidate_id)

        return relevant_ids, metadata_map

    def _get_candidate_class_label(self, meta: Optional[dict[str, Any]]) -> str:
        """
        Suy ra "nhãn class" của 1 ảnh candidate từ metadata đã fetch —
        dùng tag định danh đã chuẩn hóa (giống hệt cách gán query_tag_label
        cho ảnh mẫu), để 2 nhãn có thể so sánh trực tiếp trong confusion
        matrix. Trả "(deleted)" nếu ảnh đã bị xóa mềm giữa lúc search và
        lúc build ground truth (race condition hiếm), "(no_tag)" nếu ảnh
        tồn tại nhưng không có tag nào.
        """
        if meta is None:
            return "(deleted)"
        normalized_tags = normalize_tag_set(meta["tags"])
        return next(iter(normalized_tags), "(no_tag)")

    async def trigger_evaluation(
        self,
        created_by: int,
        bearer_token: str,
        limit: Optional[int] = None,
        seed: Optional[int] = None,
    ) -> dict[str, Any]:
        effective_limit = self.eval_max_images if limit is None else min(limit, self.eval_max_images)
        if effective_limit <= 0:
            effective_limit = 1
        run = await self.evaluation_adapter.create_evaluation_run(
            created_by=created_by,
            limit_images=effective_limit,
            seed=seed,
            status="running",
        )
        eval_id = run["eval_id"]
        processed_queries = 0

        try:
            sources = await self.evaluation_adapter.fetch_ready_images_for_evaluation(
                limit=effective_limit,
                seed=seed,
            )

            query_results: list[dict[str, Any]] = []

            for src in sources:
                image_id = src["image_id"]
                bucket = src["minio_bucket"]
                object_name = src["minio_object_name"]
                query_tags_raw = src["tags"]
                query_album_id = src["album_id"]

                image_bytes = await self._fetch_image_bytes(bucket_name=bucket, object_name=object_name)
                # Dùng đúng tên file gốc (tách từ minio_object_name) thay
                # vì tự chế "<image_id>.bin" — cần đuôi file thật để
                # _request_embedding() suy ra đúng content-type.
                filename = object_name.split("/")[-1]
                vector = await self._request_embedding(
                    image_bytes=image_bytes,
                    filename=filename,
                    bearer_token=bearer_token,
                )
                search_results = await self._search_hybrid(
                    vector=vector,
                    bearer_token=bearer_token,
                )
                # Tách 2 cấu trúc từ search_results (list[{"image_id","score"}]):
                #   - ranked_ids: list[str] THUẦN TÚY, giữ đúng thứ tự rank —
                #     dùng cho compute_mrr/hit_rate/precision/recall (GIỮ
                #     NGUYÊN không đổi, đúng yêu cầu Project Owner).
                #   - ranked_scores: dict tra cứu score theo image_id — dùng
                #     riêng khi build misclassified_queries.top_k_results
                #     (yêu cầu bổ sung từ AG-04, không ảnh hưởng 4 công thức
                #     chỉ số cốt lõi).
                ranked_ids = [r["image_id"] for r in search_results]
                ranked_scores = {r["image_id"]: r["score"] for r in search_results}

                relevant_ids, metadata_map = await self._build_ground_truth_for_query(
                    query_image_id=image_id,
                    query_tags_raw=query_tags_raw,
                    query_album_id=query_album_id,
                    ranked_ids=ranked_ids,
                )

                # Ảnh mẫu bị loại khỏi ranked_ids khi tính relevant_ids đã
                # xử lý ở _build_ground_truth_for_query(), nhưng ranked_ids
                # dùng cho compute_mrr/hit_rate/precision/recall (thứ hạng
                # thật của kết quả search) GIỮ NGUYÊN đầy đủ — nếu chính
                # ảnh mẫu xuất hiện lại trong kết quả search (tự tìm thấy
                # chính nó), nó sẽ không được tính relevant (đã loại khỏi
                # relevant_ids) nên không ảnh hưởng gian lận điểm số.

                # Nhãn class cho breakdown: dùng tag định danh đã chuẩn
                # hóa nếu có, fallback về "(no_tag)" nếu ảnh mẫu không có
                # tag nào (trường hợp hiếm, dùng album fallback ở ground
                # truth nhưng vẫn cần 1 nhãn để group breakdown).
                normalized_query_tags = normalize_tag_set(query_tags_raw)
                query_tag_label = next(iter(normalized_query_tags), "(no_tag)")

                # ===== TOP-1 CROSS-CLASS CONFUSION TRACKING =====
                # Xác định class thật của ảnh xếp hạng #1 trong kết quả
                # search (bỏ qua chính ảnh mẫu nếu nó tự xuất hiện ở top-1
                # — không tính đây là "top-1", vì tự tìm lại chính mình
                # không phản ánh khả năng phân biệt các ảnh KHÁC nhau).
                # Phân biệt 2 trường hợp:
                #   - top1_class == query_tag_label: CLIP xếp đúng người
                #     ở #1, chỉ có thể lệch thứ hạng NỘI BỘ (giữa các ảnh
                #     cùng người) ảnh hưởng đến MRR, không phải nhầm lẫn
                #     thật giữa các người khác nhau.
                #   - top1_class != query_tag_label: NHẦM LẪN LIÊN-CLASS
                #     THẬT — CLIP xếp 1 người khác lên vị trí cao nhất.
                top1_image_id: Optional[str] = None
                top1_class_label: Optional[str] = None
                for candidate_id in ranked_ids:
                    if candidate_id == image_id:
                        continue
                    top1_image_id = candidate_id
                    top1_class_label = self._get_candidate_class_label(metadata_map.get(candidate_id))
                    break

                is_cross_class_confusion = (
                    top1_class_label is not None and top1_class_label != query_tag_label
                )

                query_results.append(
                    {
                        "ranked_ids": ranked_ids,
                        "ranked_scores": ranked_scores,
                        "relevant_ids": relevant_ids,
                        "query_tag_label": query_tag_label,
                        "query_image_id": image_id,
                        "top1_image_id": top1_image_id,
                        "top1_class_label": top1_class_label,
                        "is_cross_class_confusion": is_cross_class_confusion,
                    }
                )
                processed_queries += 1

            metrics = self.compute_metrics_from_queries(query_results=query_results, k=self.top_k)

            # Breakdown theo class (tag định danh của ảnh mẫu) — chỉ tính
            # trong bộ nhớ cho lần chạy này, KHÔNG lưu vào DB (quyết định
            # Project Owner: đủ dùng để phân tích ngay, không cần bền
            # vững qua các lần chạy khác nhau). "Class" = tag định danh
            # đầu tiên của ảnh mẫu (mô hình 1-tag-duy-nhất đã thống nhất
            # — mỗi ảnh chỉ có 1 tag, nên query_tags_raw luôn có 0 hoặc
            # 1 phần tử).
            breakdown_by_class: dict[str, dict[str, Any]] = {}
            class_to_results: dict[str, list[dict[str, Any]]] = {}
            for qr in query_results:
                class_name = qr["query_tag_label"]
                class_to_results.setdefault(class_name, []).append(qr)

            for class_name, results_for_class in class_to_results.items():
                class_metrics = self.compute_metrics_from_queries(
                    query_results=results_for_class, k=self.top_k
                )
                confusions_in_class = sum(
                    1 for qr in results_for_class if qr["is_cross_class_confusion"]
                )
                breakdown_by_class[class_name] = {
                    "query_count": len(results_for_class),
                    "mrr": class_metrics["mrr"],
                    "hit_rate": class_metrics["hit_rate"],
                    "precision": class_metrics["precision"],
                    "recall": class_metrics["recall"],
                    "top1_cross_class_confusion_rate": confusions_in_class / len(results_for_class),
                }

            # ===== CHỈ SỐ TOÀN CỤC: TOP-1 CROSS-CLASS CONFUSION RATE =====
            # Tỷ lệ % query mà CLIP xếp 1 người KHÁC lên vị trí #1 — đây
            # là chỉ số tách bạch "nhầm lẫn liên-class thật" (đáng lo,
            # CLIP không phân biệt được 2 người khác nhau) khỏi "lệch thứ
            # hạng nội bộ" (CLIP vẫn nhận đúng người, chỉ không xếp đúng
            # ảnh "giống nhất" lên đầu — nguyên nhân MRR < 1.0 dù
            # Precision/Recall/HitRate đều cao).
            total_confusions = sum(1 for qr in query_results if qr["is_cross_class_confusion"])
            top1_cross_class_confusion_rate = (
                total_confusions / len(query_results) if query_results else 0.0
            )

            # ===== MA TRẬN NHẦM LẪN LIÊN-CLASS =====
            # {class_thật_của_query: {class_mà_CLIP_nhầm_sang: số_lần}}
            # Chỉ ghi nhận các trường hợp THỰC SỰ nhầm lẫn (is_cross_class_confusion=True)
            # — cho biết chính xác cặp class nào hay bị nhầm với nhau,
            # dùng để xác nhận/bác bỏ giả thuyết "vùng nhầm lẫn thiết kế
            # sẵn" (ví dụ Musk/Jobs/Zuckerberg/Faker cùng phong cách).
            confusion_matrix: dict[str, dict[str, int]] = {}
            for qr in query_results:
                if not qr["is_cross_class_confusion"]:
                    continue
                true_class = qr["query_tag_label"]
                confused_with = qr["top1_class_label"]
                confusion_matrix.setdefault(true_class, {})
                confusion_matrix[true_class][confused_with] = (
                    confusion_matrix[true_class].get(confused_with, 0) + 1
                )

            # ===== CHI TIẾT CÁC QUERY BỊ PHÂN LOẠI SAI (kèm minio_url) =====
            # Chỉ sinh presigned URL cho ảnh mẫu + top_k kết quả của CÁC
            # QUERY BỊ NHẦM LẪN LIÊN-CLASS (không phải toàn bộ 500 query)
            # — cân bằng giữa tốc độ response và giá trị quan sát bằng
            # mắt, vì đây chính là các case đáng xem nhất để Project Owner
            # tự đối chiếu bằng thị giác con người (ví dụ ảnh CLIP nhầm
            # lẫn có góc chụp/ánh sáng/trang phục gây nhiễu thế nào).
            misclassified_query_ids = [
                qr["query_image_id"] for qr in query_results if qr["is_cross_class_confusion"]
            ]
            # Metadata của CHÍNH các ảnh mẫu bị nhầm (khác với metadata_map
            # trong vòng lặp chính, vốn chỉ chứa candidate — ảnh mẫu luôn
            # bị loại khỏi candidate_ids ở _build_ground_truth_for_query).
            query_image_metadata_map = await self.evaluation_adapter.fetch_metadata_for_images(
                misclassified_query_ids
            )

            misclassified_queries: list[dict[str, Any]] = []
            for qr in query_results:
                if not qr["is_cross_class_confusion"]:
                    continue

                query_meta = query_image_metadata_map.get(qr["query_image_id"])
                if query_meta is None:
                    continue
                query_url = await self.minio_adapter.generate_presigned_get_url(
                    object_key=query_meta["minio_object_name"],
                    expires_in_sec=3600,
                )

                # Metadata của các candidate trong ranked_ids đã được fetch
                # 1 lần duy nhất tại _build_ground_truth_for_query() cho
                # đúng query này — nhưng vì mỗi query có metadata_map RIÊNG
                # (không lưu lại theo query), cần fetch lại đúng 1 lần nữa
                # ở đây CHỈ cho những query thuộc misclassified_queries
                # (đã lọc từ trước, không phải toàn bộ 500 query).
                candidate_ids_for_this_query = [
                    cid for cid in qr["ranked_ids"][: self.top_k] if cid != qr["query_image_id"]
                ]
                candidate_metadata_map = await self.evaluation_adapter.fetch_metadata_for_images(
                    candidate_ids_for_this_query
                )

                top10_detail: list[dict[str, Any]] = []
                for rank, candidate_id in enumerate(qr["ranked_ids"][: self.top_k], start=1):
                    if candidate_id == qr["query_image_id"]:
                        continue
                    candidate_meta = candidate_metadata_map.get(candidate_id)
                    if candidate_meta is None:
                        continue
                    candidate_url = await self.minio_adapter.generate_presigned_get_url(
                        object_key=candidate_meta["minio_object_name"],
                        expires_in_sec=3600,
                    )
                    top10_detail.append(
                        {
                            "rank": rank,
                            "image_id": candidate_id,
                            "minio_url": candidate_url,
                            "score": qr["ranked_scores"].get(candidate_id),
                            "is_relevant": candidate_id in qr["relevant_ids"],
                        }
                    )

                misclassified_queries.append(
                    {
                        "query_image_id": qr["query_image_id"],
                        "query_tag_label": qr["query_tag_label"],
                        "query_minio_url": query_url,
                        "confused_with_class": qr["top1_class_label"],
                        "top_k_results": top10_detail,
                    }
                )

            await self.evaluation_adapter.complete_evaluation_run(
                eval_id=eval_id,
                query_count=processed_queries,
                mrr=metrics["mrr"],
                hit_rate=metrics["hit_rate"],
                precision=metrics["precision"],
                recall=metrics["recall"],
            )

            return {
                "eval_id": eval_id,
                "status": "completed",
                "breakdown_by_class": breakdown_by_class,
                "top1_cross_class_confusion_rate": top1_cross_class_confusion_rate,
                "cross_class_confusion_matrix": confusion_matrix,
                "misclassified_queries": misclassified_queries,
            }

        except Exception:
            logger.exception("Evaluation run failed: eval_id=%s", eval_id)
            await self.evaluation_adapter.fail_evaluation_run(
                eval_id=eval_id,
                query_count=processed_queries,
            )
            raise

    async def get_evaluation_results(self, eval_id: str) -> Optional[dict[str, Any]]:
        row = await self.evaluation_adapter.get_evaluation_result(eval_id)
        if row is None:
            return None

        return {
            "eval_id": row["eval_id"],
            "status": row["status"],
            "mrr": float(row["mrr"] or 0.0),
            "hit_rate": float(row["hit_rate"] or 0.0),
            "precision": float(row["precision"] or 0.0),
            "recall": float(row["recall"] or 0.0),
            "query_count": int(row["query_count"] or 0),
            "completed_at": row["completed_at"],
        }

    async def get_latest_metrics(self) -> dict[str, float]:
        latest = await self.evaluation_adapter.get_latest_metrics()
        if latest is None:
            return {"mrr": 0.0, "hit_rate": 0.0, "precision": 0.0, "recall": 0.0}
        return latest


__all__ = ["EvaluationService", "normalize_tag", "normalize_tag_set", "is_relevant"]