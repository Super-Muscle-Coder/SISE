# SISE — Smart Image Search Engine

---

## Abstract

**SISE (Smart Image Search Engine)** là một hệ thống tìm kiếm ảnh thông minh dạng prototype, cho phép người dùng truy vấn ảnh theo hai hướng: **ảnh tìm ảnh** (image-to-image) và **văn bản tìm ảnh / ảnh tìm văn bản** (text-to-image, image-to-text). Hệ thống trả về top-k ảnh liên quan nhất, xếp hạng theo độ tương đồng ngữ nghĩa, kèm metadata đầy đủ.

Nền tảng lõi của SISE là mô hình **CLIP** (Contrastive Language-Image Pretraining, dùng nguyên bản pretrained, không fine-tune), có khả năng ánh xạ cả ảnh và văn bản vào **cùng một không gian vector 512 chiều** — đây là điều kiện tiên quyết để hệ thống dùng chung một cơ chế tìm kiếm cho mọi chế độ truy vấn. Vector embedding sau khi sinh được lập chỉ mục và tìm kiếm gần đúng bằng thuật toán **HNSW**, triển khai qua **pgvector** (extension mở rộng PostgreSQL). Ảnh gốc được lưu trên **MinIO** (object storage), truy xuất qua presigned URL. Toàn hệ thống được tổ chức thành 4 thành phần độc lập (giao diện web, backend API, dịch vụ suy luận CLIP, tầng lưu trữ), giao tiếp qua REST, triển khai bằng Docker Compose.

Hệ thống đã xây dựng hoàn chỉnh: kiến trúc 5 lớp hướng nghiệp vụ (entities/adapters/services/routers/configs), 5 nhóm chức năng cốt lõi (xác thực, tải ảnh, tìm kiếm, quản lý dữ liệu cá nhân, đánh giá benchmark), và một bộ thực nghiệm đánh giá đầy đủ trên 2 bộ dữ liệu (Flickr30K và bộ ảnh tự thu thập 20 danh tính), bao gồm cả đánh giá riêng hiệu năng chỉ mục HNSW so với tìm kiếm chính xác.

---

## Phần A — Cơ sở lý thuyết

Phần lý thuyết nền của đồ án trải trên 5 vùng kiến thức chính, mỗi vùng phục vụ đúng một tầng trong pipeline hệ thống:

### A1. Học biểu diễn đa phương thức và học tương phản (Contrastive Learning)
Nền tảng để hiểu vì sao CLIP hoạt động được: nguyên lý ánh xạ ảnh và văn bản vào cùng không gian vector, cơ chế học bằng cách so sánh cặp dương/cặp âm, hàm mất mát InfoNCE, cách CLIP áp dụng nguyên lý này theo 2 chiều đối xứng (ảnh→văn bản và văn bản→ảnh), và đặc tính chuẩn hóa L2 của embedding.

### A2. Tìm kiếm gần đúng và cơ sở dữ liệu vector
Bài toán tìm láng giềng gần nhất, phân biệt brute-force (chính xác nhưng chậm) với ANN (gần đúng nhưng nhanh). Hai độ đo tương đồng (Euclidean/L2 và cosine similarity) và mối quan hệ toán học giữa chúng khi vector đã chuẩn hóa. Nguyên lý hoạt động của thuật toán HNSW (đồ thị phân tầng) và vai trò các tham số cấu hình (M, ef_construction, ef_search). Khái niệm pgvector như một extension mở rộng PostgreSQL.

### A3. Kiến trúc API và tổ chức mã nguồn
Nguyên lý REST (tài nguyên, phương thức HTTP chuẩn, không trạng thái phiên ở server). Cơ chế Dependency Injection và vai trò của nó trong việc tách bạch khai báo phụ thuộc khỏi việc khởi tạo. Mô hình tổ chức mã nguồn theo nghiệp vụ (Workflow-Centric), đối lập với MVC truyền thống theo loại thành phần kỹ thuật.

### A4. Container hóa và hạ tầng triển khai
Khái niệm container hóa so với ảo hóa hệ điều hành. Vai trò Docker/Docker Compose. Cơ chế mạng nội bộ giữa các container (DNS, phân giải tên service). Nguyên tắc tách biến môi trường khỏi image. Khái niệm object storage và cơ chế presigned URL.

