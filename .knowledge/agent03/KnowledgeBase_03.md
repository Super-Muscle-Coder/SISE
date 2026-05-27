# KnowledgeBase_03.md

*Tài liệu Tri Thức Công Nhân cho AG-03 BackendModule* - Lưu trữ tri thức, kỹ năng, và tiến độ delivery của Backend API Service.

---

## Metadata

| Trường | Giá Trị |
|--------|--------|
| **id** | KB-03 |
| **title** | AG-03 BackendModule Knowledge Base |
| **version** | 1.0.0 |
| **created_at** | 2026-05-09 |
| **created_by** | AG-03 |
| **last_updated** | 2026-05-09 |
| **last_reviewed** | 2026-05-09 |
| **review_owner** | AG-00 (Project Owner) |
| **status** | active |
| **visibility** | internal |
| **retention_policy_days** | 365 |

---

## Scope and Purpose

### Scope Summary
AG-03 BackendModule chịu trách nhiệm xây dựng toàn bộ FastAPI backend layer cho SISE hệ thống. Bao gồm:
- **Authentication & Authorization**: JWT-based register/login, token validation middleware
- **Upload Pipeline**: 5-step transaction pipeline với idempotency và compensating actions
- **Search Service**: Privacy-aware image/text search với metadata enrichment  
- **Media CRUD**: Album và image management với soft delete
- **Evaluation Service**: Tính toán MRR, HitRate@K, Precision@K, Recall
- **Health Probes**: Liveness/Readiness checks với dependency validation
- **Orchestration**: Điều phối giữa AI Service (AG-01), Storage (AG-02), Frontend (AG-04/05)

### DOS References
- **.context/DOS.md § 3**: Role & Scope của AG-03
- **.context/openapi.yaml**: API contract endpoints
- **.context/data_schema.yaml**: Data model, vector dimensions (512), transaction semantics
- **.context/agent_boundaries.yaml**: Write/read permissions, forbidden actions

---

## Core Concepts

### 1. Workflow-Centric 5-Layer Architecture
configs/ → entities/ → adapters/ → services/ → routers/

