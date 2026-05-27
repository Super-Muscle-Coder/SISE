# AG-03 Phase 3 Handoff Guide — Backend API Service

**Prepared By**: AG-00 (OrchestratorAgent)  
**Date**: 2026-05-13  
**For**: AG-03 (BackendModuleAgent)  
**Phase**: 3 — Backend API Service  
**Priority**: P0 (Critical Path)

---

## 📋 Onboarding Checklist — ĐỌC LÀ TRƯỚC TIÊN

Trước khi bắt đầu coding, bạn **PHẢI** đọc kĩ những file sau **THEO THỨ TỰ NÀY**:

### 1. **Đọc Agent Contract của bạn** (15 phút)
   - **File**: `.github/agents/BackendModuleAgent.agent.md`
   - **Lý do**: Định nghĩa rõ ranh giới trách nhiệm của AG-03, những gì bạn được phép làm/không được làm, các dependency input/output, và constraints kỹ thuật.
   - **Action items**:
	 - ✅ Xác nhận role: "FastAPI backend orchestrator"
	 - ✅ Xác nhận forbidden actions: không touch Milvus schema, không ghi code vào các module khác
	 - ✅ Xác nhận working_dir: `modules/BackendModule/`
	 - ✅ Ghi nhớ required_env_vars: DATABASE_URL, MINIO_ENDPOINT, MILVUS_HOST, REDIS_URL, JWT_SECRET, AI_SERVICE_URL

### 2. **Hiểu Architecture Project** (20 phút)
   - **File**: `.knowledge/shared/Workflow_Centric_Architecture.md`
   - **Lý do**: SISE không dùng MVC truyền thống mà dùng **Workflow-Centric** kết hợp **5-Layer Architecture**. Nếu bạn code sai cách, CI/CD sẽ reject commit.
   - **Action items**:
	 - ✅ Hiểu 5 lớp: configs, entities, adapters, services, routers
	 - ✅ Hiểu workflow-centric naming: tên file phải bắt đầu bằng prefix workflow (ví dụ `auth_services.py`, `upload_adapters.py`)
	 - ✅ Hiểu anti-patterns: không hard-code secrets, không circular dependency, không logic bleed vào entities
	 - ✅ Xác nhận: Tất cả adapters phải Inject via constructor, không được hard-code external calls

### 3. **Đọc Contract Files trong .context/** (25 phút)
   - **File 1**: `.context/data_schema.yaml`
	 - Xác nhận global_configs.vector_dim = **512** (phải match AG-01 output)
	 - Xác nhận database schema: users, friends, albums, images (quy tắc privacy_level, soft delete)
	 - Xác nhận Milvus collection: sise_v1, HNSW indexing (M=16, efConstruction=200)
	 - Xác nhận MinIO lifecycle rules cho raw-images và thumbnails
	 - Xác nhận transaction_semantics: upload 5-step pipeline đúng thứ tự (presigned → binary → metadata pending → async index → commit ready)
	 - Xác nhận idempotency header: `Idempotency-Key` TTL 24h, per-user scope

   - **File 2**: `.context/openapi.yaml`
	 - Xác nhận tất cả endpoint bạn cần implement:
	   - `/health/liveness` → 200 (service alive)
	   - `/health/readiness` → 200/503 (dependencies ready, header X-Expected-Vector-Dim=512)
	   - `/auth/register` → 201 (user created)
	   - `/auth/login` → 200 (JWT token returned)
	   - `/media/upload-url` → 200 presigned (S3 direct upload)
	   - `/media/upload` → 201 (legacy multipart, fallback)
	   - `/media/{image_id}` → 200 (metadata + signed GET URL)
	   - `/inference/embed/image` → 200 (call AG-01, get vector dim=512)
	   - `/inference/embed/text` → 200 (call AG-01, get vector dim=512)
	   - `/vector/index` → 201 (index vector vào Milvus, async OK)
	   - `/vector/search/hybrid` → 200 (search with privacy filter + structured metadata)
	   - `/eval/metrics` → 200 (MRR, HitRate, Precision, Recall)
	   - `/admin/reindex` → 202 (trigger bulk reindex)
	 - Xác nhận error schema: all responses phải conform openapi.yaml spec
	 - Xác nhận vector dim mismatch handling: nếu vector.len() ≠ 512, return 400 with code `ERR_VECTOR_DIM_MISMATCH`

   - **File 3**: `.context/DOS.md` (giáo dục chung, tham khảo)
	 - Xác nhận solution architecture overview
	 - Xác nhận data flow: Client → Backend → AI Service / Storage

