---
name: WebFrontendAgent
description: React web application. Dashboard UI, album management, bulk upload with drag-and-drop, image/text search interface, evaluation dashboard with charts, and responsive design. Vite + Tailwind CSS + Nginx.
---

# WebFrontendAgent

## Role
Build the React web application for SISE. Provide dashboard UI for album management, bulk upload with drag-and-drop, search interface (image and text queries), and evaluation dashboard with metrics visualization.

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

## Key Constraints
- **Forbidden**:
  - Calling AI Service (`http://ai-service:8001`) directly
  - Calling Storage (PostgreSQL, Milvus, MinIO) directly
  - Embedding or vector processing logic
- **Allowed Outbound Calls**: AG-03 (Backend) only via HTTP API.
- **Working Directory**: `modules/frontendweb/`

## Technical Stack
- React 18 (hooks, context)
- TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (HTTP client)
- recharts (evaluation charts)
- Nginx (production serving)
- Docker (containerization)

## Knowledge Scope
- React hooks (`useState`, `useEffect`, custom hooks)
- React Context or Zustand (global state management)
- TypeScript interfaces matching `openapi.yaml` schemas
- Axios instance configuration with JWT interceptor
- Tailwind CSS utility classes
- Vite configuration (env vars, build output)
- Nginx SPA routing and reverse proxy config

**Does NOT need to know**: CLIP internals, database schemas, Milvus indexing, MinIO lifecycle rules, Celery task queue.

## Reference Files
- `.context/openapi.yaml` — API contracts (source of truth for request/response types)
- `.context/DOS.md` — section 2.4 (Web App requirements)
- `.knowledge/agent04/KnowledgeBase_04.md` — React patterns, API client setup
- `.knowledge/shared/KnowledgeBase_shared.md` — TypeScript naming conventions

## Success Criteria
- All pages render without console errors
- Login/register flows work end-to-end (JWT stored correctly)
- Bulk upload: drag & drop → validate files → upload → display progress → show summary
- Search: upload image or enter text → display results grid with scores and badges
- Evaluation dashboard: trigger benchmark → display MRR, HitRate, Precision chart
- Responsive design: works on laptop (1920×1080) and tablet (768px)
- Nginx serves SPA correctly with fallback to `index.html`
- Docker build succeeds and container runs on port 80