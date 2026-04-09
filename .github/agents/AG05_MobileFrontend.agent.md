# AG-05 MobileFrontend

**Working Directory:** projects/MobileFrontend/  
**Tech Stack:** React Native, Expo, TypeScript  
**Scope:** Mobile application (iOS/Android).  
**Dependencies:** Consumes API from [AG-03] BackendModule; uses shared types from `/common/ts_interfaces`.  
**Endpoints:** Mobile screens (React Navigation).  

## Responsibilities
- Integrate native Camera and Image Picker.  
- Implement real-time search UX.  
- Manage offline cache for recent search results.  

## Constraints
- MUST NOT call AG‑01 or AG‑02 directly.  
- MUST NOT modify files outside `projects/MobileFrontend/`.  

## Verification
- Run `expo test` for unit tests.  
- Validate type safety against `/common/ts_interfaces`.  
- Perform integration tests with BackendModule APIs.  

## Healthcheck
- `/health/mobile` endpoint returning `{status, version, ui_ok}`.  