# Agent Schedule — SISE

> **Project:** Smart Image Search Engine (SISE)  
> **Canonical schedule path:** `agent_schedule.md`  
> **Orchestrator:** `scripts/ag00_orchestrator.sh`  
> **Policy:** **Append-only audit ledger** — do not edit past audit lines; to correct, append a new correction entry with ISO UTC timestamp and author.

---

### Agent Lifecycle Matrix
| **Agent ID** | **Role** | **State** | **Current Assignment** | **Directory Scope** |
| :--- | :--- | :--- | :--- | :--- |
| **AG-00** | System Secretary | **ACTIVE** | Orchestration, audit, schedule writes | `projects/SecretaryAgent/` |
| **AG-01** | Feature Extraction | IDLE | CLIP model integration | `projects/AIModule/` |
| **AG-02** | Infrastructure | IDLE | Containerization infra templates | `projects/StorageModule/` |
| **AG-03** | Service Interface | IDLE | OpenAPI contract and backend endpoints | `projects/BackendModule/` |
| **AG-04** | Web Interface | IDLE | UI component spec and integration | `projects/frontendweb/` |
| **AG-05** | Mobile Client | IDLE | Mobile assets and packaging | `projects/FrontendMobile/` |

---

### Owners and Contact Points
- **AG-00 SecretaryAgent** — Owner: **team-infra**; Contact: `infra@your-org.example`  
- **AG-01 AIModule** — Owner: **team-ml**; Contact: `ml@your-org.example`  
- **AG-02 StorageModule** — Owner: **team-platform**; Contact: `platform@your-org.example`  
- **AG-03 BackendModule** — Owner: **team-backend**; Contact: `backend@your-org.example`  
- **AG-04 frontendweb** — Owner: **team-frontend**; Contact: `frontend@your-org.example`  
- **AG-05 FrontendMobile** — Owner: **team-mobile**; Contact: `mobile@your-org.example`

---

### Audit Log (append-only ISO UTC)
- **2026-04-09T22:19:00Z** SYSTEM: Baseline solution architecture established; `.context`, `scripts/`, `projects/` verified.  
- **2026-04-09T22:19:00Z** AG-00: Initialized `.context/agent_boundaries.json` with default constraints.  
- **2026-04-09T22:19:00Z** SYSTEM: Deployed orchestration scripts `scripts/ag00_orchestrator.sh`, `scripts/scope_check.sh`; execution permissions set.

> **How to append an audit entry**  
> Preferred: run `./scripts/ag00_orchestrator.sh` which appends a standardized audit line.  
> Manual format: `- YYYY-MM-DDTHH:MM:SSZ AG-XX: <message> (author: <name>)`

---

### Milestones and Action Checklist
- [ ] **Milestone 1 Infra** — Containerize PostgreSQL, Milvus, MinIO; provide docker-compose or k8s manifests. **Owner:** AG-02  
- [ ] **Milestone 2 API Contract** — Finalize `.context/openapi.yaml` OpenAPI 3.0 and publish schema. **Owner:** AG-03  
- [ ] **Milestone 3 ML Pipeline** — Implement CLIP inference pipeline and bootstrap tests. **Owner:** AG-01  
- [ ] **Milestone 4 Frontend** — Deliver core UI components and integration tests for web and mobile. **Owner:** AG-04, AG-05  
- [ ] **Milestone 5 CI CD** — CI pipeline running lint, unit tests, integration tests, and scope checks. **Owner:** AG-00

---

### Machine readable companion example
Create or update `agent_schedule.json` alongside this file. Example minimal structure:

```json
{
  "generated_at": "2026-04-09T22:19:00Z",
  "agents": [
    {"id":"AG-00","role":"System Secretary","state":"ACTIVE","dir":"projects/SecretaryAgent/"},
    {"id":"AG-01","role":"Feature Extraction","state":"IDLE","dir":"projects/AIModule/"},
    {"id":"AG-02","role":"Infrastructure","state":"IDLE","dir":"projects/StorageModule/"},
    {"id":"AG-03","role":"Service Interface","state":"IDLE","dir":"projects/BackendModule/"},
    {"id":"AG-04","role":"Web Interface","state":"IDLE","dir":"projects/frontendweb/"},
    {"id":"AG-05","role":"Mobile Client","state":"IDLE","dir":"projects/FrontendMobile/"}
  ],
  "audit": [
    {"ts":"2026-04-09T22:19:00Z","entry":"Baseline solution architecture established."},
    {"ts":"2026-04-09T22:19:00Z","entry":"Initialized .context/agent_boundaries.json with default constraints."}
  ]
}
