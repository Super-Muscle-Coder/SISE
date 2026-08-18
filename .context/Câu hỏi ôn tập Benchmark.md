# CÂU HỎI ÔN TẬP — TRỤ CỘT 3: ĐÁNH GIÁ THỰC NGHIỆM

---

## Cấp độ 1 — Câu hỏi chí mạng (giảng viên gần như chắc chắn hỏi)

**Câu 1.** Trình bày công thức và ý nghĩa của 4 chỉ số MRR, HitRate, Precision@k, Recall@k. Với mỗi chỉ số, chỉ số đó "khoan dung" hay "khắt khe" nhất theo tiêu chí nào?

**Câu 2.** Giải thích khái niệm "trần lý thuyết" (ceiling) của Precision@k và Recall@k. Vì sao Precision@10 = 0.090 trên Flickr30K (chiều văn bản→ảnh) không có nghĩa là mô hình yếu?

**Câu 3.** Confusion@1 là gì, được thiết kế để giải quyết vấn đề nào mà 4 chỉ số kinh điển không giải quyết được? Nêu giá trị đo được và ý nghĩa của việc giá trị này không đổi trước/sau khi vá lỗi.

---

## Cấp độ 2 — Câu hỏi hóc búa (đo độ hiểu sâu)

**Câu 4.** Trình bày chi tiết cơ chế của 2 lỗi đo lường đã phát hiện trên bộ dữ liệu tự thu thập: một lỗi khiến MRR bị chặn trần ở 0.5, một lỗi khiến Recall trùng khít HitRate. Giải thích bằng chính công thức, không chỉ mô tả hiện tượng, và nêu con số đúng sau khi đã vá.

**Câu 5.** Vì sao số liệu latency phiên bản cũ (trước khi sửa) "trông vô lý về mặt thống kê"? Giải thích bằng quy luật phân phối lệch phải và mối quan hệ giữa Mean và Median (P50).

**Câu 6.** Nếu hội đồng hỏi "làm sao nhóm biết chắc 2 giá trị bất thường (MRR=0.5 đồng loạt, Recall=HitRate) là lỗi đo lường chứ không phải mô hình thực sự yếu, không phải nhóm tự bào chữa cho một kết quả tệ?" — trình bày lập luận đầy đủ, dựa trên bằng chứng độc lập.

---

## Cấp độ 3 — Câu hỏi mở rộng (test khả năng liên hệ ngoài phạm vi 5 chỉ số)

**Câu 7.** So sánh Confusion@1 với Rank-1 accuracy/CMC@1 trong lĩnh vực Person Re-Identification — điểm giống, điểm khác, và đâu là đóng góp thực sự của Confusion@1 so với việc chỉ dùng lại Rank-1 accuracy có sẵn?

**Câu 8.** Giải thích vì sao SISE không cần dùng NDCG (Normalized Discounted Cumulative Gain) thay cho MRR, dựa trên bản chất ground truth của bài toán nhận diện danh tính. Nếu ép dùng NDCG bằng cách lấy cosine similarity của CLIP làm thang đo mức độ liên quan, vấn đề phương pháp luận nào sẽ phát sinh?

**Câu 9.** Với hai chỉ số cùng đo "có tìm được kết quả đúng hay không" nhưng ở hai mức độ khác nhau — HitRate (khoan dung, chỉ cần 1 kết quả đúng) và Precision (khắt khe, đo tỉ lệ sạch của toàn bộ top-k) — hãy dựng một tình huống giả định mà HitRate rất cao nhưng Precision rất thấp, và giải thích tình huống này nói lên điều gì về đặc điểm của ground truth hoặc năng lực mô hình.

---

# Câu trả lời hoàn chỉnh — Cấp độ 1 

---

## Câu 1. Bốn chỉ số kinh điển: công thức, ý nghĩa, và tiêu chí "khắt khe"

*"Trình bày công thức và ý nghĩa của 4 chỉ số MRR, HitRate, Precision@k, Recall@k. Với mỗi chỉ số, chỉ số đó 'khoan dung' hay 'khắt khe' nhất theo tiêu chí nào?"*

### Phần lõi

Bốn chỉ số MRR, HitRate, Precision@k, Recall@k đều đo chất lượng của một hệ thống truy hồi, nhưng mỗi chỉ số khắt khe theo một tiêu chí hoàn toàn khác nhau, không thể so sánh trực tiếp mức độ "khắt khe" giữa chúng.

**MRR** (Mean Reciprocal Rank) tính trung bình nghịch đảo vị trí của kết quả đúng đầu tiên xuất hiện trong ranked list, qua công thức $MRR = \frac{1}{N}\sum \frac{1}{\text{rank}_i}$. Đây là chỉ số khắt khe nhất về mặt **vị trí xuất hiện** — nó phạt rất nặng nếu kết quả đúng nằm xa vị trí đầu, phản ánh đúng trải nghiệm người dùng thực tế: kết quả đúng hiện ra ngay lập tức hay phải cuộn xuống nhiều mới thấy.

**HitRate@k** đo tỉ lệ truy vấn có ít nhất một kết quả đúng xuất hiện trong top-k. Đây là chỉ số khoan dung nhất trong bốn chỉ số — không quan tâm có bao nhiêu kết quả đúng hay chúng nằm ở vị trí nào, chỉ cần có mặt là được tính điểm đầy đủ.

**Precision@k** tính tỉ lệ phần trăm kết quả đúng trong số k kết quả trả về, qua công thức $Precision@k = \frac{\text{số đúng trong top-k}}{k}$. Đây là chỉ số khắt khe nhất về **độ tinh khiết nội bộ của danh sách trả về** — nó đòi hỏi càng nhiều kết quả trong top-k phải đúng càng tốt, không khoan nhượng cho các kết quả sai lẫn vào.

