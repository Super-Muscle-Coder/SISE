# CHƯƠNG 1. GIỚI THIỆU ĐỀ TÀI

**Mục tiêu Chương 1:** Em giới thiệu bối cảnh hình thành đề tài, xác định vấn đề cần giải quyết, trình bày mục tiêu, đối tượng, phạm vi và giới hạn của nghiên cứu, qua đó làm rõ định hướng xây dựng hệ thống SISE hỗ trợ image-to-image và text-to-image trên nền tảng web.

## 1.1. Bối cảnh nghiên cứu: 
  - **Mục tiêu viết:** Em làm rõ nguyên nhân lựa chọn đề tài, 
  - **Nội dung cần trình bày:** sự gia tăng nhanh chóng của dữ liệu hình ảnh trên internet, mạng xã hội, thương mại điện tử và các hệ thống lưu trữ số, nhu cầu quản lý và tìm kiếm hình ảnh hiệu quả, sự phát triển của trí tuệ nhân tạo và mô hình đa phương thức, nhu cầu xây dựng phương pháp tìm kiếm ảnh dựa trên nội dung và ngữ nghĩa thay vì chỉ dựa vào tên tệp hoặc từ khóa.

## 1.2. Vấn đề nghiên cứu: 
  - **Mục tiêu viết:** Em xác định những hạn chế mà đề tài cần giải quyết, 
  - **Nội dung cần trình bày:** phương pháp tìm kiếm truyền thống phụ thuộc vào từ khóa, nhãn, caption và metadata, dữ liệu mô tả có thể thiếu, không chính xác hoặc không phản ánh đầy đủ nội dung ảnh, người dùng gặp khó khăn khi không biết tên ảnh hoặc từ khóa phù hợp, nhu cầu tìm kiếm bằng ảnh mẫu và câu mô tả tự nhiên, yêu cầu xây dựng hệ thống có khả năng trả về top-k ảnh liên quan với thời gian phản hồi phù hợp.

## 1.3. Mục tiêu nghiên cứu: 
  - **Mục tiêu viết:** Em trình bày những kết quả tổng quát và cụ thể mà khóa luận hướng đến, 
  - **Nội dung cần trình bày:** mục tiêu xây dựng prototype tìm kiếm ảnh thông minh, các nhiệm vụ nghiên cứu lý thuyết, thiết kế hệ thống, triển khai ứng dụng và thực nghiệm đánh giá.

### 1.3.1. Mục tiêu tổng quát: 
  - **Mục tiêu viết:** Em khái quát kết quả chính của toàn bộ khóa luận, 
  - **Nội dung cần trình bày:** nghiên cứu, thiết kế, xây dựng và đánh giá prototype hệ thống tìm kiếm ảnh thông minh SISE trên nền tảng web, hỗ trợ truy vấn bằng hình ảnh và truy vấn bằng văn bản, sử dụng CLIP để sinh embedding, cơ sở dữ liệu vector và HNSW để thực hiện truy vấn nhanh.

### 1.3.2. Mục tiêu cụ thể: 
  - **Mục tiêu viết:** Em chuyển mục tiêu tổng quát thành các nhiệm vụ có thể thực hiện và đánh giá, 
  - **Nội dung cần trình bày:** nghiên cứu CBIR, truy vấn văn bản, truy vấn đa phương thức, embedding, contrastive learning, CLIP, ANN và cơ sở dữ liệu vector, xây dựng chức năng upload và lập chỉ mục ảnh, xây dựng image-to-image và text-to-image, xây dựng backend API và giao diện web, triển khai bằng Docker Compose, đánh giá bằng Precision@k, Recall@k, HitRate@k, MRR, Latency và mức sử dụng tài nguyên.

## 1.4. Đối tượng, phạm vi và giới hạn nghiên cứu: 
  - **Mục tiêu viết:** Em xác định rõ nội dung được nghiên cứu và những nội dung nằm ngoài phạm vi, 
  - **Nội dung cần trình bày:** đối tượng lý thuyết, chức năng cốt lõi, công nghệ triển khai, môi trường thử nghiệm và các giới hạn của prototype.

### 1.4.1. Đối tượng nghiên cứu: 
  - **Mục tiêu viết:** Em xác định các thành phần khoa học và kỹ thuật được khảo sát, 
  - **Nội dung cần trình bày:** phương pháp truy vấn ảnh dựa trên nội dung, văn bản và đa phương thức, phương pháp biểu diễn embedding cho ảnh và văn bản, CLIP pre-trained, HNSW, cosine similarity, cơ sở dữ liệu vector, kiến trúc web và các chỉ số đánh giá retrieval cùng hiệu năng.

### 1.4.2. Phạm vi chức năng của hệ thống: 
  - **Mục tiêu viết:** Em giới hạn các chức năng hệ thống cần xây dựng, 
  - **Nội dung cần trình bày:** tải lên và lập chỉ mục ảnh, lưu ảnh cùng metadata cơ bản, truy vấn bằng hình ảnh, truy vấn bằng văn bản, trả về top-k kết quả, hiển thị điểm tương đồng và metadata, hỗ trợ ghi nhận dữ liệu thực nghiệm, các chức năng album cá nhân, Public, Private, Friends và global wall chỉ được xem là mở rộng.

### 1.4.3. Phạm vi công nghệ và triển khai: 
  - **Mục tiêu viết:** Em xác định bộ công nghệ cốt lõi của đề tài, 
  - **Nội dung cần trình bày:** sử dụng CLIP pre-trained làm mô hình embedding chính, lựa chọn một cơ sở dữ liệu vector cụ thể, sử dụng HNSW làm ANN chính, cosine similarity làm độ đo chính, web app làm giao diện người dùng, Docker Compose làm hình thức triển khai, hệ thống chạy trên máy cục bộ hoặc server thử nghiệm.

### 1.4.4. Giới hạn nghiên cứu: 
  - **Mục tiêu viết:** Em trình bày trung thực những giới hạn của khóa luận, 
  - **Nội dung cần trình bày:** hệ thống chỉ ở mức prototype, chưa phải sản phẩm cấp doanh nghiệp, không huấn luyện mô hình lớn từ đầu, dữ liệu và phần cứng thử nghiệm còn giới hạn, mobile app chưa thuộc phạm vi chính, privacy-aware search chỉ ở mức metadata filter cơ bản, Auth nâng cao, CI/CD, cache, monitoring và reverse proxy không phải trọng tâm.

## 1.5. Cấu trúc báo cáo: 
  - **Mục tiêu viết:** Em giúp người đọc nắm được cách tổ chức khóa luận, 
  - **Nội dung cần trình bày:** Chương 1 giới thiệu đề tài, Chương 2 trình bày lý thuyết và nghiên cứu liên quan, Chương 3 phân tích yêu cầu và mô hình đề xuất, Chương 4 trình bày phương pháp và thiết kế, Chương 5 mô tả thực nghiệm, Chương 6 trình bày kết quả và thảo luận, Chương 7 kết luận và đề xuất hướng phát triển.

# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ TỔNG QUAN NGHIÊN CỨU

