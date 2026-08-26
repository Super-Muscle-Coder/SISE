# CÂU HỎI VÀ TRẢ LỜI CHUẨN — 6 LUỒNG NGHIỆP VỤ SISE

*Mỗi câu gồm: câu hỏi, câu trả lời hoàn chỉnh (phần lõi), và các kịch bản rào trước rào sau cho câu hỏi vặn thường gặp.*

---

## CẤP ĐỘ 1 — Câu hỏi chí mạng

### Câu 1. Trình bày luồng Xác thực, đặc biệt cơ chế chống đăng ký trùng lặp.

**Phần lõi**

Luồng xác thực gồm ba endpoint: đăng ký, đăng nhập, và lấy hồ sơ hiện tại. Khi đăng ký, hệ thống kiểm tra trùng lặp tên đăng nhập và email bằng hai lớp bảo vệ độc lập — một lượt truy vấn SELECT kiểm tra trước khi xử lý tiếp, và một lớp bắt lỗi ở tầng ràng buộc toàn vẹn của cơ sở dữ liệu (IntegrityError) khi thực sự ghi bản ghi mới. Lớp thứ hai tồn tại để xử lý đúng trường hợp cạnh tranh: nếu hai yêu cầu đăng ký cùng thông tin gửi gần như đồng thời, cả hai có thể cùng vượt qua bước SELECT (vì tại thời điểm đó chưa ai kịp ghi dữ liệu), nhưng khi ghi thật, chỉ một trong hai thành công — cái còn lại bị chặn bởi ràng buộc ở tầng cơ sở dữ liệu.

Đăng nhập thành công trả về JWT, payload chỉ chứa mã định danh, tên đăng nhập, thời điểm hết hạn — không chứa vai trò người dùng. Mọi endpoint cần kiểm tra quyền quản trị đều truy vấn lại cột vai trò từ cơ sở dữ liệu ở mỗi lượt gọi.

**Rào trước rào sau**

*Nếu hỏi: "Vì sao không chỉ dùng một lớp kiểm tra, sao phải hai lớp?"* — Một lớp SELECT đơn thuần không đủ trong tình huống hai yêu cầu gửi đồng thời, vì cả hai đều có thể đọc được trạng thái "chưa có ai trùng" tại cùng một thời điểm trước khi bất kỳ yêu cầu nào kịp ghi. Chỉ có ràng buộc ở tầng cơ sở dữ liệu, vốn xử lý tuần tự các lệnh ghi, mới đảm bảo được tính đúng đắn tuyệt đối trong tình huống cạnh tranh này.

*Nếu hỏi: "Đăng ký xong có tự động đăng nhập không?"* — Không, theo đúng hợp đồng API, đăng ký chỉ trả về hồ sơ người dùng, không kèm token. Việc Frontend tự động gọi tiếp API đăng nhập ngay sau đó là một quyết định trải nghiệm người dùng, không nằm trong hợp đồng.

---

### Câu 2. Trình bày ba bước của luồng Tải ảnh, chỉ rõ ranh giới đồng bộ/bất đồng bộ.

**Phần lõi**

Ba bước: xin đường dẫn tải lên có chữ ký (S1), client tự tải file trực tiếp lên MinIO không qua Backend (S2), xác nhận hoàn tất để Backend ghi metadata và đưa vào hàng đợi lập chỉ mục (S3). Ranh giới đồng bộ/bất đồng bộ nằm chính xác tại lệnh đưa tác vụ lập chỉ mục vào hàng đợi Celery ở cuối S3 — đây là lệnh không chờ, response trả về ngay sau đó, trước khi ảnh thực sự có vector đặc trưng.

**Rào trước rào sau**