**Recall@k** tính tỉ lệ phần trăm kết quả đúng tìm được trên tổng số đáp án đúng có trong toàn bộ dữ liệu, qua công thức $Recall@k = \frac{\text{số đúng trong top-k}}{\text{tổng số đáp án đúng toàn bộ}}$. Đây là chỉ số khắt khe nhất về **độ bao phủ** — nó đòi hỏi hệ thống phải vét được càng nhiều đáp án đúng càng tốt trên toàn bộ tập dữ liệu, không chỉ dừng lại ở việc tìm được một vài kết quả đúng.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Trong 4 chỉ số này, chỉ số nào là khắt khe nhất tổng thể?"**

Không thể xếp hạng mức độ khắt khe chung cho cả 4 chỉ số, vì mỗi chỉ số khắt khe theo một trục hoàn toàn độc lập — vị trí (MRR), độ tinh khiết nội bộ (Precision), độ bao phủ toàn cục (Recall), và sự hiện diện tối thiểu (HitRate, khoan dung nhất). Một hệ thống có thể đạt điểm rất cao ở chỉ số này nhưng rất thấp ở chỉ số khác, vì chúng đo những khía cạnh chất lượng khác nhau của cùng một kết quả truy vấn. Đây chính là lý do một benchmark đầy đủ cần báo cáo cả bốn chỉ số song song, không thể dùng một chỉ số duy nhất để đại diện cho toàn bộ chất lượng hệ thống.

**Nếu hội đồng hỏi: "Vì sao không chỉ dùng HitRate, vì nó đơn giản và dễ hiểu nhất?"**

HitRate tuy dễ hiểu nhưng bỏ sót nhiều thông tin quan trọng. Hai hệ thống có thể có HitRate giống hệt nhau (đều tìm được ít nhất một kết quả đúng trong top-k) nhưng khác biệt hoàn toàn về chất lượng trải nghiệm — một hệ thống luôn đặt kết quả đúng ở vị trí đầu, hệ thống kia đặt nó ở vị trí gần cuối top-k. Nếu chỉ dùng HitRate, hai hệ thống này sẽ trông giống hệt nhau dù trải nghiệm thực tế khác biệt rõ rệt, đây chính là lý do cần thêm MRR để đo được khía cạnh vị trí mà HitRate bỏ qua.

---

## Câu 2. Trần lý thuyết (Ceiling) và ứng dụng vào số liệu Flickr30K

*"Giải thích khái niệm 'trần lý thuyết' (ceiling) của Precision@k và Recall@k. Vì sao Precision@10 = 0.090 trên Flickr30K (chiều văn bản→ảnh) không có nghĩa là mô hình yếu?"*

### Phần lõi

"Trần lý thuyết" của Precision@k và Recall@k là giới hạn tối đa mà các chỉ số này có thể đạt được, hoàn toàn không phụ thuộc vào năng lực mô hình mà phụ thuộc vào đặc thù cấu trúc dữ liệu và giá trị k được chọn.

Với Precision@k, trần lý thuyết bị giới hạn bởi số lượng đáp án đúng so với k: nếu một truy vấn chỉ có 1 đáp án đúng trong toàn bộ dữ liệu, Precision@10 tối đa chỉ có thể là 0.1, dù hệ thống có hoàn hảo tuyệt đối, vì công thức luôn chia cho k=10 trong khi tử số tối đa chỉ có thể bằng 1. Với Recall@k, trần lý thuyết bị giới hạn bởi k so với tổng số đáp án đúng: nếu một truy vấn có 49 đáp án đúng mà chỉ xét top-10, Recall@10 tối đa chỉ đạt khoảng 0.204, dù mô hình tìm đúng toàn bộ 10/10 kết quả trả về.

Ceiling cho thấy mức cao nhất hệ thống có thể đạt được trong điều kiện cấu trúc dữ liệu đã cho, giúp phân biệt rõ giữa "chỉ số thấp do mô hình kém" và "chỉ số thấp do bản chất dữ liệu và tham số k giới hạn từ đầu".

Áp dụng cụ thể vào Flickr30K, chiều văn bản→ảnh: ground truth được thiết kế theo kiểu một-một, mỗi câu văn bản chỉ có đúng một ảnh là đáp án đúng trong toàn bộ dataset. Với k=10, trần lý thuyết của Precision@10 là 1/10 = 0.1. Giá trị đo được thực tế là 0.090, chỉ cách trần lý thuyết đúng 0.01 — nghĩa là mô hình đã đạt khoảng 90% của mức tối đa có thể đạt được trong chính điều kiện cấu trúc dữ liệu này. Đây là kết quả gần như tối ưu tuyệt đối, không phải dấu hiệu của một mô hình yếu như con số 0.090 có thể gây hiểu lầm nếu đọc tách rời khỏi bối cảnh ceiling.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Vậy tại sao không chọn k nhỏ hơn để Precision trông cao hơn, có phải nhóm đang chọn k để né tránh con số xấu không?"**

Việc chọn k không nhằm mục đích tối ưu hóa hình thức con số, mà dựa trên mục đích đánh giá thực tế — k=10 phản ánh đúng số lượng kết quả một người dùng thực tế thường xem trong một trang kết quả tìm kiếm. Nếu chọn k=1 để Precision trông cao hơn, hệ thống sẽ mất đi khả năng đánh giá chất lượng của toàn bộ danh sách kết quả mà người dùng thực sự nhìn thấy. Việc trình bày kèm ceiling chính là cách xử lý đúng đắn hơn nhiều so với việc chọn k để "làm đẹp" con số — nó cho phép giữ nguyên k có ý nghĩa thực tế, đồng thời vẫn diễn giải đúng bản chất của con số đo được.

