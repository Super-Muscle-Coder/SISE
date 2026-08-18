# PHẦN I — REST LÀ GÌ, VÀ BÀI TOÁN GIAO TIẾP PHÂN TÁN CẦN GIẢI QUYẾT

## 1. Bài toán gốc — vì sao cần một quy ước giao tiếp chung

Một hệ thống như SISE không chạy trong một tiến trình (process) duy nhất — nó gồm nhiều thành phần độc lập: Frontend chạy trên trình duyệt của người dùng, Backend chạy trong một container riêng, AIModule và StorageModule chạy trong các container khác nữa. Các thành phần này cần trao đổi dữ liệu và ra lệnh cho nhau qua mạng, dù chúng được viết bằng ngôn ngữ khác nhau, chạy trên máy khác nhau, và thậm chí do những nhóm phát triển khác nhau xây dựng.

Nếu không có một quy ước chung, mỗi thành phần sẽ tự bịa ra cách giao tiếp riêng theo ý mình — ví dụ một endpoint tên `getUserData.php?id=5`, một endpoint khác tên `fetch_user_5.action`, một endpoint khác nữa lại dùng cấu trúc hoàn toàn khác. Hậu quả là việc tích hợp giữa các thành phần trở nên khó đoán, khó bảo trì, và mỗi lần thêm một thành phần mới phải học lại một quy ước hoàn toàn khác từ đầu.

## 2. REST — không phải một giao thức, mà là một bộ ràng buộc kiến trúc

REST (Representational State Transfer) không phải một công nghệ hay giao thức cụ thể, mà là một bộ ràng buộc kiến trúc (architectural constraints), được Roy Fielding đề xuất trong luận án tiến sĩ năm 2000. Ý tưởng cốt lõi: nếu một hệ thống phân tán tuân thủ đúng một tập hợp ràng buộc nhất định, nó sẽ đạt được các đặc tính mong muốn — có thể mở rộng, dễ đoán, dễ bảo trì — mà không cần một giao thức tập trung quy định cứng nhắc mọi chi tiết.

Mỗi ràng buộc trong REST giải quyết đúng một vấn đề cụ thể phát sinh từ bài toán giao tiếp phân tán:

**Ràng buộc Client-Server.** Tách biệt rõ trách nhiệm giữa bên yêu cầu (client) và bên xử lý (server) — client không cần biết chi tiết server xử lý ra sao, server không cần biết giao diện client trông như thế nào. Vấn đề được giải quyết: cho phép hai bên phát triển độc lập, miễn tuân thủ đúng giao diện đã thỏa thuận.

**Ràng buộc Stateless.** Mỗi yêu cầu (request) từ client phải tự chứa đầy đủ thông tin cần thiết để server xử lý nó, server không được lưu trạng thái riêng cho từng client giữa các lần gọi. Vấn đề được giải quyết: cho phép server dễ dàng mở rộng ngang (chạy nhiều bản sao song song) mà không cần đồng bộ trạng thái phiên giữa các bản sao đó — cơ chế đầy đủ của ràng buộc này, áp dụng cụ thể qua JWT, được trình bày ở Phần II.

**Ràng buộc Uniform Interface (giao diện thống nhất).** Mọi tài nguyên (resource) được thao tác thông qua một tập hợp phương thức chuẩn hóa và có ý nghĩa cố định — không tự bịa ra hành động mới cho mỗi loại tài nguyên. Vấn đề được giải quyết: một khi đã hiểu ý nghĩa của GET, POST, PUT, DELETE, có thể đoán được cách một API bất kỳ hoạt động, mà không cần đọc tài liệu riêng cho từng endpoint.

**Ràng buộc Cacheable.** Response cần khai báo rõ liệu nó có thể được lưu đệm (cache) lại hay không. Vấn đề được giải quyết: cho phép giảm số lượt gọi tới server cho những dữ liệu ít thay đổi, tăng hiệu năng tổng thể mà không cần server tự quản lý logic cache phức tạp.

**Ràng buộc Layered System (hệ thống phân lớp).** Client không cần biết nó đang giao tiếp trực tiếp với server cuối cùng hay đang đi qua một lớp trung gian (như một API Gateway hay một load balancer). Vấn đề được giải quyết: cho phép chèn thêm các lớp trung gian (bảo mật, cân bằng tải, ghi log) mà không phá vỡ giao tiếp giữa client và server.

## 3. Định vị REST so với các lựa chọn khác

Để hiểu rõ REST đang đánh đổi điều gì, cần đối chiếu với các phương án khác cùng giải quyết bài toán giao tiếp phân tán.

**So với RPC (Remote Procedure Call) truyền thống.** RPC cho phép gọi một hàm nằm trên máy khác gần như thể gọi một hàm cục bộ — ví dụ `getUserById(5)`. Cách tiếp cận này trực quan cho lập trình viên, nhưng che giấu mất bản chất "đây là một lệnh gọi qua mạng, có thể thất bại, có độ trễ" — dễ khiến lập trình viên viết code như thể lệnh gọi luôn thành công tức thời. REST buộc phải tường minh hóa việc này qua các khái niệm resource và method HTTP, giữ đúng bản chất "đây là một giao tiếp qua mạng" ngay trong cách thiết kế API.

**So với SOAP.** SOAP là một giao thức có cấu trúc rất chặt chẽ, dùng XML để định nghĩa chính xác từng thông điệp trao đổi, kèm theo một chuẩn mô tả dịch vụ riêng (WSDL). Đây là lựa chọn phù hợp cho các hệ thống doanh nghiệp lớn, cần hợp đồng giao tiếp cực kỳ nghiêm ngặt và có khả năng kiểm tra tự động sâu. Đổi lại, SOAP nặng nề hơn nhiều so với REST cả về cấu trúc dữ liệu (XML dài dòng hơn JSON) lẫn độ phức tạp khi triển khai — không phù hợp với một hệ thống có quy mô như một đồ án tốt nghiệp, nơi tốc độ phát triển và độ đơn giản quan trọng hơn mức độ chuẩn hóa cực đoan.

**So với GraphQL.** GraphQL cho phép client tự định nghĩa chính xác những trường dữ liệu nào nó cần trong một truy vấn duy nhất, tránh được vấn đề over-fetching (nhận về nhiều dữ liệu hơn cần thiết) hay under-fetching (phải gọi nhiều lần mới đủ dữ liệu) thường gặp ở REST truyền thống. Đây là một đánh đổi hợp lý cho các ứng dụng có giao diện phức tạp, nhiều màn hình cần các tổ hợp dữ liệu khác nhau. Với quy mô và độ phức tạp giao diện của SISE — số lượng loại tài nguyên và endpoint không quá lớn — lợi ích của GraphQL không đủ bù đắp cho chi phí học tập và triển khai thêm một tầng truy vấn mới, trong khi REST với cấu trúc endpoint đơn giản đã đáp ứng đủ nhu cầu thực tế.

Nhìn chung, REST được chọn không phải vì nó "tốt nhất tuyệt đối" trong mọi trường hợp, mà vì nó là điểm cân bằng phù hợp nhất giữa mức độ chuẩn hóa, độ đơn giản khi triển khai, và mức độ quen thuộc trong cộng đồng phát triển — ba yếu tố quan trọng nhất đối với quy mô và mục tiêu của hệ thống SISE.

## Bảng tổng hợp — So sánh REST với các phương án giao tiếp khác

