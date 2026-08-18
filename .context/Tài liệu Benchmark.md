# TRỤ CỘT 3 — ĐÁNH GIÁ THỰC NGHIỆM

---

# Phần A — Kiến thức bắt buộc phải nắm

## A.1. Bốn chỉ số kinh điển — công thức và ý nghĩa

**MRR (Mean Reciprocal Rank)**:
$$MRR = \frac{1}{N}\sum_{i=1}^{N} \frac{1}{\text{rank}_i}$$

Với mỗi truy vấn, lấy nghịch đảo vị trí của kết quả đúng đầu tiên xuất hiện trong ranked list, rồi lấy trung bình qua N truy vấn. Nếu kết quả đúng không xuất hiện trong top-k đã xét, Reciprocal Rank được quy ước bằng 0.

*Vì sao dùng nghịch đảo, không dùng thẳng thứ hạng*: dùng thẳng rank sẽ khiến "số nhỏ = tốt", ngược quy ước thông thường của mọi metric ML khác. Phép nghịch đảo vừa đảo chiều (cao = tốt), vừa tạo hiệu ứng phạt phi tuyến — chênh lệch giữa hạng 1 và hạng 2 (RR: 1.0→0.5) lớn hơn nhiều so với chênh lệch giữa hạng 9 và hạng 10 (RR: 0.111→0.1), phản ánh đúng trực giác người dùng: kết quả đúng rơi từ vị trí 1 xuống 2 gây khó chịu rõ rệt hơn nhiều so với rơi từ 9 xuống 10.

*Lưu ý diễn giải*: MRR là trung bình của các nghịch đảo, không phải nghịch đảo của trung bình — hai phép tính không hoán đổi cho nhau. MRR=0.49 không có nghĩa "trung bình kết quả đúng nằm ở vị trí thứ 2".

**HitRate@k**: tỉ lệ truy vấn có ít nhất 1 kết quả đúng trong top-k. Chỉ số "khoan dung" nhất — không quan tâm trúng bao nhiêu hay trúng ở đâu, chỉ cần trúng 1 lần.

**Precision@k**:
$$Precision@k = \frac{\text{số đáp án đúng trong top-k}}{k}$$
Đo "độ sạch" của kết quả trả về.

**Recall@k**:
$$Recall@k = \frac{\text{số đáp án đúng trong top-k}}{\text{tổng số đáp án đúng có trong toàn bộ dữ liệu}}$$
Đo "độ bao phủ" — vét được bao nhiêu phần trăm trong tổng số đáp án đúng có thể có.

## A.2. Trần lý thuyết (Ceiling) — điểm mù quan trọng nhất

Precision@k và Recall@k đều có **giá trị tối đa lý thuyết** không phải luôn là 1.0, phụ thuộc vào quan hệ giữa k và số lượng đáp án đúng thực sự tồn tại (|ground truth|):

$$\text{Trần Precision@k} = \min\left(1, \frac{|\text{ground truth}|}{k}\right) \qquad \text{Trần Recall@k} = \min\left(1, \frac{k}{|\text{ground truth}|}\right)$$

**Ví dụ minh họa** (tập có 5 ảnh mèo, 3 chó, 2 chim, query mèo):
- k=3: trần Precision=1.0 (3 mèo lấp đầy top-3 nếu mô hình hoàn hảo), trần Recall=3/5=0.6 (chỉ lấy được tối đa 3/5 mèo có sẵn dù hoàn hảo)
- k=7: trần Precision=5/7≈0.714 (chỉ có 5 mèo, buộc phải "độn" 2 kết quả sai để đủ k), trần Recall=1.0 (7>5, đủ chỗ chứa hết 5 mèo)

**Quy luật khi tăng k**: trần Precision có xu hướng giảm dần, trần Recall có xu hướng tăng dần — nhưng đây là quy luật cấu trúc (ceiling), độc lập với năng lực thật của mô hình. Giá trị đo thực tế còn phụ thuộc năng lực mô hình, chỉ bị giới hạn bởi trần này, không nhất thiết chạm đúng trần.

**Áp dụng vào số liệu thật của SISE**:
- Flickr30K, văn bản→ảnh, mỗi câu chỉ có 1 ảnh đúng, k=10 → trần Precision@10 = 1/10 = 0.1. Giá trị đo được 0.090 — gần chạm trần, mô hình gần như hoàn hảo, **không phải yếu**.
- Bộ tự thu thập, mỗi identity có 49 ảnh đúng, k=10 → trần Recall@10 = 10/49 ≈ 0.204. Giá trị đo được 0.183 — rất sát trần, mô hình gần tối ưu tuyệt đối trong giới hạn cấu trúc cho phép.

