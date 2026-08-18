# CÂU HỎI ÔN TẬP — TRỤ CỘT 2: ANN, HNSW & pgvector

---

## Cấp độ 1 — Câu hỏi chí mạng (giảng viên gần như chắc chắn hỏi)

**Câu 1.** Trình bày sự khác biệt giữa k-NN (tìm kiếm chính xác/brute-force) và ANN (tìm kiếm gần đúng). Vì sao hệ thống chọn dùng ANN thay vì brute-force cho bài toán truy hồi ảnh?

**Câu 2.** Giải thích cơ chế hoạt động của đồ thị phân tầng trong HNSW: vì sao gọi là "hierarchical", và tầng trên khác tầng dưới ở điểm nào? Trình bày quy trình tìm kiếm từ tầng cao nhất xuống Layer 0.

**Câu 3.** Trình bày ý nghĩa của ba tham số M, ef_construction, ef_search trong HNSW — mỗi tham số ảnh hưởng tới giai đoạn nào của vòng đời hệ thống, và đánh đổi gì khi tăng/giảm từng tham số.

---

## Cấp độ 2 — Câu hỏi hóc búa (đo độ hiểu sâu)

**Câu 4.** Nếu ef_construction càng cao thì đồ thị được xây dựng càng chất lượng, và đây chỉ là chi phí "chạy một lần" — vậy tại sao không đặt ef_construction ở mức rất cao (ví dụ 9999) ngay từ đầu? Giải thích cả trường hợp dataset tĩnh và trường hợp hệ thống có tốc độ ghi dữ liệu liên tục.

**Câu 5.** pgvector không phải một vector database độc lập mà là một extension của PostgreSQL. Giải thích vì sao lựa chọn kiến trúc này lại phù hợp hơn Milvus cho quy mô của đồ án, dựa trên sự khác biệt về kiến trúc distributed và kiến trúc tích hợp.

**Câu 6.** Trong lần triển khai Milvus ban đầu, hệ thống liên tục sập và chiếm dụng CPU/RAM cao dù dữ liệu chỉ ở quy mô nhỏ. Giải thích nguyên nhân kỹ thuật cụ thể đằng sau hiện tượng này — không chỉ dừng ở "máy yếu" hay "dữ liệu nhỏ".

---

## Cấp độ 3 — Câu hỏi mở rộng (test khả năng liên hệ ngoài phạm vi HNSW/pgvector)

**Câu 7.** Nếu một điểm dữ liệu trong đồ thị HNSW chỉ xuất hiện ở Layer 0, không được đưa lên tầng nào cao hơn — điều này có ảnh hưởng gì đến khả năng điểm đó được tìm thấy trong kết quả truy vấn hay không? Việc "không được thăng hạng lên tầng cao" có đồng nghĩa với việc điểm đó kém liên quan về mặt ngữ nghĩa không?

**Câu 8.** So sánh cơ chế đồ thị phân tầng của HNSW với cấu trúc index B-tree truyền thống trong các hệ quản trị cơ sở dữ liệu quan hệ (dùng cho các cột như id, email). Cả hai đều nhằm tăng tốc tìm kiếm — điểm giống và khác nhau căn bản giữa chúng là gì?

**Câu 9.** Giả sử SISE phát triển tới quy mô hàng chục triệu ảnh. Trình bày chiến lược mở rộng theo từng bước (không nhảy thẳng sang thay đổi lớn), và giải thích vì sao "chuyển hẳn sang Milvus, loại bỏ pgvector" không phải là quyết định hợp lý ngay cả khi hệ thống đã cần đến giải pháp phân tán.

---

# Câu trả lời hoàn chỉnh — Câu 1, Cấp độ 1 

*"Trình bày sự khác biệt giữa k-NN (tìm kiếm chính xác/brute-force) và ANN (tìm kiếm gần đúng). Vì sao hệ thống chọn dùng ANN thay vì brute-force cho bài toán truy hồi ảnh?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

k-NN (k-Nearest Neighbors) là một bài toán: tìm k điểm dữ liệu gần nhất với một điểm truy vấn, dựa trên một phép đo khoảng cách hoặc độ tương đồng. Có hai chiến lược chính để giải bài toán này: brute-force và ANN.

Brute-force là chiến lược tìm kiếm chính xác tuyệt đối — tính khoảng cách từ điểm truy vấn tới toàn bộ N điểm trong tập dữ liệu, sắp xếp và lấy k điểm gần nhất. Brute-force luôn đảm bảo kết quả là chính xác tuyệt đối theo đúng định nghĩa toán học của khoảng cách, nhưng đổi lại chi phí tính toán tăng tuyến tính theo số lượng dữ liệu và số chiều vector.

ANN (Approximate Nearest Neighbor) là chiến lược khác để giải cùng bài toán k-NN, nhưng chấp nhận đánh đổi một phần độ chính xác tuyệt đối để đổi lấy tốc độ truy vấn nhanh hơn đáng kể, thông qua các cấu trúc dữ liệu chuyên biệt như đồ thị, cây, hoặc hash thay vì vét cạn toàn bộ tập dữ liệu.

Hệ thống chọn dùng ANN thay vì brute-force không đơn thuần vì lý do hiệu năng thuần túy, mà dựa trên một lập luận sâu hơn liên quan đến bản chất của dữ liệu đang lưu trữ: vector 512 chiều của CLIP nằm trong không gian nhiều chiều, nơi xảy ra hiện tượng curse of dimensionality. Khi số chiều tăng, ranh giới giữa "top-1 chính xác tuyệt đối" và "top-k gần đúng" đã tự nhiên bị nhòe đi về mặt hình học, do khoảng cách giữa các điểm trong không gian cao chiều có xu hướng trở nên gần như đồng đều. Điều này có nghĩa là phần độ chính xác tưởng như bị hy sinh khi chuyển sang ANN thực chất đã không còn nhiều giá trị phân biệt thực tế ngay từ trong chính cấu trúc không gian dữ liệu, chứ không phải một sự đánh đổi thuần túy giữa tốc độ và chi phí. Đây là một quyết định có cơ sở dựa trên hệ quả tất yếu của dữ liệu chiều cao, không chỉ là một lựa chọn tối ưu hiệu năng đơn thuần.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Vậy ANN có phải một dạng của k-NN không, hay là một bài toán hoàn toàn khác?"**