| Tiêu chí | REST | RPC truyền thống | SOAP | GraphQL |
|---|---|---|---|---|
| Bản chất | Bộ ràng buộc kiến trúc dựa trên resource | Gọi hàm từ xa như gọi hàm cục bộ | Giao thức có cấu trúc chặt bằng XML | Ngôn ngữ truy vấn cho phép client chọn đúng dữ liệu cần |
| Độ tường minh về bản chất mạng | Cao — luôn rõ đây là thao tác qua mạng | Thấp — dễ khiến lập trình viên quên đây là lệnh gọi qua mạng | Cao | Trung bình |
| Độ phức tạp triển khai | Thấp đến trung bình | Thấp | Cao | Trung bình đến cao |
| Vấn đề over/under-fetching | Có thể gặp | Tùy thiết kế | Có thể gặp | Được giải quyết trực tiếp bằng thiết kế |
| Phù hợp quy mô | Vừa và nhỏ tới lớn | Nhỏ, nội bộ | Doanh nghiệp lớn, cần hợp đồng nghiêm ngặt | Ứng dụng có giao diện phức tạp, nhiều tổ hợp dữ liệu |
| Lựa chọn của SISE | **Đã chọn** | Không phù hợp bối cảnh | Quá nặng so với quy mô | Lợi ích không đủ bù chi phí triển khai thêm |

---

# PHẦN II — NGUYÊN LÝ HOẠT ĐỘNG: METHOD, STATUS CODE, STATELESSNESS, VÀ IDEMPOTENCY

## 1. HTTP Method như một hợp đồng ngữ nghĩa

Mỗi phương thức HTTP không đơn thuần là một "tên gọi" gắn với một hành động — nó mang theo một cam kết ngữ nghĩa (semantic contract) mà mọi thành phần trong hệ thống, kể cả những thành phần trung gian không hiểu gì về nghiệp vụ cụ thể (như một proxy hay một trình duyệt), đều có thể dựa vào để đưa ra quyết định đúng đắn mà không cần biết chi tiết bên trong.

**GET phải an toàn (safe) và idempotent.** "An toàn" nghĩa là gọi GET không được gây ra bất kỳ thay đổi nào trên server — đây không phải một quy ước tùy chọn, mà là một cam kết mà các thành phần trung gian dựa vào để đưa ra hành vi tối ưu: trình duyệt có thể tự động thử lại một GET bị lỗi mạng mà không lo gây tác dụng phụ ngoài ý muốn, một proxy có thể cache kết quả GET mà không sợ trả về dữ liệu đã lỗi thời theo cách gây hại, một công cụ tìm kiếm có thể tự động thu thập (crawl) hàng loạt GET mà không lo vô tình kích hoạt hành động nguy hiểm nào trên hệ thống.

**PUT và DELETE phải idempotent, nhưng không nhất thiết an toàn.** Idempotent nghĩa là gọi cùng một yêu cầu nhiều lần cho kết quả cuối cùng giống hệt như gọi một lần — ví dụ `DELETE /media/5` gọi năm lần liên tiếp cũng chỉ dẫn tới đúng một trạng thái: ảnh có mã 5 đã bị xóa, không có "xóa lần thứ hai" nào khác biệt so với lần đầu. Cam kết này cho phép các thành phần trung gian tự động thử lại một yêu cầu PUT hoặc DELETE bị nghi ngờ thất bại (do lỗi mạng, mất kết nối giữa chừng) mà không sợ gây hậu quả kép.

**POST là phương thức duy nhất không có cam kết idempotent theo mặc định.** Gọi cùng một POST hai lần có thể tạo ra hai tài nguyên khác nhau — ví dụ gọi hai lần `POST /auth/register` với cùng thông tin có thể (nếu không có cơ chế bảo vệ bổ sung) tạo ra hai tài khoản trùng lặp, hoặc lần thứ hai bị từ chối vì đã tồn tại. Chính vì thiếu cam kết này, các thành phần trung gian không được phép tự động thử lại một POST bị nghi ngờ thất bại — đây là lý do vì sao trình duyệt luôn cảnh báo người dùng trước khi tải lại một trang vừa submit một biểu mẫu (form), và cũng chính là lý do sâu xa khiến hệ thống cần thêm một cơ chế bổ sung — Idempotency-Key — cho các thao tác dùng POST nhưng cần được bảo vệ khỏi việc gọi lại ngoài ý muốn, trình bày chi tiết ở mục 4.

## Bảng tổng hợp — HTTP Method như hợp đồng ngữ nghĩa

| Method | An toàn (Safe) | Idempotent | Ý nghĩa cam kết | Hệ quả cho thành phần trung gian |
|---|---|---|---|---|
| GET | Có | Có | Chỉ đọc, không gây tác dụng phụ | Có thể tự động thử lại, có thể cache, có thể crawl tự động |
| PUT | Không | Có | Cập nhật toàn phần một tài nguyên | Có thể tự động thử lại nếu nghi ngờ thất bại |
| DELETE | Không | Có | Xóa một tài nguyên | Có thể tự động thử lại — gọi nhiều lần cho cùng kết quả |
| POST | Không | Không | Tạo mới hoặc kích hoạt hành động có tác dụng phụ | Không được tự động thử lại — cần Idempotency-Key nếu muốn an toàn khi gọi lại |


## 2. Status Code như một phần mở rộng của hợp đồng ngữ nghĩa

Cùng nguyên lý trên áp dụng cho mã trạng thái HTTP: mỗi mã không chỉ là một con số phân loại "thành công" hay "thất bại", mà mang một ý nghĩa cụ thể giúp bên gọi tự động đưa ra quyết định xử lý phù hợp mà không cần đọc nội dung chi tiết của response.

**Nhóm 2xx — thành công, nhưng khác nhau về ngữ nghĩa cụ thể.** 200 nghĩa là thành công và có nội dung trả về ngay. 201 nghĩa là đã tạo thành công một tài nguyên mới — khác biệt quan trọng với 200 ở chỗ nó ngụ ý một tài nguyên mới vừa ra đời, thường đi kèm việc trả về định danh của tài nguyên đó. 204 nghĩa là thành công nhưng không có nội dung trả về — phù hợp cho các thao tác như xóa, nơi không có gì cần trả lại cho client ngoài xác nhận đã hoàn tất. 202 nghĩa là yêu cầu đã được tiếp nhận nhưng chưa xử lý xong, sẽ hoàn tất sau — đây là mã dành riêng cho các thao tác bất đồng bộ, kèm cam kết ngầm rằng client sẽ cần một cơ chế khác (như thăm dò trạng thái định kỳ) để biết khi nào công việc thực sự hoàn tất.

**Nhóm 4xx — lỗi phía client, nhưng phân biệt rõ loại lỗi.** 400 nghĩa là dữ liệu gửi lên sai định dạng hoặc thiếu thông tin bắt buộc — lỗi này nằm ở chính nội dung yêu cầu, gọi lại y hệt sẽ vẫn thất bại y hệt cho tới khi client sửa lại dữ liệu gửi lên. 401 nghĩa là chưa xác thực hoặc xác thực không hợp lệ — khác biệt quan trọng với 403 ở chỗ 401 ngụ ý "hãy đăng nhập lại", còn 403 ngụ ý "đã biết bạn là ai, nhưng bạn không có quyền làm việc này, đăng nhập lại cũng không giải quyết được gì". 404 nghĩa là không tìm thấy tài nguyên được yêu cầu. 409 nghĩa là yêu cầu xung đột với trạng thái hiện tại của tài nguyên — ví dụ cố gắng tạo một tài khoản với tên đã tồn tại, khác biệt quan trọng so với 400 ở chỗ bản thân dữ liệu gửi lên không sai định dạng, chỉ là nó xung đột với những gì đã tồn tại từ trước.