- **configs/**: Environment variables, templates (*.env.example, *.env.local)
- **entities/**: Pydantic models, dataclasses (prefix: [workflow]_entities.py)
- **adapters/**: Config loading, external integration (prefix: [workflow]_adapters.py)
- **services/**: Business logic, orchestration (prefix: [workflow]_services.py)
- **routers/**: FastAPI route handlers (prefix: [workflow]_routers.py)

### 2. Vector Dimension: 512
- Global constant (data_schema.yaml), enforced at startup
- CLIP ViT-B/32 produces 512-dim embeddings
- Read from VECTOR_DIM env var, not hardcoded

### 3. Presigned URL TTL: 3600s
- MinIO presigned URLs, configurable via PRESIGNED_URL_EXPIRY_SEC
- Can adjust per environment in .env files

### 4. Idempotency Pattern
- Idempotency-Key header (UUID), cached in Redis
- Prevents duplicate uploads, indexing, searches
- Cached response for duplicate keys within TTL

### 5. Upload Pipeline (5 Steps)
1. POST /upload → presigned MinIO URL
2. User PUT image to MinIO
3. Backend receives callback → insert metadata (PostgreSQL)
4. Backend enqueue Celery → embed via AG-01
5. Backend index to Milvus → mark indexed

**Compensating Actions**: If PostgreSQL insert fails → delete MinIO object. If Milvus fails → retry.

### 6. Privacy-Aware Search
- Privacy Level 1: Own + friend's shared images
- Privacy Level 2: Own only
- Filter via JOIN with friends table before Milvus query

### 7. Error Handling (openapi.yaml)
- 400: Invalid params
- 401: Missing/invalid JWT
- 403: Permission denied
- 404: Not found
- 409: Conflict (duplicate key)
- 503: Downstream unavailable
- 5xx: Internal error + request_id

### 8. Delete Semantics
- Soft-delete in PostgreSQL (deleted_at)
- Async hard-delete from MinIO + Milvus
- All-or-nothing: no partial deletes

---

## Trusted References

| Title | Location | Trust Level |
|-------|----------|-------------|
| OpenAPI Specification | .context/openapi.yaml | ★★★★★ |
| Data Schema | .context/data_schema.yaml | ★★★★★ |
| DOS Document | .context/DOS.md | ★★★★★ |
| Agent Boundaries | .context/agent_boundaries.yaml | ★★★★★ |
| FastAPI Docs | https://fastapi.tiangolo.com/ | ★★★★☆ |
| SQLAlchemy 2.0 | https://docs.sqlalchemy.org/20/ | ★★★★☆ |
| Pydantic v2 | https://docs.pydantic.dev/2.0/ | ★★★★☆ |
| pymilvus | https://milvus.io/docs/ | ★★★★☆ |
| Celery | https://docs.celeryproject.io/ | ★★★★☆ |
| python-jose | https://python-jose.readthedocs.io/ | ★★★☆☆ |

---

## Do Not Do

### Forbidden Actions
- ❌ Modify Milvus/PostgreSQL schemas (AG-02 owns)
- ❌ Write to other agents' directories
- ❌ Import heavy ML libs (TensorFlow, CLIP) → delegate to AG-01
- ❌ Hardcode secrets (JWT_SECRET, DB creds) → use environment
- ❌ Log PII (emails, tokens, paths) → only log request_id, status
- ❌ Modify .context/ files (read-only)
- ❌ Image processing (delegate to AI Service)
- ❌ Use: pandas, tensorflow, flask

### Anti-Patterns
- ❌ Sync database calls (use asyncio + asyncpg)
- ❌ Blocking I/O in routes
- ❌ Duplicate idempotency logic
- ❌ Hardcode VECTOR_DIM=512 literal
- ❌ Partial deletes across systems

---

## Provenance and Change Log

| Date | Author | Change | Impact |
|------|--------|--------|--------|
| 2026-05-09 | AG-03 | Scaffold complete (T003-01) | Ready for auth (T003-02) |
| (pending) | AG-03 | Auth workflow (T003-02) | Unblocks upload+search |
| (pending) | AG-03 | Upload pipeline (T003-03) | E2E ingestion ready |
| (pending) | AG-00 | Weekly audit | Review & update Log_03.md |

---

## Validation Hooks (CI/CD)

### Pre-Commit
- pytest tests/ (>90% coverage)
- mypy --strict (type checking)
- black --check (formatting)
- flake8 (linting, max 120 chars)
- No PII in logs

### Pre-Merge
- OpenAPI schema validation
- Vector dim check: VECTOR_DIM==512
- Docker build success
- E2E integration test

---

## Review Cadence

| Item | Interval | Owner | Next Due |
|------|----------|-------|----------|
| KnowledgeBase_03.md | Weekly | AG-00 | 2026-05-16 |
| Skill_03.md | On-demand | AG-03 | When issues arise |
| Log_03.md | Per workflow | AG-03 | After T003-02 |
| Code coverage | Per PR | CI/CD | Continuous |

---

## Tags and Search Metadata

**Tags**: scaffold, auth, upload, search, media, evaluation, health, 5-layer, FastAPI, async, JWT, vector-search, privacy-aware

**Integration**: AG-01 (AI Service), AG-02 (Storage), AG-04/05 (Frontend)

**Systems**: PostgreSQL, Milvus, MinIO, Redis, Celery

**Compliance**: Privacy, Idempotency, Soft-delete, Compensating-actions, JWT-auth, No-PII-logging

---

## Workflow Deliverables Summary

### ✅ T003-01: Scaffold Workflow — COMPLETE
- **Files**: modules/BackendModule/ foundation structure
- **Completion**: Backend 5-layer architecture (configs, entities, adapters, services, routers)
- **Status**: Green — all scaffold tests pass
- **Key Deliverables**: 
  - FastAPI app factory with lifespan hooks
  - Config management via environment variables
  - Dependency injection via @lru_cache
  - __init__.py exports following package API convention
  - Base entities, adapters, services, routers for extension

### ✅ T003-02: Auth Workflow — COMPLETE  
- **Files**: modules/BackendModule/app/{entities, adapters, services, routers}/auth_*.py
- **Endpoints**: POST /auth/register, POST /auth/login, GET /auth/me
- **Status**: Green — all auth tests pass, JWT token validation middleware active
- **Key Deliverables**:
  - User registration with email/password (bcrypt hashing)
  - Login with JWT token generation (HS256 signature)
  - Protected route middleware via @require_auth
  - Token refresh and expiry semantics
  - Password validation (min 8 chars, regex)
  - Email uniqueness enforcement

### ✅ T003-03: Upload Workflow — SCAFFOLD COMPLETE
- **Files**: modules/BackendModule/app/{entities, adapters, services, routers, tasks}/upload_*.py
- **Endpoints**: POST /media/upload-url, POST /media/upload/confirm, GET /media/{image_id}, GET /media, DELETE /media/{image_id}/delete
- **Status**: Scaffold structure in place — integration/runtime wiring pending
- **Key Deliverables**:
  - 5-step upload pipeline (S1-S5) with transaction semantics
  - Presigned URL generation via MinIO adapter
  - Idempotency key caching via Redis adapter
  - Upload confirmation with metadata commit to PostgreSQL
  - Celery async tasks for embedding and indexing (S4-S5)
  - Compensating actions on failure
  - Privacy-level enum and tag validation
  - Soft-delete semantics for images

### ⏳ T003-04: Search Workflow — PENDING
- **Scope**: Privacy-aware image/text search with Milvus
- **Expected Files**: search_{entities, adapters, services, routers}.py
- **Blockers**: None (upload scaffold complete)

### ⏳ T003-05: Media CRUD — PENDING
- **Scope**: Complete image metadata management (read/update)
- **Expected Files**: media_{entities, adapters, services, routers}.py

### ⏳ T003-06: Evaluation Service — PENDING
- **Scope**: Compute MRR, HitRate@K, Precision@K, Recall
- **Expected Files**: evaluation_{entities, adapters, services, routers}.py

### ⏳ T003-07: Health Probes — PENDING
- **Scope**: /health/liveness, /health/readiness with dependency checks
- **Expected Files**: health_{entities, adapters, services, routers}.py

---

## Integration Checklist (Post-Scaffold)

### Immediate Next Steps (Upload Wiring)
1. [ ] Implement `get_upload_service()` DI with real MinIO/Redis/PostgreSQL clients
2. [ ] Register upload_routers in app/main.py
3. [ ] Replace Celery task placeholders with real AI Service + Milvus calls
4. [ ] Execute test_upload_workflow.py end-to-end
5. [ ] Implement PUT /media/{image_id}/update endpoint
6. [ ] Update Log_03.md with upload runtime validation results

### Quality Gates  
- ✅ Pydantic schema validation (size, content-type, privacy level, tags)
- ✅ 5-layer architecture compliance (no cross-layer imports)
- ✅ OpenAPI contract alignment (exact endpoint/response mapping)
- ✅ Idempotency enforcement (Redis caching, no duplicates)
- ✅ Data-schema constraints (vector_dim=512, max_file_size_mb=20)
- ⏳ Runtime integration (MinIO presigned URLs, async PostgreSQL, Celery indexing)
- ⏳ Error handling (compensating actions, retry semantics)
- ⏳ Privacy filtering (friends table JOIN before Milvus)

---

**Status**: 🟡 IN PROGRESS — Scaffold + Auth complete; Upload scaffold ready for integration
**Last Updated**: 2026-05-09
**Next Review**: 2026-05-16
**Last Reviewed**: 2026-05-09
