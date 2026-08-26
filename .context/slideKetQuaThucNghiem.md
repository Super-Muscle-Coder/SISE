# Phần 4 — THỰC NGHIỆM

## MỤC I. NĂM CHỈ SỐ

### SLIDE I.1 — BỐN CHỈ SỐ KINH ĐIỂN

### 1. Bố cục slide

- **Tiêu đề mục:** "I. Năm chỉ số: công thức và ý nghĩa (1/2)".
- **Trên cùng:** Công thức MRR, cỡ chữ lớn.
- **Giữa slide:** Bảng 4 chỉ số — công thức/định nghĩa, đo cái gì, khắt khe/khoan dung theo trục nào.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** I. Năm chỉ số: công thức và ý nghĩa (1/2)

**Công thức MRR:**
$$MRR = \frac{1}{N}\sum_{i=1}^{N} \frac{1}{\text{rank}_i}$$

**Bảng 4 chỉ số:**

| Chỉ số | Định nghĩa | Đo cái gì | Trục khắt khe/khoan dung |
|---|---|---|---|
| MRR | Trung bình nghịch đảo vị trí kết quả đúng đầu tiên | Vị trí xuất hiện | Khắt khe về vị trí |
| HitRate@k | Tỉ lệ truy vấn có ≥1 kết quả đúng trong top-k | Sự hiện diện tối thiểu | Khoan dung nhất |
| Precision@k | (số đúng trong top-k) / k | Độ sạch nội bộ | Khắt khe về tỉ lệ đúng |
| Recall@k | (số đúng trong top-k) / (tổng số đúng toàn bộ) | Độ bao phủ | Khắt khe về việc vét đủ |

**Câu chốt (đóng khung):**
> Bốn chỉ số nhìn cùng một kết quả tìm kiếm từ bốn góc độ khác nhau — không chỉ số nào "đúng hơn" chỉ số nào, mỗi chỉ số trả lời đúng một câu hỏi riêng.

### 3. Lời thoại

> Để đánh giá chất lượng hệ thống một cách khách quan, nhóm sử dụng năm chỉ số — bốn chỉ số kinh điển trong lĩnh vực truy hồi thông tin, và một chỉ số do chính nhóm tự thiết kế.
>
> MRR đo vị trí xuất hiện của kết quả đúng đầu tiên trong danh sách trả về — kết quả đúng càng xuất hiện sớm, điểm số càng cao. HitRate đo tỉ lệ phần trăm các lượt truy vấn tìm được ít nhất một kết quả đúng, không quan tâm nó nằm ở vị trí nào — đây là chỉ số khoan dung nhất trong bốn chỉ số. Precision đo tỉ lệ phần trăm kết quả đúng trong toàn bộ danh sách trả về, phản ánh độ sạch của kết quả. Recall đo tỉ lệ phần trăm kết quả đúng mà hệ thống tìm được so với tổng số kết quả đúng thực sự có trong toàn bộ dữ liệu, phản ánh độ bao phủ.
>
> Điều quan trọng cần nắm: không có chỉ số nào "tốt hơn" chỉ số còn lại một cách tuyệt đối — mỗi chỉ số được thiết kế để trả lời đúng một câu hỏi khác nhau, và một hệ thống tốt cần được đánh giá đồng thời trên nhiều góc độ, không chỉ dựa vào một con số duy nhất.

---

### SLIDE I.2 — CHỈ SỐ TỰ THIẾT KẾ: CONFUSION@1

### 1. Bố cục slide

- **Tiêu đề mục:** "I. Năm chỉ số: công thức và ý nghĩa (2/2)".
- **Trên cùng:** Định nghĩa Confusion@1.
- **Giữa slide:** Sơ đồ minh họa — 2 tình huống MRR thấp, phân biệt "nhầm identity thật" (nghiêm trọng) vs "lệch thứ tự nội bộ" (nhẹ).
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** I. Năm chỉ số: công thức và ý nghĩa (2/2)