**Nếu hội đồng hỏi: "Làm sao biết chắc ceiling này tính đúng, không phải nhóm tự bịa ra để giải thích cho một kết quả thấp?"**

Ceiling được tính trực tiếp từ công thức Precision@k và cấu trúc ground truth đã công bố của chính dataset Flickr30K, không phải một con số tự đặt ra. Với thiết kế ground truth một-một đã biết trước của Flickr30K, việc suy ra trần lý thuyết chỉ là một phép tính toán học đơn giản dựa trên định nghĩa của chính công thức Precision, không có không gian để "bịa" theo hướng có lợi. Đây cũng là lý do khi trình bày, cần nêu rõ cách tính ceiling cùng với con số đo được, để người đọc có thể tự kiểm chứng độc lập.

---

## Câu 3. Confusion@1 — định nghĩa, mục đích, và ý nghĩa của tính bất biến

*"Confusion@1 là gì, được thiết kế để giải quyết vấn đề nào mà 4 chỉ số kinh điển không giải quyết được? Nêu giá trị đo được và ý nghĩa của việc giá trị này không đổi trước/sau khi vá lỗi."*

### Phần lõi

Confusion@1 là một chỉ số tự thiết kế, đo tỉ lệ phần trăm truy vấn mà kết quả xếp hạng ở vị trí số 1 sai — cụ thể là kết quả đó thuộc về một danh tính khác hẳn so với danh tính của truy vấn, chứ không đơn thuần là một ảnh sai bất kỳ.

Chỉ số này được thiết kế để giải quyết một vấn đề mà bốn chỉ số kinh điển, đặc biệt là MRR, không tự phân biệt được: MRR thấp có thể bắt nguồn từ hai nguyên nhân có mức độ nghiêm trọng hoàn toàn khác nhau. Nguyên nhân thứ nhất là mô hình thực sự nhầm lẫn danh tính, ví dụ truy vấn ảnh của một người nhưng trả về kết quả hàng đầu thuộc về người khác hoàn toàn — đây là lỗi nghiêm trọng, phản ánh khả năng phân biệt đối tượng kém. Nguyên nhân thứ hai là mô hình đã đúng danh tính nhưng chưa xếp thứ tự nội bộ tối ưu giữa các ảnh cùng một người, do nhiễu từ góc chụp hoặc trang phục khác nhau — đây là vấn đề nhẹ hơn nhiều, không phải lỗi nhận diện sai người. Bản thân công thức MRR đối xử với cả hai nguyên nhân này như nhau, đều làm giảm điểm số như nhau, nên không thể dùng riêng MRR để biết mức độ nghiêm trọng thực sự của vấn đề. Confusion@1 tách bạch hai nguyên nhân này bằng cách chỉ đếm đúng nguyên nhân thứ nhất.

Giá trị Confusion@1 đo được trên bộ dữ liệu tự thu thập là 5.3%, và điều quan trọng nhất là giá trị này giữ nguyên không đổi cả trước và sau khi hai lỗi đo lường của MRR và Recall được phát hiện và vá. Điều này có ý nghĩa quan trọng vì công thức của Confusion@1 hoàn toàn độc lập với hai lỗi đó — nó không bị ảnh hưởng bởi việc ảnh truy vấn có bị loại khỏi ranked list hay ground truth được xây dựng trong phạm vi nào. Vì vậy, việc Confusion@1 không đổi trong khi MRR nhảy vọt từ khoảng 0.49 lên 0.968 sau khi vá lỗi chính là bằng chứng độc lập, đáng tin cậy, cho thấy năng lực phân biệt danh tính thực sự của mô hình chưa từng thay đổi trong suốt quá trình — chỉ có phép đo trước đó là sai, không phải mô hình đột nhiên trở nên tốt hơn.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Confusion@1 có phải một chỉ số hoàn toàn mới trong lĩnh vực này không?"**

Về bản chất đo lường ở vị trí top-1, Confusion@1 có họ hàng gần với Rank-1 accuracy hay CMC@1, những chỉ số kinh điển trong lĩnh vực Person Re-Identification, vốn là bài toán rất gần với bộ dữ liệu tự thu thập của nhóm. Điểm khác biệt và đóng góp riêng của Confusion@1 không nằm ở cách đo, mà nằm ở mục đích sử dụng: thay vì chỉ đo hiệu năng tổng thể như Rank-1 accuracy thường được dùng, nhóm thiết kế nó để chẩn đoán và tách bạch nguyên nhân khi MRR thấp, một góc nhìn chẩn đoán mà nhóm không thấy được trình bày minh bạch trong các tài liệu Re-ID đã khảo sát.

**Nếu hội đồng hỏi: "Nếu Confusion@1 độc lập với 2 lỗi kia, vậy tại sao nhóm không phát hiện lỗi sớm hơn bằng chính chỉ số này, mà phải đợi tới giai đoạn rà soát cuối?"**

Trong quá trình chạy benchmark ban đầu, các chỉ số được tính toán và ghi nhận song song mà chưa có bước đối chiếu chéo có hệ thống giữa chúng. Việc phát hiện ra sự bất thường chỉ đến khi nhóm chủ động đặt câu hỏi tại sao MRR lại đồng loạt dừng ở đúng 0.5 tại mọi danh tính, một con số quá tròn để là ngẫu nhiên, rồi đối chiếu với Confusion@1 để kiểm tra xem năng lực phân biệt danh tính có thực sự tệ đến mức đó hay không. Đây chính là bài học phương pháp luận nhóm rút ra: cần chủ động đối chiếu chéo giữa các chỉ số độc lập với nhau ngay trong quá trình đánh giá, không chỉ chờ đến giai đoạn rà soát cuối mới thực hiện.

