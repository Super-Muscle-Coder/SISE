# =============================================================================
# KNOWLEDGE BASE — AG-04 WebFrontendAgent
# =============================================================================
# Writer  : Project Owner + AG-00 + AG-04 (đề xuất, AG-00 approve)
# Reader  : AG-04 chủ yếu
# =============================================================================

## 1. DOMAIN KNOWLEDGE: PROJECT STRUCTURE

```
modules/frontendweb/
├── public/
├── src/
│   ├── api/                     # Toàn bộ API calls tập trung ở đây
│   │   ├── client.ts            # Axios instance + JWT interceptor
│   │   ├── auth.ts              # register(), login()
│   │   ├── media.ts             # uploadInit(), confirmUpload(), listImages()
│   │   ├── albums.ts            # createAlbum(), listAlbums(), deleteAlbum()
│   │   └── search.ts            # searchByImage(), searchByText()
│   ├── components/
│   │   ├── ui/                  # Atomic: Button, Input, Modal, Badge, ...
│   │   ├── layout/              # Sidebar, Navbar, PageWrapper
│   │   ├── album/               # AlbumCard, AlbumGrid, CreateAlbumModal
│   │   ├── media/               # ImageCard, ImageGrid, BulkUploadDropzone
│   │   └── search/              # SearchBar, SearchResultGrid, SimilarityBadge
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useImageSearch.ts
│   │   └── useBulkUpload.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SearchPage.tsx
│   │   └── EvaluationPage.tsx
│   ├── store/                   # Global state (Zustand hoặc Context)
│   │   └── authStore.ts
│   ├── types/                   # TypeScript interfaces, đồng bộ với openapi.yaml
│   │   ├── auth.ts
│   │   ├── media.ts
│   │   └── search.ts
│   └── utils/
│       ├── fileValidation.ts    # Validate file type/size trước khi upload
│       └── formatters.ts        # Format score, date, ...
├── nginx.conf
├── Dockerfile
└── vite.config.ts
```

---

## 2. DOMAIN KNOWLEDGE: API CLIENT SETUP

### 2.1 Axios instance với JWT interceptor

```typescript
// src/api/client.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  timeout: 10000,   // Đồng bộ với global_configs.default_timeout_ms
});

// Request interceptor: tự động đính kèm JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: xử lý 401 → redirect login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2.2 TypeScript types đồng bộ với openapi.yaml

```typescript
// src/types/search.ts — phải khớp với openapi.yaml → SearchResult
interface SearchResult {
  imageId: string;           // UUID
  similarityScore: number;   // 0.0 → 1.0
  privacyLevel: 0 | 1 | 2;
  presignedUrl: string;
  albumId: number | null;
  createdAt: string;         // ISO 8601
}

// src/types/media.ts
interface UploadInitResponse {
  uploadUrl: string;
  objectKey: string;
}
```

---

## 3. DOMAIN KNOWLEDGE: BULK UPLOAD

### 3.1 Upload flow từ góc độ Frontend

```
1. User drag & drop folder/files vào BulkUploadDropzone
2. fileValidation.ts: filter chỉ giữ image/jpeg và image/png, loại bỏ > 20MB
3. Với mỗi file:
   a. POST /media/upload/init → { uploadUrl, objectKey }
   b. PUT uploadUrl (file binary, không qua Backend)
   c. POST /media/upload/confirm { objectKey, albumId, privacyLevel }
4. Hiển thị progress bar theo số file đã xử lý / tổng số file
5. Hiển thị summary: X uploaded, Y failed
```

### 3.2 Validation trước khi upload

```typescript
// src/utils/fileValidation.ts
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;  // 20MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "ERR_INVALID_CONTENT_TYPE";
  if (file.size > MAX_SIZE_BYTES) return "ERR_FILE_TOO_LARGE";
  return null;  // valid
}
```

---

## 4. DOMAIN KNOWLEDGE: SEARCH UI

### 4.1 Image-to-Image search flow

```typescript
// src/hooks/useImageSearch.ts
const useImageSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchByImage = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post("/search/image", formData);
    setResults(data.results);
    setLoading(false);
  };

  return { results, loading, searchByImage };
};
```

### 4.2 Hiển thị similarity score

Score từ Milvus (Cosine) nằm trong khoảng 0.0 → 1.0. Convention hiển thị:
- `>= 0.9`: "Rất giống" — badge xanh lá
- `0.7 → 0.9`: "Giống" — badge xanh dương
- `< 0.7`: "Tương tự" — badge xám

---

## 5. DOMAIN KNOWLEDGE: EVALUATION DASHBOARD

```typescript
// Trigger benchmark và hiển thị kết quả
const runEvaluation = async () => {
  const { data } = await apiClient.post("/eval/run");
  // data: { mrr: 0.87, hit_rate: 0.92, precision_at_10: 0.85, total_queries: 100 }
  setEvalResults(data);
};
```

Biểu đồ đề xuất: `recharts` BarChart cho Precision@K với K từ 1 đến 10.

---

## 6. DOMAIN KNOWLEDGE: NGINX & DOCKER

```nginx
# nginx.conf — SPA routing: tất cả path trả về index.html
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API calls để tránh CORS trong production
  location /api/ {
    proxy_pass http://backend:8000/;
  }
}
```

```dockerfile
# Dockerfile multi-stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## 7. RANH GIỚI CỨNG

- AG-04 **không** gọi thẳng AI Service (`http://ai-service:8001`) hay Storage.
- AG-04 **không** xử lý embedding hay vector logic — chỉ gửi file/text và nhận JSON.
- AG-04 **không** biết về Milvus, PostgreSQL, hay MinIO internals.
- Tham chiếu `openapi.yaml` để biết chính xác endpoint URL, request/response schema.
- Mọi API call phải đi qua `src/api/` — không gọi `apiClient` trực tiếp trong components.