### A5. Các chỉ số đánh giá hệ thống truy hồi thông tin
Bốn chỉ số kinh điển — Precision, Recall, HitRate, MRR (Mean Reciprocal Rank) — cùng công thức và ý nghĩa từng chỉ số. Một chỉ số tự thiết kế riêng cho đồ án: Confusion@1 (tỷ lệ nhầm lẫn liên danh tính tại vị trí xếp hạng cao nhất), dùng để tách bạch hai loại sai số khác nhau mà MRR không phân biệt được.

---

## Phần B — Thiết kế và triển khai hệ thống

### B1. Từ ý tưởng đến kiến trúc tổng thể

SISE gồm **4 thành phần độc lập**, mỗi thành phần là 1 service riêng, giao tiếp qua REST:
- **Giao diện web** — điểm tiếp xúc duy nhất với người dùng, gọi mọi thứ qua backend
- **Backend** — API Gateway trung tâm, điều phối toàn bộ nghiệp vụ
- **Dịch vụ suy luận CLIP** — chỉ sinh vector embedding, không làm gì khác
- **Tầng lưu trữ** — quản lý pgvector (vector + metadata quan hệ) và MinIO (ảnh gốc)

Lý do tách 4 thành phần thay vì gộp chung: suy luận CLIP nặng tính toán, cần mở rộng độc lập; tầng lưu trữ cần quản lý/sao lưu riêng không ảnh hưởng logic nghiệp vụ. Đánh đổi: mất đi sự đơn giản khi triển khai (nhiều thành phần cần quản lý), đổi lấy khả năng mở rộng độc lập từng phần.

### B2. Năm nhóm chức năng nghiệp vụ

| Nhóm | Đối tượng | Việc chính |
|---|---|---|
| Xác thực | Người dùng | Đăng ký, đăng nhập, JWT |
| Tải ảnh | Người dùng | Upload theo 3 bước qua presigned URL, gán album/quyền riêng tư |
| Tìm kiếm | Người dùng | Truy vấn ảnh/văn bản, trả top-k xếp hạng |
| Quản lý dữ liệu cá nhân | Người dùng | CRUD ảnh/album của chính mình |
| Đánh giá benchmark | Quản trị viên | Chạy đo 5 chỉ số (Precision, Recall, HitRate, MRR, Confusion@1) trên toàn dữ liệu |

### B3. Cấu hình mô hình CLIP đang dùng

- Kiến trúc: **ViT-B-32-quickgelu**, trọng số **pretrained=openai** (không fine-tune)
- ~151 triệu tham số — biến thể nhỏ nhất dòng CLIP, chọn vì hệ thống chạy suy luận trên **CPU**, không có GPU
- QuickGELU bắt buộc phải khớp đúng checkpoint gốc OpenAI, dùng nhầm GELU chuẩn sẽ làm sai lệch chất lượng embedding mà không báo lỗi runtime
- Số chiều embedding đầu ra: **512**
- Ảnh resize 224×224; văn bản giới hạn tối đa **77 token**, vượt quá bị cắt
- Mô hình chỉ nạp và warm-up **1 lần duy nhất** lúc khởi động dịch vụ (qua lifespan FastAPI), không khởi tạo lại mỗi request

### B4. Cấu hình pgvector/HNSW đang dùng

Lý do chọn pgvector thay vì Milvus/Qdrant riêng biệt: nhóm từng thử Milvus, vận hành thiếu ổn định trên phần cứng hạn chế; pgvector cho phép vector nằm chung DB quan hệ, không cần vận hành thêm hệ quản trị riêng.

| Tham số | Giá trị mặc định pgvector | Giá trị dùng trong SISE |
|---|---|---|
| M | 16 | 16 |
| ef_construction | 64 | **200** (ưu tiên chất lượng chỉ mục) |
| ef_search | 40 | **64** |

Độ đo: cosine similarity, qua toán tử `vector_cosine_ops`.

