---

# Agent Template

## Header (Required)
Provide YAML front matter at the top of each `.agent.md` file:
- `name`: Agent identifier (must match agent registry)
- `description`: One-line summary of role and scope

---

# [AgentName]

## Metadata
- **name**: `[AgentName]`
- **description**: One-line role and scope summary.
- **version**: Semantic version (major.minor.patch).
- **api_version**: Must match `openapi.yaml`.
- **schema_version**: Must match `data_schema.yaml`.
- **change_log**: Chronological change log with version/date and summary.
- **last_updated**: ISO 8601 date (YYYY-MM-DD).
- **updated_by**: `AG-00 (OrchestratorAgent)` or `ProjectOwner`.
- **context_refs**: Required `.context/` references.
- **knowledge_refs**: `.knowledge/agent[N]/` and `.knowledge/shared/`.
- **status**: `active | deprecated | pending`.
- **audit_required**: `true | false`.
- **required_env_vars**: Required environment variables.
- **ci_validation_hooks**:
  - **pre_commit**: Required checks.
  - **pre_merge**: Required checks.
  - **post_deploy**: Required checks.
- **required_dependencies**: Language/tooling/packages with versions and reasons.
- **security_and_secrets**: Secret handling and logging restrictions.
- **runbook_refs**: Operational runbooks.
- **deployment_strategy**: Rollout and rollback strategy.
- **data_governance**: Data handling and retention rules.
- **working_dir**: Allowed write directory.

---

## Role
One paragraph describing why the agent exists and what it delivers.

---

## Core Responsibilities
- **Knowledge Management**: ABSOLUTE responsibility to maintain `.knowledge/agent[N]/`. Must update `KnowledgeBase_[N].md` (trusted references), `Skill_[N].md` (unexpected issue resolution), and `Log_[N].md` (significant events). AG-00 audits weekly for freshness and completeness.
- List the remaining responsibilities as clear, testable actions.

---

## Key Constraints
### Forbidden Actions
List explicit prohibitions.

### Allowed Outbound Calls
List allowed agents/services.

### Boundary Rules (per `agent_boundaries.yaml`)
- Write permission
- Read permission

---

## Input Dependencies
### Required Inputs from Other Agents
Provide a table with Source, Input Type, Format, SLA, Quality Standard, Validation.

### Required Inputs from External Systems
Provide a table with Source, Input Type, Format, SLA, Quality Standard, Validation.

### Input Contract Validation
Provide validation logic or rules.

---

## Output Contract
### Primary Outputs
Define outputs with schema, quality gates, validation, consumers, and failure modes.

### Secondary Outputs
Define documentation outputs and update cadence.

### Output Delivery Mechanism
Describe delivery (HTTP API, build artifacts, Git commits).

---

## Technical Stack
### Programming Language
Primary language and version.

### Frameworks
Key frameworks and versions.

### Libraries
Key libraries and versions.

### Containerization
Base image and build requirements if applicable.

### Forbidden Libraries
List prohibited libraries per `agent_boundaries.yaml`.

---

## Knowledge Scope
### Must Know (Core Domain)
List required expertise.

### Must Know (Adjacent Domain — for integration)
List integration knowledge.

### Must NOT Know (Out of Scope)
List prohibited knowledge domains.

### Knowledge Boundary Enforcement
Define boundary violation rule.

---

## Observability Targets
### Metrics to Log
Provide a metrics table (name, type, unit, description, collection method).

### SLOs (Service Level Objectives)
Provide an SLO table (target, window, threshold).

### Alert Thresholds
Provide an alert table (condition, severity, action).

### Health Probes
List readiness/liveness probes or note N/A.

---

## Error Handling Patterns
### Common Scenarios & Predefined Responses
Define expected errors, triggers, responses, and log levels.

### Difference from Skill.md
Explain expected vs unexpected issue recording.

---

## Fault Domains & Resilience
### Single Points of Failure (SPOFs)
List critical dependencies.

### Cascading Failure Scenarios
Describe blast radius.

### Resilience Patterns Implemented
List fallbacks and mitigations.

### Resilience Testing
Include cadence and tools.

---

## Interface Compatibility Matrix
### Contract File Compatibility
Provide min/max/current versions and breaking change notes.

### Dependency Compatibility
Provide version ranges and reasons.

### Known Compatibility Issues
List known issues and actions.

### Upgrade Path
Define minor/major upgrade steps.

---

## Success Criteria
### Functional Correctness
Define acceptance criteria.

### Performance SLOs
Define performance acceptance.

### Operational Health
Define health checks.

### Knowledge Management
Define update requirements for `Log_[N].md` and `Skill_[N].md`.

### Integration
Define end-to-end validation.

### Rollback Capability
Define rollback time and mechanism.

---