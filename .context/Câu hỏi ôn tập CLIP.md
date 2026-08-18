# CÂU HỎI ÔN TẬP — PHẦN A: CLIP

---

## Cấp độ 1 — Câu hỏi chí mạng (giảng viên gần như chắc chắn hỏi)

**Câu 1.** Vì sao nhóm chọn dùng CLIP nguyên bản pretrained thay vì fine-tune lại trên bộ dữ liệu tự thu thập của mình? Nếu không fine-tune, làm sao đảm bảo model "hiểu" đúng các identity cụ thể trong hệ thống?

**Câu 2.** CLIP thuộc loại bài toán gì trong Machine Learning? Vì sao không thể xếp nó vào Classification dù nó vẫn dùng cross-entropy loss bên trong công thức?

**Câu 3.** Trình bày cơ chế Contrastive Learning của CLIP: hàm mất mát InfoNCE hoạt động thế nào, vai trò của batch size N, và ý nghĩa của tham số nhiệt độ τ (temperature).

---

## Cấp độ 2 — Câu hỏi hóc búa (đo độ hiểu sâu)

**Câu 4.** Trong giai đoạn rà soát cuối, nhóm phát hiện lần chạy benchmark ban đầu trên bộ dữ liệu tự thu thập cho MRR đồng loạt khoảng 0.5 và Recall trùng khít HitRate ở mọi danh tính — đây hóa ra là 2 lỗi ở tầng thực thi, không phải năng lực thật của CLIP. Trình bày bản chất của 2 lỗi đó (một lỗi khiến MRR bị chặn trần ở 0.5, một lỗi khiến Recall trùng HitRate), giải thích vì sao chúng tạo ra đúng hiện tượng đã quan sát, và nêu con số đúng sau khi đã vá (MRR≈0.968, Recall≈0.183 — bị chặn bởi trần lý thuyết 10/49, không phải model yếu).

**Câu 5.** Vì sao CLIP dùng hai encoder tách biệt (ViT cho ảnh, Transformer cho văn bản) thay vì một mạng hợp nhất xử lý cả hai loại input? Nếu có một kiến trúc hợp nhất (fusion) tồn tại, nó sẽ đánh đổi điều gì so với CLIP?

**Câu 6.** Trong hệ thống, kết quả tìm kiếm text-to-image thường cho cosine similarity thấp hơn hẳn so với image-to-image similarity (dù đúng đối tượng). Giải thích hiện tượng này bằng khái niệm học thuật phù hợp, và giải thích vì sao hệ thống vẫn dùng được kết quả đó để xếp hạng top-k.

**Câu 7.** Nếu tham số τ trong hàm mất mát InfoNCE bị đặt cố định ở một giá trị rất nhỏ ngay từ đầu quá trình huấn luyện (thay vì để nó tự học), điều gì có khả năng xảy ra? Giải thích bằng cơ chế toán học cụ thể, không chỉ mô tả hiện tượng.

---

## Cấp độ 3 — Câu hỏi mở rộng (test khả năng liên hệ ngoài phạm vi CLIP)

**Câu 8.** Việc dùng thuật toán tìm kiếm gần đúng (ANN/HNSW) thay vì tìm kiếm chính xác tuyệt đối (brute-force k-NN) trên vector 512 chiều của CLIP có liên hệ gì với hiện tượng "curse of dimensionality" trong không gian nhiều chiều? Vì sao đây không đơn thuần là vấn đề "đánh đổi tốc độ lấy chi phí"?

**Câu 9.** Giả sử nhóm phải chọn giữa việc tăng batch size khi huấn luyện một mô hình contrastive learning tương tự CLIP, và việc tăng kích thước/độ đa dạng của tập dữ liệu huấn luyện — hai lựa chọn này giải quyết hai vấn đề khác nhau như thế nào? Chúng có thể thay thế cho nhau không?

**Câu 10.** So sánh CLIP với một hệ thống nhận diện khuôn mặt phục vụ chấm công/an ninh (face verification) về mặt kiến trúc bài toán — cả hai có cùng thuộc dạng dual-encoder retrieval hay không? Vì sao?

---

# Câu trả lời hoàn chỉnh — Câu 1, Cấp độ 1

*"Vì sao nhóm chọn dùng CLIP nguyên bản pretrained thay vì fine-tune lại trên bộ dữ liệu tự thu thập của mình?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Nhóm quyết định không fine-tune CLIP mà dùng nguyên bản pretrained vì hai lý do gắn liền với bản chất bài toán.

Thứ nhất, CLIP không được thiết kế cho bài toán phân loại danh tính chính xác tuyệt đối như các model chuyên biệt kiểu FaceNet hay ArcFace. CLIP là một model contrastive dual-encoder, mục tiêu của nó là học một không gian biểu diễn ngữ nghĩa tổng quát, nơi khoảng cách giữa các vector phản ánh mức độ liên quan về nội dung, chứ không phải một bộ phân loại đưa ra quyết định đúng/sai tuyệt đối cho từng lớp cố định. Chính đặc tính học ngữ nghĩa tổng quát này là nền tảng cho khả năng zero-shot của CLIP — khả năng xử lý tốt cả những khái niệm chưa từng gặp trong lúc huấn luyện. Việc ép CLIP tối ưu riêng cho 20 danh tính cụ thể sẽ đi ngược lại chính điểm mạnh khiến nhóm chọn nó.

Thứ hai, quy mô dữ liệu tự thu thập của nhóm (khoảng 1000 ảnh cho 20 danh tính) rất nhỏ so với capacity của CLIP — một model có hàng trăm triệu tham số, vốn được huấn luyện trên 400 triệu cặp ảnh-văn bản. Nếu fine-tune trên tập dữ liệu nhỏ này, nhóm đối diện với hai rủi ro liên quan nhưng khác nhau: **overfitting** — model học thuộc lòng đặc điểm của đúng 20 danh tính này thay vì tổng quát hoá, khiến hiệu năng trên dữ liệu mới ngoài tập train giảm mạnh; và **catastrophic forgetting** — trong quá trình học đặc trưng riêng cho tập nhỏ, model có nguy cơ ghi đè và làm mất đi phần tri thức tổng quát đã học được từ 400 triệu cặp gốc. Cả hai rủi ro này cộng hưởng khi fine-tune một model lớn trên dữ liệu nhỏ, và đều triệt tiêu chính lý do nhóm chọn CLIP ngay từ đầu.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Overfitting và catastrophic forgetting có phải là một không, hay em chỉ nói cho có?"**

Đây là hai rủi ro độc lập, đo trên hai phạm vi khác nhau, tuy cùng phát sinh từ một nguyên nhân gốc là mất cân bằng giữa capacity model và quy mô dữ liệu fine-tune. Overfitting là câu hỏi *nội bộ* — đo hiệu năng của model trên chính tập dữ liệu mới (train so với validation cùng miền): loss train giảm nhưng loss validation tăng trở lại là dấu hiệu điển hình. Catastrophic forgetting là câu hỏi *liên miền* — đo hiệu năng của model trên tri thức/tác vụ cũ đã học trước đó, so với trước khi fine-tune: model có thể vẫn hoạt động tốt trên 20 danh tính mới (không overfit theo nghĩa hẹp) nhưng lại mất khả năng zero-shot tổng quát trên các khái niệm khác ngoài phạm vi 20 danh tính đó. Vì đo trên hai phạm vi khác nhau, hai hiện tượng này không tự động kéo theo nhau — có thể forgetting nặng mà chưa kịp overfit, hoặc ngược lại.

**Nếu hội đồng hỏi: "Vì sao model lại 'quên' được, nó không phải con người mà nói quên?"**

"Quên" ở đây là cách gọi trực quan cho một hiện tượng thuần túy về trọng số. Fine-tune, trong cách làm phổ biến nhất, **không** train lại trên cả dữ liệu cũ lẫn mới — nó chỉ tiếp tục chạy gradient descent trên **riêng dữ liệu mới**, xuất phát từ trọng số pretrained có sẵn. Vì 400 triệu cặp dữ liệu gốc không còn xuất hiện trong quá trình tối ưu, gradient tại mỗi bước cập nhật chỉ phản ánh đúng những gì nó đang "nhìn thấy" — tức là chỉ 1000 ảnh mới. Không có cơ chế nào tự nhiên nhắc mô hình giữ lại hiệu năng trên phần dữ liệu không còn được huấn luyện, nên trọng số dần trôi dạt theo hướng chỉ có lợi cho dữ liệu mới, đánh đổi bằng việc rời xa điểm tối ưu cũ.

**Nếu hội đồng hỏi: "Vậy có cách nào fine-tune mà giảm được rủi ro này không? Nhóm có cân nhắc chưa?"**

Có tồn tại một số kỹ thuật giảm nhẹ, phổ biến nhất là **Layer Freezing** — đóng băng phần lớn các lớp đầu của mạng (giữ nguyên trọng số pretrained, không cập nhật), chỉ mở một vài lớp cuối để fine-tune trên dữ liệu mới. Kỹ thuật này dựa trên đặc tính học theo tầng của mạng neural sâu: các lớp đầu thường học đặc trưng tổng quát, cấp thấp (với ảnh là cạnh, màu sắc, texture) — gần như bất biến giữa các domain khác nhau, nên đáng giữ nguyên; các lớp cuối học đặc trưng trừu tượng, đặc thù tác vụ — là nơi hợp lý để tinh chỉnh. Cách làm này giảm đồng thời cả hai rủi ro: giảm forgetting vì phần lớn trọng số (các lớp đầu) không bị đụng tới, và giảm overfitting vì số tham số thực sự có thể thay đổi ít đi nhiều, tương đương giảm capacity hiệu dụng của model trong quá trình fine-tune.

Nhóm có cân nhắc hướng này, nhưng quyết định không áp dụng vì: kỹ thuật này vẫn đòi hỏi hạ tầng huấn luyện và một quy trình thực nghiệm để xác định nên mở bao nhiêu lớp cuối là hợp lý — bản thân việc này đã là một hướng nghiên cứu con, nằm ngoài phạm vi (scope) chính của đồ án, vốn tập trung vào xây dựng và đánh giá hệ thống retrieval hoàn chỉnh chứ không phải tối ưu chiến lược fine-tuning. Quan trọng hơn, kỹ thuật này chỉ **giảm nhẹ** chứ không loại bỏ hoàn toàn cả hai rủi ro. Vì vậy nhóm chọn giữ nguyên CLIP pretrained thuần túy — chấp nhận đánh đổi một phần độ chính xác chuyên biệt hoá cho từng danh tính, để đổi lấy sự ổn định và giữ đúng tinh thần zero-shot ngay từ thiết kế ban đầu.

---

# Câu trả lời hoàn chỉnh — Câu 2, Cấp độ 1

*"CLIP thuộc loại bài toán gì trong Machine Learning? Vì sao không thể xếp nó vào Classification dù nó vẫn dùng cross-entropy loss bên trong công thức?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

