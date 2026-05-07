# =============================================================================
# KNOWLEDGE BASE — AG-03 BackendModuleAgent
# =============================================================================
# Writer  : Project Owner + AG-00 + AG-03 (đề xuất, AG-00 approve)
# Reader  : AG-03 chủ yếy
# =============================================================================

## 1. DOMAIN KNOWLEDGE: FASTAPI ARCHITECTURE

### 1.1 Project structure chuẩn

```
modules/BackendModule/
├── app/
│   ├── main.py                  # App factory, lifespan, middleware
│   ├── config.py                # Pydantic Settings (đọc env vars)
│   ├── dependencies.py          # Shared DI: get_db, get_current_user, ...
│   ├── routers/
│   │   ├── auth.py              # POST /auth/register, /auth/login
│   │   ├── media.py             # POST /media/upload/*, GET /media/*
│   │   ├── albums.py            # CRUD /albums/*
│   │   ├── search.py            # POST /search/image, /search/text
│   │   ├── eval.py              # POST /eval/run
│   │   └── health.py            # GET /health/*
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── media_service.py
│   │   ├── search_service.py
│   │   └── eval_service.py
│   ├── models/                  # SQLAlchemy ORM models (mapping với PostgreSQL)
│   │   ├── user.py
│   │   ├── album.py
│   │   ├── image.py
│   │   └── friend.py
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── media.py
│   │   ├── search.py
│   │   └── common.py            # StandardError, Pagination, ...
│   └── workers/
│       └── indexing_worker.py   # Celery task: S4_Async_Index
├── Dockerfile
└── pyproject.toml
```

### 1.2 Pydantic Settings pattern (đọc env vars)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    milvus_host: str
    milvus_port: int = 19530
    redis_url: str
    jwt_secret: str
    ai_service_url: str

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 2. DOMAIN KNOWLEDGE: JWT AUTHENTICATION

### 2.1 Flow chuẩn

```
POST /auth/register → hash password (bcrypt) → INSERT users → return UserResponse
POST /auth/login    → verify password         → issue JWT   → return TokenResponse

Protected route → Authorization: Bearer <token> header
               → JWT decode → extract user_id → inject vào request state
```

### 2.2 JWT implementation

```python
from jose import jwt, JWTError
from datetime import datetime, timedelta

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)

def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail={"code": "ERR_UNAUTHORIZED"})
```

---

## 3. DOMAIN KNOWLEDGE: UPLOAD PIPELINE (5 BƯỚC)

Đây là logic phức tạp nhất của AG-03. Phải implement đúng thứ tự theo `data_schema.yaml → transaction_semantics.upload_pipeline`.

```python
# S1: Tạo presigned URL
async def init_upload(user_id: int, album_id: int, image_id: UUID) -> UploadInitResponse:
    object_key = f"{user_id}/{album_id}/{image_id}.jpg"
    upload_url = minio_client.presigned_put_object("raw-images", object_key, expires=3600)
    return UploadInitResponse(upload_url=upload_url, object_key=object_key)

# S3: Insert metadata (sau khi client confirm upload xong)
async def confirm_upload(object_key: str, metadata: ImageMetadata) -> ImageResponse:
    try:
        image = await db.execute(INSERT images ...)   # index_status = 'pending'
        await celery_app.send_task("index_image", args=[str(image.id)])  # S4
        return ImageResponse(...)
    except Exception:
        minio_client.remove_object("raw-images", object_key)  # Compensating action!
        raise

# S4 & S5: Celery worker (chạy async, không block API response)
@celery_app.task(bind=True, max_retries=3)
def index_image(self, image_id: str):
    try:
        image_bytes = minio_client.get_object("raw-images", object_key)
        vector = requests.post(f"{AI_SERVICE_URL}/embed/image", files=...).json()["vector"]
        milvus_client.insert("sise_v1", {"image_id": image_id, "vector": vector, ...})
        db.execute(UPDATE images SET index_status='ready' WHERE id=image_id)
    except Exception as exc:
        db.execute(UPDATE images SET index_status='failed' WHERE id=image_id)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)  # Exponential backoff
```