*Nếu hỏi: "Tại sao Frontend được phép chạm thẳng MinIO, đây có phải vi phạm nguyên tắc kiến trúc phân lớp không?"* — Đây là ngoại lệ duy nhất và có chủ đích trong toàn hệ thống, không phải vi phạm tùy tiện. Lý do: giảm tải cho Backend khỏi việc trung chuyển dữ liệu nhị phân nặng, tận dụng đúng năng lực nhận upload trực tiếp mà MinIO đã được thiết kế sẵn. Backend vẫn giữ vai trò kiểm soát bằng cách là bên duy nhất cấp phát đường dẫn có chữ ký, với đầy đủ ràng buộc dung lượng và định dạng đã nhúng sẵn.

*Nếu hỏi: "Nếu S2 thất bại giữa chừng (mất mạng khi đang tải) thì sao?"* — Nếu file chưa tải lên hoàn chỉnh, MinIO sẽ không lưu file đó theo đúng chuẩn giao thức S3/MinIO, người dùng cần thực hiện lại từ đầu (xin presigned URL mới). Nếu client không bao giờ gọi tới bước xác nhận sau khi tải lên thành công, đây chính là tình huống dữ liệu mồ côi — hạn chế đã biết, trình bày chi tiết ở Câu 5.

---

### Câu 3. Trình bày luồng Tìm kiếm, vai trò của Backend trong luồng này là gì?

**Phần lõi**

Backend gọi tuần tự hai dịch vụ nội bộ: AIModule để sinh vector đặc trưng cho nội dung truy vấn (ảnh hoặc văn bản), rồi StorageModule để tìm kiếm gần đúng kết hợp lọc quyền riêng tư ba tầng. Backend đóng vai trò điều phối thuần túy — không tự tính embedding, không tự thực hiện ANN search, chỉ gọi đúng hai module chuyên trách rồi ghép kết quả trả về.

**Rào trước rào sau**

*Nếu hỏi: "Vì sao Backend không tự làm luôn cả việc tính embedding cho nhanh, đỡ phải gọi qua module khác?"* — Vì đây chính là nguyên tắc phân tách trách nhiệm cốt lõi của kiến trúc: mỗi module chỉ đảm nhiệm đúng chuyên môn của nó. Nếu Backend tự tính embedding, nó phải tự nạp mô hình CLIP, trùng lặp hoàn toàn với AIModule, phá vỡ ranh giới rõ ràng giữa các module và mất khả năng phát triển, mở rộng độc lập từng phần.

---

## CẤP ĐỘ 2 — Câu hỏi hóc búa

### Câu 4. Endpoint `/eval/run` trả về mã 202 nhưng xử lý đồng bộ — giải thích và đánh giá.

**Phần lõi**

Mã 202 theo chuẩn HTTP mang ý nghĩa "đã tiếp nhận, sẽ xử lý bất đồng bộ, chưa có kết quả ngay". Nhưng thực tế, toàn bộ quá trình tính bốn chỉ số chạy hoàn toàn đồng bộ trong cùng lượt gọi, response chỉ trả về sau khi tính xong. Đây là sai lệch ngữ nghĩa HTTP thật, đã được nhóm chủ động nhận diện và ghi nhận công khai như một hạn chế thiết kế đã biết, không phải lỗi bị bỏ sót — chấp nhận được vì quy mô dữ liệu benchmark hiện tại (khoảng một nghìn ảnh) đủ nhỏ để hoàn tất trong thời gian ngắn.

**Rào trước rào sau**

*Nếu hỏi: "Sửa lỗi này có khó không, tại sao chưa sửa?"* — Việc sửa không khó về mặt kỹ thuật (chỉ cần đổi sang mã 200 hoặc 201 cho đúng ngữ nghĩa với hành vi đồng bộ hiện tại), phản ánh mức độ ưu tiên trong phạm vi thời gian đồ án, không phải trở ngại kỹ thuật.

*Nếu hỏi: "Nếu muốn làm đúng thành bất đồng bộ thật thì cần gì?"* — Cần tách quá trình tính bốn chỉ số thành một tác vụ Celery chạy nền, tương tự luồng lập chỉ mục, kèm theo một endpoint riêng để thăm dò trạng thái tiến độ, thay vì chờ một lượt gọi duy nhất trả về toàn bộ kết quả.

