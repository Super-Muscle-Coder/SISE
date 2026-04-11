# TĂ“M Táº®T Há»† THá»NG: SMART IMAGE SEARCH ENGINE (SISE)

Há»‡ thá»‘ng nĂ y (SISE) lĂ  ná»n táº£ng quáº£n lĂ½ vĂ  truy váº¥n hĂ¬nh áº£nh thĂ´ng minh Ä‘a phÆ°Æ¡ng thá»©c (Multimodal Retrieval), cho phĂ©p ngÆ°á»i dĂ¹ng lÆ°u trá»¯ áº£nh theo Album cĂ¡ nhĂ¢n vĂ  tĂ¬m kiáº¿m linh hoáº¡t qua hai hĂ¬nh thá»©c: **Image-to-Image** vĂ  **Text-to-Image**.

## Cá»‘t lĂµi cĂ´ng nghá»‡
- **AI Engine:** á»¨ng dá»¥ng mĂ´ hĂ¬nh CLIP káº¿t há»£p Contrastive Learning Ä‘á»ƒ trĂ­ch xuáº¥t Vector Embedding, Ä‘á»“ng bá»™ khĂ´ng gian biá»ƒu diá»…n giá»¯a ngĂ´n ngá»¯ vĂ  hĂ¬nh áº£nh.  
- **Háº¡ táº§ng dá»¯ liá»‡u:** Sá»­ dá»¥ng Vector Database (Milvus/Qdrant) cĂ¹ng thuáº­t toĂ¡n HNSW (ANN) Ä‘á»ƒ tá»‘i Æ°u tá»‘c Ä‘á»™ truy váº¥n.  
- **Kiáº¿n trĂºc há»‡ thá»‘ng:** Thiáº¿t káº¿ theo mĂ´ hĂ¬nh Decoupled Architecture vá»›i Backend FastAPI, lÆ°u trá»¯ váº­t lĂ½ báº±ng MinIO, triá»ƒn khai qua Docker.  
- **PhĂ¢n quyá»n truy cáº­p:** CÆ¡ cháº¿ Privacy-Aware Search cho phĂ©p lá»c káº¿t quáº£ theo cáº¥p Ä‘á»™ báº£o máº­t (Public, Private, Friends).  
- **Má»¥c tiĂªu:** Tá»‘i Æ°u Ä‘á»™ chĂ­nh xĂ¡c (MRR, HitRate, Precision, Recall) vĂ  tráº£i nghiá»‡m ngÆ°á»i dĂ¹ng trĂªn Web & Mobile.

---

# NHá»®NG THĂ€NH PHáº¦N QUAN TRá»ŒNG NHáº¤T

## 1. Máº£ng AI & Xá»­ lĂ½ dá»¯ liá»‡u (The Brain)
- **MĂ´ hĂ¬nh Embedding:** CLIP (OpenAI) â€“ tá»‘i Æ°u cho cáº£ Text-to-Image vĂ  Image-to-Image.  
- **Pipeline xá»­ lĂ½:** Tiá»n xá»­ lĂ½ áº£nh (resize, normalize), trĂ­ch xuáº¥t Feature Vectors.  
- **Contrastive Learning:** GiĂºp vector áº£nh tÆ°Æ¡ng tá»± nhau gáº§n nhau trong khĂ´ng gian vector.

## 2. Máº£ng Háº¡ táº§ng Vector Database (The Storage)
- **Vector Search Engine:** Milvus, Pinecone, Qdrant hoáº·c FAISS.  
- **Thuáº­t toĂ¡n ANN:** TĂ¬m kiáº¿m vector gáº§n nháº¥t trong mili giĂ¢y.  
- **Metadata Management:** LiĂªn káº¿t Vector ID vá»›i thĂ´ng tin áº£nh qua PostgreSQL/MongoDB.

## 3. Máº£ng Backend & API Service (The Backbone)
- **RESTful API:** FastAPI hoáº·c Flask.  
- **Endpoints:**  
  - Image-to-Image â†’ Nháº­n áº£nh â†’ Embedding â†’ Search â†’ Tráº£ káº¿t quáº£.  
  - Text-to-Image â†’ Nháº­n text â†’ Embedding â†’ Search â†’ Tráº£ káº¿t quáº£.  
- **LÆ°u trá»¯ váº­t lĂ½:** MinIO Ä‘á»ƒ quáº£n lĂ½ file áº£nh.

