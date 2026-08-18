# CÂU HỎI ÔN TẬP — TRỤ CỘT 4: LUỒNG NGHIỆP VỤ & HẠ TẦNG

---

## Cấp độ 1 — Câu hỏi chí mạng (giảng viên gần như chắc chắn hỏi)

**Câu 1.** REST không phải một giao thức mà là một bộ ràng buộc kiến trúc. Trình bày ý nghĩa của ràng buộc Stateless, và giải thích cơ chế JWT hiện thực hóa đúng ràng buộc này như thế nào.

**Câu 2.** Trình bày luồng nghiệp vụ Tải ảnh (Upload) — ba bước cụ thể, và chỉ rõ ranh giới chính xác giữa xử lý đồng bộ và bất đồng bộ nằm ở đâu trong luồng này.

**Câu 3.** Dependency Injection giải quyết vấn đề gì? Vì sao Service không nên tự khởi tạo Adapter bên trong constructor của chính nó?

---

## Cấp độ 2 — Câu hỏi hóc búa (đo độ hiểu sâu)

**Câu 4.** Vì sao endpoint khởi chạy đánh giá benchmark (`/eval/run`) trả về mã trạng thái 202 nhưng thực tế lại xử lý hoàn toàn đồng bộ? Đây có phải một lỗi thiết kế không, và nếu không thì vì sao?

**Câu 5.** Giải thích cơ chế bù trừ (compensating action) trong luồng Tải ảnh — nó giải quyết đúng vấn đề gì phát sinh từ việc tách xử lý đồng bộ/bất đồng bộ? Nêu một hạn chế còn tồn tại của cơ chế này.

**Câu 6.** Trình bày bài toán "hai địa chỉ cho cùng một dịch vụ" khi container hóa hệ thống có bước tải trực tiếp lên hạ tầng lưu trữ (như MinIO). Vì sao đây là hệ quả tất yếu của việc container hóa, không phải lỗi cấu hình ngẫu nhiên?

---

## Cấp độ 3 — Câu hỏi mở rộng (test khả năng liên hệ ngoài phạm vi REST/luồng nghiệp vụ)

**Câu 7.** So sánh JWT (Stateless) với Session truyền thống (Stateful) — trong trường hợp nào Session vẫn là lựa chọn hợp lý hơn JWT, dù JWT có lợi thế về khả năng mở rộng ngang?

**Câu 8.** Kiến trúc Workflow-Centric của hệ thống có điểm gì giống và khác so với Clean Architecture chuẩn? Trong bối cảnh nào kiến trúc này có lợi thế rõ rệt, và trong bối cảnh nào nó trở thành bất lợi?

**Câu 9.** Nếu hệ thống SISE cần mở rộng để phục vụ hàng triệu người dùng đồng thời, những quyết định kiến trúc nào đã trình bày (REST, JWT, container hóa từng module, Workflow-Centric) sẽ cần được xem xét lại đầu tiên, và theo hướng nào?

---

# CÂU TRẢ LỜI HOÀN CHỈNH — TRỤ CỘT 4: LUỒNG NGHIỆP VỤ & HẠ TẦNG

---

## CẤP ĐỘ 1

### Câu 1

**Phần lõi**

Stateless là một trong các ràng buộc kiến trúc cốt lõi của REST, yêu cầu mỗi yêu cầu (request) từ client phải tự chứa đầy đủ thông tin cần thiết để server xử lý nó, server không được lưu trạng thái riêng cho từng client giữa các lần gọi. Ràng buộc này giải quyết đúng bài toán mở rộng ngang: cho phép server chạy nhiều bản sao song song mà không cần đồng bộ trạng thái phiên đăng nhập giữa các bản sao đó.

JWT hiện thực hóa đúng ràng buộc này cho bài toán xác thực người dùng. Sau khi đăng nhập thành công, server sinh ra một token — một chuỗi ký tự được ký số, mang theo thông tin định danh cơ bản của người dùng và một thời hạn hiệu lực. Token này được lưu ở phía client và đính kèm vào header của mọi yêu cầu tiếp theo. Server, khi nhận yêu cầu, chỉ cần xác minh chữ ký của token bằng một khóa bí mật đã biết trước, mà không cần tra cứu bất kỳ cơ sở dữ liệu hay bộ nhớ phiên nào — toàn bộ thông tin cần thiết đã nằm sẵn trong chính token đó. Đây chính là điểm mấu chốt khiến JWT đúng nghĩa "Stateless": không có bước tra cứu trạng thái nào ở phía server.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "JWT có nhược điểm gì so với session?"* — JWT không thể thu hồi trước hạn một cách trực tiếp, vì server không tra cứu gì để xác minh nên cũng không có cách "đánh dấu" một token cụ thể là không còn hợp lệ trước khi nó tự hết hạn. Đây là hệ quả logic tất yếu, không phải thiếu sót khi triển khai — muốn thu hồi được, phải tra cứu một nơi lưu danh sách token bị vô hiệu hóa, nhưng việc tra cứu này chính là một dạng trạng thái phía server, mâu thuẫn với chính ràng buộc Stateless.