**Nhóm 5xx — lỗi phía server.** 500 nghĩa là có lỗi không xác định xảy ra ở phía server trong lúc xử lý — khác biệt căn bản với mọi mã 4xx ở chỗ lỗi này không phải do client gửi sai gì cả, gọi lại y hệt yêu cầu (nếu server đã tự sửa được vấn đề) hoàn toàn có thể thành công.

Việc phân biệt rạch ròi các mã trạng thái này không phải chi tiết vụn vặt — nó cho phép Frontend, hay bất kỳ client nào gọi tới API, viết logic xử lý lỗi dựa trên chính mã trạng thái mà không cần phân tích nội dung response chi tiết: gặp 401 thì điều hướng về trang đăng nhập, gặp 409 khi đăng ký thì hiển thị thông báo trùng tên, gặp 500 thì gợi ý thử lại sau — toàn bộ logic này có thể viết chung một lần, áp dụng nhất quán cho mọi endpoint tuân thủ đúng quy ước, không cần viết riêng cho từng API.

## Bảng tổng hợp — Mã trạng thái HTTP và ý nghĩa phân biệt

| Mã | Nhóm | Ý nghĩa | Điểm khác biệt cần phân biệt |
|---|---|---|---|
| 200 | Thành công | Thành công, có nội dung trả về ngay | — |
| 201 | Thành công | Đã tạo thành công một tài nguyên mới | Khác 200 ở chỗ ngụ ý một tài nguyên mới vừa ra đời |
| 204 | Thành công | Thành công, không có nội dung trả về | Phù hợp cho xóa — không có gì để trả lại |
| 202 | Thành công | Đã tiếp nhận, xử lý bất đồng bộ, chưa xong | Cần cơ chế thăm dò trạng thái riêng để biết khi nào hoàn tất |
| 400 | Lỗi client | Dữ liệu sai định dạng hoặc thiếu thông tin | Lỗi nằm ở nội dung yêu cầu, gọi lại y hệt vẫn thất bại |
| 401 | Lỗi client | Chưa xác thực hoặc xác thực không hợp lệ | Ngụ ý "hãy đăng nhập lại" |
| 403 | Lỗi client | Đã xác thực nhưng không đủ quyền | Ngụ ý "biết bạn là ai rồi, nhưng không có quyền" — đăng nhập lại không giải quyết được |
| 404 | Lỗi client | Không tìm thấy tài nguyên | — |
| 409 | Lỗi client | Xung đột với trạng thái hiện tại của tài nguyên | Khác 400 ở chỗ dữ liệu gửi lên không sai định dạng, chỉ xung đột với dữ liệu đã tồn tại |
| 500 | Lỗi server | Lỗi không xác định ở phía server | Không phải do client gửi sai — gọi lại có thể thành công nếu server tự khắc phục được |

## 3. Statelessness và JWT — giải pháp kỹ thuật cụ thể cho một ràng buộc kiến trúc

Ràng buộc Stateless đã nêu ở Phần I là một yêu cầu kiến trúc trừu tượng — "server không được lưu trạng thái riêng cho từng client". JWT (JSON Web Token) là một giải pháp kỹ thuật cụ thể để hiện thực hóa đúng yêu cầu này cho bài toán xác thực người dùng.

**Cơ chế:** sau khi đăng nhập thành công, server sinh ra một token — một chuỗi ký tự được ký số (signed), mang theo thông tin định danh cơ bản của người dùng và một thời hạn hiệu lực. Token này được lưu ở phía client (thường trong bộ nhớ trình duyệt), và được đính kèm vào header của mọi yêu cầu tiếp theo. Server, khi nhận yêu cầu, chỉ cần xác minh chữ ký của token bằng một khóa bí mật đã biết trước, mà không cần tra cứu bất kỳ cơ sở dữ liệu hay bộ nhớ phiên nào để biết "người dùng này có đang đăng nhập hay không" — toàn bộ thông tin cần thiết đã nằm sẵn trong chính token đó.

**Đánh đổi so với session truyền thống (lưu trạng thái đăng nhập ở phía server, thường trong bộ nhớ hoặc cơ sở dữ liệu, gắn với một session ID).** Với session, mỗi khi có yêu cầu tới, server phải tra cứu xem session ID đó có tồn tại và còn hợp lệ hay không — điều này đòi hỏi mọi bản sao của server (nếu chạy nhiều instance song song để mở rộng) phải cùng truy cập được một nơi lưu session chung, tạo ra một điểm phụ thuộc chung giữa các bản sao. Với JWT, mỗi bản sao server hoàn toàn độc lập — chỉ cần cùng biết khóa bí mật để xác minh chữ ký, không cần chia sẻ bất kỳ trạng thái nào khác — đây chính là lợi ích cốt lõi khiến JWT phù hợp với một hệ thống có khả năng mở rộng ngang.

**Đánh đổi này đi kèm một hạn chế đã được nhận diện rõ ràng:** vì token tự chứa và không cần server tra cứu gì để xác minh, nó "sống" độc lập với server cho tới khi tự hết hạn — không có cách thu hồi một token cụ thể đã phát hành trước thời hạn theo đúng tinh thần stateless thuần túy, vì việc thu hồi đòi hỏi phải "nhớ" danh sách token nào còn hợp lệ, chính là trạng thái mà thiết kế ban đầu muốn tránh. Hệ quả toán học và thực tiễn đầy đủ của hạn chế này được phân tích ở Phần IV.

## Bảng tổng hợp — Statelessness (JWT) so với Session truyền thống

| Tiêu chí | JWT (Stateless) | Session truyền thống (Stateful) |
|---|---|---|
| Nơi lưu trạng thái đăng nhập | Phía client, trong chính token | Phía server, trong bộ nhớ hoặc cơ sở dữ liệu |
| Yêu cầu tra cứu mỗi request | Không — chỉ cần xác minh chữ ký | Có — phải tra cứu session ID còn hợp lệ hay không |
| Khả năng mở rộng ngang (nhiều bản sao server) | Dễ dàng — các bản sao độc lập, chỉ cần chung khóa bí mật | Khó hơn — các bản sao cần chia sẻ chung nơi lưu session |
| Khả năng thu hồi trước hạn | Không có sẵn — cần cơ chế bổ sung (blocklist, refresh token) | Có sẵn — chỉ cần xóa session khỏi nơi lưu trữ |
| Phù hợp với | Hệ thống cần mở rộng ngang, chấp nhận đánh đổi khả năng thu hồi tức thời | Hệ thống cần kiểm soát chặt phiên đăng nhập, quy mô không quá lớn |

## 4. Idempotency-Key — giải quyết đúng khoảng trống mà POST để lại

Quay lại nhận định ở mục 1: POST không có cam kết idempotent theo mặc định, khiến các thành phần trung gian không được phép tự động thử lại một POST nghi ngờ thất bại. Nhưng trong thực tế vận hành, chính client (không phải một thành phần trung gian vô danh, mà là chính người dùng hoặc chính đoạn code Frontend) hoàn toàn có thể cần gửi lại một POST — ví dụ khi mất kết nối mạng ngay sau khi gửi yêu cầu nhưng trước khi nhận được phản hồi, khiến client không chắc chắn yêu cầu đã được xử lý hay chưa.