---

# Câu trả lời hoàn chỉnh — Cấp độ 2 

---

## Câu 4. Cơ chế chi tiết 2 lỗi đo lường

*"Trình bày chi tiết cơ chế của 2 lỗi đo lường đã phát hiện trên bộ dữ liệu tự thu thập: một lỗi khiến MRR bị chặn trần ở 0.5, một lỗi khiến Recall trùng khít HitRate. Giải thích bằng chính công thức, không chỉ mô tả hiện tượng, và nêu con số đúng sau khi đã vá."*

### Phần lõi

**Lỗi thứ nhất — MRR bị chặn trần ở 0.5.** Với mỗi truy vấn bằng ảnh, sau khi tính cosine similarity, ảnh dùng để truy vấn luôn tự khớp tuyệt đối với chính nó và chiếm vị trí xếp hạng cao nhất. Ground truth đã đúng khi loại ảnh truy vấn ra khỏi tập đáp án đúng, nhưng ranked list lại không loại ảnh đó ra trước khi tính điểm. Hệ quả là vị trí xếp hạng cao nhất luôn bị chiếm bởi một kết quả không được công nhận là đúng, nên kết quả đúng thực sự, dù mô hình có năng lực tốt tới đâu, chỉ có thể xuất hiện sớm nhất ở vị trí xếp hạng thứ hai. Với mọi truy vấn đều rơi vào tình huống này, Reciprocal Rank tối đa đạt được luôn là 1/2, kéo theo MRR trung bình bị khóa cứng ở 0.5.

Minh họa bằng ví dụ tự dựng: ba danh tính, mỗi người năm ảnh, lấy top-5, mô hình có năng lực hoàn hảo. Nếu ảnh truy vấn không bị loại khỏi ranked list, vị trí xếp hạng cao nhất luôn bị nó chiếm và bị tính sai, nên kết quả đúng tốt nhất mà mô hình đạt được trong mọi trường hợp đều rơi vào hạng hai. Với mười lăm lượt truy vấn, mỗi lượt Reciprocal Rank = 0.5:
$$MRR = \frac{0.5 \times 15}{15} = 0.5$$

**Lỗi thứ hai — Recall trùng khít HitRate.** Tập đáp án đúng của mỗi truy vấn, thay vì được xây dựng trên toàn bộ dữ liệu, chỉ được xây dựng trong phạm vi chính top-k đã lấy ra — một tối ưu hóa có chủ đích nhằm giữ chi phí tính toán ở mức thấp, nhưng vô tình phá vỡ tính đúng đắn của công thức Recall. Vì tập đáp án đúng luôn là tập con của chính top-k, mẫu số của công thức Recall luôn bằng đúng tử số mỗi khi có ít nhất một kết quả đúng được tìm thấy, khiến Recall luôn bằng 1.0 trong mọi trường hợp có Hit — biến Recall thành một chỉ số trùng lặp hoàn toàn với HitRate.

Có thể suy ra nguyên nhân bằng phương pháp loại trừ, không cần đọc lại code cũ: với bộ dữ liệu tự thu thập, mỗi danh tính có 49 ảnh đáp án đúng, k=10, nên Recall đúng theo lý thuyết phải bị chặn trần ở khoảng 10/49 ≈ 0.204. Giá trị quan sát được trước khi vá (gần tuyệt đối, trùng HitRate) hoàn toàn mâu thuẫn với trần lý thuyết này — chỉ còn đúng một khả năng hợp lý duy nhất giải thích được mâu thuẫn đó: mẫu số của Recall không đang so với toàn bộ 49 đáp án đúng, mà chỉ đang so nội bộ trong phạm vi top-k.

Sau khi cả hai lỗi được vá, chạy lại toàn bộ benchmark, số liệu đúng thu được là MRR khoảng 0.968 và Recall khoảng 0.183, nằm rất sát trần lý thuyết khoảng 0.204.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Lỗi thứ hai có phải do thiếu cẩn thận khi viết code không?"**

Lỗi thứ hai bắt nguồn từ một quyết định tối ưu hóa có chủ đích, nhằm giữ chi phí tính toán ở mức thấp bằng cách chỉ xây tập đáp án đúng trong phạm vi top-k thay vì quét toàn bộ dữ liệu mỗi lần đánh giá. Vấn đề không nằm ở sự thiếu cẩn thận, mà ở việc chưa lường trước hệ quả toán học của quyết định tối ưu hiệu năng đó lên chính công thức Recall. Đây là bài học phương pháp luận quan trọng: một tối ưu hóa hợp lý ở góc độ hiệu năng hoàn toàn có thể vô tình phá vỡ tính đúng đắn ở góc độ thống kê, hai mối quan tâm này cần được kiểm tra riêng biệt.

**Nếu hội đồng hỏi: "Vì sao Flickr30K không gặp phải lỗi tương tự?"**

Cách xây dựng ground truth cho hai bộ dữ liệu được hiện thực khác nhau. Với Flickr30K, ground truth được xây dựng bằng cách quét toàn bộ corpus ngay từ đầu, không giới hạn trong phạm vi top-k, nên Recall được tính đúng ngay từ lần chạy đầu tiên. Đây là bằng chứng khẳng định lỗi nằm ở khâu triển khai cụ thể cho luồng dữ liệu tự thu thập, không phải sai sót trong bản thân công thức Recall nói chung.

