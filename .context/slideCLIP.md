# Phần 1 — CLIP

## MỤC I. CƠ CHẾ HỌC TƯƠNG PHẢN — NỀN TẢNG CỦA KHẢ NĂNG ZERO-SHOT

### 1. Bố cục slide

- **Tiêu đề mục:** "I. Cơ chế học tương phản" — góc trên cùng, cỡ chữ lớn, có đánh số La Mã rõ ràng để dễ định vị khi cần nhảy tới.
- **Nửa trên bên trái:** Sơ đồ minh họa ma trận N×N — một lưới ô vuông nhỏ (gợi ý 4×4 hoặc 5×5 cho gọn), đường chéo chính tô màu nổi bật (xanh — biểu thị cặp đúng, được kéo gần), các ô còn lại tô màu nhạt hơn (đỏ nhạt — biểu thị cặp sai, bị đẩy xa). Có thể thêm mũi tên nhỏ minh họa hướng "kéo lại" và "đẩy ra".
- **Nửa trên bên phải:** Bảng phân loại bài toán (Supervised/Self-supervised/Metric Learning) — giữ nguyên 3 dòng như đã soạn, dùng bảng gọn 3 cột.
- **Nửa dưới:** Một dòng câu chốt, đóng khung nhẹ hoặc in nghiêng để phân biệt với phần nội dung chính — đây là câu sẽ đọc nếu bị hỏi trực tiếp.
- **Màu sắc:** dùng đúng bảng màu đã chọn cho toàn bộ bộ slide phụ (đề xuất giữ "Midnight Executive" — navy, ice blue — nhất quán với slide chính).

---

### 2. Nội dung chữ trên slide 

**Tiêu đề:** I. Cơ chế học tương phản

**Dòng mở đầu (1 dòng):**
> CLIP học từ 400 triệu cặp (ảnh, văn bản) — không dùng tập nhãn cố định.

**Chú thích sơ đồ ma trận (rất ngắn, đặt cạnh sơ đồ):**
- Đường chéo: cặp đúng → kéo gần
- Ngoài đường chéo: cặp sai → đẩy xa

**Bảng phân loại:**

| Nhóm | CLIP có ở đây? |
|---|---|
| Classification | Không |
| Self-supervised Representation Learning | Có |
| Metric Learning | Có |

**Câu chốt (đóng khung):**
> Không bị ràng buộc bởi tập nhãn cố định → khả năng Zero-shot.

---

### 3. Lời thoại

> Nền tảng đầu tiên cần làm rõ về CLIP là cơ chế học tương phản — chính cơ chế này quyết định toàn bộ đặc tính về sau của mô hình, bao gồm cả khả năng tổng quát hóa mà hệ thống đang khai thác.
>
> CLIP được huấn luyện trên bốn trăm triệu cặp ảnh và văn bản mô tả, thu thập trực tiếp từ Internet — không sử dụng một tập nhãn cố định được định nghĩa sẵn như các mô hình phân loại truyền thống. Trong quá trình huấn luyện, với mỗi lô dữ liệu gồm N cặp ảnh và văn bản, mô hình xây dựng một ma trận độ tương đồng kích thước N nhân N. Các cặp đúng — nằm trên đường chéo chính — được kéo lại gần nhau trong không gian biểu diễn; toàn bộ các cặp còn lại, không tương ứng với nhau, bị đẩy ra xa.
>
> Điểm mấu chốt nằm ở hệ quả của cơ chế này: vì CLIP không học một ranh giới quyết định cứng giữa các lớp cố định, mà học một hàm đo độ tương đồng ngữ nghĩa mang tính tổng quát, mô hình có khả năng so khớp với những khái niệm chưa từng xuất hiện nguyên vẹn trong quá trình huấn luyện — đây chính là nền tảng của khả năng Zero-shot, một trong những lý do cốt lõi khiến nhóm lựa chọn CLIP cho bài toán truy hồi ảnh đa phương thức của hệ thống.

---

