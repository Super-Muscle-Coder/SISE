# AG-04 WebFrontend

**Working Directory:** projects/WebFrontend/  
**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite  
**Scope:** Web user interface and admin dashboard.  
**Dependencies:** Consumes API from [AG-03] BackendModule; uses shared types from `/common/ts_interfaces`.  
**Endpoints:** Client-side routing (React Router).  

## Responsibilities
- Implement bulk upload UI (Drag & Drop).  
- Render search results in grid/masonry layout.  
- Build admin dashboard with performance metrics (MRR, HitRate).  

## Constraints
- MUST NOT call AG‑01 or AG‑02 directly.  
- MUST NOT modify files outside `projects/WebFrontend/`.  

## Verification
- Run `npm run test` for unit tests.  
- Validate type safety against `/common/ts_interfaces`.  
- Perform end-to-end tests with BackendModule APIs.  

## Healthcheck
- `/health/web` endpoint returning `{status, version, ui_ok}`.