**Kết quả thực nghiệm xác nhận cấu hình này** (chi tiết ở Phần C): ở quy mô 1000 vector, HNSW đạt Recall@10 tuyệt đối so với tìm kiếm chính xác, chỉ chậm hơn vài mili giây.

### B5. Kiến trúc mã nguồn — Workflow-Centric

Không dùng MVC (gom theo loại thành phần kỹ thuật). Thay vào đó, mỗi **nghiệp vụ** (workflow) sở hữu trọn bộ 4 tệp cùng tiền tố tên, ví dụ nghiệp vụ tìm kiếm có `search_entities.py`, `search_adapters.py`, `search_services.py`, `search_routers.py`.

5 lớp, mỗi lớp 1 trách nhiệm:
- **Configs** — tham số môi trường, đặt độc lập ở thư mục gốc
- **Entities** — cấu trúc dữ liệu thuần túy (Pydantic model), không logic
- **Adapters** — nơi DUY NHẤT được giao tiếp trực tiếp bên ngoài (DB, MinIO, mô hình AI)
- **Services** — logic nghiệp vụ, gọi Adapters khi cần
- **Routers** — endpoint HTTP, chỉ xác thực đầu vào rồi điều hướng xuống Services

**Quy tắc phân quyền quan trọng**: Backend được dùng SQLAlchemy trực tiếp cho hầu hết bảng, **trừ cột vector embedding** — cột này bắt buộc phải ghi/đọc qua endpoint REST chuyên biệt của tầng lưu trữ, không được thao tác DB trực tiếp. Việc *tạo* chỉ mục HNSW (DDL, 1 lần khi setup schema) khác với việc *ghi* vector runtime (DML, luôn qua REST).

**Dependency Injection**: Services không tự khởi tạo Adapters — Adapters được tiêm qua `Depends()` của FastAPI ở tầng Router.

**Idempotency-Key**: mọi request có tác dụng phụ (tạo/sửa) đều hỗ trợ header định danh duy nhất, hiệu lực 24 giờ — gửi lại cùng khóa sẽ nhận đúng kết quả lần xử lý gốc (mã 409, không phải lỗi thật).

### B6. Bốn luồng nghiệp vụ chính 

**Luồng xác thực**: đăng ký không tự cấp token (tách biệt việc tạo tài khoản khỏi xác thực phiên) → client tự gọi đăng nhập. JWT chỉ chứa id, username, thời hạn — **không lưu vai trò** trong token, mọi request cần quyền admin đều truy vấn lại vai trò từ DB tại thời điểm xử lý (tránh quyền bị lỗi thời).

**Luồng tải ảnh** — 3 bước "Direct-to-Storage":
1. Backend sinh presigned URL (`POST /media/upload-url`)
2. **Trình duyệt tự PUT thẳng lên MinIO**, không qua backend
3. Client gọi `POST /media/upload/confirm` — backend ghi metadata (trạng thái `pending`), đẩy task vào hàng đợi nền → dịch vụ suy luận sinh vector → ghi vào pgvector → cập nhật trạng thái `ready` (hoặc `failed` nếu lỗi)

Ràng buộc: 20MB tối đa, chỉ JPEG/PNG — định dạng kiểm tra ở backend (bước 1), dung lượng cưỡng chế qua chữ ký presigned URL (không phải backend tự đọc file).

**Luồng tìm kiếm**: backend gọi tuần tự CLIP (sinh vector) → tầng lưu trữ (tìm kiếm gần đúng + lọc quyền riêng tư/album). Giao diện chỉ thấy 1 endpoint/chế độ, không biết có 2 dịch vụ nội bộ phía sau.

**Luồng đánh giá benchmark**: chỉ admin. Backend lần lượt dùng từng ảnh `ready` làm truy vấn trong chính tập dữ liệu, **loại ảnh truy vấn khỏi kết quả trước khi tính điểm** (điểm sửa lỗi quan trọng — xem Phần C), đối chiếu ground truth để tính 5 chỉ số. Mã trạng thái trả `202` nhưng thực chất chạy **đồng bộ** trong 1 lượt gọi (không phải bất đồng bộ thật), là hạn chế thiết kế đã biết, phù hợp quy mô dữ liệu hiện tại.

