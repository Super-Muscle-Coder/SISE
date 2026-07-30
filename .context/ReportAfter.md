# BÀN GIAO — Hoàn thành 6 Task theo góp ý giảng viên (GopY_29_07.md)

> Tài liệu này tổng hợp đầy đủ những gì đã thực hiện cho cả 6 Task, kèm
> số liệu thật, vị trí file kết quả, và các quyết định thiết kế quan
> trọng cần agent viết báo cáo nắm được để diễn giải chính xác.

---

## TASK 1 — Lấy mẫu Flickr30K

**Đã làm:** Viết script `download_flickr30k.py`, tải dữ liệu qua Hugging Face (`nlphuji/flickr30k`), lấy mẫu ngẫu nhiên có kiểm soát seed (`seed=42`, tái lập được).

**Số liệu:** **1000 ảnh, 5000 caption** (đúng 5 caption/ảnh do con người viết bằng tiếng Anh, chuẩn Karpathy test split).

**Chi tiết kỹ thuật đáng lưu ý cho báo cáo:** Ban đầu định dùng `datasets.load_dataset()` (cách chuẩn phổ biến), nhưng phát hiện thư viện Hugging Face `datasets` phiên bản mới (≥4.0.0) đã loại bỏ hỗ trợ cơ chế "dataset loading script" mà repo `nlphuji/flickr30k` sử dụng — đây là 1 breaking change từ phía Hugging Face, không phải lỗi thao tác. Giải pháp: tải trực tiếp 2 file gốc mà chính repo cung cấp sẵn (`flickr_annotations_30k.csv` + `flickr30k-images.zip`), tự parse bằng `pandas`/`zipfile`. Đây là 1 chi tiết nhỏ có thể đưa vào phần "khó khăn kỹ thuật gặp phải" nếu báo cáo có mục đó.

---

## TASK 2 — Benchmark Text-to-Image (bổ sung chiều truy vấn còn thiếu)

**Đã làm:** Viết `run_benchmark.py`, gọi trực tiếp AIModule (`POST /inference/embed/image`, `POST /inference/embed/text`) — **không đi qua BackendModule**, vì mục đích chỉ là đo năng lực CLIP thuần túy, không mô phỏng nghiệp vụ người dùng. Tự tính cosine similarity bằng `numpy` (không cần pgvector, vì quy mô nhỏ ~1000-5000 vector đủ để giữ toàn bộ trong RAM). Dùng **đúng 4 công thức MRR/HitRate/Precision/Recall đã cài trong `evaluation_services.py`** (copy nguyên văn sang `report_utils.py`) — đảm bảo phương pháp tính nhất quán giữa benchmark nội bộ và benchmark Flickr30K.

**Ground truth (quan trọng, cần giải thích đúng trong báo cáo):**
- **Image-to-Text:** với 1 ảnh mẫu, "đúng" là bất kỳ caption nào trong 5 caption gốc thuộc chính ảnh đó.
- **Text-to-Image:** với 1 caption mẫu, "đúng" là **duy nhất 1 ảnh** mà caption đó thuộc về — đây là quy ước chuẩn academic của Flickr30K/MS-COCO retrieval (mỗi caption chỉ map về đúng 1 ảnh gốc).

**Số liệu (ở Top-10):**

| Chiều | MRR | HitRate | Precision | Recall |
|---|---|---|---|---|
| Image-to-Text | 0.8460 | 0.9770 | 0.3594 | 0.7188 |
| Text-to-Image | 0.6823 | 0.9000 | 0.0900 | 0.9000 |

**Điểm cần giải thích đúng trong báo cáo — dễ bị hiểu nhầm là lỗi:**
`Precision@10 = 0.09` của Text-to-Image **không phải hạn chế của mô hình**, mà là **giới hạn toán học tất yếu** của chính cấu trúc ground truth 1-đối-1: vì mỗi caption chỉ có đúng 1 ảnh "đúng", `Precision@10` tối đa về lý thuyết chỉ có thể đạt `1/10 = 0.1`. Giá trị đo được `0.09` gần sát trần lý thuyết này — nghĩa là mô hình gần như luôn tìm đúng ảnh trong phạm vi top-10 (khớp với `Recall@10 = 0.9`).