**Định nghĩa:**
> Confusion@1 — tỉ lệ phần trăm truy vấn mà kết quả xếp hạng cao nhất (top-1) bị nhầm sang một danh tính khác hẳn.

**Hai nguyên nhân khiến MRR thấp — Confusion@1 phân biệt được:**

| Nguyên nhân | Mức độ nghiêm trọng | Confusion@1 phản ánh? |
|---|---|---|
| Nhầm sang danh tính khác hẳn | Nặng — mô hình thực sự sai | Có — đây chính là điều nó đo |
| Chỉ lệch thứ tự nội bộ (đúng người, sai thứ tự) | Nhẹ — chỉ vấn đề xếp hạng | Không — Confusion@1 không tính vào |

**Câu chốt (đóng khung):**
> Confusion@1 có họ hàng với Rank-1 accuracy trong Person Re-Identification — điểm khác biệt nằm ở MỤC ĐÍCH: chẩn đoán nguyên nhân MRR thấp, không chỉ đo hiệu năng tổng thể.

### 3. Lời thoại

> Bên cạnh bốn chỉ số kinh điển, nhóm tự thiết kế thêm một chỉ số gọi là Confusion tại vị trí một, đo tỉ lệ phần trăm các lượt truy vấn mà kết quả xếp hạng cao nhất bị nhầm sang một danh tính hoàn toàn khác so với danh tính đang truy vấn.
>
> Chỉ số này ra đời để giải quyết một hạn chế của MRR: khi MRR thấp, bản thân MRR không cho biết đó là do mô hình thực sự nhầm lẫn đối tượng, hay chỉ do việc xếp thứ tự nội bộ giữa các kết quả cùng đúng danh tính chưa tối ưu — hai nguyên nhân này có mức độ nghiêm trọng rất khác nhau. Nhầm sang danh tính khác hẳn là một lỗi thực sự nghiêm trọng của mô hình; còn việc chỉ lệch thứ tự nội bộ, dù vẫn ảnh hưởng tới điểm số MRR, lại là một vấn đề nhẹ hơn nhiều, vì bản chất mô hình vẫn nhận diện đúng người, chỉ chưa xếp đúng thứ tự tối ưu nhất.
>
> Chỉ số này có họ hàng gần với khái niệm Rank-1 accuracy trong lĩnh vực nhận diện lại đối tượng, nhưng điểm khác biệt nằm ở mục đích sử dụng: không chỉ đơn thuần đo hiệu năng tổng thể, mà đóng vai trò công cụ chẩn đoán, giúp tách bạch rõ ràng hai loại nguyên nhân gây ra MRR thấp.

---

## MỤC II. TRẦN LÝ THUYẾT

### SLIDE II.1 — CÔNG THỨC TRẦN VÀ VÍ DỤ TÍNH TAY

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Trần lý thuyết: điểm mù quan trọng nhất (1/2)".
- **Trên cùng:** Công thức trần Precision và Recall.
- **Giữa slide:** Bảng ví dụ mèo/chó/chim, 2 dòng (k=3, k=7).
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Trần lý thuyết: điểm mù quan trọng nhất (1/2)

**Công thức trần:**
$$\text{Trần Precision@k} = \min\left(1, \frac{|\text{ground truth}|}{k}\right) \qquad \text{Trần Recall@k} = \min\left(1, \frac{k}{|\text{ground truth}|}\right)$$

**Ví dụ minh họa (tập 5 mèo/3 chó/2 chim, truy vấn "mèo"):**

| k | Trần Precision | Trần Recall | Giải thích |
|---|---|---|---|
| 3 | 1.0 | 3/5 = 0.6 | k=3 < 5 mèo → đủ lấp đầy top-3, nhưng chỉ vét được 3/5 |
| 7 | 5/7 ≈ 0.714 | 1.0 | k=7 > 5 mèo → buộc "độn" 2 kết quả sai, nhưng đủ chỗ chứa hết 5 mèo |