## A.3. Confusion@1 — chỉ số tự thiết kế

**Định nghĩa**: tỉ lệ truy vấn mà kết quả vị trí #1 sai — cụ thể là nhầm sang một identity khác hẳn (không phải chỉ lệch thứ tự nội bộ giữa các ảnh cùng identity đúng).

**Vì sao cần tồn tại**: MRR thấp có thể do 2 nguyên nhân hoàn toàn khác nhau mà bản thân MRR không phân biệt được — (1) model thực sự nhầm lẫn identity (nghiêm trọng), hoặc (2) model đúng identity nhưng xếp thứ tự nội bộ chưa tối ưu (nhẹ hơn nhiều, do nhiễu góc chụp/trang phục giữa các ảnh cùng người). Confusion@1 tách bạch, chỉ đếm trường hợp (1).

**Giá trị trong báo cáo**: 5.3%, không đổi trước/sau khi vá 2 lỗi đo lường (công thức độc lập với 2 lỗi đó) — là "nhân chứng bất biến" chứng minh năng lực phân biệt identity thật chưa từng thay đổi khi MRR nhảy từ 0.49 lên 0.968.

**Định vị học thuật đúng đắn** (tránh tuyên bố quá lời): Confusion@1 có họ hàng gần với **Rank-1 accuracy/CMC@1** — chỉ số kinh điển trong lĩnh vực Person Re-Identification (bài toán rất gần với bộ dữ liệu tự thu thập của SISE). Điểm khác biệt và đóng góp riêng không nằm ở cách đo (đo đúng/sai ở top-1 đã có sẵn trong Re-ID), mà nằm ở **mục đích sử dụng**: chẩn đoán nguyên nhân của MRR thấp, một góc nhìn không thấy được trình bày minh bạch trong các tài liệu Re-ID đã khảo sát.

---

# Phần B — Mở rộng: Câu chuyện 2 lỗi đo lường và cách phân tích sâu Confusion@1

## B.1. Lỗi 1 — MRR bị chặn trần ở 0.5

**Cơ chế**: ảnh dùng để truy vấn tự khớp cosine=1.0 tuyệt đối với chính nó, luôn chiếm vị trí #1 trong ranked list. Ground truth đã đúng khi loại ảnh này khỏi tập đáp án đúng, nhưng ranked list lại không loại nó trước khi tính điểm — nên vị trí #1 luôn bị tính "sai". Kết quả đúng thực sự, dù mô hình tốt tới đâu, chỉ có thể xuất hiện sớm nhất ở vị trí #2, khiến Reciprocal Rank tối đa mọi truy vấn = 1/2, MRR trung bình bị khóa cứng ở 0.5.

**Ví dụ minh họa** (tự xây dựng để kiểm chứng): 3 danh tính, mỗi người 5 ảnh, k=5, mô hình hoàn hảo (luôn tìm đúng ảnh cùng danh tính ở vị trí cao nhất có thể). Vì ảnh query luôn chiếm #1 và bị tính sai, best case mọi truy vấn chỉ đạt rank #2. Với 15 lượt truy vấn, mỗi lượt RR=0.5:
$$MRR = \frac{0.5 \times 15}{15} = 0.5$$

## B.2. Lỗi 2 — Recall trùng khít HitRate

**Cơ chế**: tập đáp án đúng (`relevant_ids`) của mỗi truy vấn chỉ được xây dựng trong phạm vi chính top-k đã lấy ra, thay vì quét toàn bộ dữ liệu — một tối ưu hóa có chủ đích nhằm giữ chi phí tính toán ở mức O(top_k), nhưng vô tình phá vỡ công thức Recall. Vì `relevant_ids ⊆ ranked_ids[:k]`, mẫu số luôn bằng đúng tử số mỗi khi có ít nhất 1 kết quả đúng, khiến Recall = 1.0 bất cứ khi nào HitRate = 1 — hai chỉ số trở thành một.