CLIP thuộc về giao điểm của hai nhóm bài toán trong Machine Learning: **Self-supervised Learning** (học tự giám sát) ở tầng phương pháp huấn luyện, và **Metric Learning** (học khoảng cách/độ tương đồng) ở tầng mục tiêu. Cụ thể hơn, CLIP giải quyết đồng thời hai bài toán con: **Representation Learning** — học cách mã hóa dữ liệu thô (pixel ảnh, token văn bản) thành vector có ý nghĩa ngữ nghĩa, và **Similarity/Distance Learning** — học cách định hình không gian vector đó sao cho khoảng cách hoặc độ tương đồng cosine giữa các vector phản ánh đúng mức độ liên quan về nội dung. Kết hợp cả hai, CLIP tạo ra một không gian embedding vừa có khả năng biểu diễn dữ liệu chưa từng gặp (nhờ tổng quát hóa tốt), vừa cho phép so sánh mức độ liên quan giữa các dữ liệu đa phương thức khác nhau — nền tảng phục vụ trực tiếp cho các hệ thống truy hồi thông tin đa phương thức hiện đại.

CLIP không thể xếp chung với bài toán Classification như FaceNet hay ArcFace vì khác nhau ở chính câu hỏi mà mô hình được thiết kế để trả lời. Classification thuộc nhóm Supervised Learning, học ánh xạ một input vào đúng một lớp trong tập nhãn cố định đã biết trước — trả lời câu hỏi "đối tượng này thuộc lớp nào trong số các lớp tôi đã biết". Nhược điểm cố hữu là gặp dữ liệu ngoài tập nhãn (open-set), model buộc phải ép vào một lớp đã học dù sai. CLIP thì ngược lại, trả lời câu hỏi "hai đối tượng này liên quan với nhau ở mức độ nào" — đầu ra là một giá trị similarity liên tục trên một thang đo, không phải một quyết định phân loại nhị phân hay một nhãn rời rạc.

Về việc CLIP vẫn dùng cross-entropy và softmax trong công thức loss — điều này chỉ là mượn *hình thức toán học*, không phải bản chất bài toán. Sự khác biệt nằm ở cách định nghĩa "nhãn". Trong Classification truyền thống, nhãn là một class rời rạc cố định do con người gán trước, và softmax được dùng để chọn ra đúng 1 lớp trong số hữu hạn lớp đó. Với CLIP, "nhãn" trong mỗi batch huấn luyện chính là vị trí của caption đúng tương ứng với mỗi ảnh — một cấu trúc phát sinh tự nhiên từ chính cặp dữ liệu (ảnh, caption) có sẵn, không phải một danh mục lớp cố định được thiết kế trước. Softmax ở đây được áp dụng lên ma trận similarity giữa các cặp trong batch để xác định cặp nào là cặp đúng, chứ không phải để phân loại input vào một trong N lớp ngữ nghĩa cố định. Vì vậy có thể nói CLIP mượn cơ chế toán học của classification (softmax và cross-entropy) để phục vụ một bài toán bản chất là metric learning — học cách đo độ tương đồng giữa hai không gian dữ liệu khác nhau, chứ không học cách phân loại.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "CLIP không phân loại đúng/sai, vậy hệ thống của em dựa vào đâu để quyết định trả kết quả nào cho người dùng?"**

CLIP không tự đưa ra quyết định đúng/sai — nó chỉ sinh ra một con số similarity liên tục cho mỗi cặp (ảnh, query). Việc "quyết định" là trách nhiệm của tầng ứng dụng phía sau CLIP, cụ thể trong hệ thống của nhóm là bước xếp hạng: tính similarity giữa vector query và toàn bộ vector trong cơ sở dữ liệu, sau đó sắp xếp giảm dần và lấy ra top-k giá trị cao nhất. Đây chính là lý do vì sao nhóm gọi bài toán của mình là *retrieval* (truy hồi, trả về danh sách xếp hạng theo độ liên quan) chứ không phải *classification* (phân loại, trả về một quyết định rời rạc) — retrieval vốn dĩ không cần và không nên có khái niệm "ngưỡng đúng/sai" cứng, vì bản chất câu hỏi mà nó trả lời là "cái nào liên quan nhất", không phải "cái này có đúng hay không".

**Nếu hội đồng hỏi: "Representation Learning và Similarity Learning có bắt buộc đi cùng nhau không?"**

Không bắt buộc — đây là hai bài toán độc lập về mặt lý thuyết. Có thể có Representation Learning không nhắm tới similarity, ví dụ các autoencoder học nén dữ liệu để tái tạo lại (mục tiêu là tái tạo, không phải so sánh khoảng cách có ý nghĩa). Ngược lại cũng có Similarity Learning áp dụng trên biểu diễn có sẵn, không tự học cách mã hóa từ đầu, ví dụ dùng khoảng cách Euclidean trực tiếp trên đặc trưng thủ công như color histogram — không có phần "học biểu diễn" nào ở đây. Điều đặc biệt của CLIP là nó tối ưu đồng thời cả hai trong cùng một quá trình huấn luyện: hàm loss InfoNCE vừa ép hai encoder học ra biểu diễn có ý nghĩa (representation), vừa định hình trực tiếp cấu trúc không gian đó sao cho khoảng cách phản ánh đúng độ liên quan (similarity) — hai mục tiêu này được tối ưu chung bằng một hàm loss duy nhất, không tách rời thành hai giai đoạn riêng biệt.

**Nếu hội đồng hỏi: "Sao không dùng một hàm loss khác hẳn, như Triplet Loss hay MSE, thay vì mượn cross-entropy?"**

Triplet Loss — kỹ thuật contrastive phổ biến trước CLIP, thường dùng trong face verification — chỉ so sánh một cặp dương và một cặp âm tại một thời điểm (anchor, positive, negative), cần có kỹ thuật chọn negative khó (hard negative mining) riêng biệt, khá tốn công và dễ huấn luyện không ổn định. Trong khi đó, cách CLIP dùng softmax trên toàn bộ ma trận similarity N×N của một batch cho phép mô hình so sánh một cặp dương với toàn bộ N-1 cặp âm cùng lúc trong một bước tính loss duy nhất — không cần thiết kế thủ công chiến lược chọn negative, và tận dụng được chính cấu trúc ngẫu nhiên của batch để tạo ra negative sample đủ đa dạng. Đây là lý do thực dụng khiến CLIP mượn đúng cơ chế softmax và cross-entropy, gọi chung là dạng loss InfoNCE, thay vì Triplet Loss hay MSE — không phải ngẫu nhiên hay chỉ vì quen tay, mà vì nó tận dụng hiệu quả cấu trúc batch lớn, điều cực kỳ quan trọng với quy mô dữ liệu 400 triệu cặp mà CLIP huấn luyện.

**Nếu hội đồng hỏi: "CLIP có thực sự là Self-supervised Learning thuần túy không?"**

Đây là điểm cần thận trọng thay vì khẳng định tuyệt đối. Trong cộng đồng nghiên cứu, CLIP đôi khi được gọi là "weakly supervised" hơn là "self-supervised" thuần túy — vì dù không cần con người ngồi gán nhãn category thủ công, dữ liệu huấn luyện (caption đi kèm ảnh) vẫn là tín hiệu giám sát có sẵn từ con người khác, cụ thể là người đăng ảnh viết caption hoặc alt-text trên Internet — chỉ là tín hiệu đó được tận dụng tự động ở quy mô lớn thay vì tổ chức gán nhãn có chủ đích theo một taxonomy định trước. Cách gọi "self-supervised" nhấn mạnh vào việc không cần thiết kế nhãn thủ công theo class, còn cách gọi "weakly supervised" nhấn mạnh vào việc tín hiệu giám sát vẫn tồn tại nhưng lỏng lẻo, nhiễu, không được kiểm soát chất lượng chặt như dataset gán nhãn truyền thống. Cả hai cách gọi đều có cơ sở tùy góc nhìn, nhóm dùng "self-supervised" theo cách dùng phổ biến trong chính paper gốc của CLIP.

---

# Câu trả lời hoàn chỉnh — Câu 3, Cấp độ 1

*"Trình bày cơ chế Contrastive Learning của CLIP: hàm mất mát InfoNCE hoạt động thế nào, vai trò của batch size N, và ý nghĩa của tham số nhiệt độ τ (temperature)."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Contrastive Learning là cơ chế huấn luyện giúp mô hình học được ngữ nghĩa của dữ liệu bằng cách so sánh — tương phản một cặp dương (positive pair) với hàng loạt cặp âm (negative pairs) trong cùng một batch, thay vì học từ nhãn category cố định như classification. Với CLIP, cặp dương là một ảnh cùng đúng caption của nó; cặp âm là ảnh đó ghép với mọi caption khác trong batch, hoặc caption đó ghép với mọi ảnh khác trong batch.

Trong một batch có N cặp (ảnh, caption), CLIP tính ma trận tương đồng cosine kích thước N×N giữa mọi ảnh và mọi caption — hàng là ảnh, cột là văn bản, mỗi phần tử $S_{ij} = \text{sim}(I_i, T_j)$. Ma trận này không đối xứng qua đường chéo chính: đọc theo hàng và đọc theo cột là hai phép chuẩn hóa khác nhau, vì mỗi hàng và mỗi cột chỉ trùng nhau đúng một phần tử duy nhất trên đường chéo.

Với mỗi ảnh $I_i$, hàm mất mát theo chiều ảnh sang văn bản được tính bằng:

$$\mathcal{L}_{I \to T} = -\frac{1}{N}\sum_{i=1}^{N} \log \frac{\exp(\text{sim}(I_i, T_i)/\tau)}{\sum_{j=1}^{N} \exp(\text{sim}(I_i, T_j)/\tau)}$$

Đây thực chất là softmax áp lên hàng similarity của ảnh $i$ với toàn bộ N caption trong batch, sau đó tính cross-entropy với nhãn đúng là vị trí caption tương ứng. Về cấu trúc, công thức này gồm hai tầng: tầng ngoài ($\frac{1}{N}\sum_i$) tổng hợp loss qua N mẫu trong batch, tầng trong (biểu thức log) tính loss cho riêng một mẫu — tương đương với việc tính cross-entropy chuẩn $-\sum_k y_k \log(\hat{y}_k)$ trên K "lớp" là N ứng viên trong batch, trong đó nhãn one-hot $y$ có tác dụng lọc ra đúng một số hạng tương ứng với cặp dương, loại bỏ đóng góp của mọi cặp âm. Trong công thức InfoNCE, phép lọc này được viết gọn bằng cách đặt thẳng chỉ số $j=i$ ở tử số thay vì viết tường minh phép nhân one-hot, nhưng bản chất là tương đương.

CLIP tính đối xứng cả chiều ngược lại, văn bản sang ảnh ($\mathcal{L}_{T \to I}$, chuẩn hóa theo cột thay vì theo hàng), rồi lấy trung bình cộng của hai chiều làm loss cuối cùng. Việc tính cả hai chiều là cần thiết vì softmax theo hàng và theo cột là hai phép chuẩn hóa độc lập trên cùng một ma trận similarity — nếu chỉ tối ưu một chiều, mô hình có thể học tốt việc tìm caption từ ảnh nhưng không được tối ưu trực tiếp cho chiều tìm ảnh từ caption.