**Câu chốt (đóng khung):**
> Precision và Recall có giá trị tối đa lý thuyết phụ thuộc cấu trúc ground truth và k — KHÔNG PHẢI LUÔN LÀ 1. Giá trị "thấp" không tự động nghĩa là mô hình yếu.

### 3. Lời thoại

> Một khía cạnh quan trọng khi đọc đúng các chỉ số Precision và Recall là khái niệm trần lý thuyết — giá trị tối đa mà mỗi chỉ số có thể đạt được, phụ thuộc hoàn toàn vào cấu trúc dữ liệu đúng và tham số k đang sử dụng, không phải lúc nào giá trị tối đa cũng là một.
>
> Xét một ví dụ đơn giản: một tập dữ liệu có năm con mèo, ba con chó, hai con chim. Nếu truy vấn là tìm mèo, với k bằng ba — nhỏ hơn số lượng mèo thực có — trần Precision đạt được là một trăm phần trăm, vì hoàn toàn có thể lấp đầy cả ba vị trí bằng mèo thật; nhưng trần Recall chỉ đạt sáu mươi phần trăm, vì dù có tìm đúng cả ba, vẫn còn hai con mèo khác chưa được vét tới. Ngược lại, nếu k bằng bảy — lớn hơn số lượng mèo thực có — trần Recall đạt một trăm phần trăm vì đã đủ chỗ chứa hết năm con mèo, nhưng trần Precision chỉ còn khoảng bảy mươi mốt phần trăm, vì buộc phải có thêm hai kết quả không phải mèo để lấp đầy đủ bảy vị trí.
>
> Đây chính là bài học cốt lõi: một giá trị Precision hay Recall trông có vẻ thấp không tự động đồng nghĩa với việc mô hình hoạt động kém — cần phải đối chiếu với đúng trần lý thuyết của chính bối cảnh đó trước khi đưa ra kết luận.

---

### SLIDE II.2 — ÁP DỤNG VÀO SỐ LIỆU THẬT CỦA SISE

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Trần lý thuyết: điểm mù quan trọng nhất (2/2)".
- **Trung tâm slide:** Bảng đối chiếu 2 trường hợp thật — trần lý thuyết vs giá trị đo được.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Trần lý thuyết: điểm mù quan trọng nhất (2/2)

**Bảng đối chiếu thật:**

| Bối cảnh | Trần lý thuyết | Giá trị đo được | Kết luận |
|---|---|---|---|
| Flickr30K, văn bản→ảnh, k=10, mỗi câu chỉ có 1 ảnh đúng | Precision@10 = 1/10 = 0.1 | **0.090** | Gần chạm trần — gần như hoàn hảo |
| Bộ tự thu thập, k=10, mỗi danh tính có 49 ảnh đúng | Recall@10 = 10/49 ≈ 0.204 | **0.183** | Rất sát trần — gần tối ưu tuyệt đối |

**Câu chốt (đóng khung):**
> Cả hai con số "trông thấp" (0.090 và 0.183) thực chất đều gần chạm trần lý thuyết của chính chúng — đây là bằng chứng năng lực mô hình gần như tối ưu trong giới hạn cấu trúc dữ liệu cho phép.

### 3. Lời thoại

> Áp dụng đúng nguyên tắc vừa trình bày vào chính số liệu thực nghiệm của hệ thống, có hai trường hợp đáng chú ý nhất.
>
> Trên Flickr30K, ở chiều tìm ảnh bằng văn bản, tại k bằng mười, Precision đo được chỉ khoảng chín phần trăm. Nhưng vì mỗi câu văn bản trong Flickr30K chỉ có đúng một ảnh là đáp án đúng trong toàn bộ dữ liệu, trần lý thuyết của Precision tại k bằng mười chỉ là mười phần trăm — con số đo được đã nằm rất sát trần đó.
>
> Trên bộ dữ liệu tự thu thập, tại k bằng mười, Recall chỉ đạt khoảng mười tám phẩy ba phần trăm. Nhưng vì mỗi danh tính trong bộ dữ liệu này có tới bốn mươi chín ảnh là đáp án đúng, trong khi hệ thống chỉ trả về mười kết quả, trần lý thuyết của Recall trong trường hợp này chỉ khoảng hai mươi phẩy bốn phần trăm — con số đo được cũng nằm rất sát trần.
>
> Cả hai trường hợp đều minh chứng cho cùng một điều: những con số thoạt nhìn có vẻ thấp thực chất phản ánh năng lực gần như tối ưu của mô hình, chỉ bị giới hạn bởi chính cấu trúc của dữ liệu đánh giá, không phải bởi năng lực thực sự của mô hình.

