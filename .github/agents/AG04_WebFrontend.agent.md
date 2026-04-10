---
name: AG-04 WebFrontend
description: Web UI agent for the SISE admin dashboard and search experience.
---

# AG-04 WebFrontend

**Working Directory:** /modules/frontendweb/
**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite
**Scope:** Web user interface and admin dashboard.
**Dependencies:** Consumes API from [AG-03] BackendModule; uses repository contract files for shared shapes.
**Endpoints:** Client-side routing (React Router).

## Responsibilities
- Implement bulk upload UI (Drag & Drop).
- Render search results in grid/masonry layout.
- Build admin dashboard with performance metrics (MRR, HitRate).

## Constraints
- MUST NOT call AG‑01 or AG‑02 directly.
- MUST NOT modify files outside `/modules/frontendweb/`.

## Verification
- Run `npm run test` for unit tests.
- Validate type safety against repository contract files and frontend build checks.
- Perform end-to-end tests with BackendModule APIs.

## Healthcheck
- `/health/web` endpoint returning `{status, version, ui_ok}`.