Batch size N đóng vai trò là số lượng cặp âm mà mỗi cặp dương phải cạnh tranh để được phân biệt — thể hiện trực tiếp qua số lượng số hạng trong mẫu số của công thức. N càng lớn, bài toán "tìm đúng một cặp dương giữa N ứng viên" càng khó, buộc mô hình học biểu diễn phân biệt tinh vi hơn — đây là tín hiệu học tích cực, không phải nguyên nhân gây overfit như trong supervised learning thông thường. Hệ số $\frac{1}{N}$ đứng ngoài tổng đảm bảo giá trị loss và độ lớn gradient không phụ thuộc vào N — nếu không có phép chia trung bình này, loss sẽ tỉ lệ thuận với batch size dù chất lượng dự đoán trên từng mẫu không đổi, kéo theo gradient cũng phình to theo N, buộc phải tinh chỉnh lại learning rate mỗi khi đổi batch size. Nhờ phép chia trung bình, CLIP có thể tận dụng batch size rất lớn (N=32768 trong bản gốc) mà không làm mất ổn định quá trình huấn luyện.

Tham số nhiệt độ τ chia similarity trước khi đưa vào softmax. Vì cosine similarity bị giới hạn trong khoảng hẹp [-1, 1], nếu không chia cho τ thì chênh lệch giữa cặp đúng và cặp sai sau softmax sẽ rất nhỏ, tín hiệu gradient yếu. τ nhỏ khuếch đại similarity mạnh trước softmax, khiến phân phối xác suất trở nên sắc nét, mô hình phân biệt dứt khoát hơn giữa cặp đúng và cặp sai. τ lớn làm phẳng similarity, phân phối trở nên mượt hơn, khó phân biệt các cặp gần giống nhau, gradient yếu đi, quá trình học chậm và kém hiệu quả. CLIP để τ là một tham số học được, khởi tạo ở mức an toàn rồi để gradient descent tự điều chỉnh dần, kèm ràng buộc chặn giá trị để tránh τ trôi tới cực trị gây mất ổn định.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Sao không dùng N cực lớn luôn, ví dụ N=1 triệu, nếu N càng lớn càng tốt?"**

Batch size bị giới hạn bởi hạ tầng phần cứng chứ không phải giới hạn lý thuyết. Mỗi batch cần giữ toàn bộ N vector ảnh, N vector văn bản trong bộ nhớ GPU cùng lúc để tính ma trận N×N và gradient — chi phí bộ nhớ tăng nhanh theo N. Con số N=32768 của CLIP gốc phản ánh giới hạn hạ tầng của OpenAI tại thời điểm đó, không phải một điểm tối ưu lý thuyết mà vượt qua sẽ phản tác dụng. Một số phương pháp contrastive khác như MoCo giải quyết đúng giới hạn này bằng kỹ thuật memory bank hoặc queue để mô phỏng hiệu ứng batch lớn mà không cần nạp toàn bộ vào bộ nhớ GPU cùng lúc.

**Nếu hội đồng hỏi: "Công thức InfoNCE nhìn giống hệt cross-entropy của classification, bản chất nó có thực sự khác gì không?"**

Về hình thức toán học giống nhau, nhưng khác nhau ở nguồn gốc của "nhãn" trong mẫu số. Trong classification, mẫu số cộng dồn qua một tập K lớp cố định, được thiết kế trước và cố định suốt quá trình huấn luyện — logits xuất phát từ một lớp fully-connected có trọng số gắn chết với đúng K lớp đó. Trong InfoNCE, mẫu số cộng dồn qua N ứng viên trong chính batch hiện tại — N thay đổi theo từng batch, và "lớp đúng" chỉ là vị trí tương ứng trong batch đó, không phải một khái niệm ngữ nghĩa cố định. Vì vậy CLIP không học ghi nhớ một tập khái niệm cố định, mà học một hàm so sánh tổng quát, áp dụng được cho bất kỳ tập ứng viên nào — đây là gốc rễ giải thích vì sao CLIP có khả năng zero-shot còn classification thì không.

**Nếu hội đồng hỏi: "τ luôn tồn tại trong công thức softmax hay là thứ CLIP mới thêm vào?"**

Về mặt toán học, tham số nhiệt độ luôn tồn tại được trong công thức softmax tổng quát $\text{softmax}(z_i/\tau)$ — khi τ=1 công thức suy biến đúng về dạng quen thuộc. Việc có viết τ tường minh ra hay không chỉ là quy ước trình bày: khi một tham số nhận giá trị mặc định không ảnh hưởng hành vi công thức, người ta thường lược bỏ nó để gọn hơn, chỉ viết tường minh khi bài toán thực sự cần thao túng giá trị đó. Trong classification, τ thường ngầm định bằng 1 vì trọng số tự do của lớp fully-connected cuối đã tự điều chỉnh được độ lớn (scale) của logits trong quá trình huấn luyện, đóng vai trò tương đương việc kiểm soát độ tương phản mà τ có thể làm — nên thêm τ learnable riêng là dư thừa. Trong CLIP, input vào softmax là cosine similarity, bị ép cứng trong [-1,1] bởi phép chuẩn hóa L2, không có "van" nào khác để tự điều chỉnh độ lớn như logits — τ trở thành công cụ duy nhất kiểm soát độ sắc nét của phân phối, đây là lý do CLIP cần viết τ tường minh và để nó learnable.

**Nếu hội đồng hỏi: "Nếu để τ learnable, mô hình có thể tự đẩy τ về giá trị cực đoan để giả vờ đạt loss thấp không?"**

Đây là rủi ro có thật, CLIP xử lý bằng cách giới hạn chặn giá trị τ trong một khoảng an toàn — paper gốc giới hạn để $1/\tau$ không vượt quá 100. Nếu không có ràng buộc này, gradient descent có thể tìm cách giảm loss bằng cách đẩy τ về rất nhỏ để khuếch đại similarity một cách giả tạo, khiến loss trông thấp nhưng không phản ánh đúng chất lượng biểu diễn học được. Việc giới hạn τ đảm bảo tham số này chỉ đóng vai trò điều chỉnh độ sắc nét trong phạm vi hợp lý.

**Nếu hội đồng hỏi: "Vì sao phải tính loss theo cả 2 chiều, tính 1 chiều rồi nhân đôi không được sao?"**

Không tương đương. Softmax theo hàng (mỗi ảnh so với N caption) và softmax theo cột (mỗi caption so với N ảnh) là hai phép chuẩn hóa xác suất độc lập trên cùng một ma trận similarity — chúng chỉ trùng nhau đúng một phần tử trên đường chéo, còn lại hoàn toàn khác nhau, nên tổng theo hàng bằng 1 không kéo theo tổng theo cột cũng bằng 1 tại cùng vị trí đó. Gradient tính ra từ hai chiều là hai tín hiệu học độc lập, không thể suy ra cái này từ cái kia. Vì hệ thống retrieval cần cả hai chiều truy vấn — tìm ảnh bằng ảnh và tìm ảnh bằng văn bản — việc tối ưu đối xứng cả hai chiều ngay trong huấn luyện là điều kiện cần thiết để cả hai chiều truy vấn đều hoạt động tốt.

**Nếu hội đồng hỏi: "Vì sao phải lấy trung bình cộng loss qua N mẫu, cộng dồn không được sao?"**

Nếu cộng dồn thay vì lấy trung bình, giá trị loss sẽ phụ thuộc vào N dù chất lượng dự đoán trên từng mẫu không đổi — ví dụ cùng một mức dự đoán đúng 0.8 cho mỗi mẫu, loss cộng dồn với N=3 và N=10 sẽ cho ra hai con số rất khác nhau, dù mô hình "tốt như nhau". Điều này gây hai vấn đề: một là loss mất khả năng so sánh nhất quán giữa các lần huấn luyện có batch size khác nhau; hai là gradient cũng tỉ lệ thuận với N theo, buộc phải tinh chỉnh lại learning rate mỗi khi đổi batch size để tránh bước cập nhật trọng số bị lệch quá xa. Phép chia trung bình tách rời hoàn toàn khái niệm "kích thước batch" khỏi "tốc độ học", cho phép CLIP tận dụng batch size rất lớn mà không cần đổi learning rate liên tục theo N.

---

# Câu trả lời hoàn chỉnh — Câu 4, Cấp độ 2

*"Trong giai đoạn rà soát cuối, nhóm phát hiện lần chạy benchmark ban đầu trên bộ dữ liệu tự thu thập cho MRR đồng loạt khoảng 0.5 và Recall trùng khít HitRate ở mọi danh tính — đây hóa ra là 2 lỗi ở tầng thực thi, không phải năng lực thật của CLIP. Trình bày bản chất của 2 lỗi đó, giải thích vì sao chúng tạo ra đúng hiện tượng đã quan sát, và nêu con số đúng sau khi đã vá."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Trong giai đoạn rà soát cuối, nhóm phát hiện hai sai sót ở tầng thực thi khi tính chỉ số trên bộ dữ liệu tự thu thập, không phải sai sót về công thức lý thuyết.

**Lỗi thứ nhất — MRR bị chặn trần ở 0.5.** Với mỗi truy vấn bằng ảnh, sau khi tính cosine similarity, ảnh dùng để truy vấn luôn tự khớp tuyệt đối với chính nó và chiếm vị trí xếp hạng cao nhất. Ground truth đã đúng khi loại ảnh truy vấn ra khỏi tập đáp án đúng, nhưng ranked list lại không loại ảnh đó ra trước khi tính điểm. Hệ quả là vị trí xếp hạng cao nhất luôn bị chiếm bởi một kết quả không được công nhận là đúng, nên kết quả đúng thực sự, dù mô hình có năng lực tốt tới đâu, chỉ có thể xuất hiện sớm nhất ở vị trí xếp hạng thứ hai. Với mọi truy vấn đều rơi vào tình huống này, Reciprocal Rank tối đa đạt được luôn là 1/2, kéo theo MRR trung bình bị khóa cứng ở 0.5 bất kể năng lực phân biệt danh tính thực sự của mô hình tốt đến đâu.

Có thể minh họa bằng một ví dụ thu nhỏ: giả sử có ba danh tính, mỗi người năm ảnh, lấy top-5, và mô hình có năng lực hoàn hảo, luôn tìm đúng ảnh cùng danh tính ở vị trí cao nhất có thể. Nếu ảnh truy vấn không bị loại khỏi ranked list, vị trí xếp hạng cao nhất luôn bị nó chiếm giữ và bị tính sai, nên kết quả đúng tốt nhất mà mô hình đạt được trong mọi trường hợp đều rơi vào hạng hai. Với mười lăm lượt truy vấn, mỗi lượt đạt Reciprocal Rank 0.5, MRR trung bình đúng bằng 0.5 dù mô hình đang hoạt động ở mức tối ưu nhất có thể trong điều kiện lỗi đó.

**Lỗi thứ hai — Recall trùng khít HitRate.** Tập đáp án đúng của mỗi truy vấn, thay vì được xây dựng trên toàn bộ dữ liệu, lại chỉ được xây dựng trong phạm vi chính top-k đã lấy ra — đây là một tối ưu hóa có chủ đích nhằm giữ chi phí tính toán ở mức thấp, nhưng vô tình phá vỡ tính đúng đắn của công thức Recall. Vì tập đáp án đúng luôn là tập con của chính top-k, mẫu số của công thức Recall luôn bằng đúng tử số mỗi khi có ít nhất một kết quả đúng được tìm thấy, khiến Recall luôn bằng 1.0 trong mọi trường hợp có Hit — biến Recall thành một chỉ số trùng lặp hoàn toàn với HitRate, mất hết ý nghĩa đo độ bao phủ nguyên bản của nó. Với bộ dữ liệu tự thu thập, mỗi danh tính có 49 ảnh đáp án đúng trong khi k chỉ lấy 10, nên Recall đúng theo lý thuyết phải bị chặn trần ở khoảng 10/49, hoàn toàn mâu thuẫn với giá trị gần tuyệt đối quan sát được trước khi vá lỗi — đây chính là dấu hiệu bất thường dẫn tới việc phát hiện ra lỗi.

