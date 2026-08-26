# ĐẶC TẢ CHI TIẾT CÁC LUỒNG NGHIỆP VỤ HỆ THỐNG SISE

> Timeline sử dụng: **Frontend (E)**, **Backend (D)**, **Celery Worker (D)**, **AIModule (C)**, **StorageModule/PostgreSQL (B)**, **MinIO (B)**. Mỗi bước ghi rõ: hành động, method REST, request/response, status code, hoặc chuyển giao hạ tầng.

---

## LUỒNG 1 — XÁC THỰC (Đăng ký, Đăng nhập, Lấy hồ sơ)

### Phần A — Diễn giải bằng tình huống thực tế

Hãy tưởng tượng ta muốn gia nhập một câu lạc bộ.

**Đăng ký**: ta tới bàn lễ tân, điền vào một tờ đơn — tên, email, một mật khẩu bí mật chỉ mình ta biết. Lễ tân không lưu mật khẩu gốc vào sổ (nếu sổ bị mất trộm, kẻ trộm sẽ biết hết mật khẩu của mọi người) — thay vào đó, lễ tân dùng một cỗ máy đặc biệt biến mật khẩu thành một chuỗi ký tự lộn xộn, không thể đảo ngược lại thành mật khẩu gốc, rồi mới ghi chuỗi đó vào sổ. Trước khi ghi, lễ tân luôn kiểm tra sổ xem đã có ai trùng tên hoặc trùng email chưa — nếu trùng, từ chối ngay, không cho đăng ký hai lần.

Có một tình huống hiếm nhưng lễ tân vẫn phòng: nếu đúng lúc đó có **hai người cùng tên** nộp đơn gần như đồng thời, cả hai tờ đơn đều "lọt" qua vòng kiểm tra ban đầu (vì tại thời điểm kiểm tra, sổ chưa ghi tên nào cả) — lúc ghi thật vào sổ, cuốn sổ (được thiết kế đặc biệt) tự nó sẽ từ chối tờ đơn thứ hai, vì nó không cho phép hai dòng trùng tên tồn tại cùng lúc, dù lễ tân đã "duyệt" cả hai.

**Đăng nhập**: lần sau quay lại, không cần điền lại cả tờ đơn — chỉ cần đưa tên và mật khẩu. Lễ tân tra sổ, đưa mật khẩu vừa đọc qua đúng cỗ máy biến đổi lúc nãy, so xem chuỗi lộn xộn ra có khớp với chuỗi đã ghi trong sổ không. Nếu khớp, lễ tân đưa cho ta một **chiếc vòng tay đặc biệt** — có khắc tên và một con dấu bí mật chỉ câu lạc bộ mới biết cách nhận diện, kèm theo một hạn sử dụng in trên đó (ví dụ "hết hạn sau 2 tiếng"). Từ giờ, mỗi lần muốn vào bất kỳ khu vực nào trong câu lạc bộ, chỉ cần giơ vòng tay ra — không ai cần lục lại sổ đăng ký để xác nhận danh tính nữa, vì bản thân chiếc vòng đã "nói" đủ mọi thông tin cần thiết rồi.

**Điều thú vị**: chiếc vòng tay đó **không hề ghi rõ đây là hội viên thường hay hội viên VIP** — nó chỉ ghi "đúng là người này, có hiệu lực tới giờ này". Nếu muốn vào khu vực VIP, nhân viên gác cửa khu đó sẽ **luôn chạy vào trong tra lại sổ thật** xem hiện tại có đúng là VIP hay không, chứ không tin tưởng tuyệt đối vào những gì khắc trên vòng tay. Lý do: nếu chẳng may vừa bị tước quyền VIP (do vi phạm gì đó) ngay trong lúc chiếc vòng còn hạn sử dụng, nhân viên gác cửa vẫn phải biết ngay lập tức, không thể để dùng "vòng cũ" xài ké quyền VIP đã mất.

### Phần B — Ánh xạ vào hệ thống

| Trong câu chuyện | Trong hệ thống SISE |
|---|---|
| Tờ đơn đăng ký (tên, email, mật khẩu) | `POST /auth/register`, body chứa username, email, password |
| Cỗ máy biến mật khẩu thành chuỗi lộn xộn không đảo ngược được | Thuật toán băm mật khẩu (bcrypt) |
| Sổ ghi danh của câu lạc bộ | Bảng `users` trong PostgreSQL |
| Lễ tân kiểm tra trùng tên trước khi ghi | Câu lệnh `SELECT` kiểm tra trùng username/email trước khi ghi |
| Cuốn sổ tự từ chối dòng trùng dù lễ tân đã duyệt | Ràng buộc duy nhất (unique constraint) ở tầng cơ sở dữ liệu, bắt lỗi `IntegrityError` |
| Chiếc vòng tay có khắc tên và con dấu bí mật, kèm hạn sử dụng | JWT — token có ký số, mang thông tin định danh và thời hạn hiệu lực |
| Giơ vòng tay ra, không cần lục sổ mỗi lần | Cơ chế Stateless — server xác minh chữ ký token, không cần tra cứu cơ sở dữ liệu mỗi request |
| Vòng tay không ghi rõ "thường hay VIP" | JWT không lưu trường `role` trong payload |
| Nhân viên gác khu VIP luôn tra lại sổ thật | Mọi endpoint cần kiểm tra quyền quản trị luôn truy vấn lại cột `role` từ PostgreSQL, không tin vào token |

### Phần C — Đặc tả chi tiết

**Timeline tham gia:** Frontend, Backend, PostgreSQL

**1.1. Đăng ký — `POST /auth/register`**

- Frontend → Backend: `POST /auth/register`, body `{username, email, password}`.
- Backend → PostgreSQL: `SELECT id, username, email FROM users WHERE username=:username OR email=:email LIMIT 1` — kiểm tra trùng lặp trước khi xử lý tiếp.
  - Nếu có dòng trả về → Backend trả **`409 Conflict`**, `{code: "ERR_USER_ALREADY_EXISTS"}`.
- Backend (nội bộ): băm mật khẩu bằng bcrypt.
- Backend → PostgreSQL: `INSERT INTO users (...) RETURNING id, username, email, role, created_at`.
  - Nếu `IntegrityError` xảy ra (race condition — hai request trùng username đồng thời vượt qua bước SELECT) → tự động chuyển thành lỗi trùng lặp → **`409`** (lớp bảo vệ thứ hai, độc lập với SELECT).
  - Lỗi khác → rollback, Backend trả **`500`**.
- Backend → Frontend: **`201 Created`**, body `User {id, username, email, role, created_at}` — không kèm token.
- Ngay sau khi đăng ký thành công, Frontend tự động gọi tiếp `POST /auth/login` (dùng chính username/password vừa nhập) để lấy token — quyết định UX chủ động của Frontend, không nằm trong hợp đồng API. Sau khi có token, Frontend tự động tạo một album mặc định (`POST /albums`, `title: "Default"`) cho tài khoản mới, đảm bảo người dùng luôn có sẵn ít nhất một album để tải ảnh vào ngay từ lần đầu sử dụng.

**1.2. Đăng nhập — `POST /auth/login`**

- Frontend → Backend: `POST /auth/login`, body `{username, password}`.
- Backend → PostgreSQL: `SELECT id, username, password_hash FROM users WHERE username=:username LIMIT 1`.
- Backend (nội bộ): so khớp mật khẩu với `password_hash` đã băm.
  - Không tìm thấy tài khoản, hoặc sai mật khẩu → Backend trả **`401 Unauthorized`**.