---

## MỤC III. KẾT QUẢ TRÊN HAI BỘ DỮ LIỆU

### SLIDE III.1 — BẢNG KẾT QUẢ ĐẦY ĐỦ

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Kết quả trên hai bộ dữ liệu (1/2)".
- **Trên cùng:** Bảng kết quả bộ tự thu thập (5 chỉ số).
- **Giữa slide:** Bảng kết quả Flickr30K (2 chiều, 4 chỉ số mỗi chiều).
- **Cuối slide:** Câu chốt đóng khung, đối chiếu học thuật.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Kết quả trên hai bộ dữ liệu (1/2)

**Bộ tự thu thập (1000 ảnh, 20 danh tính), k=10:**

| Chỉ số | Giá trị |
|---|---|
| MRR | 0.968 |
| HitRate | 0.997 |
| Precision | 0.896 |
| Recall | 0.183 |
| Confusion@1 | 5.3% |

**Flickr30K, k=10:**

| Chiều | MRR | HitRate | Precision | Recall |
|---|---|---|---|---|
| Ảnh → Văn bản | 0.846 | 0.977 | 0.359 | 0.719 |
| Văn bản → Ảnh | 0.682 | 0.900 | 0.090 | 0.900 |

**Câu chốt (đóng khung):**
> Kết quả trên Flickr30K nằm sát các công bố zero-shot CLIP đã có cho cùng biến thể kiến trúc — xác nhận quy trình đánh giá được hiện thực đúng đắn.

### 3. Lời thoại

> Trên bộ dữ liệu tự thu thập, hệ thống đạt các chỉ số ở mức rất cao — MRR khoảng chín mươi sáu phẩy tám phần trăm, HitRate gần như tuyệt đối, Precision khoảng tám mươi chín phẩy sáu phần trăm — cho thấy khả năng phân biệt danh tính rất tốt. Riêng Recall chỉ đạt mười tám phẩy ba phần trăm, nhưng như đã trình bày ở phần trước, đây là con số nằm rất sát trần lý thuyết của chính cấu trúc dữ liệu này.
>
> Trên Flickr30K, hệ thống cũng cho kết quả khả quan ở cả hai chiều tìm kiếm, với mức chênh lệch phù hợp với đặc điểm cấu trúc riêng của từng chiều — chiều ảnh sang văn bản có trần lý thuyết cao hơn vì mỗi ảnh có tới năm câu mô tả được xem là đáp án đúng.
>
> Đáng chú ý, khi đối chiếu với các công bố học thuật khác về hiệu năng zero-shot của CLIP trên cùng bộ dữ liệu Flickr30K, kết quả của nhóm nằm sát với số liệu đã công bố cho cùng biến thể kiến trúc — đây là một tín hiệu xác nhận quan trọng rằng quy trình đánh giá của nhóm được hiện thực đúng đắn, không có sai lệch bất thường so với những gì cộng đồng nghiên cứu đã ghi nhận.

---

### SLIDE III.2 — PHÁT HIỆN: ĐỒNG PHỤC THI ĐẤU GÂY NHIỄU MẠNH

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Kết quả trên hai bộ dữ liệu (2/2)".
- **Trên cùng:** Số liệu nổi bật — "77.4% tổng nhầm lẫn tập trung vào 3/20 danh tính".
- **Giữa slide:** Ảnh minh họa 3 tuyển thủ đồng phục giống hệt nhau (nếu có), cạnh đó là mô tả ngắn.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Kết quả trên hai bộ dữ liệu (2/2)

