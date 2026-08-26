# CONTEXT KHÔI PHỤC — DỰNG POWERPOINT CHÍNH ĐỀ TÀI SISE

*Đây là bản tổng hợp đầy đủ để bạn (AI PowerPoint) nắm lại toàn bộ ngữ cảnh sau khi phiên làm việc trước bị mất. Đọc kỹ toàn bộ trước khi bắt đầu dựng bất kỳ slide nào.*

---

## BỐI CẢNH DỰ ÁN

Đây là PowerPoint CHÍNH (không phải slide phụ) dùng để trình bày trước Hội đồng bảo vệ đồ án tốt nghiệp, đề tài "Ứng dụng AI xây dựng hệ thống tìm kiếm ảnh thông minh trên nền tảng Web" (hệ thống tên SISE). Trong 3 thành viên Hội đồng, chỉ 1 người đã từng xem qua đồ án, 2 người còn lại mới đọc báo cáo hoặc chưa biết gì — vì vậy slide chính phải **tự thân đứng vững, đủ chi tiết để người chưa biết gì cũng hiểu được toàn cảnh**, không chỉ là "món khai vị" tối giản như bản nháp đầu tiên.

Ngoài PowerPoint chính này, còn có một bộ PowerPoint phụ riêng biệt (không thuộc phạm vi công việc này), chứa nội dung chuyên sâu về CLIP, HNSW, thực nghiệm, kiến trúc — chỉ mở khi Hội đồng hỏi sâu. Vì vậy PowerPoint chính **không cần** đưa công thức toán học hay chứng minh chi tiết.

---

## CẤU TRÚC TỔNG THỂ — 11 MỤC LỚN, 30 SLIDE

| Mục | Header (dùng xuyên suốt mọi slide con) | Số slide con |
|---|---|---|
| — | Trang bìa (không header) | 1 |
| 2 | Giới thiệu đề tài | 2 |
| 3 | Mục tiêu và phạm vi đề tài | 2 |
| 4 | Phân tích bài toán | 5 |
| 5 | Kiến trúc tổng thể | 2 |
| 6 | Công nghệ lõi | 2 |
| 7 | Nghiệp vụ thành phần | 3 |
| 8 | Pipeline thực nghiệm | 4 |
| 9 | Demo hệ thống | 1 |
| 10 | Kết quả thực nghiệm | 4 (đã tách từ 2 slide gốc thành 4, xem mục "Quyết định đã chốt") |
| 11 | Tổng kết | 2 |

**Tổng cộng: 30 slide.**

**Nguyên tắc header quan trọng nhất:** mỗi Mục lớn chỉ có **1 tên header duy nhất**, giữ nguyên văn xuyên suốt mọi slide con của nó. Ví dụ Mục 4 có 5 slide, cả 5 đều mang header "Phân tích bài toán" — không đánh số phụ vào header, không đổi tên.

---

## MẠCH LOGIC "HỨA — TRẢ" — XƯƠNG SỐNG CỦA TOÀN BÀI, TUYỆT ĐỐI KHÔNG PHÁ VỠ

Đây là nguyên tắc thiết kế quan trọng nhất: các Mục ở trước đặt câu hỏi/nêu vấn đề, các Mục ở sau phải quay lại trả lời đúng câu hỏi đó — không có mục nào "hứa" mà không được "trả", và không có mục nào "trả lời" một thứ chưa từng được "hứa" ở trước.

**5 cặp đối chiếu chéo bắt buộc phải khớp:**

1. **Mục 4 (Phân tích bài toán) → Mục 5+6 (Kiến trúc + Công nghệ):** Mục 4 chỉ đặt câu hỏi trừu tượng ("cần ánh xạ ảnh/văn bản vào không gian chung", "cần 4 nhóm trách nhiệm nào đó", "cần lưu 2 loại dữ liệu nào đó"), **tuyệt đối không được nhắc tên công nghệ cụ thể**. Mục 5 và 6 mới là nơi trả lời bằng tên module/công nghệ cụ thể (CLIP, HNSW, PostgreSQL, pgvector, MinIO, Docker, FrontendModule, BackendModule, AIModule, StorageModule).

2. **Mục 4.4 (người dùng cần làm gì) → Mục 7 (Nghiệp vụ thành phần):** Mục 4.4 chỉ liệt kê nhu cầu người dùng ở mức khái quát, Mục 7 mới mô tả nghiệp vụ cụ thể.

3. **Mục 4.5 (làm sao biết đúng/sai) → Mục 8 (Pipeline thực nghiệm):** Mục 4.5 chỉ đặt vấn đề cần có chỉ số + bộ dữ liệu, Mục 8 mới trả lời đầy đủ (2 bộ dữ liệu, 5 chỉ số, trần lý thuyết, quy trình, và **bảng kỳ vọng đặt ra trước khi đo**).

4. **Mục 8 (kỳ vọng) → Mục 10 (Kết quả):** Bảng kỳ vọng ở Slide 8.4 phải được đối chiếu lại chính xác ở slide đối chiếu trong Mục 10 — đây là điểm quan trọng nhất về mặt học thuật, thể hiện phương pháp luận "đặt giả thuyết trước khi đo".