## 4. Máº£ng Giao diá»‡n & Triá»ƒn khai (The Interface & DevOps)
- **Frontend:** React/Vue.js vá»›i khung upload áº£nh vĂ  Ă´ nháº­p text.  
- **Dockerization:** Dockerfile cho tá»«ng dá»‹ch vá»¥, docker-compose Ä‘á»ƒ káº¿t ná»‘i.  
- **Tá»± Ä‘á»™ng hĂ³a:** Khi thĂªm áº£nh má»›i, há»‡ thá»‘ng tá»± trĂ­ch xuáº¥t vector vĂ  cáº­p nháº­t DB.

---

### TĂ³m táº¯t mĂ´ hĂ¬nh hoáº¡t Ä‘á»™ng

| BÆ°á»›c | ThĂ nh pháº§n | HĂ nh Ä‘á»™ng |
|------|-------------|-----------|
| 1 | User | Upload áº£nh hoáº·c nháº­p tá»« khĂ³a. |
| 2 | Frontend | Gá»­i yĂªu cáº§u Ä‘áº¿n AI Model. |
| 3 | AI Model | Chuyá»ƒn Ä‘á»•i Input thĂ nh Vector. |
| 4 | Vector DB | TĂ¬m vector gáº§n nháº¥t báº±ng ANN. |
| 5 | Backend | Tráº£ link áº£nh cho Frontend. |

---

# THIáº¾T Káº¾ CHI TIáº¾T Tá»ªNG Máº¢NG

## Máº£ng AI & Xá»­ lĂ½ dá»¯ liá»‡u (The Brain)
### A. MĂ´ hĂ¬nh Embedding
- **CLIP (OpenAI):** Hiá»ƒu cáº£ áº£nh vĂ  vÄƒn báº£n.  
- **ResNet/ViT:** Tá»‘t cho nháº­n diá»‡n chi tiáº¿t hĂ¬nh áº£nh.

### B. Feature Extraction Pipeline
- **Image Pre-processing:** Resize 224x224, normalize.  
- **Text Tokenization:** Chuyá»ƒn text thĂ nh mĂ£ sá»‘.  
- **Batch Processing:** Xá»­ lĂ½ theo cá»¥m Ä‘á»ƒ táº­n dá»¥ng GPU.

### C. Vector Database
- **Milvus/Qdrant:** LÆ°u trá»¯ vĂ  truy váº¥n vector.  
- **HNSW (ANN):** Giáº£m thá»i gian tĂ¬m kiáº¿m xuá»‘ng mili giĂ¢y.

### D. AI Inference Service
- **FastAPI:** Quáº£n lĂ½ model, API endpoints, há»— trá»£ CPU/GPU.

| TĂ­nh nÄƒng | CLIP (Multimodal) | CNN/ViT (Pure Vision) |
|------------|-------------------|------------------------|
| Image-to-Image | Ráº¥t tá»‘t (ngá»¯ cáº£nh) | Ráº¥t tá»‘t (hĂ¬nh khá»‘i/mĂ u sáº¯c) |
| Text-to-Image | Máº·c Ä‘á»‹nh há»— trá»£ | Cáº§n huáº¥n luyá»‡n thĂªm |
| Äá»™ phá»©c táº¡p | Trung bĂ¬nh | Cao |
| á»¨ng dá»¥ng | Tá»•ng quĂ¡t | ChuyĂªn biá»‡t |

---

## Máº£ng Háº¡ táº§ng Vector Database (The Storage)
### A. Vector Database Selection
- **Milvus/Qdrant:** Native, há»— trá»£ Metadata Filtering.  
- **Elasticsearch:** Káº¿t há»£p tĂ¬m kiáº¿m tá»« khĂ³a.  
- **FAISS:** TĂ¹y chá»‰nh thuáº­t toĂ¡n ANN.

### B. Indexing
- **HNSW:** Nhanh, chĂ­nh xĂ¡c, tá»‘n RAM.  
- **IVF:** Tiáº¿t kiá»‡m RAM, tá»‘c Ä‘á»™ cháº­m hÆ¡n.  
- **Distance Metrics:** Cosine Similarity, Euclidean Distance.

### C. Metadata & Privacy
| TrÆ°á»ng dá»¯ liá»‡u | Kiá»ƒu | Má»¥c Ä‘Ă­ch |
|----------------|------|----------|
| image_id | String/UUID | LiĂªn káº¿t DB chĂ­nh |
| user_id | Integer | Chá»§ sá»Ÿ há»¯u áº£nh |
| privacy_level | Integer | 0: Private, 1: Friends, 2: Public |
| created_at | Timestamp | Lá»c theo thá»i gian |

### D. Object Storage
- **MinIO:** LÆ°u file áº£nh tháº­t, lÆ°u URL vĂ o PostgreSQL, vector vĂ o Milvus.

