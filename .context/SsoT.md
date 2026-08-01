# Tài liệu tham khảo

| #  | Nguồn | Phạm vi sử dụng đúng |
|----|-------|-----------------------|
| 1  | van den Oord, A., Li, Y., & Vinyals, O. (2018). Representation Learning with Contrastive Predictive Coding. arXiv:1807.03748 | Chương 2 (2.1) - nguồn gốc InfoNCE loss |
| 2  | Radford, A., Kim, J. W., Hallacy, C., et al. (2021). Learning Transferable Visual Models From Natural Language Supervision. ICML 2021 | Chương 2 (2.1) - CLIP |
| 3  | Malkov, Y. A., & Yashunin, D. A. (2020). Efficient and Robust Approximate Nearest Neighbor Search Using HNSW Graphs. IEEE TPAMI, 42(4) | Chương 2 (2.2) - thuật toán HNSW |
| 4  | pgvector. pgvector: Open-source Vector Similarity Search for Postgres. GitHub | Chương 2 (2.2) - cú pháp, tham số HNSW trong pgvector |
| 5  | Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures. UC Irvine | Chương 2 (2.3) - REST |
| 6  | FastAPI. Dependencies. fastapi.tiangolo.com | Chương 2 (2.3) - Dependency Injection |
| 7  | Docker. Networking in Compose. docs.docker.com | Chương 2 (2.4) - mạng Docker Compose |
| 8  | MinIO. MinIO AIStor Documentation. min.io | Chương 2 (2.4) - object storage, presigned URL |
| 9  | Manning, C. D., Raghavan, P., & Schütze, H. (2008). Introduction to Information Retrieval. Cambridge | Chương 3 (3.3) - Precision, Recall; Chương 5 (5.1 cũ/5.2.2) - khái niệm ground truth |
| 10 | Voorhees, E. M., & Tice, D. M. (1999). The TREC-8 Question Answering Track Evaluation | Chương 3 (3.3) - MRR |
| 11 | Young, P., Lai, A., Hodosh, M., & Hockenmaier, J. (2014). From image descriptions to visual denotations. TACL, 2 | Chương 5-6 - nguồn gốc Flickr30K |
| 12 | Chen, W. et al. (2023). Rethinking Benchmarks for Cross-modal Image-text Retrieval. SIGIR 2023, arXiv:2304.10824 | Chương 6 (6.1.3) - giới hạn benchmark coarse-grained |
| 13 | Hendriksen, M. et al. (2025). Benchmark Granularity and Model Robustness for Image-Text Retrieval. SIGIR 2025 | Chương 6 (6.1.3) - độ chi tiết caption ảnh hưởng 2 chiều truy vấn |
| 14 | AndresPMD (2021). Clip_CMR: CLIP-based baseline for COCO and F30K. GitHub | Chương 6 (6.1.3) - số liệu đối chiếu CLIP zero-shot |
| 15 | ITRA Documentation. Fine-tuning CLIP for MS-COCO Retrieval | Chương 6/7 - số liệu tham khảo mức cải thiện khi fine-tune |

---

# PHỤ LỤC A. ĐẶC TẢ RÀNG BUỘC DỮ LIỆU HỆ THỐNG SISE

Phụ lục này trình bày đặc tả dữ liệu của hệ thống SISE, được nhóm xây dựng và duy trì xuyên suốt quá trình phát triển như một hợp đồng dữ liệu thống nhất giữa các thành phần của hệ thống. Nội dung được giới hạn ở các bảng và cấu hình liên quan trực tiếp đến bốn chức năng cốt lõi đã trình bày trong thân khóa luận, gồm xác thực người dùng, tải ảnh, tìm kiếm và đánh giá benchmark CLIP, đúng phạm vi đã xác định ở mục 3.1.

## A.1. Cấu hình toàn cục

Các giá trị cấu hình dưới đây đóng vai trò nguồn tham chiếu duy nhất cho toàn bộ hệ thống; không thành phần nào được phép tự định nghĩa lại các giá trị này ở nơi khác.