ANN vẫn đang giải đúng bài toán k-NN — tìm k điểm gần nhất với điểm truy vấn — chỉ là chấp nhận kết quả gần đúng để đổi lấy tốc độ, thay vì đảm bảo chính xác tuyệt đối như brute-force. Không nên hiểu k-NN và ANN là hai bài toán độc lập, ngang hàng; chính xác hơn, k-NN là bài toán, còn brute-force và ANN là hai chiến lược khác nhau để giải cùng một bài toán đó.

**Nếu hội đồng hỏi: "Độ chính xác bị đánh đổi khi dùng ANN cụ thể là bao nhiêu, có đo lường được không?"**

Có, độ chính xác của ANN thường được đo bằng chỉ số recall — tỉ lệ phần trăm kết quả đúng (theo brute-force) mà ANN tìm lại được trong top-k của nó. Recall này phụ thuộc vào các tham số cấu hình của thuật toán ANN cụ thể đang dùng, ví dụ với HNSW là các tham số M, ef_construction, ef_search — có thể điều chỉnh để đạt mức cân bằng mong muốn giữa tốc độ và độ chính xác, tùy theo yêu cầu thực tế của hệ thống.

---

# Câu trả lời hoàn chỉnh — Câu 2, Cấp độ 1

*"Giải thích cơ chế hoạt động của đồ thị phân tầng trong HNSW: vì sao gọi là 'hierarchical', và tầng trên khác tầng dưới ở điểm nào? Trình bày quy trình tìm kiếm từ tầng cao nhất xuống Layer 0."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Trong HNSW, dữ liệu được tổ chức thành nhiều tầng theo kiểu phân cấp, đây chính là lý do gọi là "hierarchical". Mỗi điểm khi được thêm vào đồ thị sẽ được gán ngẫu nhiên một tầng cao nhất mà nó xuất hiện. Tầng càng cao thì càng ít điểm và đồ thị càng thưa, kết nối giữa các điểm mang tính "nhảy xa"; tầng thấp nhất, gọi là Layer 0, chứa toàn bộ dữ liệu và có đồ thị dày đặc, kết nối cục bộ.

Quy trình tìm kiếm bắt đầu từ tầng cao nhất: thuật toán chọn một điểm khởi đầu cố định (entry point), thực hiện tìm kiếm để tiến dần đến điểm gần truy vấn nhất trong tầng đó. Điểm dừng lại này được dùng làm điểm xuất phát cho tầng thấp hơn liền kề, quá trình lặp lại liên tục cho đến khi xuống tới Layer 0, nơi bước tìm kiếm cuối cùng cho ra kết quả trả về.

Nhờ cấu trúc phân tầng này, tầng trên đóng vai trò định hướng nhanh đến vùng gần đúng trong không gian nhờ các kết nối nhảy xa, còn tầng dưới tinh chỉnh kết quả trong phạm vi hẹp và chính xác hơn nhờ kết nối dày đặc, giúp việc tìm kiếm vừa nhanh vừa đạt độ chính xác chấp nhận được, thay vì phải dò từng bước nhỏ xuyên suốt toàn bộ dữ liệu ngay từ đầu.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Việc tìm kiếm trong mỗi tầng dùng thuật toán gì, và thuật toán đó có nhược điểm gì không?"**

Cần phân biệt rõ hai giai đoạn khác nhau trong quy trình tìm kiếm của HNSW, theo đúng mô tả trong bài báo gốc của Malkov và Yashunin. Ở tất cả các tầng phía trên Layer 0, HNSW dùng đúng greedy search thuần túy: tại mỗi bước chỉ giữ lại đúng một điểm tốt nhất hiện tại, di chuyển tới hàng xóm gần truy vấn hơn, tương đương với việc đặt độ rộng tìm kiếm bằng 1. Chỉ riêng tại Layer 0, tầng cuối cùng và duy nhất chứa toàn bộ dữ liệu, HNSW mới chuyển sang một biến thể gọi là beam search, chính là vai trò thật sự của tham số ef_search: thay vì chỉ giữ một ứng viên, thuật toán giữ lại một danh sách gồm ef_search ứng viên tốt nhất, mở rộng tìm kiếm song song từ toàn bộ danh sách đó trước khi chốt kết quả cuối cùng.

Greedy search thuần túy có một nhược điểm cố hữu đã biết trong lý thuyết đồ thị: dễ bị mắc kẹt ở một cực tiểu địa phương, tức một điểm mà mọi hàng xóm xung quanh đều có vẻ kém hơn theo phép đo cục bộ, dù trên thực tế vẫn còn một hướng đi khác dẫn tới kết quả tốt hơn. Rủi ro này tồn tại nhiều nhất ở các tầng trên, nơi HNSW dùng đúng greedy thuần túy, nhưng hậu quả được giảm nhẹ đáng kể nhờ đặc điểm cấu trúc của chính các tầng đó: chúng rất thưa, kết nối mang tính nhảy xa, nên xác suất tồn tại một cực tiểu địa phương gây lạc hướng nghiêm trọng thấp hơn nhiều so với ở một đồ thị dày đặc. Đến khi xuống tới Layer 0, nơi mật độ dày đặc và dễ gặp cực tiểu địa phương hơn, HNSW mới chuyển sang beam search với độ rộng ef_search để bù đắp đúng rủi ro này — đây chính là lý do ef_search càng lớn thì recall càng cao, vì nó trực tiếp giảm thiểu khả năng bị mắc kẹt ở bước tìm kiếm cuối cùng và quan trọng nhất trong toàn bộ quy trình.