**Phát hiện chính:**
> 3 trên 20 danh tính (cùng đội thi đấu, đồng phục giống hệt nhau) chiếm **77.4%** tổng số lượt nhầm lẫn trong toàn bộ thực nghiệm.

**Đối chứng:**
> Các nhóm khác được chủ động thiết kế có chồng lấn phong cách (ví dụ cùng tông màu vest) — gần như KHÔNG bị ảnh hưởng.

**Câu chốt (đóng khung):**
> Ranh giới năng lực CLIP không nằm ở việc "có phân biệt được danh tính hay không" nói chung — mà ở mức độ đặc trưng thị giác còn sót lại. Chỉ khi đặc trưng đó bị thu hẹp cực đoan (đồng phục giống hệt), năng lực mới suy giảm rõ rệt.

### 3. Lời thoại

> Phát hiện đáng chú ý nhất từ thực nghiệm nằm ở việc phân tích chi tiết chỉ số Confusion tại vị trí một theo từng nhóm đối tượng. Mức độ khó của bài toán không phân bố đồng đều giữa hai mươi danh tính, mà tập trung gần như tuyệt đối vào đúng một nhóm nhỏ.
>
> Cụ thể, ba danh tính — cùng thi đấu chung một đội, mặc đồng phục thi đấu giống hệt nhau — chiếm tới bảy mươi bảy phẩy bốn phần trăm tổng số lượt nhầm lẫn trong toàn bộ thực nghiệm, dù chỉ chiếm ba trên hai mươi danh tính. Trong khi đó, các nhóm khác mà nhóm chủ động thiết kế có sự chồng lấn về phong cách — như cùng mặc trang phục tông màu tương tự — lại gần như không bị ảnh hưởng.
>
> Phát hiện này cho thấy ranh giới năng lực của mô hình không nằm ở việc có phân biệt được danh tính nói chung hay không, mà nằm cụ thể ở mức độ đặc trưng thị giác riêng biệt còn sót lại giữa các đối tượng — chỉ khi đặc trưng đó bị thu hẹp tới mức cực đoan như đồng phục giống hệt nhau, năng lực phân biệt mới thực sự suy giảm nghiêm trọng.

---

## MỤC IV. HIỆU NĂNG HNSW VÀ EXACT SEARCH TRÊN HAI QUY MÔ

### SLIDE IV.1 — ĐỐI CHỨNG TRÊN DỮ LIỆU CLIP THẬT (N=1000)

### 1. Bố cục slide

- **Tiêu đề mục:** "IV. Hiệu năng HNSW và Exact Search (1/2)".
- **Trung tâm slide:** Bảng 4 dòng (Exact, HNSW ef_search=40/64/128).
- **Cuối slide:** Câu chốt đóng khung — "chưa chứng minh nhanh hơn, đã chứng minh không mất chất lượng".

### 2. Nội dung chữ trên slide

**Tiêu đề:** IV. Hiệu năng HNSW và Exact Search (1/2)

**Bảng đối chứng — N=1000 vector CLIP thật:**

| Cấu hình | Recall@10 | P50 (ms) | P95 (ms) | P99 (ms) |
|---|---|---|---|---|
| Exact | 1.000 | 6.56 | 14.41 | 22.54 |
| HNSW, ef_search=40 | 1.000 | 7.92 | 15.94 | 26.28 |
| HNSW, ef_search=64 (đang dùng) | 1.000 | 7.37 | 15.34 | 21.40 |
| HNSW, ef_search=128 | 1.000 | 7.40 | 21.51 | 33.45 |