## MỤC II. HAI BỘ MÃ HÓA TÁCH RỜI — IMAGE ENCODER VÀ TEXT ENCODER

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Hai bộ mã hóa tách rời" — góc trên cùng, cùng cỡ chữ và định dạng với Mục I để giữ tính nhất quán xuyên suốt bộ slide.
- **Trung tâm slide:** Sơ đồ hai nhánh song song — bên trái là khối "Image Encoder (ViT)" nhận đầu vào là ảnh được chia thành các patch nhỏ (vẽ vài ô vuông nhỏ minh họa việc chia patch), bên phải là khối "Text Encoder (Transformer)" nhận đầu vào là chuỗi token từ câu văn bản. Hai mũi tên từ hai khối này cùng hội tụ vào một điểm ở giữa, ghi chú "Không gian 512 chiều chung".
- **Dưới sơ đồ:** Bảng so sánh Dual-encoder vs Fusion-encoder, dạng bảng gọn 2 cột để đối chiếu trực quan.
- **Cuối slide:** Câu chốt đóng khung, cùng phong cách với Mục I.

---

### 2. Nội dung chữ trên slide 

**Tiêu đề:** II. Hai bộ mã hóa tách rời

**Chú thích sơ đồ hai nhánh:**
- Image Encoder (ViT) — ảnh chia thành patch
- Text Encoder (Transformer) — văn bản chia thành token
- Cùng cho ra vector 512 chiều, cùng một không gian biểu diễn

**Bảng so sánh:**

| | Dual-encoder (CLIP) | Fusion-encoder |
|---|---|---|
| Tốc độ truy hồi | Nhanh — vector lưu sẵn | Chậm — chạy lại mỗi lượt |
| Khả năng mở rộng | Tốt | Kém |

**Câu chốt (đóng khung):**
> Hai encoder tách rời → cho phép tính trước vector, phục vụ truy hồi quy mô lớn.

---

### 3. Lời thoại

> Nền tảng kiến trúc thứ hai của CLIP là việc sử dụng hai bộ mã hóa hoàn toàn tách rời nhau, chỉ gặp nhau ở bước so sánh cuối cùng trong không gian biểu diễn chung.
>
> Bộ mã hóa ảnh sử dụng kiến trúc Vision Transformer — ảnh đầu vào được chia thành các mảng nhỏ, gọi là patch, mỗi patch được xử lý như một đơn vị token đưa vào cơ chế tự chú ý để học quan hệ không gian. Bộ mã hóa văn bản sử dụng kiến trúc Transformer thuần túy — câu văn bản được tách thành các token theo phương pháp Byte Pair Encoding, đưa vào cùng cơ chế tự chú ý để học quan hệ tuần tự giữa các từ. Dù xử lý hai loại dữ liệu có bản chất hoàn toàn khác nhau, cả hai bộ mã hóa đều cho ra vector cùng năm trăm mười hai chiều, cùng nằm trong một không gian biểu diễn chung duy nhất.
>
> Việc tách rời hai bộ mã hóa không phải một lựa chọn ngẫu nhiên, mà xuất phát từ chính yêu cầu của bài toán truy hồi quy mô lớn. Kiến trúc hai encoder tách biệt cho phép tính trước toàn bộ vector đặc trưng của ảnh trong cơ sở dữ liệu chỉ một lần duy nhất, lưu sẵn để phục vụ tìm kiếm sau này — mỗi lượt truy vấn chỉ cần mã hóa riêng nội dung tìm kiếm rồi so sánh, không cần chạy lại toàn bộ mô hình cho từng cặp ảnh và truy vấn. Đây chính là điều kiện bắt buộc để một hệ thống truy hồi ở quy mô lớn có thể vận hành với tốc độ chấp nhận được — và cũng là lý do trực tiếp nhất khiến kiến trúc song song này phù hợp với hệ thống hiện tại.

---

## MỤC III. HÀM MẤT MÁT INFONCE — CÔNG THỨC ĐẦY ĐỦ

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Hàm mất mát InfoNCE" — cùng định dạng với Mục I và II.
- **Phía trên, căn giữa, cỡ chữ lớn:** Hai công thức toán học đặt nổi bật, đây là trọng tâm hình ảnh của slide — công thức chiều I→T và công thức tổng hợp hai chiều.
- **Bên dưới công thức, chia hai cột:** Cột trái là bảng bóc tách ký hiệu (ngắn gọn, chỉ các ký hiệu cốt lõi); cột phải là sơ đồ minh họa nhỏ — một ma trận N×N thu gọn (có thể tái dùng ý tưởng từ Mục I) với chú thích "chia cho τ trước khi vào softmax".
- **Cuối slide:** Câu chốt đóng khung, cùng phong cách các mục trước.