**Nếu hội đồng hỏi: "Entry point ở tầng cao nhất được chọn như thế nào, có cố định không?"**

Entry point thường là điểm đầu tiên được thêm vào đồ thị và cũng là điểm ngẫu nhiên đạt tới tầng cao nhất trong toàn bộ cấu trúc tại thời điểm đó — mỗi lần có một điểm mới được gán tầng cao hơn tầng hiện tại của entry point, entry point sẽ được cập nhật lại. Vì tầng cao nhất luôn rất thưa, thường chỉ có một hoặc vài điểm, nên entry point tương đối ổn định trong phần lớn thời gian vận hành của đồ thị, chỉ thay đổi khi có sự kiện hiếm là một điểm mới được gán ngẫu nhiên lên một tầng cao chưa từng tồn tại trước đó.

---

# Câu trả lời hoàn chỉnh — Câu 3, Cấp độ 1 

*"Trình bày ý nghĩa của ba tham số M, ef_construction, ef_search trong HNSW — mỗi tham số ảnh hưởng tới giai đoạn nào của vòng đời hệ thống, và đánh đổi gì khi tăng/giảm từng tham số."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Trong HNSW, ba tham số M, ef_construction và ef_search, mỗi tham số ảnh hưởng đến một giai đoạn khác nhau của vòng đời hệ thống.

M quyết định số lượng cạnh tối đa mà mỗi điểm dữ liệu được phép giữ trong đồ thị, ở mỗi tầng — ảnh hưởng trực tiếp đến độ kết nối và cấu trúc tổng thể của đồ thị. M càng lớn, đồ thị càng dày, tìm kiếm chính xác hơn do có nhiều đường lựa chọn hơn, nhưng tốn nhiều bộ nhớ hơn và thời gian xây dựng chậm hơn.

ef_construction hoạt động trong giai đoạn xây dựng index, kiểm soát số lượng ứng viên được xem xét khi tìm hàng xóm tốt nhất để nối cạnh cho một điểm mới. Giá trị càng cao, chất lượng đồ thị càng tốt, nhưng chi phí xây dựng tăng theo. Tham số này chỉ ảnh hưởng một lần khi build hoặc khi chèn thêm dữ liệu mới, không ảnh hưởng tốc độ truy vấn về sau.

ef_search hoạt động trong giai đoạn truy vấn, xác định kích thước danh sách ứng viên tạm thời khi tìm kiếm. Cụ thể hơn, tham số này chỉ có tác dụng ở Layer 0, tầng cuối cùng và duy nhất chứa toàn bộ dữ liệu — đây là nơi HNSW chuyển từ greedy search thuần túy (dùng ở mọi tầng phía trên) sang beam search có kiểm soát, giữ lại nhiều ứng viên song song thay vì chỉ một, giúp tránh mắc kẹt ở kết quả cục bộ chưa tối ưu. ef_search càng lớn, kết quả càng chính xác, nhưng độ trễ mỗi lần truy vấn cũng tăng theo.

Nói ngắn gọn, M ảnh hưởng đến cấu trúc đồ thị, ef_construction ảnh hưởng đến chất lượng và chi phí xây dựng, còn ef_search ảnh hưởng đến độ chính xác và tốc độ truy vấn — cả ba đều là những điểm cân bằng giữa hiệu năng, bộ nhớ và độ chính xác, nhưng tác động ở ba thời điểm khác nhau trong vòng đời của hệ thống: M và ef_construction quyết định lúc xây dựng, còn ef_search quyết định ở mỗi lần người dùng thực hiện truy vấn.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Nếu ef_construction càng cao càng tốt và chỉ tốn chi phí một lần, sao không đặt nó ở mức rất cao ngay từ đầu?"**

Có hai lý do. Thứ nhất, HNSW hỗ trợ chèn tăng dần, không cần build lại toàn bộ đồ thị mỗi khi có dữ liệu mới — nhưng chính vì vậy, chi phí ef_construction là chi phí phải trả cho mỗi lần chèn một điểm mới, không phải chỉ một lần duy nhất cho toàn bộ hệ thống. Trong một hệ thống có tốc độ ghi liên tục, chi phí này tích lũy theo thời gian. Thứ hai, từ một ngưỡng đủ cao, tăng thêm ef_construction chỉ cải thiện recall một lượng rất nhỏ, không tương xứng với chi phí tính toán bỏ thêm ra — đây là hiện tượng lợi ích giảm dần thường gặp khi tối ưu tham số.

**Nếu hội đồng hỏi: "Tại sao ef_construction (200) trong đồ án lại được set cao hơn hẳn ef_search (64), dù cả hai đều có cùng vai trò là kích thước danh sách ứng viên tạm thời?"**

Vì hai tham số này tác động lên hai giai đoạn có chi phí rất khác nhau. ef_construction chỉ chạy khi build index hoặc khi chèn dữ liệu mới — có thể chấp nhận chậm hơn để đổi lấy chất lượng đồ thị tốt hơn, vì việc này không ảnh hưởng trực tiếp đến trải nghiệm người dùng. ef_search chạy ở mỗi lần truy vấn, ảnh hưởng trực tiếp đến độ trễ mà người dùng cảm nhận được, nên cần giữ ở mức đủ thấp để đảm bảo tốc độ phản hồi, miễn là vẫn đạt recall chấp nhận được. Đặt ef_construction cao hơn ef_search phản ánh đúng nguyên tắc: có thể đầu tư nhiều hơn cho công đoạn chỉ chạy một lần, nhưng cần tiết chế công đoạn chạy liên tục.

---

# Câu trả lời hoàn chỉnh — Câu 4, Cấp độ 2 

