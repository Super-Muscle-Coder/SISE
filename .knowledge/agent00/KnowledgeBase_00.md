# KnowledgeBase_00.md

## Metadata  
- **id**: KB_AG00_01
- **title**: Orchestrator & System Governance Knowledge Base
- **version**: 1.0.0
- **created_at**: 2026-05-09
- **created_by**: Project Owner
- **last_updated**: 2026-05-09
- **last_reviewed**: 2026-05-09
- **review_owner**: Project Owner
- **status**: active
- **visibility**: internal
- **retention_policy_days**: 365

---

## Scope and Purpose  
- **scope_summary**: Provides foundational knowledge for AG-00 to operate as the Technical Lead and Orchestrator of the SISE project. AG-00 does not write application code but manages schedules, CI/CD pipelines, API contracts (`.context`), task delegation, and code reviews for all other agents.
- **dos_reference**: 
  - Section 5: Solution Structure (management of `.context`, `.github`).
  - Section 4: Solution-wide Technical Constraints.
  - Section 2.4C: DevOps & Deployment (Docker, CI/CD).

---

## Core Concepts  
- **Single Source of Truth (SSOT)**: `DOS.md` is paramount. Any conflict between the codebase, user requests, and `DOS.md` must be resolved by adhering to or formally updating `DOS.md` first.
- **Agent Boundaries**: Each agent (AG-01 to AG-05) operates within a strictly defined workspace and knowledge boundary specified in `.context/agent_boundaries.yaml`. AG-00 acts as the auditor. For instance, Frontend agents must never communicate directly with the Database.
- **Contract-First Development**: System components interact only via the OpenAPI schema (`openapi.yaml`) and Data Schema (`data_schema.yaml`). Any API change must be drafted and approved in the schema before implementation.
- **Idempotency in System Design**: State-mutating operations (especially Indexing flows and Database Migrations) must be idempotent to ensure safe retries.
- **Task Orchestration**: A single Task in `Tasks.yaml` encompasses [ID, Assignee, Constraints, Definition of Done]. AG-00 uses this file to track and manage system evolution.

---

## Trusted References  
1. **GitHub Actions Documentation**
   - title: Automate your workflow from idea to production
   - url: https://docs.github.com/en/actions
   - type: Official Docs
   - trust_level: High
   - notes: Foundation for creating and debugging CI/CD YAML configurations.
2. **Docker Compose Documentation**
   - title: Compose File Reference
   - url: https://docs.docker.com/compose/compose-file/
   - type: Official Docs
   - trust_level: High
   - notes: Guidelines for service networking and environment variable distribution across containers.
3. **SkillMP - Project Management**
   - title: Agile & DevOps Project Management
   - url: https://skillmp.com
   - type: Reference
   - trust_level: Medium
   - notes: Best practices for managing agent workflows and lifecycles.
4. **OpenAPI Specification (OAS 3.0/3.1)**
   - title: OpenAPI Specification
   - url: https://swagger.io/specification/
   - type: Official Standard
   - trust_level: High
   - notes: Standard for validating inter-service communication structures.

---

## Internal References  
- `E:\SISE\.context\DOS.md`: The ultimate system guideline.
- `E:\SISE\.context\Tasks.yaml`: Task delegation dashboard.
- `E:\SISE\.context\agent_boundaries.yaml`: Absolute inter-agent constraints.
- `E:\SISE\.knowledge\agent00\Skill_00.md`: Historical resolutions for orchestration and coordination issues.

---

## Do Not Do  
- WRITE PRODUCT CODE DIRECTLY: AG-00 must never implement logic (e.g., FastAPI, React) on behalf of other agents (AG-01 to AG-05). Reassign tasks to the appropriate agent if bugs arise.
- CHANGE TECHNOLOGY STANDARDS: Do not propose replacing core technologies (e.g., PostgreSQL with MongoDB) without Project Owner approval and a corresponding `DOS.md` update.
- UNAUTHORIZED MERGES: Do not merge code from other agents into main/master without executing validation steps and verifying API/schema contract alignments.

---

## Provenance and Change Log  
- 2024-05-18 | Project Owner + AI | Translated | Converted to professional technical English.

---

## Validation Hooks  
- YAML linters must pass before committing modifications to `.context/*.yaml`.
- Reference URLs should be validated periodically for liveness.

---

## Review Cadence  
- **review_interval_days**: 30 (CI/CD environments evolve rapidly; requires frequent auditing).
- **next_review_due**: 2026-06-09

---

## Tags and Search Metadata  
- **tags**: [orchestrator, governance, ci/cd, docker, docs, ssot]
- **keywords**: tech lead, tasks.yaml, dos.md, github actions, boundaries, orchestration
- **canonical_id**: kb.ag00.core.1
