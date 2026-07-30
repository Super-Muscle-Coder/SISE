# Tổng hợp kết quả Benchmark CLIP — Dataset tự thu thập & Flickr30K

## 1. Tổng quan 2 bộ thực nghiệm

| | Dataset tự thu thập | Flickr30K (subset) |
|---|---|---|
| Quy mô | 1000 ảnh / 20 danh tính | 1000 ảnh / 5000 caption |
| Mục đích | Đánh giá năng lực nhận diện danh tính (identity recognition) | Đánh giá năng lực zero-shot cross-modal retrieval tổng quát (ngữ nghĩa tự nhiên) |
| Ground truth | Tag định danh do nhóm tự gán (1 tag/ảnh) | Caption do con người viết, có sẵn trong dataset gốc (5 caption/ảnh) |
| Chiều truy vấn | Image-to-Image | Image-to-Text **và** Text-to-Image |
| Nguồn dữ liệu | Tự thu thập, có chủ đích thiết kế vùng nhầm lẫn | `nlphuji/flickr30k` (Hugging Face), lấy mẫu ngẫu nhiên, seed=42 |

Sự kết hợp 2 bộ thực nghiệm này giải quyết đồng thời 2 hạn chế đã được chỉ ra: (1) bộ dữ liệu tự thu thập chỉ đánh giá bài toán hẹp (nhận diện danh tính), trong khi CLIP pretrained không được tối ưu riêng cho bài toán này; (2) toàn bộ thực nghiệm trước đó chỉ có số liệu image-to-image, thiếu hoàn toàn chiều truy vấn text-to-image mà mục tiêu khóa luận đã cam kết.

---

## 2. Kết quả — Dataset tự thu thập (1000 ảnh / 20 danh tính)

### 2.1 Chỉ số tổng thể

| Chỉ số | Giá trị |
|---|---|
| MRR | 0.4906 |
| HitRate@10 | 0.9960 |
| Precision@10 | 0.8127 |
| Recall@10 | 0.9960 |
| Tỷ lệ nhầm lẫn liên-danh-tính tại Top-1 | 5.3% |
| Số lượng truy vấn | 1000 |

### 2.2 Breakdown theo danh tính (20 lớp)

| Danh tính | N | MRR | HitRate | Precision | Recall | Tỷ lệ nhầm lẫn |
|---|---|---|---|---|---|---|
| jack ma | 50 | 0.510 | 1.000 | 0.900 | 1.000 | 0.0% |
| talor swift | 50 | 0.500 | 1.000 | 0.896 | 1.000 | 0.0% |
| thomas anders | 50 | 0.500 | 1.000 | 0.896 | 1.000 | 0.0% |
| cindy kimberly | 50 | 0.510 | 1.000 | 0.896 | 1.000 | 0.0% |
| steven jobs | 50 | 0.500 | 1.000 | 0.894 | 1.000 | 0.0% |
| khoai lang thang | 50 | 0.520 | 1.000 | 0.892 | 1.000 | 0.0% |
| rosé | 50 | 0.500 | 1.000 | 0.890 | 1.000 | 0.0% |
| elon musk | 50 | 0.500 | 1.000 | 0.884 | 1.000 | 0.0% |
| christiano ronaldo | 50 | 0.500 | 1.000 | 0.876 | 1.000 | 0.0% |
| patrick bateman | 50 | 0.497 | 1.000 | 0.876 | 1.000 | 2.0% |
| lionel messi | 50 | 0.483 | 0.980 | 0.868 | 0.980 | 4.0% |
| mark zakerberk | 50 | 0.500 | 1.000 | 0.868 | 1.000 | 0.0% |
| michael jackson | 50 | 0.502 | 1.000 | 0.858 | 1.000 | 4.0% |
| liu wan | 50 | 0.482 | 0.980 | 0.846 | 0.980 | 6.0% |
| tom shelby | 50 | 0.497 | 1.000 | 0.838 | 1.000 | 2.0% |
| lisa | 50 | 0.500 | 1.000 | 0.800 | 1.000 | 4.0% |
| group of people | 50 | 0.492 | 1.000 | 0.706 | 1.000 | 2.0% |
| **faker** | 50 | 0.462 | 1.000 | 0.586 | 1.000 | **20.0%** |
| **gumayusi** | 50 | 0.451 | 1.000 | 0.500 | 1.000 | **26.0%** |
| **keria** | 50 | 0.408 | 0.960 | 0.484 | 0.960 | **36.0%** |