### B7. Cấu trúc dữ liệu chính

5 bảng: `users`, `albums`, `images` (duy nhất có cột `embedding vector(512)`), `evaluation_runs`, `evaluation_metrics`. Cột `index_status` trong `images` có 3 trạng thái: `pending` → `ready`/`failed`. Ground truth cho bộ dữ liệu tự thu thập dựa trên field `tags` (chuẩn hóa chữ hoa/thường, khoảng trắng).

### B8. Hạ tầng triển khai 

1 mạng Docker dùng chung, do đúng 1 tệp cấu hình gốc sở hữu — các module khác chỉ tham gia mạng có sẵn, không tự tạo mạng riêng (tránh việc dừng 1 module kéo theo xóa mạng, làm gián đoạn module khác). Biến môi trường nạp lúc khởi động qua tệp riêng, không bake cứng vào image.

---

## Phần C — Thực nghiệm và kết quả (tương ứng Chương 5, 6)

### C.1. Hai bộ dữ liệu — thiết kế song song, hai mục tiêu bổ sung nhau

**Bộ Flickr30K**
- Nguồn: 1000 ảnh lấy mẫu ngẫu nhiên (seed cố định) từ Flickr30K gốc (~31.000 ảnh), mỗi ảnh 5 caption tiếng Anh do người viết
- ⚠️ Mẫu ngẫu nhiên, **không phải** đúng Karpathy test split chuẩn — đối chiếu với số liệu công bố khác chỉ mang tính tham khảo xu hướng
- Ground truth: quan hệ 1-nhiều (1 ảnh – 5 caption), theo đúng quy ước học thuật sẵn có, giữ nguyên không chỉnh sửa
- Mục đích thiết kế: đo CLIP trên **đúng sở trường** — bài toán ngữ nghĩa tổng quát

**Bộ tự thu thập**
- Nguồn: 1000 ảnh, 20 danh tính (mỗi người 50 ảnh), ảnh công khai từ Internet, dùng thuần học thuật
- 20 danh tính chọn có chủ đích thành các nhóm chồng lấn thị giác khác nhau: doanh nhân công nghệ, tuyển thủ eSports cùng đội (đồng phục giống hệt), nhân vật điện ảnh (vest hoài cổ), thời trang hiện đại, thể thao, và 1 nhóm không chủ đích chồng lấn
- Ground truth: quan hệ nhiều-nhiều, dựa trên field `tags` (chuẩn hóa chữ hoa/thường, khoảng trắng thừa), mỗi danh tính 50 ảnh là đáp án đúng cho nhau, ảnh dùng làm truy vấn tự loại khỏi tập đáp án đúng của chính nó
- Lý do chỉ dùng field `tags`: hạn chế hiện trạng hệ thống, chưa có mô tả ảnh dạng tự do hay trường phân loại chủ đề riêng — một đánh đổi có chủ đích, không phải thiếu sót
- Mục đích thiết kế: đo CLIP trên **ngoài sở trường** — phân biệt danh tính chi tiết, đúng bài toán ứng dụng thật của SISE

**Vì sao thiết kế song song 2 bộ**: nếu chỉ dùng 1 bộ, không thể tách bạch "mô hình yếu" khỏi "bài toán khó với mô hình". Đặt cạnh nhau cho phép nhìn thấy ranh giới năng lực thật.

---

### C.2. Thực nghiệm ANN (HNSW) vs Exact Search — 2 kịch bản

**Kịch bản 1 — dữ liệu CLIP thật, quy mô hệ thống (N=1000, 100 truy vấn, seed=42, top_k=10)**

| Cấu hình | Recall@10 vs Exact | P50 (ms) | P95 (ms) | P99 (ms) |
|---|---|---|---|---|
| Exact | 1.000 | 6.56 | 14.41 | 22.54 |
| HNSW ef_search=40 | 1.000 | 7.92 | 15.94 | 26.28 |
| HNSW ef_search=64 (đang dùng) | 1.000 | 7.37 | 15.34 | 21.40 |
| HNSW ef_search=128 | 1.000 | 7.40 | 21.51 | 33.45 |

