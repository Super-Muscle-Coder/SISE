# Phần 3 — Nghiệp vụ và Hạ tầng 

## MỤC I. KIẾN THỨC NỀN RESTFUL API

### SLIDE I.1 — REST LÀ GÌ VÀ SÁU NGUYÊN TẮC CỐT LÕI

### 1. Bố cục slide

- **Tiêu đề mục:** "I. Kiến thức nền RESTful API (1/3)".
- **Trên cùng:** Định nghĩa REST, 1-2 dòng.
- **Giữa slide:** Bảng 6 nguyên tắc, 5 bắt buộc + 1 tùy chọn — mỗi nguyên tắc 1 dòng, cực ngắn gọn (tên + đúng 1 cụm từ ý nghĩa).
- **Cuối slide:** Câu chốt đóng khung, nhấn mạnh điểm dễ hiểu lầm nhất (REST không bao trùm toàn hệ thống).

### 2. Nội dung chữ trên slide

**Tiêu đề:** I. Kiến thức nền RESTful API (1/3)

**Định nghĩa:**
> REST — bộ ràng buộc kiến trúc cho giao tiếp giữa một cặp client-server, không phải một giao thức hay một luật bao trùm toàn hệ thống.

**Bảng 6 nguyên tắc:**

| # | Nguyên tắc | Ý nghĩa cốt lõi |
|---|---|---|
| 1 | Client-Server | Bên gửi yêu cầu và bên xử lý tách biệt, phát triển độc lập |
| 2 | Stateless | Mỗi request tự chứa đủ thông tin — server không "nhớ" client |
| 3 | Uniform Interface | Mọi tài nguyên thao tác theo cùng một bộ quy tắc thống nhất |
| 4 | Cacheable | Response có thể được đánh dấu là lưu đệm được hay không |
| 5 | Layered System | Client không cần biết đang đi qua bao nhiêu tầng trung gian |
| 6 *(tùy chọn)* | Code-on-Demand | Server có thể gửi kèm mã thực thi được — hiếm dùng trong thực tế |

**Câu chốt (đóng khung):**
> REST áp dụng theo từng cặp giao tiếp cụ thể — SISE dùng REST cho Frontend↔Backend↔AIModule↔StorageModule, nhưng dùng hàng đợi (không phải REST) cho Backend↔Celery Worker.

### 3. Lời thoại

> Trước khi đi vào từng nghiệp vụ cụ thể của hệ thống, nhóm xin trình bày lại những kiến thức nền tảng nhất về RESTful API, làm cơ sở cho toàn bộ phần trình bày tiếp theo.
>
> REST, viết tắt của Representational State Transfer, không phải một giao thức mạng cụ thể như HTTP, mà là một bộ ràng buộc kiến trúc — nếu một cặp giao tiếp giữa bên gửi yêu cầu và bên xử lý tuân thủ đúng bộ ràng buộc này, hệ thống sẽ đạt được các đặc tính mong muốn như dễ mở rộng, dễ bảo trì, dễ dự đoán hành vi.
>
> REST có sáu nguyên tắc, trong đó năm nguyên tắc là bắt buộc và một nguyên tắc là tùy chọn. Client-Server tách biệt rõ vai trò bên gửi yêu cầu và bên xử lý, cho phép hai bên phát triển độc lập. Stateless yêu cầu mỗi yêu cầu phải tự chứa đầy đủ thông tin cần thiết, server không được lưu trạng thái phiên làm việc của từng client giữa các lần gọi. Uniform Interface đảm bảo mọi tài nguyên được thao tác theo cùng một bộ quy tắc thống nhất, giúp dễ dự đoán hành vi của bất kỳ API nào tuân thủ đúng chuẩn. Cacheable cho phép đánh dấu response nào có thể lưu đệm để tăng tốc độ phản hồi. Layered System cho phép chèn thêm các tầng trung gian mà không phá vỡ giao tiếp giữa client và server ban đầu. Và Code-on-Demand, nguyên tắc tùy chọn duy nhất, cho phép server gửi kèm mã thực thi được — nguyên tắc này rất ít khi được áp dụng trong thực tế hiện đại.
>
> Một điểm quan trọng cần lưu ý: REST áp dụng theo từng cặp giao tiếp cụ thể, không nhất thiết phải bao trùm toàn bộ hệ thống. Trong SISE, REST được áp dụng cho các cặp giao tiếp đồng bộ — Frontend với Backend, Backend với AIModule, Backend với StorageModule — nhưng luồng giao tiếp giữa Backend và Celery Worker, vốn mang tính bất đồng bộ, lại sử dụng cơ chế hàng đợi thông qua Redis, không phải REST.

---

### SLIDE I.2 — CÁC PHƯƠNG THỨC HTTP VÀ Ý NGHĨA

### 1. Bố cục slide

- **Tiêu đề mục:** "I. Kiến thức nền RESTful API (2/3)".
- **Bảng chính, chiếm phần lớn diện tích:** 4 method (GET, POST, PUT, DELETE) với đầy đủ Safe, Idempotent, và ý nghĩa hệ quả.
- **Cuối slide:** Câu chốt đóng khung về Idempotency-Key.

### 2. Nội dung chữ trên slide

**Tiêu đề:** I. Kiến thức nền RESTful API (2/3)

**Bảng 4 method:**

| Method | Safe | Idempotent | Ý nghĩa và hệ quả |
|---|---|---|---|
| GET | Có | Có | Chỉ đọc — có thể tự động cache, retry, prefetch an toàn |
| POST | Không | **Không** | Tạo mới/kích hoạt hành động — không được tự động retry mặc định |
| PUT | Không | Có | Thay thế toàn bộ representation bằng giá trị tuyệt đối |
| DELETE | Không | Có | Xóa — gọi lại nhiều lần vẫn cho cùng trạng thái cuối |

**Ghi chú quan trọng:**
> Idempotent nghĩa là "trạng thái cuối giống nhau dù gọi 1 hay N lần" — không có nghĩa là "response giống nhau".

**Câu chốt (đóng khung):**
> POST không Idempotent mặc định vì nhiều nghiệp vụ thực sự cần tạo nhiều bản ghi giống nhau (VD: nhiều người bình luận cùng một câu). SISE dùng Idempotency-Key để bổ sung tính an toàn cho các POST có tác dụng phụ quan trọng, như bước xin presigned URL khi tải ảnh.

### 3. Lời thoại

