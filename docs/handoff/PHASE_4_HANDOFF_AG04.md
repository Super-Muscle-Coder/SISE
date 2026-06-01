# PHASE 4 HANDOFF — WebFrontendAgent (AG-04)

> **Ngày bàn giao:** 2026-05-12  
> **Bàn giao từ:** AG-00 (OrchestratorAgent) + AG-03 (BackendModuleAgent)  
> **Bàn giao cho:** AG-04 (WebFrontendAgent)  
> **Status:** 🟢 Ready to Start  
> **Preceding Phase:** ✅ Phase 3 (Backend API Service) — 162/162 tests passing

---

## 📋 TÓM TẮT BÀN GIAO

Phần **Backend API** (AG-03) đã hoàn thành toàn bộ 7 workflows theo Phase 3:
- ✅ Auth (JWT register/login/me)
- ✅ Upload (5-step pipeline, presigned URL, idempotency)
- ✅ Media (album/image CRUD, soft delete)
- ✅ Search (image/text search, privacy-aware filtering)
- ✅ Evaluation (MRR, HitRate, Precision, Recall)
- ✅ Health probes (liveness, readiness)
- ✅ 162 unit + integration tests passing, 0 failures

**Giờ đến lượt bạn:** Xây dựng **React Web Frontend** để tiêu thụ các API này.

---

## 🎯 MỤC TIÊU PHASE 4

### Scope chính (Core)
Xây dựng **React + Vite + Tailwind web application** với các chức năng bắt buộc:

| Workflow | Tên Task | Chức năng | Endpoint phụ thuộc |
|----------|----------|----------|-------------------|
| **scaffold** | T004-01 | Project init, Axios setup, JWT interceptor | - |
| **auth** | T004-02 | Login/Register pages, JWT storage | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| **media** | T004-03 | Dashboard, Album management (CRUD) | `GET/POST /albums`, `GET/PUT/DELETE /albums/{id}`, `GET /media` |
| **upload** | T004-04 | Bulk upload Drag & Drop, presigned URL flow | `POST /media/upload-url`, `POST /media/upload/confirm` |
| **search** | T004-05 | Search UI (image/text query), grid results | `POST /search/image`, `POST /search/text` |
| **evaluation** | T004-06 | Evaluation dashboard, charts (MRR, HitRate, Precision@K, Recall) | `GET /eval/metrics`, `POST /eval/run` (optional) |

### Phương pháp giao diện
- **Responsive design:** Hoạt động trên laptop/desktop (1920px) và tablet (768px+)
- **User experience:** Smooth interactions, loading states, error toasts
- **Accessibility:** WCAG 2.1 AA (tối thiểu)

---

## 📚 BẢN HỢP ĐỒNG DÙNG

