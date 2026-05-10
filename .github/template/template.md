
---

# Agent Template

## Metadata
- **name**: TĂªn duy nháº¥t cá»§a agent.
- **description**: MĂ´ táº£ ngáº¯n gá»n vai trĂ² vĂ  pháº¡m vi.
- **version**: PhiĂªn báº£n semantic (major.minor.patch).
- **api_version**: Version cá»§a API contract (pháº£i khá»›p vá»›i `openapi.yaml`).
- **schema_version**: Version cá»§a schema (pháº£i khá»›p vá»›i `data_schema.yaml`).
- **change_log**: Nháº­t kĂ½ thay Ä‘á»•i Ä‘á»ƒ audit/rollback.
- **last_updated**: NgĂ y cáº­p nháº­t gáº§n nháº¥t. 
- **updated_by**: Ai cáº­p nháº­t. *VĂ­ dá»¥: `AG-00 (SecretaryAgent)` hoáº·c ProjectOwner*  
- **context_refs**: Liá»‡t kĂª file trong `.context` mĂ  agent phá»¥ thuá»™c. *VĂ­ dá»¥: `.context/DOS.md`, `.context/openapi.yaml`, `.context/agent_boundaries.yaml`, `.context/data_schema.yaml`*  
- **knowledge_refs**: Thư mục quản lý tri thức của agent (.knowledge/agent[N]/) và thư mục dùng chung (.knowledge/shared/).
- **status**: Tráº¡ng thĂ¡i agent. *active | deprecated | pending*  
- **audit_required**: Báº­t cá» audit Ä‘á»ƒ Orchestrator log má»i thay Ä‘á»•i. *true/false*  
- **required_env_vars**: CĂ¡c biáº¿n mĂ´i trÆ°á»ng báº¯t buá»™c. 
- **ci_validation_hooks**: CĂ¡c bÆ°á»›c kiá»ƒm tra CI/CD.
- **required_dependencies**: CĂ¡c dependency vĂ  version, báº¯t buá»™c pháº£i liá»‡t kĂª chĂ­nh xĂ¡c.
- **security & secrets**: Liá»‡t kĂª secrets cáº§n thiáº¿t vĂ  nÆ¡i lÆ°u trá»¯.
- **runbook_refs**: Tham chiáº¿u tá»›i tĂ i liá»‡u xá»­ lĂ½ sá»± cá»‘.
- **deployment_strategy**: Chiáº¿n lÆ°á»£c rollout.
- **data_governance**: ChĂ­nh sĂ¡ch dá»¯ liá»‡u.
- **working_dir**: ThÆ° má»¥c project mĂ  agent lĂ m viá»‡c.

---

## Role
MĂ´ táº£ ngáº¯n gá»n vai trĂ² tá»•ng thá»ƒ cá»§a agent trong há»‡ thá»‘ng.  

---

## Core Responsibilities
Liá»‡t kĂª chi tiáº¿t cĂ¡c nhiá»‡m vá»¥ chĂ­nh mĂ  agent Ä‘áº£m nháº­n, dáº¡ng bullet (bĂ¡m sĂ¡t theo `DOS.md`).
- **Knowledge Management**: TrĂ¡ch nhiá»‡m TUYá»†T Äá»I quáº£n lĂ½, duy trĂ¬ vĂ  cáº­p nháº­t thÆ° má»¥c `.knowledge/agent[N]/`. Báº¯t buá»™c pháº£i tuĂ¢n thá»§ cĂ¡c template chuáº©n trong `.knowledge/shared/`. Khi lĂ m viá»‡c, pháº£i thÆ°á»ng xuyĂªn rĂ  soĂ¡t vĂ  cáº­p nháº­t `KnowledgeBase_[N].md`, `Skill_[N].md`, vĂ  Ä‘áº·c biá»‡t lĂ  `Log_[N].md` bĂ¡m sĂ¡t tiáº¿n Ä‘á»™ thá»±c táº¿ (theo Ä‘Ăºng cÆ¡ cháº¿ trigger).

---

## Key Constraints
CĂ¡c rĂ ng buá»™c, hĂ nh vi bá»‹ cáº¥m, outbound call (bĂ¡m sĂ¡t theo `DOS.md`, `agent_boundaries.yaml`, `data_schema.yaml`, `openapi.yaml`)

---

## Technical Stack
NgĂ´n ngá»¯, framework, thÆ° viá»‡n chĂ­nh (bĂ¡m sĂ¡t theo `DOS.md`)  

---

## Knowledge Scope
- **Must know**: Kiáº¿n thá»©c cáº§n thiáº¿t pháº£i biáº¿t vĂ  Ä‘Ă o sĂ¢u
- **Must not know**: Kiáº¿n thá»©c ngoĂ i pháº¡m vi, khĂ´ng cáº§n biáº¿t, khĂ´ng Ä‘Æ°á»£c phĂ©p can thiá»‡p.

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
- **Difference from Skill.md**: Skill.md ghi láº¡i lá»—i báº¥t ngá» Ä‘Ă£ fix; Error Handling Ä‘á»‹nh nghÄ©a lá»—i dá»± phĂ²ng vĂ  cĂ¡ch pháº£n á»©ng ngay.  

---

## Success Criteria
Äá»‹nh nghÄ©a rĂµ rĂ ng tháº¿ nĂ o lĂ  â€œlĂ m Ä‘Ăºngâ€, Ä‘áº£m báº£o agent khĂ´ng áº£o tÆ°á»Ÿng vá» káº¿t quáº£ mĂ  nĂ³ lĂ m ra.  

---