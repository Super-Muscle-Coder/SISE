# Phần 2 — HNSW

## Mục I. BÀI TOÁN GỐC VÀ VỊ TRÍ CỦA HNSW

### 1. Bố cục slide

- **Tiêu đề mục:** "I. Bài toán gốc và vị trí của HNSW" — cùng định dạng, cỡ chữ với các mục La Mã đã làm ở Slide phụ 1 (CLIP).
- **Phía trên, căn giữa:** Phát biểu bài toán k-NN gốc, ngắn gọn, cỡ chữ lớn.
- **Giữa slide, chia hai nhánh song song bằng mũi tên rẽ nhánh từ bài toán gốc:** một nhánh dẫn tới "Exact Search / Brute-force", một nhánh dẫn tới "ANN" — từ nhánh ANN tiếp tục rẽ ba thành bảng ba nhánh con (Tree/Hash/Graph-based), dòng Graph-based tô nổi bật.
- **Dưới bảng:** Một dòng ngắn định vị HNSW không phải mô hình học — phân biệt với CLIP.
- **Cuối slide:** Câu chốt đóng khung.

---

### 2. Nội dung chữ trên slide 

**Tiêu đề:** I. Bài toán gốc và vị trí của HNSW

**Phát biểu bài toán:**
> Bài toán k-NN: cho N vector đã biết, một truy vấn mới — tìm k vector gần nhất.

**Hai hướng giải:**
- Exact Search (Brute-force): đúng tuyệt đối, chi phí $O(N \times d)$
- ANN: đánh đổi một phần chính xác lấy tốc độ, qua chỉ mục xây trước

**Bảng ba nhánh ANN:**

| Nhánh | Đại diện | Đặc điểm |
|---|---|---|
| Tree-based | KD-tree | Suy biến mạnh ở chiều cao |
| Hash-based | LSH | Nhanh, Recall không cao |
| **Graph-based** | **HNSW** | **Recall cao, chi phí hợp lý** |

**Dòng định vị:**
> HNSW không phải mô hình học — là cấu trúc dữ liệu + thuật toán duyệt, khai thác không gian metric mà CLIP đã tạo ra.

**Câu chốt (đóng khung):**
> ANN đánh đổi độ chính xác tuyệt đối lấy tốc độ — HNSW là nhánh phù hợp nhất cho bài toán truy hồi ảnh của hệ thống.

---

### 3. Lời thoại

> Sau khi đã trình bày cách CLIP sinh ra vector đặc trưng, phần tiếp theo đi vào thuật toán mà hệ thống sử dụng để tìm kiếm trên chính những vector đó.
>
> Bài toán đặt ra là bài toán k lân cận gần nhất: cho một tập N vector đã biết trước, cùng một vector truy vấn mới, cần tìm ra k vector gần nhất với truy vấn đó. Có hai hướng để giải bài toán này. Hướng thứ nhất là tìm kiếm chính xác, hay còn gọi là brute-force — tính khoảng cách từ truy vấn tới toàn bộ N vector rồi sắp xếp, cho kết quả đúng tuyệt đối nhưng chi phí tăng tuyến tính theo cả số lượng dữ liệu lẫn số chiều không gian. Hướng thứ hai là tìm kiếm gần đúng, hay ANN, chấp nhận đánh đổi một phần độ chính xác tuyệt đối để đổi lấy tốc độ, thông qua việc xây dựng sẵn một cấu trúc chỉ mục.
>
> Trong hướng ANN, có ba nhánh thuật toán chính. Nhánh dựa trên cây hoạt động tốt ở không gian ít chiều nhưng suy biến mạnh khi số chiều tăng cao. Nhánh dựa trên băm cho tốc độ nhanh nhưng độ chính xác thường không cao. Và nhánh dựa trên đồ thị, nơi mỗi vector là một đỉnh, các vector gần nhau được nối bằng cạnh, đạt được độ chính xác cao nhất ở một chi phí hợp lý — đây chính là nhánh mà HNSW, thuật toán hệ thống đang sử dụng, thuộc về.
>
> Một điểm cần làm rõ ngay từ đầu: HNSW hoàn toàn không phải một mô hình học có tham số được huấn luyện qua quá trình tối ưu hóa như CLIP. Nó là một cấu trúc dữ liệu kết hợp với một thuật toán duyệt, được xây dựng trực tiếp trên các vector đã có sẵn. Nếu CLIP tạo ra một không gian biểu diễn có ý nghĩa ngữ nghĩa, thì HNSW khai thác hiệu quả chính không gian đó để tìm kiếm nhanh mà không cần duyệt qua toàn bộ dữ liệu.

---

## MỤC II. Ý TƯỞNG, CẤU TRÚC VÀ CƠ CHẾ HOẠT ĐỘNG CỦA HNSW

### SLIDE II.1 — Ý TƯỞNG KHỞI ĐẦU VÀ NHƯỢC ĐIỂM CỦA ĐỒ THỊ ĐƠN TẦNG

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (1/9)".
- **Trung tâm slide:** Sơ đồ đồ thị đơn tầng khái quát — 8-10 điểm rải rác, mỗi điểm nối với 2-3 hàng xóm gần nhất. Một điểm truy vấn tô đỏ ở góc xa, chuỗi mũi tên minh họa đường đi greedy từ xuất phát tới đích.
- **Bên cạnh sơ đồ:** Đếm số bước di chuyển trên đường đi minh họa.
- **Dưới sơ đồ:** Dòng chú thích nêu nhược điểm.
- **Cuối slide:** Dòng ghi chú nhỏ: *"Đây là sơ đồ minh họa khái quát — phần demo cụ thể với bộ dữ liệu thật sẽ trình bày từ Slide II.3."*
- **Cuối cùng:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (1/9)

**Ý tưởng khởi đầu:**
> Mỗi điểm nối với vài hàng xóm gần nhất. Tìm kiếm bằng cách di chuyển dần về phía truy vấn — Greedy Search.

**Chú thích trên sơ đồ:**
- Điểm xuất phát → di chuyển qua từng hàng xóm gần hơn → điểm đích
- Mỗi bước chỉ nhích được một khoảng ngắn

**Dòng nhược điểm:**
> Chỉ có kết nối cục bộ → cần nhiều bước để đi hết một không gian lớn.

**Ghi chú:**
> Sơ đồ trên mang tính khái quát. Demo cụ thể với bộ dữ liệu thật được trình bày từ Slide II.3.

**Câu chốt (đóng khung):**
> Đồ thị đơn tầng hoạt động đúng nhưng chậm ở quy mô lớn — cần một cơ chế "đường tắt".

### 3. Lời thoại

> Để hiểu rõ cấu trúc mà HNSW sử dụng, nhóm xin trình bày từ chính ý tưởng khởi đầu, trước khi đi tới hình dạng hoàn chỉnh của thuật toán.
>
> Ý tưởng cơ bản nhất là xây dựng một đồ thị, trong đó mỗi điểm dữ liệu chỉ nối với một số ít hàng xóm gần nhất của nó — không nối với toàn bộ các điểm khác, vì làm vậy sẽ quay lại đúng chi phí của brute-force. Việc tìm kiếm được thực hiện bằng một chiến lược gọi là Greedy Search: bắt đầu từ một điểm bất kỳ, ở mỗi bước, di chuyển tới hàng xóm nào gần điểm truy vấn nhất, lặp lại cho tới khi không còn hàng xóm nào gần hơn vị trí hiện tại.
>
> Tuy nhiên, cấu trúc đơn tầng này bộc lộ một nhược điểm rõ ràng. Vì mỗi cạnh chỉ nối những điểm gần nhau về mặt cục bộ, mỗi bước di chuyển chỉ nhích được một khoảng cách rất nhỏ. Nếu điểm truy vấn nằm cách xa điểm xuất phát, cần rất nhiều bước liên tiếp mới có thể tới nơi — điều này khiến tốc độ tìm kiếm không đạt được lợi ích đáng kể so với việc duyệt toàn bộ dữ liệu, đặc biệt khi quy mô dữ liệu tăng lên.
>
> Sơ đồ vừa trình bày chỉ mang tính khái quát, minh họa nguyên lý chung. Ngay sau đây, nhóm sẽ trình bày một demo cụ thể, chạy tay từng bước trên một bộ dữ liệu thật gồm mười hai điểm, để thấy rõ cơ chế này hoạt động chính xác ra sao trong thực tế.
>
> Đây chính là động lực để phát triển thêm một cơ chế mới, giúp việc di chuyển giữa các vùng xa nhau trong không gian dữ liệu trở nên nhanh hơn nhiều — nội dung này sẽ được trình bày ở phần tiếp theo.