**Câu chốt (đóng khung):**
> Ở quy mô 1000 vector, HNSW KHÔNG nhanh hơn Exact — nhưng Recall tuyệt đối 1.000 ở mọi cấu hình. Điều đã chứng minh: không đánh đổi chất lượng, dù chưa cho thấy lợi thế tốc độ.

### 3. Lời thoại

> Để kiểm chứng lý thuyết đã trình bày ở phần thuật toán, nhóm thực hiện đối chứng trực tiếp trên chính một nghìn vector CLIP thật của hệ thống, so sánh tìm kiếm chính xác tuyệt đối với HNSW ở ba mức độ rộng tìm kiếm khác nhau.
>
> Kết quả cho thấy, ở quy mô này, HNSW không nhanh hơn tìm kiếm chính xác — thậm chí chậm hơn vài phần nghìn giây ở mọi phân vị, vì chi phí duyệt qua cấu trúc đồ thị phân tầng chưa được bù đắp ở quy mô nhỏ như vậy. Tuy nhiên, điều quan trọng hơn nhiều: Recall giữ nguyên tuyệt đối một trăm phần trăm ở cả ba cấu hình, không đánh đổi bất kỳ chất lượng kết quả nào.
>
> Nhóm xin nhấn mạnh cách diễn giải đúng bảng số liệu này: ở quy mô hiện tại, nhóm chưa chứng minh được HNSW nhanh hơn. Điều nhóm chứng minh được là việc sử dụng HNSW không làm mất bất kỳ kết quả nào so với tìm kiếm chính xác tuyệt đối — đây chính là điều kiện cần thiết để hệ thống có thể mở rộng dữ liệu về sau mà không phải đánh đổi chất lượng.

---

### SLIDE IV.2 — KHẢO SÁT THEO QUY MÔ: 10K, 50K, 100K VECTOR

### 1. Bố cục slide

- **Tiêu đề mục:** "IV. Hiệu năng HNSW và Exact Search (2/2)".
- **Trên cùng:** Bảng 3 dòng (10k/50k/100k).
- **Giữa slide:** Bảng đối chiếu tỉ lệ tăng thực tế vs kỳ vọng lý thuyết O(log N).
- **Cuối slide:** Câu chốt đóng khung — nối lại Curse of Dimensionality từ CLIP.

### 2. Nội dung chữ trên slide

**Tiêu đề:** IV. Hiệu năng HNSW và Exact Search (2/2)

**Bảng khảo sát theo quy mô — vector ngẫu nhiên tổng hợp:**

| N vectors | Recall@10 | P50 (ms) | P95 (ms) | P99 (ms) |
|---|---|---|---|---|
| 10.000 | 1.000 | 20.05 | 32.74 | 36.58 |
| 50.000 | 1.000 | 123.34 | 142.69 | 181.71 |
| 100.000 | 1.000 | 262.71 | 282.75 | 322.42 |

**Đối chiếu với kỳ vọng lý thuyết:**

| N tăng | P50 tăng thực tế | Kỳ vọng nếu đúng O(log N) |
|---|---|---|
| 10.000 → 100.000 (×10) | **×13.1** | ~×1.2 |

**Câu chốt (đóng khung):**
> Suy biến gần tuyến tính vì dữ liệu NGẪU NHIÊN, không có cấu trúc cụm — đúng hệ quả tất yếu của Curse of Dimensionality đã chứng minh ở CLIP. Vector CLIP thật luôn có cấu trúc cụm, không rơi vào tình huống này.

### 3. Lời thoại

