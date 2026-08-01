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
