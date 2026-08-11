# Nhận xét khóa luận  
**Ứng dụng AI xây dựng hệ thống tìm ảnh thông minh trên nền tảng Web (SISE)**  
**GVHD phản hồi — Ngày 09/08/2026**

---

## PHẦN I. ÐÁNH GIÁ CHUNG

Bản thảo có chất lượng khá so với mặt bằng khóa luận đại học.  
Cấu trúc 7 chương mạch lạc, hệ thống tham chiếu chéo giữa các mục rất tốt, phụ lục đặc tả API/DB/kiến trúc chỉn chu.  

### Ðặc biệt đáng khen:
1. **Phương pháp đặt kỳ vọng** trước khi biết kết quả (mục 5.3.2), rồi đối chiếu trung thực ở mục 6.3.1. Đây là tư duy nghiên cứu thật, không phải viết ngược từ kết quả.  
2. **Phân tích trần lý thuyết của Precision** (mục 6.1.1, 6.1.2) — chứng minh nhóm hiểu bản chất chỉ số chứ không chỉ báo cáo số.  
3. **Thiết kế hai bộ dữ liệu đối chứng có chủ đích** (sở trường vs ngoài sở trường của CLIP).  
4. **Phát hiện có giá trị thật**: đồng phục thi đấu gây nhiễu mạnh hơn hẳn sự tương đồng phong cách (mục 6.2.4).  
5. **Tính nhất quán số liệu nội bộ rất cao**: kiểm tra chéo ma trận nhầm lẫn — 53 lượt = 41 (nội bộ 3 tuyển thủ) + 12 (rải rác), khớp chính xác với Confusion@1 của từng danh tính và với trung bình toàn cục 5.3%. Không sai một con số nào.  
6. **Mã nguồn có chất lượng khá tốt**: kiến trúc phân lớp áp dụng nhất quán, comment giải thích lý do quyết định chứ không mô tả lại code, ghi rõ giới hạn đã biết của từng hàm (ví dụ docstring `normalize_tag` nêu thẳng rằng không xử lý viết tắt và lỗi chính tả).  
7. **Có sẵn bootstrap confidence interval 95% và độ lệch chuẩn cho MRR** trong `run_benchmark.py:402-408` — nhưng khóa luận không hề nhắc đến. Đây là tài sản đang bị bỏ phí, xem mục C10.  

---

### Nhận xét bổ sung
Tuy nhiên, chính vì phần còn lại chặt chẽ nên **hai lỗi ở khâu tính chỉ số càng nổi bật**, và chúng làm sai lệch luận điểm trung tâm của Chương 6–7.
## PHẦN II. LỖI NGHIÊM TRỌNG — PHẢI SỬA TRƯỚC KHI NỘP

### Cập nhật sau khi kiểm tra mã nguồn
- Repo: **Super-Muscle-Coder/SISE**  
- Cả hai lỗi **A1** và **A2** đã được xác minh trực tiếp trong code, không còn là suy luận từ số liệu.  
- Bản vá cụ thể nằm ở file **EVAL_TOP_K=10** trong `ban-va-loi-do-luong.md`.  
- Xác nhận `backend.env.local` — đúng như đã suy ra từ trần Precision 0.900.  
- Nguyên nhân gốc của **A2** sâu hơn dự đoán ban đầu: không phải hàm `compute_recall` viết sai, mà là **ground truth được xây trong phạm vi top-k thay vì toàn bộ dữ liệu**.

---

### A1. MRR và Precision trên bộ tự thu thập bị chặn trần
Do ảnh truy vấn không bị loại khỏi danh sách kết quả.

#### Mâu thuẫn logic trực tiếp trong Bảng 6.5:
| Danh tính        | Confusion@1 | MRR   | Precision |
|------------------|-------------|-------|-----------|
| Jack Ma          | 0.0%        | 0.510 | 0.900     |
| Cindy Kimberly   | 0.0%        | 0.510 | 0.896     |
| Steve Jobs       | 0.0%        | 0.500 | 0.894     |

- **Confusion@1 = 0.0%** nghĩa là: với cả 50 truy vấn, kết quả xếp hạng cao nhất đều thuộc đúng danh tính đó.  
- Nếu vậy, kết quả đúng luôn nằm ở vị trí 1, và theo công thức mục 2.5 thì **MRR bắt buộc phải = 1.000**.  
- Bảng ghi 0.510 → mâu thuẫn.