*Nếu hội đồng hỏi: "Hệ thống SISE xử lý vấn đề thu hồi token thế nào?"* — Hiện tại hệ thống chỉ dựa vào thời hạn hiệu lực của token để giới hạn rủi ro, chưa có blocklist hay refresh token riêng biệt. Đây là đánh đổi phạm vi có ý thức, phù hợp quy mô đồ án, ưu tiên nguồn lực cho bài toán truy hồi ảnh thay vì cơ chế xác thực nâng cao.

---

### Câu 2. Luồng Tải ảnh

**Phần lõi**

Luồng tải ảnh gồm ba bước tuần tự. Bước một, client gửi yêu cầu và nhận về một đường dẫn tải lên có chữ ký số (presigned URL), có thời hạn hiệu lực và ràng buộc sẵn về dung lượng, định dạng. Bước hai, client tự tải file ảnh trực tiếp lên MinIO bằng chính đường dẫn đó, hoàn toàn không đi qua Backend — đây là ngoại lệ duy nhất trong toàn hệ thống mà tầng giao diện được phép chạm thẳng vào hạ tầng lưu trữ. Bước ba, client gọi xác nhận hoàn tất; Backend kiểm tra file thực sự tồn tại trên MinIO, ghi nhận metadata vào cơ sở dữ liệu, rồi ngay lập tức đưa ảnh vào hàng đợi xử lý vector đặc trưng mà không chờ công đoạn đó hoàn tất mới phản hồi.

Ranh giới chính xác giữa đồng bộ và bất đồng bộ nằm đúng tại một dòng lệnh: lệnh đưa tác vụ lập chỉ mục vào hàng đợi Celery (`.delay()`) — đây là lệnh không chờ, trả về ngay lập tức. Toàn bộ ba bước (S1, S2, S3) đều đồng bộ, người dùng chờ phản hồi ngay; nhưng ngay sau khi enqueue xong ở cuối S3, response được trả về trước khi ảnh thực sự có vector đặc trưng — quá trình lập chỉ mục chạy hoàn toàn bất đồng bộ ở một tiến trình Celery worker riêng biệt.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "Tại sao không gộp cả ba bước vào một API duy nhất cho đơn giản?"* — Tách ba bước để tránh Backend phải trung chuyển dữ liệu nhị phân nặng (tốn RAM đệm, băng thông gấp đôi khi nhiều người tải đồng thời) — MinIO vốn được tối ưu sẵn cho việc nhận upload trực tiếp từ client. Hệ thống vẫn giữ một luồng dự phòng gộp một bước (`POST /media/upload`) cho các trường hợp không tiện áp dụng luồng ba bước.

*Nếu hội đồng hỏi: "Nếu bước 2 thất bại giữa chừng thì sao?"* — Nếu client không bao giờ gọi tới bước xác nhận (S3), hệ thống hiện chưa có cơ chế tự động phát hiện và dọn dẹp — đây là hạn chế đã nhận diện, hướng phát triển là bổ sung tác vụ định kỳ quét và dọn các đối tượng lưu trữ không có metadata tương ứng.

---

### Câu 3. Dependency Injection

**Phần lõi**

Nếu một Service tự khởi tạo Adapter bên trong constructor của chính nó (ví dụ tự tạo kết nối PostgreSQL ngay trong `__init__`), logic nghiệp vụ sẽ bị ràng buộc chặt với chi tiết triển khai hạ tầng cụ thể. Hậu quả: muốn kiểm thử riêng logic nghiệp vụ, bắt buộc phải có một cơ sở dữ liệu thật đang chạy, vì Adapter đã được tạo thật ngay bên trong Service, không thể thay thế bằng phiên bản giả lập.