**Suy luận loại trừ để tìm ra nguyên nhân** (phương pháp diễn dịch, không cần đọc lại code cũ): nếu Recall được định nghĩa đúng (so với toàn bộ ground truth 49 ảnh, k=10), trần lý thuyết chỉ là 10/49≈0.204 — mâu thuẫn với giá trị gần tuyệt đối quan sát được. Loại trừ khả năng "định nghĩa sai giống HitRate" (không khớp công thức), chỉ còn khả năng duy nhất hợp lý: Recall đang so sánh nội bộ trong chính top-k, không so với toàn bộ dữ liệu.

**Vì sao Flickr30K không dính lỗi**: ground truth ở đó được xây bằng cách quét toàn bộ corpus ngay từ đầu, không giới hạn top-k — khẳng định lỗi nằm ở khâu triển khai cụ thể cho luồng dữ liệu tự thu thập.

## B.3. Bài học phương pháp luận

Lỗi 2 bắt nguồn từ một quyết định tối ưu hiệu năng có chủ đích, không phải thiếu cẩn thận. Bài học: **một tối ưu hóa hợp lý ở góc độ hiệu năng có thể vô tình phá vỡ tính đúng đắn ở góc độ thống kê** — hai mối quan tâm này cần được kiểm tra riêng biệt, không thể mặc định tối ưu một bên sẽ không ảnh hưởng bên còn lại.

Nguyên tắc tổng quát rút ra (đã ghi trong báo cáo): một chỉ số có giá trị bất thường, dù cao hay thấp, đều cần được đối chiếu với trần lý thuyết của chính nó trước khi diễn giải thành kết luận về năng lực mô hình.

## B.4. Số liệu đúng sau khi vá

MRR ≈ 0.968, Recall ≈ 0.183 (bám sát trần lý thuyết ~0.204, không phải mô hình yếu). Confusion@1 giữ nguyên 5.3% trước/sau vá.

## B.5. Ví dụ tính toán chi tiết Confusion@1 — giá trị chẩn đoán

Với 2 hệ thống giả định có **cùng MRR = 0.9167** nhưng khác Confusion@1:
- Hệ thống A: Confusion@1 = 15% → phần MRR bị mất chủ yếu do model **nhầm identity thật** (vấn đề nghiêm trọng)
- Hệ thống B: Confusion@1 = 0% → phần MRR bị mất chỉ do model **xếp thứ tự nội bộ chưa tối ưu**, luôn đúng identity (vấn đề nhẹ hơn nhiều)

Hai hệ thống có MRR giống hệt nhau nhưng bản chất vấn đề hoàn toàn khác nhau — chỉ Confusion@1 mới phân biệt được, MRR đơn lẻ thì không. Đây chính là giá trị chẩn đoán cốt lõi của chỉ số này.

## B.6. Ranh giới với NDCG/Graded Relevance — vì sao SISE không cần

Có ý tưởng mở rộng: liệu MRR có nên phân biệt "đúng nhiều hay đúng ít" (ví dụ dựa vào cosine similarity)? Câu trả lời: đây là khái niệm **Graded Relevance**, thuộc về metric **NDCG**, không phải MRR. SISE không cần NDCG vì hai lý do:

1. **Lý do kỹ thuật (cốt lõi)**: ground truth của bài toán identity là nhị phân theo đúng bản chất — 2 ảnh của cùng 1 người đều đúng như nhau tuyệt đối, không có "ảnh nào đúng hơn" một cách khách quan. Nếu ép dùng NDCG, phải tự tạo thang đo mức độ liên quan (ví dụ từ chính cosine similarity của CLIP) — nhưng làm vậy là dùng chính công cụ đang được đánh giá để chấm điểm cho nó, phá vỡ tính kiểm định độc lập.
2. **Lý do định hướng sản phẩm**: SISE là công cụ tìm kiếm thông minh phục vụ trải nghiệm tự do, không phải hệ nhận dạng danh tính chuyên dụng cần phân biệt mức độ khớp chi tiết.

*Phân biệt quan trọng*: "đúng nhiều/đúng ít" theo nghĩa Graded Relevance (mức độ phù hợp khách quan) khác với **độ bất định của mô hình (uncertainty/confidence)** — ví dụ cosine similarity thấp khi model không chắc chắn. Đây là hướng phân tích khác, có thật (liên quan lĩnh vực uncertainty estimation trong metric learning), nhưng nằm ngoài phạm vi đồ án — chỉ nên nêu như "hướng phát triển tương lai" nếu được hỏi, không tuyên bố đã hoặc sẽ triển khai.

---

