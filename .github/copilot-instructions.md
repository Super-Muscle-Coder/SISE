# Copilot Instructions

## General Guidelines
- Use Vietnamese for all user-facing responses (the user prefers Vietnamese).
- Note team role: Project Manager (PM).

## Project Guidelines
- Write all .github files entirely in professional English (no Vietnamese text).

### Architecture & File Organization
- Adopt an exclusive five-layer architecture: configs, entities, adapters, services, routers.
- Combine the five-layer architecture with a Workflow-Centric design: structure code around workflows and their responsibilities.
- Limit cross-domain reuse: enforce file/module ownership and prevent files from acting as "freelance" across multiple business domains to ensure sufficiency and transparent responsibility.
- Assign and document a clear owner for each file/module; enforce ownership and reuse rules via code reviews and CI checks.
- Handle long filenames by exporting concise public names from package __init__.py files; expose stable APIs through package exports while keeping internal filenames explicit.

## Agent Documentation
- Specify audit_required for critical agents: set audit_required: true in agent docs and explain why the agent is critical.
- Document owner, security classification, dependencies, expected uptime, and resilience requirements for each agent.
- Reference the rollback mechanism and runbooks in each agent's documentation.
- Keep agent docs concise and versioned.

## Security & Secret Management
- Store all secrets in a centralized, encrypted secret manager; avoid hardcoding secrets.
- Use least-privilege IAM roles for agent access to secrets and resources.
- Rotate secrets regularly and on suspected compromise; record rotation owners and schedules.
- Audit secret access logs and include access review steps in agent docs.
- Tag secrets with environment and owner metadata.

## Resilience & Testing
- Define a resilience testing cadence: run monthly for critical agents and quarterly for non-critical agents; run tests after major changes.
- Use established tools for resilience and load testing (examples: Chaos Monkey/Gremlin for chaos testing, k6/Locust for load testing).
- Maintain test runbooks, expected outcomes, and post-test remediation actions.
- Include automated smoke and health checks in CI/CD pipelines.

## Rollback & Recovery
- Define a clear rollback mechanism in docs: support automated rollback in CI/CD, retain previous deployable artifacts, and use feature flags to disable features safely.
- Document database migration rollback procedures and data-backup retention policies.
- Test rollback procedures during resilience tests and record outcomes in runbooks.
- Assign rollback owners and contact procedures for on-call teams.

## Knowledge Management & Audits
- Conduct knowledge management reviews on a weekly cadence (e.g., weekly AG-00 audit).
- Record audit results, remediation actions, and owners; track completion of audit items.
- Mark critical agents with audit_required and ensure follow-up actions are scheduled and tracked.
- Keep documentation discoverable, versioned, and reviewed at each AG-00 audit.