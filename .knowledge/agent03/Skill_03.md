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
| **total_skills_acquired** | 4 |
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
| Total Skills | 4 |
| Validated | 4 |
| Experimental | 0 |
| By Category | architecture: 1, config: 1, async: 1, caching: 1 |

### Review Cadence
- Interval: On-demand (when new skill encountered)
- Owner: AG-03 (self-authored), reviewed by AG-00
- Next Review: When new issue encountered

### Edit Roles
- AG-03: add/edit skills
- AG-00: archive/deprecate
- Others: read-only

---

**Status**: 🟡 IN PROGRESS — 4 skills acquired
**Last Updated**: 2026-05-09
**Next Update**: After T003-03 upload runtime integration