### 1. **Kiến trúc hệ thống — DOS.md**
🔗 [`.context/DOS.md`](#)

**Bạn cần biết:**
- Hệ thống này là **Multimodal Retrieval Engine** — cho phép user upload ảnh, tìm kiếm theo image-to-image hoặc text-to-image
- Backend AG-03 là **API Gateway** — nhạc trưởng điều phối AI Service (AG-01) + Storage (AG-02)
- Frontend của bạn chỉ giao tiếp với **AG-03 qua HTTP API** (xem openapi.yaml)
- **Privacy-Aware Search:** User chỉ nhìn thấy ảnh với thích hợp permissions (private=0, friends=1, public=2)

**[Cấm lệnh]** ⛔ Không gọi thẳng AG-01 (AI Service), AG-02 (Storage), hay bất kỳ service khác

### 2. **Dữ liệu & Ràng buộc — data_schema.yaml**
🔗 [`.context/data_schema.yaml`](#)

**Bạn cần biết:**

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Vector dimension** | 512 (CLIP ViT-B/32) — sử dụng header `X-Expected-Vector-Dim` từ `/health/readiness` để validate |
| **Privacy levels** | 0=Private, 1=Friends, 2=Public — phải show badge rõ trên UI |
| **Upload flow** | S1 (presigned URL) → S2 (client PUT to MinIO) → S3 (confirm metadata) → S4-S5 (async embed+index) |
| **Idempotency** | Upload/index requests phải dùng `Idempotency-Key` header (UUID) để tránh duplicate |
| **Image constraints** | Max file size: 20MB, allowed: image/jpeg, image/png |
| **Search metadata** | Kết quả phải include: image_id, user_id, minio_url, privacy_level, tags, created_at, index_status |

### 3. **API Contract — openapi.yaml**
🔗 [`.context/openapi.yaml`](#)

**Bạn cần:** Request schema, response schema, status codes, error handling cho mỗi endpoint (xem bảng dưới)

#### **Auth Endpoints**
```
POST /auth/register
  Body: {username, email, password}
  Response 201: {id, username, email, created_at}

POST /auth/login
  Body: {username, password}
  Response 200: {access_token, token_type: "bearer", expires_in}

GET /auth/me [PROTECTED]
  Response 200: {id, username, email, created_at}
```

#### **Upload Endpoints**
```
POST /media/upload-url [PROTECTED]
  Body: {filename, content_type, expected_size_mb?}
  Response 200: {upload_url, object_key, expires_in_sec, max_file_size_mb, allowed_content_types}
  Error 409: Idempotency key duplicate (client should retry with same key)

POST /media/upload/confirm [PROTECTED]
  Body: {object_key, album_id, privacy_level, tags[]}
  Response 200: {image_id, minio_url, status, index_status}

POST /media/upload (legacy multipart, fallback)
  FormData: {file, album_id, privacy_level}
  Response 201: {image_id, minio_url, status, index_status}
```

#### **Media (Album) CRUD**
```
GET /albums [PROTECTED]
  Query: {offset=0, limit=20}
  Response 200: {items[], total, offset, limit}

POST /albums [PROTECTED]
  Body: {title, description, is_public}
  Response 201: Album object

GET /albums/{album_id} [PROTECTED]
  Response 200: Album object

PUT /albums/{album_id} [PROTECTED]
  Body: {title, description, is_public}
  Response 200: Album object

DELETE /albums/{album_id} [PROTECTED]
  Response 204: (no content)
```

#### **Media (Image) CRUD**
```
GET /media [PROTECTED]
  Query: {offset=0, limit=20, album_id?}
  Response 200: {items[], total, offset, limit}

GET /media/{image_id} [PROTECTED]
  Response 200: {image_id, user_id, album_id, minio_url, privacy_level, tags, created_at, index_status}

PUT /media/{image_id}/update [PROTECTED]
  Body: {album_id, privacy_level, tags[]}
  Response 200: Image object

DELETE /media/{image_id}/delete [PROTECTED]
  Response 204: (no content)
```

#### **Search Endpoints**
```
POST /search/image [PROTECTED]
  FormData: {file, top_k=10, metric="COSINE", album_id?}
  Response 200: {results[], latency_ms, top_k}

POST /search/text [PROTECTED]
  Body: {query_text, top_k=10, metric="COSINE", album_id?}
  Response 200: {results[], latency_ms, top_k}

Search result item:
  {image_id, score, minio_url, metadata{...}}
```

#### **Evaluation Endpoints**
```
POST /eval/run [PROTECTED, Admin?]
  Body: {limit=100, seed?}
  Response 202: {eval_id, status: "running"}

GET /eval/results/{eval_id} [PROTECTED]
  Response 200: {eval_id, status, mrr, hit_rate, precision, recall, query_count, completed_at}

GET /eval/metrics [PROTECTED]
  Response 200: {mrr, hit_rate, precision, recall}
```

#### **Health Endpoints** (không protected)
```
GET /health/liveness
  Response 200: {status: "ready", ...}

GET /health/readiness
  Response 200 or 503: {status, dependencies, headers.X-Expected-Vector-Dim: 512}
```

### 4. **Cấu trúc 5 Lớp — Workflow_Centric_Architecture.md**
🔗 [`.knowledge/shared/Workflow_Centric_Architecture.md`](#)

**Áp dụng bán phần cho Frontend (tuy React đặc thù):**

```
src/
├── [entities/]
│   ├── auth_entities.ts         # Pydantic models → TypeScript interfaces
│   │   (User, AuthRequest, AuthResponse, etc.)
│   ├── upload_entities.ts       # PresignedUploadResponse, UploadResponse
│   └── search_entities.ts       # SearchResultItem, SearchResponse
│
├── [adapters/]
│   ├── api_client.ts            # Axios instance, JWT interceptor
│   ├── auth_api.ts              # HTTP calls to /auth/* endpoints
│   ├── upload_api.ts            # HTTP calls to /media/upload-* endpoints
│   ├── search_api.ts            # HTTP calls to /search/* endpoints
│   └── media_api.ts             # HTTP calls to /media* endpoints
│
├── [services/]
│   ├── auth_service.ts          # Logic: token store/retrieve, login/logout
│   ├── upload_service.ts        # Logic: presigned URL flow, file validation
│   ├── search_service.ts        # Logic: query page state management
│   └── media_service.ts         # Logic: album/image state management
│
├── [routers/pages/]
│   ├── LoginPage.tsx            # Auth workflow UI
│   ├── DashboardPage.tsx        # Album management UI
│   ├── UploadPage.tsx           # Bulk upload UI
│   ├── SearchPage.tsx           # Search results UI
│   └── EvaluationPage.tsx       # Evaluation dashboard UI
│
└── App.tsx / main.tsx           # Root router, layout
```

**Quy tắc:**
- ✅ Entities = TypeScript interfaces/types matching openapi.yaml
- ✅ Adapters = HTTP client wrappers (Axios calls)
- ✅ Services = Business logic + state management (React Context / Zustand)
- ✅ Routers = Pages + components (render layer)
- ❌ Services không gọi HTTP thẳng; phải qua Adapters
- ❌ Pages không gọi API thẳng; phải qua Services

**Lợi ích:** Code dễ test, dễ debug, dễ bảo trì (tách biệt concern)

---

## 🔐 Agent Boundaries — Qui định quyền hạn

🔗 [`.context/agent_boundaries.yaml`](#)

**Bạn được phép (AG-04):**
- ✅ Write: `modules/frontendweb/` (working directory exclusive)
- ✅ Write: `.knowledge/agent04/` (KnowledgeBase_04.md, Skill_04.md, Log_04.md)
- ✅ Read: `.context/` (tất cả contract files)
- ✅ Read: `.knowledge/shared/` (templates)
- ✅ Call: AG-03 (Backend API) qua HTTP

**Bạn cấm (AG-04):**
- ❌ Call AG-01 (AI Service) trực tiếp
- ❌ Call AG-02 (Storage) trực tiếp
- ❌ Write vào `.github/`, `.context/`, hay `modules/` của agents khác
- ❌ Modify docker-compose.yml
- ❌ Heavy image processing (embedding, resize) — phải gọi backend

---

## 📖 Agent Profile — Bạn là ai

🔗 [`.github/agents/WebFrontendAgent.agent.md`](#)

| Thuộc tính | Giá trị |
|-----------|--------|
| **Role** | Build React web application |
| **Working Directory** | `modules/frontendweb/` |
| **Language** | TypeScript |
| **Framework** | React 18, Vite, Tailwind CSS |
| **Dependency calls** | AG-03 (Backend) only |
| **Knowledge Location** | `.knowledge/agent04/` |
| **Audit requirement** | Yes (AG-00 audit weekly) |

---

## 🚀 ROADMAP PHASE 4

### T004-01: Scaffold (3-4 giờ)
**Deliverables:**
- ✅ Vite project init với React 18 + Tailwind
- ✅ TypeScript linting + Prettier config
- ✅ Axios instance với JWT interceptor
- ✅ Environment variable setup (.env.local)
- ✅ Router structure (React Router v6)
- ✅ Layout component (Navbar, Sidebar skeleton)
- ✅ Authentication context / Zustand store
- ✅ 1-2 smoke tests passing

**Files to create:**
```
modules/frontendweb/
├── src/
│   ├── entities/auth_entities.ts
│   ├── adapters/api_client.ts
│   ├── services/auth_service.ts
│   ├── routers/RootLayout.tsx
│   └── App.tsx
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

---

### T004-02: Auth Pages (4-5 giờ)
**Deliverables:**
- ✅ LoginPage: Email + Password form, validation, error toast, redirect to dashboard on success
- ✅ RegisterPage: Email + Password + Confirm Password, validation, success redirect
- ✅ Profile dropdown / Settings page (GET /auth/me)
- ✅ Logout button (clear token, redirect to login)
- ✅ Protected route guard (redirect anonymous to login)
- ✅ 8-10 component tests

**UI Components:**
- Form input with validation helper (email format, password strength)
- Loading spinner, error toast, success toast
- Responsive form layout (mobile-first)

**Files to create:**
```
src/
├── pages/LoginPage.tsx
├── pages/RegisterPage.tsx
├── pages/ProfilePage.tsx
├── components/
│   ├── AuthForm.tsx
│   ├── ProtectedRoute.tsx
│   └── NavBar.tsx
└── services/auth_service.ts (update with login/logout logic)
```

---

### T004-03: Media (Album Management) (4-5 giờ)
**Deliverables:**
- ✅ Dashboard page with album list (paginated, GET /albums)
- ✅ Album creation modal (POST /albums)
- ✅ Album detail page (GET /albums/{album_id})
- ✅ Album update form (PUT /albums/{album_id})
- ✅ Album delete with confirmation (DELETE /albums/{album_id})
- ✅ Image list within album (GET /media?album_id=X)
- ✅ Image metadata card (image preview, privacy level badge, tags)
- ✅ Image delete button (soft delete)
- ✅ 10-12 component tests

**UI Components:**
- AlbumCard (list view)
- AlbumModal (create/edit)
- ImageCard (grid view, lazy load)
- PrivacyBadge (visual indicator 0=🔒 private, 1=👥 friends, 2=🌐 public)

**Files to create:**
```
src/
├── pages/DashboardPage.tsx
├── pages/AlbumDetailPage.tsx
├── components/
│   ├── AlbumCard.tsx
│   ├── AlbumModal.tsx
│   ├── ImageCard.tsx
│   ├── PrivacyBadge.tsx
│   └── Pagination.tsx
└── services/media_service.ts
└── adapters/media_api.ts
```

---

### T004-04: Upload (Bulk Upload with Presigned URL) (5-6 giờ)
**Deliverables:**
- ✅ Upload page with Drag & Drop zone (accepts multiple files)
- ✅ File validation (size, type) client-side
- ✅ Presigned URL request (POST /media/upload-url)
- ✅ Direct S3 upload to MinIO (binary PUT)
- ✅ Upload progress bar per file
- ✅ Confirm upload step (POST /media/upload/confirm)
- ✅ Album/privacy selection before confirm
- ✅ Idempotency-Key header (UUID) to prevent duplicates
- ✅ Retry on failure
- ✅ Success toast with image preview
- ✅ 8-10 component tests

**UI Components:**
- DropZone component (drag-drop area, file input fallback)
- UploadProgress (progress bar, cancel button per file)
- AlbumSelector (dropdown/modal to choose target album)
- PrivacySelector (radio buttons: 0, 1, 2)
- ImagePreview (thumbnail before confirm)

**Files to create:**
```
src/
├── pages/UploadPage.tsx
├── components/
│   ├── DropZone.tsx
│   ├── UploadProgress.tsx
│   ├── AlbumSelector.tsx
│   ├── PrivacySelector.tsx
│   └── ImagePreview.tsx
├── services/upload_service.ts
└── adapters/upload_api.ts
```

**Luồng code:**
```typescript
// 1. User drops files
// 2. Validate: size <= 20MB, type in [image/jpeg, image/png]
// 3. For each file:
//    a. POST /media/upload-url → presigned_url, object_key
//    b. PUT presigned_url with binary file
//    c. Show progress bar (0-100%)
// 4. User selects album + privacy level
// 5. POST /media/upload/confirm {object_key, album_id, privacy_level, tags[]}
// 6. Show success toast + image preview
```

---

### T004-05: Search (Image + Text Query) (5-6 giờ)
**Deliverables:**
- ✅ Search page with two tabs: "Image Search" + "Text Search"
- ✅ Image Search: Upload image (file input) → POST /search/image
- ✅ Text Search: Text input → POST /search/text
- ✅ Results grid: Show top-K results (default K=10)
- ✅ Result item card: image preview, score (similarity %), privacy badge, user name, tags, created_at
- ✅ Privacy filter enforcement: Only show images user can see
- ✅ Album filter (optional): Filter results to specific album
- ✅ Metric selector: Dropdown for similarity metric (COSINE default)
- ✅ Pagination / Infinite scroll for results
- ✅ "See full image" link (open minio_url in new tab)
- ✅ 10-12 component tests

**UI Components:**
- SearchTabs (Image vs Text)
- ImageUploadInput (similar to upload but mini)
- TextQueryInput (text area with suggestions)
- SearchResults (grid layout, lazy load)
- ResultCard (image + metadata)
- ScoreBadge (0-100%, color-coded: red <30%, yellow 30-70%, green >70%)

**Files to create:**
```
src/
├── pages/SearchPage.tsx
├── components/
│   ├── SearchTabs.tsx
│   ├── ImageUploadInput.tsx
│   ├── TextQueryInput.tsx
│   ├── SearchResults.tsx
│   ├── ResultCard.tsx
│   └── ScoreBadge.tsx
├── services/search_service.ts
└── adapters/search_api.ts
```

**Luồng code:**
```typescript
// Image Search
// 1. User upload image → /search/image (multipart/form-data)
// 2. Backend: embed image → query Milvus → return top-K
// 3. Frontend: render results with score

// Text Search
// 1. User type query → POST /search/text {query_text, top_k=10}
// 2. Backend: embed text → query Milvus → return top-K
// 3. Frontend: render results with score
```

---

### T004-06: Evaluation Dashboard (4-5 giờ)
**Deliverables:**
- ✅ Evaluation page with charts
- ✅ Fetch GET /eval/metrics (MRR, HitRate, Precision, Recall)
- ✅ Display 4 chart cards:
  - MRR (Mean Reciprocal Rank) — gauge / progress bar
  - HitRate@K — percentage
  - Precision@K — percentage
  - Recall — percentage
- ✅ Optional: POST /eval/run button (trigger evaluation)
- ✅ Status display (completed_at, query_count)
- ✅ Auto-refresh every 30s (polling)
- ✅ 4-6 component tests

**UI Components:**
- MetricCard (title, value, unit)
- GaugeChart / ProgressChart (recharts for visualization)
- EvaluationStatus (timestamp, query count)
- RunButton (optional trigger)

**Files to create:**
```
src/
├── pages/EvaluationPage.tsx
├── components/
│   ├── MetricCard.tsx
│   ├── GaugeChart.tsx
│   └── EvaluationStatus.tsx
├── services/evaluation_service.ts
└── adapters/evaluation_api.ts
```

---

## ⚙️ Cấu hình dự án

### Environment Variables
Tạo file `.env.local` (git-ignored):
```bash
# Backend Gateway URL
VITE_API_BASE_URL=http://localhost:8000

# Optional: AI Service health check
VITE_HEALTH_CHECK_INTERVAL=30000
```

Tạo file `.env.example` để commit:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Vite Config
```typescript
// vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
	proxy: {
	  '/api': {
		target: 'http://localhost:8000',
		changeOrigin: true
	  }
	}
  }
})
```

### Tailwind Init
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Axios Setup
```typescript
// src/adapters/api_client.ts
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
	'Content-Type': 'application/json'
  }
})