**Cơ chế Idempotency-Key giải quyết đúng khoảng trống này:** client tự sinh ra một định danh duy nhất (thường là UUID) cho mỗi ý định hành động cụ thể — không phải cho mỗi lần gửi HTTP, mà cho mỗi "ý định" logic — và đính kèm định danh đó vào header của yêu cầu. Server, khi nhận được yêu cầu lần đầu với một khóa cụ thể, xử lý bình thường rồi lưu lại cặp (khóa, kết quả) vào một nơi tra cứu nhanh — trong hệ thống SISE là Redis, với thời gian sống (TTL) hai mươi bốn giờ. Nếu server nhận được một yêu cầu khác mang đúng khóa đó lần nữa, nó không xử lý lại từ đầu, mà tra cứu ngay kết quả đã lưu và trả về y hệt, kèm mã trạng thái 409 để báo hiệu "đây là một lần gọi lặp lại của một ý định đã hoàn tất, không phải một lỗi mới".

**Vì sao chọn Redis, không phải chính PostgreSQL đang dùng cho dữ liệu khác:** cơ chế tra cứu này cần độ trễ cực thấp (vì nó chạy ở đầu mỗi yêu cầu có tác dụng phụ, ảnh hưởng trực tiếp tới thời gian phản hồi tổng thể) và dữ liệu chỉ cần tồn tại tạm thời (hai mươi bốn giờ, không cần lưu vĩnh viễn) — cả hai đặc điểm này khớp đúng với thế mạnh của Redis, một cơ sở dữ liệu lưu trong bộ nhớ (in-memory) có hỗ trợ tự động hết hạn dữ liệu (TTL), thay vì dùng một bảng quan hệ trong PostgreSQL vốn được tối ưu cho việc lưu trữ bền vững lâu dài, không phải cho việc tra cứu tạm thời tốc độ cao.

## Bảng tổng hợp — Cơ chế Idempotency-Key

| Thành phần | Vai trò |
|---|---|
| Khóa định danh (UUID) | Client tự sinh, đại diện cho một "ý định hành động" cụ thể, không phải một lần gửi HTTP |
| Nơi lưu trữ | Redis — chọn vì cần độ trễ tra cứu thấp và dữ liệu chỉ cần tồn tại tạm thời |
| Thời gian sống (TTL) | 24 giờ |
| Hành vi khi khóa đã tồn tại | Trả về nguyên kết quả của lần gọi đầu tiên, kèm mã 409 |
| Ý nghĩa của mã 409 trong trường hợp này | Không phải lỗi — là xác nhận "yêu cầu đã hoàn tất từ trước, đây là lần lặp lại" |

---

# PHẦN III — XÂY DỰNG LẠI KIẾN TRÚC GIAO TIẾP HỆ THỐNG TỪ SỐ 0 BẰNG LẬP LUẬN

## Mở đầu: đặt lại đúng bài toán cần giải

Bài toán ở đây khác với CLIP hay HNSW — không phải "biểu diễn dữ liệu sao cho đo được độ liên quan" hay "tổ chức dữ liệu sao cho tìm kiếm nhanh", mà là: cho một hệ thống cần thực hiện nhiều loại nghiệp vụ khác nhau (xác thực, tải ảnh, tìm kiếm, đánh giá), với nhiều loại tài nguyên hạ tầng khác nhau (cơ sở dữ liệu, lưu trữ đối tượng, dịch vụ suy luận AI), cần thiết kế một kiến trúc tổng thể sao cho từng phần có thể phát triển, kiểm thử, và vận hành độc lập, mà vẫn phối hợp đúng đắn với nhau. Bốn quyết định dưới đây, nối tiếp nhau, dẫn từ bài toán này tới đúng kiến trúc bốn module mà SISE đang sử dụng.

---

## Quyết định 1 — Vì sao cần tách Frontend khỏi Backend

**Vấn đề:** cách đơn giản nhất để xây một ứng dụng web là gộp chung giao diện người dùng và logic xử lý nghiệp vụ trong cùng một khối duy nhất — ví dụ một ứng dụng server-side rendering truyền thống, nơi mỗi lần người dùng thao tác, server tính toán lại toàn bộ trang HTML rồi gửi về. Cách này đơn giản để bắt đầu, nhưng tạo ra sự ràng buộc chặt (tight coupling) giữa hai mối quan tâm hoàn toàn khác nhau: cách trình bày dữ liệu cho người dùng nhìn thấy, và logic xử lý dữ liệu thực sự.

**Hệ quả của sự ràng buộc chặt này:** muốn thay đổi giao diện (ví dụ chuyển từ giao diện web sang thêm một ứng dụng di động), phải viết lại gần như toàn bộ, vì logic hiển thị và logic nghiệp vụ đan xen nhau. Muốn kiểm thử logic nghiệp vụ một cách độc lập cũng khó khăn, vì nó luôn gắn liền với việc phải dựng ra một giao diện để kích hoạt.

**Lời giải:** tách hoàn toàn hai mối quan tâm này thành hai thành phần độc lập, giao tiếp với nhau chỉ qua một API theo chuẩn REST đã thỏa thuận trước — đúng theo ràng buộc Client-Server đã nêu ở Phần I. Frontend chỉ chịu trách nhiệm hiển thị và thu thập tương tác người dùng, Backend chỉ chịu trách nhiệm xử lý nghiệp vụ và trả về dữ liệu thuần túy (thường là JSON), không quan tâm dữ liệu đó sẽ được hiển thị ra sao.

**Ưu điểm:** hai thành phần có thể phát triển song song bởi các nhóm khác nhau, kiểm thử độc lập (Backend có thể kiểm thử bằng cách gọi trực tiếp API mà không cần giao diện), và trong tương lai có thể thêm một loại client khác (ứng dụng di động, hoặc một hệ thống khác gọi tới) mà không cần sửa gì ở Backend, miễn tuân thủ đúng API đã có.

**Nhược điểm cần chấp nhận:** thêm một lớp giao tiếp qua mạng (network round-trip) cho mỗi tương tác cần dữ liệu mới, thay vì xử lý mọi thứ trong cùng một tiến trình — đây là chi phí đánh đổi hợp lý cho lợi ích về tính độc lập và khả năng mở rộng đã nêu.

---

## Quyết định 2 — Vì sao Backend cần Dependency Injection thay vì tự khởi tạo phụ thuộc

**Vấn đề:** sau Quyết định 1, Backend giờ chịu trách nhiệm điều phối nhiều thành phần hạ tầng khác nhau — kết nối cơ sở dữ liệu, kết nối tới hệ thống lưu trữ đối tượng, gọi tới dịch vụ suy luận AI. Nếu để mỗi thành phần logic nghiệp vụ (ví dụ đoạn code xử lý luồng đăng nhập) tự khởi tạo các kết nối này ngay bên trong chính nó, logic nghiệp vụ sẽ bị ràng buộc chặt với chi tiết triển khai hạ tầng cụ thể — ví dụ biết chính xác cách kết nối tới PostgreSQL, biết chính xác địa chỉ của MinIO.