---

### SLIDE II.2 — GIẢI PHÁP PHÂN TẦNG VÀ MÃ GIẢ

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (2/9)".
- **Trên cùng, dải ngang:** Bảng chú thích 3 tham số — tên + vai trò 1 câu (phân tích sâu để dành Mục III).
- **Giữa slide, bên trái:** Sơ đồ đồ thị phân tầng khái quát — 3 tầng chồng lên nhau, tầng trên rất thưa, tầng đáy dày đặc, đường nét đứt nối các phiên bản cùng một điểm giữa các tầng.
- **Giữa slide, bên phải:** Khối mã giả, phông monospace.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (2/9)

**Bảng chú thích 3 tham số:**

| Tham số | Vai trò |
|---|---|
| M | Số kết nối tối đa mỗi điểm |
| ef_construction | Độ kỹ lưỡng khi xây dựng |
| ef_search | Độ rộng tìm kiếm khi truy vấn |

**Chú thích sơ đồ phân tầng:**
- Tầng trên: rất thưa — đường tắt nhảy xa
- Tầng đáy (Layer 0): đầy đủ mọi điểm

**Mã giả:**
```
TÌM_KIẾM(truy_vấn):
  vị_trí ← entry_point (điểm ở tầng cao nhất)
  
  LẶP từ tầng cao nhất xuống tầng 1:
      vị_trí ← GREEDY(vị_trí, truy_vấn, tầng_hiện_tại)
  
  TẠI Layer 0:
      kết_quả ← BEAM_SEARCH(vị_trí, truy_vấn, ef_search)
  
  TRẢ VỀ kết_quả
```

**Câu chốt (đóng khung):**
> Phân tầng biến việc "đi bộ từng bước" thành "nhảy xa rồi tinh chỉnh dần" — giảm mạnh số bước cần thiết.

### 3. Lời thoại

> Trước khi trình bày giải pháp, nhóm xin giới thiệu nhanh ba tham số cấu hình sẽ xuất hiện xuyên suốt phần còn lại — M quy định số lượng kết nối tối đa mà mỗi điểm được phép có, ef_construction quy định độ kỹ lưỡng khi tìm hàng xóm lúc xây dựng đồ thị, và ef_search quy định độ rộng tìm kiếm khi thực hiện truy vấn. Ý nghĩa chi tiết và ảnh hưởng cụ thể của từng tham số, nhóm xin trình bày kỹ hơn ở một mục riêng ngay sau Mục này.
>
> Giải pháp cho nhược điểm vừa nêu là bổ sung thêm cấu trúc phân tầng — nhiều tầng đồ thị chồng lên nhau. Tầng trên cùng rất thưa, chỉ chứa một số ít điểm, với các kết nối có xu hướng vươn xa hơn, đóng vai trò như một đường tắt. Càng xuống các tầng dưới, mật độ điểm càng dày đặc hơn, cho tới tầng đáy cùng, gọi là Layer 0, chứa toàn bộ dữ liệu.
>
> Quy trình tìm kiếm diễn ra như sau: bắt đầu từ một điểm cố định ở tầng cao nhất, gọi là entry point. Tại mỗi tầng phía trên Layer 0, thuật toán áp dụng Greedy Search thuần túy — di chuyển dứt khoát theo đúng một hướng tốt nhất mỗi bước, tận dụng các kết nối nhảy xa để nhanh chóng tiếp cận đúng khu vực chứa kết quả. Khi đã xuống tới Layer 0, thuật toán chuyển sang một chiến lược mở rộng hơn, gọi là Beam Search, giữ lại đồng thời nhiều ứng viên tốt theo đúng độ rộng đã quy định bởi tham số ef_search, nhằm tinh chỉnh chính xác kết quả cuối cùng trước khi trả về.
>
> Cơ chế đi từ thô đến tinh này — nhảy xa trước, tinh chỉnh sau — chính là điều giúp HNSW giảm đáng kể số bước cần thiết so với việc chỉ dùng một đồ thị đơn tầng như đã trình bày ở phần trước. Toàn bộ mã giả này sẽ được minh họa cụ thể bằng dữ liệu thật ngay sau đây.

---

### SLIDE II.3 — CÔNG THỨC GÁN TẦNG, ÁP DỤNG CHO ĐẦY ĐỦ 12 ĐIỂM

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (3/9)".
- **Trên cùng:** Công thức gán tầng đầy đủ, kèm định nghĩa từng ký hiệu, cỡ chữ lớn, căn giữa.
- **Giữa slide:** Bảng đầy đủ 12 dòng, đủ 4 cột (Điểm, Cụm, r, phép tính $-\ln(r) \times \frac{1}{\ln M}$, Tầng kết quả) — không rút gọn cột nào.
- **Cuối slide:** Câu chốt.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (3/9)

**Công thức đầy đủ:**
$$\text{tầng} = \left\lfloor -\ln(r) \times \frac{1}{\ln M} \right\rfloor \quad, \quad r \sim \text{Uniform}(0,1)$$

**Định nghĩa ký hiệu:**
- $r$: số thực ngẫu nhiên, sinh đều trong khoảng (0, 1)
- $M$: tham số cấu hình, ở đây $M = 4$
- $\frac{1}{\ln M} = \frac{1}{\ln 4} \approx 0.7213$ — hằng số chuẩn hóa, cố định cho toàn bộ quá trình build

**Bảng gán tầng đầy đủ, cả 12 điểm:**

| Điểm | Cụm | $r$ | $-\ln(r)$ | $-\ln(r) \times 0.7213$ | Tầng (làm tròn xuống) |
|---|---|---|---|---|---|
| 0 | A | 0.6394 | 0.4472 | 0.3226 | **0** |
| 1 | A | 0.0250 | 3.6884 | 2.6604 | **2** |
| 2 | A | 0.2750 | 1.2909 | 0.9313 | **0** |
| 3 | B | 0.2232 | 1.4996 | 1.0817 | **1** |
| 4 | B | 0.7365 | 0.3059 | 0.2207 | **0** |
| 5 | B | 0.6767 | 0.3905 | 0.2817 | **0** |
| 6 | C | 0.8922 | 0.1141 | 0.0823 | **0** |
| 7 | C | 0.0869 | 2.4426 | 1.7622 | **1** |
| 8 | C | 0.4219 | 0.8629 | 0.6225 | **0** |
| 9 | D | 0.0298 | 3.5133 | 2.5343 | **2** |
| 10 | D | 0.2186 | 1.5203 | 1.0967 | **1** |
| 11 | D | 0.5054 | 0.6825 | 0.4924 | **0** |

**Câu chốt (đóng khung):**
> Chỉ điểm 1 và điểm 9 có giá trị $r$ đủ nhỏ để vượt ngưỡng lên tầng 2 — hoàn toàn ngẫu nhiên, không do vị trí hay ý nghĩa dữ liệu.

### 3. Lời thoại

> Bước đầu tiên khi chèn một điểm vào đồ thị là gán ngẫu nhiên cho nó một tầng cao nhất mà nó sẽ xuất hiện. Công thức được sử dụng là lấy giá trị âm của logarit tự nhiên một số ngẫu nhiên phân bố đều trong khoảng từ không tới một, sau đó nhân với nghịch đảo logarit tự nhiên của tham số M, rồi làm tròn xuống thành số nguyên. Với M bằng bốn, hệ số nhân cố định này xấp xỉ 0.7213.
>
> Áp dụng công thức này lần lượt cho toàn bộ mười hai điểm của bộ dữ liệu demo, nhóm thu được bảng kết quả đầy đủ như trên, với từng bước tính toán trung gian được trình bày tường minh. Có thể thấy phần lớn các điểm nhận giá trị r tương đối lớn, dẫn tới kết quả sau khi nhân với hệ số 0.7213 nhỏ hơn một, nên bị làm tròn xuống bằng không — đây là trường hợp phổ biến nhất, đúng với tính chất phân phối giảm dần theo cấp số nhân của công thức này.
>
> Chỉ có đúng ba điểm — điểm ba, điểm bảy, và điểm mười — có giá trị đủ lớn để vượt ngưỡng, rơi vào tầng một. Và đặc biệt hiếm hơn nữa, chỉ có đúng hai điểm — điểm một và điểm chín — nhận được giá trị r cực kỳ nhỏ, khiến giá trị sau tính toán vượt ngưỡng hai, được gán lên tầng cao nhất. Đây thuần túy là kết quả của phép gán xác suất diễn ra một cách độc lập cho từng điểm, không liên quan gì tới vị trí hay tầm quan trọng ngữ nghĩa của các điểm này trong không gian dữ liệu.