**Mục tiêu Chương 2:** Em trình bày nền tảng lý thuyết phục vụ trực tiếp cho đề tài, tổng hợp nghiên cứu liên quan và tạo căn cứ lựa chọn CLIP, một cơ sở dữ liệu vector, HNSW và cosine similarity làm phương pháp chính.

## 2.1. Tổng quan về các phương pháp truy vấn ảnh: 
  - **Mục tiêu viết:** Em giới thiệu và so sánh những phương pháp tìm kiếm ảnh có liên quan đến đề tài, 
  - **Nội dung cần trình bày:** CBIR, tìm kiếm dựa trên văn bản, truy vấn đa phương thức, dữ liệu đầu vào, nguyên lý hoạt động, ưu điểm, hạn chế và khả năng hỗ trợ hai chế độ truy vấn của SISE.

### 2.1.1. Truy vấn ảnh dựa trên nội dung: 
  - **Mục tiêu viết:** Em làm rõ phương pháp tìm ảnh dựa trên đặc điểm trực quan của chính hình ảnh, 
  - **Nội dung cần trình bày:** khái niệm CBIR, đặc trưng màu sắc, hình dạng, kết cấu và đặc trưng học sâu, quy trình trích xuất đặc trưng, biểu diễn vector, so sánh, xếp hạng và trả kết quả, ưu điểm giảm phụ thuộc vào metadata, hạn chế phụ thuộc vào chất lượng đặc trưng.

### 2.1.2. Truy vấn ảnh dựa trên văn bản: 
  - **Mục tiêu viết:** Em phân tích phương pháp tìm ảnh thông qua dữ liệu mô tả, 
  - **Nội dung cần trình bày:** tên tệp, từ khóa, nhãn, caption, metadata, cách so khớp câu truy vấn với dữ liệu mô tả, ưu điểm dễ sử dụng, hạn chế khi dữ liệu mô tả thiếu hoặc không chính xác, phân biệt tìm kiếm từ khóa truyền thống với text-to-image bằng embedding.

### 2.1.3. Truy vấn ảnh đa phương thức: 
  - **Mục tiêu viết:** Em giải thích nhu cầu sử dụng đồng thời hình ảnh và văn bản trong một hệ thống, 
  - **Nội dung cần trình bày:** khái niệm multimodal retrieval, image-to-image, text-to-image, ưu điểm so với phương pháp đơn phương thức, yêu cầu liên kết thông tin trực quan và ngữ nghĩa, vai trò của không gian vector chung.

## 2.2. Biểu diễn dữ liệu và không gian vector chung: 
  - **Mục tiêu viết:** Em giải thích cách hình ảnh và văn bản được chuyển thành vector để có thể lưu trữ và so sánh, 
  - **Nội dung cần trình bày:** embedding, image encoder, text encoder, vector nhiều chiều, không gian biểu diễn, khoảng cách và độ tương đồng.

### 2.2.1. Embedding cho hình ảnh và văn bản: 
  - **Mục tiêu viết:** Em làm rõ vai trò của embedding trong hệ thống truy vấn, 
  - **Nội dung cần trình bày:** khái niệm vector đặc trưng và embedding, cách ảnh được chuyển thành image embedding, cách văn bản được chuyển thành text embedding, vai trò của embedding trong lập chỉ mục, lưu trữ, tính độ tương đồng và xếp hạng kết quả.

### 2.2.2. Không gian biểu diễn chung cho hình ảnh và văn bản: 
  - **Mục tiêu viết:** Em giải thích vì sao văn bản có thể được sử dụng để tìm kiếm hình ảnh, 
  - **Nội dung cần trình bày:** khái niệm không gian vector chung, các cặp ảnh và văn bản liên quan được biểu diễn gần nhau, các cặp không liên quan được biểu diễn xa nhau, vai trò đối với text-to-image, khả năng so sánh image embedding trong image-to-image, ý nghĩa của chuẩn hóa vector.

## 2.3. Học tương phản và mô hình CLIP: 
  - **Mục tiêu viết:** Em trình bày nền tảng học tương phản và cách CLIP học mối quan hệ giữa ảnh với văn bản, 
  - **Nội dung cần trình bày:** cặp mẫu dương, cặp mẫu âm, image encoder, text encoder, không gian embedding chung và ứng dụng truy vấn.

### 2.3.1. Nguyên lý học tương phản: 
  - **Mục tiêu viết:** Em giải thích cơ chế học giúp mô hình liên kết dữ liệu đa phương thức, 
  - **Nội dung cần trình bày:** contrastive learning, cặp mẫu dương và âm, nguyên tắc đưa dữ liệu liên quan lại gần nhau, đẩy dữ liệu không liên quan ra xa nhau, vai trò của hàm mất mát tương phản, mối liên hệ với CLIP.

### 2.3.2. Kiến trúc và nguyên lý hoạt động của CLIP: 
  - **Mục tiêu viết:** Em trình bày cách CLIP tạo embedding cho hình ảnh và văn bản, 
  - **Nội dung cần trình bày:** image encoder, text encoder, tiền xử lý ảnh, tokenization văn bản, sinh image embedding, sinh text embedding, tính độ tương đồng, đặc điểm mô hình pre-trained.

### 2.3.3. Ứng dụng CLIP trong truy vấn ảnh: 
  - **Mục tiêu viết:** Em làm rõ vai trò thực tế của CLIP trong SISE, 
  - **Nội dung cần trình bày:** sinh image embedding cho image-to-image, sinh text embedding cho text-to-image, so sánh với image embedding đã lưu, xếp hạng top-k, ưu điểm về truy vấn đa phương thức, hạn chế do miền dữ liệu, câu truy vấn mơ hồ và chi tiết ảnh nhỏ.

### 2.3.4. Lý do lựa chọn CLIP làm mô hình nền tảng: 
  - **Mục tiêu viết:** Em chứng minh lựa chọn CLIP phù hợp với mục tiêu và nguồn lực của khóa luận, 
  - **Nội dung cần trình bày:** CNN và ViT thuần ảnh không hỗ trợ trực tiếp văn bản, CLIP có cả image encoder và text encoder, hỗ trợ hai chế độ truy vấn trong cùng một không gian, CLIP pre-trained giúp giảm nhu cầu dữ liệu và tài nguyên huấn luyện, phù hợp với prototype, ResNet và ViT chỉ dùng để so sánh lý thuyết.

## 2.4. Tìm kiếm láng giềng gần đúng và độ đo tương đồng: 
  - **Mục tiêu viết:** Em trình bày cách hệ thống tìm các vector gần nhất và lý do sử dụng ANN, 
  - **Nội dung cần trình bày:** nearest neighbor, brute-force, HNSW, IVF, cosine similarity, L2, tốc độ, chất lượng và sự đánh đổi.

### 2.4.1. Tìm kiếm láng giềng gần nhất và hạn chế của brute-force: 
  - **Mục tiêu viết:** Em làm rõ hạn chế của việc so sánh toàn bộ vector, 
  - **Nội dung cần trình bày:** nearest neighbor search, cách brute-force tính độ tương đồng với toàn bộ dữ liệu, ưu điểm về tính đầy đủ, hạn chế về thời gian và tài nguyên khi dữ liệu tăng, nhu cầu sử dụng ANN.