- Backend (nội bộ): sinh JWT (HS256), payload chỉ chứa `{user_id, username, exp}` — **không chứa `role`**, quyết định thiết kế có chủ đích để tránh quyền hạn bị lỗi thời trong phiên.
- Backend → Frontend: **`200 OK`**, `AuthResponse {access_token, token_type: "bearer", expires_in}`.
- Frontend lưu `access_token` vào `localStorage`, điều hướng người dùng sang Dashboard.

**1.3. Lấy hồ sơ hiện tại — `GET /auth/me`**

- Frontend → Backend: `GET /auth/me`, header `Authorization: Bearer <token>`.
- Backend (nội bộ): giải mã và kiểm tra hiệu lực JWT.
  - Thiếu header hoặc sai định dạng → Backend trả **`401`**.
- Backend → PostgreSQL: truy vấn lại đầy đủ hồ sơ, **bao gồm cả `role` lấy trực tiếp từ cơ sở dữ liệu**, không đọc từ token.
- Backend → Frontend: **`200 OK`**, trả về hồ sơ đầy đủ.

**Cơ chế phiên đăng nhập toàn cục ở Frontend:** một interceptor lắng nghe lỗi `401` từ bất kỳ lệnh gọi API nào trong toàn hệ thống — nếu phát hiện token hết hạn hoặc không hợp lệ giữa chừng (không chỉ lúc đăng nhập), tự động xóa token, điều hướng người dùng về trang đăng nhập. Cơ chế này đồng bộ qua nhiều tab trình duyệt đang mở cùng lúc.

### Phần D — Đã làm được và hạn chế còn tồn tại

**Đã đảm bảo:** mật khẩu không lưu dạng thô, có hai lớp bảo vệ chống đăng ký trùng lặp kể cả trong tình huống cạnh tranh, JWT không nhúng quyền hạn để tránh quyền hạn lỗi thời trong phiên.

**Hạn chế ưu tiên cao nếu phát triển tiếp:**
- Chưa có cơ chế giới hạn số lần đăng nhập sai liên tiếp (rate limiting/account lockout) — hiện tại một kẻ tấn công có thể thử mật khẩu không giới hạn số lần. Đây là hạn chế cần khắc phục sớm nhất nếu hệ thống tiến tới môi trường thực tế, vì đây là một trong những lỗ hổng xác thực phổ biến và nghiêm trọng nhất.
- Chưa có cơ chế thu hồi mã truy cập trước khi tự hết hạn (đã phân tích chi tiết ở phần lý thuyết REST) — chấp nhận được ở quy mô hiện tại vì thời hạn token đã được giới hạn ngắn.

**Hạn chế ưu tiên thấp hơn, phù hợp giai đoạn phát triển sau:**
- Chưa có xác thực đa yếu tố.
- Chưa có xác minh địa chỉ email khi đăng ký.
- Chưa có giới hạn tần suất gọi API đăng ký để chống tạo tài khoản hàng loạt.

Các hạn chế này được chấp nhận có ý thức ở quy mô đồ án, nơi mục tiêu chính là chứng minh tính khả thi của bài toán truy hồi ảnh đa phương thức, không phải xây dựng một hệ thống xác thực đạt chuẩn sản xuất thực tế.

---

## LUỒNG 2 — TẢI ẢNH (Upload qua Presigned URL, ba bước)

### Phần A — Diễn giải bằng tình huống thực tế

Hãy tưởng tượng ta muốn gửi một gói hàng lớn cho một công ty.

Có hai cách. Cách thứ nhất: mang gói hàng tới tận văn phòng, đưa cho lễ tân, lễ tân lại phải tự mình mang gói hàng đó xuống kho — vừa mất công lễ tân, vừa tốn thời gian, và nếu một trăm người cùng lúc mang hàng tới thì lễ tân sẽ quá tải.

Cách công ty này chọn: gọi điện cho công ty trước. Công ty cho một **"giấy phép tạm thời"** — một tờ giấy có đóng dấu, ghi rõ "người cầm giấy này được phép mang đúng một gói hàng, nặng không quá 20kg, tới đúng cửa kho số 7, trong vòng một tiếng tới". Cầm tờ giấy đó, **tự mình đi thẳng tới kho**, không cần qua lễ tân nữa — kho tự nhận hàng luôn.

Sau khi bỏ hàng vào kho xong, gọi lại cho công ty: "Tôi đã bỏ hàng vào kho rồi đó". Công ty ghi vào sổ: "Đã nhận được hàng, cất ở kho 7". Ngay sau khi ghi sổ xong, công ty **lập tức trả lời**: "Xong rồi, cảm ơn" — và cúp máy luôn, **không chờ** việc kiểm tra chi tiết bên trong gói hàng. Việc kiểm tra chi tiết được giao cho một đội khác, làm sau, âm thầm, không bắt phải đợi trên điện thoại.

Có hai tình huống sự cố đáng chú ý. **Thứ nhất**: giả sử đã bỏ hàng vào kho xong, gọi báo, nhưng đúng lúc đó máy tính công ty bị lỗi, không ghi được vào sổ. Công ty không để mặc kệ — họ **chủ động cho người ra kho lấy lại đúng gói hàng đó ra**, coi như chưa từng có chuyện gì xảy ra, không để lại một gói hàng "vô chủ" nằm lăn lóc trong kho mãi mãi. **Thứ hai**: giả sử đã bỏ hàng vào kho, nhưng rồi quên gọi báo, hoặc tắt máy giữa chừng — công ty **không hề biết** là có một gói hàng đang nằm trong kho của họ. Đây chính là một lỗ hổng thật: chưa có ai đi kiểm tra định kỳ xem có gói hàng nào vô chủ để dọn dẹp.

Một chi tiết tinh tế khác: cái "giấy phép tạm thời" đó được viết với **địa chỉ kho mà chính khách hàng nhìn thấy được** — nghe hiển nhiên, nhưng công ty phải cẩn thận: địa chỉ nội bộ mà nhân viên dùng để gọi nhau qua bộ đàm ("kho 7") khác với địa chỉ mà khách hàng ở ngoài cần dùng để tự lái xe tới ("số 123 đường ABC") — nếu ghi nhầm địa chỉ nội bộ vào giấy phép, khách hàng cầm tờ giấy đó sẽ không biết đường nào mà đi.

### Phần B — Ánh xạ vào hệ thống

| Trong câu chuyện | Trong hệ thống SISE |
|---|---|
| Gọi điện xin giấy phép tạm thời | `POST /media/upload-url` — bước S1 |
| Giấy phép có đóng dấu, ghi rõ cửa kho, giới hạn 20kg, thời hạn 1 tiếng | Presigned URL — đường dẫn có chữ ký số, ràng buộc dung lượng tối đa 20MB, định dạng cho phép, hiệu lực 3600 giây |
| Tự mình mang hàng thẳng tới kho, không qua lễ tân | `PUT` trực tiếp từ Frontend lên MinIO — bước S2, ngoại lệ duy nhất Frontend chạm thẳng hạ tầng lưu trữ |
| Gọi báo "đã bỏ hàng vào kho rồi" | `POST /media/upload/confirm` — bước S3 |
| Công ty ghi vào sổ | Backend `INSERT` metadata vào bảng `images` trong PostgreSQL, trạng thái `index_status = "pending"` |
| Trả lời ngay, không chờ đội kiểm tra chi tiết | Response trả về ngay sau khi enqueue, không chờ tác vụ lập chỉ mục vector chạy xong |
| Đội kiểm tra chi tiết làm việc âm thầm phía sau | Celery worker xử lý bất đồng bộ — trích xuất vector đặc trưng, cập nhật chỉ mục |
| Công ty chủ động lấy lại gói hàng nếu lỡ không ghi được sổ | Cơ chế bù trừ (compensating action) — nếu `INSERT` metadata thất bại, Backend tự xóa lại object vừa tải lên MinIO |
| Gói hàng vô chủ không ai biết nếu khách quên gọi báo | Hạn chế đã biết — chưa có cơ chế tự động dọn dẹp file tồn tại trên MinIO nhưng không có metadata tương ứng |
| Địa chỉ kho nội bộ khác địa chỉ khách hàng nhìn thấy | Hai địa chỉ MinIO tách biệt — địa chỉ nội bộ cho giao tiếp container-to-container, địa chỉ công khai khi sinh presigned URL trả về trình duyệt |