---

### 2. Nội dung chữ trên slide (tối giản, súc tích)

**Tiêu đề:** III. Hàm mất mát InfoNCE

**Công thức (hiển thị đầy đủ, không rút gọn):**

$$\mathcal{L}_{I \to T} = -\frac{1}{N}\sum_{i=1}^{N} \log \frac{\exp(\text{sim}(I_i, T_i)/\tau)}{\sum_{j=1}^{N} \exp(\text{sim}(I_i, T_j)/\tau)}$$

$$\mathcal{L}_{T \to I} = -\frac{1}{N}\sum_{i=1}^{N} \log \frac{\exp(\text{sim}(T_i, I_i)/\tau)}{\sum_{j=1}^{N} \exp(\text{sim}(T_i, I_j)/\tau)}$$

$$\mathcal{L}_{CLIP} = \frac{1}{2}\left(\mathcal{L}_{I \to T} + \mathcal{L}_{T \to I}\right)$$

**Bảng ký hiệu (rút gọn còn đúng 4 dòng cốt lõi):**

| Ký hiệu | Ý nghĩa |
|---|---|
| $\text{sim}(I_i, T_j)$ | Cosine similarity |
| $\tau$ | Tham số nhiệt độ |
| Tử số | Cặp đúng (đường chéo) |
| Mẫu số | Softmax trên N ứng viên |

**Chú thích sơ đồ:** Chia cho τ trước khi vào softmax → khuếch đại độ tương phản

**Câu chốt (đóng khung):**
> InfoNCE = Softmax trên ma trận similarity + Cross-entropy, với nhãn là chính đường chéo.

---

### 3. Lời thoại

> Cơ chế học tương phản đã trình bày ở phần trước được lượng hóa thành một hàm mất mát cụ thể, gọi là InfoNCE, đây chính là công thức trung tâm chi phối toàn bộ quá trình huấn luyện của CLIP.
>
> Hàm mất mát được tính theo hai chiều đối xứng — chiều từ ảnh sang văn bản và chiều ngược lại — sau đó lấy trung bình cộng của cả hai. Về bản chất toán học, đây chính là phép softmax áp dụng lên ma trận độ tương đồng, kết hợp với hàm cross-entropy, trong đó nhãn tương ứng với vị trí trên đường chéo chính của ma trận — một cấu trúc phát sinh tự nhiên từ chính cặp dữ liệu ảnh và văn bản đã có sẵn, không phải một nhãn phân loại do con người gán thủ công.
>
> Một chi tiết kỹ thuật đáng chú ý là tham số nhiệt độ, ký hiệu tau. Vì độ tương đồng cosine bị giới hạn trong một khoảng rất hẹp, nếu không chia cho tham số này trước khi đưa vào softmax, chênh lệch giữa cặp đúng và cặp sai sẽ rất nhỏ, khiến tín hiệu học trở nên yếu. CLIP không cố định tham số này theo một giá trị thủ công, mà để nó trở thành một tham số học được, tự điều chỉnh trong suốt quá trình huấn luyện, kèm theo một ràng buộc chặn giá trị để đảm bảo tính ổn định.
>
> Việc tính đồng thời cả hai chiều cũng là một điểm cần lưu ý — vì phép chuẩn hóa softmax theo hàng và theo cột trên cùng một ma trận là hai phép tính độc lập với nhau, chỉ trùng nhau đúng tại một phần tử duy nhất trên đường chéo. Nếu chỉ tối ưu một chiều, mô hình có thể học tốt việc tìm đúng văn bản khi biết ảnh, nhưng lại không được tối ưu trực tiếp cho chiều ngược lại.

---

## Mục IV. DEMO TÍNH TAY — MA TRẬN 3×3 VÀ VAI TRÒ CỦA THAM SỐ τ