*"Nếu ef_construction càng cao thì đồ thị được xây dựng càng chất lượng, và đây chỉ là chi phí 'chạy một lần' — vậy tại sao không đặt ef_construction ở mức rất cao (ví dụ 9999) ngay từ đầu? Giải thích cả trường hợp dataset tĩnh và trường hợp hệ thống có tốc độ ghi dữ liệu liên tục."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Nếu đặt ef_construction ở mức rất cao như 9999, đúng là chất lượng đồ thị sẽ tốt hơn về mặt lý thuyết, nhưng có hai lý do khiến đây không phải lựa chọn hợp lý, áp dụng khác nhau tùy vào bối cảnh dữ liệu tĩnh hay động.

Với dataset tĩnh, nơi index chỉ cần xây dựng một lần rồi chủ yếu phục vụ truy vấn, lý do chính không phải chi phí thời gian ghi lặp lại, mà là hiện tượng lợi ích giảm dần. Từ một ngưỡng đã đủ cao, thường vài trăm, việc tăng thêm ef_construction chỉ cải thiện recall một lượng rất nhỏ, trong khi thời gian xây dựng có thể tăng lên gấp nhiều lần. Ngay cả khi chi phí đó chỉ trả một lần, sự đánh đổi giữa mức cải thiện chất lượng cận biên và chi phí bỏ thêm ra không còn cân xứng, khiến việc chọn một giá trị vừa đủ như 200 hợp lý hơn việc đẩy lên mức cực đại.

Với hệ thống có tốc độ ghi dữ liệu liên tục, vấn đề nghiêm trọng hơn nhiều vì bản chất chi phí của ef_construction. HNSW hỗ trợ chèn tăng dần, không cần xây lại toàn bộ đồ thị mỗi khi có dữ liệu mới, nhưng chính vì vậy, chi phí ef_construction là chi phí phải trả cho mỗi lần chèn một điểm, không phải chỉ một lần duy nhất cho toàn bộ hệ thống. Nếu hệ thống nhận hàng nghìn bản ghi mới mỗi ngày, việc đặt ef_construction quá cao khiến mỗi lần chèn đều tốn thời gian đáng kể, tích lũy lại có thể gây nghẽn tốc độ ghi, ảnh hưởng trực tiếp đến khả năng phục vụ dữ liệu mới theo thời gian thực.

Vì vậy, ef_construction cần được chọn ở một mức cân bằng, đủ cao để đảm bảo chất lượng đồ thị phục vụ tốt cho truy vấn phía sau, nhưng không vượt quá điểm mà lợi ích cận biên không còn tương xứng với chi phí, đặc biệt cần thận trọng hơn nữa nếu hệ thống có tốc độ ghi dữ liệu liên tục.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "SISE là dataset tĩnh hay động? Lập luận nào áp dụng cho đồ án?"**

Bộ dữ liệu benchmark của đồ án, gồm Flickr30K và bộ tự thu thập, về bản chất là tĩnh trong phạm vi đánh giá — được nạp một lần để đo các chỉ số hiệu năng. Nhưng hệ thống SISE khi vận hành thực tế lại có tính chất động, vì người dùng có thể tải ảnh mới lên bất kỳ lúc nào, mỗi lần tải lên tương ứng với một lần chèn thêm vector vào index. Vì vậy cả hai lập luận đều liên quan đến đồ án: lập luận về lợi ích giảm dần giải thích tại sao ef_construction=200 là lựa chọn hợp lý cho việc xây dựng benchmark, còn lập luận về chi phí tích lũy theo từng lần chèn giải thích tại sao giá trị này cũng phù hợp cho việc vận hành hệ thống lâu dài khi có ảnh mới liên tục được thêm vào.

**Nếu hội đồng hỏi: "Có cách nào đo được chính xác 'ngưỡng đủ cao' đó là bao nhiêu, hay chỉ là ước lượng cảm tính?"**

Ngưỡng này thường được xác định qua thực nghiệm, bằng cách đo recall và thời gian xây dựng ở nhiều mức ef_construction khác nhau rồi quan sát điểm mà đường cong cải thiện recall bắt đầu phẳng lại đáng kể so với chi phí thời gian bỏ thêm ra, không phải một con số cố định áp dụng chung cho mọi bài toán. Giá trị 200 được chọn cho đồ án dựa trên khuyến nghị phổ biến trong tài liệu kỹ thuật của HNSW và pgvector cho các bài toán có quy mô dữ liệu tương tự, kết hợp với việc phù hợp mức tài nguyên phần cứng sẵn có khi triển khai.

---

# Câu trả lời hoàn chỉnh — Câu 5, Cấp độ 2 

*"pgvector không phải một vector database độc lập mà là một extension của PostgreSQL. Giải thích vì sao lựa chọn kiến trúc này lại phù hợp hơn Milvus cho quy mô của đồ án, dựa trên sự khác biệt về kiến trúc distributed và kiến trúc tích hợp."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Việc pgvector chỉ là một extension tích hợp trong PostgreSQL, thay vì một hệ thống vector database phân tán độc lập như Milvus, phù hợp hơn cho quy mô của đồ án nhờ sự khác biệt căn bản về kiến trúc.

Milvus được thiết kế cho hạ tầng distributed, tối ưu cho quy mô dữ liệu cực lớn, thường hàng trăm triệu đến hàng tỷ vector, phân tán trên nhiều máy chủ. Kiến trúc này cần nhiều thành phần đi kèm như etcd để quản lý metadata cluster, message queue để đồng bộ giữa các node, cùng nhiều microservice con chạy tách biệt — kéo theo chi phí vận hành, độ phức tạp triển khai và quản lý cao, phù hợp với các hệ thống ở quy mô công nghiệp lớn.