Sau khi cả hai lỗi được vá, chạy lại toàn bộ benchmark, số liệu đúng thu được là MRR khoảng 0.968 và Recall khoảng 0.183. Giá trị Recall này không phản ánh mô hình yếu, mà nằm rất sát trần lý thuyết khoảng 0.204, cho thấy mô hình gần như đạt tối ưu tuyệt đối trong giới hạn mà chính cấu trúc k=10 trên 49 đáp án đúng cho phép.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Làm sao nhóm biết chắc đây là lỗi đo lường, không phải mô hình thực sự yếu rồi nhóm tự bào chữa?"**

Bằng chứng quan trọng nhất là chỉ số Confusion@1, chỉ số tự thiết kế đo tỉ lệ nhầm lẫn sang một danh tính khác hẳn tại vị trí xếp hạng cao nhất. Công thức của chỉ số này độc lập hoàn toàn với hai lỗi trên, không bị ảnh hưởng bởi việc ảnh truy vấn có bị loại khỏi ranked list hay ground truth được xây trong phạm vi nào. Confusion@1 giữ nguyên ở mức 5.3% cả trước và sau khi vá lỗi — đây là bằng chứng độc lập cho thấy năng lực phân biệt danh tính thực sự của mô hình chưa từng thay đổi trong suốt quá trình, chỉ có phép đo là sai trước đó. Nếu mô hình thực sự yếu, tỉ lệ nhầm lẫn sang danh tính khác phải cao, nhưng con số 5.3% cho thấy điều ngược lại ngay từ trước khi vá lỗi.

**Nếu hội đồng hỏi: "Tại sao lỗi thứ hai lại xảy ra, có phải do thiếu cẩn thận trong lúc viết code?"**

Lỗi thứ hai bắt nguồn từ một quyết định tối ưu hóa có chủ đích, nhằm giữ chi phí tính toán ở mức thấp bằng cách chỉ xây tập đáp án đúng trong phạm vi top-k thay vì quét toàn bộ dữ liệu mỗi lần đánh giá. Vấn đề không nằm ở sự thiếu cẩn thận khi viết code, mà ở việc chưa lường trước hệ quả toán học của quyết định tối ưu hiệu năng đó lên chính công thức Recall. Đây là bài học phương pháp luận quan trọng: một tối ưu hóa hợp lý ở góc độ hiệu năng hoàn toàn có thể vô tình phá vỡ tính đúng đắn ở góc độ thống kê, và hai mối quan tâm này cần được kiểm tra riêng biệt, không thể mặc định tối ưu một bên sẽ không ảnh hưởng đến bên còn lại.

**Nếu hội đồng hỏi: "Vì sao Flickr30K không gặp phải lỗi tương tự?"**

Cách xây dựng ground truth cho hai bộ dữ liệu được hiện thực khác nhau. Với Flickr30K, ground truth được xây dựng bằng cách quét toàn bộ corpus ngay từ đầu, không giới hạn trong phạm vi top-k, nên Recall được tính đúng ngay từ lần chạy đầu tiên. Đây là lý do khẳng định lỗi nằm ở khâu triển khai cụ thể cho luồng dữ liệu tự thu thập, không phải sai sót trong bản thân công thức Recall nói chung.

---

# Câu trả lời hoàn chỉnh — Câu 5, Cấp độ 2

*"Vì sao CLIP dùng hai encoder tách biệt (ViT cho ảnh, Transformer cho văn bản) thay vì một mạng hợp nhất xử lý cả hai loại input? Nếu có một kiến trúc hợp nhất (fusion) tồn tại, nó sẽ đánh đổi điều gì so với CLIP?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

CLIP dùng hai encoder tách biệt — ViT cho ảnh, Transformer cho văn bản — vì hai lý do bổ sung cho nhau: một thuộc về bản chất dữ liệu, một thuộc về yêu cầu của hệ thống ứng dụng.

Về bản chất dữ liệu, ảnh và văn bản có cấu trúc toán học hoàn toàn khác nhau: ảnh là dữ liệu dạng lưới liên tục (pixel), văn bản là dữ liệu rời rạc dạng chuỗi (token). ViT xử lý ảnh bằng self-attention trên các patch không gian để học quan hệ vị trí, trong khi Transformer văn bản xử lý chuỗi token để học quan hệ tuần tự, ngữ pháp. Hai loại thiên kiến quy nạp này khác nhau ngay từ gốc, khiến việc thiết kế một kiến trúc chung xử lý cả hai loại input trở nên không tự nhiên.

Về yêu cầu hệ thống, đây là lý do trực tiếp và quan trọng nhất với một hệ thống truy hồi như của nhóm: kiến trúc hai encoder tách biệt cho phép encode độc lập rồi lưu sẵn (pre-compute) vector — embed toàn bộ ảnh trong cơ sở dữ liệu một lần, lưu vào vector database, và mỗi lần truy vấn chỉ cần encode riêng câu query rồi so khớp bằng cosine similarity với các vector đã lưu sẵn. Image encoder và text encoder hoạt động hoàn toàn độc lập với nhau, không cần chờ đợi hay phụ thuộc lẫn nhau — đúng với yêu cầu một hệ thống truy hồi cần tốc độ phản hồi nhanh trên tập dữ liệu lớn.

Nếu tồn tại một kiến trúc hợp nhất, xử lý cả ảnh và văn bản trong cùng một mạng ngay từ đầu — ví dụ như ViLT hay BEiT-3, thuộc nhóm fusion encoder — kiến trúc đó sẽ đánh đổi ba điều so với CLIP. Thứ nhất, mất khả năng pre-compute: vì mạng cần nhận cả ảnh lẫn văn bản cùng lúc để xử lý, không thể tách rời encode từng loại trước, nên không thể lưu sẵn vector chờ truy vấn sau. Thứ hai, tốc độ chậm hơn nhiều: mỗi lần truy vấn phải chạy lại toàn bộ mạng cho từng cặp ảnh-câu hỏi muốn so sánh, thay vì chỉ so khớp các vector đã tính sẵn. Thứ ba, đổi lại, kiến trúc hợp nhất có độ tinh vi cao hơn trong việc nắm bắt tương tác giữa hai modal, vì attention được áp dụng xuyên suốt ngay từ các lớp đầu, trong khi hai encoder tách biệt của CLIP chỉ "gặp nhau" ở bước so sánh cuối cùng.

Kiến trúc hợp nhất phù hợp hơn với các bài toán dạng một-một, cần hiểu sâu một cặp dữ liệu cụ thể tại một thời điểm — ví dụ tiêu biểu trong nghiên cứu học thuật là Visual Question Answering (VQA), nơi mỗi câu hỏi luôn thay đổi theo ngữ cảnh và không thể pre-compute trước. Trong khi đó, bài toán của hệ thống là truy hồi trên quy mô lớn, dạng một-nhiều — một câu truy vấn cần so với hàng nghìn ảnh đã lưu sẵn — nên kiến trúc dual-encoder của CLIP là lựa chọn khớp trực tiếp với yêu cầu bài toán, không phải lựa chọn ngẫu nhiên.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Cho ví dụ thực tế nào đang dùng kiến trúc fusion encoder không?"**

Cần thận trọng khi đưa ví dụ sản phẩm thương mại cụ thể, vì phần lớn các hệ thống chatbot AI đa phương thức phổ biến hiện nay (có khả năng nhận cả ảnh và câu hỏi văn bản) không dùng đúng kiến trúc fusion thuần túy như ViLT hay BEiT-3. Chúng thường dùng một kiến trúc khác, gọi là kiểu ghép nối: có một vision encoder riêng biệt (thường xuất phát từ CLIP hoặc kiến trúc tương tự) trích xuất đặc trưng ảnh trước, sau đó dùng một lớp adapter nhỏ để chuyển đặc trưng đó sang không gian mà mô hình ngôn ngữ hiểu được, rồi mới ghép vào chuỗi token để xử lý tiếp cùng văn bản. Cách này vẫn có encoder ảnh tách biệt ở bước đầu, chỉ là kết quả của nó được đưa vào cùng ngữ cảnh với văn bản ở các bước sau — về bản chất gần với mô hình dual-encoder kết hợp muộn hơn là fusion encoder thật ngay từ đầu. Ví dụ chuẩn xác nhất cho fusion encoder đúng nghĩa nên lấy từ các mô hình nghiên cứu học thuật thiết kế đặc thù cho bài toán VQA, không phải suy luận ngược từ một sản phẩm thương mại mà nhóm không kiểm chứng được kiến trúc nội bộ.

**Nếu hội đồng hỏi: "Giả sử không cần pre-compute, có thể gộp ảnh và văn bản vào một mạng chung được không?"**

Về mặt lý thuyết là có thể xây dựng được — đây chính là hướng đi của các kiến trúc fusion encoder. Nhưng ngay cả khi bỏ qua yêu cầu pre-compute, lý do thuộc về bản chất dữ liệu vẫn tồn tại: ảnh và văn bản có cấu trúc toán học khác nhau (lưới liên tục so với chuỗi rời rạc), nên một mạng hợp nhất vẫn cần thiết kế cách biểu diễn đầu vào phù hợp cho cả hai (ví dụ chia ảnh thành các patch rồi coi mỗi patch như một "token" để đưa vào cùng chuỗi với token văn bản) — đây chính là cách ViLT và các kiến trúc fusion tương tự giải quyết. Vậy pre-compute không phải là rào cản duy nhất, nhưng là rào cản quan trọng và trực tiếp nhất đối với riêng bài toán truy hồi quy mô lớn mà hệ thống đang giải quyết.

**Nếu hội đồng hỏi: "Độ tinh vi của fusion encoder có thực sự vượt trội hẳn dual-encoder không, hay chỉ là lý thuyết?"**

Đây là kết quả đã được ghi nhận trong nhiều nghiên cứu so sánh — trên các bài toán cần hiểu quan hệ không gian và ngữ nghĩa chi tiết giữa ảnh và văn bản (như VQA, nơi câu hỏi có thể liên quan đến vị trí hoặc thuộc tính cụ thể của một vật thể trong ảnh), các kiến trúc fusion thường cho kết quả tốt hơn dual-encoder thuần túy, vì attention được áp dụng xuyên suốt giữa hai modal ngay từ các lớp đầu. Tuy nhiên, lợi thế này chỉ phát huy khi bài toán thực sự cần độ chi tiết đó — với bài toán truy hồi tổng thể như của hệ thống, nơi mục tiêu là tìm đúng đối tượng liên quan trong hàng nghìn ứng viên chứ không phải trả lời chi tiết về một cặp ảnh-câu hỏi cụ thể, lợi thế tinh vi đó không bù đắp được cho chi phí mất khả năng pre-compute.

---