### 2.4.2. Thuật toán HNSW: 
  - **Mục tiêu viết:** Em giải thích thuật toán ANN chính được lựa chọn, 
  - **Nội dung cần trình bày:** tên đầy đủ Hierarchical Navigable Small World, cấu trúc đồ thị nhiều tầng, cách tìm kiếm từ tầng cao xuống tầng thấp, ưu điểm về tốc độ, chất lượng tương đối cao, chi phí bộ nhớ, sự đánh đổi giữa tốc độ và độ chính xác.

### 2.4.3. Thuật toán IVF và một số phương pháp ANN khác: 
  - **Mục tiêu viết:** Em tạo cơ sở tham khảo và so sánh với HNSW, 
  - **Nội dung cần trình bày:** nguyên lý phân chia không gian vector thành cụm, tìm kiếm trong các cụm gần nhất, ưu điểm và hạn chế của IVF, so sánh khái quát với HNSW, các phương pháp khác chỉ được nêu ở mức literature review, không xem là hướng triển khai chính.

### 2.4.4. Độ đo tương đồng trong không gian vector: 
  - **Mục tiêu viết:** Em giải thích cách xác định mức độ gần nhau giữa vector truy vấn và vector dữ liệu, 
  - **Nội dung cần trình bày:** cosine similarity, khoảng cách L2, sự khác nhau giữa đo góc và đo khoảng cách tuyệt đối, vai trò của chuẩn hóa vector, cách xếp hạng top-k, lý do chọn cosine similarity cho CLIP embedding.

## 2.5. Cơ sở dữ liệu vector và quản trị dữ liệu ảnh: 
  - **Mục tiêu viết:** Em trình bày vai trò của nền tảng lưu trữ và tìm kiếm vector, 
  - **Nội dung cần trình bày:** lưu vector nhiều chiều, quản lý chỉ mục ANN, metadata, truy vấn top-k, lọc dữ liệu và liên kết ảnh gốc.

### 2.5.1. Vai trò của cơ sở dữ liệu vector trong hệ thống truy vấn: 
  - **Mục tiêu viết:** Em làm rõ lý do không chỉ sử dụng cơ sở dữ liệu quan hệ truyền thống, 
  - **Nội dung cần trình bày:** khả năng lưu vector, xây dựng chỉ mục, tìm kiếm top-k, quản lý metadata, lọc theo điều kiện, liên kết image ID với ảnh gốc, vai trò trong kiến trúc SISE.

### 2.5.2. Một số nền tảng cơ sở dữ liệu vector phổ biến: 
  - **Mục tiêu viết:** Em giới thiệu những nền tảng có thể được xem xét trước khi lựa chọn công cụ chính, 
  - **Nội dung cần trình bày:** Milvus, Qdrant, FAISS, Pinecone hoặc Elasticsearch ở mức tham khảo, hỗ trợ HNSW, cosine similarity, metadata, Docker, tích hợp backend, ưu điểm và hạn chế tổng quát.

### 2.5.3. Tiêu chí lựa chọn nền tảng cho hệ thống: 
  - **Mục tiêu viết:** Em xác định căn cứ lựa chọn một công cụ duy nhất cho Chương 4, 
  - **Nội dung cần trình bày:** hỗ trợ HNSW, cosine similarity, metadata filter, Docker, khả năng tích hợp API, yêu cầu tài nguyên, tài liệu kỹ thuật, khả năng tái lập và mức độ phù hợp với prototype.

## 2.6. Tổng quan nghiên cứu liên quan và định hướng phương pháp: 
  - **Mục tiêu viết:** Em tổng hợp tài liệu trước đây và chốt hướng tiếp cận của đề tài, 
  - **Nội dung cần trình bày:** phương pháp, bộ dữ liệu, mô hình, chỉ số, kết quả, hạn chế và nội dung khóa luận kế thừa.

### 2.6.1. Các nghiên cứu về truy vấn ảnh và CLIP: 
  - **Mục tiêu viết:** Em phân tích xu hướng phát triển từ CBIR đến truy vấn đa phương thức, 
  - **Nội dung cần trình bày:** tác giả và năm, bài toán, dữ liệu, phương pháp, mô hình CLIP pre-trained hoặc fine-tuned, chỉ số đánh giá, kết quả chính, hạn chế và khả năng áp dụng cho đề tài.

### 2.6.2. Các nghiên cứu về ANN và cơ sở dữ liệu vector: 
  - **Mục tiêu viết:** Em tổng hợp nghiên cứu về tăng tốc tìm kiếm vector, 
  - **Nội dung cần trình bày:** brute-force, HNSW, IVF, vector database, quy mô dữ liệu, latency, chất lượng retrieval, tài nguyên, ưu điểm và giới hạn của từng hướng.

### 2.6.3. Tổng hợp và định hướng phương pháp của đề tài: 
  - **Mục tiêu viết:** Em đưa ra quyết định phương pháp dựa trên lý thuyết và nghiên cứu liên quan, 
  - **Nội dung cần trình bày:** những nội dung được kế thừa, lý do chọn CLIP pre-trained, một vector database cụ thể, HNSW và cosine similarity, web app và Docker Compose, không tuyên bố đề xuất thuật toán mới nếu đề tài chỉ tích hợp và đánh giá các công nghệ hiện có.

# CHƯƠNG 3. PHÂN TÍCH YÊU CẦU VÀ MÔ HÌNH ĐỀ XUẤT

**Mục tiêu Chương 3:** Em chuyển bài toán nghiên cứu thành các yêu cầu chức năng, yêu cầu kỹ thuật và kiến trúc tổng thể của hệ thống, đúng bốn nhóm nội dung thầy yêu cầu.

## 3.1. Bài toán và mục tiêu nghiên cứu: 
  - **Mục tiêu viết:** Em xác định rõ hệ thống cần giải quyết bài toán gì và hoạt động trong phạm vi nào, 
  - **Nội dung cần trình bày:** đầu vào, đầu ra, hai chế độ truy vấn, quá trình xử lý tổng quát và giới hạn prototype.

### 3.1.1. Phát biểu bài toán tìm kiếm ảnh thông minh: 
  - **Mục tiêu viết:** Em mô hình hóa vấn đề nghiên cứu thành bài toán hệ thống, 
  - **Nội dung cần trình bày:** người dùng gửi ảnh hoặc văn bản, dữ liệu được chuyển thành embedding, vector được truy vấn trong cơ sở dữ liệu vector, hệ thống trả về top-k ảnh liên quan, yêu cầu cân bằng chất lượng và tốc độ.

### 3.1.2. Hai chế độ truy vấn của hệ thống: 
  - **Mục tiêu viết:** Em làm rõ hai chức năng cốt lõi, 
  - **Nội dung cần trình bày:** image-to-image nhận ảnh làm đầu vào và sinh image embedding, text-to-image nhận câu mô tả và sinh text embedding, hai chế độ sử dụng chung cơ sở dữ liệu image embedding và quy trình truy vấn top-k.

