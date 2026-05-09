# KnowledgeBase_05.md

## Metadata  
- **id**: KB_AG05_01
- **title**: Mobile Interface Knowledge Base (Mobile Frontend Module)
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
- **scope_summary**: Foundational knowledge for engineers working on the React Native + Expo Mobile Application. Defines hardware interactions (Camera/Picker), Offline synchronization paradigms, and Share Extension capabilities.
- **dos_reference**: 
  - Section 2.4: The Interface & DevOps - Mobile App configurations.
  - Section 3: UPLOAD AND SEARCH FLOWS (Adapted for Mobile API interaction).

---

## Core Concepts  
- **Hardware Integration & Permissions**: Interaction with local device modules relies heavily on `expo-camera` and `expo-image-picker`. Applications must explicitly and gracefully request Android/iOS permissions prior to mounting related components to prevent OS-level process kills.
- **Offline Caching Capabilities**: Support local review of past search outcomes. `AsyncStorage` or `MMKV` persists serialized JSON responses. Application state should respond dynamically by monitoring the `NetInfo` hook.
- **Share Extension Architecture**: Involves Expo plugins and potential native bridging, allowing users to invoke SISE inference directly when selecting "Share" from native galleries or 3rd-party social media applications.
- **Presigned Uploads for Mobile**: Analogous to Web, Mobile clients query AG-03 for momentary MinIO URL leases, offloading binary payloads directly to storage via HTTP PUT.

---

## Trusted References  
1. **React Native/Expo Hardware APIs**
   - title: Camera and Image Picker Documentation
   - url: https://docs.expo.dev/versions/latest/sdk/camera/
   - type: Official Library Docs
   - trust_level: High
   - notes: Governs OS-level media procurement.
2. **EAS (Expo Application Services)**
   - title: EAS Build Config
   - url: https://docs.expo.dev/build/introduction/
   - type: Official Docs
   - trust_level: High
   - notes: Primary system for CI/CD compilation of raw IPA and APK artifacts without localized Mac hardware.
3. **Apollo Client / React Query for Mobile**
   - title: Fetching and Caching State
   - url: https://tanstack.com/query/latest
   - type: Reference
   - trust_level: High
   - notes: Ensures data-state consistency across web and mobile experiences.

---

## Internal References  
- `E:\SISE\.context\DOS.md`: The ultimate system guideline.
- `E:\SISE\.context\openapi.yaml`: Canonical contract for Mobile-to-Backend data typings.
- `E:\SISE\.knowledge\agent05\Skill_05.md`: Compendium covering iOS deployment crashes, bridging errors, and unhandled permission faults.

---

## Do Not Do  
- DATABASE / ML PROXIMITY: Mobile networks possess sporadic latency; circumventing the Backend to directly invoke Storage (Postgres/Milvus) or AI endpoints presents a massive unrecoverable security/architecture violation.
- PREMATURE EJECTION: Ejecting the ecosystem into raw React Native (`expo eject`) dismantles EAS workflows and is strictly forbidden without orchestrated AG-00 consent.

---

## Provenance and Change Log  
- 2024-05-18 | Project Owner + AI | Translated | Converted to professional technical English.

---

## Validation Hooks  
- The `app.json` parameter sets undergo strict CI review confirming App Identifier congruency (`package`/`bundleIdentifier`).

---

## Review Cadence  
- **review_interval_days**: 90
- **next_review_due**: 2026-08-09

---

## Tags and Search Metadata  
- **tags**: [frontend, mobile, react-native, expo, eas, ios, android]
- **keywords**: camera-api, async-storage, share-extension, offline-cache, presigned
- **canonical_id**: kb.ag05.rn.1
