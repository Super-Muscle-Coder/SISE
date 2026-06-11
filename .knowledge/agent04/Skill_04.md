# Skill_04.md

## Metadata
- id: SKILL_AG04_DB
- agent_id: AG-04
- agent_name: Web Frontend Agent
- skill_db_version: 1.0.0
- total_skills_acquired: 3
- created_at: 2026-05-10
- last_skill_added: 2026-05-10
- retention_policy_days: 365
- status: active

---

## Skill Entry 1

- skill_id: AG04_SKILL_001
- timestamp: 2026-05-10T14:30:00Z
- trigger_event: Frontend build failures in media_adapters.ts and media_configs.ts
- context: Task T004-01, media upload workflow implementation
- symptom: TypeScript compiler errors on Album and MediaItem imports; invalid const assertion on MIME type array
- root_cause: Missing Entity imports from @/entities/media_entities; attempted dynamic MIME type const assertion where literal union required
- solution: Added explicit imports for Album and MediaItem types; refactored MIME type parsing to use static literals with validation loop. Validated against openapi.yaml response schema.
- prevention: Always import entity types before use in adapters. Use static type literals for const assertions; perform validation separately for dynamic values. Follow five-layer architecture strictly: entities define contracts, adapters consume them.
- related_skills: [AG04_SKILL_002]
- tags: [typescript, imports, const-assertion, media-workflow]
- confidence_level: high
- review_status: validated
- reviewed_by: AG-04 self-review, verified by successful build
- archived: false

---

## Skill Entry 2

- skill_id: AG04_SKILL_002
- timestamp: 2026-05-10T15:45:00Z
- trigger_event: Bulk upload confirmation guard rejecting valid album IDs
- context: Task T004-04, bulk_media_services.ts presigned upload workflow
- symptom: useBulkUploadQueue state machine was filtering out valid albumId values during confirmation step
- root_cause: Guard condition checked albumId against all previous attempts instead of against the current upload queue entry. Logic error in defensive programming; guard was too strict.
- solution: Corrected confirmation guard to verify albumId exists in current upload state, not against historical records. Updated guard pattern to return early if album not found, allowing valid IDs to proceed.
- prevention: When implementing confirmation guards, verify they match the contract scope: guard destination state, not entire history. Unit test confirmation paths with valid IDs before deployment. Document guard intent in JSDoc.
- related_skills: [AG04_SKILL_001]
- tags: [state-machine, confirmation-guard, bulk-upload, business-logic]
- confidence_level: high
- review_status: validated
- reviewed_by: AG-04 in-chat review
- archived: false

---

## Skill Entry 3

- skill_id: AG04_SKILL_003
- timestamp: 2026-05-10T17:20:00Z
- trigger_event: Vite module resolution conflict when centralizing env_helpers utility
- context: Task T004-06, consolidating config layer to use shared env_helpers from utils/ folder
- symptom: Build error "Could not load src/utils/env_helpers (imported by src/configs/auth_configs.ts); ENOENT". Vite resolving @/utils/env_helpers to src/utils/ instead of root utils/.
- root_cause: Vite alias resolution order: when @/* matched before @/utils/*, all @/utils/* paths treated as @ prefix expansions, falling back to src/. Alias priority and specificity mishandled in vite.config.ts.
- solution: Reordered resolve.alias in vite.config.ts: placed @/utils before @ so specific paths match first. Also updated tsconfig.json compilerOptions.paths to mirror exact priority. Verified both compile-time (TypeScript) and runtime (Vite) resolution aligned.
- prevention: When adding path aliases, always test resolution order for specificity conflicts. More specific paths (with additional segments) must appear before generic prefixes. Validate both tsc and vite builds independently. Document alias strategy in ARCHITECTURE.md or project README.
- related_skills: [AG04_SKILL_001]
- tags: [vite-config, typescript-paths, module-resolution, path-aliasing]
- confidence_level: high
- review_status: validated
- reviewed_by: AG-04 verified by successful npm run build
- archived: false

---

## Statistics
- total_skills: 3
- by_tag: { typescript: 2, frontend-config: 2, state-machine: 1, module-resolution: 1 }
- by_confidence: { high: 3, medium: 0, low: 0 }
- by_review_status: { validated: 3, experimental: 0, needs_review: 0 }

---

## Operational Metadata
- review_cadence_days: 30
- next_review_date: 2026-06-09
- edit_roles: [AG-04, AG-00]
- notes_and_todo: Monitor for similar path resolution issues when introducing new utility layers. Consider creating a checklist for config layer refactors.