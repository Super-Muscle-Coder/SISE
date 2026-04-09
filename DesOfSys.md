# TÓM TẮT HỆ THỐNG: SMART IMAGE SEARCH ENGINE (SISE)

Hệ thống này (SISE) là nền tảng quản lý và truy vấn hình ảnh thông minh đa phương thức (Multimodal Retrieval), cho phép người dùng lưu trữ ảnh theo Album cá nhân và tìm kiếm linh hoạt qua hai hình thức: **Image-to-Image** và **Text-to-Image**.

## Cốt lõi công nghệ
- **AI Engine:** Ứng dụng mô hình CLIP kết hợp Contrastive Learning để trích xuất Vector Embedding, đồng bộ không gian biểu diễn giữa ngôn ngữ và hình ảnh.  
- **Hạ tầng dữ liệu:** Sử dụng Vector Database (Milvus/Qdrant) cùng thuật toán HNSW (ANN) để tối ưu tốc độ truy vấn.  
- **Kiến trúc hệ thống:** Thiết kế theo mô hình Decoupled Architecture với Backend FastAPI, lưu trữ vật lý bằng MinIO, triển khai qua Docker.  
- **Phân quyền truy cập:** Cơ chế Privacy-Aware Search cho phép lọc kết quả theo cấp độ bảo mật (Public, Private, Friends).  
- **Mục tiêu:** Tối ưu độ chính xác (MRR, HitRate, Precision, Recall) và trải nghiệm người dùng trên Web & Mobile.

---

# NHỮNG THÀNH PHẦN QUAN TRỌNG NHẤT

## 1. Mảng AI & Xử lý dữ liệu (The Brain)
- **Mô hình Embedding:** CLIP (OpenAI) – tối ưu cho cả Text-to-Image và Image-to-Image.  
- **Pipeline xử lý:** Tiền xử lý ảnh (resize, normalize), trích xuất Feature Vectors.  
- **Contrastive Learning:** Giúp vector ảnh tương tự nhau gần nhau trong không gian vector.

## 2. Mảng Hạ tầng Vector Database (The Storage)
- **Vector Search Engine:** Milvus, Pinecone, Qdrant hoặc FAISS.  
- **Thuật toán ANN:** Tìm kiếm vector gần nhất trong mili giây.  
- **Metadata Management:** Liên kết Vector ID với thông tin ảnh qua PostgreSQL/MongoDB.

## 3. Mảng Backend & API Service (The Backbone)
- **RESTful API:** FastAPI hoặc Flask.  
- **Endpoints:**  
  - Image-to-Image → Nhận ảnh → Embedding → Search → Trả kết quả.  
  - Text-to-Image → Nhận text → Embedding → Search → Trả kết quả.  
- **Lưu trữ vật lý:** MinIO để quản lý file ảnh.

## 4. Mảng Giao diện & Triển khai (The Interface & DevOps)
- **Frontend:** React/Vue.js với khung upload ảnh và ô nhập text.  
- **Dockerization:** Dockerfile cho từng dịch vụ, docker-compose để kết nối.  
- **Tự động hóa:** Khi thêm ảnh mới, hệ thống tự trích xuất vector và cập nhật DB.

---

### Tóm tắt mô hình hoạt động

| Bước | Thành phần | Hành động |
|------|-------------|-----------|
| 1 | User | Upload ảnh hoặc nhập từ khóa. |
| 2 | Frontend | Gửi yêu cầu đến AI Model. |
| 3 | AI Model | Chuyển đổi Input thành Vector. |
| 4 | Vector DB | Tìm vector gần nhất bằng ANN. |
| 5 | Backend | Trả link ảnh cho Frontend. |

---

# THIẾT KẾ CHI TIẾT TỪNG MẢNG

## Mảng AI & Xử lý dữ liệu (The Brain)
### A. Mô hình Embedding
- **CLIP (OpenAI):** Hiểu cả ảnh và văn bản.  
- **ResNet/ViT:** Tốt cho nhận diện chi tiết hình ảnh.

### B. Feature Extraction Pipeline
- **Image Pre-processing:** Resize 224x224, normalize.  
- **Text Tokenization:** Chuyển text thành mã số.  
- **Batch Processing:** Xử lý theo cụm để tận dụng GPU.

