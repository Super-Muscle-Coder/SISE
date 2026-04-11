# Agent Schedule â€” SISE

> **Project:** Smart Image Search Engine (SISE)
> **Canonical schedule path:** `agent_schedule.md`
> **Orchestrator:** `modules/SecretaryAgent/scripts/orchestrator/ag00_orchestrator.sh`
> **Policy:** **Append-only audit ledger** â€” do not edit past audit lines; to correct, append a new correction entry with ISO UTC timestamp and author.
> **Status:** Demo bootstrap schedule for review by AG-00 and the user.

---

### Agent Lifecycle Matrix
| **Agent ID** | **Role** | **State** | **Current Assignment** | **Directory Scope** |
| :--- | :--- | :--- | :--- | :--- |
| **AG-00** | System Secretary | **ACTIVE** | Orchestration, audit, schedule writes | `modules/SecretaryAgent/` |
| **AG-01** | Feature Extraction | **READY** | CLIP interface and embedding contract | `modules/AIModule/` |
| **AG-02** | Infrastructure | **READY** | Storage topology and service contracts | `modules/StorageModule/` |
| **AG-03** | Service Interface | **READY** | OpenAPI contract and backend endpoints | `modules/BackendModule/` |
| **AG-04** | Web Interface | **READY** | UI shell and dashboard contract | `modules/frontendweb/` |
| **AG-05** | Mobile Client | **READY** | Mobile shell and navigation contract | `modules/FrontendMobile/` |

---

### Owners and Contact Points
- **AG-00 SecretaryAgent** â€” Owner: **team-infra**; Contact: `infra@your-org.example`
- **AG-01 AIModule** â€” Owner: **team-ml**; Contact: `ml@your-org.example`
- **AG-02 StorageModule** â€” Owner: **team-platform**; Contact: `platform@your-org.example`
- **AG-03 BackendModule** â€” Owner: **team-backend**; Contact: `backend@your-org.example`
- **AG-04 frontendweb** â€” Owner: **team-frontend**; Contact: `frontend@your-org.example`
- **AG-05 FrontendMobile** â€” Owner: **team-mobile**; Contact: `mobile@your-org.example`

---

### Audit Log (append-only ISO UTC)
- **2026-04-09T22:19:00Z** SYSTEM: Baseline solution architecture established; root contracts and module folders verified.
- **2026-04-09T22:19:00Z** AG-00: Initialized `.context/agent_boundaries.json` with default constraints.
- **2026-04-09T22:19:00Z** SYSTEM: Deployed orchestration scripts `modules/SecretaryAgent/scripts/orchestrator/ag00_orchestrator.sh`, `modules/SecretaryAgent/scripts/orchestrator/scope_check.sh`; execution permissions set.

> **How to append an audit entry**
> Preferred: run `modules/SecretaryAgent/scripts/orchestrator/ag00_orchestrator.sh` which appends a standardized audit line.
> Manual format: `- YYYY-MM-DDTHH:MM:SSZ AG-XX: <message> (author: <name>)`

---

### Milestones and Action Checklist
- [ ] **Milestone 1 Infra** â€” Confirm storage service placeholders and runtime endpoints. **Owner:** AG-02
- [ ] **Milestone 2 API Contract** â€” Publish backend skeleton aligned with `.context/openapi.yaml`. **Owner:** AG-03
- [ ] **Milestone 3 ML Pipeline** â€” Freeze embedding contract and test harness shape. **Owner:** AG-01
- [ ] **Milestone 4 Frontend** â€” Deliver first web and mobile shells for review. **Owner:** AG-04, AG-05
- [ ] **Milestone 5 CI CD** â€” Validate lint, unit, and contract checks under AG-00. **Owner:** AG-00

---

### Demo schedule preview

| Day | AG-00 | AG-01 | AG-02 | AG-03 | AG-04 | AG-05 |
| --- | --- | --- | --- | --- | --- | --- |
| Mon | Scope lock | Embedding interface review | Storage contract review | API skeleton review | Web shell planning | Mobile shell planning |
| Tue | Dependency check | Contract notes | Infra notes | Endpoint notes | Layout draft | Navigation draft |
| Wed | Midweek sync | Report progress | Report progress | Report progress | Report progress | Report progress |
| Thu | Conflict resolution | Final adjustments | Final adjustments | Final adjustments | Final adjustments | Final adjustments |
| Fri | Demo review | Sign-off | Sign-off | Sign-off | Sign-off | Sign-off |

---

### Machine readable companion example
Create or update `.context/agent_schedule.json` alongside this file. Example minimal structure:

```json
{
  "generated_at": "2026-04-09T22:19:00Z",
  "agents": [
    {"id":"AG-00","role":"System Secretary","state":"ACTIVE","dir":"modules/SecretaryAgent/"},
    {"id":"AG-01","role":"Feature Extraction","state":"IDLE","dir":"modules/AIModule/"},
    {"id":"AG-02","role":"Infrastructure","state":"IDLE","dir":"modules/StorageModule/"},
    {"id":"AG-03","role":"Service Interface","state":"IDLE","dir":"modules/BackendModule/"},
    {"id":"AG-04","role":"Web Interface","state":"IDLE","dir":"modules/frontendweb/"},
    {"id":"AG-05","role":"Mobile Client","state":"IDLE","dir":"modules/FrontendMobile/"}
  ],
  "audit": [
    {"ts":"2026-04-09T22:19:00Z","entry":"Baseline solution architecture established."},
    {"ts":"2026-04-09T22:19:00Z","entry":"Initialized .context/agent_boundaries.json with default constraints."}
  ]
}