# Câu trả lời hoàn chỉnh — Câu 6, Cấp độ 2

*"Trong hệ thống, kết quả tìm kiếm text-to-image thường cho cosine similarity thấp hơn hẳn so với image-to-image similarity (dù đúng đối tượng). Giải thích hiện tượng này bằng khái niệm học thuật phù hợp, và giải thích vì sao hệ thống vẫn dùng được kết quả đó để xếp hạng top-k."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Trong thực nghiệm hệ thống, có thể quan sát rõ hiện tượng: cosine similarity giữa hai ảnh cùng một đối tượng thường rất cao, trong khi cosine similarity giữa một câu truy vấn văn bản và ảnh đúng đối tượng đó lại thấp hơn hẳn, dù kết quả tìm kiếm vẫn chính xác. Đây không phải lỗi hệ thống, mà là hệ quả tất yếu của một hiện tượng học thuật gọi là **Modality Gap**, đã được ghi nhận trong nghiên cứu về các mô hình dual-encoder đa phương thức.

Dù CLIP ánh xạ cả ảnh và văn bản vào cùng một không gian vector chung, hai loại vector này không hòa lẫn vào nhau mà tạo thành hai cụm tách biệt, cách nhau một khoảng cố định. Hiện tượng này bắt nguồn từ hai nguyên nhân. Thứ nhất, ảnh và văn bản có nguồn gốc dữ liệu khác nhau ngay từ đầu — vector ảnh sinh ra từ việc mã hóa các patch pixel liên tục, vector văn bản sinh ra từ việc mã hóa các token rời rạc — cùng với việc hai encoder khởi tạo độc lập, dẫn tới xu hướng mỗi encoder tự nhiên ánh xạ input vào một vùng hẹp riêng của không gian embedding, ngay cả trước khi huấn luyện. Thứ hai, bản thân cơ chế tối ưu của hàm mất mát InfoNCE chỉ yêu cầu similarity của cặp đúng cao hơn tương đối so với các cặp sai trong cùng batch, chứ không ép similarity đó phải tiến về một giá trị tuyệt đối cao. Mô hình đã "thắng" bài toán tối ưu ngay khi đạt đúng thứ hạng, nên không có động lực nào trong quá trình huấn luyện buộc phải xóa bỏ hoàn toàn khoảng cách giữa hai cụm.

Hệ thống vẫn dùng được kết quả similarity để xếp hạng top-k dù giá trị tuyệt đối bị ảnh hưởng bởi modality gap, vì hai lý do bổ sung cho nhau — một thuộc về triết lý thiết kế hệ thống retrieval, một thuộc về đặc tính kỹ thuật của chính modality gap.

Về triết lý thiết kế, mục tiêu của một hệ thống truy hồi chưa bao giờ là đưa ra một quyết định đúng tuyệt đối cho một truy vấn, mà là trả về một danh sách kết quả được sắp xếp theo mức độ liên quan giảm dần — đây chính là ý nghĩa của top-k. Hệ thống retrieval, khác với hệ thống classification, không cần và không nên đặt một ngưỡng similarity tuyệt đối cố định để quyết định một kết quả có khớp hay không.

Nhưng lý do triết lý đó chỉ đủ nếu bản thân similarity vẫn còn đáng tin về mặt thứ hạng — đây là chỗ đặc tính kỹ thuật của modality gap phát huy vai trò quyết định. Vì gap bắt nguồn từ sự tách biệt cấu trúc giữa cụm vector ảnh và cụm vector văn bản nói chung, nó tác động như một độ dịch chuyển mang tính hệ thống, ảnh hưởng gần như đồng đều lên toàn bộ các ảnh trong cơ sở dữ liệu khi so sánh với cùng một câu truy vấn — không phải một loại nhiễu ngẫu nhiên khác nhau cho từng ảnh. Vì vậy dù toàn bộ thang đo cosine của chiều văn bản-ảnh bị dịch xuống thấp hơn hẳn so với chiều ảnh-ảnh, thứ tự tương đối giữa các ảnh khi so với cùng một câu truy vấn về cơ bản vẫn được bảo toàn — ảnh thực sự liên quan vẫn có similarity cao hơn ảnh không liên quan, dù cả hai giá trị đều bị kéo thấp bởi cùng một gap. Chính vì top-k ranking chỉ quan tâm đến thứ tự tương đối này, chứ không quan tâm đến giá trị tuyệt đối, nên modality gap không phá vỡ tính đúng đắn của kết quả xếp hạng, dù nó khiến toàn bộ con số hiển thị trông thấp hơn trực giác thông thường.

Hiện tượng modality gap không chỉ giới hạn ở cặp ảnh-văn bản của CLIP, mà xuất hiện ở hầu hết các mô hình dual-encoder đa phương thức khác, như các mô hình kết hợp âm thanh với hình ảnh hoặc âm thanh với văn bản — bất kỳ đâu có hai encoder độc lập ánh xạ hai loại dữ liệu khác nguồn gốc vào một không gian chung, hiện tượng tương tự đều có khả năng xảy ra.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Nếu modality gap chỉ là một độ dịch đồng đều, sao không đơn giản cộng bù lại một hằng số cố định để sửa nó?"**

Về lý thuyết có những kỹ thuật hiệu chỉnh gap theo hướng đó (ví dụ dịch chuyển tâm của hai cụm vector lại gần nhau hơn), nhưng bản thân độ dịch này không hoàn toàn là một hằng số tuyệt đối giống nhau cho mọi cặp dữ liệu — nó chỉ mang tính hệ thống ở mức tương đối, nghĩa là đủ nhất quán để không phá vỡ thứ hạng trong phần lớn trường hợp, nhưng không đủ ổn định tuyệt đối để có thể cộng bù bằng một con số cố định duy nhất mà không cần tính lại theo từng miền dữ liệu cụ thể. Quan trọng hơn, hệ thống không cần thực hiện việc hiệu chỉnh này, vì cơ chế xếp hạng top-k vốn dĩ không yêu cầu giá trị tuyệt đối phải chính xác, chỉ cần thứ tự tương đối đúng — nên việc hiệu chỉnh, nếu có, chỉ mang ý nghĩa trực quan khi hiển thị số liệu cho người dùng xem, không ảnh hưởng đến chất lượng kết quả tìm kiếm thực tế.

**Nếu hội đồng hỏi: "Làm sao biết chắc modality gap không làm xáo trộn thứ tự tương đối, mà chỉ dịch chuyển đều?"**

Đây có thể kiểm chứng qua chính benchmark thực nghiệm của hệ thống: nếu modality gap làm xáo trộn thứ tự tương đối một cách nghiêm trọng, các chỉ số dựa trên thứ hạng như HitRate hay Precision ở chiều truy vấn văn bản sẽ thấp bất thường, vì ảnh đúng bị các ảnh không liên quan vượt lên trên do nhiễu loạn ngẫu nhiên. Trong thực tế đo đạc, hệ thống vẫn đạt các chỉ số HitRate và Precision ở mức cao cho chiều truy vấn văn bản, cho thấy thứ hạng tương đối vẫn được giữ đúng phần lớn, phù hợp với cách hiểu modality gap là một độ dịch có tính hệ thống chứ không phải nhiễu phá vỡ hoàn toàn cấu trúc thứ hạng.

**Nếu hội đồng hỏi: "Vậy modality gap có ảnh hưởng gì đến chất lượng thực tế của hệ thống hay không, hay hoàn toàn vô hại?"**

Không hoàn toàn vô hại. Modality gap chủ yếu vô hại đối với việc xếp hạng top-k trong nội bộ một truy vấn, nhưng nó khiến giá trị similarity tuyệt đối mất ý nghĩa nếu dùng để so sánh chéo giữa các truy vấn khác nhau, hoặc giữa hai chiều truy vấn ảnh-ảnh và văn bản-ảnh. Ví dụ, không thể kết luận truy vấn văn bản A "kém liên quan hơn" truy vấn văn bản B chỉ vì điểm cosine cao nhất của A thấp hơn của B một cách tuyệt đối, vì độ dịch do modality gap có thể không hoàn toàn giống nhau giữa các câu truy vấn có độ dài, mức độ chi tiết khác nhau. Đây là giới hạn thực sự cần lưu ý khi diễn giải số liệu similarity trong báo cáo, dù nó không ảnh hưởng đến chất lượng của chính kết quả tìm kiếm trả về cho người dùng.

---

# Câu trả lời hoàn chỉnh — Câu 7, Cấp độ 2

*"Nếu tham số τ trong hàm mất mát InfoNCE bị đặt cố định ở một giá trị rất nhỏ ngay từ đầu quá trình huấn luyện (thay vì để nó tự học), điều gì có khả năng xảy ra? Giải thích bằng cơ chế toán học cụ thể, không chỉ mô tả hiện tượng."*

---

## Phụ lục — Diễn giải toán học từng bước (dùng khi cần chứng minh bằng số cụ thể)

### Bước 1 — Thiết lập bài toán

Batch có N=3: ảnh chó cần khớp đúng với "a dog" (vị trí 1). Do khởi tạo ngẫu nhiên, similarity thô gần như nhiễu — giả sử vì nhiễu, **vị trí sai** ("a cat", vị trí 2) vô tình có similarity nhỉnh hơn một chút so với vị trí đúng. Đây là tình huống nguy hiểm thực sự cần phân tích: τ quá nhỏ sẽ khuếch đại đúng sự nhầm lẫn ngẫu nhiên này.

Sau khi chia τ rất nhỏ và qua softmax, giả sử ta thu được:

$$p_1 = 0.05 \text{ (vị trí đúng, bị dập)} \quad p_2 = 0.90 \text{ (vị trí sai, bị đẩy lên)} \quad p_3 = 0.05$$

### Bước 2 — Công thức Loss và điểm mấu chốt của one-hot

$$\mathcal{L} = -\sum_{k} y_k \log(p_k), \quad y = [1, 0, 0] \text{ (nhãn thật là vị trí 1)}$$

Vì $y$ one-hot, khai triển ra:

$$\mathcal{L} = -(1\cdot\log(p_1) + 0\cdot\log(p_2) + 0\cdot\log(p_3)) = -\log(p_1)$$

**Điểm quan trọng nhất cần nắm**: dù $p_2, p_3$ có giá trị bao nhiêu, chúng **không hề xuất hiện** trong công thức $\mathcal{L}$ — vì hệ số $y_2=y_3=0$ đã loại bỏ chúng ngay từ đầu.

### Bước 3 — Tính đạo hàm A (Loss theo từng $p_k$) — tách rõ 2 trường hợp

**Tại vị trí đúng ($k=1$)**: vì $\mathcal{L} = -\log(p_1)$, đạo hàm là:
$$\frac{\partial \mathcal{L}}{\partial p_1} = -\frac{1}{p_1}$$

**Tại vị trí sai ($k=2$ hoặc $k=3$)**: vì $p_2, p_3$ không xuất hiện trong công thức $\mathcal{L}$ (đã bị $y_k=0$ loại bỏ), đạo hàm là:
$$\frac{\partial \mathcal{L}}{\partial p_2} = 0 \quad\text{(tuyệt đối, không phụ thuộc giá trị } p_2\text{)}$$