---

### SLIDE II.4 — CHÈN CÁC ĐIỂM ĐẦU TIÊN: ĐIỂM 0, ĐIỂM 1, ĐIỂM 2

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (4/9)".
- **Ba khối dọc**, mỗi khối là log đầy đủ, nguyên văn của đúng 1 điểm được chèn, phông monospace, không rút gọn bất kỳ dòng nào.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (4/9)

```
--- Chèn điểm 0 (cụm A), tầng gán = 0 ---
Đồ thị rỗng -> điểm 0 trở thành entry_point, max_layer = 0

--- Chèn điểm 1 (cụm A), tầng gán = 2 ---
Bắt đầu từ entry_point = 0, max_layer hiện tại = 0
[Beam ef_construction=6, tầng 0] ứng viên: [(0.283, điểm 0)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 1 với [điểm 0]
Tầng 2 > max_layer cũ (0)
    -> entry_point đổi từ điểm 0 sang điểm 1, max_layer = 2

--- Chèn điểm 2 (cụm A), tầng gán = 0 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Greedy, tầng 1] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Beam ef_construction=6, tầng 0] ứng viên: [(0.316, điểm 0), (0.583, điểm 1)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 2 với [điểm 0, điểm 1]
```

**Câu chốt (đóng khung):**
> Ngay sau điểm thứ hai được chèn, entry_point đã đổi chủ — vì điểm 1 nhận tầng cao hơn hẳn điểm 0. Chỉ với 2 điểm, đồ thị đã có 2 tầng.

### 3. Lời thoại

> Quan sát chi tiết ba điểm đầu tiên được chèn vào đồ thị.
>
> Điểm đầu tiên, do đồ thị lúc này còn hoàn toàn trống, mặc nhiên trở thành điểm khởi đầu, gọi là entry point, ở đúng tầng nó được gán — tầng không.
>
> Khi chèn điểm thứ hai, quá trình bắt đầu từ entry point hiện tại. Vì điểm này được gán tầng hai — cao hơn hẳn tầng cao nhất hiện có của đồ thị lúc đó, vốn chỉ là tầng không — thuật toán bỏ qua bước greedy tìm kiếm ở các tầng trên, vì thực chất chưa có tầng nào cao hơn tồn tại để tìm kiếm. Thuật toán trực tiếp thực hiện tìm kiếm mở rộng tại tầng không, tìm ra điểm không là hàng xóm gần nhất, tiến hành nối cạnh. Ngay sau đó, vì tầng hai lớn hơn tầng cao nhất cũ, điểm này lập tức trở thành entry point mới của toàn bộ đồ thị, và tầng cao nhất của đồ thị được cập nhật thành hai.
>
> Khi chèn điểm thứ ba, được gán tầng thấp, quá trình bắt đầu từ entry point mới là điểm một. Thuật toán thực hiện greedy tuần tự qua tầng hai rồi tầng một — ở cả hai tầng này, vị trí không thay đổi, vẫn dừng tại điểm một, vì tại thời điểm này, điểm một chưa có hàng xóm nào khác để so sánh tại các tầng đó. Cuối cùng, tại tầng không, thuật toán tìm kiếm mở rộng và xác định được hai hàng xóm gần nhất là điểm không và điểm một, tiến hành nối cạnh với cả hai.
>
> Chỉ với ba điểm đầu tiên được chèn, có thể thấy rõ cấu trúc phân tầng đã bắt đầu hình thành, với entry point đã đổi chủ đúng một lần.

---

### SLIDE II.5 — CHÈN TIẾP CÁC ĐIỂM: ĐIỂM 3, ĐIỂM 4, ĐIỂM 5

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (5/9)".
- **Ba khối dọc, log đầy đủ nguyên văn** cho từng điểm — giữ đúng mức độ chi tiết như Slide II.4, không rút gọn.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (5/9)

```
--- Chèn điểm 3 (cụm B), tầng gán = 1 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Beam ef_construction=6, tầng 1] ứng viên: [(5.664, điểm 1)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 3 với [điểm 1]
[Beam ef_construction=6, tầng 0] ứng viên: [(5.523, điểm 2), (5.657, điểm 0), (5.664, điểm 1)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 3 với [điểm 2, điểm 0, điểm 1]

--- Chèn điểm 4 (cụm B), tầng gán = 0 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Greedy, tầng 1] điểm 1 -> đường đi [1, 3] -> dừng tại điểm 3
[Beam ef_construction=6, tầng 0] ứng viên: [(0.361, điểm 3), (5.622, điểm 2), (5.728, điểm 1), (5.738, điểm 0)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 4 với [điểm 3, điểm 2, điểm 1, điểm 0]

--- Chèn điểm 5 (cụm B), tầng gán = 0 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Greedy, tầng 1] điểm 1 -> đường đi [1, 3] -> dừng tại điểm 3
[Beam ef_construction=6, tầng 0] ứng viên: [(0.283, điểm 3), (0.64, điểm 4), (5.515, điểm 2), (5.664, điểm 0), (5.685, điểm 1)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 5 với [điểm 3, điểm 4, điểm 2, điểm 0]
```

**Câu chốt (đóng khung):**
> Điểm 3 (cụm B, tầng 1) bắt đầu đóng vai trò trạm trung chuyển — quá trình greedy tại tầng 1 của các điểm chèn sau đều dừng tại đây.

### 3. Lời thoại

> Tiếp tục chèn ba điểm thuộc cụm B. Điểm thứ ba được gán tầng một — tầng trung gian. Quá trình chèn điểm này thực hiện greedy tại tầng hai trước, dừng tại điểm một do chưa có hàng xóm nào khác ở tầng đó để so sánh; sau đó tại chính tầng một, nơi điểm này sẽ xuất hiện, thuật toán tìm kiếm mở rộng và xác định điểm một là hàng xóm duy nhất khả dĩ tại thời điểm này, tiến hành nối cạnh; cuối cùng tại tầng không, tìm được ba hàng xóm gần nhất thuộc về đúng cụm A lân cận, vì tại thời điểm này chưa có điểm nào khác thuộc cụm B được chèn vào đồ thị.
>
> Khi chèn điểm thứ tư, cũng thuộc cụm B nhưng chỉ được gán tầng không, quá trình greedy tại tầng một lần này không còn dừng ở điểm một nữa, mà tiếp tục di chuyển sang điểm ba — vì điểm ba, vừa được chèn trước đó, nằm gần điểm mới hơn. Đây là lần đầu tiên xuất hiện một bước di chuyển thực sự trong quá trình greedy tại tầng trung gian, thay vì đứng yên như các bước trước.
>
> Điểm thứ năm, khi được chèn, cũng đi theo đúng con đường tương tự — greedy tại tầng một dừng tại điểm ba — và tại tầng không, lần này tìm được đúng điểm ba và điểm bốn, hai điểm cùng thuộc cụm B đã được chèn trước đó, làm hai trong số bốn hàng xóm gần nhất.

---

### SLIDE II.6 — CHÈN TIẾP CÁC ĐIỂM: ĐIỂM 6, ĐIỂM 7, ĐIỂM 8

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (6/9)".
- **Ba khối dọc, log đầy đủ nguyên văn**, giữ đúng mức độ chi tiết như 2 slide trước.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (6/9)

