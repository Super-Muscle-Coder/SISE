# Skill_03.md

*Dữ liệu Kỹ Năng & Giải Pháp AG-03* - Ghi nhận các kỹ năng bất ngờ, vấn đề khắc phục, và mẫu giải pháp học được.

---

## Metadata

| Trường | Giá Trị |
|--------|--------|
| **id** | SKILL-03 |
| **agent_id** | AG-03 |
| **agent_name** | BackendModule |
| **skill_db_version** | 1.0.0 |
| **total_skills_acquired** | 9 |
| **created_at** | 2026-05-09 |
| **last_skill_added** | 2026-05-09 |
| **retention_policy_days** | 180 |
| **status** | active |

---

## Skill Entries

### Skill #1: 5-Layer Architecture Export Pattern with __init__.py

**skill_id**: SKL-03-001
**timestamp**: 2026-05-09
**trigger_event**: Discovered that importing entities from nested modules violated clean package API and required updating module-level exports.

**context**:
- Task: T003-01 Scaffold
- Challenge: Downstream imports needed stable, concise public API

**symptom**: Code scattered across 5 layers, creating tight coupling and making refactoring brittle.

**root_cause**: No centralized re-export pattern; Python packages need __all__ at package level.

**solution**:
1. Define __all__ in each layer's __init__.py
2. Import and re-export key classes
3. Use workflow-prefixed files (auth_entities.py, upload_entities.py)

**prevention**:
- ✅ Always define __all__ in package __init__.py
- ✅ Export only public classes/functions
- ❌ Don't import internal files directly
- ❌ Don't re-export everything

**tags**: architecture, python-packages, layering, maintainability

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #2: Environment Config Template Pattern

**skill_id**: SKL-03-002
**timestamp**: 2026-05-09
**trigger_event**: Realized hardcoding secrets violates security and multi-environment deployments.

**context**:
- Task: T003-01 Scaffold
- Files: modules/BackendModule/configs/backend.env.example, backend.env.local

**symptom**: Developers copy-paste secrets or accidentally commit .env files.

**root_cause**: No standard pattern for environment variable management.

**solution**:
1. Create backend.env.example with all required vars (non-sensitive)
2. Create backend.env.local (gitignored) for local overrides
3. Load via python-dotenv, fail if critical vars missing

**prevention**:
- ✅ .env.example in git (template only)
- ✅ .env.local in .gitignore (never committed)
- ✅ Fail fast at startup
- ❌ Don't hardcode secrets

**tags**: security, configuration, environment

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #3: Async Database Queries with SQLAlchemy 2.0 + asyncpg

**skill_id**: SKL-03-003
**timestamp**: 2026-05-09
**trigger_event**: Sync SQLAlchemy ORM in async FastAPI routes caused thread blocking.

**context**:
- Task: T003-01 Scaffold + T003-02 Auth
- Challenge: User adapter needed non-blocking DB access

**symptom**: Even with async routes, sync DB layer blocked the event loop.

**root_cause**: SQLAlchemy classic ORM is synchronous. SQLAlchemy 2.0 adds AsyncSession but requires setup.

**solution**:
1. Use AsyncEngine with postgresql+asyncpg
2. Create AsyncSessionLocal with AsyncSession
3. Use async with and await session.execute()

**prevention**:
- ✅ Always use AsyncSession + asyncpg
- ✅ Use sync with async_session() as session: pattern
- ✅ Always await DB calls
- ❌ Never use sync Session in async context

**tags**: async, database, sqlalchemy, performance

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #4: Idempotency Pattern with Redis Caching & TTL

**skill_id**: SKL-03-004
**timestamp**: 2026-05-09
**trigger_event**: Duplicate upload requests must return cached response, not re-process.

**context**:
- Task: T003-03 Upload
- Requirement: Prevent duplicate indexing, storage writes

**symptom**: Client retry could trigger duplicate indexing, causing duplicate vectors in Milvus.

**root_cause**: HTTP retries are common, backend must distinguish first request from retry.

**solution**:
1. Extract Idempotency-Key header (UUID format)
2. Scope by user: redis_key = f"idempotency:{user_id}:{idempotency_key}"
3. Check cache first, return if hit
4. If miss, process and cache with ttl=24*3600

**prevention**:
- ✅ Validate Idempotency-Key format (UUID)
- ✅ Scope by user (not global)
- ✅ Always set TTL
- ✅ Cache JSON responses only
- ❌ Don't cache error responses
- ❌ Don't scope globally

**tags**: idempotency, caching, redis, reliability

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #5: Privacy Filter Pattern - Friends Table JOIN & Visibility Logic

**skill_id**: SKL-03-005
**timestamp**: 2026-05-09
**trigger_event**: Search results must respect privacy levels; users should only see images they own or friends have shared.