| Tham số | Giá trị | Ghi chú |
|---------|---------|---------|
| Số chiều vector embedding | 512 | Tương ứng mô hình CLIP ViT-B/32; thay đổi giá trị này đòi hỏi xây dựng lại cột và chỉ mục vector |
| Kích thước file tối đa | 20 MB | Áp dụng cho ảnh tải lên |
| Định dạng ảnh cho phép | image/jpeg, image/png | |
| Thời hạn presigned URL | 3600 giây (1 giờ) | |
| Số lần thử lại tối đa | 3 lần | Backoff theo cấp số nhân: 1s, 2s, 4s |
| Thời hạn hiệu lực Idempotency-Key | 24 giờ | |

---

## A.2. Cấu trúc các bảng dữ liệu chính

### Bảng users
Bảng users lưu trữ thông tin tài khoản người dùng, phục vụ trực tiếp các nghiệp vụ đăng ký, đăng nhập và phân quyền truy cập trong hệ thống.

| Cột | Kiểu dữ liệu | Ghi chú |
|-----|--------------|---------|
| id | SERIAL PRIMARY KEY | |
| username | VARCHAR(50) UNIQUE NOT NULL | |
| email | VARCHAR(100) UNIQUE NOT NULL | |
| password_hash | TEXT NOT NULL | |
| created_at | TIMESTAMP WITH TIME ZONE | Mặc định thời điểm tạo |
| role | VARCHAR(20) | Mặc định user, ràng buộc chỉ nhận user hoặc admin |

---

### Bảng albums
Bảng albums lưu trữ thông tin các album ảnh do người dùng tạo, đóng vai trò đơn vị tổ chức ảnh ở cấp độ người dùng.

| Cột | Kiểu dữ liệu | Ghi chú |
|-----|--------------|---------|
| id | SERIAL PRIMARY KEY | |
| user_id | INTEGER REFERENCES users(id) | Xóa theo tầng khi tài khoản bị xóa |
| title | VARCHAR(100) NOT NULL | |
| description | TEXT | |
| is_public | BOOLEAN | Mặc định false |
| created_at | TIMESTAMP WITH TIME ZONE | |
| deleted_at | TIMESTAMP WITH TIME ZONE, NULL | Cơ chế xóa mềm |

---

### Bảng images
Bảng images lưu trữ metadata của từng ảnh trong hệ thống, đồng thời là bảng duy nhất mang cột vector embedding, đóng vai trò trung tâm trong toàn bộ pipeline tìm kiếm.

| Cột | Kiểu dữ liệu | Ghi chú |
|-----|--------------|---------|
| id | UUID PRIMARY KEY | |
| user_id | INTEGER NOT NULL REFERENCES users(id) | |
| album_id | INTEGER REFERENCES albums(id) | |
| minio_object_name | TEXT UNIQUE NOT NULL | Khóa đối tượng lưu trong MinIO |
| minio_bucket | TEXT NOT NULL | Tên bucket lưu trữ |
| privacy_level | SMALLINT | 0 = riêng tư, 1 = bạn bè, 2 = công khai; mặc định 2 |
| tags | JSONB | Mảng nhãn gắn cho ảnh |
| index_status | VARCHAR(20) | pending, ready, hoặc failed; mặc định pending |
| embedding | vector(512) | Cột vector pgvector, cho phép null cho đến khi lập chỉ mục xong |
| created_at | TIMESTAMP WITH TIME ZONE | |
| updated_at | TIMESTAMP WITH TIME ZONE | |
| deleted_at | TIMESTAMP WITH TIME ZONE, NULL | Cơ chế xóa mềm |

Ngoài các chỉ mục quan hệ thông thường trên các cột user_id, privacy_level, created_at và index_status, cột tags được đánh chỉ mục GIN để phục vụ truy vấn theo nhãn. Cấu hình chỉ mục HNSW trên cột embedding được trình bày chi tiết tại mục A.3.

---