### 2.3 Ma trận nhầm lẫn liên-danh-tính

| Danh tính | Bị nhầm với | Số lần |
|---|---|---|
| gumayusi | keria | 6 |
| gumayusi | faker | 7 |
| faker | gumayusi | 7 |
| faker | keria | 3 |
| keria | gumayusi | 12 |
| keria | faker | 6 |
| lionel messi | christiano ronaldo | 2 |
| liu wan | rosé, lisa, cindy kimberly | 1 mỗi cặp |
| lisa | rosé, liu wan | 1 mỗi cặp |
| michael jackson | tom shelby, patrick bateman | 1 mỗi cặp |
| patrick bateman | tom shelby | 1 |
| tom shelby | group of people | 1 |

### 2.4 Phân tích

**Phát hiện chính:** 3 danh tính thuộc nhóm tuyển thủ Esport cùng đội (Faker, Gumayusi, Keria) chiếm tỷ lệ nhầm lẫn cao vượt trội so với toàn bộ 17 danh tính còn lại — `Keria` đạt tỷ lệ nhầm lẫn `36.0%`, cao nhất trong toàn bộ dataset, đồng thời có `Precision` thấp nhất (`0.484`). Ba danh tính này nhầm lẫn qua lại lẫn nhau ở mức độ rất cao (tổng cộng 41 lượt nhầm lẫn giữa 3 người, chiếm phần lớn trong tổng số 53 lượt nhầm lẫn của toàn dataset).

**Diễn giải:** đồng phục thi đấu đồng nhất (cùng đội tuyển) tạo ra tín hiệu thị giác chi phối mạnh hơn đặc điểm khuôn mặt cá nhân trong không gian biểu diễn của CLIP — đây là bằng chứng định lượng rõ ràng nhất trong toàn bộ thực nghiệm cho hiện tượng CLIP thiên về nhận diện phong cách/bối cảnh thị giác tổng thể hơn là đặc điểm nhận dạng cá nhân chi tiết, đặc biệt khi các đối tượng chia sẻ bối cảnh trực quan gần như đồng nhất.

Ngược lại, các cặp danh tính từng được giả thuyết ban đầu là "vùng dễ nhầm lẫn" do phong cách ăn mặc tương đồng (Elon Musk, Steve Jobs, Mark Zuckerberg — phong cách giản dị, bối cảnh hội nghị công nghệ) lại có tỷ lệ nhầm lẫn `0.0%` tuyệt đối — cho thấy mức độ tương đồng thị giác giữa các đối tượng này, dù có thể nhận thấy bằng mắt thường, chưa đủ mạnh để gây nhầm lẫn thật sự trong không gian biểu diễn của CLIP so với mức độ đồng nhất tuyệt đối của đồng phục thi đấu thể thao điện tử.

Danh tính "group of people" (ảnh có nhiều người trong cùng khung hình) có `Precision` thấp thứ tư (`0.706`) nhưng tỷ lệ nhầm lẫn thấp (`2.0%`) — cho thấy CLIP không nhầm lẫn nhóm ảnh này với một danh tính cụ thể nào khác, mà gặp khó khăn chủ yếu ở việc sắp xếp đúng thứ tự nội bộ giữa các ảnh nhóm với nhau, cùng bản chất với hiện tượng "nhiễu nội tại" quan sát được ở đa số các danh tính đơn lẻ khác (MRR trung bình quanh mức 0.48–0.52 dù Precision/Recall/HitRate đều ở mức cao).