**Đã bổ sung thêm (không bắt buộc nhưng làm sâu sắc phân tích):** tính đồng thời ở nhiều mức `k = {1, 5, 10}`, phân phối rank chi tiết (% câu đúng rơi vào rank 1 / rank 2-5 / rank 6-10 / ngoài top-10), độ lệch chuẩn, và khoảng tin cậy 95% bằng kỹ thuật bootstrap resampling (1000 lần lặp) — ví dụ Text-to-Image có `95% CI [0.6711, 0.6931]` cho MRR, khoảng khá hẹp cho thấy kết quả ổn định, không phải ngẫu nhiên.

**File kết quả:** `benchmark_external/output/flickr30k_results.json`

---

## TASK 3 — Latency và Resource Usage (cho CẢ 2 bộ dữ liệu)

**Đã làm:** 
1. Với Flickr30K: đo latency ngay trong lúc chạy `run_benchmark.py` (đo bằng `time.perf_counter()` bao quanh mỗi lần gọi AIModule).
2. Với dataset tự thân (1000 ảnh/20 danh tính): viết script riêng `measure_own_dataset_latency.py` — đăng nhập BackendModule thật, gọi `GET /media` lấy danh sách ảnh + presigned URL, tải ảnh tạm về, đo latency gọi AIModule (cùng phương pháp đo với Flickr30K để đảm bảo so sánh được), sau đó xóa ảnh tạm.
3. Cả 2 script đều giám sát **resource usage của container AIModule** qua `docker stats`, lấy mẫu mỗi 5 giây trong suốt quá trình chạy, chạy song song ở 1 thread riêng không chặn luồng đo chính.
4. Đo phân vị `P50/P95/P99` (không chỉ trung bình) — vì trung bình dễ bị méo bởi vài lần gọi chậm bất thường, P95/P99 phản ánh đúng "trường hợp xấu" thực tế hơn.

**Số liệu:**

| | Dataset tự thân (1000 ảnh) | Flickr30K — ảnh (1000) | Flickr30K — text (5000) |
|---|---|---|---|
| P50 | 571.5 ms | (xem file JSON) | (xem file JSON) |
| P95 | 757.8 ms | | |
| P99 | 963.2 ms | | |
| Mean | 523.5 ms | | |
| Std | 191.2 ms | | |

**Lưu ý khác biệt cần giải thích trong báo cáo:** latency dataset tự thân **bao gồm cả bước tải ảnh qua mạng từ MinIO** (presigned URL), trong khi latency Flickr30K chỉ đo bước gọi AIModule (ảnh đọc trực tiếp từ đĩa cục bộ) — đây là lý do 2 con số không hoàn toàn "cùng điều kiện đo", cần nêu rõ để tránh so sánh khập khiễng.

**File kết quả:** `benchmark_external/output/own_dataset_latency.json`, `own_dataset_docker_stats.jsonl`, và phần `latency` trong `flickr30k_results.json`.

---

## TASK 4 — Góc nhìn ngữ nghĩa tổng quát

**Đã làm:** Không cần thao tác riêng — tự động được giải quyết qua việc thực hiện Task 1+2 (benchmark trên Flickr30K với caption mô tả ngữ nghĩa tự nhiên, khác hẳn bài toán hẹp "nhận diện danh tính" của dataset tự thu thập). Đây đúng như ghi chú gốc trong `GopY_29_07.md`.

---

## TASK 5 — Nhấn giới hạn quy mô dữ liệu trong Chương 6.1

**Đã soạn câu chữ, cần agent viết báo cáo chèn vào đúng vị trí Chương 6.1 (ngay sau bảng số liệu công bố lần đầu):**

> Các chỉ số gần tuyệt đối quan sát được ở phần lớn các danh tính trong bộ dữ liệu tự thu thập (HitRate và Recall gần như đạt 1.000 tuyệt đối ở đa số các lớp) đạt được trên quy mô dữ liệu còn hạn chế (1000 ảnh, 20 danh tính, trung bình 50 ảnh/danh tính) và trong điều kiện corpus tìm kiếm chỉ giới hạn trong phạm vi các đối tượng đã được đưa vào hệ thống. Các chỉ số này chưa chắc phản ánh đúng hiệu năng của hệ thống khi mở rộng sang quy mô dữ liệu lớn hơn nhiều lần hoặc khi số lượng danh tính cần phân biệt tăng lên đáng kể.