### 3.1.3. Phạm vi của hệ thống prototype: 
  - **Mục tiêu viết:** Em xác định ranh giới triển khai, 
  - **Nội dung cần trình bày:** web app là giao diện chính, hệ thống chạy trên máy cục bộ hoặc server thử nghiệm, không phải sản phẩm production-ready, mobile app và hạ tầng nâng cao thuộc hướng phát triển.

## 3.2. Yêu cầu chức năng của hệ thống: 
  - **Mục tiêu viết:** Em mô tả những chức năng bắt buộc của prototype, 
  - **Nội dung cần trình bày:** upload, indexing, quản lý dữ liệu ảnh, image-to-image, text-to-image, hiển thị top-k và metadata.

### 3.2.1. Chức năng tải lên, lập chỉ mục và quản lý dữ liệu ảnh: 
  - **Mục tiêu viết:** Em mô tả quá trình đưa ảnh mới vào hệ thống, 
  - **Nội dung cần trình bày:** nhận ảnh, kiểm tra định dạng, tiền xử lý, sinh embedding, lưu ảnh gốc, lưu vector và metadata, cập nhật chỉ mục, xem hoặc quản lý dữ liệu đã lập chỉ mục.

### 3.2.2. Chức năng truy vấn bằng hình ảnh: 
  - **Mục tiêu viết:** Em xác định yêu cầu của image-to-image, 
  - **Nội dung cần trình bày:** tải ảnh truy vấn, kiểm tra ảnh, sinh image embedding, tìm top-k vector gần nhất, lấy ảnh và metadata, sắp xếp theo điểm tương đồng.

### 3.2.3. Chức năng truy vấn bằng văn bản: 
  - **Mục tiêu viết:** Em xác định yêu cầu của text-to-image, 
  - **Nội dung cần trình bày:** nhập câu truy vấn, kiểm tra văn bản, tokenization, sinh text embedding, so sánh với image embedding, trả về top-k ảnh phù hợp.

### 3.2.4. Trả về và hiển thị kết quả: 
  - **Mục tiêu viết:** Em xác định định dạng đầu ra và cách người dùng tiếp nhận kết quả, 
  - **Nội dung cần trình bày:** ảnh kết quả, thứ hạng, điểm tương đồng, metadata, thời gian phản hồi nếu có, trạng thái xử lý, thông báo lỗi hoặc không có kết quả.

## 3.3. Yêu cầu kỹ thuật và tiêu chí đánh giá: 
  - **Mục tiêu viết:** Em xác định điều kiện kỹ thuật và bộ chỉ số dùng để kiểm chứng prototype, 
  - **Nội dung cần trình bày:** hiệu năng, khả năng mở rộng giới hạn, khả năng sử dụng, Docker và chỉ số đánh giá.

### 3.3.1. Yêu cầu về hiệu năng và khả năng mở rộng: 
  - **Mục tiêu viết:** Em xác định khả năng hoạt động cần thiết của hệ thống, 
  - **Nội dung cần trình bày:** thời gian phản hồi phù hợp, hỗ trợ tăng số lượng ảnh và vector, hoạt động ổn định trong các lần thử nghiệm, sử dụng ANN để hạn chế brute-force, chỉ đánh giá khả năng mở rộng trong phạm vi phần cứng và dữ liệu thử nghiệm.

### 3.3.2. Yêu cầu về khả năng sử dụng và triển khai: 
  - **Mục tiêu viết:** Em xác định yêu cầu để hệ thống dễ thao tác và dễ tái lập, 
  - **Nội dung cần trình bày:** giao diện rõ ràng, hai chế độ truy vấn dễ nhận biết, thao tác đơn giản, kết quả trực quan, Docker Compose khởi tạo các thành phần, chạy được trên máy cục bộ hoặc server thử nghiệm.

### 3.3.3. Tiêu chí đánh giá chất lượng truy vấn: 
  - **Mục tiêu viết:** Em xác định bộ chỉ số đánh giá mức độ liên quan của kết quả, 
  - **Nội dung cần trình bày:** Precision@k, Recall@k, HitRate@k, MRR, ground truth, giá trị k, chỉ số áp dụng cho từng chế độ, công thức chi tiết được trình bày ở Chương 5.

### 3.3.4. Tiêu chí đánh giá hiệu năng hệ thống: 
  - **Mục tiêu viết:** Em xác định cách kiểm tra tốc độ và tài nguyên của prototype, 
  - **Nội dung cần trình bày:** latency, thời gian sinh embedding, thời gian truy vấn vector nếu đo riêng, CPU, RAM, GPU nếu có, mức sử dụng tài nguyên theo số lượng vector, sự đánh đổi giữa tốc độ và chất lượng.

## 3.4. Kiến trúc tổng thể và mô hình hệ thống đề xuất: 
  - **Mục tiêu viết:** Em trình bày các thành phần chính và sự tương tác giữa chúng, 
  - **Nội dung cần trình bày:** frontend, backend API, embedding service, vector database, object storage, indexing pipeline và query pipeline.

### 3.4.1. Các thành phần chính của hệ thống: 
  - **Mục tiêu viết:** Em giải thích vai trò của từng thành phần, 
  - **Nội dung cần trình bày:** frontend tiếp nhận truy vấn và hiển thị kết quả, backend điều phối xử lý, embedding service sinh vector, vector database lưu và tìm kiếm vector, object storage lưu ảnh gốc.

### 3.4.2. Luồng lập chỉ mục dữ liệu ảnh: 
  - **Mục tiêu viết:** Em mô tả quá trình chuẩn bị dữ liệu để phục vụ truy vấn, 
  - **Nội dung cần trình bày:** upload ảnh, kiểm tra, tiền xử lý, sinh image embedding, lưu ảnh vào object storage, lưu vector và metadata, xây dựng hoặc cập nhật HNSW index.

### 3.4.3. Luồng xử lý truy vấn: 
  - **Mục tiêu viết:** Em mô tả đường đi của request từ người dùng đến kết quả, 
  - **Nội dung cần trình bày:** frontend gửi ảnh hoặc văn bản, backend chuyển đến embedding service, vector được gửi đến vector database, hệ thống tìm top-k, backend lấy metadata và ảnh, frontend hiển thị kết quả.

### 3.4.4. Phạm vi triển khai của mô hình đề xuất: 
  - **Mục tiêu viết:** Em làm rõ những thành phần được triển khai chính thức và những nội dung chỉ là mở rộng, 
  - **Nội dung cần trình bày:** web app, backend, embedding service, một vector database, object storage và Docker Compose là trọng tâm, metadata filter chỉ ở mức cơ bản, Auth, JWT, Friends, Profile, cache, CI/CD, reverse proxy và monitoring không phải trọng tâm.

# CHƯƠNG 4. PHƯƠNG PHÁP VÀ THIẾT KẾ HỆ THỐNG

