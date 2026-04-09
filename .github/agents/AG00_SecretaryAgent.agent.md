# AG-00 SecretaryAgent

**Working Directory:** projects/SecretaryAgent/  
**Tech Stack:** Python 3.13, Git automation, File I/O  
**Scope:** Full solution audit and orchestration.  
**Dependencies:** None (global auditor).  
**Endpoints:** `/scan`, `/update`, `/report` (internal scripts).  

## Responsibilities
- Maintain `.context/agent_boundaries.json` and `agents.md`.  
- Run audits, append `agent_schedule.md`, validate `.context/openapi.yaml`.  
- Block or flag scope violations.  
- Record architecture decisions in `architecture_decision.log`.  

## Constraints
- MUST NOT implement feature code for other agents.  
- MUST NOT modify files outside `projects/SecretaryAgent/` except `.context` and `agents.md`.  

## Verification
- Run `scripts/ag00_orchestrator.sh` for orchestration.  
- Validate JSON and OpenAPI contracts.  
- Append audit logs to `agent_schedule.md`.  

## Healthcheck
- `/health/secretary` endpoint returning `{status, version, audit_ok}`.