### Bảng evaluation_runs
Bảng evaluation_runs lưu trữ lịch sử các lần chạy đánh giá benchmark chất lượng truy vấn, phục vụ chức năng đánh giá đã trình bày ở mục 4.3.

| Cột | Kiểu dữ liệu | Ghi chú |
|-----|--------------|---------|
| eval_id | UUID PRIMARY KEY | |
| status | VARCHAR(20) NOT NULL | pending, running, completed, hoặc failed |
| query_count | INTEGER | Mặc định 0 |
| limit_images | INTEGER | |
| seed | INTEGER | |
| created_by | INTEGER REFERENCES users(id) | |
| started_at | TIMESTAMP WITH TIME ZONE | |
| completed_at | TIMESTAMP WITH TIME ZONE, NULL | |

---

### Bảng evaluation_metrics
Bảng evaluation_metrics lưu trữ kết quả bốn chỉ số đánh giá, công thức đã trình bày ở mục 3.3, được tính toán cho mỗi lần chạy đánh giá tương ứng.

| Cột | Kiểu dữ liệu | Ghi chú |
|-----|--------------|---------|
| eval_id | UUID PRIMARY KEY REFERENCES evaluation_runs(eval_id) | Xóa theo tầng |
| mrr | REAL NOT NULL | |
| hit_rate | REAL NOT NULL | |
| precision | REAL NOT NULL | Tên cột trùng với từ khóa dành riêng của SQL, cần đặt trong dấu ngoặc kép khi định nghĩa bảng |
| recall | REAL NOT NULL | |
| computed_at | TIMESTAMP WITH TIME ZONE | |

---

## A.3. Cấu hình chỉ mục vector

| Thông số | Giá trị |
|----------|---------|
| Loại chỉ mục | HNSW |
| Tham số M | 16 |
| Tham số ef_construction | 200 |
| Tham số ef_search | 64 |
| Độ đo tương đồng | Cosine |
| Toán tử pgvector | vector_cosine_ops |

---

## A.4. Cấu hình lưu trữ đối tượng (MinIO)

| Thông số | Giá trị |
|----------|---------|
| Bucket ảnh gốc | raw-images |
| Bucket ảnh thu nhỏ | thumbnails |
| Chính sách truy cập | Riêng tư, chỉ truy cập qua presigned URL |
| Quy ước đặt tên đối tượng | {user_id}/{album_id}/{image_id}.jpg |
| Thời hạn presigned URL | 3600 giây |

---

## A.5. Quy trình xử lý dữ liệu khi tải ảnh

Việc ghi nhận một ảnh mới vào hệ thống được thực hiện thông qua 4 bước tuần tự, phản ánh đúng luồng nghiệp vụ đã mô tả ở mục 4.3.

1. Backend tạo một presigned URL cùng khóa đối tượng từ MinIO và trả về cho client.  
2. Client sử dụng chính presigned URL đó để tải file ảnh trực tiếp lên MinIO, không đi qua backend.  
3. Sau khi tải thành công, client gọi lại backend để xác nhận; backend ghi nhận metadata vào bảng images với trạng thái lập chỉ mục là pending.  
4. Một tác vụ nền được kích hoạt để lấy ảnh từ MinIO, gửi sang dịch vụ suy luận CLIP để sinh vector embedding, ghi vector vào cột embedding, rồi cập nhật trạng thái lập chỉ mục thành ready.  

Toàn bộ các bước có khả năng thay đổi dữ liệu đều được gắn khóa định danh duy nhất, đảm bảo rằng nếu client gửi lại cùng một request do sự cố mạng, hệ thống trả về đúng kết quả của lần xử lý gốc thay vì xử lý lại từ đầu.

---

# PHỤ LỤC B. ĐẶC TẢ HỢP ĐỒNG API HỆ THỐNG SISE

