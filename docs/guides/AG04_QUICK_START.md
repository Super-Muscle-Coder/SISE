# Quick Start Guide for AG-04 (WebFrontendAgent)

> **Bạn là AI Frontend Agent. Đây là hướng dẫn nhanh để bắt đầu Phase 4.**

---

## 🎯 Nhiệm vụ của bạn

Xây dựng **React Web Frontend** (React 18 + Vite + Tailwind CSS) để tiêu thụ các API backend đã hoàn thành từ Phase 3.

**6 workflows cần implement:**
1. ✅ **Scaffold** (vite init, axios setup) — T004-01
2. ✅ **Auth** (login/register pages) — T004-02
3. ✅ **Media** (album dashboard) — T004-03
4. ✅ **Upload** (presigned URL, drag-drop) — T004-04
5. ✅ **Search** (image/text query, results) — T004-05
6. ✅ **Evaluation** (dashboard, charts) — T004-06

---

## 📖 PHẢI ĐỌC (MUST READ)

### Contract Files (Chính sách toàn dự án)
1. **[`.context/DOS.md`](#)** — Hiểu hệ thống làm gì
   - Multimodal retrieval (image-to-image, text-to-image search)
   - Privacy-aware (chỉ show ảnh user có quyền)

2. **[`.context/data_schema.yaml`](#)** — Hiểu dữ liệu
   - Vector dimension = 512
   - Privacy levels: 0=private, 1=friends, 2=public
   - Upload flow: presigned URL → binary upload → confirm
   - Constraints: max 20MB, jpg/png only

3. **[`.context/openapi.yaml`](#)** — Hiểu API endpoints
   - Auth: `/auth/register`, `/auth/login`, `/auth/me`
   - Media: `/albums`, `/albums/{id}`, `/media`, `/media/{id}`
   - Upload: `/media/upload-url`, `/media/upload/confirm`
   - Search: `/search/image`, `/search/text`
   - Evaluation: `/eval/metrics`, `/eval/run`, `/eval/results/{id}`

### Architecture (Cấu trúc code)
4. **[`.knowledge/shared/Workflow_Centric_Architecture.md`](#)** — Tổ chức code theo workflow
   - 5 lớp: entities (types), adapters (API calls), services (logic), routers (pages)
   - Tách biệt concern → dễ test, dễ debug

### Agent Profile (Quyền hạn)
5. **[`.github/agents/WebFrontendAgent.agent.md`](#)** — Bạn là ai
   - Working directory: `modules/frontendweb/`
   - Language: TypeScript
   - Only call AG-03 (Backend) — no direct AI Service or Storage calls

### Agent Boundaries (Giới hạn quyền)
6. **[`.context/agent_boundaries.yaml`](#)** — Bạn được làm gì
   - ✅ Write to `modules/frontendweb/` + `.knowledge/agent04/`
   - ❌ Don't modify `.context/`, `.github/`, docker-compose

---

## 🚀 GETTING STARTED

### Step 1: Initialize Vite Project
```bash
cd modules/frontendweb

# Create Vite React TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer eslint prettier typescript
npm install axios react-router-dom zustand recharts

# Initialize Tailwind
npx tailwindcss init -p
```

### Step 2: Create Environment File
```bash
# Create .env.local (git-ignored)
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# Create .env.example (commit this)
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.example
```

### Step 3: Start Dev Server
```bash
npm run dev
# → Open http://localhost:5173
```

---

## 📂 Directory Structure (After Scaffold)

```
modules/frontendweb/
├── src/
│   ├── entities/              # TypeScript interfaces (matching openapi.yaml)
│   │   ├── auth_entities.ts   # User, AuthRequest, AuthResponse
│   │   ├── upload_entities.ts # PresignedUploadResponse, UploadResponse
│   │   └── search_entities.ts # SearchResultItem, SearchResponse
│   │
│   ├── adapters/              # HTTP client wrappers (Axios)
│   │   ├── api_client.ts      # Base Axios instance + JWT interceptor
│   │   ├── auth_api.ts        # POST /auth/*, GET /auth/me
│   │   ├── upload_api.ts      # POST /media/upload-*
│   │   ├── media_api.ts       # GET/POST /media, /albums, DELETE
│   │   ├── search_api.ts      # POST /search/*
│   │   └── evaluation_api.ts  # GET /eval/metrics
│   │
│   ├── services/              # Business logic + state management
│   │   ├── auth_service.ts    # Login/logout, token store
│   │   ├── upload_service.ts  # Presigned URL flow, file validation
│   │   ├── media_service.ts   # Album/image state
│   │   ├── search_service.ts  # Query state management
│   │   └── evaluation_service.ts # Metric fetching
│   │
│   ├── pages/                 # React pages
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx  # Album list + image grid
│   │   ├── UploadPage.tsx
│   │   ├── SearchPage.tsx
│   │   └── EvaluationPage.tsx
│   │
│   ├── components/            # Reusable UI components
│   │   ├── NavBar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── AlbumCard.tsx
│   │   ├── ImageCard.tsx
│   │   ├── DropZone.tsx (drag-drop)
│   │   └── ... (others)
│   │
│   ├── App.tsx                # Root router
│   └── main.tsx
│
├── .env.example
├── .env.local (git-ignored)
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## ⚡ Quick Code Snippet

### Axios API Client with JWT Interceptor
```typescript
// src/adapters/api_client.ts
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
})

// Request: Add JWT token to Authorization header
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
	config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: Redirect to login on 401
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

### Auth Service with Zustand
```typescript
// src/services/auth_service.ts
import { create } from 'zustand'
import client from '../adapters/api_client'

interface AuthStore {
  token: string | null
  user: any | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('access_token'),
  user: null,

  login: async (username, password) => {
	const res = await client.post('/auth/login', { username, password })
	localStorage.setItem('access_token', res.data.access_token)
	set({ token: res.data.access_token })
  },

  logout: () => {
	localStorage.removeItem('access_token')
	set({ token: null, user: null })
  }
}))
```

### Protected Route
```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../services/auth_service'

export function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token)
  return token ? children : <Navigate to="/login" />
}
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Example Test
```typescript
// src/components/LoginPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from './LoginPage'

test('renders login form', () => {
  render(<LoginPage />)
  expect(screen.getByText(/email/i)).toBeInTheDocument()
  expect(screen.getByText(/password/i)).toBeInTheDocument()
})
```

---

## 📚 Full Handoff Document

**Read the complete handoff here:**  
👉 [**`docs/handoff/PHASE_4_HANDOFF_AG04.md`**](#)

Contains:
- ✅ All 6 workflows with deliverables
- ✅ Detailed endpoint mappings
- ✅ Testing checklist
- ✅ Environment setup
- ✅ Architecture patterns
- ✅ Knowledge management responsibilities

---

## 🎯 Workflow Sequencing

### Week 1
- **T004-01 (Scaffold):** 1-2 days
  - Vite init, Tailwind, Axios, Router
  - Auth context / Zustand store
  - Base layout component

- **T004-02 (Auth):** 1-2 days
  - LoginPage
  - RegisterPage
  - ProtectedRoute guard

### Week 2
- **T004-03 (Media):** 1.5 days
  - DashboardPage (album list)
  - AlbumDetailPage
  - AlbumModal (create/edit)
  - ImageCard + grid

- **T004-04 (Upload):** 1.5 days
  - UploadPage
  - DropZone (drag-drop)
  - Presigned URL flow
  - Progress bars + retry

### Week 3
- **T004-05 (Search):** 1.5 days
  - SearchPage (image + text tabs)
  - SearchResults grid
  - Result cards + scores
  - Infinite scroll

- **T004-06 (Evaluation):** 1 day
  - EvaluationPage
  - Metric cards (MRR, HitRate, Precision, Recall)
  - Charts (recharts)

---

## 📝 Knowledge Management

**You MUST keep these updated:**

1. **`.knowledge/agent04/KnowledgeBase_04.md`**
   - Update after each workflow (T004-01 → T004-06)
   - Mark status: 🟢 DONE / 🟡 IN PROGRESS / ❌ BLOCKED
   - List tests passing, integration points, quality gates

2. **`.knowledge/agent04/Skill_04.md`**
   - Add entries when you discover something unexpected
   - Include: Context, Symptom, Root Cause, Solution, Prevention

3. **`.knowledge/agent04/Log_04.md`**
   - Log events: milestones, decisions, blockers
   - One entry per significant event
   - Include timestamp, task_id, summary, metrics

**AG-00 audits your knowledge every Friday** — keep it fresh!

---

## ❓ FAQ

**Q: Can I call AG-01 (AI Service) directly?**
A: **NO.** Always go through AG-03 (Backend) via `/search/image` and `/search/text` endpoints.

**Q: Can I modify docker-compose.yml?**
A: **NO.** AG-00 owns that file. Contact AG-00 if you need infrastructure changes.

**Q: How do I handle errors?**
A: Show user-friendly toast messages. Example:
```typescript
try {
  await api.search(query)
} catch (error) {
  toast.error('Search failed. Please try again.')
}
```

**Q: What if backend API changes?**
A: Contact AG-03 (backendmoduleagent). Update openapi.yaml and sync with your types.

**Q: Should I use Redux or Zustand?**
A: **Zustand** recommended. Simpler, lighter, faster to iterate.

---

## 🚨 Common Pitfalls

- ❌ Don't store tokens in state only (use localStorage too)
- ❌ Don't forget `Authorization: Bearer <token>` in API calls
- ❌ Don't upload to MinIO directly (use presigned URL flow)
- ❌ Don't hardcode `http://localhost:8000` (use VITE_API_BASE_URL)
- ❌ Don't forget Idempotency-Key header on upload endpoints

---

## 📞 Need Help?

- **API questions:** Contact AG-03 (BackendModuleAgent)
- **Governance/unblocking:** Contact AG-00 (OrchestratorAgent)
- **Documentation/contracts:** Check `.context/openapi.yaml`

---

## ✅ Success Criteria

By end of Phase 4:
- [ ] 6 workflows implemented (T004-01 through T004-06)
- [ ] 40+ tests passing
- [ ] Zero console errors
- [ ] Responsive on 768px + 1920px
- [ ] Full end-to-end flow works (login → upload → search)
- [ ] KnowledgeBase_04.md fully updated
- [ ] Build succeeds without warnings

---

**Now go build the frontend! 🚀**

**Questions?** Check `docs/handoff/PHASE_4_HANDOFF_AG04.md` for full details.

---

*Last updated: 2026-05-12*  
*Prepared by: AG-00 (OrchestratorAgent)*