#### Nguyên nhân (bằng chứng số học chắc chắn):
- Ảnh truy vấn tự khớp với chính nó (cosine = 1.0) nên luôn đứng vị trí 1.  
- Mục 5.2.3 nói rõ ảnh truy vấn bị loại khỏi tập đáp án đúng, nhưng nó **không bị loại khỏi danh sách xếp hạng**.  
- Kết quả: vị trí 1 luôn bị tính là **SAI**, kết quả đúng đầu tiên bị đẩy xuống vị trí 2.  
- MRR = 1/2 = 0.500 → khớp chính xác với dải quan sát được 0.408–0.520 của cả 20/20 danh tính.  

Ví dụ kiểm chứng chi tiết **Jack Ma**:  
- MRR = 0.5 + x/100 với x = số truy vấn có hit ở vị trí 1.  
- 0.510 → x = 1. Nhất quán.  

Precision@10 trần = 9/10 = 0.900.  
Trong Bảng 6.5, giá trị Precision cao nhất toàn bảng đúng bằng 0.900 (Jack Ma) và không danh tính nào vượt qua.  

---

#### Không nhất quán nội bộ
- Mục 4.4.4 mô tả rõ rằng khi tính Confusion@1, hệ thống **"loại trừ chính ảnh mẫu nếu nó tự xuất hiện trong kết quả"**.  
- Vậy Confusion@1 có loại self, còn MRR/Precision thì không → hai đường tính khác nhau trên cùng một danh sách kết quả.  

#### Xác minh trong code
- `evaluation_services.py:378` xây `ranked_ids` từ nguyên vẹn kết quả search, **không lọc ảnh truy vấn**.  
- Trong khi `_build_ground_truth_for_query` (dòng 280) đã loại nó khỏi `relevant_ids`.  
- Comment ở dòng 388–394 nhận ra tình huống này nhưng kết luận sai rằng nó *"không ảnh hưởng gian lận điểm số"*.  
- Thực tế: không thổi phồng điểm, nhưng **hạ điểm một cách hệ thống**.  
- Khối tính Confusion@1 (dòng 417–422) thì có bỏ qua self, đúng như đã suy luận.  

---

#### Mốc nghiệm thu bản vá
- Với mọi danh tính có Confusion@1 = 0%, kết quả hạng 1 sau khi loại self chắc chắn cùng danh tính → MRR phải bằng đúng 1.000.  
- Có 14/20 danh tính như vậy → suy ra chặn dưới toàn cục MRR ≥ 1 − 0.053 = 0.947 thay vì 0.4906.  
- Số thật lấy từ lượt chạy lại.  

---

#### Hệ quả — phần nghiêm trọng nhất
- Kết luận trung tâm ở mục 6.2.4, 6.3.1, 6.3.2 và 7.1 — *"MRR chỉ đạt 0.491, phản ánh đúng bản chất của CLIP là ưu tiên đặc trưng thị giác tổng quát hơn đặc trưng chi tiết về danh tính"* — là **kết luận sai**.  
- MRR thấp ở đây chủ yếu do **lỗi đo**, không phải do năng lực mô hình.  
- Sau khi loại self đúng cách, MRR thực tế sẽ vào khoảng **0.95–0.98** cho hầu hết danh tính (vì Confusion@1 = 0% ở 14/20 danh tính).  

---

### Cần làm
1. **Sửa code**: loại `image_id == query_image_id` khỏi ranked list trước khi cắt top-k (không phải sau).  
2. **Chạy lại benchmark** bộ tự thu thập.  
3. **Viết lại** mục 6.2.4, 6.3.1, 6.3.2, 7.1 theo số liệu mới.  
4. **Lưu ý**: kết luận chất lượng của khóa luận không sụp đổ — phát hiện về nhóm Faker/Gumayusi/Keria vẫn đứng vững vì Confusion@1 được tính đúng.  
   - Chỉ có phần diễn giải MRR phải viết lại.  
   - Thậm chí câu chuyện sẽ mạnh hơn: *"CLIP phân biệt danh tính tốt hơn dự đoán ban đầu, chỉ sụp đổ đúng ở vùng đồng phục"*.  

### A2. Recall trên bộ tự thu thập không đúng công thức ở mục 2.5 — thực chất đang là HitRate

#### Bằng chứng
- Trong Bảng 6.5, cột **HitRate** và cột **Recall** trùng khít tuyệt đối ở 20/20 danh tính (1.000/1.000, 0.980/0.980, 0.960/0.960) và ở cả dòng trung bình toàn cục (0.996/0.996).  
- Theo công thức mục 2.5:  
  