// JWT interceptor
client.interceptors.request.use(
  (config) => {
	const token = localStorage.getItem('access_token')
	if (token) {
	  config.headers.Authorization = `Bearer ${token}`
	}
	return config
  },
  (error) => Promise.reject(error)
)

// Redirect to login on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
	if (error.response?.status === 401) {
	  localStorage.removeItem('access_token')
	  window.location.href = '/login'
	}
	return Promise.reject(error)
  }
)

export default client
```

---

## 🧪 Testing Checklist

### Unit Tests (Jest + React Testing Library)
- [ ] Auth service (login, logout, token storage)
- [ ] Upload service (presigned URL flow, file validation)
- [ ] Search service (query state management)
- [ ] Media service (album CRUD state)

### Component Tests
- [ ] LoginPage form validation + submission
- [ ] AlbumCard renders correctly + delete works
- [ ] UploadPage drag-drop + progress bars
- [ ] SearchResults renders grid + infinite scroll
- [ ] EvaluationPage fetches + displays metrics

### E2E Tests (Cypress / Playwright)
- [ ] Full signup → login → upload → search flow
- [ ] Album create → view → edit → delete
- [ ] Presigned upload flow (mock MinIO)
- [ ] Search by image + text

### Smoke Tests
- [ ] All pages load without console errors
- [ ] All API calls use correct headers (Authorization, Idempotency-Key)
- [ ] Form validation works (email, password, file size)

---

## 📝 Knowledge Management — Trách Nhiệm của Bạn

Bạn PHẢI cập nhật các tệp sau thường xuyên:

### 🔶 `.knowledge/agent04/KnowledgeBase_04.md`
**Update sau mỗi workflow hoàn thành:**
```markdown
## Workflow: [workflow_name]
- Status: ✅ DONE / 🟡 IN PROGRESS / ❌ BLOCKED
- Tasks: T004-NN
- Key learnings:
  - ...