```
--- Chèn điểm 6 (cụm C), tầng gán = 0 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Greedy, tầng 1] điểm 1 -> đường đi [1, 3] -> dừng tại điểm 3
[Beam ef_construction=6, tầng 0] ứng viên: [(3.701, điểm 2), (3.805, điểm 5), (4.0, điểm 0),
                                             (4.0, điểm 3), (4.205, điểm 1), (4.305, điểm 4)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 6 với [điểm 2, điểm 5, điểm 0, điểm 3]

--- Chèn điểm 7 (cụm C), tầng gán = 1 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Beam ef_construction=6, tầng 1] ứng viên: [(3.712, điểm 3), (3.901, điểm 1)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 7 với [điểm 3, điểm 1]
[Beam ef_construction=6, tầng 0] ứng viên: [(0.424, điểm 6), (3.423, điểm 2), (3.536, điểm 5),
                                             (3.712, điểm 0), (3.712, điểm 3), (3.901, điểm 1)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 7 với [điểm 6, điểm 2, điểm 5, điểm 0]

--- Chèn điểm 8 (cụm C), tầng gán = 0 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
[Greedy, tầng 1] điểm 1 -> đường đi [1, 7] -> dừng tại điểm 7
[Beam ef_construction=6, tầng 0] ứng viên: [(0.361, điểm 6), (0.781, điểm 7), (4.001, điểm 2),
                                             (4.001, điểm 5), (4.211, điểm 3), (4.305, điểm 0)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 8 với [điểm 6, điểm 7, điểm 2, điểm 5]
```

**Câu chốt (đóng khung):**
> Điểm 7 (cụm C, tầng 1) xuất hiện — quá trình greedy tại tầng 1 của điểm 8 ngay sau đó lập tức chuyển hướng từ điểm 1 sang điểm 7, đúng hướng về cụm C.

### 3. Lời thoại

> Chèn điểm thứ sáu, thuộc cụm C nhưng chỉ được gán tầng không. Quá trình greedy tại tầng một vẫn dừng tại điểm ba, vì tại thời điểm này chưa có điểm nào khác thuộc cụm C xuất hiện ở tầng trung gian để dẫn đường tốt hơn. Do đó, dù điểm sáu thuộc cụm C, tầng không của nó vẫn phải tìm hàng xóm từ đúng các điểm đã có mặt, dẫn tới kết quả có phần lẫn cả các điểm từ cụm khác.
>
> Điểm thứ bảy, cũng thuộc cụm C, lần này được gán tầng một. Đây là điểm mấu chốt: giờ đây tầng một đã có một đại diện thực sự của cụm C. Ngay khi chèn điểm thứ tám ngay sau đó, cũng thuộc cụm C, quá trình greedy tại tầng một không còn dừng ở điểm ba như trước nữa, mà chuyển hướng, di chuyển sang điểm bảy — vì điểm bảy giờ đã gần điểm mới hơn. Kết quả là tại tầng không, điểm tám tìm được chính xác hai hàng xóm cùng cụm C là điểm sáu và điểm bảy, cùng với hai điểm khác. Đây chính là minh chứng trực tiếp cho việc mỗi khi một cụm mới có đại diện xuất hiện ở tầng trung gian, các điểm chèn sau đó thuộc cùng cụm sẽ được dẫn đường chính xác hơn hẳn.

---

### SLIDE II.7 — CHÈN TIẾP CÁC ĐIỂM: ĐIỂM 9, ĐIỂM 10, ĐIỂM 11

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (7/9)".
- **Ba khối dọc, log đầy đủ nguyên văn.** Đây là slide quan trọng nhất của toàn bộ chuỗi demo build — chứa khoảnh khắc "đường cao tốc liên cụm" hình thành.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (7/9)

```
--- Chèn điểm 9 (cụm D), tầng gán = 2 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Beam ef_construction=6, tầng 2] ứng viên: [(3.805, điểm 1)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 9 với [điểm 1]     *** ĐIỂM 9 <-> ĐIỂM 1, TẦNG 2 ***
[Beam ef_construction=6, tầng 1] ứng viên: [(3.805, điểm 1), (4.0, điểm 3), (5.233, điểm 7)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 9 với [điểm 1, điểm 3, điểm 7]
[Beam ef_construction=6, tầng 0] ứng viên: [(3.805, điểm 1), (3.812, điểm 4), (4.0, điểm 0),
                                             (4.0, điểm 3), (4.111, điểm 2), (4.205, điểm 5)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 9 với [điểm 1, điểm 4, điểm 0, điểm 3]

--- Chèn điểm 10 (cụm D), tầng gán = 1 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1, 9] -> dừng tại điểm 9    *** GREEDY CHUYỂN HƯỚNG SANG 9 ***
[Beam ef_construction=6, tầng 1] ứng viên: [(0.424, điểm 9), (3.536, điểm 1),
                                             (3.712, điểm 3), (4.808, điểm 7)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 10 với [điểm 9, điểm 1, điểm 3, điểm 7]
[Beam ef_construction=6, tầng 0] ứng viên: [(0.424, điểm 9), (3.536, điểm 1), (3.551, điểm 4),
                                             (3.712, điểm 0), (3.712, điểm 3), (3.8, điểm 2)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 10 với [điểm 9, điểm 1, điểm 4, điểm 0]

--- Chèn điểm 11 (cụm D), tầng gán = 0 ---
Bắt đầu từ entry_point = 1, max_layer hiện tại = 2
[Greedy, tầng 2] điểm 1 -> đường đi [1, 9] -> dừng tại điểm 9
[Greedy, tầng 1] điểm 9 -> đường đi [9] -> dừng tại điểm 9
[Beam ef_construction=6, tầng 0] ứng viên: [(0.283, điểm 9), (0.707, điểm 10), (4.0, điểm 1),
                                             (4.001, điểm 4), (4.205, điểm 0), (4.205, điểm 3)]
    -> chọn 4 hàng xóm gần nhất: nối điểm 11 với [điểm 9, điểm 10, điểm 1, điểm 4]
```

**Câu chốt (đóng khung):**
> Điểm 1 (cụm A) và điểm 9 (cụm D) — hai điểm ở hai góc xa nhất bản đồ — trở thành cặp duy nhất ở tầng cao nhất, nối trực tiếp với nhau. Đây chính là "đường cao tốc liên cụm".

### 3. Lời thoại

> Đây là khoảnh khắc quan trọng nhất trong toàn bộ quá trình xây dựng đồ thị. Khi chèn điểm số chín, thuộc cụm D nằm ở góc hoàn toàn đối diện với cụm A nơi điểm một đang đứng, nó cũng ngẫu nhiên được gán lên tầng cao nhất — tầng hai — đúng như đã thấy ở bảng gán tầng lúc trước. Vì tầng hai lúc này chỉ có duy nhất điểm một, quá trình tìm ứng viên ở tầng này chỉ tìm được đúng một lựa chọn, và điểm chín được nối trực tiếp với điểm một. Đây chính xác là khoảnh khắc hai điểm ở hai góc xa nhau nhất trong toàn bộ mặt phẳng dữ liệu trở thành hai điểm duy nhất ở tầng cao nhất, kết nối thẳng với nhau — một kết nối duy nhất nhưng bắc cầu được qua toàn bộ không gian dữ liệu.
>
> Hệ quả của sự kiện này thể hiện ngay lập tức ở bước tiếp theo. Khi chèn điểm thứ mười, quá trình greedy tại tầng hai không còn dừng ở điểm một như mọi lần trước nữa, mà lần đầu tiên di chuyển tiếp sang điểm chín — bởi vì điểm chín, vừa được kết nối, giờ đây gần điểm mới hơn điểm một. Đây là bằng chứng trực tiếp cho thấy đường cao tốc liên cụm vừa hình thành đã ngay lập tức phát huy tác dụng dẫn đường.
>
> Điểm thứ mười một, khi chèn vào, tiếp tục đi theo đúng con đường mới này — greedy tại tầng hai dừng ở điểm chín, rồi tại tầng một cũng dừng ngay tại điểm chín — trước khi tìm được đúng hai hàng xóm cùng cụm D ở tầng đáy.

---

### SLIDE II.8 — CẤU TRÚC HOÀN CHỈNH SAU KHI BUILD XONG TOÀN BỘ 12 ĐIỂM

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (8/9)".
- **Ba bảng đầy đủ**, mỗi bảng là danh sách kết nối chính xác của một tầng — liệt kê từng điểm và toàn bộ hàng xóm của nó, không rút gọn.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (8/9)

**Tầng 2 (2 điểm) — entry_point = điểm 1, max_layer = 2:**

| Điểm | Nối với |
|---|---|
| 1 ( A ) | 9 |
| 9 ( D ) | 1 |

**Tầng 1 (5 điểm):**

| Điểm | Nối với |
|---|---|
| 1 ( A ) | 3, 7, 9, 10 |
| 3 ( B ) | 1, 7, 9, 10 |
| 7 ( C ) | 1, 3, 9, 10 |
| 9 ( D ) | 1, 3, 7, 10 |
| 10 ( D ) | 1, 3, 7, 9 |