**Lưu ý quan trọng:** số liệu dataset tự thân đã **cập nhật lên 1000 ảnh/20 danh tính** (không còn là 750 ảnh/15 danh tính hay 500 ảnh/10 danh tính như các bản nháp trước đó của báo cáo) — cần agent viết báo cáo rà soát lại toàn bộ Chương 5-6 để đảm bảo mọi con số cũ đã được thay bằng số liệu mới nhất này.

---

## TASK 6 — Công thức toán học cho chỉ số tự thiết kế

**Tên chỉ số:** Tỷ lệ nhầm lẫn liên-danh-tính tại Top-1 (Top-1 Cross-Class Confusion Rate).

**Mục đích:** Tách bạch 2 nguyên nhân khác nhau khiến MRR thấp — (1) mô hình nhầm sang đối tượng khác hoàn toàn (đáng lo), hay (2) mô hình vẫn nhận đúng đối tượng nhưng không luôn xếp đúng ảnh "giống nhất" lên hạng 1 (không đáng lo, chỉ là do đa dạng góc chụp/trang phục cố ý trong dataset).

**Công thức (định dạng LaTeX, agent viết báo cáo có thể copy trực tiếp):**

Với $Q = \{q_1, \ldots, q_n\}$ là tập truy vấn, $y_i$ là nhãn danh tính chuẩn hóa của ảnh mẫu $q_i$, $R_i$ là danh sách kết quả top-K (đã loại chính ảnh mẫu nếu tự xuất hiện), $c(r_{i,1})$ là nhãn danh tính của ảnh xếp hạng cao nhất:

```
Confused(q_i) = 1 nếu c(r_{i,1}) ≠ y_i, ngược lại = 0

Top1CrossClassConfusionRate(Q) = (1/n) * Σ Confused(q_i)  với i = 1..n
```

Ma trận nhầm lẫn (đếm cặp danh tính hay bị nhầm):
```
M[a,b] = số lần (y_i = a VÀ c(r_{i,1}) = b VÀ a ≠ b)
```

**Số liệu thật minh họa cho công thức (dataset tự thân, 1000 ảnh/20 danh tính):**

`Top1CrossClassConfusionRate = 5.3%` (53/1000 query) — trong đó tập trung mạnh nhất ở 3 danh tính thuộc nhóm tuyển thủ Esport cùng đội (đồng phục thi đấu giống hệt nhau):

| Danh tính | Tỷ lệ nhầm lẫn |
|---|---|
| Keria | 36.0% (cao nhất) |
| Gumayusi | 26.0% |
| Faker | 20.0% |

Ba người này nhầm lẫn qua lại lẫn nhau (41/53 lượt nhầm lẫn toàn dataset). Ngược lại, nhóm giả thuyết ban đầu là "dễ nhầm" (Elon Musk, Steve Jobs, Mark Zuckerberg — phong cách giản dị, bối cảnh hội nghị công nghệ tương tự) có tỷ lệ nhầm lẫn **0.0%** — cho thấy đồng phục thi đấu đồng nhất tạo tín hiệu thị giác chi phối mạnh hơn nhiều so với phong cách ăn mặc thông thường tương đồng.

**File dữ liệu chi tiết:** `benchmark_external/own_dataset_benchmark.json` (có đầy đủ breakdown theo 20 danh tính + ma trận nhầm lẫn).

---

## PHỤ LỤC — Bằng chứng chống giả mạo (đề xuất đưa vào phần Phương pháp luận hoặc Phụ lục)

Để đảm bảo tính xác thực trước hội đồng mà không cần chạy lại benchmark (30+ phút, rủi ro mạng không ổn định), đã thiết kế tách biệt 2 script:

1. **`run_benchmark.py`** — chạy 1 lần, lưu lại toàn bộ dữ liệu thô chi tiết: log từng request kèm timestamp mili-giây và mã băm SHA256 của response thật (`raw_events.jsonl`), toàn bộ vector CLIP thật 512 chiều cho mọi ảnh/caption (`embeddings_cache.npz`), và log resource usage container AIModule theo thời gian thực (`docker_stats_log.jsonl`).
2. **`generate_report.py`** — chạy trong vài giây, đọc dữ liệu thô đã lưu, tự sinh báo cáo HTML kèm biểu đồ tương tác (Plotly) — có thể chạy trực tiếp trước mặt hội đồng để chứng minh quy trình phân tích có thể tái tạo, không phải ảnh tĩnh dựng sẵn.

File báo cáo tổng hợp cuối cùng: `benchmark_external/output/report.html`.