Trong khi đó, pgvector tận dụng ngay hệ quản trị PostgreSQL đã có sẵn trong hệ thống để lưu metadata quan hệ, không cần dựng thêm một hệ thống lưu trữ riêng biệt cho vector. Vector embedding và các bảng dữ liệu khác như thông tin người dùng, album có thể nằm chung một database, truy vấn kết hợp trực tiếp bằng SQL, không cần cơ chế đồng bộ hai chiều giữa hai hệ thống tách biệt.

Quy mô dữ liệu thực tế của đồ án là 1000 ảnh cho mỗi bộ benchmark, và thực nghiệm mở rộng bằng vector tổng hợp cũng chỉ khảo sát tới mức 100.000 vector để quan sát xu hướng, còn cách rất xa ngưỡng hàng trăm triệu hay hàng tỷ vector mà Milvus được thiết kế để phục vụ tốt nhất. Ở quy mô này, kiến trúc tích hợp của pgvector vừa đủ khả năng đáp ứng nhu cầu tìm kiếm vector với hiệu năng tốt, vừa giúp đơn giản hóa triển khai và giảm đáng kể chi phí vận hành so với việc dựng một hệ phân tán chuyên dụng chỉ để phục vụ một khối lượng dữ liệu còn nhỏ hơn nhiều so với năng lực thiết kế của nó.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Với chỉ 1000 ảnh, có cần đến cả HNSW và pgvector không, hay brute-force đã đủ?"**

Ở quy mô 1000 ảnh, thực nghiệm của nhóm cho thấy brute-force thực tế còn nhanh hơn HNSW một chút, do chi phí duyệt đồ thị phân tầng chưa được bù đắp ở quy mô nhỏ như vậy. Tuy nhiên, việc chọn HNSW và pgvector ngay từ đầu không phải vì cần thiết ở quy mô hiện tại, mà là một quyết định kiến trúc hướng tới khả năng mở rộng — pgvector cho phép sử dụng HNSW mà không cần đổi công nghệ nền tảng khi dữ liệu tăng lên, trong khi vẫn giữ được sự đơn giản của một hệ thống tích hợp. Thực nghiệm ở quy mô 1000 ảnh cũng xác nhận việc dùng HNSW không đánh đổi bất kỳ độ chính xác nào, nên đây là một sự chuẩn bị có cơ sở chứ không phải một lựa chọn kiến trúc dư thừa.

**Nếu hội đồng hỏi: "Nếu biết trước quy mô sẽ luôn nhỏ như vậy, tại sao ngay từ đầu không thiết kế đơn giản hơn nữa, ví dụ không dùng index gì cả?"**

Quy mô dữ liệu của một hệ thống ứng dụng thực tế, khác với một bộ benchmark cố định, có khả năng thay đổi theo thời gian khi có thêm người dùng và dữ liệu mới. Việc thiết kế sẵn với chỉ mục HNSW ngay từ đầu, dù chưa phát huy hết lợi thế tốc độ ở quy mô hiện tại, đảm bảo hệ thống có nền tảng phù hợp để mở rộng mà không cần tái cấu trúc lớn sau này. Đây là một đánh đổi hợp lý giữa chi phí thiết kế ban đầu, vốn không đáng kể vì pgvector dễ tích hợp, và lợi ích lâu dài khi hệ thống phát triển.

---

# Câu trả lời hoàn chỉnh — Câu 6, Cấp độ 2

*"Trong lần triển khai Milvus ban đầu, hệ thống liên tục sập và chiếm dụng CPU/RAM cao dù dữ liệu chỉ ở quy mô nhỏ. Giải thích nguyên nhân kỹ thuật cụ thể đằng sau hiện tượng này — không chỉ dừng ở 'máy yếu' hay 'dữ liệu nhỏ'."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Nguyên nhân kỹ thuật cụ thể nằm ở bản chất kiến trúc distributed của Milvus, không phải vấn đề về cấu hình máy hay quy mô dữ liệu. Milvus không phải một chương trình đơn lẻ mà là một hệ sinh thái nhiều thành phần: etcd để quản lý metadata cluster, message queue như Pulsar hoặc Kafka để đồng bộ dữ liệu và sự kiện giữa các node, cùng với gRPC và nhiều microservice con như query node, index node, data node chạy tách biệt. Toàn bộ các thành phần này cần được khởi tạo và duy trì hoạt động, bất kể quy mô dữ liệu thực tế đang lưu trữ là bao nhiêu.

Bên cạnh chi phí khởi tạo, Milvus còn duy trì nhiều cơ chế nền chạy liên tục theo chu kỳ nội bộ: in-memory caching cho vector và index, background compaction để tối ưu hóa dữ liệu theo thời gian, replication để đảm bảo tính sẵn sàng cao, và log streaming để ghi nhận thay đổi. Điểm quan trọng nhất là các cơ chế này hoạt động độc lập với việc có truy vấn nào đang được gửi tới hệ thống hay không — nghĩa là ngay cả khi hệ thống hoàn toàn rảnh rỗi, không có người dùng thao tác, các tiến trình nội bộ vẫn tiêu tốn CPU và RAM để duy trì trạng thái đồng bộ của cluster.

Khi triển khai trên một máy đơn lẻ, dù có tinh chỉnh cấu hình hợp lý hơn để giảm nhẹ một phần overhead, toàn bộ chi phí duy trì bộ máy phân tán này về cơ bản vẫn tồn tại, vì đó là chi phí bắt buộc để hệ thống có khả năng phân tán và mở rộng ngang trong tương lai, không phải một tính năng có thể tắt hoàn toàn mà không ảnh hưởng tới bản chất của Milvus. Đây chính là nguyên nhân sâu xa của hiện tượng dữ liệu nhỏ nhưng tài nguyên tiêu hao lớn: phần lớn tài nguyên bị chiếm dụng không phục vụ trực tiếp việc lưu trữ hay tìm kiếm vector, mà phục vụ việc duy trì một hạ tầng được thiết kế cho quy mô lớn hơn rất nhiều so với bối cảnh triển khai thực tế.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Vậy có cách nào cấu hình lại Milvus để chạy nhẹ hơn trên máy đơn không, hay bắt buộc phải bỏ hẳn?"**