### Phần C — Đặc tả chi tiết

**Timeline tham gia:** Frontend, Backend, MinIO, PostgreSQL, Celery Worker (chỉ enqueue, xử lý chi tiết ở Luồng 6)

**2.1. Bước S1 — Xin đường dẫn tải lên: `POST /media/upload-url`**

- Frontend → Backend: `POST /media/upload-url`, header `Authorization`, `Idempotency-Key` (tùy chọn), body `{filename, content_type, expected_size_mb}`.
- Backend (nội bộ): nếu có `Idempotency-Key`, kiểm tra định dạng UUID hợp lệ — sai định dạng → **`400`**.
- Backend (nội bộ): validate request — chỉ chấp nhận `content_type ∈ {image/jpeg, image/png}`, `expected_size_mb ≤ 20` — sai → **`400`**.
- Backend → Redis: kiểm tra `Idempotency-Key` đã tồn tại kết quả cache chưa — nếu có → Backend trả ngay **`409 Conflict`** kèm đúng schema `PresignedUploadResponse` của lần gọi thành công đầu tiên, không xử lý lại.
- Backend (nội bộ): sinh `image_id = uuid4()`, `object_key = "raw-images/{user_id}/{image_id}/{filename}"`.
- Backend → MinIO (SDK, không qua REST): sinh presigned URL phương thức PUT, hiệu lực 3600 giây, ký bằng AWS Signature V4.
- Backend → Redis: lưu cache kết quả cho 24 giờ (nếu có `Idempotency-Key`).
- Backend → Frontend: **`200 OK`**, `PresignedUploadResponse {upload_url, object_key, expires_in_sec: 3600, max_file_size_mb: 20, allowed_content_types: [...]}`.

**2.2. Bước S2 — Tải file nhị phân: `PUT` trực tiếp lên MinIO**

- Frontend → MinIO: `PUT <upload_url>`, body là file nhị phân thô — ngoại lệ duy nhất Frontend chạm trực tiếp hạ tầng lưu trữ, không đi qua Backend, không cần header xác thực (bản thân chữ ký trong URL đã đóng vai trò xác thực).
- MinIO tự cưỡng chế giới hạn dung lượng và định dạng đã nhúng trong chữ ký — vượt quá sẽ bị từ chối ở tầng hạ tầng, không cần Backend can thiệp.

**2.3. Bước S3 — Xác nhận: `POST /media/upload/confirm`**

- Frontend → Backend: `POST /media/upload/confirm`, body `{object_key, album_id, privacy_level, tags}`.
- Backend (nội bộ): validate — `privacy_level ∈ {0,1,2}`, `tags` tối đa 10 phần tử, mỗi tag 1-50 ký tự — sai → **`400`**.
- Backend → Redis: kiểm tra `Idempotency-Key` — trùng → **`409`** kèm response cũ.
- Backend → MinIO: xác minh file đã thực sự tồn tại tại đúng `object_key` — không tin tưởng mù client báo đã tải xong.
  - Không tồn tại → **`400`**, `{message: "Object not found in MinIO"}`.
- Backend → PostgreSQL: `INSERT INTO images (...) VALUES (..., index_status='pending')`.
  - **Nếu `INSERT` thất bại — cơ chế bù trừ kích hoạt**: Backend → MinIO xóa lại object vừa tải lên, ghi log hành động bù trừ, trả **`500`**, `{code: "METADATA_COMMIT_FAILED"}`.
- Backend → Celery (qua Redis làm broker): enqueue tác vụ lập chỉ mục, **không chờ kết quả** (fire-and-forget) — đây chính là điểm chuyển giao từ đồng bộ sang bất đồng bộ, chi tiết xử lý tiếp theo ở Luồng 6.
- Backend → MinIO: sinh presigned GET URL để trả về cho client xem ảnh.
  - Nếu bước này gặp sự cố tạm thời → **không fail toàn bộ request** — fallback sang URL không ký, ghi log cảnh báo.
- Backend → Redis: lưu cache Idempotency-Key với response vừa tạo.
- Backend → Frontend: **`200 OK`**, `UploadResponse {image_id, minio_url, status: "pending", index_status: "pending"}`.

**2.4. Luồng dự phòng — `POST /media/upload` (multipart, gộp một bước)**

- Frontend → Backend: multipart form gồm `file`, `album_id`, `privacy_level`.
- Backend → MinIO: Backend tự trung chuyển file (khác luồng chính thức — file **có đi qua** Backend).
- Các bước còn lại (ghi metadata, cơ chế bù trừ nếu thất bại, enqueue Celery, sinh presigned GET URL) giống hệt logic của bước S3.
- Backend → Frontend: **`201 Created`** (khác luồng chính thức dùng `200`).

### Phần D — Luồng Tải ảnh: Đã làm được và hạn chế còn tồn tại

**Đã đảm bảo:** tách bạch rõ ràng giữa xử lý đồng bộ (ba bước chính) và bất đồng bộ (lập chỉ mục vector), giảm tải cho Backend nhờ tải trực tiếp lên MinIO, có cơ chế bù trừ (compensating action) tự động xóa lại object nếu ghi metadata thất bại, có cơ chế dự phòng (fallback) sang URL không ký nếu sinh presigned GET URL gặp sự cố tạm thời, xác minh file thực sự tồn tại trên MinIO trước khi ghi nhận thay vì tin tưởng mù client.

**Hạn chế ưu tiên cao nếu phát triển tiếp:**

- **Chưa có cơ chế tự động dọn dẹp dữ liệu mồ côi (orphaned data).** Nếu client tải file lên MinIO thành công (S2) nhưng không bao giờ gọi tới bước xác nhận (S3) — do mất kết nối, đóng ứng dụng giữa chừng, hoặc đơn giản là đổi ý — file đó tồn tại vĩnh viễn trên MinIO mà không có bản ghi metadata tương ứng, không thể truy xuất qua bất kỳ luồng nghiệp vụ nào, nhưng vẫn chiếm dung lượng lưu trữ. Đây là hạn chế nghiêm trọng nhất của luồng này, vì về lâu dài nó gây lãng phí tài nguyên lưu trữ tích lũy theo thời gian, không tự giới hạn. Hướng khắc phục không phức tạp về mặt kỹ thuật: bổ sung một tác vụ định kỳ (tận dụng Celery Beat đã có sẵn hạ tầng) quét các object không có metadata tương ứng và đã tồn tại quá một khoảng thời gian an toàn, hoặc tận dụng tính năng lifecycle policy có sẵn của chính MinIO để tự động hết hạn object nếu không được xác nhận đúng hạn.