\[
  Recall@k = \frac{\text{số đáp án đúng trong top-k}}{\text{tổng số đáp án đúng}}
  \]

  
  Với bộ tự thu thập, mỗi truy vấn có 49 đáp án đúng, còn k = 10.  
  → **Recall@10 ≤ 10/49 ≈ 0.204** — về mặt toán học không thể đạt 1.000.  

---

#### Nguyên nhân gốc đã xác minh trong code
- Hàm `compute_recall` viết đúng công thức.  
- Lỗi nằm ở chỗ tập ground truth `relevant_ids` chỉ được xây từ các ảnh nằm trong top-k (`evaluation_services.py:280`, kèm comment ở dòng 274–276 nói rõ đây là tối ưu có chủ đích để giữ chi phí ở mức O(top_k)).  
- Vì `relevant_ids ⊆ ranked_ids[:k]`, mẫu số `len(relevant_ids)` luôn bằng đúng tử số → Recall = 1.0 bất cứ khi nào có hit, tức trùng định nghĩa **HitRate**.  
- Tối ưu này vô hại với Precision, HitRate và MRR — chỉ Recall bị phá vỡ.  

---

#### Vì sao Flickr30K không dính lỗi
- Trong `benchmark_external/run_benchmark.py:368-378`, ground truth được xây bằng cách quét toàn bộ corpus, nên Recall tính đúng (0.155 = 0.775/5).  
- Cùng một hàm, hai cách nạp dữ liệu khác nhau.  

---

#### Mốc nghiệm thu
- Quan hệ giữa hai chỉ số là cố định:  
  

\[
  Recall@10 = Precision@10 \times \frac{10}{49}
  \]

  
- Với Precision toàn cục 0.8127, Recall đúng phải rơi vào khoảng **0.17** chứ không phải 0.996.  
- Số thật lấy từ lượt chạy lại.  

---

#### Hệ quả
Các phát biểu sau đều sai và phải viết lại:
- Mục 6.2.4: *"HitRate và Recall đạt mức rất cao trên hầu hết các danh tính"* → hai chỉ số này đang là một.  
- Mục 6.3.2 và 7.1: *"HitRate và Recall của bộ tự thu thập cao hơn Flickr30K ở mức k tương đương"* → với Recall đúng (≤ 0.204), kết luận đảo ngược hoàn toàn.  
- Kỳ vọng ở mục 5.3.2 (*"Recall rất cao do ground truth lỏng"*) hiện chưa được kiểm chứng.  

---

### Cần làm
1. Sửa hàm tính Recall cho bộ tự thu thập, chạy lại, viết lại các mục trên.  
2. Nếu thời gian gấp, phương án tối thiểu chấp nhận được: **bỏ cột Recall khỏi Bảng 6.5 và ghi chú rõ lý do**, thay vì để một con số sai trong báo cáo.  

### A3. Không ghi nhận giá trị k

#### Vấn đề
- **Bảng 6.5** không có cột *k*.  
- Bảng không lưu `evaluation_metrics` (Phụ lục A) cũng chỉ có `top_k`, không lưu các chỉ số:  
  - mrr  
  - hit_rate  
  - precision  
  - recall  
  - confusion@1  
- Người đọc **không thể tái lập kết quả**.  

---

### Cần làm
1. Thêm cột **top_k** vào Bảng 6.5 và vào schema `evaluation_metrics`.  
2. Bổ sung cột lưu **Confusion@1** (hiện đang tính bằng script ngoài, không có dấu vết trong DB — hội đồng có thể chất vấn tính tái lập).  

### A4. Trích dẫn [13] và [14] bị hoán đổi

#### Vấn đề
- Thân bài mục 6.1.3: *"theo AndresPMD ... [13]"* và *"Hendriksen và cộng sự ... [14]"*.  
- Danh mục TLTK: [13] = Hendriksen, [14] = AndresPMD.  
- Hoán đổi ngược.  

#### Cần làm
- Kiểm tra lại toàn bộ vị trí xuất hiện của [13], [14] (gồm cả mục 5.1: *"[12, 13]"*).  

---

### A5. Con số CLIP zero-shot dùng để đối chiếu rất đáng ngờ — và nhóm đang tự làm khó mình