Có thể giảm nhẹ một phần overhead bằng cách tinh chỉnh cấu hình, ví dụ giới hạn số luồng xử lý, điều chỉnh kích thước cache, hoặc dùng các chế độ triển khai rút gọn được Milvus cung cấp cho môi trường thử nghiệm nhỏ. Tuy nhiên, các thành phần nền tảng bắt buộc như etcd và message queue vẫn phải tồn tại để hệ thống hoạt động đúng theo thiết kế gốc của nó, nên chi phí tối thiểu để duy trì bộ máy phân tán không thể loại bỏ hoàn toàn, chỉ có thể giảm nhẹ ở một mức độ nhất định. Đây là lý do nhóm quyết định chuyển hẳn sang pgvector thay vì tiếp tục cố gắng tinh chỉnh Milvus, vì bản chất kiến trúc không phù hợp với quy mô đồ án ngay từ đầu.

**Nếu hội đồng hỏi: "Nếu vậy tại sao ban đầu nhóm lại chọn Milvus, đây có phải sai lầm trong khâu khảo sát công nghệ không?"**

Việc chọn Milvus ban đầu xuất phát từ việc đánh giá Milvus là một trong những vector database mạnh và được nhắc đến rộng rãi, nhưng chưa đối chiếu đầy đủ giữa đặc tính thiết kế của công nghệ đó với quy mô và điều kiện triển khai thực tế của đồ án. Đây là một bài học kinh nghiệm thực tế quan trọng: một công cụ được đánh giá cao trong cộng đồng không đồng nghĩa nó phù hợp với mọi bối cảnh sử dụng, và việc khảo sát công nghệ cần đi kèm với đánh giá cụ thể về mức độ tương xứng giữa năng lực thiết kế của công cụ và quy mô bài toán thực tế, trước khi triển khai chính thức.

---

# Câu trả lời hoàn chỉnh — Câu 7, Cấp độ 3 

*"Nếu một điểm dữ liệu trong đồ thị HNSW chỉ xuất hiện ở Layer 0, không được đưa lên tầng nào cao hơn — điều này có ảnh hưởng gì đến khả năng điểm đó được tìm thấy trong kết quả truy vấn hay không? Việc 'không được thăng hạng lên tầng cao' có đồng nghĩa với việc điểm đó kém liên quan về mặt ngữ nghĩa không?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Việc một điểm dữ liệu chỉ xuất hiện ở Layer 0 không ảnh hưởng đến khả năng nó được tìm thấy trong kết quả truy vấn. Việc một điểm được hay không được đưa lên tầng cao hơn hoàn toàn do cơ chế xác suất ngẫu nhiên của HNSW khi xây dựng đồ thị, không liên quan gì đến chất lượng hay mức độ liên quan ngữ nghĩa của chính điểm dữ liệu đó.

Layer 0 là tầng duy nhất chứa đầy đủ 100% dữ liệu, và đây cũng là nơi diễn ra bước tìm kiếm chi tiết nhất, thông qua beam search với tham số ef_search — khác với các tầng phía trên chỉ dùng greedy search thuần túy. Các tầng trên đóng vai trò như những điểm định hướng, được chọn ngẫu nhiên để giúp quá trình tìm kiếm nhanh chóng tiếp cận đúng vùng lân cận cần thiết, chứ không phải nơi chứa "kết quả đúng nhất". Vì vậy, một điểm không xuất hiện ở tầng cao hơn chỉ đơn giản là nó không được chọn đóng vai trò định hướng, không đồng nghĩa với việc nó kém liên quan về mặt ngữ nghĩa — khi quá trình tìm kiếm đi xuống tới Layer 0, nếu điểm đó thực sự gần với truy vấn về mặt ngữ nghĩa, nó vẫn sẽ được xem xét và có khả năng xuất hiện trong kết quả trả về như bất kỳ điểm nào khác.

Đây cũng chính là lý do đảm bảo tính đầy đủ của HNSW: vì Layer 0 luôn chứa toàn bộ dữ liệu, không có điểm nào bị loại trừ vĩnh viễn khỏi khả năng được tìm thấy chỉ vì yếu tố ngẫu nhiên lúc xây dựng đồ thị. Việc được hay không được thăng hạng lên tầng cao chỉ ảnh hưởng đến tốc độ mà quá trình tìm kiếm tiếp cận được vùng chứa điểm đó, không ảnh hưởng đến khả năng cuối cùng điểm đó có được xét tới hay không. Đây là lý do HNSW vẫn có thể đạt độ chính xác rất cao trong thực tế, dù cơ chế phân tầng dựa trên xác suất ngẫu nhiên chứ không theo bất kỳ tiêu chí ngữ nghĩa nào.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Nếu tính đầy đủ luôn được đảm bảo, vậy tại sao Recall của HNSW không phải lúc nào cũng đạt 100%, có lúc thấp hơn tìm kiếm chính xác?"**

Tính đầy đủ về mặt lý thuyết nghĩa là mọi điểm đều nằm trong Layer 0 và có khả năng được xét tới, nhưng điều đó không đảm bảo tuyệt đối rằng quá trình tìm kiếm thực tế sẽ luôn đi đúng đường để chạm tới đúng điểm đó trong giới hạn số bước duyệt cho phép. Nếu ef_search quá nhỏ, quá trình beam search ở Layer 0 có thể dừng lại trước khi khám phá đủ rộng để tìm ra đúng điểm gần nhất, dù về nguyên tắc điểm đó vẫn nằm trong tầng dữ liệu đầy đủ. Đây chính là lý do ef_search ảnh hưởng trực tiếp tới Recall — tăng ef_search đồng nghĩa mở rộng phạm vi khám phá ở bước cuối cùng, giảm nguy cơ bỏ sót do dừng tìm kiếm quá sớm.