**Mục tiêu Chương 4:** Em trình bày chi tiết phương pháp ứng dụng CLIP, thiết kế lưu trữ vector, backend API, giao diện web và cách triển khai hệ thống bằng Docker.

## 4.1. Ứng dụng mô hình CLIP và quy trình sinh embedding: 
  - **Mục tiêu viết:** Em mô tả cách hệ thống sử dụng CLIP pre-trained để chuyển ảnh và văn bản thành vector, 
  - **Nội dung cần trình bày:** lựa chọn mô hình, tiền xử lý, tokenization, inference, chuẩn hóa và đầu ra embedding.

### 4.1.1. Lựa chọn và cấu hình mô hình CLIP: 
  - **Mục tiêu viết:** Em xác định chính xác mô hình được sử dụng, 
  - **Nội dung cần trình bày:** phiên bản CLIP, image encoder, text encoder, kích thước embedding, framework, thiết bị CPU hoặc GPU, lý do lựa chọn, mô hình được sử dụng ở trạng thái pre-trained, chỉ fine-tune nếu có dữ liệu và thực nghiệm rõ ràng.

### 4.1.2. Tiền xử lý hình ảnh: 
  - **Mục tiêu viết:** Em mô tả cách chuẩn hóa ảnh trước khi đưa vào CLIP, 
  - **Nội dung cần trình bày:** kiểm tra định dạng, resize, crop nếu mô hình yêu cầu, normalize, chuyển tensor, batch inference, xử lý ảnh lỗi, đầu ra dữ liệu phù hợp với image encoder.

### 4.1.3. Xử lý văn bản và sinh text embedding: 
  - **Mục tiêu viết:** Em mô tả quy trình chuyển câu truy vấn thành vector, 
  - **Nội dung cần trình bày:** kiểm tra truy vấn rỗng, tokenization, giới hạn độ dài, chuyển token vào text encoder, sinh text embedding, chuẩn hóa vector, xử lý câu truy vấn không hợp lệ.

### 4.1.4. Pipeline trích xuất đặc trưng và AI inference service: 
  - **Mục tiêu viết:** Em trình bày toàn bộ pipeline sinh embedding và vai trò của dịch vụ suy luận, 
  - **Nội dung cần trình bày:** dữ liệu đầu vào, tiền xử lý, gọi image encoder hoặc text encoder, sinh vector, chuẩn hóa, chuyển vector về định dạng lưu trữ, batch inference khi lập chỉ mục, giao tiếp giữa backend và inference service.

## 4.2. Thiết kế lưu trữ vector và chiến lược truy vấn ANN: 
  - **Mục tiêu viết:** Em trình bày cách lưu vector, xây dựng HNSW index, quản lý metadata và thực hiện truy vấn top-k, 
  - **Nội dung cần trình bày:** một vector database chính, cosine similarity, metadata tối thiểu và object storage.

### 4.2.1. Lựa chọn cơ sở dữ liệu vector: 
  - **Mục tiêu viết:** Em giải thích lý do lựa chọn một nền tảng cụ thể, 
  - **Nội dung cần trình bày:** tên nền tảng được chọn, hỗ trợ HNSW, cosine similarity, metadata filter, Docker, tích hợp backend, yêu cầu tài nguyên, ưu điểm và hạn chế, các nền tảng khác chỉ dùng để tham khảo.

### 4.2.2. Thiết kế chỉ mục HNSW: 
  - **Mục tiêu viết:** Em mô tả cấu hình ANN chính của hệ thống, 
  - **Nội dung cần trình bày:** cách tạo index, các tham số HNSW được sử dụng, ý nghĩa của tham số, ảnh hưởng đến thời gian xây dựng index, latency, bộ nhớ và chất lượng, căn cứ lựa chọn cấu hình.

### 4.2.3. Độ đo tương đồng và quản lý metadata: 
  - **Mục tiêu viết:** Em xác định cách xếp hạng kết quả và cấu trúc dữ liệu kèm theo vector, 
  - **Nội dung cần trình bày:** cosine similarity, chuẩn hóa vector, top-k, điểm tương đồng, image_id, đường dẫn ảnh, nhãn hoặc mô tả, thời gian thêm dữ liệu, cách liên kết vector với ảnh gốc.

### 4.2.4. Thiết kế lưu trữ dữ liệu ảnh: 
  - **Mục tiêu viết:** Em trình bày cách hệ thống lưu và truy xuất tệp ảnh gốc, 
  - **Nội dung cần trình bày:** object storage như MinIO nếu được sử dụng, bucket hoặc cấu trúc thư mục, quy tắc đặt tên, đường dẫn ảnh, liên kết với metadata, cách backend lấy ảnh để trả về frontend, không đi sâu reverse proxy hoặc domain mapping.

## 4.3. Thiết kế backend API và luồng xử lý: 
  - **Mục tiêu viết:** Em trình bày kiến trúc RESTful API, các mô-đun cốt lõi, workflow và dịch vụ đánh giá, 
  - **Nội dung cần trình bày:** Search API, Upload/Index API, Dataset/Metadata API, Evaluation API và pipeline từ request đến top-k kết quả.

### 4.3.1. Thiết kế RESTful API: 
  - **Mục tiêu viết:** Em xác định nguyên tắc giao tiếp giữa frontend và backend, 
  - **Nội dung cần trình bày:** phương thức GET, POST, PUT, PATCH hoặc DELETE tùy chức năng, endpoint, request, response, định dạng JSON, mã trạng thái, xử lý lỗi, cách API kết nối embedding service, vector database và object storage.

### 4.3.2. Tổ chức các mô-đun cốt lõi: 
  - **Mục tiêu viết:** Em mô tả cách backend được chia thành các chức năng chính, 
  - **Nội dung cần trình bày:** Search API tiếp nhận truy vấn và trả top-k, Upload/Index API thêm ảnh và vector, Dataset/Metadata API quản lý dữ liệu, Evaluation API hỗ trợ chạy thí nghiệm và lưu kết quả, Auth, JWT, Friends và Profile chỉ ở mức đơn giản hoặc loại khỏi phạm vi chính.

### 4.3.3. Quy trình xử lý yêu cầu truy vấn: 
  - **Mục tiêu viết:** Em trình bày pipeline xử lý request ở mức kỹ thuật, 
  - **Nội dung cần trình bày:** người dùng gửi ảnh hoặc văn bản, backend kiểm tra request, chuyển dữ liệu đến embedding service, nhận vector, gửi vector đến vector database, HNSW tìm top-k, backend lấy metadata và đường dẫn ảnh, chuẩn hóa response, trả kết quả cho frontend.

### 4.3.4. Dịch vụ đánh giá hệ thống: 
  - **Mục tiêu viết:** Em mô tả chức năng hỗ trợ thu thập dữ liệu thực nghiệm, 
  - **Nội dung cần trình bày:** nhận tập truy vấn, chạy tự động image-to-image và text-to-image, ghi nhận top-k, thứ hạng, điểm tương đồng, latency, liên kết với ground truth, xuất dữ liệu phục vụ tính Precision@k, Recall@k, HitRate@k và MRR, re-ranking chỉ được nêu như mở rộng nếu chưa có thực nghiệm.

