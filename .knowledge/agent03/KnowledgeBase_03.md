# KnowledgeBase_03.md

## Metadata  
- **id**: KB_AG03_01
- **title**: API Gateway & Orchestration Knowledge Base (Backend Module)
- **version**: 1.0.0
- **created_at**: 2026-05-09
- **created_by**: Project Owner
- **last_updated**: 2026-05-09
- **last_reviewed**: 2026-05-09
- **review_owner**: AG-00 Auditor
- **status**: active
- **visibility**: internal
- **retention_policy_days**: 365

---

## Scope and Purpose  
- **scope_summary**: Details the functional constraints for the FastAPI Backend. AG-03 operates as the primary architectural orchestrator, routing data between Frontend interfaces, the AI Service, and Infrastructure layers. It oversees Authorization, Schema Validation, Routing, and Background Task handling.
- **dos_reference**: 
  - Section 2.3: The Backbone (Backend & API Service).
  - Section 3: UPLOAD AND SEARCH FLOWS (Data processing execution paths).

---

## Core Concepts  
- **Async-First Execution**: All I/O operations—database queries, external HTTP calls—must utilize standard Python Asyncio (`await`). Blocking operations that interrupt the FastAPI event loop are strictly prohibited.
- **Presigned Upload Intermediation**: The monolithic application tier does not accept binary image streams. It strictly provisions presigned URLs (via MinIO) forcing direct-to-storage Client uploads. Subsequent indexing utilizes a Celery Task queue mechanism.
- **Stateless JWT Authentication**: Validates users natively without database lookup, enabling efficient extraction of `userId` parameters mandated by Privacy-Aware Search. (Exception: Revocation lists handled occasionally through Redis).
- **Idempotent Identifiers**: Operations entailing state mutations (or subsequent billing modules) necessitate an `Idempotency-Key` header, validating uniqueness via a Redis cache lock.

---

## Trusted References  
1. **FastAPI Official Documentation**
   - title: Dependency Injection & Async Architecture
   - url: https://fastapi.tiangolo.com/
   - type: Official Docs
   - trust_level: High
   - notes: Structural guideline for the application layer.
2. **Celery Worker Configuration**
   - title: Background Tasks vs Celery
   - url: https://docs.celeryq.dev/en/stable/getting-started/first-steps-with-celery.html
   - type: Official Docs
   - trust_level: High
   - notes: Architecture references for decoupling lengthy embedding processes.
3. **Pydantic Validation Patterns**
   - title: Pydantic V2 Usage
   - url: https://docs.pydantic.dev/latest/
   - type: Official Docs
   - trust_level: High
   - notes: Data verification practices protecting application boundaries.

---

## Internal References  
- `E:\SISE\.context\DOS.md`: The ultimate system guideline.
- `E:\SISE\.context\openapi.yaml`: Mandatory adherence required for Endpoint Routes, Inputs, and Response definitions.
- `E:\SISE\.context\data_schema.yaml`: Blueprint for all internal Pydantic modeling.
- `E:\SISE\.knowledge\agent03\Skill_03.md`: Playbooks mapping event loop blockages and Celery broker disconnections.

---

## Do Not Do  
- ALTER SCHEMAS OR CONTRACTS: Modifications to properties, routes, or HTTP verbs must originate in `openapi.yaml`. Backend engineers cannot unilaterally expose undocumented endpoints.
- EMBED AI/CV LIBRARIES DIRECTLY: Do not invoke `torch` or `clip.predict()` within the AG-03 context. Delegate all ML inference strictly via internal HTTP calls to the `ai-service` (AG-01).

---

## Provenance and Change Log  
- 2024-05-18 | Project Owner + AI | Translated | Converted to professional technical English.

---

## Validation Hooks  
- The startup sequence mandates a passing validation from `GET /health/readiness` (Confirming AG-01, PG, and Milvus connectivity).
- Test suites must rigorously validate JWT structure via Pydantic model ingestion tests.

---

## Review Cadence  
- **review_interval_days**: 60
- **next_review_due**: 2026-07-09

---

## Tags and Search Metadata  
- **tags**: [fastapi, backend, python, celery, api-gateway, orchestration]
- **keywords**: async, jwt, presigned-url, pydantic, routing, idempotency, stateless
- **canonical_id**: kb.ag03.be.1