### C. Vector Database
- **Milvus/Qdrant:** Lưu trữ và truy vấn vector.  
- **HNSW (ANN):** Giảm thời gian tìm kiếm xuống mili giây.

### D. AI Inference Service
- **FastAPI:** Quản lý model, API endpoints, hỗ trợ CPU/GPU.

| Tính năng | CLIP (Multimodal) | CNN/ViT (Pure Vision) |
|------------|-------------------|------------------------|
| Image-to-Image | Rất tốt (ngữ cảnh) | Rất tốt (hình khối/màu sắc) |
| Text-to-Image | Mặc định hỗ trợ | Cần huấn luyện thêm |
| Độ phức tạp | Trung bình | Cao |
| Ứng dụng | Tổng quát | Chuyên biệt |

---

## Mảng Hạ tầng Vector Database (The Storage)
### A. Vector Database Selection
- **Milvus/Qdrant:** Native, hỗ trợ Metadata Filtering.  
- **Elasticsearch:** Kết hợp tìm kiếm từ khóa.  
- **FAISS:** Tùy chỉnh thuật toán ANN.

### B. Indexing
- **HNSW:** Nhanh, chính xác, tốn RAM.  
- **IVF:** Tiết kiệm RAM, tốc độ chậm hơn.  
- **Distance Metrics:** Cosine Similarity, Euclidean Distance.

### C. Metadata & Privacy
| Trường dữ liệu | Kiểu | Mục đích |
|----------------|------|----------|
| image_id | String/UUID | Liên kết DB chính |
| user_id | Integer | Chủ sở hữu ảnh |
| privacy_level | Integer | 0: Private, 1: Friends, 2: Public |
| created_at | Timestamp | Lọc theo thời gian |

### D. Object Storage
- **MinIO:** Lưu file ảnh thật, lưu URL vào PostgreSQL, vector vào Milvus.

### E. Benchmarking
- **Latency, Precision, Recall, MRR, HitRate, Resource Usage** – đo hiệu năng hệ thống.

---

## Mảng Backend & API Service (The Backbone)
### A. FastAPI
- **Tốc độ cao**, **Swagger UI**, **Pydantic Validation**.

### B. Core Modules
1. **Auth Service:** JWT xác thực người dùng.  
2. **Media Service:** Upload ảnh, lưu MinIO, trích vector, lưu Milvus.  
3. **Search Service:** Hybrid Search, Re-ranking.

### C. Workflow
Validation → Embedding → Vector Query → Metadata Enrichment → Response.

### D. Evaluation Service
API `/eval/run` để đo MRR, HitRate, Precision.

### E. Database Schema
| Bảng | Trường chính |
|------|---------------|
| Users | id, username, password_hash, email |
| Albums | id, user_id, title, description, is_public |
| Images | id, album_id, user_id, minio_url, privacy_level, created_at |
| Friends | user_id_1, user_id_2, status |

---

## Mảng Giao diện & Triển khai (The Interface & DevOps)
### A. Frontend
- **Web App:** React + Tailwind CSS, Dashboard, Bulk Upload.  
- **Mobile App:** React Native + Expo, Camera, Offline Cache, Sharing.

### B. Deployment
- **Docker Compose:** Frontend, API, AI Service, PostgreSQL, Milvus, MinIO.  
- **Reverse Proxy:** Nginx/Traefik điều hướng các domain con.

### C. Deployment Flow
- **Local:** Docker Desktop.  
- **Production:** VPS/Cloud.  
- **CI/CD:** GitHub Actions.  
- **Mobile:** Expo EAS để build APK/iOS.

### D. Monitoring
- **Logging:** Loguru/ELK Stack.  
- **Health Check:** Trang admin hiển thị trạng thái service.

---

## Tổng kết
| Thành phần | Công nghệ | Mục tiêu |
|-------------|------------|-----------|
| Giao diện | React & React Native | Đồng bộ trải nghiệm |
| Đóng gói | Docker & Compose | Triển khai linh hoạt |
| Vận hành | Nginx & MinIO | Tối ưu tốc độ & bảo mật |
| Đánh giá | Python Scripts | Trích xuất MRR, HitRate |

---

**SISE** là hệ thống tìm kiếm ảnh thông minh toàn diện, kết hợp AI, Vector Database, Backend mạnh mẽ và giao diện hiện đại – sẵn sàng triển khai thực tế.