**Hệ quả của sự ràng buộc này:** muốn kiểm thử logic đăng nhập một cách độc lập, bắt buộc phải có một cơ sở dữ liệu PostgreSQL thật đang chạy — vì logic đăng nhập đã tự tạo kết nối thật ngay bên trong nó. Không thể "giả lập" (mock) phần hạ tầng để kiểm thử riêng phần logic.

**Lời giải:** đảo ngược trách nhiệm khởi tạo — thành phần logic nghiệp vụ không tự tạo ra thứ nó cần, mà chỉ khai báo nó cần một thứ tuân theo một giao diện (interface) nhất định, việc tạo ra thứ cụ thể đó được thực hiện ở một nơi khác (gọi là composition root) rồi "tiêm" (inject) vào từ bên ngoài, qua tham số hàm. Framework FastAPI mà Backend sử dụng cung cấp sẵn cơ chế này qua `Depends()`.

**Ưu điểm:** logic nghiệp vụ có thể được kiểm thử bằng cách tiêm vào một phiên bản giả lập (mock) của phần hạ tầng, chạy trong mili giây, không cần bất kỳ cơ sở dữ liệu hay dịch vụ thật nào đang chạy. Đồng thời, việc thay đổi chi tiết triển khai hạ tầng (ví dụ đổi cách kết nối cơ sở dữ liệu) chỉ cần sửa ở đúng một nơi — nơi khởi tạo — không cần sửa rải rác trong từng đoạn logic nghiệp vụ.

**Đánh đổi cần chấp nhận:** thêm một tầng gián tiếp (indirection) trong cách tổ chức mã nguồn — người đọc code lần đầu cần hiểu thêm khái niệm "cái gì được tiêm từ đâu" thay vì thấy ngay logic khởi tạo nằm ngay tại chỗ dùng nó. Đây là chi phí học tập ban đầu, đánh đổi lấy khả năng kiểm thử và bảo trì tốt hơn về lâu dài.

---

## Quyết định 3 — Vì sao cần tách xử lý đồng bộ khỏi bất đồng bộ

**Vấn đề:** một số nghiệp vụ của hệ thống, như việc trích xuất vector đặc trưng cho một ảnh vừa tải lên, tốn thời gian xử lý đáng kể — có thể từ vài trăm mili giây tới vài giây, tùy tải hệ thống tại thời điểm đó. Nếu để toàn bộ quy trình tải ảnh chạy hoàn toàn đồng bộ — nghĩa là người dùng phải chờ cho tới khi cả bước trích xuất vector đặc trưng cũng hoàn tất mới nhận được phản hồi — trải nghiệm người dùng sẽ bị ảnh hưởng đáng kể bởi một bước xử lý mà bản thân người dùng không cần biết kết quả ngay lập tức.

**Lời giải:** phân loại rõ nghiệp vụ nào cần phản hồi ngay lập tức (đồng bộ) và nghiệp vụ nào có thể chạy ngầm phía sau (bất đồng bộ). Với luồng tải ảnh, bước ghi nhận metadata và xác nhận đã tải file cần phản hồi ngay — nhưng bước trích xuất vector đặc trưng, không cần thiết phải hoàn tất trước khi trả lời cho người dùng, được tách ra thành một tác vụ chạy nền (background task), đưa vào một hàng đợi xử lý (qua Celery) để một tiến trình riêng biệt xử lý sau, không chặn phản hồi chính.

**Ưu điểm:** người dùng nhận phản hồi nhanh cho phần việc thực sự cần biết ngay (ảnh đã được ghi nhận thành công), trong khi phần việc tốn thời gian được xử lý ở một nơi khác, không ảnh hưởng tới trải nghiệm tương tác trực tiếp.

**Đánh đổi cần chấp nhận, và đây chính là nguồn gốc của một hệ quả quan trọng:** vì phản hồi được trả về trước khi toàn bộ quy trình hoàn tất, hệ thống buộc phải có một trạng thái trung gian (như `index_status = pending`) để biểu diễn "đã ghi nhận, nhưng chưa xử lý xong phần còn lại" — và cần có cơ chế xử lý cho trường hợp phần xử lý ngầm đó thất bại giữa chừng. Cơ chế cụ thể cho vấn đề này được trình bày chi tiết ở Phần IV.

---

## Quyết định 4 — Vì sao cần container hóa từng module độc lập

**Vấn đề:** sau ba quyết định trên, hệ thống đã có Frontend, Backend, và một dịch vụ suy luận AI cần được gọi tới. Câu hỏi kế tiếp: nên đóng gói và triển khai các thành phần này như thế nào? Cách đơn giản nhất là cài đặt tất cả trực tiếp lên cùng một máy chủ, chạy như các tiến trình riêng biệt trên cùng một hệ điều hành.

**Vấn đề của cách làm đơn giản này:** các thành phần sẽ chia sẻ chung môi trường hệ điều hành, dẫn tới nguy cơ xung đột phiên bản thư viện (ví dụ AIModule cần một phiên bản Python cụ thể để tương thích với thư viện học sâu, trong khi Backend có thể cần một phiên bản khác), khó tái tạo chính xác môi trường trên một máy khác (vì phụ thuộc vào những gì đã cài đặt thủ công trên máy đó), và không có ranh giới rõ ràng để mỗi thành phần được phát triển, kiểm thử, và triển khai độc lập với các thành phần còn lại.

**Lời giải:** đóng gói mỗi module (AIModule, StorageModule, BackendModule, FrontendModule) thành một container riêng biệt — mỗi container tự chứa đầy đủ môi trường chạy cần thiết (đúng phiên bản ngôn ngữ, đúng các thư viện phụ thuộc), độc lập hoàn toàn với môi trường của các container khác, dù chúng cùng chạy trên một máy chủ vật lý. Các container giao tiếp với nhau qua mạng nội bộ, đúng theo giao thức REST đã thiết kế ở Quyết định 1.

**Ưu điểm:** mỗi module có thể được xây dựng, kiểm thử, và triển khai độc lập — một module có thể được cập nhật lên phiên bản mới mà không ảnh hưởng tới môi trường chạy của các module khác. Môi trường chạy được đóng gói sẵn trong chính container, đảm bảo tái tạo được chính xác trên bất kỳ máy nào có công cụ điều phối container, không phụ thuộc vào việc cài đặt thủ công.

**Đánh đổi cần chấp nhận:** thêm một lớp trừu tượng hóa (container hóa) so với việc chạy trực tiếp trên hệ điều hành, đòi hỏi hiểu thêm về cách các container giao tiếp với nhau qua mạng nội bộ — bao gồm cả những vấn đề thực tế phát sinh từ đó, được trình bày ở Phần IV.

---

## Tổng hợp: ráp bốn quyết định thành kiến trúc bốn module hoàn chỉnh

Ghép Quyết định 1 (tách Frontend khỏi Backend qua ranh giới REST rõ ràng), Quyết định 2 (Backend dùng Dependency Injection để tách logic nghiệp vụ khỏi chi tiết hạ tầng), Quyết định 3 (tách xử lý đồng bộ khỏi bất đồng bộ cho những nghiệp vụ tốn thời gian), và Quyết định 4 (đóng gói từng module thành container độc lập), ta thu được chính xác kiến trúc bốn module — FrontendModule, BackendModule, AIModule, StorageModule — giao tiếp qua REST, mỗi module tự chứa môi trường chạy riêng, mà hệ thống SISE hiện đang sử dụng. Không có thành phần nào trong kiến trúc này xuất hiện tùy tiện — mỗi ranh giới, mỗi lớp tách biệt, đều là lời giải cho một vấn đề cụ thể phát sinh từ chính bài toán xây dựng một hệ thống nhiều nghiệp vụ, nhiều loại tài nguyên hạ tầng, cần khả năng phát triển và vận hành độc lập từng phần.