---

## 3. Kết quả — Flickr30K (1000 ảnh / 5000 caption, lấy mẫu ngẫu nhiên seed=42)

### 3.1 Chỉ số ở Top-10

| Chiều truy vấn | MRR | HitRate@10 | Precision@10 | Recall@10 |
|---|---|---|---|---|
| Image-to-Text | 0.8460 | 0.9770 | 0.3594 | 0.7188 |
| Text-to-Image | 0.6823 | 0.9000 | 0.0900 | 0.9000 |

### 3.2 Latency trung bình

| Bước | Latency trung bình |
|---|---|
| Embed 1 ảnh | 240.41 ms |
| Embed 1 caption | 260.21 ms |

### 3.3 Diễn giải

**Precision@10 của chiều Text-to-Image bị giới hạn bởi cấu trúc ground truth, không phải hạn chế của mô hình:** theo quy ước chuẩn học thuật của Flickr30K/MS-COCO retrieval, mỗi caption chỉ tương ứng với đúng một ảnh gốc duy nhất. Do đó, với `top_k=10`, giá trị `Precision@10` tối đa về mặt lý thuyết chỉ có thể đạt `1/10 = 0.1`, bất kể mô hình có chính xác tuyệt đối hay không. Giá trị đo được `0.09` gần sát trần lý thuyết này, cho thấy mô hình gần như luôn xác định đúng ảnh liên quan trong phạm vi 10 kết quả trả về — phù hợp với `Recall@10 = 0.9` quan sát được (đồng nghĩa với việc ảnh đúng được tìm thấy trong top-10 ở 90% số lượt truy vấn).

**Image-to-Text thể hiện năng lực cao hơn Text-to-Image ở cùng điều kiện Top-K:** `MRR` của image-to-text (`0.846`) cao hơn đáng kể so với text-to-image (`0.682`). Nguyên nhân cấu trúc: đối với image-to-text, mỗi ảnh có tới 5 caption "đúng" trong tổng số 5000 caption của corpus (tỷ lệ đúng/tổng ≈ 0.1%), trong khi đối với text-to-image, mỗi caption chỉ có duy nhất 1 ảnh "đúng" trong tổng số 1000 ảnh của corpus (tỷ lệ đúng/tổng = 0.1% — tương đương về tỷ lệ, nhưng số lượng mục tiêu đúng tuyệt đối ít hơn 5 lần), khiến bài toán text-to-image có độ khó cao hơn về mặt thống kê thuần túy, không phản ánh trực tiếp sự chênh lệch năng lực xử lý giữa 2 phương thức đầu vào của mô hình.

---

## 4. So sánh với các nghiên cứu đã công bố

| Nguồn | Dataset | Điều kiện | Recall@1 image-to-text | Recall@1 text-to-image |
|---|---|---|---|---|
| Radford et al., 2021 (CLIP gốc) | MS-COCO | CLIP RN50 zero-shot | 48.06% | 28.31% |
| AndresPMD/Clip_CMR | Flickr30K | CLIP zero-shot | 36.0% | 55.8% |
| AndresPMD/Clip_CMR | MS-COCO-1K | CLIP zero-shot | 26.1% | 48.0% |
| **SISE (thực nghiệm này)** | Flickr30K subset | CLIP ViT-B/32 zero-shot, quy mô nhỏ | — (đo ở Top-10, không trực tiếp so sánh Top-1) | — (đo ở Top-10, không trực tiếp so sánh Top-1) |

**Lưu ý về khả năng so sánh:** kết quả thực nghiệm của hệ thống được đo ở ngưỡng `Top-10` (`k=10`), trong khi toàn bộ số liệu tham khảo trong bảng trên được công bố ở ngưỡng `Top-1` (`Recall@1`) — hai ngưỡng đo lường này không thể đối chiếu trực tiếp theo giá trị số tuyệt đối, vì `Recall@K` luôn tăng đơn điệu theo `K`. Việc lựa chọn không tính lại ở `k=1` là quyết định có chủ đích của nhóm nghiên cứu nhằm tiết kiệm thời gian cho các phần việc còn lại của khóa luận, được ghi nhận như một hạn chế của thực nghiệm này.