- Integration points:
  - POST /api/... → handled by component X
  - GET /api/... → handled by service Y
- Quality gates:
  - ✅ All acceptance criteria met
  - ✅ Tests passing (N tests)
  - ✅ No console errors
  - ✅ Responsive on mobile/tablet
```

### 🟢 `.knowledge/agent04/Skill_04.md`
**Add skill entries when you learn something unexpected:**
```markdown
### SKL-04-NNN: [Skill name]
**Context:** Why you discovered this  
**Symptom:** What went wrong  
**Root cause:** Why it happened  
**Solution:** How you fixed it  
**Prevention:** How to avoid next time  
**Example:** Code snippet or link  
```

### 🔵 `.knowledge/agent04/Log_04.md`
**Log significant events (milestones, decisions, blockers):**
```markdown
### Event #N: [Event title]
**timestamp**: 2026-05-DD  
**event_type**: milestone / decision / blocker  
**task_id**: T004-NN  
**summary**: One-liner  
**details**: Full description  
**metrics**: Test count, LOC, etc.  
**next_steps**: What comes next  
```

---

## 🤝 Communication & Unblocking

**If you get blocked:**
1. Update `.knowledge/agent04/Log_04.md` with **Event type: blocker**
2. Tag the issue: `@AG-00 [BLOCKED] ...` in PR comment
3. AG-00 will respond within one working day

**Weekly check-in:**
- Every Monday: Review KnowledgeBase_04.md
- AG-00 audits `.knowledge/agent04/` every week (Friday)
- Update Skill_04.md with new discoveries

---

## 📦 Deliverables Checklist

By end of Phase 4, you should deliver:

- [ ] **Code**: All 6 workflows completed (T004-01 through T004-06)
- [ ] **Tests**: Min 40 component + unit tests, all passing
- [ ] **Docs**: KnowledgeBase_04.md updated with all workflows marked ✅ COMPLETE
- [ ] **Build**: `npm run build` succeeds, no warnings
- [ ] **E2E**: Login → Upload → Search → Evaluation flow works end-to-end
- [ ] **Quality**: No console errors, responsive on 1920px + 768px widths
- [ ] **Knowledge**: Skill_04.md + Log_04.md up-to-date

---

## 🎬 Getting Started

```bash
# Navigate to web frontend
cd modules/frontendweb