Phụ lục này trình bày đặc tả các endpoint RESTful thuộc bốn nhóm chức năng cốt lõi của hệ thống SISE, gồm xác thực người dùng, quản lý và tải ảnh, tìm kiếm, và đánh giá benchmark CLIP. Toàn bộ endpoint đều do backend đảm nhiệm phục vụ, đóng vai trò cổng giao tiếp duy nhất mà giao diện web gọi tới; hai dịch vụ nội bộ phía sau, gồm dịch vụ suy luận CLIP và dịch vụ lưu trữ vector, không lộ diện trực tiếp với giao diện web.

## B.1. Quy ước chung

Mọi endpoint yêu cầu xác thực đều sử dụng cơ chế Bearer Token dưới dạng JWT theo thuật toán HS256, gắn trong header Authorization. Nội dung mã truy cập chỉ chứa mã định danh người dùng, tên đăng nhập và thời điểm hết hạn, không lưu vai trò người dùng, nhằm tránh tình trạng quyền hạn bị lỗi thời khi vai trò người dùng thay đổi trong thời gian phiên đăng nhập còn hiệu lực.

Các endpoint có khả năng làm thay đổi dữ liệu, bao gồm tạo mới và cập nhật, đều hỗ trợ header tùy chọn Idempotency-Key. Nếu client gửi lại cùng một khóa trong vòng 24 giờ, hệ thống trả về đúng kết quả của lần gọi thành công đầu tiên kèm mã trạng thái 409, thay vì xử lý lại yêu cầu; đây được xem là phản hồi thành công về mặt ngữ nghĩa nghiệp vụ, không phải một lỗi.

Định dạng lỗi được thống nhất trên toàn hệ thống, gồm ba trường: mã lỗi dạng chuỗi định danh, thông điệp mô tả, và chi tiết bổ sung tùy chọn phục vụ gỡ lỗi.

---

## B.2. Nhóm chức năng xác thực

| Endpoint | Phương thức | Chức năng | Mã trạng thái chính |
|----------|-------------|-----------|---------------------|
| /auth/register | POST | Đăng ký tài khoản mới, mật khẩu được mã hóa trước khi lưu | 201 tạo thành công, trả về hồ sơ người dùng vừa tạo (không kèm mã truy cập); 409 nếu tên đăng nhập hoặc email đã tồn tại; 400 nếu sai định dạng dữ liệu |
| /auth/login | POST | Đăng nhập, nhận mã truy cập JWT | 200 kèm mã truy cập, loại mã, thời hạn hiệu lực tính bằng giây; 401 nếu sai tên đăng nhập hoặc mật khẩu |
| /auth/me | GET | Lấy thông tin hồ sơ người dùng hiện tại, bao gồm vai trò người dùng thường hoặc quản trị viên | 200; 401 nếu chưa xác thực hoặc mã truy cập không hợp lệ |

Riêng endpoint đăng ký chỉ trả về hồ sơ người dùng vừa tạo, không tự động cấp mã truy cập. Client cần gọi tiếp endpoint đăng nhập để lấy mã truy cập nếu muốn người dùng vào thẳng hệ thống ngay sau khi đăng ký, phản ánh quyết định thiết kế tách biệt hai trách nhiệm là tạo tài khoản và xác thực phiên đăng nhập.

---

## B.3. Nhóm chức năng tải ảnh và quản lý media