### 4. **Hiểu Knowledge Management Responsibility của bạn** (5 phút)
   - **Files**: `.knowledge/agent03/Log_03.md`, `.knowledge/agent03/Skill_03.md`, `.knowledge/agent03/KnowledgeBase_03.md`
   - **Trách nhiệm**:
	 - ✅ Update `Log_03.md` sau mỗi major event (task completion, critical decision, issue resolution)
	 - ✅ Update `Skill_03.md` khi gặp phải unexpected issues và đã resolve
	 - ✅ Giữ `KnowledgeBase_03.md` sync với trusted references (cập nhật hàng tuần)
	 - ✅ AG-00 sẽ audit hàng tuần; nếu logs/skills không được cập nhật, bạn sẽ bị trigger review

---

## 🏠 Backend Module Working Directory Structure

```
modules/BackendModule/
├── configs/
│   ├── backend.env.local          # Local dev config (DO NOT COMMIT)
│   ├── backend.env.staging        # Staging config
│   └── backend.env.example        # Template
│
├── app/
│   ├── entities/
│   │   ├── auth_entities.py       # User, AuthRequest, AuthResponse
│   │   ├── upload_entities.py     # PresignedUrl, UploadResponse
│   │   ├── search_entities.py     # SearchQuery, SearchResult
│   │   ├── media_entities.py      # Album, Image metadata
│   │   ├── evaluation_entities.py # MRR, HitRate, Precision, Recall
│   │   └── __init__.py            # Export via __all__
│   │
│   ├── adapters/
│   │   ├── postgres_adapter.py    # SQLAlchemy async queries
│   │   ├── minio_adapter.py       # MinIO client (presigned, put, get)
│   │   ├── milvus_adapter.py      # pymilvus vector DB operations
│   │   ├── ai_adapter.py          # Calls AG-01 /embed/image, /embed/text
│   │   ├── redis_adapter.py       # aioredis for idempotency cache
│   │   ├── celery_adapter.py      # Celery task enqueue/monitor
│   │   └── __init__.py            # Export via __all__
│   │
│   ├── services/
│   │   ├── auth_services.py       # JWT, register, login logic
│   │   ├── upload_services.py     # 5-step pipeline orchestration
│   │   ├── indexing_services.py   # Celery job consumer (embed → index)
│   │   ├── search_services.py     # Privacy-aware search, metadata filter
│   │   ├── media_services.py      # Album/Image CRUD, soft delete
│   │   ├── evaluation_services.py # MRR, HitRate computation
│   │   ├── health_services.py     # Dependency checks
│   │   └── __init__.py            # Export via __all__
│   │
│   ├── routers/
│   │   ├── auth_routers.py        # /auth/register, /auth/login
│   │   ├── upload_routers.py      # /media/upload-url, /media/upload, /media/{id}
│   │   ├── inference_routers.py   # /inference/embed/image, /embed/text
│   │   ├── vector_routers.py      # /vector/index, /vector/search/hybrid
│   │   ├── media_routers.py       # Album/Image CRUD routes
│   │   ├── evaluation_routers.py  # /eval/metrics, /admin/reindex
│   │   ├── health_routers.py      # /health/liveness, /health/readiness
│   │   └── __init__.py            # Register all routers
│   │
│   ├── dependencies.py            # FastAPI Depends() factories, middleware
│   ├── main.py                    # FastAPI app initialization, middleware setup
│   └── __init__.py
│
├── tests/
│   ├── test_auth_workflow.py      # Unit tests for auth service
│   ├── test_upload_workflow.py    # Unit tests for 5-step pipeline
│   ├── test_search_workflow.py    # Unit tests for privacy filter
│   └── test_e2e_integration.py    # E2E tests (requires storage stack)
│
├── backend_requirements.txt
├── backend_main.py                # Entry point (imports from app/)
└── Dockerfile                     # Multi-stage, production-ready
```

