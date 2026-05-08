# PHÂN TÍCH: CẤU TRÚC 4 TẦNG (configs/entities/adapters/services) CHO SISE

## TÓM TẮT

Cấu trúc 4 tầng **RẤT PHÙ HỢP** với 3 project Python (AG-01, AG-02, AG-03).
React projects (AG-04, AG-05) có thể áp dụng **BÁN PHẦN** với điều chỉnh theo convention của React ecosystem.

---

## PYTHON PROJECTS — ÁP DỤNG 100%

### AG-01 — AIModule (EXCELLENT FIT)

```
modules/AIModule/
├── configs/
│   ├── model_config.py
│   │   VECTOR_DIM = 512
│   │   MODEL_NAME = "ViT-B-32"
│   │   DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
│   ├── preprocessing_config.py
│   │   IMAGE_SIZE = 224
│   │   NORMALIZE_MEAN = [0.48145466, 0.4578275, 0.40821073]
│   │   NORMALIZE_STD = [0.26862954, 0.26130258, 0.27577711]
│   └── api_config.py
│   │   HOST = "0.0.0.0"
│   │   PORT = 8001
│
├── entities/
│   ├── embedding_request.py     # Pydantic models
│   │   class ImageEmbedRequest(BaseModel): ...
│   ├── embedding_response.py
│   │   class EmbedResponse(BaseModel):
│   │       vector: list[float]
│   ├── preprocessing_input.py
│   │   class PreprocessedImage:
│   │       tensor: torch.Tensor
│   │       original_mode: str
│
├── adapters/
│   ├── model_loader.py          # Adapter để load CLIP từ open_clip
│   │   def load_clip_model(model_name: str, device: str) -> CLIPModel: ...
│   ├── preprocessing_pipeline.py
│   │   class ImagePreprocessor:
│   │       def __init__(self, config: PreprocessingConfig): ...
│   │       def preprocess(self, image_bytes: bytes) -> PreprocessedImage: ...
│
├── services/
│   ├── embedding_service.py
│   │   class EmbeddingService:
│   │       def __init__(self, model, config):
│   │           self.model = model
│   │           self.config = config
│   │       def embed_image(self, preprocessed: PreprocessedImage) -> list[float]:
│   │           # Logic: forward pass + normalize
│   │       def embed_text(self, text: str) -> list[float]:
│   │           # Logic: tokenize + forward + normalize
│   └── warmup_service.py
│       def warmup_model(model, device): ...
│
└── app/
    └── main.py                  # FastAPI app kết nối tất cả
        from configs import model_config, api_config
        from entities import ImageEmbedRequest, EmbedResponse
        from adapters import load_clip_model, ImagePreprocessor
        from services import EmbeddingService, warmup_model
```

**Lợi ích cực kỳ rõ ràng:**
- `configs/` tập trung tất cả hyperparameters → dễ tune (VECTOR_DIM, MODEL_NAME, IMAGE_SIZE).
- `entities/` định nghĩa data structures thuần túy → dễ validate với Pydantic.
- `adapters/` wrap third-party libs (open_clip, PIL) → dễ swap model sau này.
- `services/` chứa toàn bộ business logic embedding → dễ test isolated.

---

### AG-02 — StorageModule (GOOD FIT, nhưng ít logic hơn)

```
modules/StorageModule/
├── configs/
│   ├── postgres_config.py
│   │   DATABASE_URL = os.getenv("DATABASE_URL")
│   │   POOL_SIZE = 10
│   ├── milvus_config.py
│   │   MILVUS_HOST = os.getenv("MILVUS_HOST")
│   │   MILVUS_PORT = 19530
│   │   COLLECTION_NAME = "sise_v1"
│   │   INDEX_PARAMS = {"M": 16, "efConstruction": 200}
│   └── minio_config.py
│   │   MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
│   │   BUCKETS = ["raw-images", "thumbnails"]
│
├── entities/
│   ├── milvus_schema.py
│   │   class MilvusFieldSchema:
│   │       name: str
│   │       dtype: DataType
│   │       is_primary: bool
│   ├── postgres_models.py       # SQLAlchemy ORM models
│   │   class User(Base): ...
│   │   class Album(Base): ...
│   │   class Image(Base): ...
│
├── adapters/
│   ├── postgres_adapter.py
│   │   def create_engine_from_config(config): ...
│   ├── milvus_adapter.py
│   │   def create_milvus_client(config): ...
│   ├── minio_adapter.py
│   │   def create_minio_client(config): ...
│
├── services/
│   ├── migration_service.py
│   │   def run_alembic_upgrade(): ...
│   ├── milvus_setup_service.py
│   │   def create_collection_if_not_exists(client, schema, index_params): ...
│   ├── minio_setup_service.py
│   │   def create_buckets_if_not_exist(client, bucket_names): ...
│   └── seed_service.py
│       def seed_test_data(): ...
│
└── scripts/
    ├── init_storage.py          # Orchestrate tất cả services
    └── docker-compose.storage.yml
```