**Tầng 0 — Layer 0 (đầy đủ 12 điểm):**

| Điểm | Nối với |
|---|---|
| 0 ( A ) | 1, 2, 7, 10 |
| 1 ( A ) | 0, 2, 9, 10 |
| 2 ( A ) | 0, 1, 6, 7 |
| 3 ( B ) | 4, 5, 6, 9 |
| 4 ( B ) | 3, 5, 9, 10 |
| 5 ( B ) | 3, 4, 6, 7 |
| 6 ( C ) | 2, 5, 7, 8 |
| 7 ( C ) | 2, 5, 6, 8 |
| 8 ( C ) | 2, 5, 6, 7 |
| 9 ( D ) | 1, 4, 10, 11 |
| 10 ( D ) | 1, 4, 9, 11 |
| 11 ( D ) | 1, 4, 9, 10 |

**Câu chốt (đóng khung):**
> Số điểm giảm theo cấp số nhân khi lên tầng cao: 12 → 5 → 2 — đúng khớp lý thuyết đã trình bày ở Slide II.2.

### 3. Lời thoại

> Sau khi hoàn tất chèn toàn bộ mười hai điểm, đây là cấu trúc kết nối đầy đủ, chính xác của cả ba tầng.
>
> Tầng đáy chứa đầy đủ toàn bộ mười hai điểm, mỗi điểm đúng bốn kết nối, và có thể thấy rõ các kết nối này gần như hoàn toàn nằm trong cùng một cụm — ngoại trừ một vài trường hợp đặc biệt như điểm không nối với điểm bảy và điểm mười, phản ánh đúng những gì đã quan sát trong quá trình chèn từng bước.
>
> Tầng trung gian chỉ còn năm điểm. Điều đáng chú ý nhất, và đây không phải sự trùng hợp ngẫu nhiên mà là hệ quả tự nhiên của cách xác suất phân bổ đều: gần như mỗi cụm dữ liệu đều có ít nhất một đại diện ở tầng này — điểm một đại diện cụm A, điểm ba đại diện cụm B, điểm bảy đại diện cụm C, và cả điểm chín lẫn điểm mười cùng đại diện cụm D.
>
> Tầng cao nhất chỉ còn vỏn vẹn hai điểm, đúng là điểm một và điểm chín — hai điểm đã đóng vai trò đường cao tốc liên cụm được trình bày ở slide trước. Số lượng điểm giảm dần theo đúng cấp số nhân khi lên các tầng cao hơn — từ mười hai, xuống năm, xuống hai — khớp chính xác với những gì lý thuyết phân tầng đã dự đoán.

---

### SLIDE II.9 — TRỰC QUAN HÓA: HAI ĐỒ THỊ 2D VÀ 3D

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (9/11)" *(lưu ý: tổng số slide con của Mục II giờ là 11, không phải 9, vì đã tách thêm II.5, II.6, II.7 riêng biệt thay vì gộp — xem ghi chú tổng kết cuối tài liệu)*.
- **Chia đôi diện tích:** trái là `hnsw_layers_final.png` (3 lát cắt 2D theo từng tầng), phải là `hnsw_3d_final.png` (góc nhìn 3D tổng thể, đường nét đứt nối điểm 1 và điểm 9 xuyên suốt các tầng).
- Không cần text nào khác ngoài tiêu đề.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (9/11)

*(Chỉ có 2 hình, không có text bổ sung nào khác trên slide)*

### 3. Lời thoại

> Để hình dung trực quan hơn toàn bộ những gì vừa trình bày bằng số liệu, đây là hình ảnh thực tế của đồ thị vừa xây dựng.
>
> Bên trái là ba lát cắt riêng biệt theo từng tầng, vẽ đúng theo bảng kết nối vừa trình bày — có thể thấy rõ tầng đáy dày đặc kết nối cục bộ trong từng cụm màu riêng biệt, tầng giữa thưa hơn với các đường nối bắt đầu vươn dài hơn, và tầng cao nhất chỉ còn đúng một đường kết nối duy nhất, bắc cầu qua hai cụm ở hai góc xa nhau nhất của mặt phẳng.
>
> Bên phải là góc nhìn ba chiều tổng thể của cùng cấu trúc đó, với các đường nét đứt thẳng đứng thể hiện rõ việc cùng một điểm dữ liệu — cụ thể là điểm một và điểm chín — xuất hiện xuyên suốt từ tầng đáy lên tận tầng cao nhất, đóng vai trò những trạm trung chuyển chính của toàn bộ cấu trúc đồ thị.

---

### SLIDE II.10 — DEMO TÌM KIẾM TRÊN ĐỒ THỊ ĐÃ XÂY, TỪNG BƯỚC

### 1. Bố cục slide

- **Tiêu đề:** "II. Ý tưởng, cấu trúc và cơ chế hoạt động (10/11)".
- **Trên cùng:** Tọa độ điểm truy vấn, cỡ chữ lớn.
- **Giữa slide:** Log đầy đủ, nguyên văn từng bước tìm kiếm — greedy qua 2 tầng trên, rồi beam search ở Layer 0 với 2 mức ef_search để đối chiếu, phông monospace.
- **Cuối slide:** Câu chốt.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Ý tưởng, cấu trúc và cơ chế hoạt động (10/11)

**Truy vấn:** $[1.1,\ 4.9]$ — tọa độ nằm rất gần cụm C (các điểm 6, 7, 8)

```
Bắt đầu: entry_point = điểm 1, max_layer = 2

[Greedy, tầng 2] điểm 1 -> đường đi [1] -> dừng tại điểm 1
  (điểm 1 vẫn là lựa chọn tốt nhất trong các hàng xóm của chính nó ở tầng 2)

[Greedy, tầng 1] điểm 1 -> đường đi [1, 7] -> dừng tại điểm 7
  (di chuyển từ điểm 1 sang điểm 7 — đúng hướng về phía cụm C)

--- Tại Layer 0, thử với 2 mức ef_search khác nhau ---

[Beam ef_search=2, Layer 0] xuất phát từ điểm 7:
    Kết quả: [(0.141, điểm 6), (0.283, điểm 7)]
    => CHỈ 2 KẾT QUẢ — THIẾU MẤT ĐIỂM 8 (cùng cụm C)

[Beam ef_search=8, Layer 0] xuất phát từ điểm 7:
    Kết quả: [(0.141, điểm 6), (0.283, điểm 7), (0.5, điểm 8),
              (3.606, điểm 2), (3.712, điểm 5), (3.901, điểm 3),
              (3.901, điểm 0), (4.101, điểm 1)]
    => ĐỦ CẢ 3 ĐIỂM CỤM C (6, 7, 8) NẰM Ở 3 VỊ TRÍ ĐẦU
```

**Câu chốt (đóng khung):**
> Với ef_search=2: thiếu điểm 8. Với ef_search=8: đủ cả 3 điểm cụm C. ef_search nhỏ có nguy cơ dừng quá sớm, bỏ sót kết quả đúng nằm ngay gần đó.

### 3. Lời thoại

> Để hoàn tất phần minh họa cơ chế, nhóm thực hiện một truy vấn thử trên chính đồ thị vừa xây dựng hoàn chỉnh, tại một tọa độ được chọn cố ý nằm rất gần ba điểm thuộc cụm C.
>
> Quá trình bắt đầu từ điểm khởi đầu ở tầng cao nhất, chính là điểm một. Thực hiện greedy tại tầng hai, thuật toán giữ nguyên vị trí tại điểm một, vì trong số các hàng xóm của chính nó ở tầng này — chỉ có duy nhất điểm chín — điểm một vẫn là lựa chọn gần truy vấn hơn. Tại tầng một, greedy lần này thực sự di chuyển, chuyển từ điểm một sang điểm bảy — đúng là điểm đại diện của cụm C ở tầng trung gian, đã hình thành từ quá trình build trước đó.
>
> Tại tầng đáy, nhóm thực hiện thử nghiệm với hai độ rộng tìm kiếm khác nhau để minh họa rõ sự khác biệt mà tham số ef_search tạo ra. Với độ rộng bằng hai, quá trình tìm kiếm chỉ khám phá được đúng hai ứng viên trước khi dừng lại, trả về hai điểm — bỏ sót mất điểm thứ ba của cụm C, dù nó nằm ngay gần đó. Với độ rộng bằng tám, quá trình tìm kiếm mở rộng đủ nhiều ứng viên hơn, và lần này trả về đầy đủ cả ba điểm thuộc đúng cụm C ở ba vị trí có khoảng cách gần nhất.
>
> Đây chính là minh chứng thực nghiệm, chạy tay được, cho vai trò cốt lõi của tham số ef_search: độ rộng tìm kiếm quá hẹp có nguy cơ dừng lại quá sớm, bỏ sót kết quả đúng dù nó nằm ngay trong tầm với. Nội dung phân tích đầy đủ về cả ba tham số cấu hình — bao gồm cả ef_search vừa thấy tác động trực tiếp ở đây — nhóm xin trình bày kỹ càng ở Mục La Mã tiếp theo.

