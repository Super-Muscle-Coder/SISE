# KnowledgeBase_02.md

## Metadata  
- **id**: KB_AG02_01
- **title**: Storage & Vector Database Knowledge Base (Storage Module)
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
- **scope_summary**: Outlines administrative, configuration, and structural knowledge for the core storage platforms: PostgreSQL (Relational Metadata), Milvus (Vector ANN), MinIO (Object Storage), and Redis (Cache/Queues).
- **dos_reference**: 
  - Section 2.2: The Storage (Vector Database Infrastructure).
  - Section 3.1 & 3.2: Upload & Search Flows (persistence layer guidelines).

---

## Core Concepts  
- **Vector Indexing (HNSW/IVF)**: Algorithm for Approximate Nearest Neighbor lookups in Milvus. Default configuration mandates HNSW with M=16, efConstruction=200, and COSINE similarity.
- **Privacy-Aware Search (Metadata Filtering)**: Vector search queries must embed filters (e.g., `privacy_level=Public` OR `user_id=current_user`) directly within the Milvus execution plan. Avoiding PostgreSQL post-filtering prevents heavy computation bottlenecks.
- **Strict Data/Media Separation**: Raw bytes or blobs are strictly forbidden in PostgreSQL/Milvus. Physical image assets reside exclusively in MinIO buckets, while databases store only path references or Object keys.
- **Schema Idempotency**: All initialization scripts (migrations, bucket creation, collection bootstrapping) must utilize `IF NOT EXISTS` syntax to prevent startup aborts within Dockerized environments.

---

## Trusted References  
1. **Milvus Documentation**
   - title: Indexing and Metadata Filtering
   - url: https://milvus.io/docs/index.md
   - type: Official Docs
   - trust_level: High
   - notes: Crucial for implementing accurate boolean expression filtering during inference.
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
   - notes: AG-02 constructs schemas that the AG-03 Async drivers will leverage.

---

## Internal References  
- `E:\SISE\.context\DOS.md`: The ultimate system guideline.
- `E:\SISE\.context\data_schema.yaml`: DDL configurations must map 1:1 with these logical definitions.
- `E:\SISE\.knowledge\agent02\Skill_02.md`: Playbooks for disaster recovery (etcd/Milvus crash, PG deadlocks).

---

## Do Not Do  
- IMPLEMENT BUSINESS LOGIC: AG-02 must not handle token validation, HTTP requests, or image ingestion logic. Responsibilities are limited to infrastructure initialization and CRUD schemas.
- PERSIST RAW ASSETS IN DB: Databases exclusively hold metadata, constraints, and embeddings. Direct image ingestion belongs in MinIO.

---

## Provenance and Change Log  
- 2024-05-18 | Project Owner + AI | Translated | Converted to professional technical English.

---

## Validation Hooks  
- Initialization scripts must pass idempotent behavior tests without throwing errors on subsequent runs.
- `vector_dim` properties in DDL scripts must align directly with the values in `data_schema.yaml`.

---

## Review Cadence  
- **review_interval_days**: 180 (Infrastructure schemas mutate less frequently).
- **next_review_due**: 2026-11-09

---

## Tags and Search Metadata  
- **tags**: [database, postgres, milvus, minio, sql, vector, infrastructure]
- **keywords**: hnsw, metadata filtering, s3_bucket, rdbms, idempotency, boolean expressions
- **canonical_id**: kb.ag02.db.1