> Bốn phương thức HTTP chính mang theo những cam kết ngữ nghĩa cụ thể, không đơn thuần là tên gọi.
>
> GET vừa an toàn — không gây thay đổi gì trên server — vừa mang tính lặp lại được, tức Idempotent — gọi nhiều lần cho cùng kết quả. Chính nhờ hai tính chất này, các thành phần trung gian như trình duyệt hay CDN có thể tự động cache, tự động thử lại khi gặp lỗi mạng, mà không cần hỏi ý kiến ai.
>
> PUT và DELETE tuy có gây thay đổi trên server, nhưng đều mang tính lặp lại được — gọi một lần hay gọi nhiều lần đều đưa hệ thống về đúng một trạng thái cuối cùng như nhau. Cần lưu ý: tính lặp lại được ở đây được hiểu theo trạng thái cuối cùng của dữ liệu, không nhất thiết là response trả về phải giống hệt nhau mỗi lần.
>
> Riêng POST là phương thức duy nhất không có cam kết lặp lại được theo mặc định. Điều này không phải một sơ suất trong thiết kế chuẩn REST, mà xuất phát từ chính bản chất nghiệp vụ tạo mới — có nhiều tình huống thực tế cần khả năng tạo ra nhiều bản ghi giống hệt nhau về nội dung nhưng có ý nghĩa khác nhau, ví dụ nhiều người dùng khác nhau cùng bình luận một câu giống hệt lên một bài đăng.
>
> Để bù đắp cho khoảng trống này ở những nơi thực sự cần tính an toàn khi gọi lại, hệ thống sử dụng cơ chế Idempotency-Key — một khóa định danh do client tự sinh ra cho mỗi ý định hành động cụ thể, giúp server nhận biết và tránh xử lý trùng lặp nếu cùng một yêu cầu vô tình được gửi lại nhiều lần.

---

### SLIDE I.3 — CÁC MÃ TRẠNG THÁI HTTP QUAN TRỌNG

### 1. Bố cục slide

- **Tiêu đề mục:** "I. Kiến thức nền RESTful API (3/3)".
- **Bảng chính:** Nhóm theo **2xx/4xx/5xx**, đủ các mã sẽ xuất hiện xuyên suốt Mục II.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** I. Kiến thức nền RESTful API (3/3)

**Bảng mã trạng thái:**

| Mã | Nhóm | Ý nghĩa |
|---|---|---|
| 200 | Thành công | Thành công, có nội dung trả về |
| 201 | Thành công | Đã tạo thành công một tài nguyên mới |
| 204 | Thành công | Thành công, không có nội dung trả về |
| 202 | Thành công | Đã tiếp nhận, xử lý bất đồng bộ *(SISE có 1 endpoint dùng sai ngữ nghĩa này — xem Mục II)* |
| 400 | Lỗi client | Dữ liệu sai định dạng/thiếu trường bắt buộc |
| 401 | Lỗi client | Chưa xác thực hoặc token không hợp lệ |
| 403 | Lỗi client | Đã xác thực nhưng không đủ quyền cho hành động này |
| 404 | Lỗi client | Không tìm thấy tài nguyên |
| 409 | Lỗi client | Xung đột với trạng thái hiện tại (VD: trùng username, hoặc trùng Idempotency-Key) |
| 500 | Lỗi server | Lỗi không xác định phía server |

**Câu chốt (đóng khung):**
> Status code là công cụ diễn đạt chuẩn hóa cho ràng buộc nghiệp vụ do chính hệ thống tự định nghĩa — không phải luật cố định của HTTP áp đặt sẵn kết quả.

### 3. Lời thoại

> Cuối cùng, nhóm xin tổng hợp lại các mã trạng thái HTTP sẽ xuất hiện thường xuyên trong phần trình bày về từng nghiệp vụ cụ thể ngay sau đây.
>
> Nhóm mã hai trăm thể hiện các mức độ thành công khác nhau — hai trăm cho thành công có nội dung trả về, hai trăm lẻ một cho việc đã tạo thành công một tài nguyên mới, hai trăm lẻ bốn cho thành công nhưng không cần trả về nội dung, thường dùng cho các thao tác xóa. Riêng mã hai trăm lẻ hai mang ý nghĩa đã tiếp nhận và sẽ xử lý bất đồng bộ — hệ thống có một endpoint sử dụng mã này nhưng lại xử lý hoàn toàn đồng bộ, một điểm chưa nhất quán mà nhóm sẽ trình bày kỹ ở phần sau.
>
> Nhóm mã bốn trăm phân biệt rõ các loại lỗi phía client. Bốn trăm là lỗi định dạng dữ liệu; bốn trăm lẻ một là chưa xác thực; bốn trăm lẻ ba là đã xác thực nhưng không đủ quyền cho đúng hành động này; bốn trăm lẻ bốn là không tìm thấy tài nguyên; và bốn trăm lẻ chín là xung đột với trạng thái hiện tại, chẳng hạn khi cố gắng đăng ký một tên người dùng đã tồn tại, hoặc khi gửi lại đúng một Idempotency-Key đã được xử lý trước đó.
>
> Điểm quan trọng cần ghi nhớ: các mã trạng thái này không phải luật cố định được HTTP áp đặt sẵn kết quả cho mọi tình huống — chúng là công cụ diễn đạt chuẩn hóa cho những ràng buộc nghiệp vụ mà chính đội ngũ phát triển tự định nghĩa, phù hợp với bối cảnh cụ thể của hệ thống mình đang xây dựng.

---

## MỤC II. ÁP DỤNG RESTFUL VÀO 6 NGHIỆP VỤ SISE

### SLIDE II.1 — NGHIỆP VỤ XÁC THỰC (ĐĂNG KÝ, ĐĂNG NHẬP, LẤY HỒ SƠ)

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (1/6+) — Xác thực".
- **Trên cùng:** Sơ đồ 3 endpoint dạng timeline ngang — Đăng ký → Đăng nhập → Lấy hồ sơ, mỗi bước có icon method (POST/POST/GET) và mã trạng thái chính.
- **Giữa slide, trái:** Bảng chi tiết request/response cho từng endpoint.
- **Giữa slide, phải:** Sơ đồ nhỏ minh họa payload JWT (chỉ 3 trường: user_id, username, exp — không có role), kèm mũi tên chỉ "role luôn tra lại DB".
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (1/6+) — Xác thực

**Bảng 3 endpoint:**

| Endpoint | Method | Request | Response chính |
|---|---|---|---|
| `/auth/register` | POST | `{username, email, password}` | 201 — `User` (không kèm token) |
| `/auth/login` | POST | `{username, password}` | 200 — `{access_token, token_type, expires_in}` |
| `/auth/me` | GET | Header `Authorization: Bearer <token>` | 200 — hồ sơ đầy đủ, kèm `role` |

**Cơ chế 2 lớp chống trùng lặp khi đăng ký:**
1. `SELECT` kiểm tra trước khi ghi
2. `IntegrityError` ở tầng DB — lớp bảo vệ độc lập, xử lý race condition