| Endpoint | Phương thức | Chức năng | Mã trạng thái chính |
|----------|-------------|-----------|---------------------|
| /media/upload-url | POST | Bước một của luồng tải ảnh chính thức: tạo đường dẫn có chữ ký số để client tải file trực tiếp lên hệ thống lưu trữ đối tượng | 200 kèm đường dẫn tải lên, khóa đối tượng, thời hạn hiệu lực, ràng buộc dung lượng và định dạng cho phép; 409 nếu trùng khóa idempotency |
| /media/upload/confirm | POST | Bước ba của luồng tải ảnh chính thức: xác nhận đã tải xong, ghi nhận metadata với trạng thái lập chỉ mục đang chờ xử lý, tự động đưa vào hàng đợi tính vector đặc trưng | 200 xác nhận và đưa vào hàng đợi xử lý; 409 nếu trùng khóa idempotency |
| /media/upload | POST | Luồng tải ảnh dự phòng: ảnh được gửi dạng multipart trực tiếp qua backend thay vì thực hiện qua ba bước ở trên | 201 tạo thành công; 409 nếu trùng khóa idempotency; 413 nếu vượt kích thước cho phép |
| /media/{image_id} | GET | Lấy metadata một ảnh cụ thể, kèm đường dẫn xem ảnh có chữ ký | 200; 401 nếu chưa xác thực |
| /media/{image_id}/update | PUT | Cập nhật metadata ảnh, gồm album, mức riêng tư và nhãn | 200; 403 nếu không phải chủ sở hữu; 404 nếu không tìm thấy ảnh |
| /media/{image_id}/delete | DELETE | Xóa mềm một ảnh, đánh dấu đã xóa mà không xóa vật lý khỏi hệ thống lưu trữ | 204 không có nội dung phản hồi; 403 nếu không phải chủ sở hữu; 404 nếu không tìm thấy ảnh |
| /media | GET | Liệt kê ảnh của người dùng hiện tại, hỗ trợ phân trang và lọc theo album | 200 kèm danh sách, tổng số lượng, vị trí bắt đầu và giới hạn trang |

Luồng tải ảnh chính thức của hệ thống được thiết kế theo 3 bước tuần tự. Trước hết, client gọi /media/upload-url để lấy đường dẫn có chữ ký số. Tiếp theo, client tự thực hiện thao tác đưa file nhị phân trực tiếp lên hệ thống lưu trữ đối tượng bằng chính đường dẫn đó, không đi qua backend và không cần đính kèm mã truy cập vì bản thân chữ ký trong đường dẫn đã đóng vai trò xác thực. Cuối cùng, client gọi /media/upload/confirm để hoàn tất, bước này yêu cầu bắt buộc phải cung cấp khóa đối tượng nhận được từ bước một cùng với album đích và mức riêng tư của ảnh. Endpoint /media/upload chỉ đóng vai trò dự phòng cho trường hợp không thể thực hiện tải trực tiếp, không thuộc luồng chính của hệ thống.

Đường dẫn có chữ ký số trong hai endpoint /media/upload-url và /media/{image_id} cần được sinh với địa chỉ máy chủ mà trình duyệt của người dùng cuối có thể truy cập được, một điểm cần lưu ý riêng khi hệ thống lưu trữ đối tượng và tầng backend cùng chạy trong môi trường container hóa, vì địa chỉ nội bộ dùng cho giao tiếp giữa các dịch vụ phía sau không nhất thiết truy cập được từ phía trình duyệt.

---

## B.4. Nhóm chức năng tìm kiếm

| Endpoint | Phương thức | Chức năng | Mã trạng thái chính |
|----------|-------------|-----------|---------------------|
| /search/image | POST | Tìm kiếm bằng ảnh mẫu, nhận file multipart kèm tham số số lượng kết quả tối đa, độ đo tương đồng, và tùy chọn giới hạn phạm vi tìm kiếm trong một album cụ thể | 200 kèm danh sách kết quả xếp hạng; 400 nếu yêu cầu không hợp lệ |
| /search/text | POST | Tìm kiếm bằng mô tả văn bản, sử dụng cùng bộ tham số như trên | 200 kèm danh sách kết quả xếp hạng; 400 nếu yêu cầu không hợp lệ |

Cả hai endpoint tìm kiếm đều là lớp bọc ứng dụng: nội bộ backend gọi tuần tự sang dịch vụ suy luận CLIP để sinh vector đặc trưng cho truy vấn, dù đầu vào là ảnh hay văn bản, rồi gọi sang tầng lưu trữ vector để thực hiện tìm kiếm lân cận gần đúng kết hợp lọc theo quyền riêng tư và phạm vi album. Giao diện chỉ thấy một endpoint duy nhất cho mỗi chế độ truy vấn, không cần biết đến sự tồn tại của hai dịch vụ nội bộ phía sau. Độ đo tương đồng được sử dụng thống nhất trên toàn hệ thống là cosine similarity. Kết quả trả về gồm danh sách ảnh xếp hạng theo điểm tương đồng, mỗi kết quả kèm mã định danh, điểm số, đường dẫn ảnh và metadata đầy đủ, cùng thời gian xử lý truy vấn tính bằng mili giây và số lượng kết quả tối đa đã yêu cầu.