**Naming Rules**:
- Mỗi file phải bắt đầu bằng workflow prefix: `auth_`, `upload_`, `search_`, `media_`, `indexing_`, `evaluation_`, `health_`
- Không được tạo file `utils.py`, `helpers.py`, `common.py` — nếu logic bị chia sẻ quá nhiều, hãy review architecture

---

## 🎯 Phase 3 Task Sequence (Workflow-Centric Order)

### T003-01: [workflow:scaffold] Project Scaffold & Dependencies
- **Priority**: P0
- **Duration**: ~30 minutes
- **Task**:
  - Tạo `modules/BackendModule/` với cấu trúc 5-lớp như trên
  - Setup `backend_requirements.txt`: fastapi, sqlalchemy, asyncpg, pymilvus, minio, aioredis, celery, python-jose, bcrypt, python-dotenv, python-multipart
  - Setup FastAPI app tại `app/main.py` với CORS, error handlers, lifespan
  - Setup dependency injection factory functions tại `app/dependencies.py`
  - Config SQLAlchemy async engine, Redis connection, Milvus client, MinIO client
  - Tất cả secrets từ env vars, không hard-code

### T003-02: [workflow:auth] Auth Service (JWT)
- **Priority**: P0
- **Dependencies**: T003-01
- **Duration**: ~45 minutes
- **Acceptance Criteria**:
  - `POST /auth/register` → 201 User created
  - `POST /auth/login` → 200 + access_token (JWT)
  - Password hashed với bcrypt
  - Username/email uniqueness enforced
  - Token validation middleware on protected routes

### T003-03: [workflow:upload] 5-Step Upload Pipeline
- **Priority**: P0
- **Dependencies**: T003-01, T001-04 (MinIO ready), T002-06 (AI container ready)
- **Duration**: ~90 minutes
- **Acceptance Criteria**:
  - ✅ S1: `POST /media/upload-url` → presigned PUT URL
  - ✅ S2: Client PUTs file directly to MinIO (outside backend)
  - ✅ S3: `POST /media/upload` or callback → INSERT metadata to PostgreSQL (index_status='pending')
  - ✅ S4: Celery task fetches file, calls AG-01 `/embed/image`, gets vector, INSERTs into Milvus
  - ✅ S5: UPDATE index_status='ready' after successful index
  - ✅ Idempotency: `Idempotency-Key` header prevents duplicate processing (24h TTL)
  - ✅ Compensating action: nếu PostgreSQL insert lỗi ở S3, xóa MinIO object

### T003-04: [workflow:search] Privacy-Aware Search
- **Priority**: P0
- **Dependencies**: T003-01, T001-01 (PostgreSQL friends), T001-02 (Milvus), T002-03 (AG-01 /embed/image ready)
- **Duration**: ~60 minutes
- **Acceptance Criteria**:
  - ✅ `POST /vector/search/hybrid` → hybrid ANN + metadata filter
  - ✅ Privacy filter logic: nếu privacy_level=0 chỉ user có quyền; =1 chỉ friends; =2 public
  - ✅ Filter expression recursive (and/or/leaf nodes)
  - ✅ Metadata enrichment từ PostgreSQL (user_id, album_id, created_at)
  - ✅ Signed GET URLs trả về để client có thể access ảnh

### T003-05: [workflow:media] Album & Media CRUD
- **Priority**: P1
- **Dependencies**: T003-02 (auth)
- **Duration**: ~45 minutes
- **Acceptance Criteria**:
  - Create album, list albums, update album title/is_public
  - List images in album with pagination
  - Soft delete images (set deleted_at timestamp, not hard delete)
  - Privacy level update on existing images

### T003-06: [workflow:evaluation] Evaluation Service
- **Priority**: P1
- **Dependencies**: T003-04 (search ready)
- **Duration**: ~30 minutes
- **Acceptance Criteria**:
  - `POST /admin/reindex` → trigger bulk reindex (202 Accepted)
  - `GET /eval/metrics` → return MRR, HitRate@K, Precision@K, Recall