## 4.4. Thiết kế giao diện web và triển khai bằng Docker: 
  - **Mục tiêu viết:** Em trình bày cách người dùng tương tác với hệ thống và cách các thành phần được đóng gói, 
  - **Nội dung cần trình bày:** giao diện upload, ô tìm kiếm văn bản, kết quả top-k, Docker Compose, container, network, volume và môi trường chạy thử.

### 4.4.1. Thiết kế giao diện web: 
  - **Mục tiêu viết:** Em mô tả các màn hình và thao tác chính, 
  - **Nội dung cần trình bày:** trang upload và index dữ liệu, khu vực tải ảnh truy vấn, ô nhập văn bản, lựa chọn top-k, khu vực hiển thị ảnh kết quả, điểm tương đồng, metadata, trạng thái xử lý, thông báo lỗi và trang đánh giá cơ bản.

### 4.4.2. Kiến trúc triển khai bằng Docker Compose: 
  - **Mục tiêu viết:** Em giải thích cách các thành phần được đóng gói và kết nối, 
  - **Nội dung cần trình bày:** container frontend, backend, vector database, object storage, embedding service nếu tách riêng, Docker network, volume lưu dữ liệu, biến môi trường, thứ tự khởi động và khả năng tái lập.

### 4.4.3. Môi trường triển khai hệ thống prototype: 
  - **Mục tiêu viết:** Em xác định điều kiện hệ thống đã được chạy và kiểm chứng, 
  - **Nội dung cần trình bày:** máy cục bộ hoặc server thử nghiệm, hệ điều hành, CPU, GPU, RAM, phiên bản Docker, cách khởi động, địa chỉ truy cập, giới hạn môi trường, không khẳng định production-ready.

# CHƯƠNG 5. THỰC NGHIỆM VÀ ĐÁNH GIÁ

**Mục tiêu Chương 5:** Em mô tả rõ bộ dữ liệu, cấu hình, quy trình thực nghiệm và cách tính các chỉ số, không trình bày kết quả phân tích thay cho Chương 6.

## 5.1. Bộ dữ liệu thực nghiệm: 
  - **Mục tiêu viết:** Em trình bày nguồn dữ liệu, quá trình chuẩn bị và cách xây dựng ground truth, 
  - **Nội dung cần trình bày:** số lượng ảnh, loại ảnh, truy vấn hình ảnh, truy vấn văn bản và dữ liệu đúng dùng để đánh giá.

### 5.1.1. Nguồn và đặc điểm của bộ dữ liệu: 
  - **Mục tiêu viết:** Em giúp người đọc hiểu dữ liệu được sử dụng trong thực nghiệm, 
  - **Nội dung cần trình bày:** tên hoặc nguồn dữ liệu, số lượng ảnh, nhóm chủ đề, định dạng, kích thước, nhãn hoặc caption, mức độ đa dạng, điều kiện sử dụng, sự phù hợp với image-to-image và text-to-image.

### 5.1.2. Quy trình chuẩn bị dữ liệu: 
  - **Mục tiêu viết:** Em mô tả cách chuyển dữ liệu thô thành dữ liệu sẵn sàng lập chỉ mục, 
  - **Nội dung cần trình bày:** kiểm tra ảnh lỗi, loại ảnh trùng, chuẩn hóa image_id, xử lý metadata, tiền xử lý ảnh, sinh embedding, lưu vector, lưu ảnh gốc, xây dựng HNSW index và kiểm tra tính liên kết.

### 5.1.3. Xây dựng tập truy vấn và ground truth: 
  - **Mục tiêu viết:** Em xác định căn cứ đánh giá kết quả đúng hoặc liên quan, 
  - **Nội dung cần trình bày:** số lượng truy vấn ảnh, số lượng truy vấn văn bản, cách chọn ảnh truy vấn, cách viết câu truy vấn, cách xác định ảnh liên quan, người tham gia đánh giá nếu có, xử lý bất đồng, lưu danh sách ground truth, hạn chế chủ quan.

## 5.2. Thiết lập thực nghiệm: 
  - **Mục tiêu viết:** Em mô tả đầy đủ môi trường và điều kiện để có thể tái lập thí nghiệm, 
  - **Nội dung cần trình bày:** phần cứng, phần mềm, mô hình, vector database, HNSW, top-k và số lần lặp.

### 5.2.1. Cấu hình phần cứng và phần mềm: 
  - **Mục tiêu viết:** Em xác định môi trường thực tế được sử dụng, 
  - **Nội dung cần trình bày:** CPU, GPU nếu có, RAM, ổ lưu trữ, hệ điều hành, Python, framework, phiên bản CLIP, phiên bản vector database, Docker và công cụ đo tài nguyên.

### 5.2.2. Cấu hình mô hình, cơ sở dữ liệu vector và chỉ mục: 
  - **Mục tiêu viết:** Em ghi nhận các tham số có ảnh hưởng đến kết quả, 
  - **Nội dung cần trình bày:** phiên bản CLIP, kích thước embedding, batch size, thiết bị inference, vector database, collection, cosine similarity, metadata, tham số HNSW và giá trị top-k.

### 5.2.3. Quy trình và điều kiện thực nghiệm: 
  - **Mục tiêu viết:** Em bảo đảm thí nghiệm được thực hiện nhất quán và có thể kiểm chứng, 
  - **Nội dung cần trình bày:** trình tự chạy thí nghiệm, số lần lặp, cách khởi động hoặc làm mới hệ thống, điều kiện giữ cố định, cách ghi nhận dữ liệu, cách kiểm soát cache và tải hệ thống, cách bảo đảm so sánh công bằng.

## 5.3. Thực nghiệm đánh giá chất lượng truy vấn: 
  - **Mục tiêu viết:** Em trình bày cách kiểm tra mức độ liên quan của kết quả trong hai chế độ, 
  - **Nội dung cần trình bày:** tập truy vấn, ground truth, top-k, Precision, Recall, HitRate và MRR.

### 5.3.1. Thực nghiệm truy vấn bằng hình ảnh: 
  - **Mục tiêu viết:** Em mô tả cách đánh giá image-to-image, 
  - **Nội dung cần trình bày:** số ảnh truy vấn, cách chọn ảnh, sinh image embedding, truy vấn top-k, đối chiếu ground truth, tính Precision@k, Recall@k và HitRate@k, cách tổng hợp kết quả.

### 5.3.2. Thực nghiệm truy vấn bằng văn bản: 
  - **Mục tiêu viết:** Em mô tả cách đánh giá text-to-image, 
  - **Nội dung cần trình bày:** số câu truy vấn, loại câu truy vấn, ngôn ngữ, tokenization, sinh text embedding, truy vấn top-k, đối chiếu ground truth, tính MRR, Precision@k và Recall@k.