---

## MỤC III. BA THAM SỐ: M, ef_construction, ef_search

### SLIDE III.1 — THAM SỐ M: SỐ KẾT NỐI TỐI ĐA MỖI ĐIỂM

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Ba tham số M, ef_construction, ef_search (1/4)".
- **Trên cùng:** Định nghĩa chính thức của M, kèm cấu hình thật SISE đang dùng.
- **Giữa slide, trái:** Sơ đồ minh họa — 1 điểm với M=2 (chỉ 2 cạnh) so với cùng điểm đó với M=6 (6 cạnh), để thấy trực quan sự khác biệt về "độ dày" đồ thị.
- **Giữa slide, phải:** Bảng đánh đổi khi tăng/giảm M.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Ba tham số M, ef_construction, ef_search (1/4)

**Định nghĩa:**
> M — số cạnh (kết nối) tối đa mà mỗi điểm được phép giữ, tại mỗi tầng. Cố định ngay sau khi build, không đổi khi truy vấn.

**Cấu hình SISE đang dùng:** $M = 16$

**Bảng đánh đổi:**

| Hướng thay đổi | Tác động |
|---|---|
| Tăng M | Đồ thị dày hơn → Recall tăng, nhưng bộ nhớ tăng và build chậm hơn |
| Giảm M | Đồ thị thưa hơn → build nhanh hơn, tốn ít bộ nhớ hơn, nhưng Recall giảm |

**Câu chốt (đóng khung):**
> M cố định sau khi build — không thể "chỉnh nóng" như ef_search. Muốn đổi M phải build lại toàn bộ chỉ mục từ đầu.

### 3. Lời thoại

> Tham số đầu tiên cần phân tích sâu là M — quy định số lượng cạnh kết nối tối đa mà mỗi điểm được phép giữ, tại mỗi tầng trong đồ thị. Đây là tham số quyết định trực tiếp tới mật độ kết nối, hay nói cách khác, "độ dày" của toàn bộ cấu trúc đồ thị. Trong bộ dữ liệu demo mười hai điểm đã trình bày, nhóm sử dụng M bằng bốn; nhưng trong cấu hình chính thức của hệ thống, tham số này được đặt bằng mười sáu.
>
> Nếu tăng M lên, mỗi điểm sẽ có nhiều hàng xóm hơn để lựa chọn khi tìm kiếm, giúp giảm nguy cơ mắc kẹt ở một cực tiểu địa phương và do đó cải thiện Recall — tỉ lệ tìm đúng kết quả. Tuy nhiên, cái giá phải trả là bộ nhớ tiêu tốn nhiều hơn, vì phải lưu trữ nhiều cạnh hơn cho mỗi điểm, và quá trình xây dựng đồ thị cũng chậm hơn, vì mỗi lần chèn điểm mới cần xem xét nhiều ứng viên hơn để quyết định giữ lại cạnh nào.
>
> Một điểm quan trọng cần lưu ý: M là tham số duy nhất trong ba tham số được cố định ngay tại thời điểm xây dựng chỉ mục, và không thể thay đổi khi hệ thống đang chạy. Muốn điều chỉnh lại M, bắt buộc phải xây dựng lại toàn bộ chỉ mục từ đầu — khác hẳn với ef_search, có thể điều chỉnh linh hoạt ngay tại từng lượt truy vấn mà không cần động chạm gì tới cấu trúc đồ thị đã có.

---

### SLIDE III.2 — THAM SỐ ef_construction: ĐỘ KỸ LƯỠNG KHI XÂY DỰNG

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Ba tham số M, ef_construction, ef_search (2/4)".
- **Trên cùng:** Định nghĩa chính thức, kèm cấu hình thật.
- **Giữa slide:** Sơ đồ minh họa quy trình — khi chèn 1 điểm mới, ef_construction quyết định "xem xét bao nhiêu ứng viên" trước khi chọn ra đúng M hàng xóm tốt nhất. Vẽ minh họa: 1 điểm mới, một vòng tròn "vùng khảo sát" với bán kính tương ứng độ rộng ef_construction, bên trong có nhiều điểm ứng viên, chỉ có đúng M điểm (tô đậm) được chọn giữ lại.
- **Cuối slide:** Bảng đánh đổi + câu chốt.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Ba tham số M, ef_construction, ef_search (2/4)

**Định nghĩa:**
> ef_construction — kích thước danh sách ứng viên tạm thời được xem xét khi tìm hàng xóm, chỉ áp dụng lúc xây dựng/chèn điểm mới vào chỉ mục. Không ảnh hưởng gì tới tốc độ truy vấn sau này.

**Cấu hình SISE đang dùng:** $ef\_construction = 200$

**Bảng đánh đổi:**

| Hướng thay đổi | Tác động |
|---|---|
| Tăng ef_construction | Đồ thị build ra chất lượng tốt hơn (chọn được hàng xóm chuẩn hơn trong M lựa chọn cuối) → build chậm hơn, KHÔNG ảnh hưởng tốc độ truy vấn |
| Giảm ef_construction | Build nhanh hơn, nhưng chất lượng đồ thị (chọn hàng xóm) có thể kém chính xác hơn |

**Câu chốt (đóng khung):**
> ef_construction chỉ tốn chi phí đúng MỘT LẦN lúc build — không lặp lại mỗi lần truy vấn. Đây là lý do có thể đặt giá trị cao (200) mà không lo ảnh hưởng tốc độ tìm kiếm hàng ngày.

### 3. Lời thoại

> Tham số thứ hai là ef_construction, quy định kích thước của danh sách ứng viên tạm thời được xem xét trong quá trình tìm hàng xóm, nhưng chỉ áp dụng đúng một lần duy nhất — tại thời điểm xây dựng chỉ mục hoặc chèn thêm một điểm mới vào chỉ mục đã có. Trong demo mười hai điểm, nhóm sử dụng giá trị sáu; trong cấu hình chính thức của hệ thống, giá trị này được đặt là hai trăm.
>
> Cơ chế hoạt động cụ thể: khi chèn một điểm mới, thuật toán không chỉ tìm đúng M hàng xóm gần nhất một cách vội vàng, mà trước tiên mở rộng khảo sát một danh sách ứng viên lớn hơn nhiều, có kích thước bằng ef_construction, rồi mới chọn lọc ra đúng M ứng viên tốt nhất trong số đó để thực sự nối cạnh. Khảo sát càng rộng, khả năng tìm được đúng những hàng xóm thực sự tối ưu càng cao, thay vì chấp nhận những lựa chọn đầu tiên tìm thấy mà chưa chắc đã tốt nhất.
>
> Điểm mấu chốt cần nhấn mạnh, và đây chính là lý do giải thích tại sao hệ thống có thể đặt giá trị này khá cao mà không lo ngại: ef_construction chỉ phát sinh chi phí đúng một lần, vào thời điểm xây dựng. Nó hoàn toàn không ảnh hưởng tới tốc độ của mỗi lượt truy vấn sau này, vì tại thời điểm truy vấn, đồ thị đã được xây dựng xong và cố định. Đây là điểm khác biệt căn bản so với tham số thứ ba sẽ trình bày ngay sau đây.

---

### SLIDE III.3 — THAM SỐ ef_search: ĐỘ RỘNG TÌM KIẾM LÚC TRUY VẤN

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Ba tham số M, ef_construction, ef_search (3/4)".
- **Trên cùng:** Định nghĩa, kèm cấu hình thật.
- **Giữa slide:** Tái sử dụng đúng kết quả demo tìm kiếm đã có ở Slide II.10 (ef_search=2 vs ef_search=8) — dẫn lại làm bằng chứng trực tiếp, không lặp lại toàn bộ log, chỉ trích đúng kết quả cuối cùng để đối chiếu.
- **Cuối slide:** Bảng đánh đổi + câu chốt.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Ba tham số M, ef_construction, ef_search (3/4)