#### Vấn đề
- Mục 6.1.3 nêu: AndresPMD cho R@1 = 36.0% (ảnh→văn bản) và 55.8% (văn bản→ảnh).  
- Con số này bất thường vì trong mọi công bố về **image-text retrieval**, chiều ảnh→văn bản luôn cao hơn chiều văn bản→ảnh.  
- Ở đây thứ tự bị đảo → nhiều khả năng nhóm đã đọc nhầm cột/hoán vị hai chiều khi trích bảng, hoặc con số 36.0% thuộc về một baseline khác không phải CLIP zero-shot.  

#### Thực tế
- Kết quả của nhóm — HitRate@1 = 77.5% (I→T) và 56.9% (T→I) — thực ra khớp rất tốt với số liệu công bố cho **CLIP ViT-B/32 zero-shot trên Flickr30K**.  
- Nghĩa là kết quả benchmark của nhóm nhiều khả năng là chính xác.  
- Cả đoạn biện minh dài ở mục 6.1.3 (*"biên độ dao động rộng từ 36% đến hơn 80%"*) là **không cần thiết**.  

---

### Cần làm
1. Tra lại **Table 13** trong bài gốc CLIP (*Radford et al., 2021 — đã là TLTK [2]*) và lấy đúng dòng **ViT-B/32 trên Flickr30K**. Đây phải là nguồn đối chiếu chính.  
2. Giữ AndresPMD làm nguồn phụ, hoặc bỏ hẳn nếu không kiểm chứng lại được con số 36.0%.  
3. Viết lại mục 6.1.3 theo hướng khẳng định:  
   *"kết quả của nhóm nằm sát số liệu công bố cho cùng biến thể kiến trúc, xác nhận pipeline đánh giá được hiện thực đúng"* — mạnh hơn nhiều so với việc phải giải thích một chênh lệch 41 điểm phần trăm.  
### A6. Mô tả bộ dữ liệu Flickr30K tự mâu thuẫn và đang hạ thấp giá trị công trình

#### Vấn đề
- Mục 5.2.1 viết: *"tập con lấy mẫu ngẫu nhiên có kiểm soát từ tập kiểm tra chuẩn Karpathy, gồm 1000 ảnh"*.  
- Rồi ngay sau đó, mục 5.2.1 giải thích: *"chỉ lấy 1000 ảnh thay vì 31800 ảnh vì giới hạn thời gian và tài nguyên"*.  
- Vấn đề: Karpathy test split của Flickr30K vốn đã đúng là **1000 ảnh** (29000 train / 1014 val / 1000 test).  
- Nếu nhóm dùng toàn bộ split này thì **không hề có bước "lấy mẫu ngẫu nhiên"** nào cả.  

#### Hai khả năng, nhóm cần xác định rõ:
1. **Dùng đúng toàn bộ Karpathy test split** → đây là chuẩn đánh giá được dùng trong mọi công bố về *image-text retrieval*.  
   - Phải nói thẳng điều đó, vì nó khiến kết quả so sánh trực tiếp được với văn liệu.  
   - Câu *"vì giới hạn thời gian"* phải bỏ — nó biến một lựa chọn phương pháp luận đúng đắn thành một sự thỏa hiệp.  
2. **Lấy ngẫu nhiên 1000 ảnh từ 31k** → thì không so sánh được với các công bố dùng Karpathy split, và toàn bộ mục 6.1.3 phải nói rõ giới hạn này.  

#### Hệ quả
- Đây là điểm hội đồng rất dễ hỏi và câu trả lời quyết định độ tin cậy của cả Chương 6.  

---

### A7. Số liệu latency: trung bình nhỏ hơn trung vị ở cả hai bộ

#### Bảng số liệu
| Bộ dữ liệu                  | P50 (ms) | Trung bình (ms) | Chênh |
|-----------------------------|----------|-----------------|-------|
| Flickr30K (embedding ảnh)   | 554.5    | 482.3           | −72   |
| Tự thu thập (embedding ảnh) | 571.5    | 523.5           | −48   |
| Embedding văn bản           | 516.2    | 466.6           | −49.6 |

#### Vấn đề
- Phân phối latency gần như luôn lệch phải (đuôi dài về phía chậm), nên **trung bình thường ≥ trung vị**.  
- Ở đây ngược lại ở cả hai bộ và cả với embedding văn bản.  
- Có thể là thật (nếu có một cụm lớn request rất nhanh, ví dụ ảnh nhỏ hoặc hiệu ứng cache).  
- Nhưng nhiều khả năng hơn là **lỗi tổng hợp số liệu**: trung bình và các phân vị được tính trên hai tập mẫu khác nhau, hoặc gộp nhầm mẫu warm-up.  