### E. Benchmarking
- **Latency, Precision, Recall, MRR, HitRate, Resource Usage** â€“ Ä‘o hiá»‡u nÄƒng há»‡ thá»‘ng.

---

## Máº£ng Backend & API Service (The Backbone)
### A. FastAPI
- **Tá»‘c Ä‘á»™ cao**, **Swagger UI**, **Pydantic Validation**.

### B. Core Modules
1. **Auth Service:** JWT xĂ¡c thá»±c ngÆ°á»i dĂ¹ng.  
2. **Media Service:** Upload áº£nh, lÆ°u MinIO, trĂ­ch vector, lÆ°u Milvus.  
3. **Search Service:** Hybrid Search, Re-ranking.

### C. Workflow
Validation â†’ Embedding â†’ Vector Query â†’ Metadata Enrichment â†’ Response.

### D. Evaluation Service
API `/eval/run` Ä‘á»ƒ Ä‘o MRR, HitRate, Precision.

### E. Database Schema
| Báº£ng | TrÆ°á»ng chĂ­nh |
|------|---------------|
| Users | id, username, password_hash, email |
| Albums | id, user_id, title, description, is_public |
| Images | id, album_id, user_id, minio_url, privacy_level, created_at |
| Friends | user_id_1, user_id_2, status |

---

## Máº£ng Giao diá»‡n & Triá»ƒn khai (The Interface & DevOps)
### A. Frontend
- **Web App:** React + Tailwind CSS, Dashboard, Bulk Upload.  
- **Mobile App:** React Native + Expo, Camera, Offline Cache, Sharing.

### B. Deployment
- **Docker Compose:** Frontend, API, AI Service, PostgreSQL, Milvus, MinIO.  
- **Reverse Proxy:** Nginx/Traefik Ä‘iá»u hÆ°á»›ng cĂ¡c domain con.

### C. Deployment Flow
- **Local:** Docker Desktop.  
- **Production:** VPS/Cloud.  
- **CI/CD:** GitHub Actions.  
- **Mobile:** Expo EAS Ä‘á»ƒ build APK/iOS.

### D. Monitoring
- **Logging:** Loguru/ELK Stack.  
- **Health Check:** Trang admin hiá»ƒn thá»‹ tráº¡ng thĂ¡i service.

---

## SÆ¡ Ä‘á»“ Ä‘iá»u phá»‘i 6 agent

### 1. MĂ´ hĂ¬nh Ä‘iá»u phá»‘i trung tĂ¢m
- **AG-00 SecretaryAgent** lĂ  Ä‘iá»ƒm vĂ o Ä‘iá»u phá»‘i duy nháº¥t cho thay Ä‘á»•i kiáº¿n trĂºc, contract, lá»‹ch biá»ƒu vĂ  bĂ¡o cĂ¡o tá»•ng há»£p.
- **AG-01 AIModule** chá»‰ xá»­ lĂ½ embedding vĂ  tráº£ káº¿t quáº£ cho AG-03 theo contract Ä‘Ă£ chá»‘t.
- **AG-02 StorageModule** chá»‰ cung cáº¥p háº¡ táº§ng lÆ°u trá»¯, schema vĂ  index.
- **AG-03 BackendModule** lĂ  lá»›p nghiá»‡p vá»¥ vĂ  API gateway, chá»‹u trĂ¡ch nhiá»‡m luá»“ng dá»¯ liá»‡u runtime.
- **AG-04 WebFrontend** chá»‰ consume API tá»« AG-03 vĂ  trĂ¬nh bĂ y UX web.
- **AG-05 MobileFrontend** chá»‰ consume API tá»« AG-03 vĂ  trĂ¬nh bĂ y UX mobile.

### 2. Luá»“ng phá»‘i há»£p chuáº©n
1. **YĂªu cáº§u kiáº¿n trĂºc hoáº·c contract** â†’ Ä‘i qua AG-00.
2. **YĂªu cáº§u AI hoáº·c search runtime** â†’ AG-03 Ä‘iá»u phá»‘i xuá»‘ng AG-01 hoáº·c AG-02.
3. **YĂªu cáº§u UI web/mobile** â†’ AG-04 hoáº·c AG-05 consume API tá»« AG-03, khĂ´ng gá»i chĂ©o xuá»‘ng AG-01/AG-02.
4. **Báº¥t ká»³ thay Ä‘á»•i nĂ o áº£nh hÆ°á»Ÿng schema hoáº·c endpoint** â†’ AG-00 cáº­p nháº­t tĂ i liá»‡u chung trÆ°á»›c, rá»“i má»›i má»Ÿ viá»‡c cho cĂ¡c agent liĂªn quan.

