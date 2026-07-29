# PHỤ LỤC C. ĐẶC TẢ KIẾN TRÚC HỆ THỐNG SISE
Phụ lục này trình bày nguyên tắc tổ chức mã nguồn theo kiến trúc năm lớp hướng nghiệp vụ, gọi là Workflow-Centric Architecture, được nhóm xây dựng và áp dụng thống nhất cho toàn bộ các thành phần Python của hệ thống SISE.

## C.1. Năm lớp thành phần cốt lõi
Toàn bộ mã nguồn của mỗi thành phần được tổ chức vào đúng năm lớp sau đây, mỗi lớp đảm nhiệm một trách nhiệm duy nhất.

- **Configs (Cấu hình ngoại vi)**: Nơi lưu trữ tham số môi trường, thông tin kết nối và các hằng số không thay đổi ở runtime, tách biệt hoàn toàn khỏi thư mục mã nguồn logic. Đặt độc lập ở thư mục gốc dự án, ngang hàng với thư mục mã nguồn chính.  
- **Entities (Thực thể dữ liệu)**: Lớp định nghĩa cấu trúc dữ liệu thuần túy, bao gồm các Pydantic model đối với Python hoặc kiểu dữ liệu TypeScript đối với frontend. Lớp này tuyệt đối không chứa logic xử lý.  
- **Adapters (Cầu nối ngoại vi)**: Nơi duy nhất mã nguồn được phép giao tiếp trực tiếp với thế giới bên ngoài. Bất kỳ thư viện nào thực thi kết nối, như SQLAlchemy cho cơ sở dữ liệu, MinIO client cho object storage, hay PyTorch cho suy luận mô hình AI, đều phải được bọc lại ở lớp này.  
- **Services (Logic nghiệp vụ)**: Chứa toàn bộ logic nghiệp vụ thuần túy của từng workflow. Services nhận đầu vào từ Routers, thao tác dữ liệu dựa trên định nghĩa của Entities, và gọi xuống Adapters khi cần lưu trữ hoặc tính toán liên quan đến hạ tầng ngoài.  
- **Routers (Giao tiếp HTTP)**: Cánh cửa tiếp nhận dữ liệu đầu vào. Ở phía backend, đây là các endpoint HTTP định nghĩa bằng FastAPI. Trách nhiệm của lớp này chỉ dừng lại ở việc xác thực dữ liệu đầu vào và điều hướng lời gọi xuống Services, không chứa logic nghiệp vụ.  

---

## C.2. Nguyên tắc tổ chức theo bộ tệp workflow
Khác với kiến trúc MVC truyền thống, nơi các thành phần cùng loại được gom chung vào một thư mục lớn dùng cho toàn bộ hệ thống, SISE nhóm năm lớp trên theo từng nghiệp vụ cụ thể, gọi là một workflow. Mỗi workflow sở hữu một bộ bốn tệp mã nguồn mang cùng tiền tố tên nghiệp vụ, ví dụ toàn bộ tệp `search_entities`, `search_adapters`, `search_services`, `search_routers` phục vụ riêng cho nghiệp vụ tìm kiếm.  

Cách tổ chức này giúp khi cần chỉnh sửa một nghiệp vụ cụ thể, người phát triển chỉ cần quan tâm đến đúng bộ tệp mang tên nghiệp vụ đó, hạn chế tình trạng mã nguồn của nhiều chức năng khác nhau trộn lẫn trong cùng một tệp lớn. Đổi lại, cách làm này chấp nhận một mức độ lặp lại mã nguồn nhất định và giảm khả năng tái sử dụng chéo giữa các nghiệp vụ, để đổi lấy ranh giới trách nhiệm rõ ràng và khả năng gỡ lỗi trực quan hơn, một sự đánh đổi phù hợp với quy mô một hệ thống prototype được phát triển bởi một nhóm nhỏ.  

---