Dependency Injection giải quyết đúng vấn đề này bằng cách đảo ngược trách nhiệm khởi tạo: Service chỉ khai báo nó cần một thứ tuân theo một giao diện nhất định (qua tham số constructor), việc tạo ra thứ cụ thể đó được thực hiện ở nơi khác (composition root) rồi "tiêm" vào từ bên ngoài. FastAPI cung cấp cơ chế này qua `Depends()`, đặt tại tầng Router.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "Lợi ích cụ thể của DI là gì, ngoài lý thuyết?"* — Cho phép kiểm thử Service bằng cách tiêm vào một Adapter giả lập, chạy trong mili giây, không cần khởi động PostgreSQL hay MinIO thật. Đồng thời cho phép thay đổi chi tiết triển khai hạ tầng chỉ ở đúng một nơi (composition root), không cần sửa rải rác trong logic nghiệp vụ.

*Nếu hội đồng hỏi: "Có sự khác biệt nào về cách 'tạo' phụ thuộc trong hệ thống không?"* — Có ba phạm vi: Singleton (tạo một lần, dùng lại mãi — cho config, connection pool, model AI đã warmup), Request-scoped (tạo mới mỗi request — cho session database, vì dùng chung một session cho nhiều request đồng thời sẽ gây giẫm chân nhau), và Composition (Service cấp cao lắp ráp từ nhiều Adapter nhỏ hơn qua nhiều `Depends()` lồng nhau).

---

## CẤP ĐỘ 2

### Câu 4. Nghịch lý mã 202 ở endpoint benchmark

**Phần lõi**

Endpoint `/eval/run` trả về mã 202, mã theo đúng chuẩn HTTP mang ý nghĩa "yêu cầu đã được tiếp nhận, sẽ xử lý bất đồng bộ, chưa có kết quả ngay". Nhưng hành vi triển khai thực tế lại chạy toàn bộ quá trình tính bốn chỉ số một cách đồng bộ trong cùng lượt gọi — response chỉ trả về sau khi tính toán đã hoàn tất, không có cơ chế thăm dò trạng thái riêng biệt.

Đây là một sai lệch ngữ nghĩa HTTP thật, đã được nhóm chủ động nhận diện và ghi nhận công khai như một hạn chế thiết kế đã biết, không phải một lỗi bị bỏ sót. Lý do chấp nhận: quy mô dữ liệu benchmark hiện tại (khoảng một nghìn ảnh) đủ nhỏ để toàn bộ quá trình hoàn tất trong thời gian ngắn, chưa đến mức bắt buộc phải tách thành tác vụ nền.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "Vậy đây có phải lỗi thiết kế không?"* — Về mặt tuân thủ ngữ nghĩa HTTP thuần túy, đây là một điểm chưa nhất quán cần sửa nếu làm nghiêm ngặt. Nhưng gọi nó là "lỗi bị bỏ sót" thì không chính xác — nhóm đã nhận diện đúng vấn đề và đưa ra hướng cải tiến rõ ràng: nếu quy mô benchmark tăng đáng kể trong tương lai, hướng tự nhiên là tách hẳn thành tác vụ nền, đúng theo mô hình bất đồng bộ mà luồng lập chỉ mục đã áp dụng.

*Nếu hội đồng hỏi: "Vậy tại sao không sửa luôn, dùng đúng mã 200 hoặc 201 cho đúng ngữ nghĩa?"* — Đây là một sửa đổi hợp lý và có thể thực hiện, không đòi hỏi thay đổi kiến trúc lớn. Việc chưa sửa phản ánh mức độ ưu tiên trong phạm vi thời gian của đồ án, không phải một trở ngại kỹ thuật.

---

### Câu 5. Cơ chế bù trừ trong luồng Tải ảnh

**Phần lõi**

Việc tách xử lý đồng bộ khỏi bất đồng bộ tạo ra một khoảng thời gian hệ thống tồn tại ở trạng thái trung gian — file đã ghi nhận nhưng vector đặc trưng chưa xử lý xong. Đây là điểm phát sinh rủi ro: nếu một bước trong chuỗi xử lý nhiều giai đoạn thất bại giữa chừng, hệ thống có nguy cơ rơi vào trạng thái không nhất quán.