---

# PHẦN IV — HỆ QUẢ TẤT YẾU PHÁT SINH TỪ CHÍNH KIẾN TRÚC ĐÃ CHỌN

Phần này chứng minh ba hệ quả không phải do sơ suất khi triển khai, mà là kết quả tất yếu, có thể suy luận trước được, phát sinh trực tiếp từ chính các quyết định kiến trúc đã lập luận ở Phần III.

---

## 1. Stateless kết hợp JWT → hệ quả tất yếu: không thể thu hồi token trước hạn

### Suy luận lại từ gốc

Quay lại Quyết định trong Phần II: ràng buộc Stateless yêu cầu server không được lưu trạng thái riêng cho từng client. JWT hiện thực hóa đúng yêu cầu này bằng cách để token tự chứa toàn bộ thông tin cần thiết, server chỉ cần xác minh chữ ký mà không cần tra cứu bất kỳ nơi lưu trữ nào.

Nhưng chính đặc điểm "không cần tra cứu" này tạo ra một hệ quả logic tất yếu: nếu server không tra cứu bất kỳ đâu để xác minh token, thì server cũng **không có cách nào để "đánh dấu" một token cụ thể là không còn hợp lệ nữa** trước khi nó tự hết hạn theo đúng thời gian đã ghi sẵn trong chính nó. Muốn làm được điều đó, server buộc phải tra cứu một nơi nào đó lưu danh sách token đã bị vô hiệu hóa — nhưng việc tra cứu này chính là một dạng trạng thái phía server, mâu thuẫn trực tiếp với chính nguyên tắc Stateless đã chọn ngay từ Quyết định gốc.

### Đây không phải một lựa chọn tùy ý, mà là hệ quả logic bắt buộc

Nói cách khác, đây không phải "nhóm quên làm cơ chế thu hồi" — mà là: **một khi đã chọn JWT thuần túy để hiện thực Stateless, việc không có khả năng thu hồi trước hạn là hệ quả tất yếu về mặt logic**, không thể vừa giữ đúng 100% tinh thần Stateless vừa có khả năng thu hồi tức thời cùng lúc. Hai điều này về bản chất đối lập nhau.

### Ba hướng giải quyết đã biết trong thực tế, và đánh đổi của từng hướng

| Hướng giải quyết | Cơ chế | Đánh đổi |
|---|---|---|
| Access token ngắn hạn + Refresh token có trạng thái | Access token sống ngắn (ví dụ 15-30 phút), refresh token sống dài hơn nhưng lưu trạng thái ở server | Giữ được phần lớn lợi ích Stateless cho các request thông thường, chỉ cần tra cứu khi làm mới token |
| Blocklist token đã thu hồi | Lưu danh sách token bị thu hồi sớm vào một nơi tra cứu nhanh (như Redis) | Thu hồi được ngay lập tức, nhưng phá vỡ một phần Stateless — mỗi request đều cần thêm một lượt tra cứu |
| Chấp nhận thời hạn ngắn tuyệt đối, không làm gì thêm | Chỉ đặt thời hạn token đủ ngắn để giới hạn rủi ro | Đơn giản nhất, giữ đúng tinh thần Stateless, nhưng "cửa sổ rủi ro" luôn tồn tại bằng đúng thời hạn đó |

### Tình trạng hiện tại và cách nhìn nhận đúng

Hệ thống SISE hiện áp dụng hướng thứ ba — chỉ dựa vào thời hạn hiệu lực của token để giới hạn rủi ro, chưa có blocklist hay refresh token riêng biệt. Đây là một **đánh đổi phạm vi có ý thức**, không phải một lỗ hổng bị bỏ sót: với quy mô một đồ án tốt nghiệp, việc thêm một trong hai cơ chế còn lại làm tăng đáng kể độ phức tạp hệ thống, trong khi giá trị chứng minh khái niệm của đồ án tập trung vào bài toán truy hồi ảnh đa phương thức, không phải vào cơ chế xác thực nâng cao.

---

## 2. Tách đồng bộ/bất đồng bộ → hệ quả tất yếu: cần cơ chế bù trừ cho trạng thái trung gian thất bại

### Suy luận lại từ gốc

Quay lại Quyết định 3 ở Phần III: việc tách xử lý đồng bộ khỏi bất đồng bộ cho luồng tải ảnh tạo ra một khoảng thời gian mà hệ thống tồn tại ở một **trạng thái trung gian** — file đã được ghi nhận, nhưng vector đặc trưng chưa được xử lý xong (`index_status = pending`).

Đây chính là điểm phát sinh một lớp rủi ro mới, hoàn toàn không tồn tại nếu hệ thống xử lý mọi thứ đồng bộ trong một bước duy nhất: **nếu một bước nào đó trong chuỗi xử lý nhiều giai đoạn (multi-step process) thất bại giữa chừng, hệ thống có nguy cơ rơi vào một trạng thái không nhất quán, không hoàn toàn thành công cũng không hoàn toàn thất bại.**

### Chứng minh bằng đúng tình huống thật đã xảy ra trong luồng Tải ảnh

Luồng tải ảnh của SISE gồm ba bước: xin đường dẫn tải lên có chữ ký, client tự tải file lên MinIO, rồi xác nhận để Backend ghi metadata. Xét tình huống: file đã tồn tại thành công trên MinIO (bước hai đã hoàn tất), nhưng việc ghi metadata vào cơ sở dữ liệu ở bước ba thất bại — có thể do mất kết nối cơ sở dữ liệu tạm thời, hoặc một ràng buộc dữ liệu nào đó bị vi phạm.

Nếu không có bất kỳ cơ chế xử lý đặc biệt nào, hệ thống sẽ rơi vào đúng trạng thái không nhất quán vừa nêu: một file tồn tại vật lý trên MinIO, nhưng không có bản ghi metadata nào tương ứng trong cơ sở dữ liệu — dữ liệu này "mồ côi", không thể truy xuất qua bất kỳ luồng nghiệp vụ nào của hệ thống, nhưng vẫn chiếm dung lượng lưu trữ vĩnh viễn.

### Lời giải — cơ chế bù trừ (Compensating Action)

Hệ thống SISE giải quyết đúng tình huống này bằng một cơ chế bù trừ: nếu bước ghi metadata thất bại, hệ thống chủ động thực hiện một hành động đảo ngược — xóa lại chính file vừa tải lên MinIO — để đưa hệ thống quay về đúng trạng thái nhất quán ban đầu (như thể toàn bộ quy trình chưa từng bắt đầu), thay vì để lại một trạng thái lấp lửng giữa thành công và thất bại.

**Đây chính là nguyên lý Saga Pattern đơn giản hóa** — một mẫu hình kiến trúc phổ biến cho các giao dịch trải dài qua nhiều thành phần hạ tầng độc lập (ở đây là MinIO và PostgreSQL, hai hệ thống tách biệt hoàn toàn, không thể dùng chung một giao dịch cơ sở dữ liệu (database transaction) truyền thống để đảm bảo cả hai cùng thành công hoặc cùng thất bại). Vì không có giao dịch chung bao trùm cả hai hệ thống, cách duy nhất để giữ tính nhất quán là chủ động định nghĩa một hành động bù trừ cho mỗi bước có khả năng cần "hoàn tác" nếu bước sau đó thất bại.