### T003-07: [workflow:health] Health Probes
- **Priority**: P0
- **Dependencies**: T003-01
- **Duration**: ~20 minutes
- **Acceptance Criteria**:
  - `GET /health/liveness` → 200 OK (process running)
  - `GET /health/readiness` → 200 (all deps ready) or 503 (deps not ready)
  - Header `X-Expected-Vector-Dim: 512` returned on readiness check
  - Readiness checks: postgres, milvus, minio, ai_service, redis

---

## 🔗 Critical Integration Points

### With AG-01 (AI Service)
- **Endpoint calls**:
  - `POST http://AI_SERVICE_URL/embed/image` → upload image file, get vector[512]
  - `POST http://AI_SERVICE_URL/embed/text` → send {"query_text": "..."}, get vector[512]
- **Health check**:
  - Call `GET http://AI_SERVICE_URL/health/readiness` and read header `X-Expected-Vector-Dim`
  - If header says 512 but AG-01 returns 768-dim vector, that's a mismatch → error code ERR_VECTOR_DIM_MISMATCH
- **Error handling**: If AI Service is down, readiness probe should return 503

### With AG-02 (Storage)
- **PostgreSQL**: Connect via DATABASE_URL (asyncpg)
- **Milvus**: Connect via MILVUS_HOST:MILVUS_PORT (pymilvus)
- **MinIO**: Connect via MINIO_ENDPOINT + keys (minio-py)
- **Redis**: Connect via REDIS_URL (aioredis) for idempotency cache
- **Health checks**: All 4 must be up for readiness → 200

### With Frontend (AG-04, AG-05)
- Consume all endpoints per openapi.yaml
- JWT token validation on protected routes
- Presigned URL flow: client gets URL, PUTs directly to MinIO, then notifies backend

---

## ⚙️ Configuration & Environment

Create `.context/env_templates/backend.env.example`:
```ini
# Backend Service Config
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=false

# Database
DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/sise_db

# AI Service (AG-01)
AI_SERVICE_URL=http://ai-service:8001

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false

# Milvus
MILVUS_HOST=milvus
MILVUS_PORT=19530

# Redis (for idempotency cache)
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# Celery
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
```

---

## 📚 Key References

1. **Data Schema**: `.context/data_schema.yaml` — source of truth for vector_dim, database schema, idempotency, transaction semantics
2. **OpenAPI Contract**: `.context/openapi.yaml` — all endpoint specs, request/response schemas, error codes
3. **Architecture**: `.knowledge/shared/Workflow_Centric_Architecture.md` — 5-layer rules, anti-patterns, workflow naming
4. **AG-01 Completion Report**: `.context/Sessions/Session_20260513_03.md` — AI Service delivery status, vector validation results
5. **Agent Boundaries**: `.context/agent_boundaries.yaml` — your write/read permissions, forbidden actions

---

## ✅ Delivery Checklist

Before marking T003-* as done:
- [ ] Code follows 5-layer architecture (configs → entities → adapters → services → routers)
- [ ] All file names have workflow prefix (`auth_`, `upload_`, etc.)
- [ ] `__init__.py` exports via `__all__` in each layer
- [ ] No hard-coded secrets or env values
- [ ] All adapters injected via constructor
- [ ] No circular dependencies
- [ ] All tests pass (`pytest`)
- [ ] `Log_03.md` updated with event summary
- [ ] `Skill_03.md` updated if unexpected issues encountered
- [ ] Code ready for PR review

---

## 🚀 Ready to Start?

1. ✅ Clone/checkout Phase 3 branch (if using feature branches)
2. ✅ Read this guide completely
3. ✅ Read `.github/agents/BackendModuleAgent.agent.md`
4. ✅ Read `.knowledge/shared/Workflow_Centric_Architecture.md`
5. ✅ Review `.context/data_schema.yaml`, `.context/openapi.yaml`
6. ✅ Start with T003-01 (scaffold)
7. ✅ Execute tasks in workflow-centric order: T003-02 → T003-03 → T003-04 → ...
8. ✅ Keep `.knowledge/agent03/Log_03.md` updated during work
9. ✅ Commit daily to Git, push to origin master when complete

**Good luck, AG-03! You've got this.** 🎯

---

*Handoff document prepared by AG-00 on 2026-05-13.*  
*Phase 3 ready to launch.*