---

## B.5. Nhóm chức năng đánh giá benchmark

| Endpoint | Phương thức | Chức năng | Mã trạng thái chính |
|----------|-------------|-----------|---------------------|
| /eval/run | POST | Khởi chạy một lượt đánh giá benchmark trên tập ảnh đã lập chỉ mục, chỉ dành cho tài khoản có vai trò quản trị | 202 kèm mã định danh lượt chạy và trạng thái; 403 nếu tài khoản không có vai trò quản trị |
| /eval/results/{eval_id} | GET | Truy vấn lại kết quả của một lượt đánh giá đã hoàn tất theo mã định danh | 200; 404 nếu không tìm thấy |
| /eval/metrics | GET | Lấy bốn chỉ số của lượt đánh giá gần nhất đã hoàn tất và được lưu lại | 200; 401 nếu chưa xác thực |

Quyền truy cập nhóm chức năng này được xác định dựa trên cột vai trò của người dùng trong bảng tài khoản, được truy vấn lại từ cơ sở dữ liệu ở mỗi lượt gọi thay vì đọc từ nội dung mã truy cập, nhằm tránh tình trạng quyền hạn đã cấp bị lỗi thời nếu vai trò người dùng thay đổi trong thời gian phiên đăng nhập còn hiệu lực, cùng cơ chế xác thực vai trò với nhóm chức năng quản trị hệ thống. Kết quả bốn chỉ số cốt lõi thuộc lĩnh vực truy hồi thông tin, gồm điểm nghịch đảo thứ hạng trung bình, tỷ lệ tìm thấy, độ chính xác và độ bao phủ, được tính toán và lưu lại cho mỗi lượt chạy, phục vụ đối chiếu và theo dõi chất lượng mô hình theo thời gian.

Cần lưu ý rằng dù endpoint khởi chạy đánh giá trả về mã trạng thái 202, thường dùng để biểu thị một tác vụ đã được tiếp nhận và sẽ xử lý bất đồng bộ, hành vi triển khai thực tế của hệ thống lại thực hiện toàn bộ lượt đánh giá một cách đồng bộ trong cùng một lượt gọi. Phản hồi chỉ được trả về sau khi quá trình tính toán bốn chỉ số đã hoàn tất, không có cơ chế thăm dò trạng thái riêng biệt. Đây là quyết định đơn giản hóa phù hợp với quy mô dữ liệu benchmark của khóa luận, được ghi nhận như một hạn chế thiết kế đã biết.

---

## B.6. Cấu trúc dữ liệu phản hồi chính

| Cấu trúc | Nội dung |
|----------|----------|
| PresignedUploadResponse | Đường dẫn tải lên có chữ ký số, khóa đối tượng lưu trữ, thời hạn hiệu lực tính bằng giây, dung lượng file tối đa cho phép tính bằng megabyte, và danh sách định dạng nội dung được chấp nhận |
| UploadResponse | Mã định danh ảnh, đường dẫn xem ảnh có chữ ký, trạng thái tổng quát, và trạng thái lập chỉ mục nhận một trong ba giá trị đang chờ, đã sẵn sàng, hoặc thất bại |
| ImageMetadata | Mã định danh ảnh, mã người dùng sở hữu, mã album, đường dẫn xem ảnh có chữ ký, mức riêng tư, danh sách nhãn tùy chỉnh, thời điểm tạo, và trạng thái lập chỉ mục |
| SearchResponse | Danh sách kết quả theo cấu trúc gồm mã định danh ảnh, điểm tương đồng cosine, đường dẫn ảnh có chữ ký và metadata đầy đủ theo cấu trúc ImageMetadata, cùng thời gian xử lý truy vấn và số lượng kết quả tối đa đã yêu cầu |
| User | Mã định danh, tên đăng nhập, email, thời điểm tạo tài khoản, và vai trò nhận một trong hai giá trị là người dùng thường hoặc quản trị viên |