**JWT payload:**
```json
{"user_id": 123, "username": "alice", "exp": 1723456789}
```
*(Không có trường `role` — quyền hạn luôn tra lại từ PostgreSQL)*

**Câu chốt (đóng khung):**
> Đăng ký trả 201 nhưng KHÔNG kèm token — Frontend tự động gọi tiếp `/auth/login` (quyết định UX, không nằm trong hợp đồng API).

### 3. Lời thoại

> Nghiệp vụ đầu tiên là Xác thực, gồm ba endpoint: đăng ký, đăng nhập, và lấy hồ sơ hiện tại.
>
> Khi đăng ký, Backend kiểm tra trùng lặp tên đăng nhập và email bằng hai lớp bảo vệ độc lập — một lượt truy vấn kiểm tra trước khi ghi, và một lớp bắt lỗi ở tầng ràng buộc toàn vẹn của cơ sở dữ liệu. Lớp thứ hai tồn tại để xử lý đúng trường hợp hai yêu cầu đăng ký cùng thông tin gửi gần như đồng thời — cả hai có thể cùng vượt qua bước kiểm tra ban đầu, nhưng khi ghi thật, ràng buộc ở tầng cơ sở dữ liệu sẽ chặn đúng một trong hai. Đăng ký thành công trả về mã hai trăm lẻ một, kèm hồ sơ người dùng vừa tạo, nhưng không kèm mã truy cập — đây là quyết định tách biệt trách nhiệm có chủ đích giữa việc tạo tài khoản và việc xác thực phiên đăng nhập.
>
> Ngay sau khi đăng ký thành công, Frontend chủ động gọi tiếp endpoint đăng nhập bằng chính thông tin vừa nhập, để người dùng không phải đăng nhập lại thủ công — đây là một quyết định trải nghiệm người dùng do Frontend tự thực hiện, không nằm trong hợp đồng API chính thức.
>
> Khi đăng nhập thành công, Backend sinh ra mã truy cập JWT, với phần nội dung chỉ chứa đúng ba trường: mã định danh người dùng, tên đăng nhập, và thời điểm hết hạn — hoàn toàn không chứa vai trò người dùng. Đây là quyết định thiết kế có chủ đích: mọi endpoint cần kiểm tra quyền quản trị đều truy vấn lại vai trò trực tiếp từ cơ sở dữ liệu ở mỗi lượt gọi, tránh tình trạng quyền hạn bị lỗi thời nếu vai trò người dùng thay đổi ngay trong lúc phiên đăng nhập vẫn còn hiệu lực.
>
> Cuối cùng, Frontend còn triển khai một cơ chế đáng chú ý: một bộ lắng nghe toàn cục theo dõi lỗi bốn trăm lẻ một từ bất kỳ lệnh gọi API nào trong toàn hệ thống, không chỉ riêng lúc đăng nhập — nếu phát hiện mã truy cập hết hạn hoặc không hợp lệ giữa chừng, hệ thống tự động xóa mã truy cập và điều hướng người dùng về trang đăng nhập, đồng bộ hành vi này trên mọi tab trình duyệt đang mở cùng lúc.

---

### SLIDE II.2a — BA BƯỚC CHÍNH: S1, S2, S3

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (2a/6+) — Tải ảnh, ba bước chính".
- **Trên cùng:** Sơ đồ 3 bước dạng timeline ngang, mỗi bước có icon actor (Frontend/MinIO/Backend) — S1 và S3 mũi tên Frontend↔Backend, S2 mũi tên Frontend↔MinIO trực tiếp (tô màu khác để nhấn mạnh ngoại lệ).
- **Giữa slide:** Bảng request/response đầy đủ cho cả 3 bước.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (2a/6+) — Tải ảnh, ba bước chính

**Bảng 3 bước:**

| Bước | Actor | Endpoint/Hành động | Request | Response |
|---|---|---|---|---|
| **S1** | Frontend → Backend | `POST /media/upload-url` | `{filename, content_type, expected_size_mb}` | 200 — `{upload_url, object_key, expires_in_sec: 3600, max_file_size_mb: 20}` |
| **S2** | Frontend → **MinIO trực tiếp** | `PUT <upload_url>` | Byte nhị phân file ảnh | Xác nhận theo chuẩn S3-compatible |
| **S3** | Frontend → Backend | `POST /media/upload/confirm` | `{object_key, album_id, privacy_level, tags}` | 200 — `{image_id, minio_url, status: "pending", index_status: "pending"}` |

**Ràng buộc validate:**
- `content_type` ∈ {image/jpeg, image/png}
- `expected_size_mb` ≤ 20
- `privacy_level` ∈ {0, 1, 2}
- `tags` tối đa 10, mỗi tag 1-50 ký tự

**Câu chốt (đóng khung):**
> S2 là ngoại lệ DUY NHẤT toàn hệ thống — Frontend chạm thẳng MinIO, không qua Backend. File ảnh không bao giờ đi qua Backend.

### 3. Lời thoại

> Nghiệp vụ Tải ảnh là nghiệp vụ phức tạp nhất trong toàn hệ thống, gồm ba bước tuần tự.
>
> Bước một, Frontend gửi yêu cầu xin một đường dẫn tải lên có chữ ký số, kèm theo tên file, loại nội dung, và dung lượng dự kiến. Backend xác thực các ràng buộc — loại nội dung phải là ảnh JPEG hoặc PNG, dung lượng không vượt quá hai mươi megabyte — rồi sinh ra một đường dẫn có chữ ký, có hiệu lực trong một tiếng.
>
> Bước hai là bước đặc biệt nhất: chính Frontend, không phải Backend, thực hiện gửi trực tiếp dữ liệu nhị phân của file ảnh thẳng tới MinIO, sử dụng đúng đường dẫn vừa nhận được. Đây là ngoại lệ duy nhất trong toàn bộ hệ thống mà tầng giao diện được phép kết nối thẳng tới hạ tầng lưu trữ, hoàn toàn không đi qua Backend — file ảnh không bao giờ chạm vào tầng điều phối nghiệp vụ.
>
> Bước ba, sau khi tải lên thành công, Frontend gọi lại để xác nhận, kèm theo thông tin về album đích, mức độ riêng tư, và các nhãn gắn kèm. Backend ghi nhận metadata này, và trả về kết quả với trạng thái lập chỉ mục đang ở mức chờ xử lý — quá trình xử lý vector đặc trưng sẽ diễn ra sau đó, nội dung này nhóm sẽ trình bày ở phần tiếp theo.

---