## SLIDE IV.1 — MA TRẬN "ĐẸP": CƠ CHẾ HỌC VÀ NHÃN GIẢ LÀ GÌ

### 1. Bố cục slide

- **Tiêu đề mục:** "IV. Demo tính tay — Ma trận 3×3 (1/2)".
- **Trên cùng:** Ma trận similarity 3×3 (mèo/chó/chim), đường chéo chính tô màu nổi bật.
- **Giữa slide:** Bảng tính softmax rút gọn cho hàng "ảnh mèo" — từng bước ngắn gọn (chia τ → mũ hóa → tổng → xác suất).
- **Cuối slide:** Câu chốt đóng khung, giải thích "nhãn giả" là gì.

### 2. Nội dung chữ trên slide

**Tiêu đề:** IV. Demo tính tay — Ma trận 3×3 (1/2)

**Ma trận similarity (mô hình đã học tốt), τ = 0.1:**

$$
\text{sim} =
\begin{pmatrix}
 & \text{"mèo"} & \text{"chó"} & \text{"chim"} \\
\text{ảnh mèo} & \mathbf{0.80} & 0.20 & 0.10 \\
\text{ảnh chó} & 0.15 & \mathbf{0.75} & 0.05 \\
\text{ảnh chim} & 0.05 & 0.10 & \mathbf{0.70} \\
\end{pmatrix}
$$

**Tính softmax cho hàng "ảnh mèo" (chuẩn hóa theo hàng — chiều I→T):**

| Bước | Kết quả |
|---|---|
| Chia cho τ=0.1 | [8.0, 2.0, 1.0] |
| Mũ hóa $e^z$ | [2980.96, 7.39, 2.72] |
| Tổng | 2991.07 |
| Softmax $p$ | **[0.9966, 0.00247, 0.00091]** |

**Loss:** $\mathcal{L} = -\log(0.9966) \approx 0.0034$ — rất nhỏ, vì mô hình đã tự tin đúng.

**Khái niệm "Nhãn giả" (Pseudo-label):**
> "Nhãn" trong InfoNCE không do con người gán thủ công — nó luôn là đúng vị trí trên đường chéo chính của ma trận (ảnh thứ $i$ khớp văn bản thứ $i$), phát sinh tự nhiên từ chính cách batch được xếp, không cần một tập dữ liệu nhãn riêng biệt nào.

**Câu chốt (đóng khung):**
> Đây chính là lý do CLIP không cần dữ liệu "đã gán nhãn" theo nghĩa truyền thống — chỉ cần các cặp (ảnh, văn bản) tự nhiên, "nhãn" tự động có sẵn từ chính cấu trúc batch.

### 3. Lời thoại

> Để làm rõ cơ chế học tương phản đã trình bày ở Mục I bằng một ví dụ cụ thể, nhóm xin minh họa qua một ma trận tính toán tay, với ba đối tượng đơn giản: mèo, chó, chim.
>
> Giả sử sau khi CLIP đã học tốt, ma trận độ tương đồng giữa ba ảnh và ba câu mô tả có dạng như trên — các cặp đúng, nằm trên đường chéo chính, có similarity cao hẳn so với các cặp còn lại. Tính thử với hàng ảnh mèo: chia similarity cho tham số nhiệt độ, mũ hóa, rồi chuẩn hóa thành xác suất — kết quả cho thấy mô hình gán xác suất tới chín mươi chín phẩy sáu sáu phần trăm cho đúng câu "con mèo", cho ra giá trị Loss rất nhỏ.
>
> Đây chính là lúc cần làm rõ khái niệm nhãn giả, một điểm nhiều người mới tiếp cận CLIP thường thắc mắc: nhãn ở đây không phải một tập dữ liệu được con người gán tay từ trước, như cách gán nhãn "đây là ảnh con mèo" trong bài toán phân loại truyền thống. Nhãn của InfoNCE luôn là chính vị trí trên đường chéo của ma trận — ảnh thứ mấy thì khớp với văn bản thứ đó, một quy luật phát sinh hoàn toàn tự nhiên từ cách dữ liệu được xếp vào cùng một lô huấn luyện, không cần bất kỳ công đoạn gán nhãn thủ công nào. Đây chính là lý do CLIP có thể huấn luyện trên bốn trăm triệu cặp dữ liệu thu thập tự động từ Internet, mà không cần con người ngồi gán nhãn từng cặp một.