Đây là điều dễ hiểu lầm nhất: không phải "đạo hàm A lớn dần khi $p$ nhỏ" áp dụng cho mọi vị trí — nó chỉ đúng cho đúng một vị trí duy nhất: vị trí nhãn thật. Ở mọi vị trí sai, đạo hàm A luôn là 0, bất kể $p_2$ là 0.01 hay 0.99.

### Bước 4 — Tính đạo hàm B (softmax theo logit) — áp dụng đều cho mọi vị trí

$$\frac{\partial p_k}{\partial z_k} = p_k(1-p_k)$$

Tính cho cả 3 vị trí với số liệu giả định:

| $k$ | $p_k$ | $p_k(1-p_k)$ |
|---|---|---|
| 1 (đúng) | 0.05 | $0.05\times0.95=0.0475$ |
| 2 (sai) | 0.90 | $0.90\times0.10=0.09$ |
| 3 (sai) | 0.05 | $0.0475$ |

### Bước 5 — Nhân A×B để ra gradient thật tại từng vị trí

**Tại vị trí đúng ($k=1$)**, dùng rút gọn toán học chuẩn của đạo hàm tổ hợp softmax + cross-entropy:

$$\frac{\partial \mathcal{L}}{\partial z_1} = p_1 - y_1 = 0.05 - 1 = -0.95$$

Đây là gradient mạnh, không hề "vanishing" — vì $p_1$ càng nhỏ (bị dập càng sâu), $|p_1 - 1|$ càng lớn, tín hiệu "hãy tăng $z_1$ lên" càng mạnh mẽ.

**Tại vị trí sai ($k=2$)**:

$$\frac{\partial \mathcal{L}}{\partial z_2} = \frac{\partial \mathcal{L}}{\partial p_2} \times \frac{\partial p_2}{\partial z_2} = 0 \times 0.09 = 0$$

Đây chính là chỗ vanishing gradient thực sự xảy ra: gradient tại vị trí sai (đang bị tự tin gán nhầm 0.90) bằng đúng 0 — không phải vì $p_2(1-p_2)$ nhỏ, mà vì đạo hàm A tại vị trí này vốn dĩ đã bằng 0 tuyệt đối theo đúng công thức one-hot.

### Bước 6 — Vậy "mắc kẹt" nằm ở đâu, chính xác?

Mô hình có nhận được tín hiệu kéo $z_1$ (vị trí đúng) lên — gradient -0.95 khá mạnh. Nhưng mô hình không hề nhận được tín hiệu nào để hạ $z_2$ (vị trí sai) xuống — gradient đúng bằng 0 tại đó.

Vì cả 3 xác suất buộc phải cộng lại bằng 1 (ràng buộc của chính softmax), việc kéo $p_1$ lên chỉ có thể xảy ra gián tiếp — thông qua việc $z_1$ tăng làm toàn bộ mẫu số chung thay đổi, kéo theo $p_2$ giảm một cách thụ động, chứ không phải vì có gradient nào chủ động "phạt" $z_2$. Đây là một quá trình chậm và gián tiếp, đặc biệt khó khăn khi $p_2$ đã bị đẩy lên rất cao do τ quá nhỏ.

---

## Phần lõi — trả lời trực tiếp, đúng trọng tâm

Nếu τ bị cố định ở một giá trị rất nhỏ ngay từ đầu huấn luyện, mô hình có nguy cơ bị mắc kẹt ở một trạng thái tồi ngay từ những bước đầu tiên, do một cơ chế toán học cụ thể liên quan tới đạo hàm của softmax.

Ở giai đoạn đầu, trọng số của cả hai encoder còn khởi tạo ngẫu nhiên, similarity giữa các cặp trong batch phần lớn là nhiễu — hoàn toàn có khả năng một cặp sai vô tình có similarity nhỉnh hơn cặp đúng một cách ngẫu nhiên. Nếu τ đã rất nhỏ, phép chia similarity cho τ sẽ khuếch đại mạnh sự chênh lệch ngẫu nhiên đó, khiến softmax bão hòa cực đoan — xác suất bị dồn gần như tuyệt đối vào cặp sai đó, trong khi cặp đúng bị dập gần về 0.

Xét đạo hàm của hàm mất mát cross-entropy theo xác suất từng vị trí: vì nhãn thật là dạng one-hot (chỉ một vị trí có $y=1$, còn lại $y=0$), công thức Loss $\mathcal{L}=-\sum_k y_k\log(p_k)$ rút gọn chỉ còn phụ thuộc vào đúng một số hạng tại vị trí nhãn thật. Điều này dẫn tới hệ quả quan trọng: đạo hàm của Loss theo xác suất tại các vị trí sai luôn bằng 0 một cách tuyệt đối, bất kể xác suất tại đó cao hay thấp, vì các số hạng tương ứng đã bị hệ số $y_k=0$ loại bỏ ngay từ công thức.

Kết hợp với đạo hàm của softmax theo logit, $\frac{\partial p_k}{\partial z_k}=p_k(1-p_k)$, và rút gọn theo chain rule, gradient thật sự cập nhật cho logit tại mỗi vị trí có dạng $\frac{\partial\mathcal{L}}{\partial z_k}=p_k-y_k$. Tại vị trí nhãn thật đang bị dập xuống gần 0, gradient này vẫn khá mạnh — mô hình vẫn nhận được tín hiệu thúc đẩy tăng xác suất tại đó. Nhưng tại vị trí sai đang bị tự tin gán nhầm gần 1, gradient bằng đúng 0 — mô hình hoàn toàn không nhận được tín hiệu nào để hạ bớt sự tự tin sai lầm đó xuống một cách trực tiếp.

Vì tổng xác suất luôn phải bằng 1, việc kéo xác suất đúng lên chỉ có thể diễn ra gián tiếp, thông qua ảnh hưởng của việc tăng logit đúng lên toàn bộ mẫu số chung, khiến xác suất sai giảm một cách thụ động chứ không chủ động bị sửa. Đây là một quá trình chậm và kém hiệu quả, đặc biệt khi độ lệch ban đầu đã bị τ quá nhỏ đẩy lên mức cực đoan ngay từ đầu. Đây chính là lý do CLIP không cố định τ thủ công mà để nó là một tham số học được, khởi tạo ở mức an toàn hơn để tránh softmax bão hòa cực đoan dựa trên nhiễu ngẫu nhiên ngay từ những bước huấn luyện đầu tiên.

---

## Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Vậy gradient tại vị trí nhãn thật vẫn mạnh, sao vẫn gọi là vanishing gradient được?"**

Cần phân biệt rõ vanishing gradient trong bối cảnh này xảy ra cụ thể ở đâu, không phải một mô tả chung chung "gradient nhỏ khắp mọi nơi". Gradient tại vị trí nhãn thật (đang bị dập) thực chất vẫn còn tương đối mạnh và có xu hướng càng mạnh hơn khi xác suất đó càng bị dập sâu — đây không phải nơi vanishing gradient xảy ra. Vấn đề nằm ở các vị trí sai đang bị tự tin gán nhầm: gradient tại đó bằng đúng 0 do chính cấu trúc one-hot của cross-entropy, khiến mô hình không có kênh trực tiếp nào để sửa sai lầm đó, chỉ có thể sửa gián tiếp và chậm chạp thông qua ràng buộc tổng xác suất bằng 1. Đây là hình thức tinh vi hơn của vanishing gradient, không đơn thuần là toàn bộ gradient tiến về 0 đồng loạt.

**Nếu hội đồng hỏi: "Nếu gradient tại vị trí đúng vẫn mạnh, vậy tại sao mô hình vẫn học chậm hoặc kẹt, không phải nó vẫn đang được sửa sao?"**

Vấn đề không phải mô hình hoàn toàn không học được gì, mà là tốc độ và cách nó học bị méo. Vì kênh sửa trực tiếp cho vị trí sai không tồn tại, quá trình điều chỉnh chỉ trông cậy vào việc tăng dần logit đúng để gián tiếp kéo xác suất sai xuống qua ràng buộc chuẩn hóa chung — với batch chỉ có vài chục hay vài trăm mẫu ở những bước đầu, việc lặp lại tình huống này liên tục qua nhiều batch có nguy cơ khiến mô hình dành phần lớn thời gian đầu chỉ để gỡ những sự tự tin sai được tạo ra bởi chính τ quá nhỏ, thay vì học được biểu diễn ngữ nghĩa có ý nghĩa mới. Đây là lãng phí năng lực học ở giai đoạn quan trọng nhất của quá trình huấn luyện.

---

# Câu trả lời hoàn chỉnh — Câu 8, Cấp độ 3

*"Việc dùng thuật toán tìm kiếm gần đúng (ANN/HNSW) thay vì tìm kiếm chính xác tuyệt đối (brute-force k-NN) trên vector 512 chiều của CLIP có liên hệ gì với hiện tượng 'curse of dimensionality' trong không gian nhiều chiều? Vì sao đây không đơn thuần là vấn đề 'đánh đổi tốc độ lấy chi phí'?"*

---

## Phụ lục — Bằng chứng toán học và thực nghiệm (dùng khi hội đồng yêu cầu chứng minh cụ thể)

### Đại lượng đo độ "rõ ràng" của khoảng cách — Relative Contrast

Để đo định lượng mức độ curse of dimensionality, dùng đại lượng Relative Contrast:

$$RC(d) = \frac{\text{Dist}_{max} - \text{Dist}_{min}}{\text{Dist}_{min}}$$

$RC$ càng lớn, khoảng cách gần và xa càng dễ phân biệt. $RC$ càng tiến về 0, mọi điểm trông gần bằng nhau. Kết quả đã được chứng minh trong nghiên cứu (Beyer et al., 1999): với dữ liệu ngẫu nhiên độc lập trong không gian $d$ chiều, khi $d \to \infty$ thì $RC(d) \to 0$.

### Kết quả mô phỏng thực nghiệm

Mô phỏng với N=1000 điểm ngẫu nhiên, tính $RC(d)$ trung bình qua nhiều lần thử ở các số chiều khác nhau:

| $d$ (số chiều) | $RC(d)$ trung bình | Ý nghĩa |
|---|---|---|
| 2 | 200.11 | Khoảng cách xa/gần chênh lệch cực lớn — dễ phân biệt |
| 5 | 7.56 | Vẫn còn phân biệt được rõ |
| 20 | 1.42 | Bắt đầu co lại đáng kể |
| 100 | 0.43 | Đã khá nhòe |
| **512** | **0.17** | **Gần bằng nhau — đúng số chiều CLIP dùng** |
| 1000 | 0.12 | Tiếp tục co lại |

Ở $d=2$, khoảng cách xa nhất hơn khoảng cách gần nhất tới 200 lần. Ở $d=512$, khoảng cách xa nhất chỉ hơn khoảng cách gần nhất khoảng 17% — một chênh lệch rất mong manh để phân biệt "gần" và "xa". Vẽ đồ thị $RC(d)$ theo $d$ cho thấy đường cong sụp đổ gần như ngay lập tức khi $d$ vượt qua khoảng 20-30, sau đó tiệm cận sát 0 và gần như phẳng suốt tới $d=1000$ — 512 chiều của CLIP nằm ngay trong vùng đã sụp đổ từ lâu.

### Giải thích bằng công thức — vì sao hiện tượng này xảy ra