- **Chưa kiểm tra nội dung file thực tế tại thời điểm tải lên.** Vì bước S2 (client PUT thẳng lên MinIO) không đi qua Backend, hệ thống không thể xác minh file thực sự là một ảnh hợp lệ ngay tại thời điểm ghi — chỉ có thể kiểm tra `content_type` do client tự khai báo trước đó (dễ bị giả mạo, vì đây là thông tin client tự gửi lên, không phải hệ thống tự phân tích byte thật của file) và giới hạn dung lượng (được MinIO tự cưỡng chế dựa trên chữ ký đã nhúng sẵn). Một client có ý đồ xấu hoàn toàn có thể khai báo `content_type: image/jpeg` nhưng thực chất tải lên một loại file khác. Hướng khắc phục: bổ sung bước kiểm tra nội dung thực tế (ví dụ đọc vài byte đầu file để xác minh đúng định dạng ảnh, hoặc quét virus/mã độc) ngay trong quy trình lập chỉ mục bất đồng bộ ở Luồng 6, trước khi chính thức đánh dấu ảnh sẵn sàng phục vụ tìm kiếm.

**Hạn chế ưu tiên thấp hơn, phù hợp giai đoạn phát triển sau:**

- **Bề mặt tấn công của presigned URL nếu bị lộ trong thời hạn hiệu lực.** Presigned URL tuy có thời hạn (3600 giây) và ràng buộc sẵn dung lượng/định dạng trong chữ ký, nhưng nếu URL này vô tình bị lộ (ví dụ qua lịch sử trình duyệt, log mạng trung gian) trong thời gian còn hiệu lực, bất kỳ ai có URL đó đều có thể tải một file lên đúng vị trí đã định, dù không biết trước nội dung gì sẽ được ghi. Rủi ro này ở mức thấp do thời hạn hiệu lực đã được giới hạn tương đối ngắn, nhưng vẫn là một khoảng hở lý thuyết cần lưu ý nếu tiến tới môi trường có yêu cầu bảo mật cao hơn.

- **Không có giới hạn tần suất gọi liên tiếp cho endpoint xin presigned URL.** Một tài khoản (hoặc một client bị chiếm quyền) có thể gọi liên tục `POST /media/upload-url` để sinh ra hàng loạt presigned URL mà không nhất thiết sử dụng, gây lãng phí tài nguyên tính toán chữ ký, dù không trực tiếp gây hại tới dữ liệu.

Các hạn chế này được chấp nhận có ý thức ở quy mô đồ án — luồng tải ảnh đã đảm bảo đúng tính đúng đắn dữ liệu ở kịch bản vận hành bình thường và một phần các kịch bản lỗi phổ biến (ghi metadata thất bại, sinh URL xem ảnh thất bại), còn các hạn chế liệt kê ở trên chủ yếu liên quan tới các kịch bản biên (edge case) ít xảy ra hơn hoặc đòi hỏi thêm lớp kiểm tra bảo mật vượt ngoài phạm vi chứng minh khái niệm chính của đồ án.


---

# LUỒNG 3 — TÌM KIẾM (Ảnh và Văn bản)

## Phần A — Diễn giải bằng tình huống thực tế

Hãy tưởng tượng ta bước vào một thư viện rất lớn, muốn tìm một cuốn sách nhưng không nhớ tên chính xác — chỉ nhớ mang máng nội dung, hoặc có sẵn một tấm ảnh chụp bìa sách tương tự.

Ta không tự đi lục từng kệ sách — ta đưa yêu cầu cho một **nhân viên phiên dịch đặc biệt**, người có khả năng "hiểu" cả tranh ảnh lẫn lời mô tả, rồi chuyển hóa yêu cầu đó thành một loại "dấu vân tay ngữ nghĩa" — một thứ mà, dù ta đưa vào bằng hình ảnh hay bằng lời nói, hai loại dấu vân tay đó vẫn có thể so sánh được với nhau trên cùng một hệ quy chiếu.

Nhân viên phiên dịch đưa "dấu vân tay" đó cho **một chuyên gia thủ thư** ở tầng kho lưu trữ trung tâm — người này không đọc hiểu ngôn ngữ tự nhiên, chỉ giỏi mỗi việc so sánh dấu vân tay với hàng vạn cuốn sách đã được đánh dấu vân tay sẵn từ trước, tìm ra những cuốn có dấu vân tay gần giống nhất, xếp hạng từ giống nhất đến ít giống hơn.

Nhưng trước khi trả kết quả, thủ thư còn phải làm thêm một việc tế nhị: **loại bỏ những cuốn sách không thuộc quyền xem của người hỏi** — có cuốn để công khai ai cũng xem được, có cuốn thuộc sở hữu riêng của một người khác và chỉ người đó được xem, có cuốn chỉ cho bạn bè của chủ sở hữu xem. Thủ thư cần biết trước danh sách "ai là bạn của ai" để lọc đúng cho từng trường hợp.

Nếu người hỏi còn giới hạn thêm "chỉ tìm trong đúng một ngăn tủ cụ thể của tôi", việc thu hẹp phạm vi này lại được thực hiện **sau khi** đã có danh sách kết quả trong tay — không phải yêu cầu thủ thư tìm trong đúng ngăn tủ đó ngay từ đầu.

## Phần B — Ánh xạ vào hệ thống

| Trong câu chuyện | Trong hệ thống SISE |
|---|---|
| Nhân viên phiên dịch biến ảnh/lời nói thành dấu vân tay ngữ nghĩa | AIModule — sinh vector đặc trưng 512 chiều qua CLIP |
| "Dấu vân tay" | Vector embedding |
| Chuyên gia thủ thư so sánh dấu vân tay, xếp hạng | StorageModule — tìm kiếm gần đúng trên pgvector, tính cosine similarity |
| Danh sách "ai là bạn của ai" | Bảng `friends` trong PostgreSQL, Backend truy vấn trước khi gửi bộ lọc |
| Ba loại quyền xem sách (công khai, riêng tư, chỉ bạn bè) | Bộ lọc quyền riêng tư ba tầng: `privacy_level` công khai / thuộc sở hữu chính người tìm / bạn bè và người sở hữu nằm trong danh sách bạn bè |
| Giới hạn "chỉ tìm trong một ngăn tủ", lọc sau khi có kết quả | Lọc theo `album_id` thực hiện phía Backend, sau khi đã nhận kết quả từ StorageModule — không gửi vào bộ lọc gốc |

## Phần C — Đặc tả chi tiết

**Timeline tham gia:** Frontend, Backend, PostgreSQL (bảng `friends`), AIModule, StorageModule (PostgreSQL/pgvector)

### 3.1. Tìm bằng ảnh — `POST /search/image`

- Frontend → Backend: `POST /search/image`, multipart `{file, top_k, metric, album_id?}`.
- Backend → AIModule: `POST /inference/embed/image`, multipart `{file}`, header `Authorization: Bearer <token>`.
  - AIModule trả `401/403` → Backend raise `PermissionError`.
  - AIModule trả `≥500` → Backend raise `RuntimeError`.
  - AIModule trả `≥400` khác → Backend raise `ValueError`.
  - Thành công → AIModule trả **`200 OK`**, `VectorEmbeddingResponse {vector[512], dim, model}`.
- Backend → PostgreSQL: `SELECT friend_id FROM friends WHERE user_id=:current_user_id ORDER BY friend_id` — lấy danh sách bạn bè (SQLAlchemy trực tiếp, vì đây là bảng thuộc quyền Backend, không phải cột vector).
- Backend (nội bộ): biên dịch `FilterExpression` dạng cây điều kiện: `(privacy_level = công khai) HOẶC (user_id = chính người tìm) HOẶC (privacy_level = bạn bè VÀ user_id thuộc danh sách bạn bè)`.
- Backend → StorageModule: `POST /vector/search/hybrid`, body `{vector, top_k, metric: "COSINE", filter: FilterExpression}`.
  - Timeout/lỗi kết nối → Backend raise `RuntimeError`.
  - `401/403` → `PermissionError`. `≥500` → `RuntimeError`. `≥400` khác → `ValueError`.
  - Thành công → **`200 OK`**, `SearchResponse {results[], latency_ms, top_k}`.