**Lưu ý:** AG-02 ít business logic hơn AG-01 và AG-03 vì chủ yếu là infra setup.
Nhưng cấu trúc 4 tầng vẫn giúp tách biệt rõ ràng giữa config (thay đổi theo env) và setup logic.

---

### AG-03 — BackendModule (PERFECT FIT, phức tạp nhất)

```
modules/BackendModule/
├── configs/
│   ├── app_config.py
│   │   JWT_SECRET = os.getenv("JWT_SECRET")
│   │   ACCESS_TOKEN_EXPIRE_MINUTES = 30
│   │   IDEMPOTENCY_TTL_HOURS = 24
│   ├── ai_service_config.py
│   │   AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")
│   │   EMBED_TIMEOUT_MS = 10000
│   ├── storage_config.py
│   │   DATABASE_URL = os.getenv("DATABASE_URL")
│   │   MILVUS_HOST = os.getenv("MILVUS_HOST")
│   │   MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
│   └── celery_config.py
│   │   BROKER_URL = os.getenv("REDIS_URL")
│   │   RESULT_BACKEND = os.getenv("REDIS_URL")
│
├── entities/
│   ├── auth_entities.py
│   │   class RegisterRequest(BaseModel): ...
│   │   class TokenResponse(BaseModel): ...
│   ├── media_entities.py
│   │   class UploadInitRequest(BaseModel): ...
│   │   class ImageMetadata(BaseModel): ...
│   ├── search_entities.py
│   │   class SearchResult(BaseModel): ...
│   │   class SearchResponse(BaseModel): ...
│   └── eval_entities.py
│   │   class EvalQuery: ...
│   │   class EvalReport: ...
│
├── adapters/
│   ├── ai_service_adapter.py
│   │   class AIServiceClient:
│   │       def embed_image(self, image_bytes: bytes) -> list[float]: ...
│   ├── milvus_adapter.py
│   │   class MilvusClient:
│   │       def search_with_filter(self, vector, filter_expr, top_k): ...
│   ├── postgres_adapter.py
│   │   class PostgresClient:
│   │       async def get_user_friends(self, user_id): ...
│   ├── minio_adapter.py
│   │   class MinIOClient:
│   │       def generate_presigned_put_url(self, bucket, object_key): ...
│   └── redis_adapter.py
│   │   class RedisClient:
│   │       async def get_idempotency_result(self, key): ...
│
├── services/
│   ├── auth_service.py
│   │   class AuthService:
│   │       def register_user(...): ...
│   │       def login_user(...): ...
│   │       def create_jwt_token(user_id): ...
│   ├── upload_service.py
│   │   class UploadService:
│   │       async def init_upload(...): ...      # S1
│   │       async def confirm_upload(...): ...   # S3
│   ├── search_service.py
│   │   class SearchService:
│   │       async def build_privacy_filter(user_id, postgres): ...
│   │       async def search_by_image(...): ...
│   │       async def search_by_text(...): ...
│   ├── eval_service.py
│   │   class EvaluationService:
│   │       async def run_benchmark(test_set): ...
│   └── indexing_service.py
│       # Celery worker logic
│       @celery_app.task
│       def index_image_task(image_id): ...     # S4 & S5
│
└── app/
    ├── routers/
    │   ├── auth.py              # Inject AuthService
    │   ├── media.py             # Inject UploadService
    │   ├── search.py            # Inject SearchService
    │   └── eval.py              # Inject EvaluationService
    └── main.py
```

**Lợi ích cực kỳ lớn:**
- `configs/` tách biệt rõ từng external dependency (AI, Storage, Auth, Celery).
- `entities/` định nghĩa tất cả Pydantic schemas → auto validation + auto docs (Swagger).
- `adapters/` wrap mọi external calls → dễ mock khi test services.
- `services/` chứa toàn bộ business logic phức tạp (upload pipeline, privacy filter) → test isolated.

---

## REACT PROJECTS — ÁP DỤNG BÁN PHẦN (có điều chỉnh)

### AG-04 — WebFrontend & AG-05 — MobileFrontend

React ecosystem có convention riêng, nhưng **tinh thần 4 tầng vẫn áp dụng được** nếu map như sau:

```
modules/frontendweb/  (hoặc FrontendMobile/)
├── src/
│   ├── config/                  ← Tương đương configs/
│   │   ├── api.config.ts
│   │   │   export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
│   │   │   export const REQUEST_TIMEOUT_MS = 10000;
│   │   ├── upload.config.ts
│   │   │   export const MAX_FILE_SIZE_MB = 20;
│   │   │   export const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png"];
│   │   └── search.config.ts
│   │       export const DEFAULT_TOP_K = 10;
│   │
│   ├── types/                   ← Tương đương entities/ (TypeScript interfaces)
│   │   ├── auth.types.ts
│   │   │   export interface LoginRequest { ... }
│   │   │   export interface TokenResponse { ... }
│   │   ├── media.types.ts
│   │   │   export interface UploadInitResponse { ... }
│   │   ├── search.types.ts
│   │   │   export interface SearchResult { ... }
│   │   └── common.types.ts
│   │
│   ├── api/                     ← Tương đương adapters/ (wrapper cho HTTP calls)
│   │   ├── client.ts            # Axios instance + interceptors
│   │   ├── auth.api.ts
│   │   │   export const login = (req: LoginRequest): Promise<TokenResponse> => { ... }
│   │   ├── media.api.ts
│   │   │   export const uploadInit = (...): Promise<UploadInitResponse> => { ... }
│   │   ├── albums.api.ts
│   │   └── search.api.ts
│   │
│   ├── services/                ← services/ (business logic phía client)
│   │   ├── uploadService.ts
│   │   │   export class UploadService {
│   │   │       async bulkUpload(files: File[]): Promise<UploadSummary> {
│   │   │           // Logic: validate → init → PUT → confirm (loop)
│   │   │       }
│   │   │   }
│   │   ├── searchService.ts
│   │   │   export class SearchService {
│   │   │       async searchByImage(file: File): Promise<SearchResult[]> {
│   │   │           // Logic: validate → call API → format results
│   │   │       }
│   │   │   }
│   │   └── cacheService.ts      # (AG-05) AsyncStorage logic
│   │
│   ├── hooks/                   ← React-specific layer (không có tương đương trong Python)
│   │   ├── useAuth.ts           # Dùng AuthService bên trong
│   │   ├── useBulkUpload.ts     # Dùng UploadService
│   │   └── useImageSearch.ts    # Dùng SearchService
│   │
│   ├── components/              ← UI layer (không có tương đương trong Python)
│   └── pages/
```

**So sánh mapping:**

| Python 4-tier | React equivalent | Ghi chú |
|---|---|---|
| `configs/` | `config/` | Giống hệt, chỉ đổi `.py` → `.ts` |
| `entities/` | `types/` | TypeScript interfaces thay vì Pydantic/dataclass |
| `adapters/` | `api/` | Wrap HTTP calls thay vì wrap DB/external services |
| `services/` | `services/` + `hooks/` | Logic chia làm 2: service (pure logic) + hook (React integration) |

**Lưu ý quan trọng:**
- React có thêm `hooks/` layer — đây là "glue code" giữa services và components. Hook gọi service và quản lý React state.
- `services/` trong React nên là **pure functions hoặc classes**, không dùng React hooks. Điều này giúp test dễ dàng.

**Ví dụ cụ thể:**

```typescript
// src/services/searchService.ts — PURE, không dùng React hooks
export class SearchService {
  constructor(private apiClient: AxiosInstance) {}

  async searchByImage(file: File): Promise<SearchResult[]> {
    // Validate
    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      throw new Error("ERR_INVALID_CONTENT_TYPE");
    }

    // Call API
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await this.apiClient.post("/search/image", formData);

    return data.results;
  }
}

// src/hooks/useImageSearch.ts — Dùng SearchService + React state
import { SearchService } from "@/services/searchService";
import apiClient from "@/api/client";

const searchService = new SearchService(apiClient);

export const useImageSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (file: File) => {
    setLoading(true);
    try {
      const results = await searchService.searchByImage(file);
      setResults(results);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
};
```

---

## KẾT LUẬN & KHUYẾN NGHỊ

### Python Projects (AG-01, AG-02, AG-03) — ÁP DỤNG 100%

**RẤT NÊN áp dụng cấu trúc 4 tầng configs/entities/adapters/services.**

Lợi ích cụ thể:
- ✅ Tách biệt config khỏi logic → dễ thay đổi giá trị mà không động vào code.
- ✅ Entities thuần túy → dễ validate, dễ serialize.
- ✅ Adapters wrap external libs → dễ swap, dễ mock khi test.
- ✅ Services chứa business logic → test isolated, không phụ thuộc FastAPI hay Flask.

### React Projects (AG-04, AG-05) — ÁP DỤNG BÁN PHẦN với mapping:

- `configs/` → `config/` ✅
- `entities/` → `types/` ✅
- `adapters/` → `api/` ✅ (wrap HTTP calls)
- `services/` → `services/` + `hooks/` ✅ (tách logic pure và React integration)

Lợi ích:
- ✅ Tách API calls khỏi components → components chỉ gọi hook, không biết endpoint URL.
- ✅ Services testable mà không cần mount React component.
- ✅ Config tập trung → dễ thay base URL giữa dev/staging/prod.

### Lưu ý cuối:

Cấu trúc của bạn **không xung đột** với FastAPI/React convention mà **bổ sung thêm discipline**.
Các framework không quy định bắt buộc phải tổ chức như thế nào trong business logic layer,
nên bạn hoàn toàn tự do áp dụng pattern đã proven.

**Đề xuất cuối cùng:** Trong `.context/DOS.md` hoặc `KnowledgeBase_shared.md`, bổ sung section
"Project Structure Convention" mô tả rõ cấu trúc 4 tầng này để tất cả agents tuân thủ nhất quán.