---

## Câu 5. Vì sao số liệu latency cũ "trông vô lý về mặt thống kê"

*"Vì sao số liệu latency phiên bản cũ (trước khi sửa) 'trông vô lý về mặt thống kê'? Giải thích bằng quy luật phân phối lệch phải và mối quan hệ giữa Mean và Median (P50)."*

### Phần lõi

Độ trễ trong hầu hết hệ thống thực tế luôn tuân theo phân phối lệch phải: đa số request xử lý nhanh, nhưng luôn có một số ít request bị "đuôi dài" do các nguyên nhân như garbage collection, tranh chấp tài nguyên, hay cold start. Với phân phối lệch phải, quy luật thống kê cơ bản luôn là giá trị trung bình lớn hơn trung vị, vì trung bình bị "kéo" về phía đuôi dài do các giá trị lớn bất thường, trong khi trung vị chỉ phản ánh điểm giữa, không bị ảnh hưởng bởi outlier.

Ở bộ số liệu cũ, trước khi sửa, giá trị trung bình lại nhỏ hơn trung vị ở cả ba phép đo latency — ví dụ Flickr30K embed ảnh có P50 là 554.5 nhưng Mean chỉ 482.3. Đây là dấu hiệu bất thường, không phải một hiện tượng tự nhiên hợp lý, vì nó đi ngược lại quy luật cơ bản của phân phối lệch phải. Bộ số liệu mới, sau khi sửa, tuân đúng quy luật này ở cả ba phép đo, với trung bình luôn lớn hơn trung vị — đây chính là bằng chứng gián tiếp cho thấy số liệu mới đáng tin cậy hơn số liệu cũ.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Làm sao chỉ nhìn Mean và P50 mà biết được số liệu có vấn đề, đây có phải suy luận quá vội vàng không?"**

Đây không phải suy luận vội vàng mà dựa trên một quy luật thống kê đã được chứng minh và áp dụng rộng rãi: với bất kỳ phân phối lệch phải nào, trung bình luôn lớn hơn hoặc bằng trung vị, không có ngoại lệ về mặt toán học nếu dữ liệu đúng thực sự tuân theo dạng phân phối này. Latency hệ thống gần như luôn là phân phối lệch phải trong thực tế vận hành, vì độ trễ có giới hạn dưới tự nhiên (không thể âm, và có một ngưỡng tối thiểu vật lý) nhưng không có giới hạn trên cố định, luôn có khả năng xuất hiện các trường hợp bất thường kéo dài. Khi quan sát thấy Mean nhỏ hơn Median trên dữ liệu latency, đây là tín hiệu cảnh báo đáng tin cậy để tiếp tục điều tra sâu hơn, không phải một kết luận vội vàng chỉ dựa trên trực giác.

**Nếu hội đồng hỏi: "Vậy lỗi cụ thể trong cách đo latency cũ là gì?"**

Nhóm không có bằng chứng chắc chắn để chỉ đích danh dòng code gây lỗi trong bản đo cũ, nhưng dấu hiệu thống kê bất thường này là cơ sở đủ mạnh để quyết định chạy lại toàn bộ quá trình đo latency với quy trình được kiểm tra kỹ hơn, thay vì tiếp tục sử dụng số liệu cũ. Sau khi chạy lại, số liệu mới không chỉ khắc phục được sự bất thường thống kê này mà còn phù hợp hơn với các quan sát khác trong hệ thống.

---

## Câu 6. Bảo vệ trước nghi ngờ "tự bào chữa cho kết quả tệ"

*"Nếu hội đồng hỏi 'làm sao nhóm biết chắc 2 giá trị bất thường (MRR=0.5 đồng loạt, Recall=HitRate) là lỗi đo lường chứ không phải mô hình thực sự yếu, không phải nhóm tự bào chữa cho một kết quả tệ?' — trình bày lập luận đầy đủ, dựa trên bằng chứng độc lập."*

### Phần lõi

Lập luận không dựa trên một khẳng định chủ quan, mà dựa trên ba lớp bằng chứng độc lập, có thể kiểm chứng lại được.

Lớp bằng chứng thứ nhất là tính bất thường về mặt cấu trúc con số: MRR đồng loạt dừng ở đúng 0.5 tại toàn bộ hai mươi danh tính là một sự trùng hợp có xác suất cực thấp nếu đây thực sự phản ánh năng lực mô hình một cách tự nhiên — năng lực thật của một mô hình học sâu trên các danh tính khác nhau, với đặc điểm thị giác khác nhau, khó có thể tình cờ hội tụ về đúng cùng một con số tròn trịa như vậy ở mọi đối tượng. Sự đồng loạt và tính "tròn" bất thường của con số 0.5 là dấu hiệu gợi ý mạnh mẽ về một giới hạn mang tính cấu trúc, không phải giới hạn về năng lực.

Lớp bằng chứng thứ hai, và quan trọng nhất, là Confusion@1 — một chỉ số đo lường độc lập hoàn toàn với cách tính MRR và Recall. Nếu mô hình thực sự yếu, không phân biệt được các danh tính, tỉ lệ nhầm lẫn sang danh tính khác ở vị trí xếp hạng cao nhất phải cao. Nhưng Confusion@1 đo được chỉ 5.3%, một con số thấp, cho thấy mô hình phần lớn vẫn nhận diện đúng danh tính ở vị trí đầu — mâu thuẫn trực tiếp với giả thuyết "mô hình yếu" mà một MRR chỉ 0.5 có thể gợi ý nếu đọc riêng lẻ.

