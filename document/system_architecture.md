# SISE System Architecture V1.3.4

This document is a **production‑grade operational blueprint** for the Smart Image Search Engine (SISE). It uses precise technical terminology and unambiguous operational semantics so developer agents and automation (Codex) can implement ingestion, inference, indexing, search, monitoring, and recovery deterministically.

---

## Overview

- **Purpose:** Single source of truth for ingestion, embedding, ANN indexing, privacy enforcement, observability, and operational playbooks.  
- **Primary components:**  
  - **AG‑03 Backend:** API gateway, presign, metadata orchestration.  
  - **AG‑01 AIModule:** inference workers (CLIP encoder).  
  - **AG‑02 StorageModule:** MinIO object store, Milvus vector DB, PostgreSQL metadata.  
  - **Celery / Redis:** task queue and broker.  
  - **AG‑00 Orchestrator:** orchestration and ops automation.  
- **Design principles:** asynchronous ingestion for heavy AI workloads; idempotent operations for safe retries; structured filter contract for privacy enforcement; explicit transaction semantics and compensating actions; observable metrics and deterministic runbooks.

---

## Sequence Flow

### Upload and Index Sequence
1. **Client → AG‑03:** `POST /media/upload-url` with optional `Idempotency-Key`.  
2. **AG‑03:** validate request, return `PresignedUploadResponse` containing `upload_url`, `object_key`, `expires_in_sec`, `max_file_size_mb`, `allowed_content_types`.  
3. **Client → MinIO:** PUT file to `upload_url`.  
4. **Client → AG‑03:** notify upload completion or AG‑03 verifies object existence; AG‑03 inserts `images` row with `index_status = pending`.  
5. **AG‑03:** enqueue Celery job with payload `{ image_id, object_key, user_id, privacy_level, idempotency_key }`.  
6. **AG‑01 worker:** fetch object from MinIO, run CLIP encoder, produce normalized vector, insert vector and metadata into Milvus, update PostgreSQL `images.index_status = ready` or `failed`.  
7. **AG‑03:** on `ready` generate signed GET URL and return to client; on `failed` keep `index_status = failed` and schedule retry per retry policy.

### Reindex Sequence
- **Admin → AG‑03:** `POST /admin/reindex` with `batch_size` and `resume_token`.  
- **AG‑03:** spawn batch jobs; workers recompute embeddings and write to Milvus; validate sample batches; mark progress via resume token.

---

## Transaction Semantics and Idempotency

### Transaction model
- **Compensating actions**
  - If metadata insert fails after successful upload → **delete MinIO object** and invalidate idempotency key.  
  - If Milvus indexing fails → **set `images.index_status = failed`** and schedule retries; do not delete metadata immediately.  
- **Atomicity objective:** avoid silent divergence between object store, vector index, and metadata. Every state transition must be observable via `index_status` and job logs.

### Idempotency semantics
- **Header:** `Idempotency-Key` (UUID).  
- **Scope:** per authenticated user.  
- **Storage:** Redis key mapping `Idempotency-Key -> { job_id, status, payload_hash, created_at }`.  
- **TTL:** 24 hours recommended.  
- **Duplicate behavior**
  - If payload hash matches stored payload → return stored `job_id` and stored response; do not re-enqueue.  
  - If payload differs → return HTTP `409 Conflict` with `StandardError` describing mismatch.  
- **Canonical dedup key:** use `image_id` as the canonical dedup key across Postgres, MinIO, and Milvus.

---

## Filter Expression and Privacy Enforcement

### Filter contract
- **Schema:** recursive JSON object using `and` and `or` arrays or leaf objects `{ field, op, value }`.  
- **Supported operators:** `eq`, `in`, `gt`, `lt`, `contains`. Use `contains` for JSONB array membership such as `tags`.  
- **Canonical examples**
  - **Public only**
    ```json
    { "field": "privacy_level", "op": "in", "value": [2] }
    ```
  - **User or public**
    ```json
    { "or": [ { "field": "privacy_level", "op": "in", "value": [2] }, { "field": "user_id", "op": "eq", "value": 123 } ] }
    ```
  - **Tags and public**
    ```json
    { "and": [ { "field": "tags", "op": "contains", "value": ["nature"] }, { "field": "privacy_level", "op": "in", "value": [2] } ] }
    ```

### Enforcement points
- **Backend validation:** AG‑03 must parse, validate, and canonicalize `FilterExpression` into a structured predicate object before any downstream use. Reject malformed filters with HTTP `400` and `Error.code = ERR_INVALID_FILTER`.  
- **Server side enforcement:** apply privacy filters at the StorageModule level (Milvus search filter or SQL predicate). Never rely on client or frontend enforcement.  
- **Type mapping:** backend must map `field` names to storage column types and validate `op` semantics (for example `contains` only for JSONB arrays).