---

### Câu 5. Cơ chế bù trừ trong luồng Tải ảnh giải quyết vấn đề gì, và còn thiếu gì?

**Phần lõi**

Nếu ghi metadata thất bại sau khi file đã tồn tại thành công trên MinIO, hệ thống chủ động xóa lại chính file đó, đưa hệ thống về trạng thái nhất quán — đây là Saga Pattern đơn giản hóa, cần thiết vì MinIO và PostgreSQL là hai hệ thống tách biệt, không dùng chung được một giao dịch cơ sở dữ liệu.

Cơ chế này chỉ xử lý đúng một chiều thất bại. Tình huống còn thiếu: nếu file đã lên MinIO thành công nhưng client không bao giờ gọi bước xác nhận — hệ thống chưa có cơ chế tự động phát hiện và dọn dẹp dữ liệu mồ côi này.

**Rào trước rào sau**

*Nếu hỏi: "Đề xuất giải pháp cụ thể cho vấn đề dữ liệu mồ côi?"* — Hai hướng khả thi: một là tác vụ dọn dẹp định kỳ (tận dụng Celery Beat đã có sẵn hạ tầng), quét các object không có metadata tương ứng và đã tồn tại quá một khoảng thời gian an toàn rồi xóa; hai là tận dụng tính năng lifecycle policy có sẵn của chính MinIO, gắn thời hạn tự động hết hạn ngay từ lúc sinh presigned URL, gỡ nhãn đó nếu xác nhận thành công.

*Nếu hỏi: "Tại sao không dùng transaction phân tán (2-phase commit) cho đúng chuẩn thay vì cơ chế bù trừ?"* — Two-phase commit đòi hỏi cả hai hệ thống tham gia đều hỗ trợ giao thức đó và một coordinator trung tâm quản lý toàn bộ giao dịch — độ phức tạp triển khai cao hơn nhiều so với quy mô cần thiết của đồ án. Cơ chế bù trừ đơn giản hơn, đủ xử lý đúng trường hợp thực tế phổ biến nhất (ghi metadata thất bại), là lựa chọn thực dụng hơn.

---

### Câu 6. So sánh chiến lược xử lý lỗi giữa Search và Indexing — vì sao khác nhau?

**Phần lõi**

Search hoàn toàn không có cơ chế thử lại khi AIModule hoặc StorageModule gặp lỗi tạm thời — ưu tiên tốc độ phản hồi cho luồng tương tác trực tiếp với người dùng. Indexing có cơ chế thử lại nhiều lớp tinh vi, phân loại lỗi vĩnh viễn (không thử lại) và lỗi tạm thời (thử lại với backoff cấp số nhân) — vì đây là tác vụ chạy nền, không chặn trải nghiệm người dùng trực tiếp, có thể chấp nhận độ trễ để đổi lấy khả năng tự phục hồi.

**Rào trước rào sau**

*Nếu hỏi: "Đây có phải thiếu nhất quán trong thiết kế hệ thống không?"* — Không, đây là sự khác biệt có chủ đích, phản ánh đúng bản chất của từng loại nghiệp vụ. Áp dụng đồng nhất một chiến lược xử lý lỗi cho mọi luồng, bất kể luồng đó đồng bộ hay bất đồng bộ, mới thực sự là thiết kế kém — vì nó bỏ qua sự khác biệt quan trọng về ràng buộc thời gian phản hồi giữa các loại nghiệp vụ.

---

## CẤP ĐỘ 3 — Câu hỏi mở rộng

### Câu 7. Nếu phải chọn đúng một luồng để cải thiện trước tiên, chọn luồng nào và vì sao?

**Phần lõi**