Khoảng cách Euclidean bình phương giữa 2 điểm ngẫu nhiên độc lập trong không gian $d$ chiều:

$$\text{Dist}^2 = \sum_{i=1}^{d} (x_i - y_i)^2$$

Đây là tổng của $d$ số hạng độc lập. Theo Luật số lớn trong xác suất thống kê, tổng của nhiều biến ngẫu nhiên độc lập có xu hướng tập trung chặt quanh giá trị kỳ vọng của nó khi số lượng số hạng tăng. Gọi $\mu$ là kỳ vọng, $\sigma^2$ là phương sai của một số hạng:

$$\mathbb{E}[\text{Dist}^2] = d\mu \qquad \text{Var}(\text{Dist}^2) = d\sigma^2$$

Độ lệch chuẩn tương đối (mức độ dao động so với giá trị trung bình):

$$\frac{\text{Độ lệch chuẩn}}{\text{Kỳ vọng}} = \frac{\sigma\sqrt{d}}{d\mu} = \frac{\sigma}{\mu\sqrt{d}}$$

Khi $d$ tăng, tỉ lệ này giảm theo tốc độ $\frac{1}{\sqrt{d}}$ — khoảng cách giữa các cặp điểm ngẫu nhiên có xu hướng tập trung rất chặt quanh một giá trị trung bình chung, khiến mọi khoảng cách "trông giống nhau" bất kể chúng thực sự gần hay xa theo trực giác thấp chiều. Đây là cơ chế toán học gốc rễ giải thích vì sao $RC(d) \to 0$.

---

## Phần lõi — trả lời trực tiếp, đúng trọng tâm

Curse of dimensionality là hiện tượng hình học: khi số chiều $d$ tăng, khoảng cách giữa các cặp điểm trong không gian có xu hướng tập trung chặt quanh một giá trị trung bình chung, khiến tỉ lệ giữa khoảng cách xa nhất và gần nhất từ một điểm truy vấn tới tập dữ liệu tiến dần về 1. Khái niệm "hàng xóm gần nhất" theo đúng nghĩa khác biệt rõ rệt với phần còn lại dần mất đi ý nghĩa phân biệt như ở không gian thấp chiều. Với vector 512 chiều của CLIP, hiện tượng này khiến việc tính khoảng cách chính xác tuyệt đối bằng brute-force vừa tốn kém về chi phí tính toán, vừa không mang lại lợi ích tương xứng với chi phí đó.

Điểm mấu chốt, và là lý do đây không đơn thuần là bài toán đánh đổi tốc độ lấy độ chính xác, nằm ở chỗ: trong không gian nhiều chiều, ranh giới giữa "top-1 chính xác tuyệt đối" và "top-k gần đúng" đã tự nhiên bị nhòe đi về mặt hình học, do chính hiện tượng curse of dimensionality, không phải do thuật toán ANN chủ động bỏ qua hay đánh đổi. Nếu hiểu theo cách "đánh đổi tốc độ lấy chi phí", ta ngầm giả định rằng độ chính xác tuyệt đối của brute-force vẫn còn nguyên giá trị và ta chỉ đang chấp nhận hy sinh một phần giá trị đó để đổi lấy tốc độ. Nhưng thực chất, phần giá trị tưởng như bị hy sinh đó đã không còn nhiều ý nghĩa phân biệt thực tế ngay từ trong chính cấu trúc hình học của không gian chiều cao — brute-force trả về chính xác tuyệt đối theo định nghĩa toán học, nhưng cái chính xác đó dựa trên những khoảng cách đã bị curse of dimensionality làm cho gần như đồng đều giữa top-1 và top-10, nên nó không còn đáng tin cậy về mặt ngữ nghĩa như con số tuyệt đối gợi ý.

Đây là lý do lựa chọn ANN không đơn thuần là bài toán kỹ thuật thuần túy về hiệu năng, mà bắt nguồn từ một nhận định về bản chất của chính không gian dữ liệu: khi curse of dimensionality đã làm mờ đi ranh giới giữa gần và xa, việc trả giá đắt để lấy chính xác tuyệt đối trở thành một sự đánh đổi không cân xứng, vì phần được cho là mất đi khi chuyển sang ANN thực chất đã mất đi ý nghĩa từ trước đó.

Cần nói thêm, CLIP không sinh ra vector ngẫu nhiên rải đều khắp không gian 512 chiều như trong mô phỏng lý thuyết thuần túy, mà nhờ quá trình huấn luyện contrastive, tạo ra cấu trúc cụm ngữ nghĩa rõ ràng — ảnh cùng chủ đề hay cùng danh tính nằm gần nhau thành từng cụm. Chính cấu trúc cụm này là điều kiện giúp HNSW hoạt động gần với độ phức tạp $O(\log N)$ trong thực tế thay vì suy biến về $O(N)$ như khi dữ liệu hoàn toàn ngẫu nhiên, không có cấu trúc. Hai quyết định thiết kế — chọn CLIP và chọn HNSW — vì vậy hỗ trợ lẫn nhau chứ không độc lập.

---

## Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Có thể chứng minh cụ thể hiện tượng này bằng số liệu không, hay chỉ là lý thuyết suông?"**

Có thể mô phỏng bằng thực nghiệm đơn giản: sinh ngẫu nhiên N điểm trong không gian $d$ chiều, tính Relative Contrast ở nhiều mức $d$ khác nhau. Kết quả cho thấy ở $d=2$, khoảng cách xa nhất hơn khoảng cách gần nhất tới khoảng 200 lần — rất dễ phân biệt. Nhưng ở $d=512$, đúng số chiều CLIP sử dụng, khoảng cách xa nhất chỉ hơn khoảng cách gần nhất khoảng 17% — một chênh lệch rất mong manh. Đồ thị Relative Contrast theo số chiều cho thấy đường cong sụp đổ gần như ngay lập tức khi số chiều vượt qua khoảng 20-30, rồi gần như phẳng suốt từ đó — 512 chiều nằm sâu trong vùng đã sụp đổ từ lâu, không phải vùng biên giới còn tranh cãi.

**Nếu hội đồng hỏi: "Vì sao hiện tượng này lại xảy ra về mặt toán học, không chỉ là quan sát thực nghiệm?"**

Khoảng cách Euclidean bình phương giữa hai điểm là tổng của $d$ số hạng độc lập, mỗi số hạng ứng với một chiều. Theo Luật số lớn trong xác suất thống kê, tổng của nhiều biến ngẫu nhiên độc lập có xu hướng tập trung chặt quanh giá trị kỳ vọng của nó khi số lượng số hạng tăng lên — độ lệch tương đối so với giá trị trung bình giảm theo tốc độ một trên căn bậc hai của số chiều. Đây là lý do gốc rễ khiến khoảng cách giữa các cặp điểm trong không gian cao chiều có xu hướng trông giống nhau, bất kể chúng có thực sự gần hay xa theo trực giác quen thuộc ở không gian thấp chiều.

**Nếu hội đồng hỏi: "Nếu chính xác tuyệt đối của brute-force đã mất ý nghĩa, vậy tại sao vẫn cần đến vector 512 chiều thay vì giảm xuống số chiều thấp hơn để tránh vấn đề này ngay từ đầu?"**

Số chiều của vector CLIP là một đánh đổi giữa khả năng biểu diễn ngữ nghĩa và mức độ nghiêm trọng của curse of dimensionality, không thể tùy tiện giảm xuống thấp mà không mất thông tin. Giảm số chiều quá nhiều sẽ hạn chế khả năng mã hóa các sắc thái ngữ nghĩa phức tạp cần thiết để phân biệt các đối tượng khác nhau, ảnh hưởng trực tiếp đến chất lượng biểu diễn của mô hình. Thay vì giảm số chiều để né tránh curse of dimensionality, cách tiếp cận thực dụng hơn là chấp nhận hiện tượng này như một đặc tính tự nhiên của không gian chiều cao, rồi chọn thuật toán tìm kiếm phù hợp với đặc tính đó — chính là lý do ANN/HNSW được ưu tiên hơn brute-force trong bối cảnh này.

**Nếu hội đồng hỏi: "Vậy vì sao HNSW vẫn hoạt động hiệu quả trên vector CLIP trong thực tế, nếu bản thân không gian 512 chiều đã bị curse of dimensionality làm nhòe hết cấu trúc?"**

Mô phỏng lý thuyết về curse of dimensionality giả định dữ liệu hoàn toàn ngẫu nhiên, không có cấu trúc gì cả. Nhưng vector CLIP không phải dữ liệu ngẫu nhiên — nhờ quá trình huấn luyện contrastive, các vector có cấu trúc cụm ngữ nghĩa rõ ràng, ảnh có nội dung liên quan nằm gần nhau thành từng nhóm trong không gian embedding. Chính cấu trúc cụm này là điều kiện then chốt giúp đồ thị phân tầng của HNSW tìm được đường đi hợp lý để nhảy nhanh tới vùng lân cận đúng, giữ được hiệu năng gần với độ phức tạp logarit thay vì suy biến về tuyến tính như trên dữ liệu hoàn toàn ngẫu nhiên không có cấu trúc.

---

# Câu trả lời hoàn chỉnh — Câu 9, Cấp độ 3

*"Giả sử nhóm phải chọn giữa việc tăng batch size khi huấn luyện một mô hình contrastive learning tương tự CLIP, và việc tăng kích thước/độ đa dạng của tập dữ liệu huấn luyện — hai lựa chọn này giải quyết hai vấn đề khác nhau như thế nào? Chúng có thể thay thế cho nhau không?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Batch size và quy mô, độ đa dạng của dữ liệu huấn luyện là hai trục độc lập, không thể thay thế cho nhau, vì chúng giải quyết hai vấn đề khác nhau ở hai tầng khác nhau của quá trình huấn luyện.

Batch size N quyết định số lượng negative samples mà mỗi cặp dương phải cạnh tranh để phân biệt trong một lần tính gradient — đây là vấn đề về chất lượng tín hiệu học ở từng bước cập nhật cụ thể. N càng lớn, bài toán phân biệt trong mỗi bước càng khó, buộc mô hình học biểu diễn tinh vi hơn ngay trong phạm vi dữ liệu của batch đó, cho tốc độ và độ ổn định hội tụ tốt hơn. Nhưng batch size không tạo ra thêm tri thức mới nào ngoài phạm vi dữ liệu sẵn có. Nếu dataset nền tảng nhỏ và kém đa dạng, dù tăng batch size tới mức dùng hết toàn bộ dataset trong một lần, mô hình cũng chỉ học được cách phân biệt tốt hơn giữa chính những mẫu ít ỏi đó, không có khả năng khái quát ra ngoài phạm vi đã thấy.

Quy mô và độ đa dạng của tập dữ liệu quyết định số lượng khái niệm, tình huống, ngữ cảnh khác nhau mà mô hình từng tiếp xúc xuyên suốt toàn bộ quá trình huấn luyện — đây là vấn đề về phạm vi tri thức tổng thể mô hình có thể tổng quát hóa tới, liên quan trực tiếp tới khả năng zero-shot. Dữ liệu càng đa dạng, mô hình càng có cơ hội học được biểu diễn ngữ nghĩa phong phú, áp dụng được cho cả những khái niệm chưa từng thấy y hệt lúc train. Nhưng nếu dữ liệu rất đa dạng mà batch size lại quá nhỏ, mỗi lần cập nhật trọng số vẫn chỉ so sánh trong phạm vi rất hẹp, khiến tốc độ và chất lượng hội tụ ở từng bước bị hạn chế, dù nền tảng dữ liệu tốt.

