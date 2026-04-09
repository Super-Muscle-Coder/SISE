# AG-02 StorageModule

**Working Directory:** projects/StorageModule/  
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
- MUST NOT modify files outside `projects/StorageModule/`.  
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