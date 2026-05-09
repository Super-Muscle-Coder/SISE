# KnowledgeBase_04.md

## Metadata  
- **id**: KB_AG04_01
- **title**: Web Interface Knowledge Base (Web Frontend Module)
- **version**: 1.0.0
- **created_at**: 2026-05-09
- **created_by**: Project Owner
- **last_updated**: 2026-05-09
- **last_reviewed**: 2026-05-09
- **review_owner**: AG-00 Auditor
- **status**: active
- **visibility**: internal
- **retention_policy_days**: 365

---

## Scope and Purpose  
- **scope_summary**: Serves as the technical manifesto for the Web Frontend (React + Vite + Tailwind). Provides protocols for user interface design, Drag and Drop upload flows, and secure API delegation strictly through AG-03.
- **dos_reference**: 
  - Section 2.4: The Interface & DevOps - Web App specifications.
  - Section 3: UPLOAD AND SEARCH FLOWS.

---

## Core Concepts  
- **Direct MinIO Upload (Presigned URL)**: During bulk operations, the client bypasses the application server, executing PUT requests directly into MinIO storage. This prevents network saturation on the API Gateway.
- **State Management**: Zustand or Redux Toolkit operate globally for session variables (e.g., active user, upload queue states). `@tanstack/react-query` exclusively handles the caching and invalidation of server-side data fetching.
- **Seamless Search Interaction**: Interface designs must natively render `similarity score` metrics accompanying search results. Explicit loading states (Skeleton UI) and Error Boundaries are mandatory.
- **Responsive Architecture**: Tailwind CSS relies on mobile-first paradigms. Grid subsystems must elegantly decay or scale from Desktop configurations down to Tablet and Mobile form-factors.

---

## Trusted References  
1. **React / Vite Documentation**
   - title: Vite Setup & Hot Module Replacement
   - url: https://vitejs.dev/guide/
   - type: Official Docs
   - trust_level: High
   - notes: Foundation for bundle architecture, replacing memory-heavy tools like Webpack.
2. **Tailwind CSS Utility Classes**
   - title: Tailwind CSS Documentation
   - url: https://tailwindcss.com/docs
   - type: Official Docs
   - trust_level: High
   - notes: Standard for layout structure and composite styling.
3. **React Query Data Fetching**
   - title: TanStack Query
   - url: https://tanstack.com/query/latest
   - type: Official Library Docs
   - trust_level: High
   - notes: Essential for reducing redundant HTTP calls and optimizing UI state synchronization.

---

## Internal References  
- `E:\SISE\.context\DOS.md`: The ultimate system guideline.
- `E:\SISE\.context\openapi.yaml`: The strict schema mapping tool for defining Frontend HTTP client structures.
- `E:\SISE\.knowledge\agent04\Skill_04.md`: Repositories addressing cross-origin resource sharing (CORS), upload retries, and UI debouncing.

---

## Do Not Do  
- INFRASTRUCTURE BYPASS: Under no circumstance shall the web module connect to PostgreSQL directly or post inference requests directly to the AI Service. All traffic must transit the Gateway (Port 8000).
- EXPOSING SECRETS: The client-side bundle is public. Never store MinIO `secret_key` or Database credentials in the UI `.env` configuration.

---

## Provenance and Change Log  
- 2024-05-18 | Project Owner + AI | Translated | Converted to professional technical English.

---

## Validation Hooks  
- The deployment pipeline mandates success on `eslint --ext .js,.jsx,.ts,.tsx`.
- Vite productions builds must complete within standard memory constraints (heap bounds).

---

## Review Cadence  
- **review_interval_days**: 60
- **next_review_due**: 2026-07-09

---

## Tags and Search Metadata  
- **tags**: [frontend, react, vite, tailwindcss, web-ui, spa]
- **keywords**: state-management, presigned-url upload, skeleton loader, re-query, drag-and-drop
- **canonical_id**: kb.ag04.fe.1
