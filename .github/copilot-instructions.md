# Copilot Instructions

## Project Guidelines
- User wants the SecretaryAgent (Agent 00) to act as the central coordinator for the project: audit the solution, understand structure and goals, understand the six-agent setup and each agent's role, orchestrate tasks and schedules, and only modify files within its own module and shared resources like .context and common, without Đ²Đ¼ĐµÑˆing in other agents' code. All changes should be mediated by Agent 00 and the user; other agents only consume and report.
- User wants AG-00 to maintain both human-readable (.agent.md) and machine-readable (.agent.json) agent definitions per module, synchronized from canonical templates in .github/agents via an AG-00-managed orchestrator script. AG-00 should have governance authority over each module's agent/ folder while other agents must not alter canonical templates.
- User prefers .context to serve as a shared agent-facing hub for contracts and a check-in/check-out style common area. Agent schedule information should be stored in .context rather than document/.