---

## Health, Observability and Alerts

### Health probes
- **Liveness:** `/health/liveness` returns `200` when process is alive.  
- **Readiness:** `/health/readiness` returns per‑dependency status and header `X-Expected-Vector-Dim`. Readiness checks include:
  - PostgreSQL `SELECT 1` within 200 ms.  
  - Milvus collection existence and ping < 300 ms.  
  - MinIO list buckets success.  
  - Redis `PING` success.  
  - AI service model loaded and GPU memory available.

### Metrics and tracing
- **Key metrics**
  - `embedding_latency_ms` p50/p95/p99.  
  - `index_latency_ms` and `index_failure_rate`.  
  - `search_qps` and `search_latency_ms`.  
  - `recall_at_k` and `mrr_score` for evaluation.  
  - `queue_length` and `worker_utilization`.  
- **Tracing:** OpenTelemetry spans across AG‑03 → Celery → AG‑01 → Milvus. Include `trace_id`, `span_id`, `job_id`, `image_id` in logs.  
- **Logging:** structured JSON logs with consistent field names for automated parsing.

### Alerts and thresholds
- **Critical**
  - `index_failure_rate > 5%` sustained for 5 minutes → P1 incident.  
  - `queue_length > 1000` → P1 incident.  
  - `embedding_latency_ms p95 > 2000 ms` → P2 incident.  
- **Operational actions:** automatic paging for P1; run reindex or rollback playbook; scale workers for sustained high latency.

---

## Backup, Disaster Recovery, Testing and CI/CD

### Backup and disaster recovery
- **Postgres:** daily logical dumps via `pg_dump` stored in MinIO; WAL archiving enabled; retention 30 days.  
- **Milvus:** weekly collection snapshots; retention 8 weeks.  
- **MinIO:** lifecycle rules to transition raw images to cold storage after 180 days; replication for cross‑region durability.

### Restore playbook
1. Restore Postgres from latest dump and apply WAL as needed.  
2. Restore Milvus snapshot and validate vector counts.  
3. Reconcile MinIO objects and run reindex for missing vectors.  
4. Run smoke tests and validate MRR on a sample dataset.

### Testing matrix and CI/CD
- **Unit tests:** pytest for service modules.  
- **Contract tests:** OpenAPI validation on every PR.  
- **Integration tests:** local stack with Postgres, MinIO, Milvus, Redis for smoke tests.  
- **E2E smoke:** `scripts/tests/e2e_smoke.sh` performing Auth → Presign → Upload → Wait for index → Search → Validate.  
- **Load tests:** k6 or Locust for search QPS and embedding throughput.  
- **Benchmarking:** reproducible script to compute MRR and Recall@K; record `embedding_latency_ms` and `mrr_score`.  
- **CI pipeline:** lint → unit tests → contract validation → build images → integration smoke → push images → canary deploy → monitor metrics before full rollout.

### Operational runbooks
- **Index failure runbook**
  1. Inspect worker logs and Celery job trace for `job_id`.  
  2. If transient error, requeue job with exponential backoff.  
  3. If repeated failures, mark `images.index_status = failed` and create incident ticket.

- **MinIO outage runbook**
  1. Switch to degraded mode: accept metadata and queue uploads locally.  
  2. Retry uploads with exponential backoff; notify users of degraded state.  
  3. After MinIO recovery, reconcile queued uploads and resume indexing.

- **High latency runbook**
  1. Check queue length and worker utilization.  
  2. Scale AG‑01 workers or provision additional GPU capacity.  
  3. Throttle non‑critical background jobs until latency stabilizes.

---

## Security and Operational Constraints

### Secrets and network
- **Secrets:** do not store secrets in repo. Use Vault or cloud secret manager and inject via environment variables. Required env vars include `DATABASE_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MILVUS_HOST`, `REDIS_URL`, `JWT_SECRET`, `AI_MODEL_PATH`.  
- **Network:** place Postgres, Milvus, and MinIO in a private VPC; restrict inbound to backend and worker subnets. Use TLS for all inter‑service communication.

### RBAC and admin controls
- **Admin endpoints:** require role claim in JWT and additional authorization checks. `/admin/reindex` only accessible to admin role.  
- **Rate limiting:** apply per‑user rate limits on search and presign endpoints to protect backend resources.

---

## Appendix

### Readiness check pseudo commands
```text
Postgres: run SELECT 1 within 200ms
Milvus: client.has_collection('sise_v1') and ping < 300ms
MinIO: list_buckets() success
Redis: PING
AI service: model loaded and GPU memory available
```

### Quick operational commands
```bash
# Validate OpenAPI
npx @apidevtools/swagger-cli validate openapi.yaml

# Run e2e smoke locally
chmod +x scripts/tests/e2e_smoke.sh
./scripts/tests/e2e_smoke.sh
```

---