5. **Mục 3.1/3.2 (Mục tiêu, phạm vi) → Mục 11 (Tổng kết):** câu chữ ở slide đầu Mục 11 phải đối chiếu đúng nguyên văn những gì đã nêu ở Mục 3.

---

## 8 QUY TẮC BẮT BUỘC — KHÔNG THƯƠNG LƯỢNG

1. **Không bịa, không tự diễn giải thêm nội dung học thuật.** Mọi con số là số liệu thật đã đo, giữ nguyên đơn vị và độ chính xác, không làm tròn lại, không suy diễn ý nghĩa ngoài những gì đã ghi trong tài liệu nội dung gốc (sẽ được cung cấp riêng, xem phần dưới).

2. **Header Mục giữ nguyên văn** — đã nêu ở trên.

3. **Ưu tiên tuyệt đối bảng/sơ đồ/biểu đồ, hạn chế tối đa văn xuôi.** Mỗi slide chỉ 1 ý trọng tâm — nếu 1 slide có 2 bảng lớn trở lên, tách thành 2 slide riêng, giữ chung header.

4. **Thuật ngữ kỹ thuật giữ nguyên tiếng Anh:** CLIP, HNSW, MRR, Recall, Precision, HitRate, Confusion@1, MinIO, PostgreSQL, pgvector, Docker, REST, API — không dịch sang tiếng Việt.

5. **Không đưa công thức toán học, không chứng minh chi tiết** — đây là slide khai vị, phần chuyên sâu nằm ở bộ slide phụ riêng.

6. **Mọi mũi tên/sơ đồ luồng phải đúng chiều đã mô tả** — đặc biệt quan trọng ở Slide 5.2 và 7.2 (xem chi tiết bên dưới).

7. **TUYỆT ĐỐI CẤM icon/emoji mang tính biểu tượng đơn giản** — không dấu tick/cross dạng ký hiệu đồ họa, không mặt cười, không icon Unicode kiểu bộ sưu tập biểu tượng có sẵn. Mọi minh họa hình ảnh phải là **sơ đồ/đồ họa được thiết kế riêng** hoặc **ảnh chụp thật**. Trạng thái Đạt/Không đạt dùng CHỮ VIẾT ("Đạt", "Chưa đạt", "Bác bỏ"), không dùng ký hiệu tick/cross đồ họa.
   - **Ngoại lệ đã xác nhận:** ký tự mũi tên "➜" được phép dùng bình thường, không tính là icon bị cấm.

8. **Từ cấm riêng cho Mục 4 (chống rò rỉ công nghệ):** trong 5 slide của Mục 4 (Phân tích bài toán), các từ sau **tuyệt đối không được xuất hiện**: CLIP, HNSW, PostgreSQL, pgvector, MinIO, Docker, FrontendModule, BackendModule, AIModule, StorageModule. Nếu cần nhắc tới các nhóm trách nhiệm, dùng ngôn ngữ trừu tượng: "không gian biểu diễn chung", "suy luận trí tuệ nhân tạo", "tiếp nhận thao tác người dùng", "điều phối nghiệp vụ", "lưu trữ dữ liệu".

---

## CÁC QUYẾT ĐỊNH ĐÃ CHỐT — KHÔNG CẦN HỎI LẠI

