# KnowledgeBase_04.md

## Metadata
- id: KB_AG04_001
- title: Web Frontend Module - React + Vite + Tailwind CSS
- version: 2.0.0
- created_at: 2026-05-09
- created_by: Project Owner
- last_updated: 2026-05-10
- last_reviewed: 2026-05-10
- review_owner: AG-00 Auditor
- status: active
- visibility: internal
- retention_policy_days: 365

---

## Scope and Purpose
- scope_summary: Serves as the technical knowledge base for the Web Frontend module (React 18 + Vite 5 + Tailwind CSS 3.4). Provides protocols for workflow implementation (authentication, media upload, search, evaluation), component architecture, environment configuration, and strict API delegation through AG-03 (Backend).
- dos_reference: 
  - Section 2.4: The Interface & DevOps - Web App specifications
  - Section 3: UPLOAD AND SEARCH FLOWS
  - Section 4: EVALUATION FLOWS

---

## Core Concepts

### 1. Centralized Environment Management
All environment variables flow through modules/frontendweb/utils/env_helpers.ts. Config modules (media_configs.ts, search_configs.ts, auth_configs.ts, scaffold_configs.ts, eval_configs.ts) consume env helpers to maintain single source of truth in frontendweb.env.local. No inline environment parsing allowed.

### 2. Direct MinIO Upload (Presigned URL Pattern)
The bulk upload workflow bypasses the application server during file transfer:
- Frontend requests presigned URL from Backend (POST /media/upload-url)
- Backend returns presigned URL from MinIO
- Frontend uploads binary directly to MinIO via PUT
- Frontend confirms upload completion to Backend (POST /media/confirm-upload)
This pattern prevents network saturation on API Gateway and improves throughput for concurrent uploads.

### 3. Layered Frontend Architecture
Five-layer design applied to workflow modules:
- Layer 1 (Configs): Environment-driven constants via env_helpers
- Layer 2 (Adapters): HTTP client layer using scaffoldAdapter wrapper; no direct axios calls
- Layer 3 (Entities): TypeScript domain models aligned to openapi.yaml schemas
- Layer 4 (Services): React hooks orchestrating business logic, state machines, polling
- Layer 5 (Routers): UI components consuming services and rendering results

### 4. State Management & Data Fetching
Global state (authentication, active album, session metadata) managed via Zustand. Server-side data fetching exclusively through React Query (TanStack Query) for caching, invalidation, and request deduplication. No Redux; hooks-first approach for business logic.

### 5. Masonry Grid & Image Rendering
Search results and album galleries use CSS Grid with auto-fit/auto-fill for responsive masonry. Images lazy-loaded with Intersection Observer. Minimize animation complexity to protect server load; prefer static layouts and skeleton loaders for perceived performance.

### 6. Design System Consistency
Tailwind CSS utility-first approach with mobile-first responsive design. Color palette and typography defined in tailwind.config.ts and globals.css. All components respect design tokens; no hardcoded colors or sizes outside Tailwind.

### 7. Path Resolution & Module Aliasing
TypeScript paths configured in tsconfig.json:
- @/* -> ./src/* (source modules)
- @/utils/* -> ./utils/* (shared utilities like env_helpers)
Vite resolver aliases must match exactly for runtime resolution. Both compile-time and runtime must align.

---

## Trusted References

1. **React 18 Documentation**
   - title: React Hooks API Reference
   - url: https://react.dev/reference/react/hooks
   - type: Official Docs
   - trust_level: High
   - notes: Foundation for component lifecycle, hooks-first architecture, state management patterns.

2. **Vite Documentation**
   - title: Vite - Getting Started
   - url: https://vitejs.dev/guide/
   - type: Official Docs
   - trust_level: High
   - notes: Build tooling, HMR, env variable injection (VITE_ prefix), module resolution.

3. **Tailwind CSS**
   - title: Tailwind CSS Documentation
   - url: https://tailwindcss.com/docs
   - type: Official Docs
   - trust_level: High
   - notes: Utility-first CSS framework, responsive design, color schemes, configuration.

4. **TanStack Query (React Query)**
   - title: TanStack Query Documentation
   - url: https://tanstack.com/query/latest
   - type: Official Library Docs
   - trust_level: High
   - notes: Server state management, caching, request deduplication, automatic refetching.

5. **Axios HTTP Client**
   - title: Axios Documentation
   - url: https://axios-http.com/
   - type: Official Docs
   - trust_level: High
   - notes: Promise-based HTTP client, request/response interceptors, timeout handling.

6. **TypeScript Configuration**
   - title: TypeScript Compiler Options
   - url: https://www.typescriptlang.org/tsconfig
   - type: Official Docs
   - trust_level: High
   - notes: Path mapping, strict mode, module resolution, incremental compilation.

---

## Internal References
- E:\SISE\.context\DOS.md: System Design and Operating Standards
- E:\SISE\.context\openapi.yaml: API contract definitions and response schemas
- E:\SISE\.context\data_schema.yaml: Data constraints and entity relationships
- E:\SISE\modules\frontendweb\utils\env_helpers.ts: Centralized env parsing utility
- E:\SISE\.knowledge\agent04\Skill_04.md: Resolved issues and patterns learned
- E:\SISE\.knowledge\agent04\Log_04.md: Event journal and decision history

---

## Do Not Do

- INFRASTRUCTURE BYPASS: The frontend must never connect directly to PostgreSQL, Milvus, MinIO, or AI Module. All traffic transits through AG-03 (Backend) on port 8000.
- EXPOSING SECRETS: MinIO secret_key, database credentials, and API keys must never appear in frontend .env or bundled code. Presigned URLs are temporary and safe to store in session.
- INLINE ENV PARSING: Config modules must consume centralized env_helpers.getEnvVar* functions. Do not inline import.meta.env access in component files.
- DUPLICATE STATE LOGIC: Use React Query for server state, Zustand for UI state. Do not duplicate fetching logic across components.
- COMPLEX ANIMATIONS: Prioritize frontend performance over visual polish. Avoid page-wide animations, cascading transitions, or particle effects.
- HARDCODED VALUES: All URL paths, thresholds, timing constants must come from frontendweb.env.local through centralized configs.

---

## Provenance and Change Log

- 2026-05-09 | Project Owner | Initial version | Established baseline knowledge base structure
- 2026-05-10 | AG-04 | v2.0.0 | Expanded with centralized env management, five-layer architecture, masonry grid, and state management patterns; aligned to frontendweb module completion

---

## Validation Hooks

- ESLint must pass on all .tsx and .ts files (npm run lint)
- TypeScript strict mode must compile without errors (npm run type-check)
- Vite production build must complete with no console errors (npm run build)
- No secrets or API keys must appear in bundled dist/ output
- All imports must resolve correctly via path aliases (@/ and @/utils)

---

## Review Cadence

- review_interval_days: 60
- next_review_due: 2026-07-10

---

## Tags and Search Metadata

- tags: [frontend, react, vite, tailwindcss, web-ui, spa, presigned-upload, masonry-grid, state-management, react-query]
- keywords: environment-configuration, centralized-env-helpers, five-layer-architecture, http-adapters, typescript-paths, direct-minio-upload, react-hooks, design-system, responsive-layout
- canonical_id: kb.ag04.fe.2026-05-10