Cụ thể trong luồng Tải ảnh: nếu file đã tồn tại thành công trên MinIO (bước hai hoàn tất), nhưng việc ghi metadata ở bước ba thất bại, hệ thống sẽ có một file "mồ côi" — tồn tại vật lý nhưng không có bản ghi metadata tương ứng. Cơ chế bù trừ giải quyết đúng tình huống này: nếu ghi metadata thất bại, hệ thống chủ động xóa lại chính file vừa tải lên MinIO, đưa hệ thống về đúng trạng thái nhất quán ban đầu — đây chính là nguyên lý Saga Pattern đơn giản hóa, cần thiết vì MinIO và PostgreSQL là hai hệ thống tách biệt, không thể dùng chung một giao dịch cơ sở dữ liệu để đảm bảo cả hai cùng thành công hoặc cùng thất bại.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "Hạn chế của cơ chế này là gì?"* — Nó chỉ xử lý đúng một chiều thất bại (bước ba thất bại, bù trừ cho bước hai). Tình huống khác — file đã lên MinIO nhưng client không bao giờ gọi bước xác nhận (do đóng ứng dụng giữa chừng, mất kết nối) — chưa có cơ chế tự động phát hiện và dọn dẹp. Hướng phát triển là bổ sung tác vụ định kỳ quét dọn các đối tượng không có metadata tương ứng.

---

### Câu 6. Bài toán hai địa chỉ cho Presigned URL

**Phần lõi**

Khi container hóa, các container trong cùng mạng nội bộ gọi lẫn nhau bằng tên định danh dịch vụ (ví dụ `minio`), không phải bằng địa chỉ mạng cục bộ, vì địa chỉ mạng cục bộ bên trong một container luôn trỏ về chính container đó. Vấn đề phát sinh: presigned URL được **sinh ra bởi Backend** — chạy bên trong mạng nội bộ container, dùng tên định danh dịch vụ nội bộ — nhưng lại được **sử dụng bởi trình duyệt của người dùng** — chạy hoàn toàn bên ngoài mạng nội bộ đó.

Đây là hệ quả tất yếu, không phải lỗi cấu hình ngẫu nhiên: cùng một dịch vụ (MinIO) có hai "địa chỉ đúng" khác nhau tùy vào việc ai đang cố kết nối tới nó. Nếu presigned URL chứa địa chỉ nội bộ, trình duyệt sẽ không phân giải được tên định danh dịch vụ đó, dẫn tới lỗi kết nối dù chữ ký số vẫn hoàn toàn hợp lệ. Lời giải: hệ thống duy trì hai địa chỉ tách biệt cho cùng một dịch vụ — một địa chỉ nội bộ dùng khi Backend tự giao tiếp với MinIO, một địa chỉ công khai dùng riêng khi sinh presigned URL trả về cho trình duyệt.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "Vấn đề này có phải đặc thù riêng của SISE không?"* — Không, đây là hệ quả tất yếu của bất kỳ kiến trúc nào kết hợp container hóa với việc có thành phần bên ngoài mạng nội bộ (như trình duyệt người dùng) cần giao tiếp trực tiếp với một dịch vụ bên trong mạng đó — một loại vấn đề rất dễ bị bỏ sót khi lần đầu container hóa, vì trong môi trường phát triển cục bộ ban đầu (trước khi container hóa), thường không hề tồn tại sự khác biệt giữa hai loại địa chỉ này.

---

## CẤP ĐỘ 3

### Câu 7. JWT vs Session — khi nào Session vẫn hợp lý hơn

**Phần lõi**

JWT có lợi thế về khả năng mở rộng ngang vì không cần các bản sao server chia sẻ chung trạng thái. Nhưng Session vẫn là lựa chọn hợp lý hơn trong các trường hợp: (1) hệ thống cần khả năng thu hồi quyền truy cập tức thời là yêu cầu bắt buộc, không thể chấp nhận độ trễ (ví dụ hệ thống ngân hàng, nơi khóa tài khoản cần có hiệu lực ngay lập tức, không thể chờ token tự hết hạn); (2) quy mô hệ thống nhỏ, không có nhu cầu mở rộng ngang qua nhiều bản sao server, khiến lợi thế cốt lõi của JWT không còn ý nghĩa thực tế, trong khi vẫn phải gánh chịu nhược điểm về khả năng thu hồi; (3) hệ thống cần lưu trữ nhiều thông tin trạng thái phiên phức tạp, việc nhồi tất cả vào token sẽ làm token phình to, tốn băng thông mỗi request.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "SISE có nên chuyển sang Session không?"* — Không, vì hệ thống hiện tại và định hướng phát triển vẫn hướng tới khả năng mở rộng ngang, và yêu cầu thu hồi tức thời không phải ưu tiên cao nhất ở quy mô đồ án. JWT vẫn là lựa chọn phù hợp, chỉ cần bổ sung refresh token có trạng thái nếu sau này cần cân bằng cả hai yêu cầu.