---

## SLIDE IV.2 — MA TRẬN "NHIỄU": TÁC ĐỘNG CỦA τ VÀ VANISHING GRADIENT

### 1. Bố cục slide

- **Tiêu đề mục:** "IV. Demo tính tay — Ma trận 3×3 (2/2)".
- **Trên cùng:** Ma trận similarity nhiễu (batch đầu tiên), chênh lệch rất nhỏ giữa các phần tử.
- **Giữa slide:** Bảng đối chiếu 2 cột — τ=0.01 (quá nhỏ) vs τ=2.0 (quá lớn), mỗi cột: $p_{\text{mèo}}$, gradient $p(1-p)$, ý nghĩa.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** IV. Demo tính tay — Ma trận 3×3 (2/2)

**Ma trận similarity nhiễu (batch đầu tiên, trọng số gần ngẫu nhiên):**

$$
\text{sim}_{\text{nhiễu}} =
\begin{pmatrix}
 & \text{"mèo"} & \text{"chó"} & \text{"chim"} \\
\text{ảnh mèo} & 0.12 & 0.10 & 0.11 \\
\end{pmatrix}
\quad \text{(chỉ chênh nhau 0.01–0.02 — gần như nhiễu ngẫu nhiên)}
$$

**Đối chiếu 2 giá trị τ, cùng hàng "ảnh mèo":**

| | τ = 0.01 (quá nhỏ) | τ = 2.0 (quá lớn) |
|---|---|---|
| $p_{\text{mèo}}$ | **0.6652** | **0.3350** |
| Ý nghĩa | Tự tin thái quá dựa trên nhiễu | Gần như đoán ngẫu nhiên (1/3) |
| Gradient $p(1-p)$ | 0.2227 | 0.2228 |
| Hệ số $1/\tau$ nhân thêm (chain rule) | ×100 (khuếch đại mạnh) | ×0.5 (suy yếu) |
| Vấn đề thật | Dễ "chốt" sai sớm, khó sửa | Tín hiệu học quá yếu, học chậm |

**Câu chốt (đóng khung):**
> Cùng similarity nhiễu như nhau, τ khác nhau cho ra 2 kiểu thất bại khác nhau — một bên "tự tin nhầm", một bên "không đủ tự tin để học". CLIP để τ là tham số học được, khởi tạo ở mức an toàn, tránh cả 2 cực đoan.

### 3. Lời thoại

> Để thấy rõ vì sao tham số nhiệt độ lại quan trọng tới vậy, nhóm minh họa với một ma trận similarity khác — mô phỏng đúng trạng thái của batch huấn luyện đầu tiên, khi trọng số mô hình còn gần như ngẫu nhiên. Similarity giữa các cặp lúc này chỉ chênh nhau khoảng một tới hai phần trăm — một mức chênh lệch hoàn toàn có thể chỉ là nhiễu, chưa phản ánh bất kỳ hiểu biết thực sự nào của mô hình.
>
> Thử áp dụng hai giá trị tham số nhiệt độ khác nhau lên cùng ma trận nhiễu này. Với tham số quá nhỏ, phép chia khuếch đại mạnh sự chênh lệch nhỏ đó, đẩy xác suất gán cho mèo lên tới sáu mươi sáu phẩy năm phần trăm — mô hình trở nên tự tin một cách thái quá, dựa trên một tín hiệu còn quá yếu để đáng tin cậy. Ngược lại, với tham số quá lớn, phép chia làm mịn gần như hoàn toàn sự chênh lệch, xác suất gán cho ba lựa chọn gần như bằng nhau tuyệt đối, tương đương với việc đoán ngẫu nhiên.
>
> Điều thú vị: nếu chỉ nhìn vào giá trị đạo hàm của hàm softmax tại hai trường hợp này, cả hai đều cho ra con số gần giống nhau, xấp xỉ không phẩy hai hai. Nhưng bản chất vấn đề lại hoàn toàn khác nhau, và cần xét thêm hệ số nhân đi kèm trong chuỗi đạo hàm đầy đủ, chính là nghịch đảo của tham số nhiệt độ. Với tham số quá nhỏ, hệ số này khuếch đại gradient lên gấp một trăm lần — nguy cơ khiến mô hình chốt chặt niềm tin sai lệch từ nhiễu ban đầu, rất khó tự sửa nếu tiếp tục giảm tham số nhỏ hơn nữa. Với tham số quá lớn, hệ số này lại làm suy yếu gradient chỉ còn một nửa — tín hiệu học trở nên quá yếu, khiến mô hình học rất chậm trong giai đoạn đầu huấn luyện.
>
> Đây chính là lý do CLIP không cố định tham số nhiệt độ theo tay, mà để nó tự học trong suốt quá trình huấn luyện, khởi tạo ở một mức an toàn — tránh cả hai cực đoan vừa trình bày.

