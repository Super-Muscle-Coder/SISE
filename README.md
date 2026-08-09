# SISE — Smart Image Search Engine

Đồ án tốt nghiệp: hệ thống tìm kiếm ảnh theo nội dung ngữ nghĩa (semantic search), dùng CLIP để mã hóa ảnh và văn bản, tìm kiếm gần đúng (ANN) trên pgvector.

## Yêu cầu môi trường

- **Docker Desktop** (Windows/Mac) hoặc Docker Engine (Linux), đã bật.
- RAM khả dụng cho Docker tối thiểu **8GB** (hệ thống chạy đồng thời CLIP + PostgreSQL + MinIO + Redis).
- Kết nối mạng (để Docker tải các base image công khai trong lúc build).

Không cần cài Python, Node.js hay bất kỳ dependency nào khác trực tiếp trên máy — mọi thứ chạy trong container.

---

## Cách chạy

```bash
docker compose -f modules/StorageModule/infra_compose_storage.yml -f modules/AIModule/docker-compose.yml -f modules/BackendModule/docker-compose.yml -f docker-compose.yml up -d --build
```

**Bắt buộc chạy đúng lệnh này, từ thư mục gốc repo, đúng thứ tự 4 file `-f` như trên.** Đường dẫn cấu hình bên trong các file được thiết kế để hoạt động chính xác theo cách gọi lệnh gộp nhiều file này — không hỗ trợ chạy từng module riêng lẻ trong thư mục con.

Lần chạy đầu tiên sẽ:
1. Build 3 image từ source (`sise-storage`, `sise-ai`, `sise-backend`) — có thể mất 5-10 phút.
2. Tự động chạy bước khởi tạo schema (service `storage-init`) — tạo bảng, bật extension pgvector.
3. Khởi động toàn bộ 6 service còn lại theo đúng thứ tự phụ thuộc.

**Lưu ý về thời gian:** dịch vụ suy luận CLIP (`sise-ai`) cần tải và "làm nóng" mô hình khi khởi động, có thể mất **1.5–3 phút** trước khi đạt trạng thái `healthy` — đây là hành vi bình thường, không phải lỗi.

---

## Kiểm tra hệ thống đã chạy đúng

```bash
docker ps
```

Kỳ vọng đủ 6 container đang chạy, trạng thái `Up` (2 container có healthcheck — `sise-backend`, `sise-ai` — nên ở trạng thái `healthy`). Container `sise-storage-init` và `sise-minio-init` sẽ hiện `Exited (0)` sau khi chạy xong — đây là các job chạy một lần, không phải lỗi.

| Container | Vai trò |
|---|---|
| `sise-backend` | API Gateway, cổng `8000` |
| `sise-ai` | Dịch vụ suy luận CLIP, cổng `8001` |
| `sise-postgres` | Cơ sở dữ liệu + pgvector, cổng `5432` |
| `sise-minio` | Object storage (ảnh gốc), cổng `9000`/`9001` |
| `sise-redis` | Cache, hàng đợi tác vụ nền, cổng `6379` |
| `sise-storage-init` | Khởi tạo schema (chạy 1 lần rồi thoát) |

```bash
curl http://localhost:8000/health/readiness
```

Kỳ vọng: `{"status":"ready", "dependencies": {"postgres":"connected", "minio":"reachable", "ai_service":"warm", "redis":"connected"}}`

Nếu `postgres` báo `unavailable` ngay sau khi chạy lệnh `up` lần đầu, đợi vài giây rồi thử lại — `storage-init` cần chạy xong trước khi Backend kết nối được đầy đủ.

---

## Tạo tài khoản để trải nghiệm hệ thống

Chưa có tài khoản mẫu sẵn (dữ liệu không đi kèm trong image, cần tạo mới sau khi hệ thống khởi động):

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","email":"test1@sise.com","password":"testpass123"}'
```

Cấp quyền quản trị (để dùng được chức năng đánh giá benchmark):

```bash
docker exec sise-postgres psql -U SISE_POSTGRES_ADMIN -d sise -c "UPDATE users SET role = 'admin' WHERE username = 'testuser1';"
```

---

## Truy cập giao diện web

Giao diện Frontend chạy tách biệt khỏi Docker, cần khởi động thủ công:

```bash
cd modules/frontendweb
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ được in ra trong terminal (thường là `http://localhost:5173`), đăng nhập bằng tài khoản vừa tạo ở trên.

---

## Tài liệu tham khảo

- `.context/` — bốn tệp hợp đồng kỹ thuật (`openapi.yaml`, `data_schema.yaml`, `Workflow_Centric_Architecture.md`) và các bản tóm tắt luồng nghiệp vụ từng module.
- `modules/BackendModule/benchmark_external/` — script chạy benchmark CLIP trên tập dữ liệu Flickr30K, độc lập với hạ tầng chính.

---

## Dừng hệ thống

```bash
docker compose -f modules/StorageModule/infra_compose_storage.yml -f modules/AIModule/docker-compose.yml -f modules/BackendModule/docker-compose.yml -f docker-compose.yml stop
```

Dùng `stop` để giữ nguyên dữ liệu, có thể khởi động lại bằng `start`. Chỉ dùng `down` nếu muốn dọn hẳn container (dữ liệu trong volume vẫn được giữ). **Tuyệt đối không thêm cờ `-v` trừ khi thực sự muốn xóa vĩnh viễn toàn bộ dữ liệu đã tạo.**

---

## Khắc phục sự cố thường gặp

**`sise-ai` không lên `healthy` trong lần chạy đầu:** dịch vụ CLIP cần thời gian tải mô hình, có thể mất tới 3 phút trên máy cấu hình thấp. Kiểm tra tiến độ: `docker logs sise-ai`.

**`postgres: "unavailable"` trong `/health/readiness`:** đảm bảo `sise-storage-init` đã chạy xong (`docker ps -a`, tìm dòng `Exited (0)`). Nếu chưa, đợi thêm hoặc kiểm tra log: `docker logs sise-storage-init`.

**Lỗi trùng tên container khi chạy lại:** nếu từng chạy dở dang trước đó, dọn sạch bằng `docker compose -f ... down` (không `-v`) trước khi chạy lại `up`.