→ Ở quy mô nhỏ, HNSW **không nhanh hơn** brute-force, chậm hơn vài mili giây ở mọi phân vị — chi phí duyệt đồ thị phân tầng chưa được bù đắp. Recall vẫn tuyệt đối ở cả 3 cấu hình — không đánh đổi độ chính xác.

**Kịch bản 2 — vector tổng hợp ngẫu nhiên, quy mô lớn (10k/50k/100k)**

Vector sinh ngẫu nhiên theo phân phối chuẩn, chuẩn hóa về độ dài đơn vị — không mang ý nghĩa CLIP thật, chỉ dùng để cô lập đặc tính thuật toán khỏi đặc tính ngữ nghĩa dữ liệu. Đã xác minh planner PostgreSQL dùng Index Scan (đi qua chỉ mục HNSW thật) ở mọi mốc đo.

| N vectors | Recall@10 vs Exact | P50 (ms) | P95 (ms) | P99 (ms) |
|---|---|---|---|---|
| 10.000 | 1.000 | 20.05 | 32.74 | 36.58 |
| 50.000 | 1.000 | 123.34 | 142.69 | 181.71 |
| 100.000 | 1.000 | 262.71 | 282.75 | 322.42 |

→ N tăng 10 lần (10k→100k) nhưng latency P50 tăng ~13.1 lần (20.05→262.71) — cao hơn nhiều so với kỳ vọng lý thuyết O(log N) (~1.2 lần cho cùng khoảng quy mô). Đã kiểm chứng kỹ trước khi kết luận: loại trừ khả năng lỗi query planner, loại trừ khả năng plan cache reuse giữa 2 nhánh đo (patch 3 lớp phòng thủ độc lập, kết quả gần như không đổi) — đây là hiện tượng thật, không phải lỗi đo lường.

**Nguyên nhân**: vector **ngẫu nhiên đều**, không có cấu trúc phân cụm ngữ nghĩa như embedding ảnh thật → đồ thị HNSW mất khả năng "định tuyến thông minh" giữa các cụm, buộc phải duyệt nhiều ứng viên hơn ở mỗi tầng khi N tăng.

**Kết luận về bản chất 2 thuật toán:**
- **Brute-force/Exact NN**: chính xác tuyệt đối, không phụ thuộc cấu trúc dữ liệu, nhưng chi phí tăng tuyến tính theo N — chỉ khả thi ở quy mô nhỏ
- **HNSW/ANN**: lợi thế tốc độ chỉ phát huy khi (1) N đủ lớn để vượt chi phí "vào cửa" của đồ thị phân tầng, VÀ (2) dữ liệu có cấu trúc phân cụm tự nhiên để thuật toán "nhảy tắt" hiệu quả — cả 2 điều kiện này **CLIP embedding thật đáp ứng được**, nhưng vector ngẫu nhiên đều thì không
- **Lựa chọn cho SISE**: HNSW vẫn là lựa chọn đúng về kiến trúc — vì dữ liệu thật của hệ thống (embedding CLIP) có cấu trúc cụm tự nhiên, không phải ngẫu nhiên đều như kịch bản 2. Ở quy mô hiện tại (1000 ảnh) chưa thấy lợi thế tốc độ rõ rệt, nhưng Recall tuyệt đối ở mọi cấu hình là điều kiện cần để khai thác lợi thế đó khi dữ liệu ảnh thật mở rộng
- **Bài học phương pháp luận**: một kết quả "kém" trong 1 thực nghiệm cụ thể (HNSW chậm hơn kỳ vọng trên vector ngẫu nhiên) phản ánh việc kịch bản thực nghiệm chạm đúng giới hạn thiết kế của công cụ (HNSW được thiết kế cho dữ liệu có cấu trúc cụm), không phải khiếm khuyết nội tại của bản thân thuật toán

---

### C.3. Kết quả CLIP trên Flickr30K (đúng sở trường)