### SLIDE II.2b — CƠ CHẾ BÙ TRỪ KHI GHI METADATA THẤT BẠI

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (2b/6+) — Cơ chế bù trừ".
- **Trung tâm slide:** Sơ đồ luồng dạng cây quyết định — bắt đầu từ "S3: INSERT metadata vào PostgreSQL", rẽ 2 nhánh: nhánh "Thành công" (đi tiếp bình thường) và nhánh "Thất bại" (kích hoạt hành động bù trừ, quay lại xóa object trên MinIO).
- **Dưới sơ đồ:** Đoạn text ngắn giải thích vì sao cần cơ chế này (2 hệ thống tách biệt, không dùng chung transaction).
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (2b/6+) — Cơ chế bù trừ

**Sơ đồ luồng (dạng bullet mô phỏng cây quyết định):**
```
S3: Backend → PostgreSQL: INSERT INTO images (...)
│
├── Thành công → tiếp tục enqueue Celery, trả 200
│
└── THẤT BẠI
    → Backend → MinIO: XÓA lại object vừa tải lên
    → Ghi log hành động bù trừ
    → Trả 500, {code: "METADATA_COMMIT_FAILED"}
```

**Lý do cần cơ chế này:**
> MinIO và PostgreSQL là hai hệ thống tách biệt hoàn toàn — không thể dùng chung một giao dịch cơ sở dữ liệu để đảm bảo cả hai cùng thành công hoặc cùng thất bại.

**Câu chốt (đóng khung):**
> Đây chính là Saga Pattern đơn giản hóa — mỗi bước có khả năng cần "hoàn tác" đều có sẵn hành động bù trừ tương ứng, thay vì để lại dữ liệu không có chủ vĩnh viễn.

### 3. Lời thoại

> Một chi tiết kỹ thuật quan trọng của nghiệp vụ này là cơ chế xử lý khi bước ghi nhận metadata thất bại, ngay sau khi file đã tồn tại thành công trên MinIO.
>
> Vấn đề nảy sinh từ chính kiến trúc: MinIO và PostgreSQL là hai hệ thống lưu trữ hoàn toàn tách biệt, không thể gộp chung vào một giao dịch cơ sở dữ liệu duy nhất để đảm bảo cả hai cùng thành công hoặc cùng thất bại. Nếu file đã tồn tại trên MinIO nhưng việc ghi metadata vào PostgreSQL gặp sự cố, hệ thống sẽ rơi vào một trạng thái không nhất quán — một file tồn tại mà không có bản ghi nào tương ứng.
>
> Để giải quyết, hệ thống áp dụng cơ chế bù trừ: ngay khi phát hiện việc ghi metadata thất bại, Backend chủ động thực hiện hành động ngược lại — xóa đi chính file vừa tải lên trên MinIO, đưa hệ thống về đúng trạng thái nhất quán ban đầu, như thể toàn bộ quy trình chưa từng bắt đầu. Đây chính là một biến thể đơn giản hóa của nguyên lý Saga Pattern, một mẫu hình kiến trúc phổ biến cho các giao dịch trải dài qua nhiều thành phần hạ tầng độc lập không thể dùng chung transaction.

---

### SLIDE II.2c — BÀI TOÁN HAI ĐỊA CHỈ VÀ RANH GIỚI ĐỒNG BỘ/BẤT ĐỒNG BỘ

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (2c/6+) — Hai điểm nhấn kỹ thuật".
- **Nửa trên:** Sơ đồ 2 địa chỉ MinIO — 1 hộp MinIO ở giữa, 2 mũi tên đi ra: 1 mũi tên ghi "sise-minio:9000 (nội bộ, Backend dùng)", 1 mũi tên ghi "localhost:9000 (public, trình duyệt dùng)".
- **Nửa dưới:** Sơ đồ timeline 3 bước S1-S2-S3, có 1 đường phân cách rõ ràng ngay sau S3, đánh dấu "ranh giới đồng bộ/bất đồng bộ" tại đúng điểm enqueue Celery.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (2c/6+) — Hai điểm nhấn kỹ thuật

**Bài toán 2 địa chỉ:**

| Địa chỉ | Dùng khi nào | Ai dùng |
|---|---|---|
| `sise-minio:9000` | Backend tự thao tác MinIO qua Docker network nội bộ | Backend (SDK) |
| `localhost:9000` | Trình duyệt gọi trực tiếp MinIO ở bước S2 | Frontend (trình duyệt) |

**Ranh giới đồng bộ/bất đồng bộ:**
```
S1 (đồng bộ) → S2 (đồng bộ) → S3 (đồng bộ) → [enqueue Celery] ═══ RANH GIỚI ═══ Lập chỉ mục (bất đồng bộ)
                                                     ↑
                                          Response trả về NGAY tại đây,
                                          không chờ vector được tính xong
```

**Câu chốt (đóng khung):**
> Dùng nhầm 1 địa chỉ cho cả 2 mục đích → trình duyệt không resolve được hostname nội bộ, upload thất bại hoàn toàn.

### 3. Lời thoại

> Nhóm xin chia sẻ hai điểm nhấn kỹ thuật tinh vi nhất của nghiệp vụ này, thường là những chi tiết dễ bị bỏ sót nhất khi lần đầu triển khai.
>
> Điểm thứ nhất: presigned URL được sinh ra bởi Backend, chạy bên trong mạng nội bộ container, nơi nó gọi tới MinIO bằng đúng tên định danh dịch vụ nội bộ. Nhưng chính đường dẫn đó lại được sử dụng bởi trình duyệt của người dùng, chạy hoàn toàn bên ngoài mạng nội bộ đó. Đây chính là hệ quả tất yếu của việc container hóa: cùng một dịch vụ lưu trữ có hai địa chỉ đúng khác nhau, tùy vào việc ai đang cố gắng kết nối tới nó. Hệ thống giải quyết bằng cách duy trì hai địa chỉ tách biệt hoàn toàn — một địa chỉ nội bộ cho Backend tự thao tác, một địa chỉ công khai dùng riêng khi sinh presigned URL trả về cho trình duyệt.
>
> Điểm thứ hai: đây chính là ranh giới rõ ràng nhất trong toàn hệ thống giữa xử lý đồng bộ và xử lý bất đồng bộ. Cả ba bước tải ảnh đều diễn ra hoàn toàn đồng bộ — người dùng chờ phản hồi ngay ở mỗi bước. Nhưng ngay tại điểm cuối cùng của bước ba, khi Backend đưa tác vụ lập chỉ mục vào hàng đợi xử lý, nó không chờ tác vụ đó chạy xong mới phản hồi — phản hồi được trả về ngay lập tức, trong khi việc trích xuất vector đặc trưng thực sự diễn ra sau đó, hoàn toàn tách biệt, ở một tiến trình xử lý nền riêng.

---