---

# PHỤ LỤC C. ĐẶC TẢ KIẾN TRÚC HỆ THỐNG SISE

Phụ lục này trình bày nguyên tắc tổ chức mã nguồn theo kiến trúc năm lớp hướng nghiệp vụ, gọi là Workflow-Centric Architecture, được nhóm xây dựng và áp dụng thống nhất cho toàn bộ các thành phần Python của hệ thống SISE.

---

## C.1. Năm lớp thành phần cốt lõi

Toàn bộ mã nguồn của mỗi thành phần được tổ chức vào đúng năm lớp sau đây, mỗi lớp đảm nhiệm một trách nhiệm duy nhất.

| Lớp | Vai trò |
|-----|---------|
| Configs (Cấu hình ngoại vi) | Lưu trữ tham số môi trường, thông tin kết nối và các hằng số không thay đổi ở runtime, tách biệt hoàn toàn khỏi thư mục mã nguồn logic; đặt độc lập ở thư mục gốc dự án, ngang hàng với thư mục mã nguồn chính |
| Entities (Thực thể dữ liệu) | Định nghĩa cấu trúc dữ liệu thuần túy, bao gồm các Pydantic model đối với Python hoặc kiểu dữ liệu TypeScript đối với frontend; tuyệt đối không chứa logic xử lý |
| Adapters (Cầu nối ngoại vi) | Nơi duy nhất mã nguồn được phép giao tiếp trực tiếp với thế giới bên ngoài; bất kỳ thư viện nào thực thi kết nối, như SQLAlchemy cho cơ sở dữ liệu, MinIO client cho object storage, hay PyTorch cho suy luận mô hình AI, đều phải được bọc lại ở lớp này |
| Services (Logic nghiệp vụ) | Chứa toàn bộ logic nghiệp vụ thuần túy của từng workflow; nhận đầu vào từ Routers, thao tác dữ liệu dựa trên định nghĩa của Entities, và gọi xuống Adapters khi cần lưu trữ hoặc tính toán liên quan đến hạ tầng ngoài |
| Routers (Giao tiếp HTTP) | Cánh cửa tiếp nhận dữ liệu đầu vào; ở phía backend, đây là các endpoint HTTP định nghĩa bằng FastAPI, chỉ dừng lại ở việc xác thực dữ liệu đầu vào và điều hướng lời gọi xuống Services, không chứa logic nghiệp vụ |

---

## C.2. Nguyên tắc tổ chức theo bộ tệp workflow

Khác với kiến trúc MVC truyền thống, nơi các thành phần cùng loại được gom chung vào một thư mục lớn dùng cho toàn bộ hệ thống, SISE nhóm năm lớp trên theo từng nghiệp vụ cụ thể, gọi là một workflow. Mỗi workflow sở hữu một bộ bốn tệp mã nguồn mang cùng tiền tố tên nghiệp vụ, ví dụ toàn bộ tệp `search_entities`, `search_adapters`, `search_services`, `search_routers` phục vụ riêng cho nghiệp vụ tìm kiếm.

Cách tổ chức này giúp khi cần chỉnh sửa một nghiệp vụ cụ thể, người phát triển chỉ cần quan tâm đến đúng bộ tệp mang tên nghiệp vụ đó, hạn chế tình trạng mã nguồn của nhiều chức năng khác nhau trộn lẫn trong cùng một tệp lớn. Đổi lại, cách làm này chấp nhận một mức độ lặp lại mã nguồn nhất định và giảm khả năng tái sử dụng chéo giữa các nghiệp vụ, để đổi lấy ranh giới trách nhiệm rõ ràng và khả năng gỡ lỗi trực quan hơn, một sự đánh đổi phù hợp với quy mô một hệ thống prototype được phát triển bởi một nhóm nhỏ.