| Vấn đề | Quyết định |
|---|---|
| Header ghi tên Mục hay "Phần X"? | Ghi tên Mục đầy đủ ("Phân tích bài toán"), không dùng "Phần 4" |
| Slide bìa có header không? | Không — để trống, tối giản tuyệt đối |
| Câu kết cuối mỗi slide | Tùy biến, không bắt buộc mọi slide phải có. Chỉ đặt câu kết ở slide có sẵn 1 kết luận tự nhiên đáng nhấn mạnh (ví dụ: 2.2, 4.5, 8.3, và slide đối chiếu kỳ vọng/kết quả trong Mục 10). Không cố nhét câu kết vào slide thuần bảng số liệu. |
| Ký tự "➜" | Dùng được bình thường |
| Slide 3.1 hình thức | 3 card (không dùng bảng) |
| Số slide đúng là bao nhiêu | 30 slide (đã tách 2 slide của Mục 10 gốc thành 4 slide con, vì mỗi slide gốc chứa 2 bảng lớn, vi phạm nguyên tắc "1 slide 1 ý") |
| Nhãn ô góc trên-trái của bảng thiếu (ví dụ ở bảng 2 bộ dữ liệu, bảng so sánh HNSW) | Được phép tự thêm nhãn kỹ thuật đơn giản (ví dụ "Tiêu chí", "Phương pháp") — đây không phải nội dung học thuật nên không vi phạm quy tắc "không bịa" |
| Câu văn bản lặp lại giữa slide kỳ vọng (Mục 8) và slide đối chiếu (Mục 10) | Phải khớp nhau tuyệt đối — dùng bản đầy đủ ở Mục 8 làm chuẩn, viết bản rút gọn nhất quán ở Mục 10, không lệch ý dù nhỏ |
| Mũi tên ngoại lệ (Slide 5.2) và ranh giới đồng bộ/bất đồng bộ (Slide 7.2) — chỉ có 2 màu (cam gạch #E36414 và navy #000080) | Dùng màu navy + thêm nét đứt để tăng độ phân biệt so với các mũi tên/đường thông thường |
| Slide 4.1 cần hình tròn (ngoài danh sách hình được phép trong style) | Được phép ngoại lệ — không có hình tròn thì sơ đồ mất ý nghĩa |
| Slide 5.2 cần mũi tên 2 chiều (ngoài danh sách hình được phép) | Được phép ngoại lệ — đây là quy ước đã dùng nhất quán cho các cặp module giao tiếp REST |
| Nội dung ảnh còn thiếu (Họ tên/MSSV ở Slide 1; ảnh Google Photos, Pinterest Lens ở Slide 2.2; ảnh giao diện SISE ở Slide 9.1; ảnh 3 tuyển thủ đồng phục ở Slide 10.3) | Sẽ được cung cấp sau, không phải bây giờ. Chừa khoảng trống thích hợp, viền rõ ràng, đúng vị trí và kích thước chuẩn để chèn ảnh vào sau mà không cần chỉnh lại bố cục. |
| Câu đầy đủ bị cắt ở Slide 8.4 | "Đối chiếu trần lý thuyết trước khi kết luận." |

---

## HAI SLIDE RỦI RO CAO NHẤT — CẦN ĐẶC BIỆT CẨN TRỌNG

### Slide 5.2 — Sơ đồ luồng giao tiếp giữa các module

- Mũi tên 2 chiều: BackendModule ↔ AIModule (nhãn: REST)
- Mũi tên 2 chiều: BackendModule ↔ StorageModule (nhãn: REST)
- Mũi tên 1 chiều: FrontendModule → BackendModule (không vẽ 2 chiều — đây là sơ đồ kiến trúc tổng quan, không phải sequence diagram)
- Mũi tên riêng biệt, tô màu navy + nét đứt, có nhãn "NGOẠI LỆ": FrontendModule → StorageModule, kèm chú thích nhỏ "Chỉ áp dụng cho bước tải file ảnh trực tiếp"

### Slide 7.2 — Ba bước nghiệp vụ Tải ảnh

```
S1: Xin đường dẫn tải lên có chữ ký
        ↓
S2: Tải ảnh trực tiếp lên kho lưu trữ (KHÔNG qua Backend — khớp đúng ngoại lệ ở Slide 5.2)
        ↓
S3: Xác nhận, lưu metadata
   [ĐƯỜNG KẺ NGANG MÀU NAVY, NÉT ĐỨT — NHÃN "RANH GIỚI ĐỒNG BỘ / BẤT ĐỒNG BỘ"]
        ↓
Kích hoạt xử lý nền (lập chỉ mục vector)
```

Đây là điểm kỹ thuật quan trọng nhất của nghiệp vụ Tải ảnh — đường ranh giới phải rõ ràng, không được vẽ mờ nhạt hay bỏ sót.

---

## BẪY DIỄN GIẢI CẦN TRÁNH TUYỆT ĐỐI — SLIDE VỀ HNSW (trong Mục 10)

Khi trình bày bảng so sánh HNSW với tìm kiếm chính xác (Exact), số liệu thật là:

| | Recall@10 | P50 (ms) |
|---|---|---|
| Exact | 1.000 | 6.56 |
| HNSW (đang dùng) | 1.000 | 7.37 |

HNSW chậm hơn Exact ở quy mô này (7.37 > 6.56) — tuyệt đối không được viết bất kỳ câu nào theo kiểu "HNSW nhanh hơn/hiệu quả hơn". Nếu cần thêm chú thích, dùng đúng nguyên văn câu sau, không paraphrase:

> "Ở quy mô hiện tại, HNSW chưa cho thấy lợi thế tốc độ rõ rệt, nhưng Recall vẫn tuyệt đối — không đánh đổi chất lượng kết quả."

---

## BẢNG MÀU VÀ STYLE

- Cam gạch (Brick Orange): #E36414
- Trắng tinh: #FFFFFF
- Header Mục: cam gạch
- Số La Mã/số phụ (nếu có): navy #000080
- Chữ thường: đen thuần #000000
- Font: Times New Roman
- Cỡ chữ: Header > số phụ > chữ thường

---

## VIỆC CẦN LÀM TIẾP THEO

1. Xác nhận đã đọc và hiểu toàn bộ context này.
2. Cần được cung cấp lại tài liệu nội dung chi tiết đầy đủ 30 slide (bảng, sơ đồ, số liệu cụ thể cho từng slide) — đây là tài liệu riêng, chưa có trong context này, cần yêu cầu người dùng gửi lại hoặc paste vào.
3. Đề xuất: dựng trước 3 sơ đồ khó nhất (Slide 5.1, 5.2, 7.2) để duyệt hình trước khi dựng toàn bộ 30 slide.
4. Nếu phát sinh điểm chưa rõ trong lúc dựng, đặc biệt liên quan tới số liệu hoặc nội dung học thuật, phải hỏi lại trước khi tự quyết định — không tự suy diễn thêm.