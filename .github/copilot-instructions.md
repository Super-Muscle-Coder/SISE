# Copilot Instructions

## General Guidelines
- Sử dụng tiếng Việt cho tất cả các phản hồi hướng tới người dùng (người dùng thích tiếng Việt).
- Lưu ý vai trò nhóm: Giám đốc dự án (PM).

## Project Guidelines
- Viết tất cả các tệp .github hoàn toàn bằng tiếng Anh chuyên nghiệp (không có văn bản tiếng Việt).

### Kiến Trúc & Tổ Chức Tệp Tin
- Áp dụng kiến trúc năm lớp độc quyền: configs, entities, adapters, services, routers.
- Kết hợp kiến trúc năm lớp với thiết kế Theo Trung Tâm Quy Trình: cấu trúc mã xung quanh các quy trình làm việc và trách nhiệm của chúng.
- Giới hạn tái sử dụng cross-domain: thực thi quyền sở hữu tệp/mô-đun và ngăn chặn các tệp hoạt động như "tự do" trên nhiều miền kinh doanh để đảm bảo tính đầy đủ và trách nhiệm minh bạch.
- Gán và tài liệu hóa một chủ sở hữu rõ ràng cho mỗi tệp/mô-đun; thực thi quyền sở hữu và quy tắc tái sử dụng thông qua đánh giá mã và kiểm tra CI.
- Xử lý các tên tệp dài bằng cách xuất các tên công khai ngắn gọn từ các tệp __init__.py của gói; tiết lộ các API ổn định thông qua xuất khẩu gói trong khi giữ các tên tệp nội bộ rõ ràng.

## Tài Liệu Đại Lý
- Xác định audit_required cho các đại lý quan trọng: đặt audit_required: true trong tài liệu đại lý và giải thích lý do tại sao đại lý đó lại quan trọng.
- Tài liệu hóa chủ sở hữu, phân loại bảo mật, phụ thuộc, thời gian hoạt động mong đợi và yêu cầu độ bền cho mỗi đại lý.
- Tham chiếu cơ chế hoàn nguyên và sổ tay quy trình trong tài liệu của từng đại lý.
- Giữ cho tài liệu đại lý ngắn gọn và có phiên bản.

## Bảo Mật & Quản Lý Bí Mật
- Lưu trữ tất cả bí mật trong một trình quản lý bí mật tập trung, được mã hóa; tránh mã hóa cứng bí mật.
- Sử dụng vai trò IAM với quyền tối thiểu cho quyền truy cập của đại lý vào bí mật và tài nguyên.
- Định kỳ quay vòng bí mật và khi nghi ngờ bị xâm phạm; ghi lại chủ sở hữu và lịch trình quay vòng.
- Kiểm tra nhật ký truy cập bí mật và bao gồm các bước xem xét quyền truy cập trong tài liệu đại lý.
- Gắn thẻ bí mật với siêu dữ liệu về môi trường và chủ sở hữu.

## Độ Bền & Kiểm Tra
- Xác định nhịp độ kiểm tra độ bền: thực hiện hàng tháng cho các đại lý quan trọng và hàng quý cho các đại lý không quan trọng; chạy các bài kiểm tra sau các thay đổi lớn.
- Sử dụng các công cụ được thiết lập cho kiểm tra độ bền và kiểm tra tải (ví dụ: Chaos Monkey/Gremlin cho kiểm tra hỗn loạn, k6/Locust cho kiểm tra tải).
- Duy trì sổ tay kiểm tra, kết quả mong đợi và hành động khắc phục sau kiểm tra.
- Bao gồm kiểm tra khói và sức khỏe tự động trong các quy trình CI/CD.

## Cơ Chế Hoàn Nguyên & Khôi Phục
- Xác định cơ chế hoàn nguyên rõ ràng trong tài liệu: hỗ trợ hoàn nguyên tự động trong CI/CD, giữ lại các sản phẩm có thể triển khai trước đó và sử dụng cờ tính năng để vô hiệu hóa các tính năng một cách an toàn.
- Tài liệu hóa các thủ tục hoàn nguyên di chuyển cơ sở dữ liệu và chính sách giữ dữ liệu sao lưu.
- Kiểm tra các thủ tục hoàn nguyên trong quá trình kiểm tra độ bền và ghi lại kết quả trong sổ tay.
- Gán chủ sở hữu hoàn nguyên và thủ tục liên lạc cho các nhóm trực ca.

## Quản Lý Kiến Thức & Kiểm Toán
- Tiến hành xem xét quản lý kiến thức với tần suất hàng tuần (ví dụ: kiểm toán AG-00 hàng tuần).
- Ghi lại kết quả kiểm toán, hành động khắc phục và chủ sở hữu; theo dõi tiến độ hoàn thành các mục kiểm toán.
- Đánh dấu các đại lý quan trọng với audit_required và đảm bảo các hành động theo dõi được lên lịch và theo dõi.
- Giữ cho tài liệu dễ phát hiện, có phiên bản và được xem xét tại mỗi cuộc kiểm toán AG-00.