### 3. Ranh giá»›i quyá»n háº¡n
- Agent chá»‰ Ä‘Æ°á»£c sá»­a trong working directory cá»§a mĂ¬nh.
- TĂ i nguyĂªn chung chá»‰ AG-00 Ä‘Æ°á»£c phĂ©p Ä‘iá»u chá»‰nh khi liĂªn quan tá»›i contract hoáº·c kiáº¿n trĂºc.
- Frontend agents chá»‰ giá»¯ vai trĂ² trĂ¬nh bĂ y vĂ  tÆ°Æ¡ng tĂ¡c ngÆ°á»i dĂ¹ng.
- Backend agent giá»¯ vai trĂ² tĂ­ch há»£p, nhÆ°ng khĂ´ng tá»± Ă½ phĂ¡ contract Ä‘Ă£ Ä‘Æ°á»£c AG-00 duyá»‡t.

### 4. Quy Æ°á»›c bĂ¡o cĂ¡o
- Má»—i agent khi hoĂ n thĂ nh viá»‡c pháº£i bĂ¡o: má»¥c tiĂªu, file Ä‘Ă£ cháº¡m, tráº¡ng thĂ¡i contract, vĂ  rá»§i ro cĂ²n láº¡i.
- AG-00 tá»•ng há»£p bĂ¡o cĂ¡o thĂ nh má»™t lá»‹ch trĂ¬nh vĂ  quyáº¿t Ä‘á»‹nh kiáº¿n trĂºc duy nháº¥t.

---

## Gá»£i Ă½ lá»‹ch biá»ƒu chung cho cĂ¡c agent

### PhÆ°Æ¡ng Ă¡n A: Nhá»‹p ngĂ y
- SĂ¡ng: AG-00 chá»‘t Æ°u tiĂªn vĂ  phĂ¡t task.
- Giá»¯a ngĂ y: cĂ¡c agent thá»±c thi vĂ  gá»­i bĂ¡o cĂ¡o tiáº¿n Ä‘á»™.
- Cuá»‘i ngĂ y: AG-00 tá»•ng há»£p, ghi quyáº¿t Ä‘á»‹nh, vĂ  dá»n blocker.

### PhÆ°Æ¡ng Ă¡n B: Nhá»‹p 2 pha
- **Pha 1:** thiáº¿t káº¿, contract, xĂ¡c nháº­n pháº¡m vi.
- **Pha 2:** triá»ƒn khai, kiá»ƒm tra, bĂ¡o cĂ¡o.
- PhĂ¹ há»£p khi cáº§n háº¡n cháº¿ Ä‘á»•i hÆ°á»›ng giá»¯a chá»«ng.

### PhÆ°Æ¡ng Ă¡n C: HĂ ng tuáº§n
- Thá»© 2: láº­p káº¿ hoáº¡ch vĂ  phĂ¢n rĂ£ task.
- Thá»© 3â€“5: triá»ƒn khai theo agent.
- Thá»© 6: tĂ­ch há»£p, review, vĂ  chá»‘t thay Ä‘á»•i.
- Há»£p lĂ½ náº¿u báº¡n muá»‘n nhá»‹p á»•n Ä‘á»‹nh vĂ  Ă­t giĂ¡n Ä‘oáº¡n.

### Khuyáº¿n nghá»‹ ban Ä‘áº§u
- DĂ¹ng **nhá»‹p ngĂ y** cho giai Ä‘oáº¡n khá»Ÿi táº¡o.
- Khi há»‡ thá»‘ng á»•n Ä‘á»‹nh hÆ¡n, chuyá»ƒn sang **2 pha** cho tá»«ng vĂ²ng thay Ä‘á»•i.

## Tá»•ng káº¿t
| ThĂ nh pháº§n | CĂ´ng nghá»‡ | Má»¥c tiĂªu |
|-------------|------------|-----------|
| Giao diá»‡n | React & React Native | Äá»“ng bá»™ tráº£i nghiá»‡m |
| ÄĂ³ng gĂ³i | Docker & Compose | Triá»ƒn khai linh hoáº¡t |
| Váº­n hĂ nh | Nginx & MinIO | Tá»‘i Æ°u tá»‘c Ä‘á»™ & báº£o máº­t |
| ÄĂ¡nh giĂ¡ | Python Scripts | TrĂ­ch xuáº¥t MRR, HitRate |

---

**SISE** lĂ  há»‡ thá»‘ng tĂ¬m kiáº¿m áº£nh thĂ´ng minh toĂ n diá»‡n, káº¿t há»£p AI, Vector Database, Backend máº¡nh máº½ vĂ  giao diá»‡n hiá»‡n Ä‘áº¡i â€“ sáºµn sĂ ng triá»ƒn khai thá»±c táº¿.