Lớp bằng chứng thứ ba là khả năng suy luận ngược cơ chế gây lỗi bằng chính công thức toán học của từng chỉ số, không cần dựa vào việc nhớ lại code cũ. Với MRR, việc ảnh truy vấn tự khớp tuyệt đối và chiếm vị trí đầu, trong khi bị loại khỏi ground truth, tất yếu dẫn đến trần lý thuyết đúng bằng 0.5 theo công thức Reciprocal Rank — đây là một hệ quả toán học có thể chứng minh được, không phải một cách giải thích chủ quan được nghĩ ra sau khi biết kết quả. Tương tự, với Recall, đối chiếu giá trị đo được với trần lý thuyết tính từ chính cấu trúc ground truth đã biết trước cho thấy mâu thuẫn không thể giải thích được nếu công thức được cài đặt đúng, chỉ có thể giải thích được nếu ground truth bị xây dựng sai phạm vi.

Kết hợp cả ba lớp bằng chứng — tính bất thường cấu trúc của con số, sự mâu thuẫn với một chỉ số độc lập, và khả năng suy luận ngược cơ chế bằng chính công thức toán học — tạo thành một lập luận vững chắc, không phải một lời bào chữa chủ quan sau khi thấy kết quả không như mong đợi.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Nhưng biết đâu Confusion@1 cũng bị lỗi tương tự, sao nhóm tin tưởng nó tuyệt đối?"**

Confusion@1 được tính bằng cách so sánh trực tiếp danh tính của kết quả xếp hạng cao nhất với danh tính của truy vấn, một phép so sánh nhãn đơn giản không phụ thuộc vào việc xây dựng ground truth theo phạm vi nào hay việc ảnh truy vấn có bị loại khỏi ranked list hay không — hai vấn đề gây ra hai lỗi đã phát hiện. Về mặt cấu trúc, công thức của Confusion@1 không chia sẻ bất kỳ thành phần tính toán nào với MRR hay Recall, nên khả năng nó mắc đúng loại lỗi tương tự là rất thấp. Đây chính là lý do nó có giá trị làm bằng chứng độc lập, không phải vì nó được tin tưởng một cách tuyệt đối mà không có cơ sở.

**Nếu hội đồng hỏi: "Nếu nhóm không phát hiện ra 2 lỗi này, kết luận cuối cùng của khóa luận sẽ sai như thế nào?"**

Nếu không phát hiện, khóa luận sẽ kết luận sai rằng CLIP có khả năng phân biệt danh tính khá yếu trên bộ dữ liệu tự thu thập, với MRR chỉ đạt khoảng 0.5, đối lập với kết luận đúng là mô hình đạt MRR gần 0.968, tức khả năng phân biệt rất tốt. Đây là một sự đảo ngược hoàn toàn về mặt kết luận học thuật, không phải một sai lệch nhỏ, cho thấy tầm quan trọng của việc luôn đối chiếu số liệu bất thường với trần lý thuyết và các chỉ số độc lập trước khi rút ra kết luận cuối cùng về năng lực mô hình.

---

*Ghi chú sử dụng: khi trình bày trước hội đồng, chỉ cần nói phần lõi trừ khi được hỏi tiếp — phần "rào trước rào sau" nên giữ trong đầu để phản xạ nhanh khi bị hỏi vặn, không cần đọc hết ngay từ đầu vì sẽ dài dòng không cần thiết.*

# Câu trả lời hoàn chỉnh — Cấp độ 3 

---

## Câu 7. Confusion@1 so với Rank-1 accuracy/CMC@1

*"So sánh Confusion@1 với Rank-1 accuracy/CMC@1 trong lĩnh vực Person Re-Identification — điểm giống, điểm khác, và đâu là đóng góp thực sự của Confusion@1 so với việc chỉ dùng lại Rank-1 accuracy có sẵn?"*

### Phần lõi

Confusion@1 và Rank-1 accuracy (hay CMC@1) giống nhau ở phạm vi đo lường: cả hai đều chỉ xét đúng vị trí xếp hạng cao nhất trong kết quả trả về, và đều liên quan trực tiếp tới việc kết quả đó có đúng danh tính truy vấn hay không. Về bản chất toán học, nếu Rank-1 accuracy đo tỉ lệ phần trăm truy vấn có kết quả đúng ở vị trí đầu, thì Confusion@1 gần như là phần bù của nó — đo tỉ lệ phần trăm truy vấn có kết quả sai và cụ thể là sai sang một danh tính khác hẳn ở đúng vị trí đó.

Điểm khác biệt cốt lõi không nằm ở cách đo lường, mà nằm ở mục đích sử dụng và bối cảnh áp dụng. Rank-1 accuracy trong các nghiên cứu Person Re-Identification thường được dùng như một chỉ số đo hiệu năng tổng thể độc lập, đứng cạnh các chỉ số khác như mAP để đánh giá chất lượng chung của hệ thống. Confusion@1 được thiết kế với một mục đích hẹp và cụ thể hơn nhiều: dùng làm công cụ chẩn đoán, giúp tách bạch nguyên nhân khi một chỉ số khác, cụ thể là MRR, cho ra giá trị thấp hoặc bất thường. Đây là góc nhìn chẩn đoán nguyên nhân, khác với góc nhìn đo lường hiệu năng tổng thể mà Rank-1 accuracy thường phục vụ.

