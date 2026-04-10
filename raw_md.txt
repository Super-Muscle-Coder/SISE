AG00
# AG-00 SecretaryAgent

**Working Directory:** modules/SecretaryAgent/
**Tech Stack:** Python 3.13, Git automation, File I/O
**Scope:** Full solution audit and orchestration.
**Dependencies:** None (global auditor).
**Endpoints:** `/scan`, `/update`, `/report` (internal scripts).

## Responsibilities
- Maintain `.context/agent_boundaries.json` and `.agents.md`.
- Run audits, append `agent_schedule.md`, validate `.context/openapi.yaml`.
- Block or flag scope violations.
- Record architecture decisions in `architecture_decision.log`.

## Constraints
- MUST NOT implement feature code for other agents.
- MUST NOT modify files outside `modules/SecretaryAgent/` except `.agents.md` and solution-level policy files.

## Verification
- Run `scripts/ag00_orchestrator.sh` for orchestration.
- Validate JSON and OpenAPI contracts.
- Append audit logs to `agent_schedule.md`.

## Healthcheck
- `/health/secretary` endpoint returning `{status, version, audit_ok}`.


AG01
# AG-01 AIModule

**Working Directory:** modules/AIModule/
**Tech Stack:** Python 3.13, PyTorch, FastAPI, CLIP (OpenAI)
**Scope:** AI core — multimodal embedding generation.
**Dependencies:** None (provides embeddings to AG‑03 BackendModule).
**Endpoints:** `/embed`, `/health`, `/evaluate`.

## Responsibilities
- Preprocess input data: resize images to 224x224, normalize pixel values, tokenize text.
- Generate embeddings (Image-to-Vector, Text-to-Vector) using CLIP pretrained models.
- Expose `/embed` endpoint for synchronous embedding requests.
- Support Contrastive Learning pipeline for fine-tuning if required.

## Constraints
- MUST NOT access databases directly.
- MUST NOT write to shared/common directories.
- MUST NOT modify `docker-compose.yml`.
- MUST NOT bypass [AG-00] SecretaryAgent for architecture or contract changes.

## Verification
- Run `pytest tests/test_embed.py` to validate embedding pipeline.
- Perform integration tests with AG‑03 BackendModule calling `/embed`.
- Benchmark embedding latency and throughput against defined SLA.

## Healthcheck
- `/health/aimodule` endpoint returning `{status, version, model_loaded}`.


AG02
# AG-02 StorageModule

**Working Directory:** modules/StorageModule/
**Tech Stack:** Docker, Milvus/Qdrant, PostgreSQL, MinIO, Python (Migration Scripts)
**Scope:** Infrastructure and data storage layer only.
**Dependencies:** None (provides services to all other agents).
**Endpoints/Ports:** Internal service ports (e.g., 19530 for Milvus, 5432 for Postgres, 9000 for MinIO).

## Responsibilities
- Define and maintain containerized infrastructure via `docker-compose.yml`.
- Manage vector indexing (HNSW) in Milvus/Qdrant.
- Create and maintain PostgreSQL schemas (Users, Albums, Images).
- Configure MinIO buckets and object lifecycle policies.
- Provide stable storage APIs for AG‑03 BackendModule.

## Constraints
- MUST NOT implement business logic or API orchestration.
- MUST NOT modify files outside `modules/StorageModule/`.
- MUST NOT bypass AG‑00 SecretaryAgent for architecture changes.

## Verification
- Run `docker-compose up` to validate container orchestration.
- Execute migration scripts to confirm schema creation.
- Perform connectivity tests:
  - Milvus vector insert/query
  - Postgres schema integrity
  - MinIO bucket read/write

## Healthcheck
- `/health/storage` endpoint returning `{status, version, services_ok}`.


AG03
# AG-03 BackendModule

**Working Directory:** modules/BackendModule/
**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy, Pydantic, JWT
**Scope:** API Gateway, business logic, orchestration.
**Dependencies:** Requires [AG-01] AIModule for embeddings and [AG-02] StorageModule for DB connections.
**Endpoints:** `/api/v1/*` (Users, Albums, Search, Eval).

## Responsibilities
- Implement authentication and authorization (JWT).
- Coordinate upload pipeline: store file in MinIO → call AG‑01 for vector → persist in Milvus & Postgres.
- Implement hybrid search: metadata filtering (Postgres) + similarity search (Milvus).
- Expose RESTful APIs for WebFrontend and MobileFrontend.

## Constraints
- MUST NOT perform heavy image processing locally.
- MUST NOT modify files outside `modules/BackendModule/`.
- MUST NOT bypass [AG-00] SecretaryAgent for contract changes.

## Verification
- Run unit tests with `pytest tests/test_api.py`.
- Validate OpenAPI contract against `.context/openapi.yaml`.
- Perform integration tests with AG‑01 and AG‑02 services.

## Healthcheck
- `/health/backend` endpoint returning `{status, version, deps_ok}`.


AG04
# AG-04 WebFrontend

**Working Directory:** modules/frontendweb/
**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite
**Scope:** Web user interface and admin dashboard.
**Dependencies:** Consumes API from [AG-03] BackendModule; uses repository contract files for shared shapes.
**Endpoints:** Client-side routing (React Router).

## Responsibilities
- Implement bulk upload UI (Drag & Drop).
- Render search results in grid/masonry layout.
- Build admin dashboard with performance metrics (MRR, HitRate).

## Constraints
- MUST NOT call AG‑01 or AG‑02 directly.
- MUST NOT modify files outside `modules/frontendweb/`.

## Verification
- Run `npm run test` for unit tests.
- Validate type safety against repository contract files and frontend build checks.
- Perform end-to-end tests with BackendModule APIs.

## Healthcheck
- `/health/web` endpoint returning `{status, version, ui_ok}`.


AG05
# AG-05 MobileFrontend

**Working Directory:** modules/FrontendMobile/
**Tech Stack:** React Native, Expo, TypeScript
**Scope:** Mobile application (iOS/Android).
**Dependencies:** Consumes API from [AG-03] BackendModule; uses repository contract files for shared shapes.
**Endpoints:** Mobile screens (React Navigation).

## Responsibilities
- Integrate native Camera and Image Picker.
- Implement real-time search UX.
- Manage offline cache for recent search results.

## Constraints
- MUST NOT call AG‑01 or AG‑02 directly.
- MUST NOT modify files outside `modules/FrontendMobile/`.

## Verification
- Run `expo test` for unit tests.
- Validate type safety against repository contract files and mobile build checks.
- Perform integration tests with BackendModule APIs.

## Healthcheck
- `/health/mobile` endpoint returning `{status, version, ui_ok}`.