- Backend (nội bộ): nếu có `album_id` trong request, lọc lại kết quả phía Python (không gửi `album_id` vào `FilterExpression` — StorageModule không biết khái niệm album).
- Backend → Frontend: **`200 OK`**, `SearchResponse {results: [{image_id, score, minio_url, metadata}], latency_ms, top_k}`.

### 3.2. Tìm bằng văn bản — `POST /search/text`

- Frontend → Backend: `POST /search/text`, JSON `{query_text, top_k, metric, album_id?}`.
- Backend → AIModule: `POST /inference/embed/text`, JSON `{query_text}` — cùng cơ chế xử lý lỗi như 3.1.
- Phần còn lại (friends → filter → StorageModule → lọc album) giống hệt 3.1, chỉ khác nguồn vector.

**Lưu ý quan trọng:** toàn bộ Luồng 3 hoàn toàn đồng bộ — người dùng chờ trực tiếp cả hai lệnh gọi HTTP nội bộ (AIModule + StorageModule) trong cùng một request-response, không có phần nào chạy qua Celery/queue.

## Phần D — Đã làm được và hạn chế còn tồn tại

**Đã đảm bảo:** tách bạch rõ ràng vai trò điều phối thuần túy của Backend (không tự tính embedding, không tự làm ANN search), bộ lọc quyền riêng tư ba tầng áp dụng nhất quán cho cả hai chế độ tìm kiếm, phân tách hợp lý giữa lọc quyền riêng tư (StorageModule) và lọc album (Backend) để giữ giao diện giữa hai tầng đơn giản.

**Hạn chế ưu tiên cao nếu phát triển tiếp:**

- **Không có cơ chế thử lại khi AIModule hoặc StorageModule gặp lỗi tạm thời.** Đây là lựa chọn có chủ đích (ưu tiên tốc độ phản hồi cho luồng tương tác trực tiếp), nhưng đồng nghĩa một sự cố mạng thoáng qua cũng khiến toàn bộ lượt tìm kiếm thất bại ngay, dù bản chất lỗi có thể tự khỏi nếu thử lại sau một khoảng ngắn. Hướng cân nhắc: thêm một lớp thử lại rất ngắn (một lần, với thời gian chờ tối đa thấp) chỉ cho lỗi mạng rõ ràng tạm thời, không áp dụng cho lỗi xác thực hay lỗi dữ liệu.

- **Việc lọc theo album thực hiện sau khi đã nhận kết quả từ StorageModule có thể làm giảm số lượng kết quả trả về so với `top_k` yêu cầu.** Nếu phần lớn kết quả gần nhất tìm được không thuộc đúng album được lọc, số lượng kết quả cuối cùng trả về cho người dùng có thể ít hơn nhiều so với `top_k` đã yêu cầu, vì StorageModule không hề biết về ràng buộc album khi tìm kiếm. Hướng khắc phục: gửi kèm điều kiện album vào chính `FilterExpression` gửi cho StorageModule (đánh đổi lại việc StorageModule cần mở rộng khả năng hiểu thêm khái niệm album).

**Hạn chế ưu tiên thấp hơn, phù hợp giai đoạn phát triển sau:**

- Chưa có cơ chế cache cho các truy vấn tìm kiếm lặp lại (ví dụ nhiều người cùng tìm một cụm từ phổ biến), mỗi lượt tìm kiếm đều tính lại embedding và chạy lại ANN search từ đầu.
- Danh sách bạn bè được truy vấn lại mỗi lượt tìm kiếm, chưa có cơ chế cache tạm thời cho một phiên làm việc, dù danh sách này thường ít thay đổi trong thời gian ngắn.

---

# LUỒNG 4 — QUẢN LÝ ẢNH VÀ ALBUM (CRUD)

## Phần A — Diễn giải bằng tình huống thực tế

Hãy tưởng tượng ta có một tủ hồ sơ cá nhân tại một văn phòng lưu trữ.

Khi ta muốn **xem lại** một hồ sơ cụ thể, nhân viên văn phòng lấy đúng hồ sơ đó ra, đồng thời tự động chụp cho ta một tấm ảnh xem trước để tiện nhìn nhanh, không cần mở cả tập hồ sơ dày.

Khi ta muốn **sửa** một vài thông tin trên hồ sơ (chẳng hạn đổi tên ngăn lưu trữ, hoặc đổi mức độ riêng tư từ "chỉ tôi xem" sang "công khai"), nhân viên chỉ sửa đúng những mục ta yêu cầu, không động vào những mục còn lại — và trước khi sửa, luôn kiểm tra hai lần rằng đây đúng là hồ sơ của ta, không phải của người khác.

Khi ta muốn **xóa** một hồ sơ, nhân viên không hề tiêu hủy nó — chỉ đơn giản dán một nhãn "đã xóa" lên bìa hồ sơ rồi cất vào một ngăn riêng, khuất tầm mắt. Điều thú vị: nếu ta (hoặc ai đó nhầm lẫn) lại yêu cầu "xóa" đúng hồ sơ đó thêm một lần nữa, nhân viên sẽ nói ngay "không tìm thấy hồ sơ nào cần xóa cả" — vì trong sổ tay của nhân viên, quy tắc luôn ghi rõ "chỉ tìm trong số hồ sơ CHƯA dán nhãn đã xóa" — hồ sơ đã dán nhãn rồi coi như không còn tồn tại đối với yêu cầu xóa tiếp theo, dù vật lý nó vẫn nằm đó.

## Phần B — Ánh xạ vào hệ thống

| Trong câu chuyện | Trong hệ thống SISE |
|---|---|
| Tủ hồ sơ cá nhân | Bảng `images`, `albums` trong PostgreSQL, gắn với `user_id` |
| Xem hồ sơ kèm ảnh xem trước | `GET /media/{image_id}` — trả metadata kèm presigned URL sinh riêng cho lần xem đó |
| Chỉ sửa đúng mục được yêu cầu | `PUT /media/{image_id}/update` — chỉ cập nhật các trường thực sự được cung cấp |
| Kiểm tra hai lần đây đúng là hồ sơ của mình | Kiểm tra quyền sở hữu ở tầng Service (`get_image()` trước khi sửa) và điều kiện `WHERE user_id=...` trực tiếp trong câu lệnh ở tầng Adapter |
| Dán nhãn "đã xóa" thay vì tiêu hủy | Xóa mềm — `UPDATE ... SET deleted_at = NOW()`, không xóa file vật lý khỏi MinIO |
| Xóa lần hai báo "không tìm thấy" | Điều kiện `WHERE ... AND deleted_at IS NULL` trong câu lệnh xóa — bản thân câu lệnh tự nhiên loại trừ các bản ghi đã xóa từ trước |

## Phần C — Đặc tả chi tiết

**Timeline tham gia:** Frontend, Backend, PostgreSQL, MinIO (chỉ để sinh URL xem ảnh)

### 4.1. Album — Tạo, liệt kê, xem, sửa, xóa mềm

