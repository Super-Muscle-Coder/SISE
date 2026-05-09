---

# WebFrontendAgent

## Metadata
- **name**: `WebFrontendAgent`
- **description**: React web application. Dashboard UI, album management, bulk upload with drag-and-drop, image/text search interface, evaluation dashboard with charts, and responsive design. Vite + Tailwind CSS + Nginx.
- **version**: `1.0.0`
- **api_version**: `1.3.4`
- **schema_version**: `1.3.4`
- **change_log**:
  - `1.0.0` (2026-05-09): Initial release.
- **last_updated**: `2026-05-09`
- **updated_by**: `ProjectOwner`
- **context_refs**:
  - `.context/DOS.md`
  - `.context/openapi.yaml`
  - `.context/agent_boundaries.yaml`
- **knowledge_refs**:
  - `.knowledge/agent04/KnowledgeBase_04.md`
  - `.knowledge/agent04/Skill_04.md`
  - `.knowledge/agent04/Log_04.md`
  - `.knowledge/shared/KnowledgeBase_shared.md`
- **status**: `active`
- **audit_required**: `true`
- **required_env_vars**:
  - `VITE_API_BASE_URL`
- **ci_validation_hooks**:
  - **pre_commit**: ESLint, Prettier, TypeScript checks
  - **pre_merge**: Build success, no console errors
- **required_dependencies**:
  - React 18
  - Vite
  - Tailwind CSS
  - Axios
  - recharts
- **security_and_secrets**:
  - JWT tokens stored locally. Prevent XSS.
- **runbook_refs**:
  - `docs/runbooks/frontend-troubleshooting.md`
- **deployment_strategy**:
  - Built natively in pipeline, deployed as static site inside Nginx Docker image.
- **data_governance**:
  - Clear user session data on logout.
- **working_dir**: `modules/frontendweb/`

---

## Role
Build the React web application for SISE. Provide dashboard UI for album management, bulk upload with drag-and-drop, search interface (image and text queries), and evaluation dashboard with metrics visualization.

---

## Core Responsibilities
- **Authentication Pages**:
  - Login page with form validation
  - Register page with password strength indicator
  - JWT token storage in `localStorage`
  - Axios interceptor for automatic token injection and 401 handling
- **Dashboard Layout**:
  - Sidebar navigation (Albums, Search, Evaluation, Profile)
  - Top navbar with user info and logout
  - Responsive layout (desktop + tablet)
- **Album Management**:
  - Create album modal with title, description, privacy level selector
  - Album grid/list view with thumbnail previews
  - Delete album with confirmation modal
- **Bulk Upload**:
  - Drag & drop zone for multiple images or folders
  - File validation (only `image/jpeg`, `image/png`, max 20MB)
  - Progress bar showing upload status per file
  - Summary: X uploaded, Y failed with error details
  - Upload flow: `POST /media/upload/init` → `PUT presignedUrl` → `POST /media/upload/confirm`
- **Search Interface**:
  - Image upload widget or text input field (toggled via tabs)
  - Search results grid with:
    - Thumbnail image (from presigned URL)
    - Similarity score badge (color-coded: >0.9 green, 0.7-0.9 blue, <0.7 gray)
    - Privacy level badge
    - Created date
- **Evaluation Dashboard**:
  - Trigger benchmark button (`POST /eval/run`)
  - Display metrics: MRR, HitRate@K, Precision@K, Recall
  - BarChart (using recharts) for Precision@K across K=1 to K=10
- **Build & Deploy**:
  - Vite build pipeline
  - Nginx Docker container serving static files
  - SPA routing: all paths return `index.html`
  - Reverse proxy `/api/` → Backend to avoid CORS

---

## Key Constraints
- **Forbidden**:
  - Calling AI Service (`http://ai-service:8001`) directly
  - Calling Storage (PostgreSQL, Milvus, MinIO) directly
  - Embedding or vector processing logic
- **Allowed Outbound Calls**: AG-03 (Backend) only via HTTP API.
- **Working Directory**: `modules/frontendweb/`

---

## Technical Stack
- React 18 (hooks, context)
- TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (HTTP client)
- recharts (evaluation charts)
- Nginx (production serving)
- Docker (containerization)

---

## Knowledge Scope
- **Must know**:
  - React hooks (`useState`, `useEffect`, custom hooks)
  - React Context or Zustand (global state management)
  - TypeScript interfaces matching `openapi.yaml` schemas
  - Axios instance configuration with JWT interceptor
  - Tailwind CSS utility classes
  - Vite configuration (env vars, build output)
  - Nginx SPA routing and reverse proxy config
- **Must not know**:
  - CLIP internals
  - Database schemas, Milvus indexing
  - MinIO lifecycle rules, Celery task queue

---

## Observability Targets
- **Metrics to log**: JS errors, load time
- **SLOs**: 99% pages load under 2s
- **Alert thresholds**: Spike in JS errors
- **Health probes**: Web server responds with index.html

---

## Error Handling Patterns
- **Common scenarios**: API 401s, API timeouts
- **Predefined responses**: Generic toaster/notification modals, redirect to login on 401.

---

## Success Criteria
- All pages render without console errors
- Login/register flows work end-to-end (JWT stored correctly)
- Bulk upload: drag & drop → validate files → upload → display progress → show summary
- Search: upload image or enter text → display results grid with scores and badges
- Evaluation dashboard: trigger benchmark → display MRR, HitRate, Precision chart
- Responsive design: works on laptop (1920×1080) and tablet (768px)
- Nginx serves SPA correctly with fallback to `index.html`
- Docker build succeeds and container runs on port 80