---

## MỤC IV. HỆ QUẢ TOÁN HỌC TẤT YẾU

### 1. Bố cục slide

- **Tiêu đề mục:** "IV. Hệ quả toán học tất yếu" — cùng định dạng với các mục trước.
- **Chia làm ba khối ngang hàng nhau (dạng 3 cột hoặc 3 card xếp dọc tùy độ rộng slide):** mỗi khối tương ứng một hiện tượng — Modality Gap, Vanishing Gradient, Curse of Dimensionality — mỗi khối có tiêu đề nhỏ riêng và tối đa 2-3 dòng nội dung cốt lõi.
- **Khối 1 (Modality Gap):** kèm hình minh họa nhỏ — hai đám mây điểm tách biệt trong không gian 2D (ảnh và văn bản không hòa lẫn).
- **Khối 2 (Vanishing Gradient):** kèm đồ thị nhỏ hình chuông ngược của hàm $p(1-p)$, đánh dấu điểm cực đại tại $p=0.5$.
- **Khối 3 (Curse of Dimensionality):** kèm biểu đồ RC theo số chiều đã có sẵn (`curse_of_dimensionality.png`), thu nhỏ lại vừa khối.
- **Cuối slide:** Câu chốt đóng khung, nối cả ba hiện tượng lại thành một luận điểm chung.

---

### 2. Nội dung chữ trên slide 

**Tiêu đề:** IV. Hệ quả toán học tất yếu

**Khối 1 — Modality Gap:**
- Vector ảnh và văn bản không hòa lẫn, tạo 2 "đám mây" tách biệt
- Nguyên nhân: cone effect + InfoNCE chỉ tối ưu thứ hạng tương đối
- Hệ quả: hệ thống dùng ranking top-k, không đặt ngưỡng tuyệt đối

**Khối 2 — τ quá nhỏ → Vanishing Gradient:**
- $\frac{\partial p_i}{\partial z_i} = p_i(1-p_i)$ — cực đại 0.25 tại $p=0.5$
- τ quá nhỏ ngay từ đầu → gradient triệt tiêu → mô hình "mắc kẹt"
- CLIP: τ là tham số học được, khởi tạo an toàn

**Khối 3 — Curse of Dimensionality:**
- $RC(d) \to 0$ khi $d \to \infty$ — d=512: RC ≈ 0.17
- Contrastive Learning tạo cấu trúc cụm → giảm nhẹ tác động này
- Cầu nối trực tiếp sang HNSW (Slide phụ 2)

**Câu chốt (đóng khung):**
> Ba hiện tượng đều là hệ quả tất yếu của chính công thức InfoNCE và hình học không gian nhiều chiều — không phải lỗi thiết kế.

---

### 3. Lời thoại 