- `POST /albums` → Backend `INSERT INTO albums (...)` → **`201`**, `Album`.
- `GET /albums` → Backend `SELECT ... FROM albums WHERE user_id=... AND deleted_at IS NULL` → **`200`**, `AlbumListResponse`.
- `GET /albums/{album_id}` → không tìm thấy/không đúng chủ → **`404`**.
- `PUT /albums/{album_id}`:
  - Backend → Service: kiểm tra tồn tại và đúng chủ sở hữu trước.
  - Backend → PostgreSQL: `UPDATE albums SET {chỉ các trường được cung cấp} WHERE id=... AND user_id=... AND deleted_at IS NULL RETURNING ...`.
  - Không có trường nào thay đổi → trả nguyên trạng, không gọi UPDATE.
  - → **`200`**, `Album` đã cập nhật.
- `DELETE /albums/{album_id}`:
  - Backend → PostgreSQL: `UPDATE albums SET deleted_at = NOW() WHERE id=... AND user_id=... AND deleted_at IS NULL`.
  - `rowcount == 0` (đã xóa từ trước hoặc không tồn tại) → **`404`**.
  - Thành công → **`204 No Content`**.

### 4.2. Ảnh — Xem, liệt kê, sửa metadata, xóa mềm

- `GET /media/{image_id}`:
  - Backend → PostgreSQL: `SELECT ... FROM images WHERE id=...`, kiểm tra `user_id` khớp.
  - Không khớp/không tồn tại → **`404`**.
  - Backend → MinIO: sinh presigned GET URL để đính kèm `minio_url` vào response.
  - → **`200`**, `ImageMetadata`.
- `GET /media` (liệt kê, phân trang):
  - Backend → PostgreSQL: `SELECT ... LIMIT :limit OFFSET :offset [AND album_id=...]`.
  - Với mỗi ảnh trong danh sách, Backend → MinIO sinh riêng một `minio_url`.
  - → **`200`**, `ImageListResponse {items, total, offset, limit}`.
- `PUT /media/{image_id}/update`:
  - Backend kiểm tra sở hữu trước → không đúng chủ → **`404`**.
  - Backend → PostgreSQL: `UPDATE images SET {chỉ trường được cung cấp: album_id/privacy_level/tags} WHERE ...`.
  - → **`200`**, `ImageMetadata` (kèm `minio_url` sinh lại).
- `DELETE /media/{image_id}/delete`:
  - Backend → PostgreSQL: `UPDATE images SET deleted_at = NOW() WHERE id=... AND user_id=...` — xóa mềm, không xóa file vật lý khỏi MinIO.
  - `rowcount == 0` → **`404`**.
  - Thành công → **`204`**.

## Phần D — Đã làm được và hạn chế còn tồn tại

**Đã đảm bảo:** cơ chế idempotent tự nhiên qua điều kiện truy vấn cho hành động xóa (không cần Idempotency-Key riêng), hai lớp kiểm tra quyền sở hữu độc lập, xóa mềm giữ khả năng khôi phục và tránh lệch đồng bộ giữa dữ liệu quan hệ và vector đặc trưng.

**Hạn chế ưu tiên cao nếu phát triển tiếp:**

- **Dữ liệu đã xóa mềm tồn tại vĩnh viễn, chưa có cơ chế dọn dẹp định kỳ.** Theo thời gian, số lượng bản ghi đã đánh dấu xóa tích lũy ngày càng nhiều, vẫn chiếm dung lượng lưu trữ (cả metadata trong PostgreSQL lẫn file vật lý trên MinIO) dù không còn giá trị sử dụng thực tế đối với người dùng. Hướng khắc phục: bổ sung một tác vụ định kỳ dọn dẹp vĩnh viễn (hard delete) các bản ghi đã xóa mềm quá một khoảng thời gian dài (ví dụ 30-90 ngày), cho người dùng đủ thời gian để khôi phục nếu xóa nhầm trước khi dữ liệu bị xóa vĩnh viễn.

- **Liệt kê ảnh sinh URL xem ảnh riêng cho từng ảnh trong trang, có thể tốn nhiều lệnh gọi MinIO nếu trang có nhiều ảnh.** Với mỗi lượt liệt kê N ảnh, hệ thống thực hiện N lệnh gọi riêng biệt tới MinIO để sinh presigned URL, thay vì một cơ chế sinh hàng loạt hiệu quả hơn. Ở quy mô trang nhỏ (vài chục ảnh) không đáng kể, nhưng có thể trở thành điểm nghẽn nếu kích thước trang tăng lên đáng kể.

**Hạn chế ưu tiên thấp hơn, phù hợp giai đoạn phát triển sau:**

- Chưa có tính năng khôi phục lại ảnh/album đã xóa mềm từ giao diện người dùng (dữ liệu vẫn còn trong cơ sở dữ liệu nhưng chưa có endpoint hay giao diện để "hoàn tác" việc xóa).
- Chưa có giới hạn số lượng album hoặc số lượng ảnh tối đa cho mỗi tài khoản.

---

# LUỒNG 5 — ĐÁNH GIÁ BENCHMARK (Chỉ quản trị viên)

## Phần A — Diễn giải bằng tình huống thực tế

Hãy tưởng tượng một giáo viên muốn kiểm tra xem một trợ giảng AI có thực sự nhận diện đúng khuôn mặt học sinh trong danh sách lớp hay không.

Giáo viên (chỉ giáo viên mới có quyền làm việc này, không phải học sinh nào cũng được tự ý kiểm tra) chọn ngẫu nhiên một số ảnh học sinh đã có sẵn trong hồ sơ lớp. Với **từng tấm ảnh một**, giáo viên đưa cho trợ giảng AI xem, rồi hỏi: "Trong toàn bộ hồ sơ lớp, ảnh nào giống người này nhất?" Trợ giảng đưa ra một danh sách xếp hạng.

Có một quy tắc quan trọng giáo viên luôn tuân thủ: **không bao giờ tính chính tấm ảnh vừa đưa vào danh sách kết quả** — vì dĩ nhiên ảnh đó sẽ "giống" chính nó nhất, tính vào sẽ làm bài kiểm tra trở nên vô nghĩa, giống hệt như hỏi ai đó "ai là bạn không" bằng cách chỉ ngay chính người đó.

Sau khi thu thập đủ kết quả cho mọi tấm ảnh mẫu, giáo viên tổng hợp lại thành một bảng điểm chi tiết — không chỉ điểm tổng, mà còn phân tích riêng từng học sinh, và đặc biệt chú ý: có những cặp học sinh nào hay bị trợ giảng nhầm lẫn với nhau không, và tại sao.

Bài kiểm tra này khá tốn công — với mỗi tấm ảnh, giáo viên phải lật hồ sơ, hỏi trợ giảng, ghi chép kết quả — nên giáo viên **không rời khỏi phòng cho tới khi kiểm tra xong toàn bộ**, dù việc này có thể mất một khoảng thời gian đáng kể. Chỉ khi hoàn tất toàn bộ bài kiểm tra, giáo viên mới thông báo kết quả ra ngoài.

## Phần B — Ánh xạ vào hệ thống

| Trong câu chuyện | Trong hệ thống SISE |
|---|---|
| Chỉ giáo viên mới được kiểm tra | Chỉ tài khoản có vai trò quản trị (`role = admin`), xác minh lại từ cơ sở dữ liệu mỗi lượt gọi |
| Chọn ngẫu nhiên một số ảnh học sinh | Lấy ngẫu nhiên tập ảnh đã sẵn sàng (`index_status = "ready"`) làm mẫu đánh giá |
| Loại bỏ chính ảnh vừa đưa ra khỏi kết quả | Loại bỏ ảnh mẫu khỏi ranked list trước khi tính bất kỳ chỉ số nào |
| Bảng điểm chi tiết, phân tích từng học sinh, cặp hay nhầm lẫn | Bốn chỉ số tổng hợp, phân tích theo từng nhóm đối tượng (`breakdown_by_class`), ma trận nhầm lẫn (`cross_class_confusion_matrix`) |
| Không rời phòng cho tới khi kiểm tra xong toàn bộ | Toàn bộ quá trình chạy đồng bộ trong một lượt gọi API, dù mã trạng thái trả về (202) gợi ý ngược lại |