Đóng góp thực sự của Confusion@1, so với việc chỉ dùng lại Rank-1 accuracy có sẵn, nằm ở việc đặt nó trong mối quan hệ đối chiếu trực tiếp với MRR để phục vụ một câu hỏi cụ thể: khi MRR không đạt giá trị tối đa, phần điểm bị mất đó đến từ việc nhầm lẫn danh tính thực sự hay chỉ từ việc xếp thứ tự nội bộ chưa tối ưu giữa các kết quả cùng đúng danh tính. Đây là một ứng dụng thực tế cụ thể mà nhóm không thấy được trình bày minh bạch trong các tài liệu Re-ID đã khảo sát, dù bản thân cơ chế đo lường ở vị trí top-1 đã tồn tại từ trước dưới dạng Rank-1 accuracy.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Vậy có thể dùng thẳng Rank-1 accuracy thay cho Confusion@1 mà vẫn đạt được mục đích chẩn đoán tương tự không?"**

Về mặt số học, Rank-1 accuracy và Confusion@1 mang thông tin gần như tương đương nhau ở top-1, vì một là phần bù gần đúng của cái còn lại. Điều khác biệt thực sự nằm ở cách đặt tên và cách trình bày: gọi tên là Confusion@1 và định nghĩa nó gắn liền với khái niệm "nhầm lẫn sang danh tính khác" giúp người đọc báo cáo hiểu ngay mục đích chẩn đoán của chỉ số này khi đặt cạnh MRR, trong khi Rank-1 accuracy mang hàm ý đo hiệu năng tổng thể theo thói quen sử dụng phổ biến trong lĩnh vực Re-ID. Việc đặt tên và định nghĩa lại theo đúng mục đích sử dụng cụ thể là một phần của đóng góp, không chỉ là vấn đề thay tên gọi.

**Nếu hội đồng hỏi: "Nếu mở rộng ra top-5 hay top-10, Confusion@k có còn giữ nguyên ý nghĩa chẩn đoán này không?"**

Về nguyên tắc có thể mở rộng khái niệm Confusion sang các giá trị k lớn hơn, nhưng ý nghĩa chẩn đoán sẽ giảm dần độ sắc bén khi k tăng, vì ở k lớn, việc "có ít nhất một kết quả sai danh tính nằm trong top-k" trở nên dễ xảy ra hơn nhiều và ít phản ánh được sự nhầm lẫn nghiêm trọng ở vị trí quan trọng nhất mà người dùng nhìn thấy đầu tiên. Confusion@1 được chọn đúng ở k=1 vì đây là vị trí có ý nghĩa nhất đối với trải nghiệm người dùng thực tế và cũng là vị trí mà MRR nhạy cảm nhất, nên việc đối chiếu ở cùng vị trí này mang lại giá trị chẩn đoán rõ ràng nhất.

---

## Câu 8. Vì sao SISE không cần NDCG

*"Giải thích vì sao SISE không cần dùng NDCG thay cho MRR, dựa trên bản chất ground truth của bài toán nhận diện danh tính. Nếu ép dùng NDCG bằng cách lấy cosine similarity của CLIP làm thang đo mức độ liên quan, vấn đề phương pháp luận nào sẽ phát sinh?"*

### Phần lõi

NDCG chỉ có ý nghĩa khi ground truth tồn tại sự phân bậc mức độ liên quan có cơ sở khách quan, thường do con người gán nhãn theo thang điểm độc lập với mô hình đang được đánh giá — ví dụ trong một công cụ tìm kiếm văn bản, một số kết quả "khớp hoàn hảo" với ý định tìm kiếm, một số chỉ "liên quan lỏng lẻo", và sự phân bậc này có ý nghĩa khách quan vì bản thân khái niệm mức độ khớp với một ý định tìm kiếm vốn dĩ là liên tục.

Với bộ dữ liệu tự thu thập của SISE, ground truth không có tính chất này. Mỗi ảnh trong số bốn mươi chín ảnh còn lại của cùng một danh tính đều đúng như nhau tuyệt đối — không có ảnh nào khách quan "đúng hơn" ảnh khác, vì "đúng" ở đây được định nghĩa là "có phải cùng danh tính hay không", một thuộc tính nhị phân theo đúng bản chất của chính khái niệm danh tính. Một người hoặc là đúng danh tính được truy vấn, hoặc không phải, không tồn tại khái niệm "hơi đúng danh tính" hay "đúng danh tính tám mươi phần trăm" một cách có ý nghĩa khách quan.

Nếu ép áp dụng NDCG bằng cách dùng chính giá trị cosine similarity của CLIP làm thang đo mức độ liên quan, vấn đề phương pháp luận nghiêm trọng sẽ phát sinh: nhóm sẽ đang dùng chính công cụ đang được đánh giá để tạo ra ground truth chấm điểm cho nó. Đây là một vòng lặp tự tham chiếu, phá vỡ hoàn toàn tính kiểm định độc lập cần có của một phép đo benchmark — một phép đo chỉ có giá trị khi ground truth được xây dựng độc lập với hệ thống đang bị đo, nếu không, hệ thống gần như chắc chắn sẽ luôn "chấm điểm cao cho chính nó" theo đúng phân phối mà nó đã tạo ra, không phản ánh chất lượng thực sự.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Vậy có tiếc không khi bỏ lỡ khả năng đo mức độ đúng nhiều hay đúng ít?"**

Đây không phải một sự đánh đổi do lựa chọn metric, mà là một giới hạn tự nhiên của chính bài toán nhận diện danh tính. Khái niệm "đúng nhiều hay đúng ít" không có cơ sở khách quan để tồn tại khi "đúng" được định nghĩa là "cùng một danh tính", một thuộc tính nhị phân theo bản chất. Việc chọn MRR không bỏ lỡ tiềm năng gì cả, vì tiềm năng đó chưa từng thực sự tồn tại có ý nghĩa cho loại bài toán này, bất kể nhóm chọn metric nào.