| Chiều | k | MRR | HitRate | Precision | Recall |
|---|---|---|---|---|---|
| Ảnh → Văn bản | 1 | 0.775 | 0.775 | 0.775 | 0.155 |
| Ảnh → Văn bản | 5 | 0.842 | 0.943 | 0.574 | 0.574 |
| Ảnh → Văn bản | 10 | 0.846 | 0.977 | 0.359 | 0.719 |
| Văn bản → Ảnh | 1 | 0.569 | 0.569 | 0.569 | 0.569 |
| Văn bản → Ảnh | 5 | 0.673 | 0.833 | 0.167 | 0.833 |
| Văn bản → Ảnh | 10 | 0.682 | 0.900 | 0.090 | 0.900 |

**Phân phối vị trí kết quả đúng:**

| Vị trí | Ảnh→Văn bản (số / %) | Văn bản→Ảnh (số / %) |
|---|---|---|
| 1 | 775 / 77.5% | 2845 / 56.9% |
| 2–5 | 168 / 16.8% | 1318 / 26.4% |
| 6–10 | 34 / 3.4% | 337 / 6.7% |
| Sau 10 | 23 / 2.3% | 500 / 10.0% |
| Không tìm thấy | 0 / 0.0% | 0 / 0.0% |

**Đọc đúng các con số dễ hiểu lầm:**
- Tại k=1, MRR = HitRate = Precision — hệ quả tất yếu khi chỉ xét 1 kết quả duy nhất
- Precision thấp ở chiều văn bản→ảnh (0.090 tại k=10) **không phải mô hình yếu** — bị chặn bởi trần lý thuyết của chính cấu trúc ground truth: chỉ 1/1000 ảnh là đáp án đúng cho mỗi câu, nên Precision@10 ≤ 1/10 = 0.1 dù mô hình hoàn hảo tuyệt đối. Giá trị đo được 0.090 nằm sát trần này
- Ở chiều ảnh→văn bản, trần Precision@10 cao hơn hẳn (5/10=0.5, vì mỗi ảnh có 5 đáp án đúng) — giá trị đo 0.359 cũng nằm gần trần
- Đối chiếu với AndresPMD (Recall@1 công bố 36.0%/55.8%): sau khi quy đổi đúng thuật ngữ (Recall@1 của họ tương ứng HitRate@k của ta), kết quả của nhóm (77.5%/56.9%) nằm trong biên độ dao động 36%-80% mà nhiều nghiên cứu khác từng ghi nhận — không mâu thuẫn

---

### C.4. Kết quả CLIP trên bộ tự thu thập (ngoài sở trường)

| Danh tính | MRR | HitRate | Precision | Recall | Confusion@1 |
|---|---|---|---|---|---|
| Jack Ma | 1.000 | 1.000 | 1.000 | 0.204 | 0.0% |
| Thomas Anders | 1.000 | 1.000 | 0.998 | 0.204 | 0.0% |
| Taylor Swift | 1.000 | 1.000 | 0.996 | 0.203 | 0.0% |
| Cindy Kimberly | 1.000 | 1.000 | 0.992 | 0.202 | 0.0% |
| Steve Jobs | 1.000 | 1.000 | 0.992 | 0.202 | 0.0% |
| Khoai Lang Thang | 1.000 | 1.000 | 0.992 | 0.202 | 0.0% |
| Rosé | 1.000 | 1.000 | 0.988 | 0.202 | 0.0% |
| Elon Musk | 1.000 | 1.000 | 0.984 | 0.201 | 0.0% |
| Patrick Bateman | 0.990 | 1.000 | 0.970 | 0.198 | 2.0% |
| Cristiano Ronaldo | 1.000 | 1.000 | 0.962 | 0.196 | 0.0% |
| Lionel Messi | 0.963 | 0.980 | 0.960 | 0.196 | 4.0% |
| Mark Zuckerberg | 1.000 | 1.000 | 0.960 | 0.196 | 0.0% |
| Liu Wan | 0.957 | 0.980 | 0.930 | 0.190 | 6.0% |
| Tommy Shelby | 0.990 | 1.000 | 0.922 | 0.188 | 2.0% |
| Michael Jackson | 0.977 | 1.000 | 0.916 | 0.187 | 4.0% |
| Lisa | 0.974 | 1.000 | 0.878 | 0.179 | 4.0% |
| Group of People | 0.982 | 1.000 | 0.772 | 0.158 | 2.0% |
| **Faker** | **0.890** | 1.000 | 0.644 | 0.131 | **20.0%** |
| **Gumayusi** | **0.860** | 1.000 | 0.548 | 0.112 | **26.0%** |
| **Keria** | **0.768** | 0.980 | 0.522 | 0.107 | **36.0%** |
| **Trung bình toàn cục** | **0.968** | **0.997** | **0.896** | **0.183** | **5.3%** |