## Phần C — Đặc tả chi tiết

**Timeline tham gia:** Frontend, Backend, PostgreSQL, MinIO, AIModule, StorageModule — lặp lại theo từng ảnh mẫu

### 5.1. Khởi chạy đánh giá — `POST /eval/run`

- Frontend → Backend: `POST /eval/run`, kèm mã truy cập, body tùy chọn số lượng mẫu và hạt giống ngẫu nhiên.
- Backend (nội bộ): xác minh quyền quản trị bằng truy vấn lại `role` từ cơ sở dữ liệu.
  - Không đủ quyền → **`403`**, `{code: "ERR_FORBIDDEN_ADMIN_ONLY"}`.
- Backend → PostgreSQL: ghi bản ghi lượt chạy mới, trạng thái đang chạy, trả về mã định danh lượt chạy.
- Backend → PostgreSQL: lấy ngẫu nhiên tập ảnh đã sẵn sàng theo số lượng và hạt giống đã cho; truy vấn toàn bộ số liệu nhãn hiện có trên mọi ảnh sẵn sàng, dùng làm `total_relevant_count` — mẫu số toàn cục tính Recall.
- **Với mỗi ảnh trong tập mẫu, lặp lại chuỗi bước:**
  - Backend → MinIO: tải bytes ảnh thật.
  - Backend → AIModule: `POST /inference/embed/image`.
  - Backend → StorageModule: `POST /vector/search/hybrid` tìm các kết quả gần nhất.
  - Backend (nội bộ): loại bỏ ngay chính ảnh mẫu khỏi danh sách kết quả trước khi tính toán tiếp.
  - Backend → PostgreSQL: truy vấn metadata (nhãn, album) của các ảnh kết quả để xác định mức độ liên quan.
  - Backend (nội bộ): xác định nhãn kết quả đứng đầu, đánh giá có bị nhầm sang một nhóm đối tượng khác hẳn hay không.
- Backend (nội bộ, sau vòng lặp): tính bốn chỉ số MRR/HitRate/Precision/Recall (Recall dùng `total_relevant_count` toàn cục làm mẫu số), `breakdown_by_class`, `cross_class_confusion_matrix`.
- Backend → MinIO: với mỗi truy vấn bị nhầm lẫn, sinh presigned GET URL cho ảnh mẫu và top-k liên quan (chỉ các trường hợp nhầm lẫn, không phải toàn bộ tập mẫu, để tránh lãng phí lệnh gọi).
- Backend → PostgreSQL: ghi các chỉ số vào bảng `evaluation_metrics`, cập nhật `evaluation_runs.status = 'completed'`.
  - Lỗi bất kỳ đâu trong toàn bộ quá trình → dừng ngay, cập nhật `status = 'failed'`, **không có cơ chế thử lại**.
- Backend → Frontend: **`202 Accepted`**, `{eval_id, status, breakdown_by_class, top1_cross_class_confusion_rate, cross_class_confusion_matrix, misclassified_queries}`.
  - **Lưu ý quan trọng:** mã `202` thường ngụ ý xử lý bất đồng bộ, nhưng toàn bộ vòng lặp trên đã chạy xong hoàn toàn đồng bộ trước khi phản hồi này được gửi đi — không có cơ chế thăm dò trạng thái riêng biệt. Đây là hạn chế thiết kế đã ghi nhận, phù hợp quy mô nghiên cứu của đồ án.

### 5.2. Truy vấn lại kết quả — `GET /eval/results/{eval_id}`, `GET /eval/metrics`

- Backend → PostgreSQL: kết hợp bảng `evaluation_runs` và `evaluation_metrics` theo `eval_id` (hoặc sắp theo thời điểm hoàn tất gần nhất cho `/eval/metrics`).
- Không tìm thấy → **`404`**. Thành công → **`200`**.

## Phần D — Đã làm được và hạn chế còn tồn tại

**Đã đảm bảo:** loại trừ đúng ảnh mẫu khỏi ranked list trước khi tính điểm (điểm sửa lỗi quan trọng đã trình bày ở Trụ cột đánh giá thực nghiệm), xác minh quyền quản trị bằng truy vấn lại từ cơ sở dữ liệu, phân tích chi tiết theo từng nhóm đối tượng thay vì chỉ đưa ra bốn con số tổng.

**Hạn chế ưu tiên cao nếu phát triển tiếp:**

- **Nghịch lý mã trạng thái 202 nhưng xử lý hoàn toàn đồng bộ.** Đã phân tích chi tiết ở Trụ cột REST — đây là hạn chế đã nhận diện, chấp nhận được ở quy mô benchmark hiện tại (khoảng một nghìn ảnh, hoàn tất trong thời gian ngắn), nhưng sẽ trở thành vấn đề thực sự nếu quy mô dữ liệu benchmark tăng lên đáng kể, khiến người gọi API phải chờ một khoảng thời gian dài mà không có phản hồi trung gian nào.

- **Không có cơ chế thử lại khi bất kỳ bước nào trong vòng lặp thất bại.** Một lỗi mạng thoáng qua ở giữa quá trình (ví dụ lượt gọi AIModule thứ 500 trong số 1000 lượt bị timeout) khiến toàn bộ lượt đánh giá phải chạy lại từ đầu, lãng phí toàn bộ công sức đã xử lý trước đó. Hướng khắc phục: lưu tạm kết quả từng ảnh mẫu đã xử lý xong, cho phép tiếp tục từ điểm dừng thay vì chạy lại toàn bộ nếu xảy ra lỗi giữa chừng.

**Hạn chế ưu tiên thấp hơn, phù hợp giai đoạn phát triển sau:**

- Chưa có khả năng so sánh trực quan giữa nhiều lượt chạy đánh giá khác nhau (ví dụ theo dõi xu hướng chỉ số qua thời gian) ngay trong hệ thống, cần truy vấn thủ công từng lượt riêng lẻ.
- Tập mẫu đánh giá lấy ngẫu nhiên mỗi lần chạy (trừ khi cố định hạt giống), nên hai lượt chạy liên tiếp có thể đánh giá trên tập mẫu khác nhau, gây khó khăn nếu muốn so sánh trực tiếp hiệu quả của một thay đổi cụ thể trước và sau.

---

# LUỒNG 6 — LẬP CHỈ MỤC VECTOR (Bất đồng bộ, tách biệt khỏi Tải ảnh)

## Phần A — Diễn giải bằng tình huống thực tế

Quay lại câu chuyện gửi hàng vào kho ở Luồng 2. Sau khi công ty đã ghi sổ "đã nhận hàng của khách A" và trả lời khách ngay, có một **đội hậu cần riêng** âm thầm nhận nhiệm vụ tiếp theo, làm việc hoàn toàn phía sau, không ai phải chờ đợi họ.

Đội hậu cần này lấy đúng gói hàng ra, "quét" nó qua một cỗ máy phân tích đặc biệt (tương đương việc hỏi trợ lý AI để mô tả nội dung), rồi ghi kết quả phân tích đó vào một cuốn catalogue trung tâm, để sau này bất kỳ ai muốn tìm kiếm hàng hóa tương tự đều tra được ngay.