> Từ chính cơ chế học tương phản và công thức InfoNCE vừa trình bày, có ba hệ quả toán học tất yếu phát sinh — không phải những khiếm khuyết ngẫu nhiên, mà là kết quả logic không thể tránh khỏi từ chính cách CLIP được xây dựng.
>
> Hiện tượng thứ nhất là khoảng cách giữa hai phương thức — dù đã huấn luyện xong, vector ảnh và vector văn bản không hòa lẫn vào nhau, mà tạo thành hai vùng tách biệt trong không gian biểu diễn. Nguyên nhân đến từ hai phía: thứ nhất, hai bộ mã hóa khởi tạo độc lập nên tự nhiên tập trung vào hai vùng khác nhau ngay từ đầu; thứ hai, hàm InfoNCE chỉ yêu cầu cặp đúng có độ tương đồng cao hơn tương đối so với các cặp sai trong cùng lô dữ liệu, chứ không ép buộc giá trị đó phải tiến gần tới mức tuyệt đối cao nhất. Hệ quả thực tiễn của hiện tượng này là hệ thống luôn xếp hạng kết quả theo thứ tự tương đối, không đặt một ngưỡng độ tương đồng cố định.
>
> Hiện tượng thứ hai liên quan tới chính tham số nhiệt độ đã đề cập. Nếu tham số này được đặt quá nhỏ ngay từ giai đoạn đầu huấn luyện — khi độ tương đồng giữa các cặp còn mang tính nhiễu ngẫu nhiên, chưa phản ánh điều gì có ý nghĩa — phép chia sẽ khuếch đại luôn cả nhiễu đó lên mức cực đoan. Về mặt đạo hàm, khi giá trị xác suất bị đẩy quá gần về không hoặc về một, gradient tại đó gần như triệt tiêu, khiến mô hình khó có thể tự điều chỉnh sai số. Đây chính là lý do CLIP không cố định tham số nhiệt độ theo tay, mà để nó tự học và khởi tạo ở một mức an toàn.
>
> Hiện tượng thứ ba là hiện tượng hình học thuần túy của không gian nhiều chiều — khi số chiều tăng lên, khoảng cách giữa các điểm dữ liệu ngẫu nhiên có xu hướng trở nên gần như đồng đều với nhau, làm mờ đi ranh giới giữa gần và xa. Tuy nhiên, nhờ chính cơ chế học tương phản đã trình bày, CLIP không sinh ra các vector ngẫu nhiên rải đều, mà tạo ra cấu trúc cụm ngữ nghĩa rõ ràng trong không gian biểu diễn — điều này giảm nhẹ đáng kể tác động của hiện tượng hình học nói trên, và chính là cầu nối trực tiếp giải thích vì sao thuật toán tìm kiếm mà hệ thống sử dụng có thể hoạt động hiệu quả, nội dung này em xin trình bày kỹ hơn ở phần tiếp theo.

---

## MỤC V. FINE-TUNING — VÌ SAO KHÔNG, VÀ PHƯƠNG ÁN AN TOÀN HƠN

### 1. Bố cục slide

- **Tiêu đề mục:** "V. Fine-tuning — vì sao không" — cùng định dạng với các mục trước.
- **Phía trên:** Một dòng khẳng định quyết định của đồ án, đặt nổi bật (cỡ chữ lớn hơn phần còn lại).
- **Giữa slide, chia hai cột:** Cột trái là hai khối nhỏ trình bày hai rủi ro (Overfitting, Catastrophic Forgetting) dạng icon + tên gọi + 1 dòng giải thích ngắn. Cột phải là sơ đồ minh họa Layer Freezing — một chuỗi các lớp mạng xếp dọc, các lớp đầu tô màu tối (đóng băng), các lớp cuối tô màu sáng (có thể huấn luyện), kèm mũi tên chỉ hướng "gần input" và "gần output".
- **Cuối slide:** Câu chốt đóng khung, cùng phong cách các mục trước.

---

### 2. Nội dung chữ trên slide

**Tiêu đề:** V. Fine-tuning — vì sao không

**Dòng khẳng định:**
> Quyết định: dùng CLIP pretrained thuần túy — không fine-tune

**Hai rủi ro (cột trái):**
- **Overfitting:** Capacity CLIP vượt xa quy mô dataset benchmark
- **Catastrophic Forgetting:** Chỉ thấy dữ liệu mới → đánh mất năng lực tổng quát cũ

**Sơ đồ Layer Freezing (cột phải):**
- Lớp đầu (đóng băng) — đặc trưng tổng quát, cấp thấp
- Lớp cuối (có thể học) — đặc trưng trừu tượng, đặc thù tác vụ