---

## 4. DOMAIN KNOWLEDGE: PRIVACY-AWARE SEARCH

### 4.1 Privacy filter logic (QUAN TRỌNG)

```python
async def build_milvus_filter(current_user_id: int, db) -> str:
    # Public images: tất cả mọi người thấy
    public_filter = "privacy_level == 2"

    # Own images: chủ sở hữu thấy tất cả ảnh của mình
    own_filter = f"user_id == {current_user_id}"

    # Friends images: phải query PostgreSQL để lấy danh sách friend_id
    friend_ids = await db.execute(
        SELECT friend_id FROM friends WHERE user_id = :uid, {"uid": current_user_id}
    )
    if friend_ids:
        ids_str = ", ".join(str(fid) for fid in friend_ids)
        friends_filter = f"(privacy_level == 1 and user_id in [{ids_str}])"
        return f"({public_filter} or {own_filter} or {friends_filter})"

    return f"({public_filter} or {own_filter})"
```

> ⚠️ **Không cache danh sách friends quá 5 phút** — xem `data_schema.yaml → notes.privacy_level_1_query`.

### 4.2 Search workflow đầy đủ

```python
async def search_by_image(image_bytes: bytes, user_id: int, top_k: int = 10):
    # 1. Embed query
    vector = await ai_service.embed_image(image_bytes)

    # 2. Build privacy filter
    milvus_filter = await build_milvus_filter(user_id, db)

    # 3. Vector search với privacy filter
    results = milvus_client.search(
        collection_name="sise_v1",
        data=[vector],
        filter=milvus_filter,
        limit=top_k,
        search_params={"ef": 64},
        output_fields=["image_id", "user_id", "privacy_level"]
    )

    # 4. Enrich với metadata từ PostgreSQL
    image_ids = [r["entity"]["image_id"] for r in results[0]]
    images = await db.execute(SELECT * FROM images WHERE id = ANY(:ids) AND deleted_at IS NULL)

    # 5. Build response
    return [SearchResult(similarity_score=r["distance"], **img) for r, img in zip(results[0], images)]
```

---

## 5. DOMAIN KNOWLEDGE: EVALUATION SERVICE

```python
# POST /eval/run → chạy benchmark, trả về metrics
async def run_evaluation(test_set: list[EvalQuery]) -> EvalReport:
    mrr_total = 0.0
    hit_count = 0

    for query in test_set:
        results = await search_by_image(query.image_bytes, query.user_id)
        result_ids = [r.image_id for r in results]

        # MRR: kết quả đúng ở vị trí thứ mấy?
        for rank, rid in enumerate(result_ids, start=1):
            if rid in query.ground_truth_ids:
                mrr_total += 1.0 / rank
                hit_count += 1
                break

    n = len(test_set)
    return EvalReport(
        mrr=mrr_total / n,
        hit_rate=hit_count / n,
        total_queries=n
    )
```

---

## 6. DOMAIN KNOWLEDGE: IDEMPOTENCY

```python
# Middleware check: nếu Idempotency-Key đã tồn tại trong Redis → trả cached result
async def idempotency_middleware(request: Request, call_next):
    key = request.headers.get("Idempotency-Key")
    if key:
        cached = await redis.get(f"idempotency:{key}")
        if cached:
            return JSONResponse(json.loads(cached))  # Return cached, không xử lý lại
    response = await call_next(request)
    if key and response.status_code < 400:
        await redis.setex(f"idempotency:{key}", 86400, await response.body())  # TTL 24h
    return response
```

---

## 7. RANH GIỚI CỨNG

- AG-03 **không** xử lý ảnh trực tiếp (no PIL, no resize) — gọi qua AG-01.
- AG-03 **không** thay đổi Milvus schema hay PostgreSQL schema — đó là AG-02.
- AG-03 **không** gọi thẳng Milvus để tạo/xóa collection — chỉ insert/query.
- AG-03 **không** ghi vào working_dir của agent khác.
- AG-04 và AG-05 chỉ giao tiếp với AG-03 qua HTTP API, không có channel nào khác.
