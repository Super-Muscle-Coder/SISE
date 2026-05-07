# =============================================================================
# KNOWLEDGE BASE — SHARED
# =============================================================================
# Vai trò : Tri thức dùng chung cho TẤT CẢ agents trong solution SISE.
#           Bao gồm conventions, glossary, coding standards và các quyết định
#           kiến trúc đã được chốt. Mọi agent PHẢI đọc và tuân thủ.
# Writer  : Project Owner + AG-00
# Reader  : Tất cả agents
# =============================================================================

## 1. GLOSSARY — Thuật ngữ chuẩn của dự án

Tất cả agents phải dùng đúng các thuật ngữ sau trong code, comment, và log:

| Thuật ngữ | Định nghĩa | Ví dụ dùng đúng |
|---|---|---|
| `vector` | Mảng float32 biểu diễn ảnh/văn bản trong không gian embedding | `vector: list[float]` |
| `embedding` | Quá trình hoặc kết quả trích xuất vector từ ảnh/text qua CLIP | `embedding_service.embed_image()` |
| `index_status` | Trạng thái xử lý của một ảnh: `pending` → `ready` / `failed` | `images.index_status == 'ready'` |
| `privacy_level` | Cấp độ bảo mật của ảnh: `0`=Private, `1`=Friends, `2`=Public | `privacy_level: int` (0/1/2) |
| `object_key` | Đường dẫn định danh file trong MinIO | `"{user_id}/{album_id}/{image_id}.jpg"` |
| `presigned_url` | URL tạm thời cho phép upload/download trực tiếp lên MinIO | `generate_presigned_put_url()` |
| `idempotency_key` | Header đảm bảo request không bị xử lý 2 lần | `Idempotency-Key: <uuid>` |
| `similarity_score` | Điểm tương đồng cosine giữa query vector và result vector | `score: float` (0.0 → 1.0) |
| `ground_truth` | Nhãn đúng dùng để đánh giá độ chính xác trong benchmark | `ground_truth_labels: list[str]` |
| `MRR` | Mean Reciprocal Rank — đánh giá kết quả đúng ở vị trí thứ mấy | `mrr_score: float` |
| `hit_rate` | Tỷ lệ truy vấn có ít nhất 1 kết quả đúng trong Top-K | `hit_rate_at_k: float` |

---

## 2. CODING CONVENTIONS

### 2.1 Python (AG-01, AG-02, AG-03)

```python
# Đặt tên hàm: snake_case
def embed_image(image: PIL.Image) -> list[float]: ...

# Đặt tên class: PascalCase
class EmbeddingService: ...

# Đặt tên hằng số: UPPER_SNAKE_CASE
VECTOR_DIM = 512
MAX_FILE_SIZE_MB = 20

# Type hints: BẮT BUỘC cho tất cả function signatures
async def search_images(
    query_vector: list[float],
    user_id: int,
    privacy_level: int,
    top_k: int = 10,
) -> list[SearchResult]: ...

# Docstring: Google style
def embed_text(text: str) -> list[float]:
    """Encode text query into CLIP embedding vector.

    Args:
        text: User search query string.

    Returns:
        Normalized float32 vector of shape (vector_dim,).

    Raises:
        ValueError: If text is empty or exceeds token limit.
    """
```

### 2.2 TypeScript / React (AG-04, AG-05)

```typescript
// Interfaces: PascalCase với prefix I không bắt buộc
interface SearchResult {
  imageId: string;
  similarityScore: number;
  privacyLevel: 0 | 1 | 2;
  presignedUrl: string;
}

// Components: PascalCase
const SearchResultGrid: React.FC<{ results: SearchResult[] }> = ({ results }) => { ... }

// Custom hooks: camelCase với prefix use
const useImageSearch = () => { ... }

// API calls: tập trung trong /src/api/, không rải rác trong components
```

### 2.3 YAML / JSON Config

```yaml
# Dùng kebab-case cho keys trong config files
vector-dim: 512        # ✅
vectorDim: 512         # ❌

# Exception: Python dict keys trong code dùng snake_case
config = {"vector_dim": 512}  # ✅
```

---

## 3. ERROR HANDLING STANDARDS

Tất cả agents phải dùng cấu trúc lỗi chuẩn theo `openapi.yaml → components.schemas.Error`:

```json
{
  "code": "ERR_VECTOR_DIM_MISMATCH",
  "message": "Expected vector dimension 512, got 768",
  "details": {}
}
```

**Danh sách error codes chuẩn:**

| Code | HTTP Status | Mô tả |
|---|---|---|
| `ERR_VECTOR_DIM_MISMATCH` | 400 | Vector dimension không khớp với collection |
| `ERR_INVALID_CONTENT_TYPE` | 400 | File type không phải image/jpeg hoặc image/png |
| `ERR_FILE_TOO_LARGE` | 400 | File vượt quá 20MB |
| `ERR_UNAUTHORIZED` | 401 | JWT token không hợp lệ hoặc hết hạn |
| `ERR_FORBIDDEN` | 403 | User không có quyền truy cập resource này |
| `ERR_NOT_FOUND` | 404 | Resource không tồn tại |
| `ERR_DUPLICATE_REQUEST` | 409 | Idempotency key đã được dùng |
| `ERR_INDEX_FAILED` | 500 | CLIP embedding hoặc Milvus insert thất bại |
| `ERR_STORAGE_UNAVAILABLE` | 503 | MinIO hoặc PostgreSQL không kết nối được |

---

## 4. ENVIRONMENT VARIABLES

Tất cả agents đọc config từ env vars. **Không hard-code bất kỳ giá trị nào sau đây:**

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/sise

# Storage
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...

# Vector DB
MILVUS_HOST=milvus-standalone
MILVUS_PORT=19530

# Cache
REDIS_URL=redis://redis:6379/0

# Auth
JWT_SECRET=...

# AI Service (internal)
AI_SERVICE_URL=http://ai-service:8001
```

---

## 5. GIT CONVENTIONS

```
# Branch naming
feature/ag01-clip-warmup          # Feature branch của AG-01
fix/ag03-privacy-filter-bug       # Fix branch
chore/ag00-update-tasks           # Chore (config, docs)

# Commit message format (Conventional Commits)
feat(ag01): add CLIP warm-up on startup
fix(ag03): correct friends privacy filter query
chore(ag00): update Tasks.yaml phase 2 status
test(ag03): add unit tests for search service

# Pull Request: mỗi agent tạo PR từ branch của mình vào main
# AG-00 review và merge
```

---

## 6. DOCKER NETWORKING

Tất cả services giao tiếp qua Docker internal network tên `sise-network`:

| Service | Internal hostname | Port |
|---|---|---|
| Backend API | `backend` | `8000` |
| AI Service | `ai-service` | `8001` |
| PostgreSQL | `postgres` | `5432` |
| Milvus | `milvus-standalone` | `19530` |
| MinIO | `minio` | `9000` (API), `9001` (Console) |
| Redis | `redis` | `6379` |
| Frontend Web | `frontend-web` | `80` |
| Celery Worker | `celery-worker` | N/A |