---

### Câu 8. Workflow-Centric so với Clean Architecture

**Phần lõi**

Cả hai đều phân chia mã nguồn theo năm lớp trách nhiệm tương tự (entities, adapters, services, routers). Điểm khác biệt cốt lõi: Clean Architecture tổ chức theo tầng trách nhiệm trước (toàn bộ Service của mọi nghiệp vụ nằm chung thư mục), Workflow-Centric tổ chức theo nghiệp vụ trước (mỗi nghiệp vụ sở hữu trọn bộ file riêng xuyên suốt cả năm lớp).

Workflow-Centric có lợi thế rõ rệt khi: hệ thống có nhiều nghiệp vụ tương đối độc lập, ít chia sẻ logic chung; đội ngũ phát triển nhỏ, ưu tiên tốc độ định vị và cô lập lỗi hơn là tối ưu tái sử dụng mã nguồn; giai đoạn đầu một hệ thống có khả năng tách thành Microservices sau này.

Nó trở thành bất lợi khi: nhiều nghiệp vụ chia sẻ logic nặng nề với nhau, khiến việc thiếu trừu tượng hóa gây trùng lặp mã nguồn đáng kể; đội ngũ phát triển lớn cần xây dựng các tầng dùng chung phức tạp phục vụ nhiều loại nghiệp vụ; hệ thống cần ranh giới triển khai độc lập thực sự cho từng phần (điều Workflow-Centric không cung cấp, vì vẫn là một ứng dụng nguyên khối).

**Rào trước rào sau**

*Nếu hội đồng hỏi: "Vì sao không dùng thẳng Clean Architecture chuẩn?"* — Với mười luồng nghiệp vụ tương đối độc lập của SISE, chi phí "trùng lặp mã nguồn" của Workflow-Centric thấp hơn nhiều so với lợi ích về tốc độ cô lập lỗi và định vị mã nguồn khi audit — một ưu tiên quan trọng cho một hệ thống do một người tự phát triển và tự kiểm định.

---

### Câu 9. Mở rộng lên hàng triệu người dùng — quyết định nào cần xem xét lại

**Phần lõi**

Bốn quyết định kiến trúc hiện tại cần được xem xét lại theo mức độ ưu tiên khác nhau khi mở rộng quy mô lớn:

**JWT** — cần bổ sung ngay cơ chế refresh token có trạng thái hoặc blocklist, vì ở quy mô hàng triệu người dùng, rủi ro token bị lộ hoặc cần thu hồi khẩn cấp trở nên đáng kể hơn nhiều so với quy mô nhỏ, không thể chỉ dựa vào thời hạn hiệu lực.

**Container hóa từng module** — về cơ bản vẫn đúng hướng, nhưng cần bổ sung khả năng chạy nhiều bản sao (horizontal scaling) cho từng module, đặc biệt AIModule (chi phí tính toán cao nhất) và BackendModule, kèm theo một load balancer phân phối tải.

**Workflow-Centric Architecture** — đây là điểm cần cân nhắc nhiều nhất: khi số lượng nghiệp vụ và đội ngũ phát triển tăng lên đáng kể, giới hạn về tái sử dụng mã nguồn có thể trở thành gánh nặng thực sự; hướng đi tự nhiên là bắt đầu tách các nghiệp vụ có tải cao nhất (như tìm kiếm) thành Microservices độc lập, tận dụng đúng lợi thế đã có sẵn từ việc ranh giới nghiệp vụ đã được phân định rõ ràng ngay từ đầu.

**REST** — về nguyên tắc vẫn phù hợp, nhưng có thể cần bổ sung thêm cơ chế cache mạnh hơn ở tầng REST cho các endpoint đọc dữ liệu tần suất cao, hoặc cân nhắc thêm GraphQL cho riêng Frontend nếu độ phức tạp giao diện tăng lên đáng kể.

**Rào trước rào sau**

*Nếu hội đồng hỏi: "Đâu là ưu tiên số một trong bốn thứ đó?"* — JWT và khả năng nhân bản BackendModule/AIModule, vì đây là hai điểm ảnh hưởng trực tiếp tới bảo mật và khả năng chịu tải ngay khi số lượng người dùng tăng — trong khi việc tái cấu trúc Workflow-Centric thành Microservices là một quá trình dài hạn hơn, có thể triển khai dần từng phần theo đúng chiến lược leo thang có chủ đích, không cần làm ngay một lúc.