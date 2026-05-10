---

# Agent Template

## Metadata
- **name**: Unique name of the agent.
- **description**: Brief description of role and scope.
- **version**: Semantic version (major.minor.patch).
- **api_version**: API contract version (must match `openapi.yaml`).
- **schema_version**: Schema version (must match `data_schema.yaml`).
- **change_log**: Change log for audit/rollback.
- **last_updated**: Date of the last update. 
- **updated_by**: Who updated it. *Example: `AG-00 (OrchestratorAgent)` or ProjectOwner*  
- **context_refs**: List of files in `.context` that the agent depends on.
- **knowledge_refs**: The agent's knowledge management directory (`.knowledge/agent[N]/`) and shared directory (`.knowledge/shared/`).
- **status**: Agent status. *active | deprecated | pending*  
- **audit_required**: Enable audit flag so Orchestrator logs all changes. *true/false*  
- **required_env_vars**: Required environment variables. 
- **ci_validation_hooks**: CI/CD validation steps.
- **required_dependencies**: Required dependencies and their versions.
- **security_and_secrets**: Required secrets and storage location.
- **runbook_refs**: References to troubleshooting documents.
- **deployment_strategy**: Rollout strategy.
- **data_governance**: Data governance policies.
- **working_dir**: Project directory where the agent works.

---

## Role
Brief description of the agent's overall role in the system.

---

## Core Responsibilities
List in detail the primary tasks the agent handles, using bullet points (strictly adhering to `DOS.md`).
- **Knowledge Management**: ABSOLUTE responsibility to manage, maintain, and update the `.knowledge/agent[N]/` directory. Must strictly comply with standards in `.knowledge/shared/`. During operations, must frequently review and update `KnowledgeBase_[N].md`, `Skill_[N].md`, and especially `Log_[N].md` to align with actual task progress (following the correct trigger mechanisms).

---

## Key Constraints
Constraints, forbidden behaviors, outbound calls (strictly adhering to `DOS.md`, `agent_boundaries.yaml`, `data_schema.yaml`, `openapi.yaml`).

---

## Technical Stack
Main programming language, frameworks, and libraries (strictly adhering to `DOS.md`).

---

## Knowledge Scope
- **Must know**: Essential knowledge that must be known and deeply understood.
- **Must not know**: Out-of-scope knowledge, unnecessary details, unauthorized areas.

---

## Observability Targets
- **Metrics to log**
- **SLOs**
- **Alert thresholds**
- **Health probes**

---

## Error Handling Patterns
- **Common scenarios** 
- **Predefined responses** 
- **Difference from Skill.md**: `Skill.md` records resolved unexpected errors; Error Handling defines predicted errors and immediate fallback reactions.

---

## Success Criteria
Clearly define what "correct execution" means, ensuring the agent does not output hallucinated or unverified results.

------