### Hạn chế còn tồn tại của cơ chế này, cần thừa nhận rõ ràng

Cơ chế bù trừ hiện tại chỉ xử lý đúng một chiều thất bại (bước ba thất bại, bù trừ cho bước hai). Còn một tình huống khác không có cơ chế xử lý: nếu file đã tải lên MinIO thành công, nhưng client không bao giờ gọi tới bước xác nhận (do đóng ứng dụng giữa chừng, mất kết nối vĩnh viễn, hoặc đơn giản là người dùng đổi ý không hoàn tất) — hệ thống hiện tại không có cơ chế tự động phát hiện và dọn dẹp cho tình huống "mồ côi" này. Đây là hạn chế đã được nhận diện, với hướng phát triển tự nhiên là bổ sung một tác vụ định kỳ quét và dọn dẹp các đối tượng lưu trữ không có bản ghi metadata tương ứng sau một khoảng thời gian hợp lý.

---

## 3. Container hóa nhiều module → hệ quả tất yếu: bài toán hai địa chỉ cho Presigned URL

### Suy luận lại từ gốc

Quay lại Quyết định 4 ở Phần III: mỗi module được đóng gói thành một container riêng, giao tiếp qua một mạng nội bộ do công cụ điều phối container tạo ra. Trong mạng nội bộ này, các container gọi lẫn nhau bằng tên định danh dịch vụ (ví dụ `minio`), không phải bằng địa chỉ mạng cục bộ, vì địa chỉ mạng cục bộ bên trong một container luôn trỏ về chính container đó.

### Chứng minh vấn đề phát sinh — hai "người quan sát" khác nhau cho cùng một địa chỉ

Xét đúng tình huống của luồng Tải ảnh: đường dẫn tải lên có chữ ký (presigned URL) được **sinh ra bởi Backend** — một thành phần chạy bên trong mạng nội bộ container, nơi nó gọi tới MinIO bằng tên định danh dịch vụ nội bộ. Nhưng đường dẫn đó lại được **sử dụng bởi trình duyệt của người dùng** — một thành phần chạy hoàn toàn bên ngoài mạng nội bộ container đó, trên máy tính cá nhân của người dùng.

Đây chính là hệ quả tất yếu của việc container hóa: **cùng một dịch vụ (MinIO) có hai "địa chỉ đúng" khác nhau, tùy vào việc ai đang cố gắng kết nối tới nó** — tên định danh dịch vụ nội bộ chỉ có ý nghĩa và phân giải được bên trong mạng container, còn trình duyệt bên ngoài cần một địa chỉ hoàn toàn khác (như `localhost` với cổng tương ứng, hoặc một tên miền công khai thực sự) để có thể kết nối được.

Nếu không nhận ra sự phân biệt này, presigned URL sẽ được sinh ra với địa chỉ nội bộ — về mặt chữ ký số vẫn hoàn toàn hợp lệ, nhưng khi trình duyệt cố gắng dùng chính địa chỉ đó để tải file lên, nó sẽ thất bại vì không thể phân giải được tên định danh dịch vụ nội bộ đó thành một địa chỉ mạng có ý nghĩa bên ngoài container.

### Lời giải

Hệ thống cấu hình rõ ràng hai địa chỉ tách biệt cho cùng một dịch vụ lưu trữ: một địa chỉ nội bộ dùng khi Backend tự giao tiếp với MinIO (ví dụ để kiểm tra file có tồn tại hay không), và một địa chỉ công khai dùng riêng khi sinh presigned URL để trả về cho trình duyệt. Về mặt triển khai, điều này thể hiện qua việc hệ thống duy trì hai client kết nối MinIO khác nhau — không phải trùng lặp thừa thãi, mà là hai công cụ phục vụ đúng hai đối tượng sử dụng khác nhau của cùng một dịch vụ.

### Ý nghĩa rộng hơn — đây là một lớp bài học chung, không chỉ riêng MinIO

Vấn đề "hai địa chỉ cho cùng một dịch vụ" không phải đặc thù riêng của MinIO hay của SISE — đây là một hệ quả tất yếu của bất kỳ kiến trúc nào kết hợp container hóa với việc có thành phần bên ngoài mạng nội bộ (như trình duyệt người dùng) cần giao tiếp trực tiếp với một dịch vụ bên trong mạng đó. Đây chính xác là loại chi tiết dễ bị bỏ sót nhất khi lần đầu container hóa một hệ thống có bước giao tiếp trực tiếp giữa client bên ngoài và một dịch vụ hạ tầng bên trong — vì trong môi trường phát triển cục bộ ban đầu (trước khi container hóa), thường không hề tồn tại sự khác biệt giữa hai loại địa chỉ này, khiến vấn đề chỉ lộ diện sau khi đã triển khai bằng container.

---

# PHẦN V — WORKFLOW-CENTRIC ARCHITECTURE: SO SÁNH VÀ ĐỊNH VỊ VỚI CÁC KIẾN TRÚC PHỔ BIẾN

## 1. Trình bày lại kiến trúc — năm lớp và nguyên tắc tổ chức theo nghiệp vụ

Kiến trúc mã nguồn của SISE tổ chức mã nguồn theo năm lớp trách nhiệm: `configs` (cấu hình môi trường), `entities` (định nghĩa dữ liệu thuần túy), `adapters` (cầu nối duy nhất tới thế giới bên ngoài — cơ sở dữ liệu, lưu trữ đối tượng, mô hình AI), `services` (logic nghiệp vụ thuần túy), và `routers` (tiếp nhận và điều hướng yêu cầu). Về bản chất phân lớp, đây gần với mô hình Clean Architecture cổ điển.

Điểm khác biệt cốt lõi nằm ở **đơn vị tổ chức chính**: thay vì gom tất cả file cùng một lớp trách nhiệm vào chung một thư mục (ví dụ toàn bộ `services/` của mọi nghiệp vụ nằm chung một chỗ), SISE tổ chức theo **luồng nghiệp vụ cụ thể** trước — mỗi luồng (đăng ký, tải ảnh, tìm kiếm, đánh giá...) sở hữu trọn bộ file riêng của chính nó, xuyên suốt cả năm lớp, chỉ phân biệt nhau qua hậu tố tên file. Tên gọi "Workflow-Centric" phản ánh đúng nguyên tắc tổ chức lấy nghiệp vụ làm trung tâm này.

## 2. So sánh với các kiến trúc phần mềm phổ biến