# Install dependencies
npm install

# Start dev server (Vite)
npm run dev
# → Open http://localhost:5173

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚨 Important Notes

1. **API Base URL**: Ensure `VITE_API_BASE_URL` points to AG-03 backend (default: `http://localhost:8000`)
2. **CORS**: Backend may need CORS config if running on different port
3. **JWT Token**: Always include `Authorization: Bearer <token>` header (Axios interceptor handles this)
4. **Idempotency**: For upload/index endpoints, include `Idempotency-Key: <uuid>` header
5. **Vector Dimension**: Before uploading search query, call `GET /health/readiness` to read `X-Expected-Vector-Dim` header
6. **Error Handling**: All API errors should show user-friendly toast messages (avoid raw error objects in UI)
7. **Privacy Badges**: Always show privacy level visually (🔒 for private, 👥 for friends, 🌐 for public)

---

## 📞 Contact & Escalation

**Questions about:**
- **Backend API:** Contact AG-03 (BackendModuleAgent)
- **Storage/DB:** Contact AG-02 (StorageModuleAgent)
- **Orchestration/Governance:** Contact AG-00 (OrchestratorAgent)

---

**Good luck! 🚀 Let's build something amazing!**

---

**Handoff Date:** 2026-05-12  
**Prepared by:** AG-00 (OrchestratorAgent)  
**Status:** ✅ Ready
