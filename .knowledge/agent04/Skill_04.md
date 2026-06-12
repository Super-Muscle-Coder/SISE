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

## Skill Entry 4

- skill_id: AG04_SKILL_004
- timestamp: 2026-05-10T18:45:00Z
- trigger_event: AOS-like scroll animation playing twice on page load and scroll
- context: Task T004-08, Footer scroll-triggered animation implementation with Intersection Observer
- symptom: Animation plays once automatically when page loads (element appears at final animation position), then plays again when user scrolls to footer. Creates "flash" or "phantom" effect where element briefly appears in wrong position before animation starts.
- root_cause: Used CSS `animation` property in inline styles, which auto-plays on DOM render. When Intersection Observer triggered state change (`isVisible = true`), React re-rendered with new animation, causing element to "jump" from animation end position back to start, then animate again. Essentially animation ran twice: once auto-play, once on state change.
- solution: Replaced `animation` property with CSS `transition` property. Transitions only execute on property value changes, not auto-play. Changed from `animation: slideInUp 600ms ease-out ${delay}ms forwards` to `transition: all 600ms ease-out ${delay}ms`. Also added explicit `React.CSSProperties` type annotation to `getAnimationStyle` function to prevent TypeScript visibility property errors: `const getAnimationStyle = (delay: number): React.CSSProperties => { ... }`.
- prevention: For scroll-triggered "on-demand" animations, always use CSS `transition` (state-driven) instead of `animation` (auto-play). When element should remain hidden before trigger, use `visibility: hidden` + `opacity: 0` in initial state. Always type animate/style functions with `React.CSSProperties` to catch TypeScript property errors early. Document this pattern: transition for scroll-trigger, animation only for page-load sequences.
- related_skills: [AG04_SKILL_001, AG04_SKILL_003]
- tags: [animation, transition, scroll-trigger, aos-pattern, intersection-observer, react-css, typescript]
- confidence_level: high
- review_status: validated
- reviewed_by: AG-04 confirmed with end-user via visual testing; no double-play artifact observed
- archived: false

## Statistics
- total_skills: 4
- by_tag: { typescript: 3, animation: 1, scroll-trigger: 1, transition: 1, aos-pattern: 1, react-css: 1 }
- by_confidence: { high: 4, medium: 0, low: 0 }
- by_review_status: { validated: 4, experimental: 0, needs_review: 0 }

---

## Operational Metadata
- review_cadence_days: 30
- next_review_date: 2026-06-09
- edit_roles: [AG-04, AG-00]
- notes_and_todo: Animation transition pattern can be reused across site for all scroll-triggered effects (header fade, section reveals, etc.). Consider creating reusable hook: `useScrollAnimation(threshold)` that returns `{ style, ref }` for consistent AOS behavior. Monitor for similar double-play issues in other components using Intersection Observer + animation.nd_todo: Monitor for similar path resolution issues when introducing new utility layers. Consider creating a checklist for config layer refactors.