(N = 50 truy vấn/danh tính, tổng 1000)

**Ma trận nhầm lẫn chi tiết** (tổng 53 lượt nhầm lẫn):
- Nội bộ 3 tuyển thủ (41/53 lượt = 77.4%): Keria→Gumayusi 12×, Keria→Faker 6×, Gumayusi→Faker 7×, Gumayusi→Keria 6×, Faker→Keria 3×, Faker→Gumayusi 7×
- Rải rác còn lại (12/53 lượt): Lisa→Rosé 1×, Lisa→Liu Wan 1×, Michael Jackson→Tommy Shelby 1×, Michael Jackson→Patrick Bateman 1×, Liu Wan→Lisa 1×, Liu Wan→Cindy Kimberly 1×, Liu Wan→Rosé 1×, Patrick Bateman→Tommy Shelby 1×, Lionel Messi→Cristiano Ronaldo 2×, Tommy Shelby↔Group of People 1× mỗi chiều

**Đọc đúng các con số:**
- **Bất ngờ lớn nhất**: MRR toàn cục = 0.968 — **cao hơn cả Flickr30K** (0.846/0.682), ngược hẳn dự đoán ban đầu. 10/20 danh tính đạt MRR tuyệt đối 1.000
- Recall thấp (0.183) **không phản ánh mô hình yếu** — bị chặn bởi trần lý thuyết 10/49 ≈ 0.204 (mỗi truy vấn có 49 đáp án đúng, chỉ lấy top-10). Kiểm chứng: Recall = Precision × (10/49) đúng cho toàn bộ 20/20 dòng
- **Phát hiện quan trọng nhất**: khó khăn không dàn trải đều, tập trung gần như tuyệt đối vào đúng **3/20 danh tính** (Faker, Gumayusi, Keria) — cùng đội eSports, cùng đồng phục thi đấu, cùng kiểu tóc/kính. Nhóm này chiếm 77.4% tổng lượt nhầm lẫn, MRR riêng chỉ 0.768–0.890
- Các nhóm chồng lấn "nhẹ" khác (cùng phong cách thời trang, cùng vest hoài cổ) hầu như **không** gây nhầm lẫn thật (mỗi cặp chỉ 1-2 lần) — sự tương đồng khái quát không đủ đánh lừa CLIP; chỉ khi đặc trưng phân biệt bị thu hẹp cực đoan (đồng phục đồng nhất tuyệt đối) mô hình mới thật sự sụp đổ
- Group of People (Precision=0.772, thấp thứ 4 toàn bảng) vận hành theo cơ chế khác: đây là tập hợp nhiều cảnh chụp không có mẫu số thị giác chung, nên khó xếp đúng không phải vì nhầm sang danh tính khác mà vì chính nhóm thiếu tính đồng nhất nội tại

---

### C.5. Lý giải tổng hợp — ranh giới năng lực CLIP

Ranh giới năng lực của CLIP **không nằm ở việc "có phân biệt được danh tính hay không"** nói chung, mà nằm ở **mức độ đặc trưng riêng biệt còn sót lại** sau khi loại bỏ các đặc trưng chung giữa các đối tượng cần phân biệt. CLIP pretrained ưu tiên nắm bắt bối cảnh/trang phục/bố cục tổng thể (đúng cách nó được huấn luyện: khớp ảnh-caption khái quát từ web), không được tối ưu cho chi tiết khuôn mặt — nhưng trong thực tế vận hành, tình huống "đặc trưng phân biệt bị xóa sạch" (như đồng phục giống hệt) hẹp hơn nhiều so với lo ngại ban đầu.