### 5.3.3. Các chỉ số đánh giá chất lượng truy vấn: 
  - **Mục tiêu viết:** Em giải thích cách tính và ý nghĩa của bộ chỉ số, 
  - **Nội dung cần trình bày:** công thức Precision@k, Recall@k, HitRate@k và MRR, ký hiệu sử dụng, giá trị k, cách tính trên từng truy vấn và cách lấy trung bình toàn tập, ý nghĩa của giá trị cao hoặc thấp.

## 5.4. Thực nghiệm đánh giá hiệu năng hệ thống: 
  - **Mục tiêu viết:** Em trình bày cách đo tốc độ và tài nguyên khi quy mô dữ liệu thay đổi, 
  - **Nội dung cần trình bày:** latency, CPU, RAM, GPU nếu có và số lượng vector.

### 5.4.1. Đánh giá thời gian phản hồi theo quy mô dữ liệu: 
  - **Mục tiêu viết:** Em kiểm tra tác động của kích thước dữ liệu đến tốc độ truy vấn, 
  - **Nội dung cần trình bày:** các mức số lượng vector, điểm bắt đầu và kết thúc đo, tổng latency hoặc từng thành phần thời gian, số lần lặp, giá trị trung bình, trung vị hoặc độ lệch chuẩn nếu sử dụng, cách kiểm soát điều kiện đo.

### 5.4.2. Đánh giá mức sử dụng tài nguyên theo số lượng vector: 
  - **Mục tiêu viết:** Em xác định tài nguyên hệ thống cần dùng khi dữ liệu tăng, 
  - **Nội dung cần trình bày:** CPU, RAM, GPU, bộ nhớ lưu trữ nếu cần, công cụ đo, trạng thái không tải, quá trình lập chỉ mục, sinh embedding và truy vấn, cách tổng hợp dữ liệu.

## 5.5. Thực nghiệm so sánh cấu hình: 
  - **Mục tiêu viết:** Em kiểm chứng lợi ích của ANN và lựa chọn cấu hình phù hợp, 
  - **Nội dung cần trình bày:** chỉ thực hiện một hoặc hai phép so sánh có ý nghĩa, giữ cố định dữ liệu, mô hình, truy vấn, top-k và phần cứng.

### 5.5.1. So sánh brute-force và HNSW: 
  - **Mục tiêu viết:** Em đánh giá lợi ích của HNSW so với tìm kiếm toàn bộ, 
  - **Nội dung cần trình bày:** cấu hình hai phương pháp, latency, Precision@k, Recall@k hoặc HitRate@k, tài nguyên, quy mô dữ liệu, số lần lặp, cách bảo đảm điều kiện so sánh giống nhau.

### 5.5.2. So sánh một cấu hình bổ sung: 
  - **Mục tiêu viết:** Em kiểm tra thêm một yếu tố có ảnh hưởng rõ ràng đến hệ thống, 
  - **Nội dung cần trình bày:** hai cấu hình HNSW, các giá trị top-k, cosine similarity với L2 hoặc hai cấu hình CLIP nếu thực sự triển khai, biến được thay đổi, yếu tố giữ cố định, tiêu chí lựa chọn cấu hình cuối cùng, bỏ mục này nếu không có thí nghiệm thực tế.

# CHƯƠNG 6. KẾT QUẢ VÀ THẢO LUẬN

**Mục tiêu Chương 6:** Em trình bày bảng số liệu, biểu đồ, nhận xét kết quả, phân tích sự đánh đổi giữa chất lượng và tốc độ, đối chiếu với lý thuyết và nêu giới hạn của prototype.

## 6.1. Kết quả đánh giá chất lượng truy vấn: 
  - **Mục tiêu viết:** Em báo cáo và phân tích mức độ liên quan của kết quả trong hai chế độ, 
  - **Nội dung cần trình bày:** bảng chỉ số, biểu đồ, ví dụ truy vấn đúng và sai, xu hướng khi k thay đổi.

### 6.1.1. Kết quả truy vấn bằng hình ảnh: 
  - **Mục tiêu viết:** Em đánh giá khả năng tìm ảnh tương đồng từ một ảnh đầu vào, 
  - **Nội dung cần trình bày:** bảng Precision@k, Recall@k và HitRate@k, biểu đồ theo k, ảnh truy vấn, top-k kết quả, điểm tương đồng, trường hợp thành công, trường hợp nhầm lẫn và nguyên nhân có thể xảy ra.

### 6.1.2. Kết quả truy vấn bằng văn bản: 
  - **Mục tiêu viết:** Em đánh giá khả năng tìm ảnh phù hợp với câu mô tả, 
  - **Nội dung cần trình bày:** bảng MRR, Precision@k và Recall@k, biểu đồ, câu truy vấn minh họa, ảnh kết quả, vị trí của ảnh đúng đầu tiên, ảnh hưởng của độ dài, ngôn ngữ và mức độ rõ ràng của truy vấn.

## 6.2. Kết quả đánh giá hiệu năng hệ thống: 
  - **Mục tiêu viết:** Em trình bày tốc độ và mức sử dụng tài nguyên trong các điều kiện thử nghiệm, 
  - **Nội dung cần trình bày:** latency, CPU, RAM, GPU nếu có và xu hướng theo quy mô dữ liệu.

### 6.2.1. Kết quả về thời gian phản hồi: 
  - **Mục tiêu viết:** Em đánh giá hệ thống phản hồi nhanh đến mức nào, 
  - **Nội dung cần trình bày:** latency của image-to-image, latency của text-to-image, latency theo số lượng vector, thời gian embedding và truy vấn nếu đo riêng, thành phần chiếm thời gian lớn, mức độ đáp ứng yêu cầu prototype.

### 6.2.2. Kết quả về mức sử dụng tài nguyên: 
  - **Mục tiêu viết:** Em đánh giá chi phí tài nguyên khi hệ thống hoạt động, 
  - **Nội dung cần trình bày:** CPU, RAM, GPU, tài nguyên khi lập chỉ mục, sinh embedding và truy vấn, sự thay đổi khi dữ liệu tăng, thành phần tiêu thụ tài nguyên nhiều nhất, giới hạn phần cứng.

## 6.3. Kết quả so sánh và phân tích sự đánh đổi: 
  - **Mục tiêu viết:** Em làm rõ lợi ích và chi phí khi sử dụng ANN, 
  - **Nội dung cần trình bày:** tốc độ, chất lượng, tài nguyên, ảnh hưởng tham số và cấu hình phù hợp nhất.

### 6.3.1. So sánh brute-force và HNSW: 
  - **Mục tiêu viết:** Em xác định HNSW cải thiện hệ thống ở mức nào, 
  - **Nội dung cần trình bày:** latency của hai phương pháp, chất lượng retrieval, tài nguyên, mức cải thiện theo quy mô dữ liệu, trường hợp HNSW thể hiện lợi thế, mức suy giảm chất lượng nếu có.

### 6.3.2. Phân tích sự đánh đổi giữa chất lượng và tốc độ: 
  - **Mục tiêu viết:** Em xác định cấu hình tạo sự cân bằng phù hợp nhất, 
  - **Nội dung cần trình bày:** quan hệ giữa Precision, Recall, HitRate, MRR và latency, ảnh hưởng của top-k và tham số HNSW, mức xấp xỉ có thể chấp nhận, lý do lựa chọn cấu hình cuối cùng.