### SLIDE II.3 — NGHIỆP VỤ TÌM KIẾM (ẢNH VÀ VĂN BẢN)

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (3/6+) — Tìm kiếm".
- **Trên cùng:** Sơ đồ 3 actor — Frontend → Backend → (AIModule, StorageModule) — mũi tên tuần tự có đánh số 1, 2, 3.
- **Giữa slide:** Bảng request/response 2 endpoint (image/text), và sơ đồ nhỏ minh họa bộ lọc quyền riêng tư 3 tầng.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (3/6+) — Tìm kiếm

**Bảng 2 endpoint:**

| Endpoint | Method | Request | Luồng nội bộ |
|---|---|---|---|
| `/search/image` | POST | multipart `{file, top_k, metric, album_id?}` | → AIModule `/inference/embed/image` → StorageModule `/vector/search/hybrid` |
| `/search/text` | POST | JSON `{query_text, top_k, metric, album_id?}` | → AIModule `/inference/embed/text` → StorageModule `/vector/search/hybrid` |

**Bộ lọc quyền riêng tư 3 tầng (gửi cho StorageModule):**
```
(privacy_level = công khai)
  HOẶC (user_id = chính người tìm)
  HOẶC (privacy_level = bạn bè VÀ user_id thuộc danh sách bạn bè)
```

**Lọc album:** xử lý RIÊNG phía Backend, sau khi nhận kết quả — StorageModule không biết khái niệm album.

**Câu chốt (đóng khung):**
> Backend là điều phối thuần túy — không tự tính embedding, không tự làm ANN search. Toàn bộ luồng hoàn toàn đồng bộ, KHÔNG có cơ chế thử lại khi lỗi.

### 3. Lời thoại

> Nghiệp vụ Tìm kiếm gồm hai endpoint tương ứng hai chế độ truy vấn — bằng ảnh mẫu hoặc bằng mô tả văn bản — nhưng cả hai đi theo đúng cùng một cấu trúc xử lý nội bộ.
>
> Backend gọi tuần tự hai dịch vụ nội bộ. Đầu tiên, gọi AIModule để sinh vector đặc trưng cho nội dung truy vấn. Sau đó, gọi StorageModule để thực hiện tìm kiếm gần đúng, kết hợp một bộ lọc quyền riêng tư ba tầng — kết quả trả về phải thuộc một trong ba trường hợp: ảnh công khai, ảnh do chính người tìm sở hữu, hoặc ảnh ở mức riêng tư bạn bè mà người sở hữu nằm trong danh sách bạn bè của người tìm kiếm.
>
> Một điểm thiết kế đáng chú ý: nếu người dùng muốn giới hạn tìm kiếm trong phạm vi một album cụ thể, việc lọc này được xử lý hoàn toàn riêng biệt ở phía Backend, sau khi đã nhận kết quả từ StorageModule — StorageModule hoàn toàn không cần biết đến khái niệm album trong bộ lọc mà nó tiếp nhận, giữ cho giao diện giữa hai tầng luôn đơn giản.
>
> Backend trong toàn bộ nghiệp vụ này đóng vai trò điều phối thuần túy — không tự tính toán vector đặc trưng, không tự thực hiện thuật toán tìm kiếm gần đúng. Toàn bộ luồng xử lý hoàn toàn đồng bộ, và đây là một lựa chọn có chủ đích: không có bất kỳ cơ chế thử lại nào khi một trong hai dịch vụ nội bộ gặp lỗi tạm thời, nhằm ưu tiên giữ tốc độ phản hồi cho một luồng nghiệp vụ tương tác trực tiếp với người dùng.

---

### SLIDE II.4 — NGHIỆP VỤ QUẢN LÝ ẢNH VÀ ALBUM (CRUD)

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (4/6+) — Quản lý ảnh/Album".
- **Trên cùng:** Bảng đầy đủ các endpoint CRUD (ảnh + album).
- **Giữa slide:** Sơ đồ minh họa cơ chế idempotent tự nhiên qua điều kiện truy vấn — 1 câu lệnh SQL với điều kiện `deleted_at IS NULL` được tô nổi bật.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (4/6+) — Quản lý ảnh/Album

**Bảng endpoint đầy đủ:**

| Endpoint | Method | Chức năng | Mã trạng thái chính |
|---|---|---|---|
| `/media/{image_id}` | GET | Xem chi tiết 1 ảnh | 200; 404 nếu không đúng chủ |
| `/media` | GET | Liệt kê, phân trang, lọc theo album | 200 — `{items, total, offset, limit}` |
| `/media/{image_id}/update` | PUT | Sửa metadata (chỉ trường được cung cấp) | 200; 404 nếu không đúng chủ |
| `/media/{image_id}/delete` | DELETE | Xóa mềm | 204; 404 nếu không tìm thấy |
| `/albums` | GET, POST | Danh sách / tạo album | 200 / 201 |
| `/albums/{album_id}` | GET, PUT, DELETE | Chi tiết / sửa / xóa mềm album | 200 / 200 / 204 |

**Cơ chế idempotent tự nhiên khi xóa:**
```sql
UPDATE images SET deleted_at = NOW() 
WHERE id = ... AND user_id = ... AND deleted_at IS NULL
```
→ Gọi lại lần 2: điều kiện không còn khớp → `rowcount = 0` → trả 404, KHÔNG cần Idempotency-Key riêng.

**Câu chốt (đóng khung):**
> Xóa mềm — KHÔNG xóa file vật lý khỏi MinIO. Điều kiện `deleted_at IS NULL` trong chính câu UPDATE tự nhiên tạo tính Idempotent, không cần cơ chế bổ sung.

### 3. Lời thoại

> Nhóm nghiệp vụ Quản lý ảnh và Album cung cấp đầy đủ các thao tác chuẩn: xem, liệt kê có phân trang, cập nhật, và xóa — áp dụng đồng nhất cho cả ảnh lẫn album.
>
> Một điểm đáng chú ý nhất của nghiệp vụ này là cơ chế xóa. Câu lệnh cập nhật đánh dấu thời điểm xóa được viết kèm điều kiện loại trừ những bản ghi đã bị đánh dấu xóa từ trước. Điều này tạo ra một hệ quả rất tự nhiên: nếu gọi thao tác xóa hai lần liên tiếp trên cùng một đối tượng, lần gọi thứ hai sẽ không tìm thấy bản ghi nào còn thỏa điều kiện — vì đã bị đánh dấu xóa ở lần gọi trước — và trả về mã bốn trăm lẻ bốn. Đây chính là ví dụ thực tế, chạy đúng trên hệ thống, cho khái niệm Idempotent đã trình bày ở phần kiến thức nền: dù gọi một lần hay nhiều lần, trạng thái cuối cùng của dữ liệu luôn giống nhau, mà không cần xây dựng thêm bất kỳ cơ chế Idempotency-Key bổ sung nào.
>
> Một chi tiết khác cần lưu ý: hành động xóa trong toàn bộ hệ thống đều là xóa mềm — chỉ đánh dấu thời điểm xóa, hoàn toàn không xóa file vật lý khỏi hệ thống lưu trữ đối tượng. Điều này giữ được khả năng khôi phục dữ liệu, đồng thời tránh tình trạng dữ liệu quan hệ và vector đặc trưng tương ứng bị lệch đồng bộ nếu việc xóa vật lý không diễn ra đồng thời ở cả hai nơi lưu trữ.

