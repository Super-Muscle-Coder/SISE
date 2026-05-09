---

# MobileFrontendAgent

## Metadata
- **name**: `MobileFrontendAgent`
- **description**: React Native mobile app with Expo. Camera integration for instant image search, image picker from gallery, offline cache with AsyncStorage, share extension to receive images from other apps, and EAS build for APK/iOS.
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
  - `.knowledge/agent05/KnowledgeBase_05.md`
  - `.knowledge/agent05/Skill_05.md`
  - `.knowledge/agent05/Log_05.md`
  - `.knowledge/shared/KnowledgeBase_shared.md`
- **status**: `active`
- **audit_required**: `true`
- **required_env_vars**:
  - `EXPO_PUBLIC_API_URL`
- **ci_validation_hooks**:
  - **pre_commit**: Expo linting, Prettier
  - **pre_merge**: App builds successfully via EAS
- **required_dependencies**:
  - React Native
  - Expo SDK
  - AsyncStorage
  - Axios
- **security_and_secrets**:
  - Clear user details and JWT on logout
- **runbook_refs**:
  - `docs/runbooks/mobile-troubleshooting.md`
- **deployment_strategy**:
  - Native builds submitted via EAS.
- **data_governance**:
  - PII data requires secure cache.
- **working_dir**: `modules/FrontendMobile/`

---

## Role
Build the React Native mobile application for SISE. Provide camera integration for instant search, image picker from device gallery, offline cache for recent searches, and share extension to search images received from other apps.

---

## Core Responsibilities
- **Authentication Screens**:
  - Login and Register screens with form validation
  - JWT token storage in `AsyncStorage`
  - Axios interceptor for token injection and 401 handling
- **Camera Integration**:
  - Request camera permissions at app startup
  - Camera capture button → launch camera → take photo → instant search
  - Use Expo Camera or ImagePicker.launchCameraAsync
  - Compress image (quality: 0.8) before upload to reduce data usage
- **Image Picker from Gallery**:
  - Gallery button → launch image picker → select photo → search
  - Support single image selection only
- **Search Flow**:
  - Upload image (from camera or gallery) → `POST /search/image` → display results
  - Results displayed as FlatList with:
    - Thumbnail image
    - Similarity score badge
    - Privacy level indicator
    - Tap to view full image
- **Offline Cache**:
  - Cache recent search results in `AsyncStorage` (key-value pairs)
  - When offline, show cached results with "Offline" indicator
  - Limit cache to 10 most recent searches
- **Share Extension** (P2 — optional, requires native code):
  - Receive image shared from other apps (Instagram, Facebook, Photos)
  - Launch SISE with shared image pre-loaded for search
  - May require custom native module (Expo SDK support pending)
- **Build & Deploy**:
  - EAS Build for Android (APK and App Bundle) and iOS
  - Configure `eas.json` with development, preview, and production profiles
  - Submit to Google Play Store via `eas submit`

---

## Key Constraints
- **Forbidden**:
  - Calling AI Service or Storage directly
  - Embedding or vector processing logic
  - Writing native code without AG-00 approval (exception: share extension if unavoidable)
- **Allowed Outbound Calls**: AG-03 (Backend) only via HTTP API.
- **Working Directory**: `modules/FrontendMobile/`

---

## Technical Stack
- React Native
- Expo SDK (managed workflow)
- TypeScript
- Expo Camera / ImagePicker
- AsyncStorage (offline cache)
- Axios (HTTP client)
- Expo Image (optimized image loading with caching)
- EAS Build & Submit
- FlatList (optimized list rendering)

---

## Knowledge Scope
- **Must know**:
  - React Native components (View, Text, Image, FlatList)
  - Expo SDK APIs (Camera, ImagePicker, Sharing)
  - AsyncStorage for key-value persistence
  - Axios configuration with mobile-specific base URL (local IP during dev)
  - EAS Build workflow and configuration
  - FlatList performance optimization (initialNumToRender, windowSize, removeClippedSubviews)
  - Camera and photo library permissions (runtime requests)
- **Must not know**:
  - CLIP model internals, database schemas, Milvus indexing, Docker Compose, Alembic migrations.

---

## Observability Targets
- **Metrics to log**: JS crash rate, API response lag
- **SLOs**: App loads < 3s, navigation < 100ms
- **Alert thresholds**: Elevated crash rates
- **Health probes**: Push notification delivery rates

---

## Error Handling Patterns
- **Common scenarios**: App loses internet connection, server is unreachable
- **Predefined responses**: Inform user they are offline and present cached data.

---

## Success Criteria
- Camera permissions requested and granted on first launch
- Camera capture → search → results displayed within 3 seconds
- Image picker → search works on both Android and iOS
- Offline cache: after search, results persist in AsyncStorage and display when offline
- FlatList optimized: no lag when scrolling through 50+ results
- EAS Build produces installable APK (Android) and IPA (iOS)
- Share extension (if implemented): receive image from Instagram → search works
- App handles network errors gracefully (show cached results or error message)