**Ý nghĩa thực tiễn cho SISE**: khả năng phân biệt danh tính trong vận hành thực tế nhiều khả năng ổn định với phần lớn trường hợp, chỉ thực sự gặp khó trong tình huống đặc thù (nhiều cá nhân xuất hiện trong trang phục/bối cảnh gần như đồng nhất tuyệt đối) — hẹp hơn nhiều so với lo ngại "CLIP nhầm lẫn diện rộng giữa các danh tính có phong cách tương đồng".

**Bài học phương pháp luận xuyên suốt cả 2 thực nghiệm (CLIP và HNSW)**: hiệu năng của một công cụ học máy hay cấu trúc dữ liệu luôn gắn với giả định thiết kế ban đầu của nó. Mọi giá trị bất thường (MRR=0.5 đồng loạt trước khi vá lỗi đo — xem C.6; latency tăng phi-logarit của HNSW trên vector ngẫu nhiên) đều được đối chiếu với trần lý thuyết hoặc giả định thiết kế trước khi kết luận về năng lực — không vội quy kết "kém" khi chưa loại trừ nguyên nhân đo lường hoặc điều kiện thực nghiệm không khớp giả định thiết kế của công cụ.

---

### C.6. Ghi chú quan trọng — lỗi đo lường đã phát hiện và vá

Trong giai đoạn rà soát cuối, nhóm phát hiện và vá 2 lỗi ở tầng thực thi (không phải lỗi công thức lý thuyết) khi tính chỉ số trên bộ dữ liệu tự thu thập:

1. **Ảnh truy vấn không bị loại khỏi danh sách xếp hạng** trước khi tính điểm (dù đã đúng loại khỏi ground truth) → ảnh tự khớp tuyệt đối với chính nó luôn chiếm vị trí 1 nhưng luôn bị tính sai → MRR bị chặn trần ở 0.5, Precision@10 bị chặn trần ở 0.9, bất kể mô hình tốt đến đâu (số liệu trước vá: MRR≈0.49, Precision≈0.81)
2. **Tập đáp án đúng xây trong phạm vi top-k** thay vì toàn bộ dữ liệu → mẫu số Recall luôn bằng đúng tử số → Recall trùng khít HitRate (số liệu trước vá: Recall≈0.996, sai)

Cả 2 đã được vá (loại ảnh truy vấn khỏi ranking trước khi tính, xây lại ground truth trên toàn bộ dữ liệu), chạy lại toàn bộ benchmark. **Toàn bộ số liệu ở C.3, C.4 là số liệu sau khi vá.** Confusion@1 không hề bị ảnh hưởng bởi 2 lỗi này (dùng công thức độc lập), giữ nguyên 5.3% trước và sau vá — là căn cứ quan trọng giúp phát hiện MRR=0.5 đồng loạt là dấu hiệu bất thường (không giải thích được nếu chỉ dựa vào năng lực mô hình).

---

### C.7. Latency và tài nguyên

| Bộ dữ liệu | P50 (ms) | P95 (ms) | P99 (ms) | Mean (ms) | Std (ms) |
|---|---|---|---|---|---|
| Flickr30K, embed ảnh | 217.5 | 690.5 | 937.6 | 273.2 | 164.6 |
| Flickr30K, embed văn bản | 199.5 | 804.5 | 973.3 | 298.8 | 219.1 |
| Bộ tự thu thập, embed ảnh | 247.1 | 318.2 | 368.0 | 257.0 | 35.6 |

- Tính cosine similarity (sau khi có embedding): chỉ ~90-110ms — nhanh hơn hẳn embedding vì chỉ là phép nhân vector, không qua mạng nơ-ron
- CPU đỉnh khi benchmark: ~296.5% (Flickr30K, ~3/12 nhân) / ~182.1% (bộ tự thu thập, ~1.8/12 nhân) — còn nhiều dư địa tài nguyên, không quá tải
- Bộ tự thu thập ổn định hơn Flickr30K ở đuôi phân phối (P95/P99 thấp hơn hẳn dù P50 cao hơn ~30ms) — hiện tượng chưa xác định chắc nguyên nhân, ghi nhận là quan sát chứ không phải kết luận chắc chắn

---