**context**:
- Task: T003-04 Media, T003-05 Search
- Requirement: Friends-only images visible only to friends; private images visible only to owner

**symptom**: Without proper filtering, public results could leak private images or show unauthorized content.

**root_cause**: Privacy filtering must happen at query time (database level), not post-fetch filtering.

**solution**:
1. Define privacy_level: 0=Private, 1=Friends, 2=Public
2. For search/list queries:
   - If image owner is current_user: always include (any privacy_level)
   - If privacy_level=2: always include (public)
   - If privacy_level=1: include only if current_user is in friends table
   - If privacy_level=0: exclude (private to owner only)
3. SQL JOIN: LEFT JOIN friends ON image.owner_id = friends.from_user_id AND friends.to_user_id = current_user_id
4. WHERE clause: owner_id = current_user_id OR privacy_level = 2 OR (privacy_level = 1 AND friends.id IS NOT NULL)

**prevention**:
- ✅ Apply filter at database layer (not in Python)
- ✅ Always test with 3 users: owner, friend, non-friend
- ✅ Verify all privacy levels (0, 1, 2)
- ❌ Don't fetch all images then filter in Python (N+1 query problem)
- ❌ Don't trust client-provided privacy filters

**tags**: privacy, security, sql-join, authorization

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #6: Soft Delete Pattern - deleted_at Timestamp & Compensating Actions

**skill_id**: SKL-03-006
**timestamp**: 2026-05-09
**trigger_event**: Images need to be deleted but must be recoverable and async-cleaned from remote storage.

**context**:
- Task: T003-04 Media (DELETE endpoint)
- Requirement: Soft-delete in PostgreSQL, async hard-delete from MinIO/Milvus

**symptom**: Hard-delete via DELETE statement immediately removes data; if remote storage deletion fails, data is already gone from DB.

**root_cause**: Multi-system deletion requires coordination; soft-delete decouples logical deletion from physical deletion.

