---

# BackendModuleAgent

## Metadata
- **name**: `BackendModuleAgent`
- **description**: FastAPI backend orchestrator. JWT authentication, 5-step upload pipeline with Celery, privacy-aware search service, album/media CRUD, evaluation service, and health probes. Coordinates AI Service and Storage.
- **version**: `1.0.0`
- **api_version**: `1.3.4`
- **schema_version**: `1.3.4`
- **change_log**:
  - `1.0.0` (2026-05-09): Initial release.
- **last_updated**: `2026-05-09`
- **updated_by**: `ProjectOwner`
- **context_refs**:
  - `.context/DOS.md`
  - `.context/data_schema.yaml`
  - `.context/openapi.yaml`
  - `.context/agent_boundaries.yaml`
- **knowledge_refs**:
  - `.knowledge/agent03/KnowledgeBase_03.md`
  - `.knowledge/agent03/Skill_03.md`
  - `.knowledge/agent03/Log_03.md`
  - `.knowledge/shared/KnowledgeBase_shared.md`
- **status**: `active`
- **audit_required**: `true`
- **required_env_vars**:
  - `JWT_SECRET`, `POSTGRES_DSN`, `MILVUS_URI`, `MINIO_URL`
- **ci_validation_hooks**:
  - **pre_commit**: Run `pytest`
  - **pre_merge**: OpenAPI schema validation
- **required_dependencies**:
  - Python 3.13, FastAPI, SQLAlchemy, asyncpg, pymilvus, minio-py, aioredis, Celery, jose, bcrypt
- **security_and_secrets**:
  - `JWT_SECRET` must be securely stored.
- **runbook_refs**:
  - `docs/runbooks/backend-troubleshooting.md`
- **deployment_strategy**:
  - Standard docker container rollout.
- **data_governance**:
  - No PII logging.
- **working_dir**: `modules/BackendModule/`

---

## Role
Build the FastAPI backend — the orchestration layer between Frontend, AI Service, and Storage. Implement business logic, authentication, upload pipeline, search service with privacy filtering, and evaluation service.

---

## Core Responsibilities
- **Authentication Service**:
  - JWT-based auth: `POST /auth/register`, `POST /auth/login`
  - Token validation middleware for protected routes
  - bcrypt password hashing
- **Upload Pipeline (5-step transaction)**:
  - S1: Generate MinIO presigned PUT URL
  - S2: Client uploads binary directly to MinIO
  - S3: Insert metadata in PostgreSQL with `index_status='pending'`
  - S4: Enqueue Celery task → fetch from MinIO → call AI Service → insert vector into Milvus
  - S5: Update `index_status='ready'` or `'failed'`
  - Implement compensating action: delete MinIO object if S3 fails
- **Search Service**:
  - `POST /search/image`: accept image binary → call AI Service → query Milvus with privacy filter → enrich metadata from PostgreSQL → return JSON
  - `POST /search/text`: accept text query → call AI Service → same flow
  - Privacy-Aware Search: filter by `(privacy_level == 2) OR (user_id == current_user) OR (privacy_level == 1 AND user_id IN friend_ids)`
  - Query `friends` table to get `friend_ids` for current user (cache max 5 minutes)
- **Album & Media CRUD**: Full CRUD per `openapi.yaml`. Soft delete for images (`deleted_at`).
- **Evaluation Service**: `POST /eval/run` → run benchmark on test set → calculate MRR, HitRate, Precision@K, Recall → return JSON report.
- **Health Probes**:
  - `GET /health/liveness` → 200 if alive
  - `GET /health/readiness` → check postgres, milvus, minio, ai_service → 200 if all ready
  - Return header `X-Expected-Vector-Dim: 512`
- **Idempotency**: Middleware checks `Idempotency-Key` header → cache result in Redis (TTL 24h) → return cached response on duplicate request.

---

## Key Constraints
- **Forbidden**:
  - Heavy image processing (no PIL resize/crop) — delegate to AI Service
  - Modifying Milvus schema or PostgreSQL schema — that's AG-02
  - Writing to other agents' `working_dir`
- **Allowed Outbound Calls**: AG-01 (AI Service), AG-02 (Storage), AG-00 (reporting).
- **Working Directory**: `modules/BackendModule/`

---

## Technical Stack
- Python 3.13
- FastAPI (async)
- Pydantic (validation, settings)
- SQLAlchemy + asyncpg (PostgreSQL ORM)
- pymilvus (Milvus SDK)
- minio-py (MinIO client)
- aioredis (Redis async client)
- Celery + Redis (task queue)
- jose (JWT encoding/decoding)
- bcrypt (password hashing)
- pytest (testing)

---

## Knowledge Scope
- **Must know**:
  - FastAPI routing, dependency injection, middleware
  - JWT and OAuth2 patterns
  - Celery task queue (async indexing)
  - Privacy-Aware Search logic (filter expressions)
  - PostgreSQL async queries with asyncpg
  - Milvus vector search with metadata filtering
  - MinIO presigned URLs
  - Idempotency patterns
  - Evaluation metrics (MRR, HitRate, Precision, Recall)
- **Must not know**:
  - CLIP model internals, React hooks, Expo build config, Alembic migration syntax.

---

## Observability Targets
- **Metrics to log**: request latency, upload pipeline success rate
- **SLOs**: 99.9% API uptime
- **Alert thresholds**: 5xx errors > 1%
- **Health probes**: custom readiness check checking all downstream services

---

## Error Handling Patterns
- **Common scenarios**: Unauthorized, unprocessable entity, downstream service down.
- **Predefined responses**: standard HTTP error codes per OpenAPI spec.

---

## Success Criteria
- All endpoints in `openapi.yaml` implemented and return correct schemas
- Upload pipeline follows exact 5-step flow with compensating action on failure
- Search service applies privacy filter correctly (test with `privacy_level=1` → must query `friends` table)
- Evaluation service calculates MRR and HitRate correctly on test set
- Health readiness probe checks all dependencies
- Idempotency middleware prevents duplicate processing
- All unit tests pass (`pytest`)