---

### SLIDE II.5 — NGHIỆP VỤ ĐÁNH GIÁ BENCHMARK 

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (5/6) — Đánh giá benchmark".
- **Trên cùng:** Bảng 3 endpoint.
- **Giữa slide:** Sơ đồ nhấn mạnh nghịch lý mã 202 — 1 bên ghi "Ý nghĩa chuẩn: bất đồng bộ", 1 bên ghi "Thực tế SISE: hoàn toàn đồng bộ", có dấu "≠" ở giữa.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (5/6) — Đánh giá benchmark

**Bảng 3 endpoint:**

| Endpoint | Method | Chức năng | Mã trạng thái |
|---|---|---|---|
| `/eval/run` | POST | Chạy 1 lượt đánh giá mới (admin only) | 202; 403 nếu không phải admin |
| `/eval/results/{eval_id}` | GET | Tra cứu lại theo mã lượt chạy | 200; 404 |
| `/eval/metrics` | GET | Chỉ số của lượt chạy gần nhất | 200; 401 |

**Nghịch lý mã trạng thái:**
```
Ý nghĩa chuẩn của 202:  "Đã tiếp nhận — SẼ xử lý bất đồng bộ"
                                    ≠
Thực tế tại SISE:       Toàn bộ tính toán CHẠY XONG HẲN trong cùng 1 request,
                        rồi mới trả response — KHÔNG có polling
```

**Kiểm soát quyền — Role luôn tra lại DB:**
> Không đọc `role` từ JWT — luôn `SELECT role FROM users` mỗi lần gọi. Sai → `403 ERR_FORBIDDEN_ADMIN_ONLY`.

**Câu chốt (đóng khung):**
> Đây KHÔNG phải lỗi bị bỏ sót — đã được nhóm chủ động nhận diện, ghi nhận là hạn chế thiết kế đã biết, chấp nhận được ở quy mô benchmark hiện tại.

### 3. Lời thoại

> Nghiệp vụ Đánh giá benchmark cho phép đo lường định lượng chất lượng của mô hình, chỉ dành cho tài khoản có vai trò quản trị.
>
> Về kiểm soát quyền, mỗi lượt gọi endpoint khởi chạy đều xác minh lại vai trò trực tiếp từ cơ sở dữ liệu, không đọc từ nội dung mã truy cập — đúng nguyên tắc đã trình bày ở nghiệp vụ Xác thực, nhằm đảm bảo quyền hạn luôn phản ánh đúng trạng thái mới nhất.
>
> Điểm đáng chú ý nhất của nghiệp vụ này, và cũng là một trong những chi tiết kỹ thuật tinh vi nhất của toàn hệ thống: endpoint khởi chạy đánh giá trả về mã trạng thái hai trăm lẻ hai — theo đúng chuẩn HTTP, mã này mang ý nghĩa yêu cầu đã được tiếp nhận và sẽ được xử lý bất đồng bộ. Nhưng trên thực tế, toàn bộ quá trình tính toán bốn chỉ số đánh giá lại chạy hoàn toàn đồng bộ, trong cùng một lượt gọi duy nhất — response chỉ được trả về sau khi toàn bộ quá trình tính toán đã hoàn tất, không hề có bất kỳ cơ chế thăm dò trạng thái riêng biệt nào.
>
> Nhóm xin khẳng định rõ: đây không phải một lỗi bị bỏ sót trong quá trình phát triển, mà là một điểm đã được chủ động nhận diện và ghi nhận công khai như một hạn chế thiết kế đã biết. Lý do chấp nhận được ở quy mô hiện tại: khối lượng dữ liệu benchmark của đồ án đủ nhỏ để toàn bộ quá trình hoàn tất trong một khoảng thời gian ngắn, chưa đến mức bắt buộc phải tách hẳn thành một tác vụ chạy nền.

---

### SLIDE II.6 — NGHIỆP VỤ LẬP CHỈ MỤC VECTOR

### 1. Bố cục slide

- **Tiêu đề mục:** "II. Áp dụng RESTful vào 6 nghiệp vụ SISE (6/6) — Lập chỉ mục vector".
- **Trên cùng:** Sơ đồ nhấn mạnh "KHÔNG có endpoint HTTP" — kích hoạt duy nhất từ `.delay()` ở cuối Luồng Upload.
- **Giữa slide:** Bảng phân loại lỗi 2 loại (Permanent vs Transient), kèm cơ chế backoff thật.
- **Cuối slide:** Câu chốt đóng khung.

### 2. Nội dung chữ trên slide

**Tiêu đề:** II. Áp dụng RESTful vào 6 nghiệp vụ SISE (6/6) — Lập chỉ mục vector

**Kích hoạt:**
> KHÔNG có endpoint HTTP riêng. Kích hoạt duy nhất: `process_image_indexing.delay(image_id)` — gọi từ cuối bước S3 của Luồng Tải ảnh.

**Chuỗi xử lý:**
```
Celery Worker → MinIO: tải bytes ảnh thật
Celery Worker → AIModule: POST /inference/embed/image
Celery Worker (nội bộ): validate vector_dim khớp cấu hình (512)
Celery Worker → StorageModule: POST /vector/index {image_id, vector}
Celery Worker → PostgreSQL: UPDATE images SET index_status='ready'
                             WHERE id=... AND deleted_at IS NULL
```

**Bảng phân loại lỗi:**

| Loại lỗi | Ví dụ | Hành vi |
|---|---|---|
| `PermanentIndexingError` | Sai số chiều vector, bị từ chối quyền, ảnh đã xóa mềm giữa chừng | KHÔNG thử lại — `index_status='failed'` ngay |
| `TransientIndexingError` | Timeout, mất kết nối, lỗi ≥500 | Thử lại: backoff 1s → 2s → 4s (`factor=2`), tối đa 3 lần |
| Không rõ loại | Trường hợp ngoài dự kiến | Mặc định = Transient, vẫn cho cơ hội thử lại |

**Câu chốt (đóng khung):**
> Ghi vector qua REST `/vector/index` — TUYỆT ĐỐI không SQLAlchemy trực tiếp vào cột `embedding`. Đây là "cửa duy nhất" hợp lệ để ghi vector trong toàn hệ thống.