## 6.4. Thảo luận và đối chiếu với cơ sở lý thuyết: 
  - **Mục tiêu viết:** Em giải thích kết quả dựa trên CLIP, contrastive learning, ANN và nghiên cứu liên quan, 
  - **Nội dung cần trình bày:** sự phù hợp của mô hình, hiệu quả của HNSW, điểm tương đồng và khác biệt so với tài liệu trước.

### 6.4.1. Mức độ phù hợp của CLIP đối với truy vấn đa phương thức: 
  - **Mục tiêu viết:** Em đánh giá CLIP có đáp ứng hai chế độ truy vấn hay không, 
  - **Nội dung cần trình bày:** khả năng đưa ảnh và văn bản vào cùng không gian, kết quả image-to-image, kết quả text-to-image, trường hợp hiểu ngữ nghĩa tốt, hạn chế do dữ liệu, ngôn ngữ và chưa fine-tune.

### 6.4.2. Hiệu quả của HNSW và cơ sở dữ liệu vector: 
  - **Mục tiêu viết:** Em đánh giá vai trò của chiến lược truy vấn được chọn, 
  - **Nội dung cần trình bày:** khả năng giảm latency, ảnh hưởng đến chất lượng, vai trò quản lý vector, metadata và top-k, mức phù hợp của tham số, giới hạn về bộ nhớ và quy mô dữ liệu.

### 6.4.3. Đối chiếu với các nghiên cứu liên quan: 
  - **Mục tiêu viết:** Em đặt kết quả của khóa luận trong bối cảnh nghiên cứu trước, 
  - **Nội dung cần trình bày:** so sánh xu hướng kết quả, mô hình, bộ dữ liệu, chỉ số, quy mô, phần cứng và tham số, giải thích khác biệt, không khẳng định vượt trội khi điều kiện không tương đương.

## 6.5. Hạn chế của nghiên cứu và hệ thống prototype: 
  - **Mục tiêu viết:** Em trình bày trung thực những vấn đề chưa được giải quyết, 
  - **Nội dung cần trình bày:** dữ liệu chưa lớn hoặc chưa đa dạng, số truy vấn còn hạn chế, ground truth có thể chủ quan, CLIP chưa fine-tune, chỉ thử nghiệm trên một số cấu hình, giao diện mới ở mức demo, chưa đánh giá tải đồng thời lớn, chưa triển khai production, kết quả chỉ có giá trị trong phạm vi thử nghiệm.

# CHƯƠNG 7. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

**Mục tiêu Chương 7:** Em tổng kết cơ sở lý thuyết đã nghiên cứu, prototype đã xây dựng, kết quả đánh giá đã đạt được và đề xuất các hướng mở rộng phù hợp với hạn chế của hệ thống.

## 7.1. Kết luận nghiên cứu: 
  - **Mục tiêu viết:** Em tổng hợp ngắn gọn những kết quả quan trọng nhất của khóa luận, 
  - **Nội dung cần trình bày:** lý thuyết, hệ thống prototype, thực nghiệm, mức độ đạt mục tiêu và giới hạn chung.

### 7.1.1. Kết quả nghiên cứu cơ sở lý thuyết: 
  - **Mục tiêu viết:** Em xác nhận những nền tảng khoa học đã được nghiên cứu và áp dụng, 
  - **Nội dung cần trình bày:** CBIR, text-based retrieval, multimodal retrieval, embedding, contrastive learning, CLIP, ANN, HNSW, cosine similarity và cơ sở dữ liệu vector, vai trò của các nền tảng này đối với thiết kế hệ thống.

### 7.1.2. Kết quả xây dựng hệ thống prototype: 
  - **Mục tiêu viết:** Em tổng kết những thành phần và chức năng đã hoàn thành, 
  - **Nội dung cần trình bày:** web app, backend API, embedding service, vector database, HNSW, object storage, Docker Compose, upload và indexing, image-to-image, text-to-image, hiển thị top-k và metadata, chỉ nêu những phần thực sự đã triển khai.

### 7.1.3. Kết quả thực nghiệm và đánh giá hệ thống: 
  - **Mục tiêu viết:** Em khẳng định mức độ đáp ứng mục tiêu nghiên cứu dựa trên bằng chứng thực nghiệm, 
  - **Nội dung cần trình bày:** kết quả nổi bật về Precision@k, Recall@k, HitRate@k, MRR, latency và tài nguyên, kết quả so sánh brute-force với HNSW, khả năng hoạt động ổn định trong phạm vi thử nghiệm, không chép lại toàn bộ Chương 6.

## 7.2. Hướng phát triển trong tương lai: 
  - **Mục tiêu viết:** Em đề xuất những nội dung có thể tiếp tục nghiên cứu dựa trên hạn chế đã xác định, 
  - **Nội dung cần trình bày:** fine-tune, mobile app, quyền riêng tư, quản lý người dùng, tối ưu hiệu năng và triển khai mở rộng.

### 7.2.1. Fine-tune CLIP trên dữ liệu chuyên ngành: 
  - **Mục tiêu viết:** Em đề xuất cải thiện mức độ phù hợp của embedding đối với một miền dữ liệu cụ thể, 
  - **Nội dung cần trình bày:** thu thập cặp ảnh và văn bản chuyên ngành, làm sạch dữ liệu, fine-tune CLIP, so sánh với mô hình pre-trained, đánh giá bằng cùng bộ chỉ số, xem xét yêu cầu GPU và thời gian huấn luyện.

### 7.2.2. Bổ sung ứng dụng trên thiết bị di động: 
  - **Mục tiêu viết:** Em mở rộng khả năng tiếp cận của người dùng, 
  - **Nội dung cần trình bày:** phát triển mobile app, tái sử dụng backend API, hỗ trợ chụp ảnh trực tiếp, gửi ảnh truy vấn, hiển thị kết quả trên màn hình nhỏ, đồng bộ chức năng với web app.

### 7.2.3. Mở rộng tìm kiếm có kiểm soát quyền riêng tư và quản lý người dùng: 
  - **Mục tiêu viết:** Em đề xuất kiểm soát quyền truy cập dữ liệu tốt hơn, 
  - **Nội dung cần trình bày:** xác thực người dùng, phân quyền, metadata filter nâng cao, kiểm soát ảnh riêng tư, quản lý nhóm dữ liệu, nhật ký truy cập nếu cần, chỉ phát triển thành bài toán riêng khi có phương pháp và tiêu chí đánh giá rõ ràng.

### 7.2.4. Tối ưu hiệu năng và triển khai hệ thống: 
  - **Mục tiêu viết:** Em đề xuất nâng cao khả năng vận hành khi quy mô dữ liệu và số người dùng tăng, 
  - **Nội dung cần trình bày:** tối ưu batch inference, tham số HNSW, caching, tách embedding service, triển khai phân tán, cân bằng tải, logging, monitoring, CI/CD, reverse proxy và thử nghiệm trên môi trường server hoặc cloud.