---

### Cần làm
- Kiểm tra lại script đo.  
- Nếu số liệu đúng thì phải bổ sung một câu giải thích trong mục 6.1.4 (hội đồng có người sẽ nhận ra).  

## PHẦN III. THIẾU SÓT SO VỚI ÐỀ CƯƠNG (hội đồng gần như chắc chắn hỏi)

### B1. Không có thực nghiệm nào đánh giá ANN/HNSW — trong khi đây là một yêu cầu chính của đề tài

#### Ðề cương yêu cầu
- *"Triển khai cơ chế tìm kiếm gần đúng sử dụng thuật toán ANN nhằm tối ưu tốc độ truy vấn"*  
- Kết quả dự kiến: *"Đánh giá và so sánh hiệu năng giữa các phương pháp tìm kiếm được áp dụng"*

#### Hiện trạng bản thảo (đã xác minh trong code)
- Benchmark Flickr30K **không đi qua pgvector**.  
- `run_benchmark.py:248-251, 368, 375` dùng `numpy matmul + np.argsort` — brute-force thuần túy.  
- **Bảng 6.4** đang đo phép nhân ma trận numpy, không phải truy vấn HNSW.  
- Không có bất kỳ phép đo nào so sánh HNSW với exact search:  
  - Không đo recall của ANN.  
  - Không đo latency truy vấn pgvector.  
  - Không khảo sát `ef_search`.  
- Cấu hình `ef_construction = 200` (mục 4.2.1) được biện luận thuần lý thuyết, không có số liệu chứng minh.  
- Đây là **lỗ hổng lớn nhất** giữa bản thảo và đề cương.  
- Chương 4 mô tả HNSW rất kỹ nhưng Chương 6 **không đo nó lần nào**.  

---

### Thí nghiệm bổ sung tối thiểu (làm được trong 1–2 buổi)
Đề nghị bổ sung thành mục **6.1.5**:

| Cấu hình                       | Recall@10 so với exact | Latency P50 truy vấn |
|--------------------------------|------------------------|----------------------|
| Exact (SET enable_indexscan=off)| 1.000 (chuẩn)          | ?                    |
| HNSW, ef_search = 40           | ?                      | ?                    |
| HNSW, ef_search = 64 (đang dùng)| ?                     | ?                    |
| HNSW, ef_search = 128          | ?                      | ?                    |

- Chạy 1000 truy vấn, so tập kết quả HNSW với tập exact, tính tỉ lệ trùng.  
- Bảng này một mình đã đủ lấp lỗ hổng B1 và trả lời trực tiếp câu hỏi hội đồng chắc chắn hỏi.  


## PHẦN III. THIẾU SÓT SO VỚI ÐỀ CƯƠNG (tiếp)

### B2. Chưa có bằng chứng về "khả năng xử lý dữ liệu lớn và mở rộng"
- Toàn bộ thực nghiệm ở quy mô 1000 vector.  
- Ở quy mô này HNSW không nhanh hơn brute-force (thậm chí có thể chậm hơn do chi phí duyệt đồ thị).  
- Cần hoặc:  
  (a) Đo latency truy vấn theo N (1k → 10k → 100k vector sinh ngẫu nhiên) để thể hiện xu hướng.  
  (b) Nói thẳng trong mục 6.3.3 rằng khả năng mở rộng mới chỉ được lập luận về mặt kiến trúc, chưa được kiểm chứng bằng thực nghiệm.  
- Phương án (a) tốn khoảng nửa buổi và giá trị cao hơn hẳn.  

---

### B3. Chế độ text-to-image chưa được đánh giá trên chính hệ thống SISE
- Bộ tự thu thập chỉ đánh giá image-to-image.  
- Flickr30K có cả hai chiều nhưng chạy ngoài hệ thống (brute-force).  
- Vậy chiều text-to-image của hệ thống thật chưa từng được đo, dù đó là một trong hai chức năng cốt lõi của đề tài.  

---

### B4. Tài liệu hướng dẫn cài đặt và sử dụng
- Ðề cương yêu cầu mục này.  
- Không thấy trong ba phụ lục (A: dữ liệu, B: API, C: kiến trúc).  
- Nếu đã có README trong repo thì cần dẫn chiếu rõ trong báo cáo, hoặc bổ sung Phụ lục D.  