**Định nghĩa:**
> ef_search — kích thước danh sách ứng viên tạm thời khi tìm kiếm lúc truy vấn, chỉ áp dụng tại Layer 0 (tầng đáy). Có thể điều chỉnh linh hoạt cho từng lượt truy vấn, không cần xây lại chỉ mục.

**Cấu hình SISE đang dùng:** $ef\_search = 64$

**Nhắc lại bằng chứng đã thấy ở Slide II.10 (demo 12 điểm):**

| ef_search | Kết quả tìm được (truy vấn gần cụm C) |
|---|---|
| 2 | Chỉ 2/3 điểm cụm C — thiếu điểm 8 |
| 8 | Đủ cả 3/3 điểm cụm C |

**Bảng đánh đổi:**

| Hướng thay đổi | Tác động |
|---|---|
| Tăng ef_search | Recall tăng (giảm nguy cơ dừng quá sớm) → độ trễ mỗi truy vấn tăng theo |
| Giảm ef_search | Truy vấn nhanh hơn, nhưng nguy cơ bỏ sót kết quả đúng tăng lên |

**Câu chốt (đóng khung):**
> ef_search là tham số DUY NHẤT ảnh hưởng trực tiếp tới trải nghiệm mỗi lượt tìm kiếm — có thể chỉnh runtime, không cần build lại chỉ mục.

### 3. Lời thoại

> Tham số thứ ba, và cũng là tham số quan trọng nhất xét theo góc độ vận hành hàng ngày, là ef_search — quy định kích thước danh sách ứng viên tạm thời khi thực hiện tìm kiếm, chỉ áp dụng tại tầng đáy cùng, Layer 0. Khác hẳn với M và ef_construction, tham số này có thể điều chỉnh linh hoạt ngay tại từng lượt truy vấn cụ thể, hoàn toàn không cần xây dựng lại chỉ mục.
>
> Nhóm đã chứng minh trực tiếp tác động của tham số này ngay trong phần demo trước đó. Với cùng một truy vấn, cùng một đồ thị đã xây dựng, chỉ thay đổi độ rộng tìm kiếm từ hai lên tám, kết quả trả về đã thay đổi từ thiếu mất một điểm đúng, sang tìm được đầy đủ cả ba điểm thuộc đúng cụm cần tìm. Đây là bằng chứng thực nghiệm chạy tay được, minh họa trực tiếp cho quy luật lý thuyết: độ rộng tìm kiếm càng lớn, khả năng tìm đúng kết quả càng cao, nhưng đổi lại chi phí tính toán và độ trễ của mỗi lượt truy vấn cũng tăng theo.
>
> Trong cấu hình chính thức, hệ thống sử dụng giá trị sáu mươi tư cho tham số này — một con số không phải chọn tùy ý, mà có cơ sở thực nghiệm cụ thể, sẽ được trình bày chi tiết ở Mục La Mã kế tiếp khi phân tích kết quả thực nghiệm đầy đủ.

---

### SLIDE III.4 — TỔNG HỢP: SO SÁNH BA THAM SỐ VÀ CÚ PHÁP TRIỂN KHAI THẬT

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Ba tham số M, ef_construction, ef_search (4/4)".
- **Trên cùng:** Bảng tổng hợp so sánh cả 3 tham số cùng lúc, đầy đủ mọi khía cạnh — đây là bảng "chốt hạ" của toàn Mục III.
- **Giữa slide:** Đoạn cú pháp SQL thật, nguyên văn, dùng để tạo chỉ mục trong pgvector — chứng minh đây không phải lý thuyết suông mà đã triển khai thật.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Ba tham số M, ef_construction, ef_search (4/4)

**Bảng tổng hợp so sánh đầy đủ:**

| Tiêu chí | M | ef_construction | ef_search |
|---|---|---|---|
| Giá trị SISE đang dùng | 16 | 200 | 64 |
| Thời điểm phát huy tác dụng | Cấu trúc đồ thị (cố định sau build) | Chỉ lúc build/chèn điểm | Mỗi lượt truy vấn |
| Có thể chỉnh runtime không? | Không — phải build lại | Không — phải build lại | **Có** — chỉnh ngay lập tức |
| Tăng lên → | Recall ↑, bộ nhớ ↑, build chậm | Chất lượng đồ thị ↑, build chậm | Recall ↑, độ trễ truy vấn ↑ |
| Ảnh hưởng tốc độ truy vấn hàng ngày? | Gián tiếp (qua độ dày đồ thị) | Không | **Trực tiếp** |

**Cú pháp SQL thật, dùng để tạo chỉ mục trong hệ thống:**
```sql
CREATE INDEX IF NOT EXISTS idx_images_embedding_hnsw 
ON images USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 200);
```

**Câu chốt (đóng khung):**
> M và ef_construction định hình đồ thị lúc build, cố định về sau. ef_search là "núm vặn" duy nhất còn điều chỉnh được sau khi hệ thống đã chạy — chính vì vậy, cơ sở lựa chọn giá trị 64 cho ef_search cần bằng chứng thực nghiệm chắc chắn nhất.

### 3. Lời thoại

> Để tổng kết lại toàn bộ Mục La Mã này, đây là bảng so sánh đầy đủ cả ba tham số theo nhiều tiêu chí khác nhau.
>
> Điểm khác biệt quan trọng nhất cần ghi nhớ: M và ef_construction đều là những tham số chỉ có tác dụng tại thời điểm xây dựng chỉ mục, sau đó cố định — muốn thay đổi bắt buộc phải xây dựng lại toàn bộ từ đầu. Trong khi đó, ef_search là tham số duy nhất có thể điều chỉnh linh hoạt, ngay lập tức, cho từng lượt truy vấn cụ thể, mà không cần động chạm gì tới cấu trúc đồ thị đã xây dựng.
>
> Đây cũng chính là bằng chứng cho thấy toàn bộ những gì vừa trình bày không phải lý thuyết trừu tượng, mà đã được triển khai thành cấu hình thật trong hệ thống — cú pháp câu lệnh tạo chỉ mục trên đây được trích nguyên văn từ chính cơ sở dữ liệu của hệ thống, sử dụng đúng phương thức tạo chỉ mục HNSW có sẵn của pgvector, với tham số M và ef_construction được truyền trực tiếp vào câu lệnh.
>
> Vì ef_search là tham số duy nhất còn có thể điều chỉnh sau khi hệ thống đã vận hành, và vì nó ảnh hưởng trực tiếp tới trải nghiệm của từng lượt tìm kiếm hàng ngày, việc lựa chọn đúng giá trị cho tham số này cần dựa trên bằng chứng thực nghiệm chắc chắn nhất — nội dung này chính là trọng tâm của Mục La Mã tiếp theo, nơi nhóm trình bày đầy đủ kết quả thực nghiệm đã đo được trên chính dữ liệu thật của hệ thống.

---

## MỤC IV. BRUTE-FORCE VS HNSW: ƯU NHƯỢC ĐIỂM VÀ ĐIỀU KIỆN ÁP DỤNG

### SLIDE IV.1 — BRUTE-FORCE VS HNSW: ƯU NHƯỢC ĐIỂM VÀ YẾU TỐ QUYẾT ĐỊNH

### 1. Bố cục slide

- **Tiêu đề mục:** "IV. Brute-force vs HNSW — Ưu nhược điểm và điều kiện áp dụng".
- **Trên cùng:** Bảng đối xứng 2 cột, so sánh trực diện Brute-force và HNSW theo 4 tiêu chí.
- **Giữa slide:** 3 khối ngang hàng, mỗi khối là 1 yếu tố quyết định (Quy mô N, Số chiều d, Cấu trúc dữ liệu) — mỗi khối có 1 icon minh họa và 1-2 dòng giải thích ngắn.
- **Cuối slide:** Câu chốt đóng khung, dẫn cầu sang Mục V.

### 2. Nội dung chữ trên slide

**Tiêu đề:** IV. Brute-force vs HNSW — Ưu nhược điểm và điều kiện áp dụng

**Bảng so sánh đối xứng:**