> Để khảo sát khả năng mở rộng, nhóm sinh thêm vector ngẫu nhiên tổng hợp ở ba mốc quy mô — mười nghìn, năm mươi nghìn, và một trăm nghìn — cố tình không mang cấu trúc ngữ nghĩa như CLIP thật, nhằm cô lập đặc tính thuần túy của thuật toán khỏi đặc tính của dữ liệu.
>
> Kết quả cho thấy, khi N tăng gấp mười lần, thời gian tìm kiếm trung vị tăng tới hơn mười ba lần — trong khi nếu đúng độ phức tạp lý thuyết gần với logarit, mức tăng kỳ vọng chỉ khoảng một phẩy hai lần. Recall vẫn giữ tuyệt đối một trăm phần trăm ở cả ba mốc.
>
> Nguyên nhân nằm ở chính bản chất dữ liệu ngẫu nhiên không có cấu trúc cụm — các cạnh nhảy xa ở tầng trên của đồ thị mất tác dụng định hướng, vì không tồn tại khu vực nào có ý nghĩa ngữ nghĩa để dẫn đường. Đây chính là hệ quả tất yếu của hiện tượng đã trình bày khi phân tích CLIP — dữ liệu càng thiếu cấu trúc cụm, lợi ích lý thuyết của HNSW càng suy yếu. Vector CLIP thật, nhờ cơ chế học tương phản, luôn mang cấu trúc cụm tự nhiên, nên kết luận từ thực nghiệm này là một minh chứng cảnh báo về điều kiện áp dụng, không phải một lý do để nghi ngờ lựa chọn thuật toán cho hệ thống.

---

## MỤC V. LATENCY VÀ HIỆU NĂNG SỬ DỤNG TÀI NGUYÊN

### SLIDE V.1 — ĐỘ TRỄ VÀ TÀI NGUYÊN HỆ THỐNG

### 1. Bố cục slide

- **Tiêu đề mục:** "V. Latency và hiệu năng sử dụng tài nguyên".
- **Trên cùng:** Bảng độ trễ đầy đủ 3 dòng (P50/P95/P99/Mean).
- **Giữa slide:** Dòng nhấn mạnh quy luật Mean > Median.
- **Cuối slide:** Câu chốt về tài nguyên CPU + câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** V. Latency và hiệu năng sử dụng tài nguyên

**Bảng độ trễ:**

| Bộ dữ liệu | P50 (ms) | P95 (ms) | P99 (ms) | Mean (ms) |
|---|---|---|---|---|
| Flickr30K, embed ảnh | 217.5 | 690.5 | 937.6 | 273.2 |
| Flickr30K, embed văn bản | 199.5 | 804.5 | 973.3 | 298.8 |
| Bộ tự thu thập, embed ảnh | 247.1 | 318.2 | 368.0 | 257.0 |

**Quy luật kiểm chứng độ tin cậy:**
> Mean > Median (P50) ở cả 3 dòng — đúng quy luật phân phối lệch phải của latency thực tế, củng cố độ tin cậy số liệu.

**Tài nguyên:**
> CPU đỉnh trong benchmark: 182–296% trên tổng 12 nhân — dưới 1/4 năng lực máy. Loại trừ khả năng nghẽn tài nguyên ảnh hưởng tới số liệu độ trễ.

**Câu chốt (đóng khung):**
> P50 = trải nghiệm điển hình; P99 = trường hợp xấu nhất một tỉ lệ nhỏ gặp phải, quan trọng cho việc đảm bảo chất lượng dịch vụ.

### 3. Lời thoại

> Về hiệu năng độ trễ, thời gian sinh vector đặc trưng trên Flickr30K có trung vị khoảng hai trăm mười bảy phẩy năm mili giây cho ảnh, và một trăm chín mươi chín phẩy năm mili giây cho văn bản, với phân vị chín mươi chín lên tới xấp xỉ một giây trong cả hai trường hợp. Trên bộ dữ liệu tự thu thập, độ trễ có phần ổn định hơn ở các trường hợp chậm nhất, với phân vị chín mươi chín chỉ khoảng ba trăm sáu mươi tám mili giây.
>
> Một nguyên tắc quan trọng khi đọc số liệu độ trễ: giá trị trung bình luôn cao hơn giá trị trung vị ở cả ba dòng số liệu — đây chính là dấu hiệu đặc trưng của một phân phối lệch phải, nơi đa số các lượt xử lý diễn ra nhanh, nhưng luôn tồn tại một số ít trường hợp bị kéo dài đáng kể, thường do các yếu tố như thu gom bộ nhớ hay tranh chấp tài nguyên tạm thời. Việc số liệu tuân đúng quy luật thống kê này củng cố thêm độ tin cậy của toàn bộ phép đo.
>
> Về tài nguyên hệ thống, mức sử dụng CPU cao nhất ghi nhận trong suốt quá trình benchmark chỉ dao động trong khoảng một trăm tám mươi hai tới hai trăm chín mươi sáu phần trăm, trên tổng cộng mười hai nhân xử lý — tức chưa tới một phần tư năng lực tối đa của máy. Điều này cho phép loại trừ khả năng nghẽn tài nguyên phần cứng là nguyên nhân ảnh hưởng tới các số liệu độ trễ đã đo được, khẳng định các con số phản ánh đúng đặc tính vận hành thực sự của hệ thống.

