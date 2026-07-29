# MỤC LỤC

- [DANH MỤC CÁC KÝ HIỆU, CHỮ VIẾT TẮT VÀ THUẬT NGỮ](#danh-mục-các-ký-hiệu-chữ-viết-tắt-và-thuật-ngữ)  
- [DANH MỤC CÁC BẢNG](#danh-mục-các-bảng)  
- [DANH MỤC CÁC HÌNH VẼ-ĐỒ-THỊ](#danh-mục-các-hình-vẽ-đồ-thị)  

## CHƯƠNG 1. GIỚI THIỆU ĐỀ TÀI
- 1.1. Bối cảnh nghiên cứu  
- 1.2. Vấn đề nghiên cứu  
- 1.3. Mục tiêu nghiên cứu  
  - 1.3.1. Mục tiêu tổng quát  
  - 1.3.2. Mục tiêu cụ thể  
- 1.4. Đối tượng, phạm vi và giới hạn nghiên cứu  
  - 1.4.1. Đối tượng nghiên cứu  
  - 1.4.2. Phạm vi chức năng của hệ thống  
  - 1.4.3. Phạm vi công nghệ và triển khai  
  - 1.4.4. Giới hạn nghiên cứu  
- 1.5. Cấu trúc báo cáo  

## CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ TỔNG QUAN NGHIÊN CỨU
- 2.1. Truy vấn ảnh dựa trên nội dung và học biểu diễn đa phương thức  
- 2.2. Tìm kiếm gần đúng và cơ sở dữ liệu vector  
- 2.3. Kiến trúc RESTful API và mô hình phân lớp hướng nghiệp vụ  
- 2.4. Containerization và triển khai hệ thống đa dịch vụ  

## CHƯƠNG 3. PHÂN TÍCH YÊU CẦU VÀ MÔ HÌNH ĐỀ XUẤT
- 3.1. Bài toán, mục tiêu nghiên cứu và phạm vi hệ thống  
- 3.2. Chức năng và quy trình xử lý dữ liệu  
- 3.3. Yêu cầu kỹ thuật, tiêu chí đánh giá và khả năng triển khai  
- 3.4. Kiến trúc tổng thể, mô hình hệ thống và pipeline xử lý  

## CHƯƠNG 4. PHƯƠNG PHÁP VÀ THIẾT KẾ HỆ THỐNG
- 4.1. Ứng dụng mô hình CLIP và quy trình sinh embedding  
- 4.2. Thiết kế lưu trữ vector và chiến lược truy vấn ANN  
- 4.3. Thiết kế backend API và luồng xử lý  
- 4.4. Thiết kế giao diện web và triển khai bằng Docker  

## CHƯƠNG 5. THỰC NGHIỆM VÀ ĐÁNH GIÁ
- 5.1. Bộ dữ liệu và ground truth thực nghiệm  
- 5.2. Thiết lập thực nghiệm và các chỉ số đánh giá  
- 5.3. Quy trình chạy thực nghiệm benchmark  

## CHƯƠNG 6. KẾT QUẢ VÀ THẢO LUẬN
- 6.1. Kết quả đánh giá chất lượng truy vấn  
- 6.2. Phân tích hiện tượng nhầm lẫn liên danh tính  
- 6.3. Thảo luận và giới hạn nghiên cứu  

## CHƯƠNG 7. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
- 7.1. Kết luận nghiên cứu  
- 7.2. Hướng phát triển trong tương lai  

## TÀI LIỆU THAM KHẢO

## PHỤ LỤC


# CHƯƠNG 1. GIỚI THIỆU ĐỀ TÀI

## 1.1. Bối cảnh nghiên cứu
Trong những năm gần đây, lượng dữ liệu hình ảnh trên Internet, các nền tảng mạng xã hội, thương mại điện tử và hệ thống lưu trữ số tăng trưởng rất nhanh. Điều này đã đặt ra nhu cầu cấp thiết về các phương pháp quản lý, tìm kiếm hình ảnh một cách hiệu quả và thuận tiện cho người dùng. Bên cạnh đó, sự phát triển mạnh mẽ của trí tuệ nhân tạo, đặc biệt là các mô hình đa phương thức, đã mở ra hướng tiếp cận mới cho bài toán truy vấn và khai thác dữ liệu hình ảnh. Thay vì chỉ dựa vào tên tệp, từ khóa hay các trường metadata vốn dễ thiếu sót hoặc không phản ánh đúng nội dung ảnh, ngày càng nhiều hệ thống hướng tới việc tìm kiếm dựa trên nội dung và ngữ nghĩa của hình ảnh. Đây cũng là lý do khiến đề tài xây dựng hệ thống hỗ trợ truy vấn ảnh theo cả hai hướng: image-to-image và text-to-image trở nên thiết thực và có ý nghĩa thực tiễn rõ rệt.  
Ngoài những yếu tố khách quan về mặt công nghệ và xu hướng phát triển của trí tuệ nhân tạo, bản thân chúng em cũng luôn có mong muốn được tìm tòi, tiếp cận và áp dụng những kiến thức mới vào thực tiễn. Chính vì vậy, việc chủ động học hỏi, nghiên cứu là điều cần thiết để sinh viên ngành công nghệ thông tin không bị bỏ lại phía sau. Ngoài ra, khi quan sát thực tế, chúng em nhận thấy nhu cầu tìm kiếm hình ảnh ngày càng đa dạng và phức tạp, không chỉ dừng lại ở việc tra cứu theo từ khóa đơn thuần. Sự thay đổi này đặt ra thách thức, đồng thời cũng là động lực để chúng em lựa chọn và phát triển đề tài này, và chúng em mong rằng sẽ góp phần nhỏ vào việc giải quyết những vấn đề thực tiễn của người dùng hiện đại.

## 1.2. Vấn đề nghiên cứu
Các phương pháp tìm kiếm hình ảnh truyền thống chủ yếu dựa vào các trường dữ liệu như từ khóa, nhãn hoặc mô tả đi kèm. Tuy nhiên, trong thực tế, những dữ liệu mô tả này không phải lúc nào cũng đầy đủ, chính xác hoặc phản ánh đúng nội dung của tệp ảnh. Người dùng cũng thường gặp khó khăn khi không nhớ tên ảnh hoặc không biết nên dùng từ khóa nào để tìm kiếm phù hợp. Vì vậy, nhu cầu tìm kiếm dựa trên ảnh mẫu hoặc thông qua các câu mô tả tự nhiên ngày càng rõ rệt. Để đáp ứng điều này, cần xây dựng hệ thống có khả năng trả về top-k hình ảnh liên quan với thời gian phản hồi phù hợp, đảm bảo tiện lợi và hiệu quả cho người sử dụng.

## 1.3. Mục tiêu nghiên cứu
Khóa luận này hướng đến việc xây dựng một prototype hệ thống tìm kiếm ảnh thông minh trên nền tảng web. Đề tài kết hợp giữa nhiệm vụ nghiên cứu lý thuyết, thiết kế hệ thống, triển khai ứng dụng thực tế và thực nghiệm đánh giá hiệu quả mô hình.

### 1.3.1. Mục tiêu tổng quát
Nghiên cứu, thiết kế, xây dựng và đánh giá prototype hệ thống tìm kiếm ảnh thông minh SISE trên nền tảng web, hỗ trợ truy vấn bằng hình ảnh và văn bản. Hệ thống sử dụng mô hình CLIP để sinh embedding cho ảnh và văn bản, áp dụng cơ sở dữ liệu vector và thuật toán HNSW để thực hiện truy vấn hiệu quả.

### 1.3.2. Mục tiêu cụ thể
Để đạt được mục tiêu nghiên cứu, khóa luận tập trung nghiên cứu các phương pháp truy vấn ảnh dựa trên nội dung (CBIR), truy vấn bằng văn bản và truy vấn đa phương thức. Bên cạnh đó, khóa luận tìm hiểu về embedding, contrastive learning, mô hình CLIP, các thuật toán ANN và cơ sở dữ liệu vector. Trên cơ sở đó, hệ thống được xây dựng với các chức năng upload và lập chỉ mục ảnh, đồng thời phát triển hai chế độ truy vấn image-to-image và text-to-image. Khóa luận cũng thiết kế backend API và giao diện web, sau đó triển khai hệ thống bằng Docker Compose. Cuối cùng, hệ thống được đánh giá dựa trên các chỉ số Precision@k, Recall@k, HitRate@k, MRR, Latency và mức sử dụng tài nguyên.

## 1.4. Đối tượng, phạm vi và giới hạn nghiên cứu

### 1.4.1. Đối tượng nghiên cứu
Khóa luận tập trung khảo sát các phương pháp truy vấn ảnh dựa trên nội dung, văn bản và đa phương thức; phương pháp biểu diễn embedding cho ảnh và văn bản, mô hình CLIP pre-trained, HNSW, cosine similarity, cơ sở dữ liệu vector, kiến trúc web và các chỉ số đánh giá khả năng truy xuất cũng như hiệu năng hệ thống.

### 1.4.2. Phạm vi chức năng của hệ thống
Hệ thống được xây dựng với các chức năng cốt lõi gồm: tải lên và lưu trữ ảnh cùng metadata cơ bản, truy vấn bằng hình ảnh, truy vấn bằng văn bản, trả về top-k kết quả, hiển thị điểm tương đồng và metadata, hỗ trợ ghi nhận dữ liệu thực nghiệm. Những chức năng như album cá nhân, chế độ Public, Private, Friends hay các chức năng nâng cao hơn như global wall được nhóm chúng em nhìn nhận như các tính năng mở rộng, không phải trọng tâm của khóa luận.

### 1.4.3. Phạm vi công nghệ và triển khai
Đề tài sử dụng mô hình CLIP pre-trained làm công cụ sinh embedding chính, lựa chọn một cơ sở dữ liệu vector cụ thể để lưu trữ và truy vấn, sử dụng HNSW làm thuật toán ANN chính, cosine similarity làm độ đo tương đồng, phát triển web app cho giao diện người dùng, triển khai hệ thống bằng Docker Compose. Toàn bộ hệ thống được thử nghiệm trên máy cục bộ.

### 1.4.4. Giới hạn nghiên cứu
Hệ thống trong khuôn khổ khóa luận chỉ dừng lại ở mức prototype, chưa phải sản phẩm hoàn chỉnh ở quy mô doanh nghiệp, không tiến hành huấn luyện mô hình lớn từ đầu, dữ liệu và phần cứng thử nghiệm còn hạn chế. Chức năng mobile app chưa thuộc phạm vi chính, privacy-aware search mới chỉ dừng lại ở mức lọc metadata cơ bản, các nội dung như Auth nâng cao, CI/CD, cache, monitoring và reverse proxy không phải trọng tâm nghiên cứu.

## 1.5. Cấu trúc báo cáo
Báo cáo được tổ chức thành 7 chương: Chương 1 giới thiệu đề tài, Chương 2 trình bày cơ sở lý thuyết và tổng quan nghiên cứu, Chương 3 phân tích yêu cầu và mô hình hệ thống đề xuất, Chương 4 trình bày phương pháp và thiết kế hệ thống, Chương 5 mô tả thực nghiệm, Chương 6 trình bày kết quả và thảo luận, Chương 7 đưa ra kết luận và định hướng phát triển.

# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ TỔNG QUAN NGHIÊN CỨU
## 2.1. Truy vấn ảnh dựa trên nội dung và học biểu diễn đa phương thức
Truy vấn ảnh dựa trên nội dung, hay Content-Based Image Retrieval (CBIR), là hướng tiếp cận tìm kiếm ảnh dựa trên chính đặc trưng trực quan của ảnh như màu sắc, hình dạng hay kết cấu, thay vì dựa vào từ khóa hoặc metadata gán thủ công. Cách tiếp cận truyền thống này bộc lộ một giới hạn căn bản khi mở rộng sang bài toán tìm kiếm bằng mô tả tự nhiên: đặc trưng trực quan trích xuất từ ảnh và từ ngữ trong câu mô tả vốn tồn tại trong hai không gian biểu diễn khác nhau, không thể so sánh trực tiếp với nhau. Vấn đề này chỉ được giải quyết khi cả ảnh và văn bản cùng được ánh xạ vào một không gian vector chung, nơi khoảng cách hình học giữa hai vector phản ánh đúng mức độ liên quan về ngữ nghĩa giữa nội dung ảnh và nội dung mô tả.  
Việc ánh xạ này được thực hiện thông qua embedding, tức vector đặc trưng do một mạng học sâu sinh ra để biểu diễn nội dung của ảnh hoặc văn bản trong không gian nhiều chiều. Ảnh được đưa qua một image encoder để sinh ra vector đặc trưng tương ứng, trong khi văn bản được đưa qua một text encoder riêng biệt. Để hai loại embedding này có thể được đặt cạnh nhau và so sánh một cách có ý nghĩa, chúng cần được huấn luyện sao cho các cặp ảnh-văn bản có nội dung liên quan được đưa về gần nhau, còn các cặp không liên quan bị đẩy ra xa nhau trong cùng một không gian biểu diễn. Nguyên tắc huấn luyện này chính là học tương phản, hay contrastive learning.  
Ý tưởng cốt lõi của học tương phản là tối ưu một hàm mất mát sao cho embedding của cặp dữ liệu dương, tức cặp thực sự liên quan đến nhau, đạt độ tương đồng cao, trong khi embedding của các cặp âm, tức các cặp không liên quan lấy trong cùng một batch huấn luyện, bị đẩy ra xa. Công thức phổ biến nhất thể hiện nguyên tắc này là hàm mất mát InfoNCE, do van den Oord và cộng sự đề xuất năm 2018 trong bối cảnh học biểu diễn không giám sát nói chung [1]. Với một batch gồm N cặp dữ liệu, trong đó cặp thứ i là cặp dương duy nhất ứng với mẫu truy vấn thứ i, hàm mất mát InfoNCE cho một hướng truy vấn được viết như sau:  
Li=-logexp(sim(zi,zi+)/τ)j=1Nexp(sim(zi,zj)/τ)  
Trong đó zi là embedding của mẫu truy vấn thứ i, zi+ là embedding của mẫu dương tương ứng, sim(. , .) là hàm đo độ tương đồng giữa hai vector, thường là cosine similarity sẽ được trình bày cụ thể ở mục 2.2, và τ là tham số nhiệt độ có vai trò điều chỉnh độ sắc nét của phân phối xác suất: giá trị τ càng nhỏ thì mô hình càng bị buộc phải phân biệt rạch ròi cặp dương với các cặp âm còn lại, giá trị τ càng lớn thì phân phối càng được làm mềm. Mẫu số của công thức lấy tổng trên toàn bộ N ứng viên trong batch, bao gồm cả mẫu dương lẫn N-1 mẫu âm, khiến hàm mất mát này tương đương với việc huấn luyện một bài toán phân loại N lớp, trong đó lớp đúng duy nhất là vị trí của mẫu dương.  
CLIP, được Radford và cộng sự công bố năm 2021, áp dụng nguyên lý trên theo hai chiều đối xứng giữa ảnh và văn bản [2]. Với một batch gồm N cặp ảnh-văn bản, gọi Si,j là độ tương đồng cosine giữa embedding ảnh thứ i và embedding văn bản thứ j, hàm mất mát khi lấy ảnh làm gốc để tìm văn bản đúng được định nghĩa là:  
LI→T=-1Ni=1Nlogexp(Si, i/T)j=1Nexp(Si, j/T)  
và theo chiều ngược lại, khi lấy văn bản làm gốc để tìm ảnh đúng:  
LT→I=-1Ni=1Nlogexp(Si, i/T)j=1Nexp(Sj, i/T)  
Hàm mất mát tổng thể của CLIP là trung bình cộng của hai chiều này:  
LCLIP=LI→T + LT→I2  
Điều này đảm bảo mô hình học được một không gian embedding đối xứng, nơi từ một ảnh có thể tìm đúng văn bản mô tả và ngược lại, đây chính là cơ sở lý thuyết cho phép SISE triển khai đồng thời cả truy vấn bằng ảnh và truy vấn bằng văn bản trên cùng một không gian vector sẽ được mô tả ở mục 4.1.  
Về mặt kiến trúc, CLIP gồm hai nhánh encoder độc lập: image encoder, có thể là kiến trúc Vision Transformer (ViT) hoặc ResNet tùy biến thể, và text encoder dựa trên kiến trúc Transformer. Ảnh đầu vào được tiền xử lý về kích thước cố định và chuẩn hóa giá trị điểm ảnh trước khi đưa qua image encoder, còn văn bản được tokenize theo bộ từ vựng riêng của mô hình trước khi đưa qua text encoder. Cả hai loại embedding đầu ra đều được chuẩn hóa về vector đơn vị bằng chuẩn L2 trước khi tính cosine similarity, với công thức chuẩn hóa:  
vnorm= v||v||2  
v2=v12+v22+v32+...+vn2  
Việc chuẩn hóa này đảm bảo rằng độ tương đồng giữa hai embedding chỉ phụ thuộc vào hướng của vector, không bị ảnh hưởng bởi độ lớn tuyệt đối, một điều kiện cần thiết để cosine similarity phản ánh đúng ý nghĩa ngữ nghĩa của không gian biểu diễn, sẽ được phân tích kỹ hơn ở mục 2.2 khi trình bày các độ đo tương đồng dùng trong tìm kiếm vector.  
Trong hệ thống SISE, CLIP được sử dụng đúng ở dạng pretrained, cụ thể là biến thể ViT-B-32-quickgelu với trọng số pretrained=openai, và cấu hình sẽ được trình bày chi tiết ở mục 4.1. Việc lựa chọn CLIP làm mô hình sinh embedding nền tảng, thay vì một mô hình chỉ xử lý ảnh như ResNet hoặc chỉ xử lý văn bản như BERT, xuất phát từ chính đặc tính đối xứng của hàm mất mát vừa trình bày: vì CLIP được huấn luyện để ảnh và văn bản cùng chia sẻ một không gian biểu diễn duy nhất, hệ thống có thể dùng chung một cơ chế tính toán và một chỉ mục tìm kiếm cho cả hai chế độ truy vấn image-to-image và text-to-image, mà không cần xây dựng hai pipeline xử lý tách biệt hay hai không gian vector khác nhau cần đồng bộ với nhau. Đây là điều kiện tiên quyết cho phép SISE giữ được sự đơn giản trong kiến trúc dữ liệu, thể hiện rõ ở việc chỉ cần một cột vector 512 chiều duy nhất trong cơ sở dữ liệu để lưu trữ embedding của cả ảnh lẫn văn bản, sẽ được mô tả chi tiết hơn ở mục 4.2.  
Việc sử dụng mô hình ở dạng pretrained mà không fine-tune cũng là một lựa chọn có chủ đích, không phải một giới hạn bị động. Nhóm nghiên cứu đã tận dụng chính chức năng tải ảnh của hệ thống để tự thu thập một bộ dữ liệu thực nghiệm phục vụ đánh giá khả năng phân biệt danh tính của CLIP ở trạng thái pretrained nguyên bản, kết quả và phân tích chi tiết được trình bày ở CHƯƠNG 5 và CHƯƠNG 6. Cách tiếp cận này phản ánh đúng bản chất của bài toán CLIP được thiết kế để giải quyết: học một biểu diễn tổng quát từ tập dữ liệu ảnh-văn bản quy mô lớn thu thập trên Internet, ưu tiên khả năng khái quát hóa sang nhiều miền dữ liệu khác nhau mà không cần huấn luyện lại cho từng tác vụ cụ thể, hơn là tối ưu cho một đặc trưng hẹp như nhận diện danh tính cá nhân. Chính đặc tính này của quá trình huấn luyện tương phản, vốn học cách phân biệt cặp ảnh-văn bản đúng trong số nhiều cặp sai lấy ngẫu nhiên từ dữ liệu web quy mô lớn, khiến mô hình có xu hướng nắm bắt tốt các đặc trưng thị giác mang tính mô tả tổng thể như bối cảnh, trang phục hay bố cục ảnh, trong khi đặc trưng chi tiết và mang tính phân biệt cao giữa các cá nhân cụ thể không phải là tín hiệu được nhấn mạnh trong hàm mất mát LCLIP đã trình bày ở trên. Đây chính là cơ sở lý thuyết cho hiện tượng MRR thấp hơn kỳ vọng dù Precision và Recall vẫn cao, được quan sát thấy trong kết quả thực nghiệm ở mục 6.1 và sẽ được lý giải cụ thể ở mục 6.3.

## 2.2. Tìm kiếm gần đúng và cơ sở dữ liệu vector
Sau khi ảnh và văn bản được chuyển thành embedding theo cơ chế đã trình bày ở mục 2.1, bài toán tiếp theo là tìm trong tập dữ liệu đã lưu trữ những vector có mức độ tương đồng cao nhất với vector truy vấn, gọi là bài toán tìm kiếm láng giềng gần nhất. Cách tiếp cận đơn giản nhất là brute-force, tính khoảng cách hoặc độ tương đồng giữa vector truy vấn với toàn bộ vector trong cơ sở dữ liệu rồi sắp xếp để lấy ra top-k kết quả gần nhất. Phương pháp này đảm bảo tìm được đúng kết quả gần nhất tuyệt đối, nhưng chi phí tính toán tăng tuyến tính theo số lượng vector trong tập dữ liệu, khiến brute-force trở nên không khả thi khi quy mô dữ liệu đủ lớn. Đây là lý do các hệ thống truy vấn vector hiện đại chuyển sang sử dụng các thuật toán tìm kiếm láng giềng gần đúng, hay Approximate Nearest Neighbors (ANN), chấp nhận đánh đổi một phần độ chính xác tuyệt đối để đổi lấy tốc độ truy vấn nhanh hơn đáng kể.  

Trước khi so sánh độ tương đồng, cần xác định rõ độ đo được sử dụng. Hai độ đo phổ biến nhất trong không gian embedding là khoảng cách Euclidean, hay L2, và độ tương đồng cosine. Với hai vector a,b∈Rn, khoảng cách L2 được định nghĩa là:  
dL2(a,b)=||a-b||2=i=1n(ai-bi)2  
đo khoảng cách tuyệt đối giữa hai điểm trong không gian, phụ thuộc vào cả hướng lẫn độ lớn của vector. Trong khi đó, cosine similarity chỉ đo góc giữa hai vector, được định nghĩa là:  
cos(a,b)=a . b||a||2||b||2  
với giá trị nằm trong khoảng [-1;1], càng gần 1 thì hai vector càng cùng hướng, tức càng tương đồng về mặt ngữ nghĩa trong không gian biểu diễn của CLIP. Vì embedding của CLIP đã được chuẩn hóa về vector đơn vị theo đúng công thức chuẩn hóa L2 đã trình bày ở mục 2.1, với vector đã chuẩn hóa thì ||a||2=||b||2=1, khi đó cosine similarity rút gọn về đúng tích vô hướng a . b, và về mặt thứ hạng, kết quả xếp hạng theo cosine similarity khi đó trở nên tương đương với xếp hạng theo khoảng cách L2. Tuy nhiên, cosine similarity vẫn được lựa chọn làm độ đo chính cho SISE vì phản ánh trực tiếp và trực quan hơn bản chất so sánh hướng vector mà không gian biểu diễn của CLIP hướng tới, đây cũng là độ đo được pgvector hỗ trợ tường minh thông qua lớp toán tử vector_cosine_ops và toán tử <=>.  

Trong số các thuật toán ANN hiện có, HNSW, viết tắt của Hierarchical Navigable Small World, do Malkov và Yashunin đề xuất, là thuật toán được SISE lựa chọn triển khai [3]. HNSW xây dựng một cấu trúc đồ thị phân tầng, trong đó tầng trên cùng có ít nút với các liên kết vươn xa, cho phép di chuyển nhanh đến khu vực gần vector truy vấn, còn các tầng dưới có mật độ nút dày hơn với liên kết cục bộ, cho phép tinh chỉnh kết quả tìm kiếm ở phạm vi hẹp hơn. Quá trình truy vấn bắt đầu từ tầng cao nhất, di chuyển đến nút láng giềng gần vector truy vấn nhất theo độ đo đã chọn, lặp lại cho đến khi không thể tiến gần hơn ở tầng hiện tại thì chuyển xuống tầng thấp hơn, và tiếp tục quá trình này cho đến tầng đáy để thu được danh sách top-k ứng viên gần nhất.  

Chất lượng và tốc độ của chỉ mục HNSW được kiểm soát bởi ba tham số cấu hình chính, được pgvector hiện thực hóa trực tiếp trong cú pháp tạo chỉ mục. Tham số M quy định số lượng liên kết tối đa mà mỗi nút có thể có trong mỗi tầng của đồ thị; giá trị M càng lớn thì đồ thị càng dày liên kết, cải thiện độ chính xác truy vấn nhưng đồng thời làm tăng dung lượng bộ nhớ cần thiết để lưu trữ chỉ mục. Tham số ef_construction quy định kích thước danh sách ứng viên động được xét đến trong quá trình xây dựng đồ thị; giá trị này càng lớn thì đồ thị được xây dựng càng chính xác nhưng thời gian xây dựng chỉ mục càng lâu. Tham số ef_search, tương ứng với ef_search trong pgvector, quy định kích thước danh sách ứng viên động được xét đến tại thời điểm truy vấn; giá trị này càng lớn thì độ chính xác của kết quả trả về càng cao nhưng tốc độ truy vấn càng giảm. Cả ba tham số đều thể hiện rõ sự đánh đổi cố hữu giữa tốc độ, độ chính xác và chi phí tài nguyên vốn là đặc trưng chung của mọi thuật toán ANN.  

**Bảng 2.1. Tổng hợp cấu hình tham số HNSW**

| Tham số         | Vai trò                                         | Giá trị mặc định của pgvector | Giá trị cấu hình trong SISE |
|-----------------|-------------------------------------------------|-------------------------------|-----------------------------|
| M               | Số liên kết tối đa mỗi nút mỗi tầng             | 16                            | 16                          |
| ef_construction | Kích thước danh sách ứng viên khi xây dựng chỉ mục | 64                            | 200                         |
| ef_search       | Kích thước danh sách ứng viên khi truy vấn      | 40                            | 64                          |

Việc nâng ef_construction lên 200, cao hơn giá trị mặc định của pgvector, phản ánh ưu tiên của hệ thống nghiêng về chất lượng chỉ mục hơn là tốc độ xây dựng, một lựa chọn hợp lý trong bối cảnh chỉ mục chỉ cần được xây dựng lại khi có thay đổi lớn về dữ liệu hoặc tham số, trong khi tốc độ truy vấn thực tế mới là yếu tố ảnh hưởng trực tiếp đến trải nghiệm người dùng.  

Về nền tảng lưu trữ, SISE sử dụng pgvector, một extension mở rộng khả năng lưu trữ và truy vấn vector ngay trên PostgreSQL, thay vì một cơ sở dữ liệu vector chuyên biệt độc lập [4]. pgvector hỗ trợ đồng thời cả tìm kiếm chính xác tuyệt đối và tìm kiếm gần đúng thông qua chỉ mục HNSW, cho phép vector embedding được lưu trữ trực tiếp cùng bảng với các trường metadata quan hệ khác như thông tin người dùng hay album, thay vì phải đồng bộ dữ liệu giữa hai hệ quản trị tách biệt. Cấu trúc đầy đủ các bảng dữ liệu và cấu hình chỉ mục vector của SISE được trình bày trong Phụ lục A. Quyết định lựa chọn nền tảng lưu trữ cụ thể cho SISE, cùng với những cân nhắc thực tế phát sinh trong quá trình triển khai, sẽ được trình bày chi tiết ở mục 4.2.

## 2.3. Kiến trúc RESTful API và mô hình phân lớp hướng nghiệp vụ
Giao tiếp giữa các thành phần của SISE, cụ thể là giữa giao diện web, backend, dịch vụ suy luận CLIP và tầng lưu trữ, được thực hiện thông qua các API theo kiến trúc REST, viết tắt của Representational State Transfer. REST được Fielding trình bày lần đầu trong luận án tiến sĩ năm 2000 như một tập hợp các ràng buộc kiến trúc dành cho hệ thống phân tán dựa trên giao thức mạng, trong đó mỗi tài nguyên được định danh bằng một URI duy nhất và được thao tác thông qua một tập hợp nhỏ các phương thức chuẩn, không phụ thuộc trạng thái phiên làm việc lưu ở phía máy chủ giữa các lần gọi [5]. Trong SISE, các phương thức HTTP được sử dụng đúng theo ngữ nghĩa chuẩn của REST: phương thức GET dùng để truy vấn dữ liệu không gây thay đổi trạng thái, ví dụ lấy thông tin một ảnh hoặc kết quả tìm kiếm; POST dùng để tạo mới hoặc thực hiện một hành động có tác dụng phụ, ví dụ tải ảnh lên hoặc gửi truy vấn tìm kiếm; còn PUT và DELETE dùng cho việc cập nhật hoặc xóa tài nguyên đã tồn tại. Mỗi request đều đi kèm mã trạng thái HTTP phản ánh đúng kết quả xử lý, trong đó 201 báo hiệu tạo tài nguyên thành công, 409 báo hiệu xung đột do request trùng lặp, và 403 báo hiệu từ chối truy cập do không đủ quyền. Danh sách đầy đủ các endpoint cùng phương thức và mã trạng thái tương ứng được áp dụng nhất quán xuyên suốt hợp đồng API của hệ thống, được trình bày chi tiết trong Phụ lục B, mục B.1 đến B.5.  

Backend của SISE được xây dựng trên FastAPI, một framework Python hiện đại cho phép định nghĩa endpoint dựa trên type hint chuẩn của ngôn ngữ và tự động sinh tài liệu OpenAPI tương ứng. Một trong những cơ chế trung tâm của FastAPI được SISE khai thác triệt để là Dependency Injection, hệ thống tiêm phụ thuộc cho phép một endpoint khai báo rằng nó cần một đối tượng cụ thể, ví dụ một service đã khởi tạo sẵn hoặc một kết nối cơ sở dữ liệu, thông qua hàm Depends(), và framework sẽ tự động phân giải, khởi tạo hoặc tái sử dụng đối tượng đó tại thời điểm xử lý request [6]. Cơ chế này giúp tách bạch hoàn toàn việc khai báo một thành phần cần dùng những gì khỏi việc thành phần đó được tạo ra như thế nào, đồng thời cho phép các phụ thuộc được tạo ra đúng một lần và tái sử dụng xuyên suốt vòng đời ứng dụng thay vì khởi tạo lại ở mỗi request. Cơ chế khởi tạo và tiêm phụ thuộc cụ thể áp dụng trong kiến trúc của SISE, bao gồm nguyên tắc Services không tự khởi tạo Adapters, được đặc tả chi tiết trong mục C.4; nguyên tắc này được áp dụng trực tiếp trong việc khởi tạo mô hình CLIP sẽ được mô tả ở mục 4.1.  

Về mặt tổ chức mã nguồn, backend của SISE không được cấu trúc theo mô hình MVC truyền thống, nơi toàn bộ model, toàn bộ controller và toàn bộ view được gom chung vào các thư mục lớn dùng cho mọi nghiệp vụ. Thay vào đó, hệ thống áp dụng một kiến trúc gọi là Workflow-Centric, kết hợp giữa phân tách theo lớp trách nhiệm và nhóm theo nghiệp vụ. Mỗi nghiệp vụ, gọi là một workflow, chẳng hạn xác thực người dùng, tải ảnh lên, hay tìm kiếm, được tổ chức xuyên suốt bốn lớp cố định. Lớp entities chỉ chứa định nghĩa cấu trúc dữ liệu thuần túy, không mang bất kỳ logic xử lý nào. Lớp adapters là nơi duy nhất được phép giao tiếp trực tiếp với hạ tầng bên ngoài, bao gồm cơ sở dữ liệu, object storage, hay lời gọi API sang dịch vụ khác. Lớp services chứa toàn bộ logic nghiệp vụ thuần túy, nhận đầu vào đã được xác thực từ lớp routers, thao tác trên dữ liệu theo định nghĩa của entities, và gọi xuống adapters khi cần tương tác với thế giới bên ngoài. Lớp routers là điểm tiếp nhận HTTP request, chịu trách nhiệm xác thực đầu vào và điều hướng xuống lớp services, không chứa logic nghiệp vụ. Định nghĩa đầy đủ về năm lớp thành phần và nguyên tắc tổ chức theo bộ tệp workflow của kiến trúc này được trình bày chi tiết trong mục C.1 và C.2.  

**Bảng 2.2. Tóm tắt vai trò và ràng buộc của từng lớp trong Workflow-Centric**

| Lớp      | Vai trò chính                                         | Được phép giao với hạ tầng ngoài |
|----------|-------------------------------------------------------|----------------------------------|
| Entities | Định nghĩa cấu trúc dữ liệu (Pydantic model, DTO)     | Không                            |
| Adapters | Cầu nối duy nhất tới cơ sở dữ liệu, object storage, API ngoài | Có                               |
| Server   | Logic nghiệp vụ thuần túy, điều phối adapters         | Không trực tiếp, chỉ qua adapters |
| Routers  | Tiếp nhận HTTP request, xác thực đầu vào, điều hướng  | Không                            |

Nguyên tắc tổ chức này khác biệt căn bản so với MVC ở chỗ đơn vị nhóm mã nguồn không phải là loại thành phần kỹ thuật, mà là nghiệp vụ cụ thể: toàn bộ bốn tệp search_entities, search_adapters, search_services, search_routers phục vụ riêng cho nghiệp vụ tìm kiếm, tách biệt hoàn toàn khỏi bốn tệp tương ứng của nghiệp vụ tải ảnh lên hệ thống hay xác thực. Cách tổ chức theo bộ tệp workflow như vậy đánh đổi một phần khả năng tái sử dụng mã nguồn giữa các nghiệp vụ để đổi lấy ranh giới trách nhiệm rõ ràng, giúp việc chỉnh sửa hoặc gỡ lỗi một nghiệp vụ cụ thể không kéo theo rủi ro ảnh hưởng ngoài ý muốn đến các nghiệp vụ khác, một nguyên tắc thiết kế phù hợp với quy mô của một hệ thống prototype nhiều thành phần nhưng do một nhóm nhỏ phát triển và bảo trì. Phạm vi truy cập tài nguyên dữ liệu được phép của từng lớp, cùng nguyên tắc quản lý độ phức tạp khi tổ chức workflow, được đặc tả đầy đủ trong mục C.3 và C.6. Việc áp dụng cụ thể kiến trúc này vào từng luồng nghiệp vụ của SISE, cùng cơ chế idempotency đảm bảo an toàn cho các request có tác dụng phụ (đặc tả tại mục C.5), sẽ được trình bày chi tiết ở mục 4.3.

## 2.4. Containerization và triển khai hệ thống đa dịch vụ
Việc triển khai một hệ thống gồm nhiều thành phần độc lập, như backend, dịch vụ suy luận CLIP và các dịch vụ hạ tầng lưu trữ, đặt ra yêu cầu về một môi trường vận hành nhất quán, có thể tái lập và không phụ thuộc vào cấu hình riêng của từng máy phát triển. Container hóa giải quyết vấn đề này bằng cách đóng gói một ứng dụng cùng toàn bộ phụ thuộc của nó, bao gồm thư viện, biến môi trường và cấu hình hệ thống cần thiết, thành một đơn vị độc lập có thể chạy giống hệt nhau trên bất kỳ máy chủ nào có sẵn container runtime, khác với ảo hóa toàn bộ hệ điều hành vốn nặng về tài nguyên hơn nhiều. Docker là công cụ container hóa được sử dụng cho toàn bộ hệ thống SISE, còn Docker Compose là công cụ định nghĩa và khởi chạy đồng thời nhiều container liên quan đến nhau thông qua một tệp cấu hình khai báo duy nhất, thay vì phải khởi động và kết nối thủ công từng container riêng lẻ [7].  

Trong một hệ thống nhiều container giao tiếp với nhau, cơ chế mạng là yếu tố quyết định các container có thể tìm thấy và gọi đến nhau hay không. Docker Compose mặc định tạo một mạng riêng cho mỗi lần khởi chạy, cho phép các container trong cùng mạng phân giải lẫn nhau qua tên service thay vì địa chỉ IP cụ thể, nhờ cơ chế DNS nội bộ tự động của Docker [7]. Đối với một hệ thống được chia thành nhiều tệp cấu hình riêng biệt theo từng thành phần như SISE, việc để mỗi tệp tự tạo mạng riêng của mình tiềm ẩn rủi ro: nếu một thành phần bất kỳ bị dừng, mạng do thành phần đó tạo ra cũng bị xóa theo, kéo theo gián đoạn kết nối của các thành phần khác vẫn đang chạy bình thường. Để tránh rủi ro này, SISE áp dụng nguyên tắc chỉ một tệp cấu hình gốc duy nhất, đặt ở thư mục dự án, giữ vai trò tạo và sở hữu mạng chung; các tệp cấu hình riêng của từng thành phần chỉ tham gia vào mạng đã tồn tại sẵn thông qua khai báo mạng ngoài, không tự tạo mạng của riêng mình. Cách tổ chức này đảm bảo việc dừng, xây dựng lại hoặc khởi động lại một thành phần không làm gián đoạn kết nối mạng của các thành phần còn lại. Kiến trúc mạng cụ thể cùng lý do lựa chọn được đặc tả tại Phụ lục C.  

Song song với vấn đề mạng, việc quản lý cấu hình môi trường cũng được tách biệt hoàn toàn khỏi mã nguồn và hình ảnh container. Toàn bộ biến môi trường của từng thành phần, như thông tin kết nối cơ sở dữ liệu hay khóa truy cập object storage, được nạp vào container tại thời điểm khởi động thông qua tệp cấu hình riêng, không bao giờ được sao chép cứng vào bên trong hình ảnh container khi xây dựng. Cách làm này giúp việc thay đổi cấu hình, ví dụ đổi môi trường từ phát triển sang kiểm thử, không đòi hỏi phải xây dựng lại toàn bộ hình ảnh container, đồng thời tránh rò rỉ thông tin nhạy cảm vào trong hình ảnh được lưu trữ hoặc chia sẻ.  

Về lưu trữ dữ liệu nhị phân, ảnh gốc do người dùng tải lên được lưu trên MinIO, một dịch vụ object storage tương thích với giao thức API của Amazon S3, cho phép SISE sử dụng chung một mô hình thao tác chuẩn công nghiệp mà không phụ thuộc vào hạ tầng đám mây thương mại [8]. MinIO cung cấp cơ chế presigned URL, một đường dẫn có chữ ký số kèm thời hạn hiệu lực, cho phép client thực hiện thao tác tải lên hoặc tải xuống trực tiếp với object storage mà không cần chia sẻ khóa truy cập lâu dài, đây chính là cơ chế được SISE sử dụng ở bước tải file nhị phân trong luồng tải ảnh sẽ được trình bày ở mục 4.3. Cấu trúc bucket lưu trữ, chính sách vòng đời dữ liệu và các tham số cấu hình cụ thể của MinIO trong SISE được trình bày tại mục A.4.

# CHƯƠNG 3. PHÂN TÍCH YÊU CẦU VÀ MÔ HÌNH ĐỀ XUẤT

## 3.1. Bài toán, mục tiêu nghiên cứu và phạm vi hệ thống
Hệ thống SISE hướng tới xây dựng một nền tảng tìm kiếm ảnh thông minh, nơi người dùng có thể gửi truy vấn dưới dạng ảnh hoặc văn bản tự do và nhận lại danh sách các ảnh liên quan nhất, xếp hạng theo điểm tương đồng kèm theo metadata. Đầu vào của hệ thống là ảnh hoặc mô tả văn bản, đầu ra là top-k ảnh phù hợp nhất với truy vấn. Toàn bộ quá trình truy vấn được tối ưu nhờ chuyển đổi dữ liệu đầu vào thành vector embedding bằng mô hình học sâu, sau đó truy vấn trong cơ sở dữ liệu vector để tìm kết quả nhanh và chính xác, dựa trên nền tảng lý thuyết về học biểu diễn đa phương thức và tìm kiếm gần đúng đã trình bày ở CHƯƠNG 2.  
Prototype được phát triển tập trung cho môi trường máy cục bộ, sử dụng Docker Compose để khởi tạo đồng bộ các thành phần, với web app là giao diện chính. Hệ thống hỗ trợ hai chế độ truy vấn: người dùng có thể tải lên ảnh hoặc nhập câu mô tả, cả hai đều được xử lý chung một pipeline sinh embedding, sử dụng cơ sở dữ liệu vector đã lập chỉ mục để tìm kiếm top-k ảnh gần nhất. Ngoài các chức năng cốt lõi như đăng ký và đăng nhập, các tính năng nâng cao như đăng nhập qua nền tảng bên thứ ba, hồ sơ xã hội công khai hay bộ lọc truy vấn nâng cao hiện chưa được triển khai mà chỉ được coi là hướng mở rộng, trình bày ở mục 7.2.  

## 3.2. Chức năng và quy trình xử lý dữ liệu
Người dùng bổ sung ảnh mới cho hệ thống bằng cách tải lên qua giao diện web. Ảnh hợp lệ được kiểm tra định dạng, sinh embedding bằng mô hình AI, sau đó ảnh gốc được lưu vào object storage, còn embedding cùng metadata được lưu vào cơ sở dữ liệu vector. Sau khi lập chỉ mục hoàn tất, ảnh ngay lập tức nằm trong phạm vi tìm kiếm của các truy vấn tiếp theo. Người dùng có quyền truy cập, chỉnh sửa hoặc xóa dữ liệu ảnh của chính mình.  
Cả hai chế độ truy vấn, bằng ảnh và bằng văn bản, đều được đưa qua cùng một không gian embedding chung, bảo đảm tính nhất quán khi so sánh độ tương đồng bất kể loại đầu vào. Kết quả trả về cho người dùng gồm danh sách ảnh liên quan kèm điểm số tương đồng và metadata như thời điểm tải lên, tên tệp và trạng thái lập chỉ mục, giúp người dùng có cơ sở đánh giá mức độ phù hợp của từng kết quả.  

## 3.3. Yêu cầu kỹ thuật, tiêu chí đánh giá và khả năng triển khai
Để đảm bảo hiệu năng khi quy mô dữ liệu tăng, hệ thống sử dụng thuật toán tìm kiếm gần đúng thay cho brute-force, theo đúng cơ sở lý thuyết về sự đánh đổi giữa tốc độ và độ chính xác đã trình bày ở mục 2.2. Trong phạm vi thực nghiệm của khóa luận, hệ thống vận hành với bộ dữ liệu tự thu thập gồm 750 ảnh trên 15 danh tính, mô tả chi tiết tại mục 5.1. Toàn bộ các thành phần được đóng gói thành container và khởi động đồng bộ qua Docker Compose theo kiến trúc đã trình bày ở mục 2.4, đảm bảo môi trường vận hành có thể tái lập và dễ kiểm thử.  

Chất lượng truy vấn của hệ thống được đánh giá bằng bốn chỉ số thuộc lĩnh vực truy hồi thông tin. Precision và Recall là hai chỉ số nền tảng nhất trong việc đánh giá một hệ thống truy hồi, được Manning và cộng sự trình bày một cách hệ thống trong giáo trình kinh điển về truy hồi thông tin [9]. Với một truy vấn trả về tập hợp k kết quả xếp hạng cao nhất, gọi Rk là số kết quả đúng nằm trong tập k kết quả đó và Rtotal là tổng số kết quả đúng có thể có trong toàn bộ dữ liệu, Precision tại k được định nghĩa là:  
Precision@k = Rk/k  
phản ánh tỷ lệ kết quả đúng trên tổng số kết quả trả về, tức độ sạch của danh sách kết quả. Recall tại k được định nghĩa là:  
Recall@k = Rk/Rtotal  
phản ánh tỷ lệ kết quả đúng mà hệ thống tìm được trên tổng số kết quả đúng thực sự tồn tại, tức độ bao phủ của kết quả trả về. Hai chỉ số này thường đánh đổi lẫn nhau: một hệ thống trả về nhiều kết quả có xu hướng tăng Recall nhưng có thể làm giảm Precision nếu các kết quả thêm vào không chính xác.  

Bên cạnh hai chỉ số trên, HitRate tại k đo tỷ lệ truy vấn có ít nhất một kết quả đúng nằm trong top-k, không quan tâm đến số lượng hay vị trí cụ thể của kết quả đúng đó:  
HitRate@k = (1/|Q|) Σ q∈Q 1[Rk(q) ≥ 1]  
trong đó Q là tập hợp toàn bộ truy vấn, và 1[.] là hàm chỉ thị nhận giá trị 1 nếu điều kiện bên trong đúng, ngược lại nhận giá trị 0.  

Chỉ số cuối cùng, Mean Reciprocal Rank, viết tắt MRR, có nguồn gốc từ track đánh giá hệ thống hỏi đáp tại hội nghị TREC-8 do Voorhees và Tice đề xuất năm 1999 [10], đo mức độ hệ thống đưa được kết quả đúng lên vị trí cao trong danh sách xếp hạng:  
MRR = (1/|Q|) Σ q∈Q (1/Rankq)  
trong đó Rankq là vị trí xuất hiện đầu tiên của một kết quả đúng trong danh sách xếp hạng trả về cho truy vấn q. MRR khác biệt căn bản so với ba chỉ số trên ở chỗ chỉ quan tâm đến vị trí của kết quả đúng đầu tiên, không quan tâm đến các kết quả đúng khác nằm sau đó, phù hợp để đo trải nghiệm người dùng trong tình huống chỉ cần tìm nhanh một kết quả phù hợp nhất thay vì duyệt toàn bộ danh sách.  

Bốn chỉ số này được lựa chọn vì mỗi chỉ số phản ánh một khía cạnh khác nhau của chất lượng truy vấn: Precision và Recall đo chất lượng của toàn bộ tập kết quả trả về, HitRate đo khả năng tìm thấy ít nhất một kết quả đúng, còn MRR đo chất lượng thứ hạng của kết quả đúng đầu tiên. Việc sử dụng đồng thời cả bốn chỉ số giúp phát hiện được những trường hợp một hệ thống có thể đạt điểm cao ở chỉ số này nhưng lại bộc lộ hạn chế ở chỉ số khác, một hiện tượng quan sát được cụ thể trong kết quả thực nghiệm ở mục 6.1. Cách áp dụng bốn chỉ số này vào một lượt chạy thực nghiệm cụ thể trên hệ thống SISE được trình bày tại mục 5.2 và 5.3.  

## 3.4. Kiến trúc tổng thể, mô hình hệ thống và pipeline xử lý
Kiến trúc tổng thể của SISE được xây dựng theo hướng module hóa, gồm bốn thành phần chính phối hợp với nhau: giao diện web tiếp nhận truy vấn từ người dùng và hiển thị kết quả; backend đóng vai trò trung tâm điều phối, tiếp nhận request và gọi tới các dịch vụ chuyên biệt; dịch vụ suy luận CLIP sinh vector embedding cho ảnh và văn bản; và tầng lưu trữ, gồm cơ sở dữ liệu vector lưu embedding cùng metadata và object storage lưu ảnh gốc. Toàn bộ bốn thành phần được đóng gói thành các container độc lập, phối hợp với nhau qua giao thức HTTP theo nguyên tắc REST. Thiết kế chi tiết của từng thành phần, bao gồm quy trình xử lý dữ liệu theo kiến trúc phân lớp hướng nghiệp vụ, cơ chế giao tiếp giữa các module, và hạ tầng triển khai bằng Docker Compose, được trình bày đầy đủ ở CHƯƠNG 4.  
Trong phạm vi đề tài, toàn bộ các thành phần cốt lõi này đều được triển khai và kiểm thử trên môi trường máy cục bộ. Các chức năng mở rộng như bộ lọc metadata nâng cao, cơ chế giám sát vận hành, hay quy trình tích hợp và triển khai tự động hiện chưa nằm trong phạm vi của prototype này, được đặt ở định hướng phát triển tại mục 7.2.

# CHƯƠNG 4. PHƯƠNG PHÁP VÀ THIẾT KẾ HỆ THỐNG

## 4.1. Ứng dụng mô hình CLIP và quy trình sinh embedding
Như đã trình bày ở mục 2.1, CLIP được lựa chọn làm mô hình nền tảng nhờ khả năng đưa ảnh và văn bản vào cùng một không gian embedding thông qua cơ chế học tương phản. Trong hệ thống SISE, mô hình được sử dụng ở đúng trạng thái pretrained, cụ thể là kiến trúc ViT-B-32-quickgelu với trọng số pretrained=openai. Việc khai báo đúng biến thể quickgelu thay vì hàm kích hoạt GELU mặc định của thư viện open_clip không phải một lựa chọn tùy ý, mà xuất phát từ việc checkpoint gốc do OpenAI công bố được huấn luyện với QuickGELU, nên nếu nạp mô hình bằng kiến trúc GELU chuẩn sẽ xảy ra sai lệch giữa hàm kích hoạt và trọng số đã học, ảnh hưởng trực tiếp đến chất lượng embedding sinh ra dù không gây lỗi runtime rõ ràng. Đầu ra của mô hình là vector 512 chiều, con số này quyết định luôn cấu trúc cột lưu trữ vector cũng như chỉ mục HNSW ở tầng cơ sở dữ liệu, đặc tả đầy đủ tại mục A.2 và A.3. Trong phạm vi khóa luận này, mô hình được sử dụng nguyên trạng ở dạng pretrained, không thực hiện fine-tune, hướng cải thiện embedding cho một miền dữ liệu cụ thể được đặt ở phần hướng phát triển tại mục 7.2.  

Quy trình sinh embedding cho ảnh và văn bản được xử lý theo hai nhánh tiền xử lý riêng nhưng đi qua chung một dịch vụ suy luận. Đối với ảnh, dữ liệu đầu vào được resize về kích thước cố định 224×224 trước khi đưa vào image encoder, trong khi văn bản được tokenize theo bộ tokenizer riêng của CLIP với giới hạn tối đa 77 token, các truy vấn vượt quá giới hạn sẽ được cắt bớt theo chiến lược truncate đã cấu hình. Cả hai nhánh đều dẫn tới việc mô hình sinh ra một vector 512 chiều duy nhất, không phân biệt về mặt cấu trúc lưu trữ hay cách so sánh ở các bước sau, đây chính là điều kiện để hai chế độ truy vấn bằng ảnh và bằng văn bản có thể dùng chung một cơ chế truy vấn top-k đã nêu ở mục 3.2.  

Về mặt hạ tầng, toàn bộ pipeline trên được đóng gói thành một dịch vụ suy luận độc lập, tách biệt khỏi backend API chính. Mô hình CLIP chỉ được nạp và thực hiện warm-up đúng một lần duy nhất tại thời điểm khởi động dịch vụ, thông qua cơ chế lifespan của FastAPI đã trình bày nguyên lý ở mục 2.3, sau đó instance đã sẵn sàng được publish để các endpoint truy cập lại trong suốt vòng đời container thay vì khởi tạo lại cho từng request. Thiết kế này giúp tránh độ trễ khởi tạo mô hình lặp lại nhiều lần và đảm bảo trạng thái sẵn sàng của mô hình được phản ánh nhất quán qua endpoint kiểm tra sức khỏe dịch vụ.  

## 4.2. Thiết kế lưu trữ vector và chiến lược truy vấn ANN
Như đã trình bày ở mục 2.2, việc lưu trữ vector đòi hỏi một nền tảng có khả năng xây dựng chỉ mục ANN, quản lý metadata đi kèm và liên kết ngược về ảnh gốc. Đối với SISE, chúng em lựa chọn pgvector thay vì triển khai một cơ sở dữ liệu vector chuyên biệt độc lập như Milvus hay Qdrant. Quyết định này được đưa ra sau khi nhóm thử nghiệm trực tiếp với Milvus ở giai đoạn đầu và nhận thấy nền tảng này, dù mạnh về khả năng mở rộng cho dữ liệu quy mô lớn, lại vận hành thiếu ổn định trên môi trường phần cứng hạn chế mà nhóm sử dụng để phát triển và kiểm thử, một sự đánh đổi không cần thiết đối với quy mô dữ liệu vài trăm đến vài nghìn ảnh của một hệ thống prototype. Việc chuyển sang pgvector còn giúp gộp chung vector vào cùng cơ sở dữ liệu quan hệ vốn đã lưu metadata của ảnh, người dùng và album, tránh phải vận hành đồng thời nhiều hệ quản trị dữ liệu riêng biệt như khi cân nhắc thêm các lựa chọn khác như Qdrant.  

Chỉ mục ANN được xây dựng trên cột embedding kiểu vector(512) bằng cú pháp HNSW của pgvector, sử dụng lớp toán tử vector_cosine_ops để đảm bảo khoảng cách được tính theo cosine similarity, phù hợp với bản chất embedding đã chuẩn hóa của CLIP như đã giải thích ở mục 2.2. Cấu hình cụ thể ba tham số HNSW của SISE, đối chiếu với giá trị mặc định của pgvector, được trình bày tại mục A.3. Toàn bộ hệ thống hiện chỉ duy trì đúng một chỉ mục HNSW cho cột embedding, không xây dựng thêm các biến thể sử dụng khoảng cách L2 hay tích vô hướng, vì cosine similarity đã được xác định là độ đo duy nhất phù hợp trong phạm vi khóa luận.  

Song song với vector, ảnh gốc được lưu trữ trên MinIO, tách biệt hoàn toàn khỏi PostgreSQL. Ảnh được tổ chức theo hai bucket riêng biệt phục vụ ảnh gốc và ảnh thu nhỏ, mỗi ảnh trong bảng dữ liệu quan hệ lưu lại tên đối tượng và tên bucket tương ứng để có thể truy xuất lại đúng vị trí lưu trữ vật lý khi cần trả về cho người dùng. Toàn bộ bucket được cấu hình ở chế độ riêng tư, không cho phép truy cập công khai trực tiếp, thay vào đó ảnh được truy xuất thông qua presigned URL có thời hạn một giờ do backend cấp phát, đặc tả đầy đủ tại mục A.4. Việc tách object storage khỏi cơ sở dữ liệu quan hệ giúp hệ thống tránh được chi phí lưu trữ nhị phân lớn ngay trong PostgreSQL, đồng thời giữ được đường liên kết rõ ràng giữa ba lớp dữ liệu: vector dùng để tìm kiếm, metadata dùng để mô tả và lọc, và ảnh gốc dùng để hiển thị kết quả cuối cùng cho người dùng.  

## 4.3. Thiết kế backend API và luồng xử lý
Backend của SISE được tổ chức theo kiến trúc Workflow-Centric đã trình bày nguyên lý ở mục 2.3, trong đó mỗi nghiệp vụ được nhóm thành một bộ tệp riêng gồm entities, adapters, services và routers. Cách tổ chức này giúp khi cần chỉnh sửa một nghiệp vụ cụ thể, ví dụ tìm kiếm, nhóm chỉ cần quan tâm đến đúng bộ bốn tệp bắt đầu bằng tên nghiệp vụ đó, hạn chế được tình trạng mã nguồn của nhiều chức năng khác nhau trộn lẫn trong cùng một tệp lớn. Vai trò cụ thể của từng lớp trong kiến trúc này áp dụng cho SISE được đặc tả tại mục C.1 và C.2.  

Frontend không bao giờ gọi trực tiếp xuống dịch vụ AI hay cơ sở dữ liệu vector mà luôn phải đi qua backend, ngoại trừ một trường hợp duy nhất trong luồng tải ảnh lên hệ thống. Luồng này được chia thành ba bước: đầu tiên backend cấp một presigned URL có thời hạn một giờ để client tải file nhị phân trực tiếp lên MinIO mà không phải đi qua backend, tránh việc backend phải xử lý toàn bộ dữ liệu ảnh nặng; tiếp theo client thực hiện việc tải file lên MinIO bằng chính presigned URL đó; cuối cùng client gọi lại backend để xác nhận hoàn tất, lúc này ảnh được ghi nhận ở trạng thái chờ xử lý và một tác vụ nền được kích hoạt để gửi ảnh sang dịch vụ AI sinh embedding rồi ghi vector vào cơ sở dữ liệu. Thiết kế tách bước tải file nhị phân ra khỏi backend theo cách này giúp giảm tải cho tầng API, đồng thời vẫn giữ được việc ghi nhận metadata và cập nhật chỉ mục vector nằm hoàn toàn dưới sự kiểm soát của backend. Danh sách đầy đủ các endpoint liên quan đến luồng này được trình bày tại mục B.3.  

Đối với luồng truy vấn, khi nhận được ảnh hoặc câu mô tả từ người dùng, backend chuyển tiếp dữ liệu sang dịch vụ AI để sinh embedding theo đúng cơ chế đã trình bày ở mục 4.1, sau đó dùng vector nhận được để truy vấn top-k trong cơ sở dữ liệu vector theo chỉ mục HNSW đã thiết lập ở mục 4.2, cuối cùng gắn kèm metadata và đường dẫn ảnh trước khi trả kết quả về cho giao diện, chi tiết endpoint tại mục B.4. Toàn bộ các request có khả năng làm thay đổi dữ liệu đều được gắn một khóa định danh duy nhất cho mỗi lần thao tác theo đúng cơ chế đã đặc tả tại mục C.5, nhằm đảm bảo nếu client vô tình gửi lại cùng một request do mất kết nối hoặc thao tác trùng lặp, hệ thống sẽ trả về đúng kết quả của lần xử lý gốc thay vì tạo ra một bản ghi mới hay xử lý lại từ đầu.  

Ngoài luồng tải ảnh và truy vấn, backend còn cung cấp một nhóm chức năng riêng phục vụ việc đánh giá chất lượng mô hình embedding, cho phép chạy tự động một tập truy vấn đã chuẩn bị trước,

# CHƯƠNG 5. THỰC NGHIỆM VÀ ĐÁNH GIÁ

## 5.1. Bộ dữ liệu và ground truth thực nghiệm
Bộ dữ liệu dùng cho thực nghiệm không lấy từ một nguồn công khai có sẵn mà được thu thập trực tiếp thông qua chính chức năng tải ảnh của hệ thống SISE, tại thời điểm thực nghiệm gồm 750 ảnh thuộc 15 danh tính khác nhau, mỗi danh tính 50 ảnh. Cách làm này phục vụ đồng thời hai mục đích: vừa tạo ra một tập dữ liệu thực nghiệm có kiểm soát, vừa đóng vai trò kiểm thử tích hợp thật cho toàn bộ luồng tải ảnh đã trình bày ở mục 4.3, khi mỗi lượt tải lên đều đi qua đúng quy trình mà một người dùng thật sẽ trải qua. Các ảnh trong mỗi danh tính được lựa chọn có chủ đích để đảm bảo đa dạng nội bộ về góc chụp, ánh sáng, trang phục và kiểu tóc, đồng thời một số danh tính được sắp xếp gần nhau về mặt phong cách thị giác nhằm tạo ra vùng dễ gây nhầm lẫn, chẳng hạn nhóm nhân vật thường xuất hiện trong trang phục vest lịch lãm hoặc nhóm có tông màu ảnh mang hơi hướng hoài cổ. Việc chủ động thiết kế những vùng chồng lấn này nhằm quan sát rõ hơn hành vi phân biệt danh tính của CLIP thay vì chỉ đo hiệu năng trên một tập dữ liệu ngẫu nhiên không có cấu trúc.  

Việc xác định một kết quả trả về có đúng hay không được xây dựng dựa trên mô hình gán nhãn theo một tag định danh duy nhất cho mỗi ảnh, thay vì dựa vào chính ảnh mẫu ban đầu như cách tiếp cận tự truy hồi đơn giản. Mỗi ảnh trong hệ thống được gán đúng một tag mang ý nghĩa xác định danh tính, và hai ảnh được coi là cùng một nhóm đúng khi tag định danh của chúng khớp nhau sau khi đã chuẩn hóa chữ hoa chữ thường và khoảng trắng thừa, không phụ thuộc vào việc chúng có cùng album hay không. Lựa chọn tag làm căn cứ chính thay vì album xuất phát từ việc tag được gán có chủ đích rõ ràng cho từng ảnh, trong khi album là đơn vị tổ chức lưu trữ dễ bị gán nhầm do thao tác của người dùng trong quá trình sử dụng thực tế. Album chỉ được dùng làm căn cứ dự phòng trong trường hợp ảnh truy vấn hoàn toàn không có tag nào. Chính ảnh mẫu dùng làm truy vấn luôn được loại khỏi tập kết quả đúng để không tự tính điểm cho chính nó. Cách xây dựng ground truth này còn tồn tại một giới hạn đã được nhận biết, đó là cơ chế chuẩn hóa chỉ xử lý được khác biệt về chữ hoa chữ thường và khoảng trắng, chưa xử lý được các trường hợp viết tắt hoàn toàn khác chữ hoặc lỗi chính tả trong tên tag, do đó việc đặt tag nhất quán khi thu thập dữ liệu vẫn cần được kiểm soát thủ công.  

## 5.2. Thiết lập thực nghiệm và các chỉ số đánh giá
Toàn bộ thực nghiệm được chạy trên chính hệ thống SISE đã triển khai bằng Docker Compose như mô tả ở Chương 4, sử dụng mô hình CLIP ở cấu hình ViT-B-32-quickgelu với trọng số pretrained openai, cơ sở dữ liệu vector pgvector với chỉ mục HNSW tham số m=16 và ef_construction=200, độ đo tương đồng cosine. Thực nghiệm được thực hiện thông qua một chức năng đánh giá riêng của backend, chỉ dành cho tài khoản quản trị, xử lý đồng bộ và trả kết quả ngay trong cùng một lần gọi thay vì phải chờ đợi qua cơ chế xử lý nền, đặc tả endpoint tại mục B.5.  

Chất lượng truy vấn được đo bằng bốn chỉ số Precision, Recall, HitRate và MRR, công thức và ý nghĩa của từng chỉ số đã trình bày đầy đủ ở mục 3.3. Bên cạnh bốn chỉ số chuẩn này, nhóm bổ sung thêm một chỉ số tự thiết kế gọi là tỷ lệ nhầm lẫn liên danh tính ở vị trí đầu tiên, đo tỷ lệ phần trăm các truy vấn mà kết quả xếp hạng cao nhất thuộc về một danh tính hoàn toàn khác so với ảnh truy vấn. Chỉ số này được thêm vào nhằm tách bạch hai loại sai lệch có bản chất khác nhau nhưng cùng làm giảm giá trị MRR, đó là việc mô hình nhầm sang một người hoàn toàn khác và việc mô hình vẫn nhận đúng người nhưng không luôn xếp đúng ảnh giống nhất lên vị trí đầu tiên. Sự phân biệt này chỉ có thể quan sát được khi kết hợp MRR với một chỉ số riêng đo trực tiếp tỷ lệ nhầm người, vì bản thân MRR không tự phân tách được hai nguyên nhân trên.  

## 5.3. Quy trình chạy thực nghiệm benchmark
Quy trình thực nghiệm được thực hiện trong một lượt gọi duy nhất, xử lý toàn bộ 750 ảnh trong tập dữ liệu. Mỗi ảnh lần lượt được dùng làm truy vấn, sinh embedding bằng chính pipeline CLIP đã mô tả ở mục 4.1, sau đó được đối chiếu với toàn bộ các ảnh còn lại trong cơ sở dữ liệu vector thông qua chỉ mục HNSW để lấy về danh sách top-k gần nhất. Với mỗi kết quả trả về, hệ thống xác định tính đúng sai dựa trên mô hình ground truth theo tag định danh đã trình bày ở mục 5.1, từ đó tính bốn chỉ số cho từng truy vấn, tổng hợp theo từng danh tính rồi tổng hợp chung cho toàn bộ tập dữ liệu. Do mỗi danh tính đều có số lượng truy vấn bằng nhau là 50 ảnh, giá trị tổng hợp chung được tính bằng trung bình cộng đơn giản của giá trị từng danh tính mà không cần áp dụng trọng số khác nhau giữa các nhóm. Ngoài bốn chỉ số chính, quy trình còn ghi nhận lại ma trận thể hiện danh tính nào bị nhầm với danh tính nào cùng số lần xảy ra, và lưu lại chi tiết từng trường hợp nhầm lẫn liên danh tính kèm theo đường dẫn ảnh cùng điểm tương đồng của từng kết quả trong top-k, phục vụ việc phân tích định tính ở CHƯƠNG 6.  

Cần nói rõ một giới hạn của cách thực nghiệm này, đó là mỗi lượt benchmark chỉ được chạy đúng một lần duy nhất trên toàn bộ tập dữ liệu tại một thời điểm, không lặp lại nhiều lần để tính giá trị trung bình hay độ lệch chuẩn giữa các lần chạy. Do bản chất suy luận của mô hình CLIP đã huấn luyện là tất định đối với cùng một đầu vào và cùng một chỉ mục dữ liệu, kết quả của các lần chạy lặp lại trên cùng một tập dữ liệu về cơ bản không thay đổi, tuy nhiên việc không thực hiện đo lặp lại có kiểm soát về mặt phương pháp luận vẫn là một giới hạn cần được ghi nhận và được nêu lại ở phần giới hạn của khóa luận tại CHƯƠNG 7.

# CHƯƠNG 6. KẾT QUẢ VÀ THẢO LUẬN

## 6.1. Kết quả đánh giá chất lượng truy vấn
Kết quả benchmark trên 750 truy vấn ảnh, mỗi truy vấn dùng chính một ảnh trong tập dữ liệu làm đầu vào và đối chiếu với toàn bộ ảnh còn lại, cho thấy hệ thống đạt mức HitRate và Recall rất cao trên hầu hết các danh tính; phần lớn đạt giá trị tuyệt đối 1.0, chỉ 3 trong số 15 danh tính có giá trị thấp hơn nhẹ ở mức 0.98. Điều này cho thấy trong gần như mọi trường hợp, hệ thống đều tìm được ít nhất một ảnh đúng nằm trong top 10 kết quả trả về, tức khả năng tìm thấy đúng danh tính gần như không có sai sót đáng kể. Precision dao động trong khoảng từ 0.80 đến 0.90 tùy theo danh tính, phản ánh việc trong 10 kết quả trả về, phần lớn là ảnh đúng nhưng vẫn còn một tỷ lệ nhất định là ảnh không đúng danh tính lọt vào top-k, chủ yếu đến từ những danh tính có vùng chồng lấn phong cách thị giác với danh tính khác như sẽ được phân tích chi tiết ở mục 6.2.  

Trái ngược với 2 chỉ số trên, giá trị MRR lại tương đối thấp và ổn định quanh mức 0.50 ở gần như toàn bộ 15 danh tính, kể cả những danh tính có Precision và Recall gần như tuyệt đối. Mức MRR khoảng 0.50 tương ứng với việc kết quả đúng đầu tiên trung bình xuất hiện ở vị trí thứ hai trong danh sách top-k, chứ không phải luôn nằm ở vị trí đầu tiên. Đây là hiện tượng nhất quán trên toàn bộ tập dữ liệu chứ không riêng một vài danh tính cá biệt, cho thấy nguyên nhân không nằm ở một nhóm dữ liệu có vấn đề mà nằm ở đặc tính chung của cách mô hình xếp hạng kết quả trong phạm vi cùng một danh tính, nội dung này được thảo luận sâu hơn ở mục 6.3.  

**Hình 1. Benchmark tổng hợp trên mọi danh tính**

**Bảng 6.1. Benchmark tổng hợp trên mọi danh tính**

| Danh tính          | Số truy vấn | MRR   | HitRate | Precision | Recall |
|--------------------|-------------|-------|---------|-----------|--------|
| Steven Jobs        | 50          | 0.500 | 1.000   | 0.894     | 1.000  |
| Rosé               | 50          | 0.500 | 1.000   | 0.890     | 1.000  |
| Michael Jackson    | 50          | 0.502 | 1.000   | 0.860     | 1.000  |
| Taylor Swift       | 50          | 0.500 | 1.000   | 0.896     | 1.000  |
| Tom Shelby         | 50          | 0.500 | 1.000   | 0.866     | 1.000  |
| Liu Wan            | 50          | 0.482 | 0.980   | 0.846     | 0.980  |
| Lionel Messi       | 50          | 0.483 | 0.980   | 0.868     | 0.980  |
| Faker              | 50          | 0.500 | 1.000   | 0.900     | 1.000  |
| Cindy Kimberly     | 50          | 0.510 | 1.000   | 0.896     | 1.000  |
| Mark Zuckerberg    | 50          | 0.500 | 1.000   | 0.868     | 1.000  |
| Elon Musk          | 50          | 0.500 | 1.000   | 0.886     | 1.000  |
| Lisa               | 50          | 0.500 | 1.000   | 0.800     | 1.000  |
| Cristiano Ronaldo  | 50          | 0.500 | 1.000   | 0.876     | 1.000  |
| Patrick Bateman    | 50          | 0.497 | 1.000   | 0.876     | 1.000  |
| Thomas Anders      | 50          | 0.500 | 1.000   | 0.896     | 1.000  |
| **Trung bình toàn cục** | 750    | 0.498 | 0.997   | 0.875     | 0.997  |

---

## 6.2. Phân tích hiện tượng nhầm lẫn liên danh tính
Trên toàn bộ 750 truy vấn, chỉ có 10 trường hợp mà kết quả xếp hạng cao nhất thuộc về một danh tính hoàn toàn khác so với ảnh truy vấn, tương ứng tỷ lệ nhầm lẫn liên danh tính ở mức 1.33%. Con số này thấp hơn nhiều so với mức MRR khoảng 0.50 đã trình bày ở mục 6.1, khẳng định rằng phần lớn nguyên nhân khiến MRR không đạt giá trị cao không phải do mô hình nhận sai người, mà do trong phạm vi các ảnh đúng cùng một danh tính, mô hình không phải lúc nào cũng xếp đúng ảnh giống nhất lên vị trí đầu tiên.  

**Hình 2. Biểu đồ Heatmap thể hiện sự nhầm lẫn của mô hình giữa các danh tính**

**Bảng 6.2. Chi tiết các trường hợp nhầm lẫn liên danh tính (top-1)**

| STT | Danh tính truy vấn | Nhầm sang danh tính | Nhóm nguyên nhân                          |
|-----|--------------------|---------------------|-------------------------------------------|
| 1   | Lionel Messi       | Cristiano Ronaldo   | Trang phục vest tại lễ trao giải          |
| 2   | Lionel Messi       | Cristiano Ronaldo   | Trang phục vest tại lễ trao giải          |
| 3   | Patrick Bateman    | Tom Shelby          | Phong cách ăn mặc tương đồng              |
| 4   | Michael Jackson    | Tom Shelby          | Tông màu tối, trang phục lịch lãm         |
| 5   | Michael Jackson    | Patrick Bateman     | Tông màu tối, trang phục lịch lãm         |
| 6   | Liu Wan            | Cindy Kimberly      | Phong cách hiện đại, thần thái tương đồng |
| 7   | Liu Wan            | Rosé                | Phong cách hiện đại, thần thái tương đồng |
| 8   | Liu Wan            | Lisa                | Phong cách hiện đại, thần thái tương đồng |
| 9   | Lisa               | Rosé                | Phong cách hiện đại, thần thái tương đồng |
| 10  | Lisa               | Liu Wan             | Phong cách hiện đại, thần thái tương đồng |

**Bảng 6.3. Tóm tắt theo nhóm nguyên nhân**

| Nhóm                                | Các danh tính liên quan                     | Số trường hợp | Tỷ lệ trên tổng nhầm lẫn |
|-------------------------------------|---------------------------------------------|---------------|--------------------------|
| Trang phục thể thao/vest lễ trao giải | Messi, Ronaldo                              | 2             | 20%                      |
| Phong cách hiện đại, thần thái tương đồng | Lisa, Rosé, Liu Wan, Cindy Kimberly        | 5             | 50%                      |
| Trang phục lịch lãm, tông màu hoài cổ | Michael Jackson, Tom Shelby, Patrick Bateman | 3             | 30%                      |
| Nhóm giả thuyết ban đầu (không xảy ra) | Elon Musk, Steve Jobs, Mark Zuckerberg, Faker | 0             | 0%                       |

---

## 6.3. Thảo luận và giới hạn nghiên cứu
Kết quả thực nghiệm nhìn chung cho thấy CLIP ở cấu hình pretrained không fine-tune vẫn đưa ảnh và văn bản, cũng như các ảnh cùng một danh tính, về gần nhau trong không gian embedding một cách nhất quán, thể hiện qua Recall và HitRate gần như tuyệt đối trên phần lớn danh tính. Tuy nhiên mức MRR chỉ quanh 0.50 cho thấy một giới hạn đã được dự đoán từ cơ sở lý thuyết về học tương phản ở mục 2.1, đó là CLIP được huấn luyện trên các cặp ảnh và mô tả văn bản mang tính khái quát, không được thiết kế chuyên biệt để phân biệt đặc trưng khuôn mặt hay danh tính cá nhân ở mức độ chi tiết. Nói cách khác, mô hình học rất tốt các đặc trưng thị giác tổng thể như trang phục, bối cảnh, bố cục ảnh, nhưng đặc trưng riêng biệt của từng danh tính không phải là tín hiệu được ưu tiên trong quá trình huấn luyện tương phản ban đầu, dẫn đến việc trong phạm vi các ảnh cùng một người, thứ tự xếp hạng đôi khi bị chi phối bởi sự tương đồng về bối cảnh hoặc trang phục nhiều hơn là bởi gương mặt. Kết quả phân tích nhầm lẫn liên danh tính ở mục 6.2 củng cố thêm cho cách lý giải này, khi các trường hợp nhầm lẫn thật