| Tiêu chí | Brute-force | HNSW |
|---|---|---|
| Độ chính xác | Tuyệt đối | Gần đúng |
| Chi phí mỗi truy vấn | $O(N \times d)$ — tuyến tính | Gần $O(\log N)$ trong điều kiện lý tưởng |
| Chi phí xây dựng trước | Không cần | Cần build chỉ mục — tốn thời gian và bộ nhớ |
| Độ phức tạp triển khai | Rất đơn giản | Phức tạp hơn — nhiều tham số cần tinh chỉnh |

**Ba yếu tố quyết định phương pháp nào chiếm ưu thế:**

1. **Quy mô tập dữ liệu (N)**
   > N nhỏ: chi phí build chỉ mục của HNSW chưa đáng để đánh đổi, brute-force đủ nhanh. N lớn: chi phí brute-force tăng tuyến tính không kiểm soát được, HNSW bắt đầu chiếm ưu thế.

2. **Số chiều vector (d)**
   > d càng cao, brute-force càng nặng (chi phí tuyến tính theo d). Nhưng đồng thời, hiện tượng Curse of Dimensionality cũng khiến lợi ích lý thuyết của HNSW không còn chắc chắn nếu dữ liệu không có cấu trúc tốt.

3. **Cấu trúc phân bố dữ liệu (có quy tắc/cụm hay hỗn loạn)**
   > Yếu tố quyết định quan trọng nhất. HNSW dựa vào giả định dữ liệu có cấu trúc cụm để định tuyến hiệu quả. Dữ liệu càng hỗn loạn (ngẫu nhiên đều), lợi thế lý thuyết của HNSW càng suy yếu.

**Câu chốt (đóng khung):**
> Ba yếu tố trên là những giả định lý thuyết — chưa có gì đảm bảo chúng đúng trong thực tế. Việc kiểm chứng bằng số liệu thật được trình bày ở Mục La Mã tiếp theo.

### 3. Lời thoại

> Để khép lại phần lý thuyết và cơ chế của HNSW, nhóm xin so sánh trực diện phương pháp này với brute-force, phương pháp tìm kiếm chính xác tuyệt đối đã nhắc tới từ đầu.
>
> Về ưu nhược điểm, hai phương pháp đối lập nhau ở hầu hết mọi tiêu chí. Brute-force cho kết quả chính xác tuyệt đối, không cần bất kỳ bước xây dựng chỉ mục nào trước, và cực kỳ đơn giản để triển khai — nhưng chi phí mỗi lượt truy vấn tăng tuyến tính theo cả số lượng dữ liệu lẫn số chiều không gian. Ngược lại, HNSW chỉ cho kết quả gần đúng, đòi hỏi phải xây dựng chỉ mục trước khi có thể sử dụng, và có nhiều tham số cần tinh chỉnh, phức tạp hơn hẳn trong khâu triển khai — nhưng đổi lại, trong điều kiện lý tưởng, chi phí mỗi lượt truy vấn chỉ còn gần với logarit của số lượng dữ liệu.
>
> Vấn đề đặt ra là: trong thực tế, phương pháp nào thực sự chiếm ưu thế còn phụ thuộc vào ba yếu tố cụ thể. Yếu tố thứ nhất là quy mô của tập dữ liệu. Ở quy mô nhỏ, chi phí xây dựng chỉ mục của HNSW có thể chưa đủ để bù đắp, khiến brute-force đơn giản vẫn đủ nhanh và thậm chí có lợi thế hơn. Chỉ khi quy mô dữ liệu đủ lớn, khi chi phí quét tuyến tính của brute-force trở nên không thể kiểm soát được, lợi thế của HNSW mới thực sự bộc lộ.
>
> Yếu tố thứ hai là số chiều của vector. Số chiều càng cao, chi phí của brute-force càng nặng thêm một cách trực tiếp. Nhưng đồng thời, chính ở không gian nhiều chiều, hiện tượng được gọi là lời nguyền chiều cao lại khiến lợi ích lý thuyết của HNSW không còn chắc chắn tuyệt đối nếu bản thân dữ liệu không mang cấu trúc tốt.
>
> Yếu tố thứ ba, và theo đánh giá của nhóm là yếu tố quyết định quan trọng nhất, là cấu trúc phân bố của chính dữ liệu — dữ liệu có tuân theo một quy tắc, hình thành các cụm rõ ràng, hay hoàn toàn hỗn loạn, phân bố ngẫu nhiên đều. Bản thân HNSW dựa hoàn toàn vào giả định rằng dữ liệu có cấu trúc cụm để có thể định tuyến hiệu quả qua các tầng. Nếu dữ liệu càng hỗn loạn, không mang cấu trúc gì, lợi thế lý thuyết của thuật toán này càng suy yếu, thậm chí có thể biến mất hoàn toàn.
>
> Cả ba yếu tố vừa trình bày, cho tới thời điểm này, vẫn đang dừng lại ở mức độ lập luận lý thuyết. Việc kiểm chứng xem chúng có thực sự đúng như vậy trong thực tế hay không — cụ thể với chính dữ liệu và hệ thống của nhóm — sẽ được trình bày đầy đủ bằng số liệu thực nghiệm thật ở Mục La Mã tiếp theo.

---

## MỤC LỤC — Phần 2. HNSW

### Tổng cộng: 4 Mục La Mã, 16 slide

### MỤC I — BÀI TOÁN GỐC VÀ VỊ TRÍ CỦA HNSW (1 slide)

| Slide | Nội dung |
|---|---|
| I | Bài toán k-NN, Brute-force vs ANN, ba nhánh ANN, định vị HNSW |

### MỤC II — Ý TƯỞNG, CẤU TRÚC, MÃ GIẢ, DEMO (10 slide)

| Slide | Nội dung |
|---|---|
| II.1 | Ý tưởng đơn tầng + nhược điểm |
| II.2 | Giải pháp phân tầng + mã giả + giới thiệu 3 tham số |
| II.3 | Công thức gán tầng — đầy đủ 12 điểm, có bước tính trung gian |
| II.4 | Chèn điểm 0, 1, 2 — log đầy đủ |
| II.5 | Chèn điểm 3, 4, 5 — log đầy đủ |
| II.6 | Chèn điểm 6, 7, 8 — log đầy đủ |
| II.7 | Chèn điểm 9, 10, 11 — log đầy đủ (khoảnh khắc "đường cao tốc liên cụm") |
| II.8 | Cấu trúc hoàn chỉnh — 3 bảng kết nối đầy đủ |
| II.9 | Trực quan hóa 2D + 3D |
| II.10 | Demo tìm kiếm — đối chiếu ef_search=2 vs ef_search=8 |

### MỤC III — BA THAM SỐ M, ef_construction, ef_search (4 slide)

| Slide | Nội dung |
|---|---|
| III.1 | Tham số M — số kết nối tối đa mỗi điểm |
| III.2 | Tham số ef_construction — độ kỹ lưỡng khi xây dựng |
| III.3 | Tham số ef_search — độ rộng tìm kiếm lúc truy vấn |
| III.4 | Tổng hợp so sánh 3 tham số + cú pháp SQL triển khai thật |

### MỤC LA MÃ IV — BRUTE-FORCE VS HNSW (1 slide)

| Slide | Nội dung |
|---|---|
| IV | Ưu nhược điểm đối xứng + 3 yếu tố quyết định (quy mô N, số chiều d, cấu trúc dữ liệu) |

### Ghi chú tra cứu nhanh — "Nếu bị hỏi về..."

| Chủ đề bị hỏi | Mở slide |
|---|---|
| k-NN, ANN, 3 nhánh thuật toán, định vị HNSW | I |
| Nhược điểm đồ thị đơn tầng, ý tưởng phân tầng | II.1 |
| Mã giả, quy trình tìm kiếm tổng quát | II.2 |
| Công thức gán tầng, phân phối xác suất | II.3 |
| Chi tiết build từng điểm cụ thể (0-11) | II.4 – II.7 |
| "Đường cao tốc liên cụm", entry_point đổi chủ | II.7 |
| Cấu trúc đồ thị hoàn chỉnh, số điểm mỗi tầng | II.8 |
| Hình ảnh trực quan 2D/3D | II.9 |
| Demo tìm kiếm thật, ảnh hưởng ef_search | II.10 |
| Ý nghĩa và đánh đổi của tham số M | III.1 |
| Ý nghĩa và đánh đổi của ef_construction | III.2 |
| Ý nghĩa và đánh đổi của ef_search | III.3 |
| Cú pháp SQL tạo HNSW index thật trong pgvector | III.4 |
| So sánh Brute-force vs HNSW, khi nào dùng cái nào | IV |