### 3. Lời thoại

> Nghiệp vụ cuối cùng, Lập chỉ mục vector, là luồng bất đồng bộ duy nhất trong toàn hệ thống — hoàn toàn không có endpoint HTTP nào để gọi trực tiếp. Nó chỉ được kích hoạt tự động, duy nhất một điểm, ngay tại cuối bước ba của luồng Tải ảnh, khi Backend đưa tác vụ vào hàng đợi xử lý.
>
> Chuỗi xử lý gồm bốn bước: tải dữ liệu ảnh thật từ MinIO, gọi AIModule sinh vector đặc trưng, kiểm tra số chiều vector nhận được có khớp với cấu hình hệ thống hay không, rồi ghi vector đó vào StorageModule thông qua đúng một giao diện lập trình ứng dụng chuyên biệt — tuyệt đối không thao tác trực tiếp bằng câu lệnh cơ sở dữ liệu vào cột lưu vector, nhằm đảm bảo mọi lượt ghi vector đều đi qua đúng một cửa duy nhất, tránh dữ liệu sai định dạng lọt vào hệ thống tìm kiếm.
>
> Cơ chế xử lý lỗi của luồng này khá tinh vi, phân thành hai loại rõ rệt. Lỗi vĩnh viễn — như sai số chiều vector, bị từ chối quyền truy cập, hoặc ảnh đã bị xóa mềm ngay trong lúc đang xử lý — khiến hệ thống dừng ngay lập tức, không thử lại, vì biết chắc thử lại cũng sẽ cho kết quả y hệt. Lỗi tạm thời — như hết thời gian chờ hoặc mất kết nối — được thử lại theo thời gian chờ tăng dần theo cấp số nhân: một giây, hai giây, rồi bốn giây, với giới hạn tối đa ba lần thử. Đáng chú ý, những lỗi không xác định rõ thuộc loại nào được mặc định coi là lỗi tạm thời, thể hiện một thiên hướng thiết kế nghiêng về việc cho hệ thống cơ hội tự phục hồi trước khi thực sự bỏ cuộc.

---

## MỤC III. KIẾN TRÚC MÃ NGUỒN WORKFLOW-CENTRIC

### SLIDE III.1 — NĂM LỚP VÀ NGUYÊN TẮC TỔ CHỨC THEO NGHIỆP VỤ

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Kiến trúc mã nguồn Workflow-Centric (1/2)".
- **Trên cùng:** Sơ đồ cấu trúc thư mục thật, dạng cây — hiển thị đúng `app/entities/`, `app/adapters/`, `app/services/`, `app/routers/`, mỗi thư mục có file `search_*.py` làm ví dụ minh họa.
- **Giữa slide:** Bảng 5 lớp với định nghĩa ngắn gọn từng lớp.
- **Cuối slide:** Câu chốt đóng khung, nhấn mạnh điểm khác biệt cốt lõi so với MVC/Clean Architecture.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Kiến trúc mã nguồn Workflow-Centric (1/2)

**Cấu trúc thư mục thật:**
```
app/
├── entities/
│   └── search_entities.py
├── adapters/
│   └── search_adapters.py
├── services/
│   └── search_services.py
└── routers/
    └── search_routers.py
```

**Bảng 5 lớp:**

| Lớp | Định nghĩa | Nguyên tắc |
|---|---|---|
| configs | Tham số môi trường, thông tin kết nối | Tách biệt hoàn toàn khỏi code logic |
| entities | Định nghĩa cấu trúc dữ liệu (Pydantic) | Tuyệt đối không chứa logic xử lý |
| adapters | Cầu nối DUY NHẤT tới thế giới bên ngoài (DB, MinIO, AI) | Mọi thư viện kết nối đều bọc ở đây |
| services | Logic nghiệp vụ thuần túy | Không tự khởi tạo Adapters — nhận qua DI |
| routers | Tiếp nhận HTTP, validate, điều hướng | Không chứa logic nghiệp vụ |

**Câu chốt (đóng khung):**
> Điểm khác biệt cốt lõi: mỗi NGHIỆP VỤ sở hữu trọn bộ 4 file riêng, xuyên suốt cả 5 lớp — không gom theo LOẠI THÀNH PHẦN như MVC/Clean Architecture truyền thống.

### 3. Lời thoại

> Về mặt tổ chức mã nguồn, hệ thống áp dụng kiến trúc năm lớp, gọi là Workflow-Centric Architecture — mỗi thành phần mã nguồn được phân vào đúng một trong năm lớp trách nhiệm: cấu hình môi trường, định nghĩa dữ liệu thuần túy, cầu nối duy nhất tới thế giới bên ngoài, logic nghiệp vụ thuần túy, và tầng tiếp nhận yêu cầu HTTP.
>
> Về bản chất phân lớp, kiến trúc này khá gần với mô hình Clean Architecture cổ điển. Nhưng điểm khác biệt cốt lõi nằm ở đơn vị tổ chức chính: thay vì gom tất cả file thuộc cùng một lớp trách nhiệm vào chung một thư mục lớn — nghĩa là toàn bộ tầng logic nghiệp vụ của mọi luồng nằm chung một chỗ — hệ thống tổ chức theo từng luồng nghiệp vụ cụ thể trước. Mỗi luồng, ví dụ như luồng tìm kiếm, sở hữu trọn bộ bốn file mã nguồn riêng của chính nó, xuyên suốt cả bốn lớp thực thi, chỉ phân biệt nhau qua hậu tố tên file. Tên gọi Workflow-Centric phản ánh đúng nguyên tắc lấy nghiệp vụ làm trung tâm tổ chức này.
>
> Một nguyên tắc bổ sung quan trọng: lớp Services không tự khởi tạo lớp Adapters bên trong nó, mà nhận Adapters được tiêm vào thông qua cơ chế Dependency Injection ngay tại tầng Router — điều này cho phép kiểm thử riêng biệt logic nghiệp vụ mà không cần thực hiện các thao tác kết nối mạng thật.

---

### SLIDE III.2 — SO SÁNH VỚI CÁC KIẾN TRÚC PHỔ BIẾN VÀ ĐỊNH VỊ

### 1. Bố cục slide

- **Tiêu đề mục:** "III. Kiến trúc mã nguồn Workflow-Centric (2/2)".
- **Trên cùng:** Bảng so sánh 4 kiến trúc (MVC, Clean Architecture, Microservices, Workflow-Centric) theo 4 tiêu chí.
- **Giữa slide:** Hai cột song song — Ưu điểm / Nhược điểm, mỗi bên 3 gạch đầu dòng ngắn.
- **Cuối slide:** Câu chốt đóng khung, nêu rõ điều kiện áp dụng phù hợp.