Luồng Tải ảnh, vì hai lý do. Thứ nhất, nó là luồng duy nhất tương tác với nhiều thành phần hạ tầng nhất (Frontend, Backend, MinIO, PostgreSQL, Celery), nên rủi ro thất bại cũng tập trung cao nhất tại đây. Thứ hai, hạn chế lớn nhất của nó — dữ liệu mồ côi tích lũy theo thời gian — là loại vấn đề càng để lâu càng tốn kém để dọn dẹp về sau, khác với các hạn chế khác (như việc chưa có refresh token) vốn không tích lũy chi phí theo thời gian nếu chưa xảy ra sự cố.

**Rào trước rào sau**

*Nếu hỏi: "Vậy tại sao chưa làm ngay từ đầu?"* — Đây là đánh đổi phạm vi có ý thức cho quy mô đồ án: giải pháp (tác vụ dọn dẹp định kỳ) đã được xác định rõ ràng, không đòi hỏi thay đổi kiến trúc, chỉ chưa được ưu tiên triển khai trong thời gian giới hạn của đồ án, ưu tiên tập trung nguồn lực chứng minh tính khả thi của bài toán truy hồi ảnh trước.

---

### Câu 8. Luồng Đánh giá benchmark hiện không có cơ chế thử lại — nếu quy mô dữ liệu tăng lên rất lớn, đây có trở thành vấn đề nghiêm trọng không?

**Phần lõi**

Có, và mức độ nghiêm trọng tăng theo đúng quy mô dữ liệu. Ở quy mô hiện tại (khoảng một nghìn ảnh), một lượt đánh giá thất bại giữa chừng chỉ lãng phí vài giây tới vài chục giây công sức đã xử lý. Nhưng nếu quy mô tăng lên hàng trăm nghìn ảnh, một lỗi mạng thoáng qua ở gần cuối quá trình có thể khiến toàn bộ hàng giờ xử lý phải chạy lại từ đầu — chi phí lãng phí tăng tuyến tính theo quy mô dữ liệu, trong khi xác suất gặp ít nhất một lỗi thoáng qua trong một khoảng thời gian xử lý dài cũng tăng theo.

**Rào trước rào sau**

*Nếu hỏi: "Hướng khắc phục cụ thể?"* — Lưu tạm kết quả từng ảnh mẫu đã xử lý xong vào một bảng trung gian, cho phép tiếp tục từ đúng điểm dừng nếu xảy ra lỗi giữa chừng, thay vì chạy lại toàn bộ — đây chính là nguyên lý checkpoint thường dùng trong các tác vụ xử lý dữ liệu lớn, quy mô dài hạn.

---

### Câu 9. Nếu phải tổng kết nguyên tắc thiết kế xuyên suốt cả sáu luồng nghiệp vụ bằng một câu, đó là gì?

**Phần lõi**

Loại nghiệp vụ và bản chất ràng buộc thời gian của nó quyết định chiến lược xử lý phù hợp — không có một khuôn mẫu cứng nhắc áp dụng đồng nhất cho mọi luồng. Luồng cần phản hồi tức thời (Xác thực, Tìm kiếm, CRUD) ưu tiên tốc độ, chấp nhận không có cơ chế thử lại. Luồng chạy nền, không chặn người dùng trực tiếp (Lập chỉ mục) đầu tư cơ chế phục hồi phức tạp hơn. Mỗi ranh giới, mỗi cơ chế bảo vệ trong hệ thống, đều là lời giải cho một vấn đề cụ thể phát sinh từ chính bản chất của luồng nghiệp vụ đó, không phải áp dụng máy móc một nguyên tắc chung chung.

**Rào trước rào sau**

*Nếu hỏi: "Đây có phải chỉ là cách nói khác của 'thiết kế theo từng trường hợp cụ thể', vốn thiếu tính hệ thống không?"* — Không, vì bản thân việc phân loại "cần phản hồi tức thời hay không" chính là một tiêu chí hệ thống nhất quán, áp dụng được cho bất kỳ luồng nghiệp vụ mới nào trong tương lai — không phải quyết định tùy hứng cho từng trường hợp riêng lẻ, mà là một nguyên tắc phân loại rõ ràng, chỉ khác nhau ở kết quả áp dụng cụ thể tùy đặc điểm mỗi luồng.