**Nếu hội đồng hỏi: "Có cách nào chủ động điều khiển một điểm dữ liệu quan trọng luôn được đưa lên tầng cao, thay vì để hoàn toàn ngẫu nhiên không?"**

Về nguyên tắc có thể can thiệp vào cơ chế gán tầng để ưu tiên một số điểm nhất định, nhưng đây không phải cách tiếp cận chuẩn của HNSW nguyên bản, vì mục tiêu thiết kế của thuật toán là đảm bảo hiệu năng trung bình tốt trên toàn bộ tập dữ liệu một cách khách quan, không thiên vị theo bất kỳ tiêu chí nào được gán thủ công. Việc để yếu tố ngẫu nhiên quyết định giúp tránh các thiên kiến chủ quan có thể làm sai lệch cấu trúc điều hướng của đồ thị, đồng thời đảm bảo tính công bằng thống kê giữa các điểm dữ liệu, phù hợp với một hệ thống truy hồi cần đối xử nhất quán với mọi đối tượng trong cơ sở dữ liệu.

---

# Câu trả lời hoàn chỉnh — Câu 8, Cấp độ 3

*"So sánh cơ chế đồ thị phân tầng của HNSW với cấu trúc index B-tree truyền thống trong các hệ quản trị cơ sở dữ liệu quan hệ (dùng cho các cột như id, email). Cả hai đều nhằm tăng tốc tìm kiếm — điểm giống và khác nhau căn bản giữa chúng là gì?"*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

B-tree, viết tắt của Balanced tree, là một cây đa nhánh cân bằng — không phải cây nhị phân, vì mỗi nút có thể có nhiều con chứ không giới hạn ở hai. B-tree được thiết kế để tối ưu số lần truy cập đĩa: bằng cách để mỗi nút chứa nhiều khóa và nhiều con cùng lúc, cây trở nên thấp và rộng thay vì cao và hẹp, giảm số tầng cần duyệt dù dữ liệu rất lớn. B-tree hoạt động dựa trên việc sắp xếp dữ liệu theo một thứ tự tuyến tính cố định, luôn đảm bảo mọi đường từ gốc tới lá có độ dài bằng nhau, cho tốc độ tìm kiếm ổn định ở O(log N) trong mọi trường hợp.

Điểm giống nhau căn bản giữa B-tree và HNSW nằm ở triết lý thiết kế: cả hai đều tổ chức dữ liệu theo cấu trúc phân cấp nhiều lớp để tránh phải duyệt tuyến tính toàn bộ dữ liệu, đạt tốc độ tìm kiếm gần O(log N), đổi lấy chi phí xây dựng cấu trúc chỉ mục ban đầu.

Tuy nhiên, khác biệt căn bản nằm ở chính bản chất dữ liệu mà mỗi cấu trúc được thiết kế để xử lý. B-tree hoạt động dựa trên khái niệm thứ tự tuyến tính: với hai giá trị bất kỳ như hai số id hay hai chuỗi email, luôn xác định được chính xác giá trị nào lớn hơn, nhỏ hơn hoặc bằng nhau, dựa trên độ lớn của chính giá trị đó. Đây là đại lượng vô hướng, chỉ có một chiều duy nhất để so sánh.

Vector nhiều chiều như embedding 512 chiều của CLIP không có thứ tự tuyến tính tự nhiên như vậy, vì mỗi vector mang thông tin trên nhiều chiều cùng lúc, không thể quy về một phép so sánh lớn hơn hay nhỏ hơn duy nhất áp dụng chung cho mọi cặp vector. Quan trọng hơn, điều mà bài toán truy hồi thực sự cần đo không phải độ lớn của vector, mà là hướng của nó, thể hiện qua cosine similarity — công thức này chủ động chia cho độ lớn của cả hai vector để triệt tiêu hoàn toàn ảnh hưởng của độ lớn, chỉ giữ lại thông tin về góc giữa hai vector. Trong khi đó, B-tree lại đo và sắp xếp dựa trên chính đại lượng độ lớn mà cosine similarity đã chủ động loại bỏ. Vì hai cấu trúc dựa trên hai đại lượng toán học khác nhau của cùng một vector, việc áp dụng B-tree cho bài toán tìm kiếm vector không chỉ khó về mặt kỹ thuật, mà về bản chất không phản ánh đúng độ liên quan ngữ nghĩa mà hệ thống cần tìm.

HNSW, ngược lại, không dựa trên bất kỳ thứ tự tuyến tính cố định nào, mà tổ chức dữ liệu theo độ gần được đo bằng chính phép similarity phù hợp với bài toán, thông qua cấu trúc đồ thị các điểm được nối với hàng xóm gần nhau, thay vì cây được sắp xếp theo một tiêu chí thứ tự duy nhất.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Có cách nào ép vector vào B-tree được không, ví dụ sắp theo độ lớn norm hoặc theo một chiều cụ thể nào đó?"**

Về mặt kỹ thuật có thể ép được, nhưng kết quả sắp xếp đó sẽ không phản ánh đúng độ liên quan ngữ nghĩa mà hệ thống cần. Sau khi chuẩn hóa L2, độ lớn của mọi vector đều bằng nhau nên không còn giá trị phân biệt gì để sắp xếp. Nếu sắp theo một chiều bất kỳ trong 512 chiều, thứ tự thu được cũng chỉ phản ánh đúng một khía cạnh rất nhỏ và ngẫu nhiên của không gian ngữ nghĩa, hoàn toàn không tương ứng với mức độ liên quan tổng thể mà cosine similarity đo được trên toàn bộ 512 chiều cùng lúc. Đây là lý do các cấu trúc chỉ mục cho vector cần một cách tiếp cận khác hẳn B-tree, dựa trên độ gần thay vì thứ tự tuyến tính.

