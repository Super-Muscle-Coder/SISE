# PHỤ LỤC A. ĐẶC TẢ RÀNG BUỘC DỮ LIỆU HỆ THỐNG SISE

Phụ lục này trình bày đặc tả dữ liệu của hệ thống SISE, được nhóm xây dựng và duy trì xuyên suốt quá trình phát triển như một hợp đồng dữ liệu thống nhất giữa các thành phần. Nội dung dưới đây chỉ trình bày các bảng và cấu hình liên quan trực tiếp đến bốn chức năng cốt lõi đã trình bày trong thân khóa luận, gồm xác thực người dùng, tải ảnh, tìm kiếm và đánh giá benchmark CLIP. Toàn bộ nội dung đã được đối chiếu và xác nhận khớp hoàn toàn với hợp đồng ràng buộc dữ liệu gốc (`data_schema.yaml`, phiên bản 1.2.3).

## A.1. Cấu hình toàn cục

Các giá trị cấu hình dưới đây là nguồn duy nhất được toàn hệ thống tham chiếu, không thành phần nào được phép tự định nghĩa lại các giá trị này ở nơi khác.

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| Số chiều vector embedding | 512 | Tương ứng mô hình CLIP ViT-B/32; thay đổi giá trị này đòi hỏi xây dựng lại cột và chỉ mục vector |
| Kích thước file tối đa | 20 MB | Áp dụng cho ảnh tải lên |
| Định dạng ảnh cho phép | image/jpeg, image/png | |
| Thời hạn presigned URL | 3600 giây (1 giờ) | |
| Số lần thử lại tối đa | 3 lần | Backoff theo cấp số nhân: 1s, 2s, 4s |
| Thời hạn hiệu lực Idempotency-Key | 24 giờ | |

## A.2. Cấu trúc các bảng dữ liệu chính

### Bảng `users`
Lưu thông tin tài khoản người dùng, phục vụ nghiệp vụ đăng ký, đăng nhập và phân quyền.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | SERIAL PRIMARY KEY | |
| username | VARCHAR(50) UNIQUE NOT NULL | |
| email | VARCHAR(100) UNIQUE NOT NULL | |
| password_hash | TEXT NOT NULL | |
| created_at | TIMESTAMP WITH TIME ZONE | Mặc định thời điểm tạo |
| role | VARCHAR(20) | Mặc định user, ràng buộc chỉ nhận user hoặc admin |

---

### Bảng `albums`
Lưu thông tin album ảnh do người dùng tạo.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | SERIAL PRIMARY KEY | |
| user_id | INTEGER REFERENCES users(id) | Xóa theo tầng khi tài khoản bị xóa |
| title | VARCHAR(100) NOT NULL | |
| description | TEXT | |
| is_public | BOOLEAN | Mặc định false |
| created_at | TIMESTAMP WITH TIME ZONE | |
| deleted_at | TIMESTAMP WITH TIME ZONE, NULL | Cơ chế xóa mềm |

---

### Bảng `images`
Lưu metadata của từng ảnh trong hệ thống, bao gồm cả cột vector embedding.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | UUID PRIMARY KEY | |
| user_id | INTEGER NOT NULL REFERENCES users(id) | |
| album_id | INTEGER REFERENCES albums(id) | |
| minio_object_name | TEXT UNIQUE NOT NULL | Khóa đối tượng lưu trong MinIO |
| minio_bucket | TEXT NOT NULL | Tên bucket lưu trữ |
| privacy_level | SMALLINT | 0 = riêng tư, 1 = bạn bè, 2 = công khai; mặc định 2 |
| tags | JSONB | Mảng nhãn gắn cho ảnh |
| index_status | VARCHAR(20) | pending, ready, hoặc failed; mặc định pending |
| embedding | vector(512) | Cột vector pgvector, cho phép null cho đến khi lập chỉ mục xong |
| created_at | TIMESTAMP WITH TIME ZONE | |
| updated_at | TIMESTAMP WITH TIME ZONE | |
| deleted_at | TIMESTAMP WITH TIME ZONE, NULL | Cơ chế xóa mềm |

Bảng `images` được đánh chỉ mục trên các cột `user_id`, `privacy_level`, `created_at`, `index_status`, chỉ mục GIN trên cột `tags` phục vụ truy vấn theo nhãn, và chỉ mục HNSW trên cột `embedding` phục vụ tìm kiếm gần đúng, với cú pháp:

```sql
CREATE INDEX IF NOT EXISTS idx_images_embedding_hnsw 
ON images USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 200);
```

---

### Bảng `evaluation_runs`
Lưu lịch sử các lần chạy đánh giá benchmark chất lượng truy vấn.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| eval_id | UUID PRIMARY KEY | |
| status | VARCHAR(20) NOT NULL | pending, running, completed, hoặc failed |
| query_count | INTEGER | Mặc định 0 |
| limit_images | INTEGER | |
| seed | INTEGER | |
| created_by | INTEGER REFERENCES users(id) | |
| started_at | TIMESTAMP WITH TIME ZONE | |
| completed_at | TIMESTAMP WITH TIME ZONE, NULL | |

---

### Bảng `evaluation_metrics`
Lưu kết quả bốn chỉ số đã tính cho mỗi lần chạy đánh giá.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| eval_id | UUID PRIMARY KEY REFERENCES evaluation_runs(eval_id) | Xóa theo tầng |
| mrr | REAL NOT NULL | |
| hit_rate | REAL NOT NULL | |
| precision | REAL NOT NULL | Tên cột trùng từ khóa SQL, cần đặt trong dấu ngoặc kép khi định nghĩa bảng |
| recall | REAL NOT NULL | |
| computed_at | TIMESTAMP WITH TIME ZONE | |

---

## A.3. Cấu hình chỉ mục vector

| Thông số | Giá trị |
|---|---|
| Loại chỉ mục | HNSW |
| Tham số M | 16 |
| Tham số ef_construction | 200 |
| Tham số ef_search | 64 |
| Độ đo tương đồng | Cosine |
| Toán tử pgvector | vector_cosine_ops |

---

## A.4. Cấu hình lưu trữ đối tượng (MinIO)

| Thông số | Giá trị |
|---|---|
| Bucket ảnh gốc | raw-images |
| Bucket ảnh thu nhỏ | thumbnails |
| Chính sách truy cập | Riêng tư, chỉ truy cập qua presigned URL |
| Quy ước đặt tên đối tượng | {user_id}/{album_id}/{image_id}.jpg |
| Thời hạn presigned URL | 3600 giây |

---

## A.5. Quy trình xử lý dữ liệu khi tải ảnh

Việc ghi nhận một ảnh mới vào hệ thống được thực hiện qua bốn bước tuần tự.

1. Backend tạo một presigned URL cùng khóa đối tượng từ MinIO và trả về cho client.
2. Client dùng chính presigned URL đó để tải file ảnh trực tiếp lên MinIO, không đi qua backend.
3. Sau khi tải thành công, client gọi lại backend để xác nhận, backend ghi nhận metadata vào bảng `images` với trạng thái lập chỉ mục là `pending`.
4. Cuối cùng, một tác vụ nền được kích hoạt để lấy ảnh từ MinIO, gửi sang dịch vụ suy luận CLIP để sinh vector embedding, ghi vector vào cột `embedding`, rồi cập nhật trạng thái lập chỉ mục thành `ready`.

Toàn bộ các bước có khả năng thay đổi dữ liệu đều được gắn khóa định danh duy nhất, đảm bảo nếu client gửi lại cùng một request do sự cố mạng, hệ thống trả về đúng kết quả của lần xử lý gốc thay vì xử lý lại từ đầu.