---

## C.3. Quy tắc phân quyền truy cập tài nguyên

Kiến trúc quy định rõ ràng phạm vi mỗi thành phần được phép thao tác trực tiếp với hạ tầng dữ liệu, nhằm tránh tình trạng nhiều thành phần cùng ghi vào một nguồn dữ liệu theo những con đường khác nhau. Backend được phép thao tác trực tiếp bằng SQLAlchemy vào các bảng quan hệ như người dùng, album và metadata ảnh, ngoại trừ cột lưu vector embedding. Cột vector bắt buộc phải được ghi và đọc thông qua các endpoint REST chuyên biệt của tầng lưu trữ, vì đây là tài nguyên gắn liền với chỉ mục ANN; việc để nhiều thành phần cùng ghi trực tiếp vào cột này sẽ tái tạo lại đúng loại rủi ro mất đồng bộ dữ liệu mà việc thống nhất toàn bộ vào một cơ sở dữ liệu quan hệ duy nhất đã giải quyết. Giao diện web tuyệt đối không được kết nối trực tiếp tới cơ sở dữ liệu dưới bất kỳ hình thức nào, toàn bộ thao tác dữ liệu của giao diện đều phải đi qua các endpoint REST của backend.

---

## C.4. Cơ chế khởi tạo và tiêm phụ thuộc

Lớp Services không tự khởi tạo lớp Adapters. Thay vào đó, các Adapters được tiêm vào thông qua cơ chế Dependency Injection tại vòng Routers, cụ thể là hệ thống `Depends()` của FastAPI. Việc tiêm phụ thuộc theo cách này cho phép kiểm thử riêng biệt logic nghiệp vụ ở lớp Services mà không cần thực hiện các thao tác I/O mạng thật. Đối với các thành phần cần khởi tạo một lần duy nhất và tái sử dụng xuyên suốt vòng đời ứng dụng, như mô hình CLIP đã trình bày ở mục 4.1, việc khởi tạo được thực hiện trong giai đoạn khởi động của FastAPI, sau đó công bố lên trạng thái toàn cục của ứng dụng để các Router truy xuất lại tại thời điểm xử lý từng request.

---

## C.5. Cơ chế đảm bảo tính bất biến của request

Các endpoint có khả năng làm thay đổi dữ liệu đều hỗ trợ header định danh duy nhất cho mỗi lần thao tác, có hiệu lực trong 24 giờ. Nếu client gửi lại cùng một khóa định danh, hệ thống bắt buộc phải trả về đúng cấu trúc phản hồi của lần gọi thành công đầu tiên, kèm mã trạng thái báo hiệu xung đột, thay vì xử lý lại yêu cầu từ đầu. Nguyên tắc này đảm bảo an toàn cho các thao tác có tác dụng phụ khi client gặp sự cố mạng và buộc phải gửi lại request, tránh tạo ra dữ liệu trùng lặp hoặc kích hoạt lại một tác vụ tính toán tốn kém như sinh embedding.

---

## C.6. Nguyên tắc quản lý độ phức tạp

Kiến trúc đặt ưu tiên cho tính cố kết ngữ cảnh của mỗi workflow hơn là việc chia nhỏ mã nguồn một cách máy móc theo giới hạn số dòng. Khi một workflow có bản chất kỹ thuật tách biệt rõ ràng, ví dụ luồng xử lý đồng bộ khi tiếp nhận request và luồng xử lý bất đồng bộ chạy nền để lập chỉ mục, hai luồng này được tổ chức thành hai workflow độc lập ngay từ giai đoạn thiết kế, thay vì gộp chung rồi chờ đến khi mã nguồn quá dài mới tách. Nguyên tắc này được áp dụng cụ thể cho cặp workflow tải ảnh và lập chỉ mục của SISE, phản ánh đúng sự khác biệt giữa xử lý đồng bộ trong vòng đời một request HTTP và xử lý bất đồng bộ chạy nền bằng tác vụ hàng đợi.