**Câu chốt (đóng khung):**
> Layer Freezing là hướng phát triển hợp lý cho tương lai — nằm ngoài phạm vi trọng tâm của đồ án hiện tại.

---

### 3. Lời thoại

> Điểm cuối cùng cần làm rõ về việc sử dụng CLIP trong hệ thống là quyết định không tinh chỉnh lại mô hình — sử dụng nguyên bản phiên bản đã huấn luyện sẵn.
>
> Quyết định này xuất phát từ việc cân nhắc hai rủi ro cụ thể nếu tinh chỉnh trên tập dữ liệu benchmark có quy mô nhỏ, khoảng một nghìn ảnh cho hai mươi danh tính. Rủi ro thứ nhất là hiện tượng quá khớp — capacity của CLIP lên tới hàng trăm triệu tham số, vượt xa rất nhiều so với lượng thông tin có trong một tập dữ liệu nhỏ như vậy, khiến nguy cơ mô hình học thuộc lòng những đặc điểm ngẫu nhiên của tập huấn luyện, thay vì học được một quy luật tổng quát, là rất cao. Rủi ro thứ hai là hiện tượng quên lãng thảm khốc — quá trình tinh chỉnh chỉ tiếp xúc với dữ liệu mới, không còn nhìn thấy lại bốn trăm triệu cặp dữ liệu gốc đã học trước đó, khiến mô hình có xu hướng dần đánh mất năng lực tổng quát hóa vốn là điểm mạnh cốt lõi khiến nhóm lựa chọn CLIP ngay từ đầu.
>
> Nhóm cũng đã tìm hiểu một phương án tinh chỉnh an toàn hơn, gọi là Layer Freezing — đóng băng các lớp đầu của mạng, vốn học các đặc trưng tổng quát và cấp thấp như cạnh hay màu sắc, chỉ cho phép cập nhật các lớp cuối, nơi học các đặc trưng trừu tượng và đặc thù cho từng tác vụ cụ thể. Kỹ thuật này về lý thuyết giảm nhẹ được cả hai rủi ro vừa nêu, vì phần lớn trọng số vẫn giữ nguyên giá trị đã huấn luyện, đồng thời capacity có thể thay đổi cũng giảm đi đáng kể.
>
> Tuy nhiên, nhóm quyết định không áp dụng kỹ thuật này trong phạm vi đồ án hiện tại, vì bản thân nó vẫn đòi hỏi thêm hạ tầng huấn luyện và một quy trình thực nghiệm riêng để xác định nên mở bao nhiêu lớp là hợp lý — một hướng nghiên cứu nằm ngoài trọng tâm của việc xây dựng và đánh giá một hệ thống truy hồi hoàn chỉnh. Đây là một hướng phát triển mà nhóm xác định rõ ràng là hợp lý và khả thi, nếu đồ án được mở rộng theo hướng cá nhân hóa mô hình trong tương lai.

---

## MỤC LỤC — Phần 1. CLIP

### Tổng cộng: 5 Mục La Mã, 5 slide

| Slide | Nội dung |
|---|---|
| I | Cơ chế học tương phản — Nền tảng của khả năng Zero-shot |
| II | Hai bộ mã hóa tách rời — Image Encoder và Text Encoder |
| III | Hàm mất mát InfoNCE — Công thức đầy đủ |
| IV | Hệ quả toán học tất yếu (Modality Gap, Vanishing Gradient, Curse of Dimensionality) |
| V | Fine-tuning — Vì sao không, và phương án an toàn hơn |

### Ghi chú tra cứu nhanh — "Nếu bị hỏi về..."

| Chủ đề bị hỏi | Mở slide |
|---|---|
| Zero-shot, contrastive learning, ma trận N×N | I |
| Dual-encoder vs Fusion-encoder, ViT, Transformer | II |
| Công thức InfoNCE, τ, softmax, cross-entropy | III |
| Modality Gap, τ nhỏ/vanishing gradient, Curse of Dimensionality | IV |
| Vì sao không fine-tune, Layer Freezing, Overfitting/Catastrophic Forgetting | V |

---