### 2. Nội dung chữ trên slide

**Tiêu đề:** III. Kiến trúc mã nguồn Workflow-Centric (2/2)

**Bảng so sánh 4 kiến trúc:**

| Tiêu chí | MVC | Clean Architecture | Microservices | Workflow-Centric |
|---|---|---|---|---|
| Đơn vị tổ chức | Loại thành phần | Tầng trách nhiệm | Dịch vụ độc lập | Luồng nghiệp vụ cụ thể |
| Chi phí hạ tầng | Thấp | Thấp | Rất cao | Thấp — vẫn 1 ứng dụng nguyên khối |
| Tái sử dụng chéo | Trung bình | Cao | Thấp giữa dịch vụ | Thấp — đánh đổi có chủ đích |
| Tốc độ định vị lỗi | Trung bình | Trung bình | Cao | Cao |

**Ưu điểm:**
- Tốc độ định vị và cô lập lỗi — mã nguồn 1 nghiệp vụ nằm gọn 1 chỗ
- Giảm rủi ro ảnh hưởng chéo — không chia sẻ file giữa các nghiệp vụ
- Chi phí vận hành thấp hơn Microservices, vẫn giữ 1 phần lợi ích cô lập

**Nhược điểm:**
- Trùng lặp mã nguồn giữa các nghiệp vụ có phần tương tự nhau
- Không có ranh giới triển khai độc lập thực sự (vẫn 1 ứng dụng nguyên khối)
- Không phù hợp đội ngũ lớn cần xây tầng dùng chung phức tạp

**Câu chốt (đóng khung):**
> Phù hợp nhất: hệ thống nguyên mẫu quy mô vừa, đội ngũ nhỏ, nhiều nghiệp vụ tương đối độc lập — đúng bối cảnh của SISE.

### 3. Lời thoại

> So với các kiến trúc phổ biến khác, Workflow-Centric là một kiến trúc lai, mang lại một phần lợi ích cô lập theo nghiệp vụ giống tinh thần Microservices, nhưng vẫn giữ chi phí vận hành thấp của một ứng dụng nguyên khối — không cần điều phối nhiều tiến trình, nhiều mạng, nhiều hệ thống giám sát riêng biệt như Microservices thực sự đòi hỏi. Đổi lại, nó hy sinh phần lớn khả năng tái sử dụng mã nguồn chéo mà Clean Architecture đạt được nhờ trừu tượng hóa qua interface.
>
> Về ưu điểm, khi một nghiệp vụ cụ thể gặp sự cố, toàn bộ mã nguồn liên quan nằm gọn trong đúng một bộ file có chung tiền tố, không cần tìm kiếm rải rác — đây là lợi thế rõ rệt nhất so với cả MVC lẫn Clean Architecture chuẩn. Đồng thời, vì không chia sẻ file mã nguồn giữa các luồng nghiệp vụ, một thay đổi ở nghiệp vụ này không thể vô tình phá vỡ nghiệp vụ khác thông qua việc chỉnh sửa nhầm một file dùng chung.
>
> Về nhược điểm, nếu nhiều luồng nghiệp vụ cùng cần một đoạn logic giống hệt nhau, kiến trúc này không khuyến khích trừu tượng hóa sớm, dẫn tới một mức độ trùng lặp mã nguồn nhất định. Ngoài ra, khác với Microservices, toàn bộ các luồng vẫn đóng gói chung trong một ứng dụng — không thể triển khai lại riêng một nghiệp vụ mà không triển khai lại cả hệ thống.
>
> Nhóm nhận định kiến trúc này phù hợp nhất với đúng bối cảnh của một hệ thống nguyên mẫu quy mô vừa phải, được phát triển bởi một đội ngũ nhỏ, với nhiều nghiệp vụ tương đối độc lập lẫn nhau — chính xác là bối cảnh của đồ án hiện tại, nơi tốc độ định vị và cô lập lỗi quan trọng hơn khả năng tái sử dụng mã nguồn ở quy mô lớn.
---

## MỤC LỤC — Phần 3. LUỒNG NGHIỆP VỤ & HẠ TẦNG

### Tổng cộng: 3 Mục La Mã, 13 slide

### MỤC I — KIẾN THỨC NỀN RESTFUL API (3 slide)

| Slide | Nội dung |
|---|---|
| I.1 | REST là gì và sáu nguyên tắc cốt lõi |
| I.2 | Các phương thức HTTP và ý nghĩa (Safe/Idempotent, Idempotency-Key) |
| I.3 | Các mã trạng thái HTTP quan trọng (2xx/4xx/5xx) |

---

### MỤC II — ÁP DỤNG RESTFUL VÀO 6 NGHIỆP VỤ SISE (8 slide)

| Slide | Nội dung |
|---|---|
| II.1 | Xác thực (Đăng ký, Đăng nhập, Lấy hồ sơ) |
| II.2a | Tải ảnh — Ba bước chính (S1, S2, S3) |
| II.2b | Tải ảnh — Cơ chế bù trừ khi ghi metadata thất bại |
| II.2c | Tải ảnh — Bài toán hai địa chỉ MinIO + ranh giới đồng bộ/bất đồng bộ |
| II.3 | Tìm kiếm (Ảnh và Văn bản) |
| II.4 | Quản lý ảnh và Album (CRUD) |
| II.5 | Đánh giá benchmark (chỉ quản trị viên) |
| II.6 | Lập chỉ mục vector (bất đồng bộ) |

---

### MỤC III — KIẾN TRÚC MÃ NGUỒN WORKFLOW-CENTRIC (2 slide)

| Slide | Nội dung |
|---|---|
| III.1 | Năm lớp và nguyên tắc tổ chức theo nghiệp vụ |
| III.2 | So sánh với MVC/Clean Architecture/Microservices, ưu nhược điểm |

---

### GHI CHÚ TRA CỨU NHANH — "NẾU BỊ HỎI VỀ..."

| Chủ đề bị hỏi | Mở slide |
|---|---|
| REST cơ bản, Method, Status code | I.1 – I.3 |
| Đăng ký/đăng nhập, JWT, quyền hạn | II.1 |
| Luồng upload, presigned URL | II.2a |
| Lỗi khi ghi metadata, Saga Pattern | II.2b |
| Container hóa, 2 địa chỉ MinIO, đồng bộ/bất đồng bộ | II.2c |
| Tìm kiếm, bộ lọc quyền riêng tư | II.3 |
| Xóa mềm, Idempotent tự nhiên | II.4 |
| Mã 202 nghịch lý | II.5 |
| Celery, retry, phân loại lỗi | II.6 |
| Kiến trúc 5 lớp, cấu trúc thư mục | III.1 |
| So sánh kiến trúc, ưu nhược điểm | III.2 |