# Phần C — Ngoài vùng: Latency, tài nguyên, và bài học đọc số liệu

## C.1. Bảng số liệu latency đã sửa

| Bộ dữ liệu | P50 (ms) | P95 (ms) | P99 (ms) | Mean (ms) | Std (ms) |
|---|---|---|---|---|---|
| Flickr30K, embed ảnh | 217.5 | 690.5 | 937.6 | 273.2 | 164.6 |
| Flickr30K, embed văn bản | 199.5 | 804.5 | 973.3 | 298.8 | 219.1 |
| Bộ tự thu thập, embed ảnh | 247.1 | 318.2 | 368.0 | 257.0 | 35.6 |

## C.2. Vì sao số liệu cũ "trông vô lý về mặt thống kê"

Latency luôn tuân theo **phân phối lệch phải** — đa số request nhanh, luôn có "đuôi dài" do GC, tranh chấp tài nguyên, cold start. Quy luật cơ bản: **Mean > Median (P50)**, vì trung bình bị "kéo" về đuôi dài, trung vị không bị ảnh hưởng bởi outlier.

Số liệu **cũ** có Mean < P50 ở cả 3 phép đo — dấu hiệu bất thường, không phải hiện tượng tự nhiên hợp lý → dẫn tới phát hiện lỗi đo. Số liệu **mới** đúng quy luật Mean > P50 ở cả 3 phép đo, củng cố độ tin cậy.

## C.3. Đọc đúng các phân vị

- **P50 (median)**: trải nghiệm điển hình
- **P95**: mức mà hầu hết người dùng gặp phải
- **P99**: trường hợp xấu nhất một tỉ lệ nhỏ gặp phải, quan trọng cho SLA

Lỗi từng mắc: trộn Mean và P99 thành "khoảng dao động 480-730ms" — không có ý nghĩa thống kê rõ ràng. Cách viết đúng: nêu riêng từng phân vị cụ thể.

## C.4. Quan sát chưa có lời giải — sự trung thực khoa học

Bộ tự thu thập ổn định hơn Flickr30K ở đuôi phân phối (P95/P99 thấp hơn hẳn dù P50 cao hơn ~30ms) — báo cáo ghi nhận đây là "quan sát chưa xác định nguyên nhân", không bịa lý do cho có vẻ đầy đủ. Đây là điểm đáng khen về liêm chính khoa học, nên giữ nguyên tinh thần này khi trả lời hội đồng nếu được hỏi.

**Khám phá thêm ngoài báo cáo** (không cần trình bày, chỉ để hiểu sâu hơn nếu bị hỏi): đối chiếu biểu đồ CPU theo thời gian thực cho thấy Flickr30K có cấu trúc "nhiều pha rõ rệt" (luân phiên cao-thấp) do benchmark có 2 loại tác vụ (embed ảnh + embed văn bản) chạy nối tiếp, trong khi bộ tự thu thập chỉ có 1 loại tác vụ nên CPU dao động liên tục quanh 1 dải, không tách pha. Khi audit sâu hơn (đối chiếu code `AIServiceClient`, `ImageEmbeddingService`, `TextEmbeddingService`), phát hiện latency đo bằng round-trip HTTP đầy đủ, và có 2 khác biệt cấu trúc thật giữa 2 nhánh: (1) nhánh ảnh có thêm bước đọc file từ đĩa nằm trong khoảng đo, nhánh văn bản không có; (2) nhánh văn bản gộp chung tokenize (BPE, xử lý chuỗi ký tự thuần CPU) và encode trong cùng một khối đo, không tách bạch như nhánh ảnh. Không đủ bằng chứng định lượng chính xác — đây là ví dụ mẫu mực của việc dừng đúng lúc khi bằng chứng chưa đủ, thay vì suy đoán quá đà.

## C.5. Tài nguyên CPU trong lúc benchmark

- Flickr30K: CPU đỉnh ~296.5% (~3/12 nhân)
- Bộ tự thu thập: CPU đỉnh ~182.1% (~1.8/12 nhân)

Cả 2 còn nhiều dư địa tài nguyên (máy 12 nhân, dùng chưa tới 1/4) — loại trừ khả năng "latency cao do máy quá tải", củng cố độ tin cậy số liệu latency đo được. Lưu ý khi trình bày: số vượt 100% là do container được cấp nhiều nhân CPU, cần ghi rõ số nhân được cấp để tránh gây thắc mắc.

---