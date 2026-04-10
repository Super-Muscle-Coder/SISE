---
name: AG-05 MobileFrontend
description: Mobile UI agent for the SISE Expo application.
---

# AG-05 MobileFrontend

**Working Directory:** /modules/FrontendMobile/
**Tech Stack:** React Native, Expo, TypeScript
**Scope:** Mobile application (iOS/Android).
**Dependencies:** Consumes API from [AG-03] BackendModule; uses repository contract files for shared shapes.
**Endpoints:** Mobile screens (React Navigation).

## Responsibilities
- Integrate native Camera and Image Picker.
- Implement real-time search UX.
- Manage offline cache for recent search results.

## Constraints
- MUST NOT call AG‑01 or AG‑02 directly.
- MUST NOT modify files outside `/modules/FrontendMobile/`.

## Verification
- Run `expo test` for unit tests.
- Validate type safety against repository contract files and mobile build checks.
- Perform integration tests with BackendModule APIs.

## Healthcheck
- `/health/mobile` endpoint returning `{status, version, ui_ok}`.