**Nếu hội đồng hỏi: "Vậy B-tree có hoàn toàn vô dụng đối với hệ thống SISE không?"**

Không, B-tree vẫn đóng vai trò quan trọng cho các cột dữ liệu quan hệ thông thường trong hệ thống, như khóa chính, thời gian tải lên, hay các trường dùng để lọc và sắp xếp theo tiêu chí có thứ tự tuyến tính rõ ràng. Đây chính là lợi thế của việc dùng pgvector, cho phép chỉ mục B-tree của PostgreSQL cho các cột quan hệ thông thường và chỉ mục HNSW cho cột vector cùng tồn tại trong một hệ quản trị duy nhất, phục vụ đúng loại truy vấn phù hợp với từng loại dữ liệu, thay vì cố ép mọi loại dữ liệu vào cùng một cấu trúc chỉ mục.

---

# Câu trả lời hoàn chỉnh — Câu 9, Cấp độ 3 

*"Giả sử SISE phát triển tới quy mô hàng chục triệu ảnh. Trình bày chiến lược mở rộng theo từng bước (không nhảy thẳng sang thay đổi lớn), và giải thích vì sao 'chuyển hẳn sang Milvus, loại bỏ pgvector' không phải là quyết định hợp lý ngay cả khi hệ thống đã cần đến giải pháp phân tán."*

---

### Phần lõi — trả lời trực tiếp, đúng trọng tâm

Việc mở rộng SISE khi dữ liệu tăng lên quy mô hàng chục triệu ảnh nên đi theo hướng leo thang có chủ đích, thử các phương án chi phí thấp trước khi cân nhắc thay đổi lớn, thay vì nhảy thẳng sang một kiến trúc hoàn toàn khác.

Bước đầu tiên là tối ưu lại các tham số của chính index HNSW hiện có, điều chỉnh M, ef_construction, ef_search dựa trên đo đạc thực tế ở quy mô dữ liệu mới, vì nhiều vấn đề hiệu năng chỉ đơn giản do tham số chưa được tinh chỉnh phù hợp, chưa hẳn do giới hạn của công nghệ.

Nếu vẫn chưa đủ, bước tiếp theo là các giải pháp mở rộng vẫn nằm trong hệ sinh thái PostgreSQL, như partitioning dữ liệu theo tiêu chí hợp lý, hoặc dùng các extension hỗ trợ mở rộng theo chiều ngang như Citus. Những giải pháp này có chi phí chuyển đổi thấp vì không cần thay đổi công nghệ nền tảng, chỉ mở rộng năng lực của công nghệ đang dùng.

Chỉ khi cả hai bước trên không đáp ứng được mới cần cân nhắc kiến trúc phân tán chuyên dụng. Ngay cả khi đó, quyết định đúng không phải là loại bỏ hoàn toàn pgvector để thay bằng Milvus, mà là áp dụng mô hình đa dạng hóa lưu trữ, gọi là polyglot persistence: PostgreSQL và pgvector tiếp tục giữ vai trò lưu trữ toàn bộ metadata quan hệ, tận dụng đúng thế mạnh về tính toàn vẹn giao dịch và khả năng truy vấn quan hệ phức tạp mà nó đã đảm nhiệm tốt từ đầu, còn một hệ vector chuyên dụng như Milvus chỉ đảm nhận riêng phần tìm kiếm vector ở quy mô lớn, được đồng bộ dữ liệu từ nguồn chính.

Lý do "chuyển hẳn sang Milvus, loại bỏ pgvector" không hợp lý nằm ở việc điều đó đánh đổi bỏ đi thế mạnh mà PostgreSQL vẫn đang phục vụ tốt, chỉ để giải quyết đúng một phần của hệ thống thực sự cần mở rộng là tìm kiếm vector. Milvus không được thiết kế tối ưu cho việc quản lý dữ liệu quan hệ phức tạp như quyền truy cập người dùng hay quan hệ giữa album và ảnh, nên việc ép toàn bộ hệ thống vào một công nghệ duy nhất chỉ vì một phần của nó cần mở rộng quy mô là một đánh đổi không cân xứng, tốn kém hơn nhiều so với việc kết hợp đúng công nghệ phù hợp cho từng loại dữ liệu.

---

### Phần "rào trước rào sau" — chủ động trả lời các câu hỏi vặn tiềm ẩn

**Nếu hội đồng hỏi: "Việc đồng bộ dữ liệu giữa PostgreSQL và Milvus trong mô hình polyglot persistence có phức tạp không, có đáng để đánh đổi không?"**

Việc đồng bộ chắc chắn thêm một lớp phức tạp so với hệ thống một công nghệ duy nhất, nhưng đây là chi phí chỉ phát sinh khi thực sự cần thiết, tức khi dữ liệu đã lớn tới mức các bước tối ưu rẻ hơn không còn đáp ứng được. So với việc ép toàn bộ hệ thống, bao gồm cả phần quan hệ phức tạp, vào một công nghệ vốn không được tối ưu cho việc đó, chi phí đồng bộ giữa hai hệ thống chuyên biệt thường vẫn thấp hơn về lâu dài, vì mỗi phần dữ liệu được xử lý bởi công nghệ phù hợp nhất với nó.

**Nếu hội đồng hỏi: "Milvus có phải lựa chọn duy nhất khi cần giải pháp phân tán không?"**

Không, Milvus không phải lựa chọn duy nhất hay mặc định tốt nhất. Còn nhiều lựa chọn khác như Weaviate, Qdrant, hay các dịch vụ vector trên nền tảng đám mây, mỗi giải pháp có đánh đổi riêng về chi phí vận hành và độ phức tạp triển khai. Quyết định cuối cùng cần dựa trên phân tích cụ thể về chi phí và lợi ích tại thời điểm hệ thống thực sự cần mở rộng, không nên xem bất kỳ công nghệ nào là mặc định phải chọn chỉ vì nó phổ biến.

---
