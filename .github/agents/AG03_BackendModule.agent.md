---
name: AG-03 BackendModule
description: Backend API agent for authentication, orchestration, and search workflows in SISE.
---

# AG-03 BackendModule

**Working Directory:** /modules/BackendModule/
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
- MUST NOT modify files outside `/modules/BackendModule/`.
- MUST NOT bypass [AG-00] SecretaryAgent for contract changes.

## Verification
- Run unit tests with `pytest tests/test_api.py`.
- Validate OpenAPI contract against `.context/openapi.yaml`.
- Perform integration tests with AG‑01 and AG‑02 services.

## Healthcheck
- `/health/backend` endpoint returning `{status, version, deps_ok}`.