## C.3. Quy tắc phân quyền truy cập tài nguyên
Kiến trúc quy định rõ ràng phạm vi mỗi thành phần được phép thao tác trực tiếp với hạ tầng dữ liệu, nhằm tránh tình trạng nhiều thành phần cùng ghi vào một nguồn dữ liệu theo những con đường khác nhau. Backend được phép thao tác trực tiếp bằng SQLAlchemy vào các bảng quan hệ như người dùng, album và metadata ảnh, ngoại trừ cột lưu vector embedding. Cột vector bắt buộc phải được ghi và đọc thông qua các endpoint REST chuyên biệt của tầng lưu trữ, vì đây là tài nguyên gắn liền với chỉ mục ANN, việc để nhiều thành phần cùng ghi trực tiếp vào cột này sẽ tái tạo lại đúng loại rủi ro mất đồng bộ dữ liệu mà việc thống nhất toàn bộ vào một cơ sở dữ liệu quan hệ duy nhất đã giải quyết. Giao diện web tuyệt đối không được kết nối trực tiếp tới cơ sở dữ liệu dưới bất kỳ hình thức nào, toàn bộ thao tác dữ liệu của giao diện đều phải đi qua các endpoint REST của backend.  

---

## C.4. Cơ chế khởi tạo và tiêm phụ thuộc
Lớp Services không tự khởi tạo lớp Adapters. Thay vào đó, các Adapters được tiêm vào thông qua cơ chế Dependency Injection tại vòng Routers, cụ thể là hệ thống `Depends()` của FastAPI. Việc tiêm phụ thuộc theo cách này cho phép kiểm thử riêng biệt logic nghiệp vụ ở lớp Services mà không cần thực hiện các thao tác I/O mạng thật. Đối với các thành phần cần khởi tạo một lần duy nhất và tái sử dụng xuyên suốt vòng đời ứng dụng, như mô hình CLIP đã trình bày ở mục 4.1, việc khởi tạo được thực hiện trong giai đoạn khởi động của FastAPI, sau đó công bố lên trạng thái toàn cục của ứng dụng để các Router truy xuất lại tại thời điểm xử lý từng request.  

---

## C.5. Cơ chế đảm bảo tính bất biến của request
Các endpoint có khả năng làm thay đổi dữ liệu đều hỗ trợ header định danh duy nhất cho mỗi lần thao tác, có hiệu lực trong hai mươi bốn giờ. Nếu client gửi lại cùng một khóa định danh, hệ thống bắt buộc phải trả về đúng cấu trúc phản hồi của lần gọi thành công đầu tiên, kèm mã trạng thái báo hiệu xung đột, thay vì xử lý lại yêu cầu từ đầu. Nguyên tắc này đảm bảo an toàn cho các thao tác có tác dụng phụ khi client gặp sự cố mạng và buộc phải gửi lại request, tránh tạo ra dữ liệu trùng lặp hoặc kích hoạt lại một tác vụ tính toán tốn kém như sinh embedding.  

---

## C.6. Nguyên tắc quản lý độ phức tạp
Kiến trúc đặt ưu tiên cho tính cố kết ngữ cảnh của mỗi workflow hơn là việc chia nhỏ mã nguồn một cách máy móc theo giới hạn số dòng. Khi một workflow có bản chất kỹ thuật tách biệt rõ ràng, ví dụ luồng xử lý đồng bộ khi tiếp nhận request và luồng xử lý bất đồng bộ chạy nền để lập chỉ mục, hai luồng này được tổ chức thành hai workflow độc lập ngay từ giai đoạn thiết kế, thay vì gộp chung rồi chờ đến khi mã nguồn quá dài mới tách. Nguyên tắc này được áp dụng cụ thể cho cặp workflow tải ảnh và lập chỉ mục của SISE, phản ánh đúng sự khác biệt giữa xử lý đồng bộ trong vòng đời một request HTTP và xử lý bất đồng bộ chạy nền bằng tác vụ hàng đợi.