| Tiêu chí | MVC truyền thống | Clean Architecture / Hexagonal | Microservices | Workflow-Centric (SISE) |
|---|---|---|---|---|
| Đơn vị tổ chức chính | Loại thành phần (Model, View, Controller) | Tầng trách nhiệm (Entity, Use Case, Adapter) | Ranh giới dịch vụ độc lập, triển khai riêng | Luồng nghiệp vụ cụ thể, trong cùng một ứng dụng |
| Mức độ cô lập giữa các nghiệp vụ | Thấp — nghiệp vụ khác nhau thường chia sẻ chung Model/Controller | Trung bình — chia sẻ chung tầng, phân biệt bằng tên file/class | Rất cao — mỗi dịch vụ là một tiến trình, một cơ sở mã độc lập hoàn toàn | Cao — chia sẻ chung một ứng dụng, nhưng không chia sẻ file mã nguồn giữa các nghiệp vụ |
| Chi phí hạ tầng vận hành | Thấp | Thấp | Rất cao — cần điều phối nhiều dịch vụ, mạng, giám sát riêng biệt | Thấp — vẫn là một ứng dụng nguyên khối (monolith) về mặt triển khai |
| Khả năng tái sử dụng mã nguồn chéo | Trung bình | Cao — nhờ trừu tượng hóa qua interface | Thấp giữa các dịch vụ, cao trong nội bộ mỗi dịch vụ | Thấp — chấp nhận đánh đổi có chủ đích |
| Tốc độ định vị mã nguồn liên quan một nghiệp vụ | Trung bình | Trung bình — phải tìm đúng file trong từng tầng | Cao — toàn bộ nghiệp vụ nằm gọn trong một dịch vụ | Cao — toàn bộ nghiệp vụ nằm gọn trong một bộ file cố định |

**Vị trí của Workflow-Centric trong bức tranh này:** đây là một kiến trúc lai, mang lại một phần lợi ích "cô lập theo nghiệp vụ" giống tinh thần Microservices, nhưng vẫn giữ chi phí vận hành thấp của một ứng dụng nguyên khối — không cần điều phối nhiều tiến trình, nhiều mạng, nhiều hệ thống giám sát riêng biệt như Microservices thực sự đòi hỏi. Đổi lại, nó hy sinh phần lớn khả năng tái sử dụng mã nguồn chéo mà Clean Architecture đạt được nhờ trừu tượng hóa qua interface.

## 3. Ưu điểm

**Tốc độ định vị và cô lập lỗi.** Khi một nghiệp vụ cụ thể gặp sự cố, toàn bộ mã nguồn liên quan nằm gọn trong đúng một bộ file có chung tiền tố — không cần tìm kiếm rải rác qua nhiều tầng hay nhiều thư mục được tổ chức theo loại thành phần. Đây là lợi thế rõ rệt nhất so với cả MVC lẫn Clean Architecture chuẩn khi hệ thống có nhiều nghiệp vụ tương đối độc lập với nhau.

**Giảm rủi ro ảnh hưởng chéo giữa các nghiệp vụ.** Vì không chia sẻ file mã nguồn giữa các luồng nghiệp vụ khác nhau, một thay đổi ở nghiệp vụ này về lý thuyết không thể vô tình phá vỡ nghiệp vụ khác thông qua việc chỉnh sửa nhầm một file dùng chung — loại rủi ro rất phổ biến trong các hệ thống MVC lớn, nơi nhiều nghiệp vụ chia sẻ chung Model hoặc Controller.

**Chi phí vận hành thấp hơn Microservices trong khi vẫn giữ được một phần lợi ích cô lập.** Không cần hạ tầng điều phối container phức tạp cho từng nghiệp vụ riêng lẻ, không cần giải quyết bài toán giao tiếp mạng giữa các nghiệp vụ (vì chúng vẫn chạy chung một tiến trình ứng dụng) — phù hợp cho các đội ngũ nhỏ chưa có đủ nguồn lực vận hành hạ tầng phân tán phức tạp.

## 4. Nhược điểm

**Trùng lặp mã nguồn giữa các nghiệp vụ có phần tương tự nhau.** Nếu nhiều luồng nghiệp vụ cùng cần một đoạn logic giống hệt nhau (ví dụ định dạng lại một loại dữ liệu chung), kiến trúc này không khuyến khích trừu tượng hóa sớm thành một module dùng chung — dẫn tới việc đoạn logic đó có thể bị lặp lại ở nhiều nơi, tăng khối lượng mã nguồn tổng thể so với một kiến trúc ưu tiên tái sử dụng.

**Không có ranh giới triển khai độc lập thực sự.** Khác với Microservices, toàn bộ các luồng nghiệp vụ trong Workflow-Centric vẫn đóng gói chung trong một ứng dụng — không thể triển khai lại riêng một nghiệp vụ mà không triển khai lại cả ứng dụng, và một lỗi nghiêm trọng ở tầng hạ tầng dùng chung (như lỗi kết nối cơ sở dữ liệu) vẫn ảnh hưởng đồng thời tới mọi nghiệp vụ.

**Không phù hợp khi đội ngũ phát triển lớn cần làm việc song song trên nhiều tầng trừu tượng chung.** Nếu một đội ngũ lớn cần xây dựng các tầng trừu tượng dùng chung phức tạp (ví dụ một tầng truy cập dữ liệu tổng quát phục vụ hàng chục loại nghiệp vụ khác nhau), kiến trúc ưu tiên nghiệp vụ như thế này sẽ cản trở việc đó nhiều hơn là hỗ trợ.

## 5. Tiềm năng — những loại hệ thống mà kiến trúc này có lợi thế rõ rệt

**Hệ thống nguyên mẫu (MVP) hoặc đồ án có quy mô nghiệp vụ vừa phải, do đội ngũ nhỏ phát triển.** Đây chính là bối cảnh phù hợp nhất — khi số lượng nghiệp vụ không quá lớn (khoảng dưới vài chục luồng), đội ngũ phát triển nhỏ (một tới vài người), và ưu tiên hàng đầu là tốc độ phát triển cùng khả năng tự kiểm soát chất lượng, thay vì tối ưu cho việc mở rộng đội ngũ trong tương lai gần.

**Hệ thống có nhiều nghiệp vụ tương đối độc lập, ít chia sẻ logic chung.** Nếu bản chất bài toán vốn dĩ đã có các nghiệp vụ khá tách biệt về mặt logic (như trường hợp của SISE: xác thực, tải ảnh, tìm kiếm, đánh giá benchmark — mỗi nghiệp vụ có luồng xử lý riêng biệt, ít điểm chung), chi phí "trùng lặp mã nguồn" của kiến trúc này thực tế thấp hơn nhiều so với một hệ thống có nhiều nghiệp vụ chồng lấn logic nặng nề, nơi việc thiếu trừu tượng hóa sẽ gây tổn hại đáng kể.

**Giai đoạn đầu của một hệ thống có khả năng tách thành Microservices sau này.** Vì mỗi nghiệp vụ đã được cô lập rõ ràng thành một bộ file riêng biệt ngay từ đầu, một hệ thống Workflow-Centric có đường tiến hóa tự nhiên hơn để tách dần thành các Microservices thực sự trong tương lai, nếu quy mô đội ngũ hoặc quy mô tải hệ thống tăng lên tới mức cần thiết — so với việc phải tái cấu trúc từ một hệ thống MVC truyền thống, nơi ranh giới giữa các nghiệp vụ chưa từng được phân định rõ ràng.

**Môi trường giáo dục và đào tạo.** Với sinh viên hoặc lập trình viên mới, việc buộc phải hiểu rõ luồng vận hành trọn vẹn của một nghiệp vụ cụ thể — từ định nghĩa dữ liệu, tới kết nối hạ tầng, tới logic xử lý, tới điểm tiếp nhận yêu cầu — trước khi có thể triển khai đầy đủ, tạo ra một kỷ luật rèn luyện tư duy hệ thống rõ ràng hơn so với việc chỉ học cách "đóng gói mọi thứ thành component dùng chung" mà chưa thực sự hiểu bản chất luồng nghiệp vụ đứng sau.