**solution**:
1. Mark deleted_at = NOW() in PostgreSQL (don't actually DELETE row)
2. Queries exclude rows WHERE deleted_at IS NOT NULL
3. Async task (Celery) processes soft-deleted rows:
   - For each soft-deleted image:
     - Delete from MinIO (object_storage)
     - Delete from Milvus (vector index)
     - Update PostgreSQL deleted_at confirmation (or keep forever for audit)
4. Compensating actions: If MinIO delete fails, retry with backoff; if Milvus delete fails, log and alert (don't fail entire operation)

**prevention**:
- ✅ Always use deleted_at, never DELETE row
- ✅ Filter queries: WHERE deleted_at IS NULL
- ✅ Async hard-delete in separate Celery task
- ✅ Implement retry with exponential backoff
- ✅ Log all deletions (audit trail)
- ❌ Don't hard-delete immediately
- ❌ Don't fail if remote deletion fails (use compensating action)

**tags**: soft-delete, data-recovery, audit-trail, distributed-deletion

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #7: Metric Computation Pattern - MRR, HitRate, Precision, Recall Formulas

**skill_id**: SKL-03-007
**timestamp**: 2026-05-09
**trigger_event**: Evaluation service needs to compute search quality metrics for model performance tracking.

**context**:
- Task: T003-06 Evaluation
- Requirement: Compute MRR, HitRate@K, Precision@K, Recall accurately

**symptom**: Manual computation is error-prone; formula implementation must handle edge cases (no hits, empty queries).

**root_cause**: Information retrieval metrics have specific definitions; implementation must match textbook formulas.

**solution**:
1. **MRR (Mean Reciprocal Rank)**: 1 / rank_of_first_hit (0 if no hit in top-K)
   - Example: If first hit at rank 3 → MRR = 1/3 = 0.333
   - If no hits → MRR = 0
2. **HitRate@K**: (# of relevant results in top-K) / (# total results) * 100%
   - Example: 2 hits in top-10, 10 total results → 2/10 = 20%
3. **Precision@K**: (# of relevant in top-K) / K
   - Example: 2 relevant in top-10 → 2/10 = 20%
4. **Recall**: (# of relevant found) / (# total relevant in collection)
   - Example: Found 2 out of 5 total relevant → 2/5 = 40%

**prevention**:
- ✅ Hardcode formula reference (comment with paper/formula)
- ✅ Test edge cases (no hits, k > total_results, division by zero)
- ✅ Use floating-point rounding for final result
- ✅ Return 0 for undefined cases (e.g., 0 hits → MRR=0)
- ❌ Don't confuse Precision@K with HitRate (different denominators)
- ❌ Don't forget edge case handling

**tags**: metrics, evaluation, precision, recall, mrr

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #8: Health Check Pattern - Parallel Dependency Checks, Timeout, Status Aggregation

**skill_id**: SKL-03-008
**timestamp**: 2026-05-09
**trigger_event**: Backend /health/readiness endpoint must validate all dependencies in a reasonable time.

**context**:
- Task: T003-07 Health
- Requirement: Check 5 dependencies (PostgreSQL, Milvus, MinIO, Redis, AI Service) within 5 seconds

**symptom**: Sequential checks could take 25s (5s × 5 services); parallel checks required but async exception handling is complex.

**root_cause**: Dependency checks are I/O-bound and can be parallelized via asyncio.gather(); must handle timeouts and partial failures.

**solution**:
1. Define check functions as async coroutines (one per dependency)
2. Use asyncio.gather(*check_coros, return_exceptions=True) for parallel execution
3. Wrap in asyncio.wait_for(gather(...), timeout=5.0)
4. Aggregate results: {dependency: (state, error_msg)}
5. Return 200 if all UP, 503 if any critical dependency DOWN
6. Include X-Expected-Vector-Dim header in readiness response

**prevention**:
- ✅ Always use asyncio.gather for parallel checks
- ✅ Set global timeout (not per-check timeout)
- ✅ Catch all exceptions (including timeout)
- ✅ Return partial status (dep1=UP, dep2=DOWN, dep3=TIMEOUT)
- ✅ Log all timeouts and failures for debugging
- ❌ Don't use sequential checks (too slow)
- ❌ Don't fail entire health check if 1 dependency times out (use partial status)

**tags**: health-check, async, parallel, timeout, monitoring

**confidence_level**: high

**review_status**: validated

**archived**: false

---

### Skill #9: Pydantic Validation Testing - Model-Level vs Service-Level Distinction

**skill_id**: SKL-03-009
**timestamp**: 2026-05-09
**trigger_event**: Pydantic validation tests failed because they expected ValueError at service invocation but got ValidationError at model construction.

**context**:
- Task: T003-03-PATCH (Upload test fixes)
- Issue: 4 tests in test_upload_workflow.py were failing with unexpected ValidationError

**symptom**: Tests wrapped service call in pytest.raises(ValueError), but Pydantic validation happened before service was called.

**root_cause**: Pydantic v2 validates fields at __init__ time (model instantiation), not at service method time. Tests didn't account for this distinction.

**solution**:
1. **Model-level validation** (happens at instantiation):
   - Field constraints: ge=1, le=20, min_length, max_length
   - Field validators: custom validation logic
   - Enum validation: only allow specific enum values
   - Expected exception: pydantic.ValidationError
2. **Service-level validation** (happens in service method):
   - Complex business logic: check resource existence, authorization
   - Orchestration errors: downstream service failures
   - Expected exception: ValueError, RuntimeError, or custom exception
3. Test pattern:
   - For model validation: Wrap model instantiation in pytest.raises(ValidationError)
   - For service validation: Wrap service method call in pytest.raises(ValueError)

**prevention**:
- ✅ Read Pydantic v2 docs: validation happens at __init__
- ✅ Test model validation: instantiate model inside pytest.raises(ValidationError)
- ✅ Test service validation: call service method inside pytest.raises(ValueError)
- ✅ Separate model tests from service tests
- ❌ Don't expect service validation for Pydantic fields (too late)
- ❌ Don't expect ValueError for enum/constraint violations (Pydantic raises ValidationError)

**tags**: testing, pydantic, validation, model-vs-service

**confidence_level**: high

**review_status**: validated

**archived**: false

---

## Governance & Validation

### Provenance Fields Required
- commit_hash (git describe)
- task_id (from Tasks.yaml)
- author (AG-03)

### CI Validation Hooks
- Syntax check (Python AST parse)
- Uniqueness check (skill_id never reused)
- Link validation (related_skills, task_id exist)
- No PII (email, token examples scrubbed)

### Retention & Archive Policy
- Keep for 180 days minimum
- Archive if obsolete or deprecated

---

## Operational Metadata

| Metric | Value |
|--------|-------|
| Total Skills | 9 |
| Validated | 9 |
| Experimental | 0 |
| By Category | architecture: 1, config: 1, async: 1, caching: 1, privacy: 1, soft-delete: 1, metrics: 1, health-check: 1, testing: 1 |

### Review Cadence
- Interval: On-demand (when new skill encountered)
- Owner: AG-03 (self-authored), reviewed by AG-00
- Next Review: When new issue encountered

### Edit Roles
- AG-03: add/edit skills
- AG-00: archive/deprecate
- Others: read-only

---

**Status**: 🟢 PHASE 3 COMPLETE — 9 skills acquired and validated
**Last Updated**: 2026-05-09
**Next Update**: After Phase 4 integration testing