---

## MỤC LỤC — Phần 4. THỰC NGHIỆM

### Tổng cộng: 5 Mục La Mã, 9 slide

### MỤC I. NĂM CHỈ SỐ (2 slide)

| Slide | Nội dung |
|---|---|
| I.1 | Bốn chỉ số kinh điển (MRR, HitRate, Precision, Recall) |
| I.2 | Chỉ số tự thiết kế Confusion@1 |

### MỤC II — TRẦN LÝ THUYẾT (2 slide)

| Slide | Nội dung |
|---|---|
| II.1 | Công thức trần Precision/Recall + ví dụ mèo/chó/chim |
| II.2 | Áp dụng vào số liệu thật của SISE |

### MỤC LA MÃ III — KẾT QUẢ TRÊN HAI BỘ DỮ LIỆU (2 slide)

| Slide | Nội dung |
|---|---|
| III.1 | Bảng kết quả đầy đủ (Bộ tự thu thập + Flickr30K), đối chiếu học thuật |
| III.2 | Phát hiện: đồng phục thi đấu gây nhiễu 77.4% |

### MỤC IV — HIỆU NĂNG HNSW VÀ EXACT SEARCH TRÊN HAI QUY MÔ (2 slide)

| Slide | Nội dung |
|---|---|
| IV.1 | Đối chứng trên dữ liệu CLIP thật (N=1000) |
| IV.2 | Khảo sát theo quy mô: 10k, 50k, 100k vector |

### MỤC V — LATENCY VÀ HIỆU NĂNG SỬ DỤNG TÀI NGUYÊN (1 slide)

| Slide | Nội dung |
|---|---|
| V.1 | Độ trễ P50/P95/P99 + tài nguyên CPU |
 
---

### Ghi chú tra cứu nhanh — "Nếu bị hỏi về..."

| Chủ đề bị hỏi | Mở slide |
|---|---|
| Ý nghĩa MRR, HitRate, Precision, Recall | I.1 |
| Confusion@1, mục đích chẩn đoán, vì sao tự thiết kế | I.2 |
| Trần lý thuyết là gì, công thức | II.1 |
| Vì sao Recall=0.183 / Precision=0.09 "không thấp" | II.2 |
| Kết quả benchmark đầy đủ 2 bộ dữ liệu | III.1 |
| Đối chiếu với công bố học thuật khác (AndresPMD) | III.1 |
| Vì sao nhầm lẫn giữa Faker/Gumayusi/Keria | III.2 |
| Ranh giới năng lực CLIP, đồng phục vs phong cách | III.2 |
| HNSW có nhanh hơn Brute-force không (N=1000) | IV.1 |
| Câu chốt an toàn "chưa chứng minh nhanh hơn..." | IV.1 |
| HNSW suy biến ở quy mô lớn, vì sao | IV.2 |
| Liên hệ Curse of Dimensionality (CLIP) ↔ HNSW | IV.2 |
| Độ trễ P50/P95/P99, quy luật Mean > Median | V.1 |
| Tài nguyên CPU, có bị nghẽn không | V.1 |