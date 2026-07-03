# KnowledgeBase_02.md

## Metadata  
- **id**: KB_AG02_01
- **title**: Storage & Vector Database Knowledge Base (Storage Module)
- **version**: 1.1.0
- **created_at**: 2026-05-09
- **created_by**: Project Owner
- **last_updated**: 2026-07-03
- **last_reviewed**: 2026-07-03
- **review_owner**: AG-00 Auditor
- **status**: active
- **visibility**: internal
- **retention_policy_days**: 365

---

## Scope and Purpose  
- **scope_summary**: Outlines administrative, configuration, and structural knowledge for the core storage platforms: PostgreSQL (Relational Metadata + pgvector Vector ANN), MinIO (Object Storage), and Redis (Cache/Queues).
- **dos_reference**: 
  - Section 2.2: The Storage (Vector Database Infrastructure).
  - Section 3.1 & 3.2: Upload & Search Flows (persistence layer guidelines).

---

## Core Concepts  
- **Vector Indexing (HNSW)**: Algorithm for Approximate Nearest Neighbor lookups, implemented natively in PostgreSQL via the `pgvector` extension. Default configuration mandates HNSW with `m=16`, `ef_construction=200`, and COSINE distance (`vector_cosine_ops`, `<=>` operator).
- **Privacy-Aware Search (Metadata Filtering)**: Vector search queries must embed filters (e.g., `privacy_level=Public` OR `user_id=current_user`) directly within the same SQL statement as the ANN search on `images.embedding`. Because vector and metadata now live in one PostgreSQL table, there is no cross-system filter to keep in sync — the WHERE clause and the `<=>` ORDER BY run together in a single query plan.
- **Strict Data/Media Separation**: Raw bytes or blobs are strictly forbidden in PostgreSQL. Physical image assets reside exclusively in MinIO buckets, while the database stores only path references, Object keys, and the pgvector embedding — never the raw image binary.
- **Schema Idempotency**: All initialization scripts (migrations, bucket creation, extension/index bootstrapping) must utilize `IF NOT EXISTS` syntax (e.g., `CREATE EXTENSION IF NOT EXISTS vector`, `CREATE INDEX IF NOT EXISTS ... USING hnsw`) to prevent startup aborts within Dockerized environments.

---

## Trusted References  
1. **pgvector (PostgreSQL Extension)**
   - title: pgvector — Open-source vector similarity search for PostgreSQL
   - url: https://github.com/pgvector/pgvector
   - type: Official Docs (GitHub README)
   - trust_level: High
   - notes: Crucial for HNSW index creation/tuning (`m`, `ef_construction`, `hnsw.ef_search`) and for writing correct boolean/metadata filter expressions alongside the `<=>` distance operator.
2. **MinIO Python Client API (Boto3 / Minio-py)**
   - title: Presigned URLs in MinIO
   - url: https://min.io/docs/minio/linux/developers/python/API.html#presigned_put_object
   - type: Official Docs
   - trust_level: High
   - notes: Imperative for providing Frontend clients with secure upload pathways.
3. **PostgreSQL / SQLAlchemy (Asyncpg)**
   - title: Asyncio with SQLAlchemy
   - url: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
   - type: Official Library Docs
   - trust_level: High
   - notes: AG-02 constructs schemas (including the `vector` column type via the `pgvector` SQLAlchemy integration) that the AG-03 Async drivers will leverage.

---

## Internal References  
- `E:\SISE\.context\DOS.md`: The ultimate system guideline.
- `E:\SISE\.context\data_schema.yaml`: DDL configurations must map 1:1 with these logical definitions.
- `E:\SISE\.knowledge\agent02\Skill_02.md`: Playbooks for disaster recovery (PG deadlocks, pgvector index rebuild).

---

## Do Not Do  
- IMPLEMENT BUSINESS LOGIC: AG-02 must not handle token validation, HTTP requests, or image ingestion logic. Responsibilities are limited to infrastructure initialization and CRUD schemas.
- PERSIST RAW ASSETS IN DB: Databases exclusively hold metadata, constraints, and embeddings. Direct image ingestion belongs in MinIO.

---

## Provenance and Change Log  
- 2024-05-18 | Project Owner + AI | Translated | Converted to professional technical English.
- 2026-07-03 | Project Owner + AI | Migrated | Replaced all Milvus references with pgvector (PostgreSQL `vector` extension) per `data_schema.yaml` v1.1.0 / `openapi.yaml` v1.1.0.

---

## Validation Hooks  
- Initialization scripts must pass idempotent behavior tests without throwing errors on subsequent runs.
- `vector_dim` (the dimension of the `images.embedding` pgvector column) must align directly with the values in `data_schema.yaml`.

---

## Review Cadence  
- **review_interval_days**: 180 (Infrastructure schemas mutate less frequently).
- **next_review_due**: 2027-01-03

---

## Tags and Search Metadata  
- **tags**: [database, postgres, pgvector, minio, sql, vector, infrastructure]
- **keywords**: hnsw, pgvector, metadata filtering, s3_bucket, rdbms, idempotency, boolean expressions
- **canonical_id**: kb.ag02.db.1