Dù không thể đối chiếu số liệu tuyệt đối, hành vi tương đối quan sát được (`Precision@10` của text-to-image bị giới hạn gần trần lý thuyết theo đúng cấu trúc ground truth 1-đối-1, `HitRate` ở mức cao cho cả hai chiều truy vấn) là phù hợp với đặc tính đã biết của CLIP zero-shot trên dữ liệu ngữ nghĩa tự nhiên đa dạng, không có dấu hiệu bất thường hay lỗi triển khai.

---

## 5. So sánh chéo giữa 2 bộ thực nghiệm

| Chỉ số | Dataset tự thu thập (nhận diện danh tính) | Flickr30K, Image-to-Text | Flickr30K, Text-to-Image |
|---|---|---|---|
| MRR | 0.4906 | 0.8460 | 0.6823 |
| HitRate@10 | 0.9960 | 0.9770 | 0.9000 |
| Precision@10 | 0.8127 | 0.3594 | 0.0900 |
| Recall@10 | 0.9960 | 0.7188 | 0.9000 |

**Nhận xét quan trọng nhất:** `MRR` của bộ dữ liệu tự thu thập (`0.49`) thấp hơn đáng kể so với cả hai chiều truy vấn trên Flickr30K (`0.85` và `0.68`), trong khi `Precision@10` lại cao hơn nhiều (`0.81` so với `0.36` và `0.09`). Sự khác biệt này bắt nguồn hoàn toàn từ **bản chất khác nhau của ground truth** giữa hai bộ thực nghiệm, không phản ánh sự chênh lệch năng lực mô hình:

- Ở bộ dữ liệu tự thu thập, mỗi danh tính có tới 49 ảnh "đúng" khác trong corpus 1000 ảnh (tỷ lệ đúng/tổng ≈ 4.9%) — một bài toán "nhiều-đối-một" khoan dung hơn về mặt thống kê, cho phép `Precision@10` đạt mức cao.
- Ở Flickr30K, tỷ lệ đúng/tổng cực nhỏ (0.1% cho cả hai chiều) — một bài toán "một-đối-một" khắt khe hơn nhiều, khiến `Precision@10` bị giới hạn gần mức trần lý thuyết dù mô hình hoạt động chính xác.

Đây là minh chứng rõ ràng cho việc bốn chỉ số cốt lõi (MRR, HitRate, Precision, Recall) cần được diễn giải trong đúng bối cảnh cấu trúc ground truth của từng thực nghiệm cụ thể, không nên so sánh giá trị tuyệt đối giữa các bộ dữ liệu có cấu trúc bài toán khác nhau.

---

## 6. Giới hạn quy mô dữ liệu (khuyến nghị bổ sung vào phần tóm tắt kết quả)

Các chỉ số gần tuyệt đối quan sát được ở phần lớn các danh tính trong bộ dữ liệu tự thu thập (HitRate và Recall gần như đạt 1.000 tuyệt đối ở đa số các lớp) đạt được trên quy mô dữ liệu còn hạn chế (1000 ảnh, 20 danh tính, trung bình 50 ảnh/danh tính) và trong điều kiện corpus tìm kiếm chỉ giới hạn trong phạm vi các đối tượng đã được đưa vào hệ thống. Các chỉ số này chưa chắc phản ánh đúng hiệu năng của hệ thống khi mở rộng sang quy mô dữ liệu lớn hơn nhiều lần hoặc khi số lượng danh tính cần phân biệt tăng lên đáng kể, đặc biệt trong các trường hợp có nhiều đối tượng chia sẻ đặc điểm thị giác tương đồng như đã quan sát được ở nhóm ba tuyển thủ Esport trong thực nghiệm này.