Vì tác động lên hai tầng khác nhau — một tầng là chất lượng học trong từng bước cập nhật, một tầng là phạm vi tri thức tổng thể qua toàn bộ quá trình huấn luyện — hai yếu tố này không thể dùng cái này bù đắp hoàn toàn cho sự thiếu hụt của cái kia. Chúng chỉ thực sự cộng hưởng khi đi cùng nhau: dữ liệu đa dạng cung cấp phạm vi tri thức rộng, batch size lớn đảm bảo mỗi bước học tận dụng hiệu quả phạm vi tri thức đó thông qua tín hiệu gradient đủ mạnh.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Vậy batch size nhỏ có gây overfitting không?"**

Không. Overfitting là hiện tượng đo trên mối quan hệ giữa capacity của mô hình và lượng, tính đại diện của toàn bộ dữ liệu huấn luyện, không phải một hiện tượng gắn với một lần cập nhật gradient hay kích thước của riêng một batch. Batch size chỉ quyết định mỗi lần cập nhật mô hình nhìn thấy bao nhiêu mẫu cùng lúc để tính gradient — dù batch nhỏ hay lớn, qua đủ số epoch, mô hình vẫn tiếp xúc với toàn bộ dataset như nhau, chỉ khác cách chia thành từng lô để tính toán. Nếu train trên cùng một dataset, dùng batch nhỏ hay batch lớn thì rủi ro overfitting về cơ bản không đổi, vì vẫn cùng một lượng dữ liệu, cùng một capacity mô hình. Điều thay đổi khi đổi batch size chỉ là tốc độ hội tụ, độ ổn định của quá trình tối ưu, và trong trường hợp riêng của contrastive learning là số lượng negative sample mỗi bước.

**Nếu hội đồng hỏi: "Nếu chỉ được chọn một trong hai để cải thiện, ưu tiên cái nào trước?"**

Tùy vào việc triệu chứng thực tế đang gặp phải thuộc tầng nào. Nếu mô hình học chậm, tín hiệu gradient dao động không ổn định, hoặc khó phân biệt các mẫu gần giống nhau dù dữ liệu đã đủ đa dạng, đây là dấu hiệu của vấn đề ở tầng batch size — cần tăng batch size hoặc áp dụng kỹ thuật mô phỏng batch lớn như memory bank. Nếu mô hình học ổn định trên dữ liệu hiện có nhưng thất bại hoàn toàn khi gặp khái niệm mới ngoài phạm vi đã thấy, đây là dấu hiệu của vấn đề ở tầng dữ liệu — cần mở rộng quy mô và độ đa dạng của dataset, tăng batch size trong trường hợp này sẽ không giải quyết được vấn đề tổng quát hóa. Trong thực tế, các nghiên cứu về contrastive learning quy mô lớn như CLIP thường ưu tiên đầu tư vào cả hai đồng thời, vì lợi ích của một trục bị giới hạn nghiêm trọng nếu trục còn lại quá yếu.

**Nếu hội đồng hỏi: "Cho một ví dụ cụ thể minh họa vì sao hai yếu tố này không thể thay thế nhau?"**

Giả sử có một dataset chỉ gồm 100 ảnh, rất nhỏ và kém đa dạng. Dù tăng batch size lên đúng bằng 100, tức đưa toàn bộ dataset vào một lần cập nhật duy nhất, mô hình vẫn không bao giờ học được khái niệm nào ngoài 100 ảnh đó — batch size lớn chỉ giúp mô hình phân biệt tốt hơn giữa chính những mẫu ít ỏi này với nhau, không tạo ra thêm tri thức mới về thế giới bên ngoài phạm vi dataset. Ngược lại, giả sử có một dataset khổng lồ và cực kỳ đa dạng như 400 triệu cặp ảnh-văn bản của CLIP gốc, nhưng lại chỉ huấn luyện với batch size rất nhỏ, ví dụ N=8. Dù mô hình xuyên suốt quá trình huấn luyện có tiếp xúc với đủ loại tình huống qua nhiều epoch, mỗi lần cập nhật trọng số vẫn chỉ so sánh trong phạm vi rất hẹp là 8 đối thủ, khiến tín hiệu học mỗi bước yếu, tốc độ và chất lượng hội tụ bị hạn chế đáng kể dù nền tảng dữ liệu rất tốt. Hai kịch bản này cho thấy rõ thiếu một trong hai yếu tố đều để lại một loại giới hạn riêng mà yếu tố còn lại không thể bù đắp được.

---
# Câu trả lời hoàn chỉnh — Câu 10, Cấp độ 3

*"So sánh CLIP với một hệ thống nhận diện khuôn mặt phục vụ chấm công/an ninh (face verification) về mặt kiến trúc bài toán — cả hai có cùng thuộc dạng dual-encoder retrieval hay không? Vì sao?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Về bản chất kiến trúc triển khai thực tế, hệ thống face verification và CLIP đều thuộc dạng dual-encoder retrieval — dù thoạt nhìn có vẻ khác nhau vì face verification thường bị gắn với hình ảnh "bài toán phân loại".

Cần phân biệt rõ giai đoạn huấn luyện và giai đoạn triển khai của các mô hình như ArcFace. Trong lúc huấn luyện, ArcFace có sử dụng một lớp classification-head với hàm mất mát có tính chất angular margin, về hình thức gần với classification. Nhưng ở giai đoạn triển khai thực tế cho chấm công hay an ninh, lớp classification-head đó gần như không được sử dụng, vì nó chỉ biết đúng những danh tính đã có trong tập huấn luyện, gặp người mới hoàn toàn bó tay, giống hệt nhược điểm closed-set của bài toán classification thuần túy. Thay vào đó, hệ thống chỉ giữ lại phần encoder trích xuất embedding, rồi hoạt động theo đúng quy trình dual-encoder retrieval: mỗi danh tính được đăng ký bằng cách encode một vài ảnh mẫu thành vector, lưu sẵn vào cơ sở dữ liệu; khi xác thực, ảnh mới được encode rồi so cosine similarity với các vector đã lưu, lấy kết quả gần nhất để quyết định.

Đây chính xác là cấu trúc pre-compute rồi so khớp sau mà CLIP cũng sử dụng — cả hai đều encode độc lập trước, không cần chạy lại toàn bộ mạng mỗi lần so sánh, và đều dựa vào phép đo similarity trên không gian embedding để đưa ra kết quả, thay vì một quyết định phân loại cứng dựa trên lớp cố định.

Điểm khác biệt thực sự giữa hai hệ thống không nằm ở việc có dùng kiến trúc dual-encoder retrieval hay không, mà nằm ở hai khía cạnh khác. Thứ nhất, số loại encoder và loại dữ liệu xử lý: face verification chỉ dùng một loại encoder duy nhất, so ảnh với ảnh cùng một domain, trong khi CLIP dùng hai loại encoder khác nhau để xử lý hai domain dữ liệu hoàn toàn khác biệt là ảnh và văn bản, tức là truy hồi liên phương thức (cross-modal). Thứ hai, cách diễn giải kết quả similarity: face verification thường cần một quyết định nhị phân rõ ràng, có hay không cho phép truy cập, nên cần đặt một ngưỡng similarity cụ thể để phân định khớp hay không khớp. CLIP thì không cần ngưỡng cứng như vậy, chỉ cần trả về danh sách xếp hạng theo mức độ liên quan giảm dần, đúng với bản chất bài toán truy hồi mở, không đòi hỏi một quyết định tuyệt đối cho từng kết quả.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Nếu cả hai đều là dual-encoder retrieval, vậy sao ArcFace vẫn cần huấn luyện với classification-head, không huấn luyện trực tiếp bằng contrastive loss như CLIP luôn?"**

ArcFace vẫn có thể huấn luyện được bằng các dạng loss thuần contrastive như Triplet Loss, và trên thực tế nhiều mô hình face embedding khác cũng dùng hướng này. Việc ArcFace chọn dùng classification-head với angular margin loss trong lúc huấn luyện là một lựa chọn kỹ thuật khác, không phải bắt buộc về mặt bản chất bài toán. Angular margin loss tận dụng được cấu trúc có sẵn của bài toán face verification, nơi số lượng danh tính trong tập huấn luyện dù lớn nhưng vẫn hữu hạn và cố định tại thời điểm huấn luyện, nên có thể tạm thời coi mỗi danh tính như một lớp để tối ưu margin giữa các lớp cho rõ ràng hơn, giúp embedding học được có độ phân tách tốt hơn giữa các danh tính khác nhau. Nhưng bản thân classification-head này bị loại bỏ hoàn toàn khi triển khai, chỉ đóng vai trò công cụ hỗ trợ huấn luyện embedding tốt hơn, không phải thành phần cốt lõi của hệ thống lúc vận hành thực tế.

**Nếu hội đồng hỏi: "Vậy nếu ArcFace về bản chất vẫn là dual-encoder retrieval, tại sao không dùng luôn CLIP cho bài toán chấm công, an ninh?"**

Dù cùng thuộc kiến trúc dual-encoder retrieval, hai mô hình được tối ưu cho hai mục tiêu khác nhau về độ chi tiết phân biệt. CLIP được huấn luyện để tổng quát hóa tốt trên phạm vi ngữ nghĩa cực rộng, đánh đổi lấy độ chính xác chuyên biệt cho từng danh tính cụ thể. ArcFace được huấn luyện chuyên biệt và tối ưu sâu cho đúng một bài toán duy nhất là phân biệt gương mặt người, với các kỹ thuật như angular margin được thiết kế riêng để tối đa hóa khoảng cách giữa các danh tính khác nhau và tối thiểu hóa khoảng cách giữa các ảnh cùng một danh tính, đạt độ chính xác cao hơn nhiều so với CLIP nếu áp dụng trực tiếp cho bài toán này. Đây là ví dụ thực tế của sự đánh đổi giữa mô hình tổng quát và mô hình chuyên biệt, dù cả hai có thể cùng chia sẻ một kiến trúc triển khai nền tảng là dual-encoder retrieval.

**Nếu hội đồng hỏi: "Có sự khác biệt nào về cách xử lý dữ liệu mới, ví dụ nhân viên mới hoặc đối tượng mới trong database, giữa hai hệ thống không?"**

Cả hai hệ thống đều xử lý tốt dữ liệu mới nhờ chính đặc tính dual-encoder retrieval, không cần huấn luyện lại mô hình khi có đối tượng mới. Với face verification, khi có nhân viên mới, chỉ cần encode ảnh của người đó và lưu thêm vào cơ sở dữ liệu, không cần train lại encoder. Với CLIP trong hệ thống truy hồi ảnh, khi có ảnh mới được tải lên, cũng chỉ cần encode và lưu vào cơ sở dữ liệu vector tương tự. Đây chính là lợi thế cốt lõi của kiến trúc dual-encoder so với các mô hình classification closed-set truyền thống, nơi việc thêm một lớp mới đòi hỏi phải huấn luyện lại toàn bộ hoặc một phần đáng kể của mô hình.

---