**Nếu hội đồng hỏi: "Có cách nào xây dựng ground truth phân bậc độc lập, không dùng cosine similarity của chính CLIP, để áp dụng NDCG một cách đúng đắn không?"**

Về nguyên tắc có thể, bằng cách nhờ nhiều người đánh giá độc lập gán nhãn mức độ liên quan cho từng cặp ảnh theo một thang điểm chủ quan của con người, ví dụ mức độ rõ nét hay góc chụp thuận lợi, rồi lấy đồng thuận giữa nhiều người đánh giá làm ground truth. Tuy nhiên đây là một hướng mở rộng đòi hỏi nguồn lực đáng kể về nhân lực gán nhãn và quy trình kiểm soát chất lượng, vượt ngoài phạm vi và mục tiêu của đồ án hiện tại, đồng thời cũng không thay đổi kết luận rằng với bài toán nhận diện danh tính thuần túy, MRR nhị phân đã là lựa chọn phù hợp và đủ dùng.

---

## Câu 9. Tình huống HitRate cao nhưng Precision thấp

*"Với hai chỉ số cùng đo 'có tìm được kết quả đúng hay không' nhưng ở hai mức độ khác nhau — HitRate (khoan dung) và Precision (khắt khe) — hãy dựng một tình huống giả định mà HitRate rất cao nhưng Precision rất thấp, và giải thích tình huống này nói lên điều gì."*

### Phần lõi

Xét tình huống bộ dữ liệu tự thu thập của SISE với mỗi danh tính có bốn mươi chín ảnh đáp án đúng, lấy k=10. Giả sử mô hình chỉ tìm đúng được một trong mười kết quả trả về là đúng danh tính, chín kết quả còn lại sai. Khi đó HitRate vẫn đạt giá trị tuyệt đối 1.0 với mọi truy vấn, vì HitRate chỉ đòi hỏi ít nhất một kết quả đúng xuất hiện trong top-k, và điều kiện này đã được thỏa mãn. Nhưng Precision tại k=10 trong trường hợp này chỉ đạt 1/10 = 0.1, một giá trị rất thấp, vì chín trong số mười kết quả trả về đều sai.

Tình huống HitRate cao tuyệt đối nhưng Precision rất thấp như trên nói lên rằng mô hình có khả năng "chạm" được vào đúng danh tính cần tìm, nhưng chưa có khả năng phân biệt tốt giữa các đối tượng gần giống trong tập ứng viên còn lại — nó tìm ra được một kết quả đúng nhưng lẫn lộn nhiều kết quả sai xung quanh, thay vì tập trung chính xác vào đúng nhóm đối tượng cần tìm. Đây phản ánh một mô hình có khả năng định hướng đúng nhưng độ phân giải phân biệt chưa cao, khác hẳn với một mô hình hoàn toàn thất bại không tìm được kết quả đúng nào.

Tình huống này cũng cho thấy đặc điểm quan trọng của ground truth nhiều-đối-nhiều như bộ dữ liệu tự thu thập: chính vì mỗi danh tính có tới bốn mươi chín đáp án đúng trên tổng số dữ liệu, việc đạt HitRate cao trở nên tương đối dễ dàng ngay cả khi năng lực phân biệt tổng thể chưa hoàn hảo, vì xác suất tình cờ chạm được ít nhất một kết quả đúng trong không gian có nhiều đáp án đúng như vậy vốn đã cao hơn nhiều so với bài toán chỉ có một đáp án đúng duy nhất. Đây là lý do khi diễn giải HitRate cao trên loại ground truth nhiều-đối-nhiều, cần thận trọng không vội kết luận mô hình đã hoàn hảo, mà cần đối chiếu thêm với Precision để có bức tranh đầy đủ hơn về chất lượng thực sự của kết quả trả về.

### Phần "rào trước rào sau"

**Nếu hội đồng hỏi: "Số liệu thực tế của SISE có rơi vào tình huống giả định này không, hay chỉ là một ví dụ lý thuyết?"**

Số liệu thực tế của bộ dữ liệu tự thu thập không rơi vào tình huống cực đoan như ví dụ giả định, vì Precision đo được trên thực tế đạt khoảng 0.896, một giá trị khá cao, cho thấy mô hình không chỉ đạt HitRate cao mà còn giữ được độ tinh khiết tốt trong top-k trả về. Ví dụ giả định trong câu trả lời này chỉ nhằm minh họa cơ chế toán học khiến hai chỉ số có thể phân kỳ mạnh trong trường hợp xấu nhất, giúp làm rõ vì sao không nên chỉ dựa vào một chỉ số duy nhất để đánh giá chất lượng hệ thống, chứ không phải mô tả đúng thực trạng của SISE.

**Nếu hội đồng hỏi: "Ngược lại, có tình huống nào Precision cao nhưng HitRate thấp không?"**

Về mặt toán học, tình huống này khó xảy ra theo đúng nghĩa chặt chẽ, vì nếu Precision tại k lớn hơn 0, tức có ít nhất một kết quả đúng trong top-k, thì HitRate tại cùng k đó chắc chắn cũng bằng 1, vì HitRate chỉ đòi hỏi tối thiểu một kết quả đúng. Ngược lại, nếu HitRate bằng 0 thì Precision chắc chắn cũng phải bằng 0. Do đó Precision cao đi kèm HitRate thấp là một tình huống không thể xảy ra theo đúng định nghĩa của hai công thức này, đây chính là một mối quan hệ ràng buộc một chiều đáng lưu ý giữa hai chỉ số, khác với chiều ngược lại đã minh họa ở phần trên.

---