Đội hậu cần này có một nguyên tắc xử lý sự cố khá tinh tế, chia thành hai loại. **Loại một — lỗi không thể sửa được**: ví dụ cỗ máy phân tích báo "gói hàng này có kích thước không đúng chuẩn hệ thống catalogue", hoặc phát hiện "gói hàng này thực ra đã bị hủy từ trước, không còn tồn tại nữa" — với loại lỗi này, đội hậu cần dừng ngay, đánh dấu "xử lý thất bại", không thử lại làm gì vì có làm lại trăm lần cũng vẫn y hệt kết quả đó. **Loại hai — trục trặc tạm thời**: ví dụ đường truyền tới cỗ máy phân tích bị chập chờn, hoặc catalogue trung tâm đang bận không phản hồi kịp — với loại này, đội hậu cần **kiên nhẫn thử lại**, lần đầu đợi một chút, lần sau đợi lâu hơn gấp đôi, cứ thế tăng dần, cho tới khi thành công hoặc đã thử đủ số lần cho phép thì mới chịu bỏ cuộc.

Điều thú vị: nếu gặp một sự cố lạ chưa từng gặp, không rõ thuộc loại nào, đội hậu cần có xu hướng **coi đó là trục trặc tạm thời và thử lại**, thay vì vội vàng kết luận "hỏng hẳn" — cho hệ thống thêm cơ hội tự phục hồi trước khi thực sự bỏ cuộc.

## Phần B — Ánh xạ vào hệ thống

| Trong câu chuyện | Trong hệ thống SISE |
|---|---|
| Đội hậu cần làm việc âm thầm phía sau, không ai phải chờ | Celery Worker — tiến trình xử lý nền riêng biệt |
| Không có ai gọi trực tiếp đội hậu cần, họ tự nhận việc sau khi kho báo | Không có endpoint HTTP riêng — kích hoạt duy nhất từ `.delay()` ở cuối Luồng 2 |
| Quét qua cỗ máy phân tích | Gọi AIModule sinh vector đặc trưng |
| Ghi vào catalogue trung tâm | Gọi StorageModule ghi vector vào pgvector qua REST, không SQLAlchemy trực tiếp vào cột `embedding` |
| Lỗi không thể sửa (sai kích thước, hàng đã hủy) | `PermanentIndexingError` — sai số chiều vector, bị từ chối quyền, ảnh đã bị xóa mềm giữa chừng |
| Trục trặc tạm thời, thử lại tăng dần | `TransientIndexingError` — timeout, mất kết nối, lỗi phía máy chủ, retry với backoff cấp số nhân |
| Sự cố lạ, coi là tạm thời, vẫn thử lại | Lỗi không xác định rõ loại mặc định được coi là `TransientIndexingError` |

## Phần C — Đặc tả chi tiết

**Timeline tham gia:** Celery Worker, MinIO, AIModule, StorageModule/PostgreSQL

> Không có endpoint HTTP riêng — kích hoạt duy nhất bởi `process_image_indexing.delay(image_id)` gọi từ Luồng 2 (bước S3). Đây chính là ranh giới đồng bộ/bất đồng bộ: Backend trả response cho Frontend ngay sau khi enqueue, không chờ luồng dưới đây chạy xong.

### 6.1. Chuỗi xử lý chính

- Celery Worker → MinIO: tải bytes ảnh thật từ `minio_object_name`.
- Celery Worker → AIModule: `POST /inference/embed/image`.
  - Timeout/connect error → raise `TransientIndexingError`.
- Celery Worker (nội bộ): validate `vector_dim` nhận được khớp `global_config.vector_dim` (đọc từ biến môi trường, không hardcode).
- Celery Worker → StorageModule: `POST /vector/index`, `{image_id, vector}`.
  - `201` → thành công.
  - `≥500` → `TransientIndexingError`.
  - `401/403` → `PermanentIndexingError`.
  - `400` kèm mã lỗi sai số chiều vector → `PermanentIndexingError` (không thử lại).
  - `400` khác → `PermanentIndexingError`.
- Celery Worker → PostgreSQL: `UPDATE images SET index_status='ready' WHERE id=... AND deleted_at IS NULL` — SQLAlchemy trực tiếp hợp lệ, vì đây là cột trạng thái, không phải cột `embedding`.
  - `rowcount == 0` (ảnh đã bị xóa mềm giữa chừng) → `PermanentIndexingError`.

### 6.2. Cơ chế lỗi và thử lại

| Loại lỗi | Ví dụ | Hành vi |
|---|---|---|
| `PermanentIndexingError` | Sai số chiều vector, bị từ chối quyền, ảnh không tồn tại | Không thử lại — chuyển ngay `index_status='failed'` |
| `TransientIndexingError` | Timeout, mất kết nối, lỗi 5xx | Thử lại với thời gian chờ tăng dần theo cấp số nhân, có giới hạn số lần thử tối đa |
| Lỗi không rõ loại | Trường hợp phát sinh ngoài dự kiến | Mặc định coi là tạm thời, vẫn cho cơ hội thử lại |

Khi đã hết số lần thử tối đa mà vẫn thất bại → dừng hẳn, chuyển `index_status='failed'`, không thử lại thêm.

## Phần D — Đã làm được và hạn chế còn tồn tại

**Đã đảm bảo:** phân loại lỗi rõ ràng tránh lãng phí tài nguyên thử lại những lỗi chắc chắn sẽ thất bại y hệt, ghi vector qua đúng giao diện lập trình ứng dụng chuyên biệt (không thao tác trực tiếp cột `embedding`), backoff cấp số nhân giữa các lần thử tránh gây áp lực dồn dập lên các dịch vụ đang gặp sự cố.

**Hạn chế ưu tiên cao nếu phát triển tiếp:**

- **Không có cơ chế thông báo chủ động cho người dùng khi lập chỉ mục thất bại vĩnh viễn.** Nếu một ảnh chuyển sang `index_status = 'failed'`, người dùng chỉ có thể biết được nếu tự vào xem lại chi tiết ảnh đó — không có cơ chế thông báo chủ động (ví dụ qua giao diện hoặc email) để người dùng biết ảnh của mình chưa thể tìm kiếm được, dẫn tới việc người dùng có thể không hiểu tại sao một ảnh nào đó "không xuất hiện" khi tìm kiếm dù rõ ràng đã tải lên. Hướng khắc phục: bổ sung cơ chế đánh dấu hiển thị trạng thái lập chỉ mục ngay trên giao diện chính (không chỉ ở trang chi tiết), hoặc gửi thông báo khi phát hiện thất bại vĩnh viễn.

- **Chưa có cơ chế tự động thử lại lần nữa cho các ảnh đã bị đánh dấu thất bại do lỗi tạm thời đã hết số lần thử.** Nếu nguyên nhân gốc của lỗi tạm thời (ví dụ AIModule bị quá tải kéo dài) đã được khắc phục sau đó, các ảnh đã bị đánh dấu thất bại vẫn nằm im, không tự động được thử lại — cần một hành động thủ công (như endpoint `/admin/reindex` đã có sẵn trong hệ thống) để kích hoạt lại.

**Hạn chế ưu tiên thấp hơn, phù hợp giai đoạn phát triển sau:**

- Chưa có giới hạn về số lượng tác vụ lập chỉ mục có thể chạy đồng thời, có nguy cơ gây quá tải AIModule nếu có lượng lớn ảnh được tải lên cùng lúc trong một khoảng thời gian ngắn.
- Chưa có cơ chế ưu tiên xử lý (ví dụ ưu tiên ảnh của người dùng đang hoạt động trực tuyến hơn ảnh tải lên từ lâu), toàn bộ tác vụ được xử lý theo đúng thứ tự đưa vào hàng đợi.