---

## PHẦN IV. VẤN ÐỀ HỌC THUẬT VÀ TRÌNH BÀY

| Mục | Vấn đề | Ðề nghị |
|-----|--------|---------|
| **C1** 5.2.2 | Liêm chính học thuật: dataset là ảnh người thật thu thập từ Internet, dùng cho bài toán phân biệt danh tính. Hiện chỉ có 1 câu ghi chú. | Bổ sung một đoạn ngắn: nguồn ảnh, phạm vi sử dụng học thuật, cam kết không phân phối lại dataset, không dùng cho mục đích giám sát. Hội đồng ngày càng chú ý điểm này. |
| **C2** toàn văn | Dùng cụm "nhận diện danh tính" dễ gây hiểu là face recognition. CLIP không phải mô hình nhận dạng khuôn mặt. | Ðổi thành "phân biệt danh tính dựa trên tương đồng thị giác tổng thể" ở những chỗ then chốt. |
| **C3** 6.2.1 | Nhãn "Group of People" bản chất khác 19 danh tính còn lại nhưng vẫn gộp vào trung bình toàn cục, làm nhiễu con số. | Báo cáo song song: trung bình có và không có nhóm này. |
| **C4** 5.2.2 / 6.2.4 | "Tom Shelby" (Bảng 5.1, 6.5) vs "Tommy Shelby" (mục 6.2.4). Tên đúng: Tommy Shelby. | Thống nhất toàn văn. |
| **C5** 6.1.4 | "dao động trong khoảng 480 đến 730 ms tùy mức đo" — 480 là trung bình, 730 là P99, trộn hai loại đại lượng. | Viết lại: "P50 554.5 ms, P99 730.9 ms". |
| **C6** 4.1 / 6.1.4 | Latency ~550 ms/ảnh cho ViT-B/32 trên CPU là chậm so với thông thường. Hội đồng sẽ hỏi. | Nói rõ con số này bao gồm HTTP round trip + decode + preprocess, không phải thời gian forward pass thuần; nêu số nhân CPU cấp cho container. |
| **C7** Bảng 4.2 | Cột tham số bị mất tên (m, ef_construction, ef_search) trong bản trích xuất — chỉ còn giá trị 16/16, 64/200, 40/64. | Kiểm tra bản Word có hiển thị tên tham số không (có thể do dùng ký hiệu toán học). |
| **C8** 2.1, 2.2, 2.5 | Toàn bộ công thức toán và ký hiệu biến bị mất khi trích xuất văn bản (dùng OMML). Không đánh giá được. | Kiểm tra thủ công: mọi ký hiệu trong công thức phải được giải thích ngay sau đó, và phải hiển thị đúng khi xuất PDF. |
| **C9** 4.3 | Tệp app/init.py — trong repo thực tế là app/__init__.py. | Sửa lại trong báo cáo. |
| **C10** 6.1 | Cơ hội bị bỏ phí: run_benchmark.py đã tính sẵn bootstrap CI 95% và độ lệch chuẩn cho MRR, nhưng Bảng 6.1 không có. | Thêm cột CI 95% vào Bảng 6.1. Nó nâng chất lượng phần thực nghiệm rõ rệt và trả lời trước câu hỏi hội đồng "chỉ chạy một lần thì làm sao biết ổn định". Ðây là việc chỉ tốn vài phút vì số liệu đã có sẵn trong output/flickr30k_results.json. |
| **C11** 5.2.2, 6.2 | Nhãn dữ liệu sai chính tả so với báo cáo: own_dataset_benchmark.json chứa "talor swift" (thiếu chữ y) và "steven jobs", trong khi Bảng 5.1/6.5 ghi "Taylor Swift", "Steve Jobs". Vì normalize_tag() không sửa lỗi chính tả (docstring dòng 36–44 nêu rõ), ảnh nào gắn tag đúng chính tả sẽ không khớp nhóm còn lại và bị tính sai. | Rà lại toàn bộ tag trong DB; thống nhất tên giữa dữ liệu và báo cáo. |
| **C12** Phụ lục A | Bảng evaluation_metrics không lưu top_k lẫn Confusion@1 → Bảng 6.5 không tái lập được từ dữ liệu hệ thống. | Thêm hai cột, cập nhật Phụ lục A. Xem bản vá Lỗi 3. |
