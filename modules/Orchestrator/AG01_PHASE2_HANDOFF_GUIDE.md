# AG-01 (AIModuleAgent) — Phase 2 Handoff & Onboarding Guide

**Document Type:** Agent Handoff & Onboarding  
**From:** AG-00 (OrchestratorAgent)  
**To:** AG-01 (AIModuleAgent)  
**Date:** 2026-05-13  
**Status:** Ready for Phase 2  

---

## 📋 Quick Status Update

✅ **Phase 1 (Storage Infrastructure) Complete**: AG-02 delivered all 5 workflow bundles with 100% quality. Docker stack is running with 4/5 services healthy (Milvus still warming up, which is normal).

🚀 **Your Turn (Phase 2 - AI Inference Service)**: You're now responsible for implementing the AI Inference layer using CLIP ViT-B/32. This is the next critical dependency for AG-03's backend.

---

## ⚠️ Important Prerequisites: Read These FIRST

Before you start writing any code, you **MUST** read and fully understand these documents:

### 1️⃣ Your Agent Profile (Critical)
**File**: `.github/agents/AIModuleAgent.agent.md`

**Key Points to Extract:**
- ✅ Your **working directory**: `modules/AIModule/`
- ✅ Your **forbidden actions**: NO database access, NO contract file modification, NO cross-module writes
- ✅ Your **allowed outbound calls**: Only AG-00 (OrchestratorAgent)
- ✅ Your **read permissions**: `.context/` (read-only), `.knowledge/shared/` (read-only)
- ✅ Your **write permissions**: `modules/AIModule/` (exclusive), `.knowledge/agent01/` (logs & skills only)
- ✅ Your **required env vars**: AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR
- ✅ Your **Python version requirement**: 3.13 (use `py -3.13` like AG-02)
- ✅ Your **output contract**: Exactly 512-dimensional L2-normalized float32 vectors

**⚡ Action Item**: Print out your `.agent.md` file and keep it visible during development. Your boundaries are enforced by AG-00 during code review.

---

### 2️⃣ Workflow-Centric Architecture (Critical)
**File**: `.knowledge/shared/Workflow_Centric_Architecture.md`

**Key Concepts:**
- 📂 **5-Layer Architecture**: configs → entities → adapters → services → routers
- 🏷️ **Workflow Prefix Naming**: All your files must start with their workflow name (e.g., `warmup_*.py`, `image_embedding_*.py`, `text_embedding_*.py`)
- 🔐 **Strict Boundaries**: Each workflow is self-contained; avoid cross-workflow imports unless absolutely necessary

**How AG-02 Did It** (Your Template):
```
modules/StorageModule/
├── app/
│   ├── entities/
│   │   ├── schema_entities.py       # All schema-related data models
│   │   ├── collection_entities.py   # All Milvus config models
│   │   ├── bucket_entities.py       # All MinIO config models
│   │   └── __init__.py              # Exports via __all__
│   ├── adapters/
│   │   ├── schema_adapters.py       # Alembic builder, migration runner
│   │   ├── collection_adapters.py   # Milvus client wrapper
│   │   ├── bucket_adapters.py       # MinIO client wrapper
│   │   └── __init__.py              # Exports via __all__
│   ├── services/
│   │   ├── schema_services.py       # run_schema_migrations(), downgrade_schema()
│   │   ├── collection_services.py   # ensure_collection(), validate_collection()
│   │   ├── bucket_services.py       # ensure_buckets(), apply_lifecycle()
│   │   └── __init__.py
│   └── routers/
│       ├── schema_routers.py        # SchemaWorkflowRouter (orchestrator class)
│       ├── collection_routers.py    # CollectionWorkflowRouter
│       ├── bucket_routers.py        # BucketWorkflowRouter
│       └── __init__.py
├── migrations/                       # Alembic migrations (schema workflow only)
├── scripts/                          # Helper scripts (seed, health checks, etc.)
├── tests/                            # Workflow-specific test scripts
├── configs/                          # Environment files (storage.env.local, etc.)
├── app_main.py                       # Entry point (like storage_main.py)
└── app_requirements.txt              # Dependencies
```

**You Must Follow This Pattern in AIModule**:
```
modules/AIModule/
├── app/
│   ├── entities/
│   │   ├── warmup_entities.py             # CLIP model config, device setup
│   │   ├── image_embedding_entities.py    # Image pipeline config
│   │   ├── text_embedding_entities.py     # Text pipeline config
│   │   └── __init__.py
│   ├── adapters/
│   │   ├── warmup_adapters.py             # Model loader, warm-up executor
│   │   ├── image_embedding_adapters.py    # Image preprocessor, CLIP image encoder
│   │   ├── text_embedding_adapters.py     # Text tokenizer, CLIP text encoder
│   │   ├── batch_embedding_adapters.py    # Batch executor (optional T002-05)
│   │   └── __init__.py
│   ├── services/
│   │   ├── warmup_services.py             # load_and_warmup_model()
│   │   ├── image_embedding_services.py    # embed_image() with pipeline
│   │   ├── text_embedding_services.py     # embed_text()
│   │   └── __init__.py
│   └── routers/
│       ├── warmup_routers.py              # WarmupWorkflowRouter (startup orchestrator)
│       ├── image_embedding_routers.py     # ImageEmbeddingWorkflowRouter + endpoint POST /inference/embed/image
│       ├── text_embedding_routers.py      # TextEmbeddingWorkflowRouter + endpoint POST /inference/embed/text
│       └── __init__.py
├── configs/
│   ├── ai.env.example
│   ├── ai.env.local
│   └── ai.env.staging
├── tests/
│   ├── test_warmup_workflow.py
│   ├── test_image_embedding_workflow.py
│   ├── test_text_embedding_workflow.py
│   └── test_batch_embedding_workflow.py
├── app_main.py                      # Main entry point
├── ai_requirements.txt              # Dependencies (torch, open_clip_torch, fastapi, uvicorn, etc.)
└── Dockerfile                       # Multi-stage Docker image
```

---

### 3️⃣ Data Schema & Output Contract
**File**: `.context/data_schema.yaml` → `global_configs` section

**Critical Output Specification:**
```yaml
global_configs:
  vector_dim: 512              # Your vectors MUST be exactly 512-dimensional
  embedding_model: CLIP ViT-B/32
  normalization: L2            # Your vectors MUST be L2-normalized
  metric_type: COSINE          # Why? Cosine distance works on normalized vectors
```

**Your Output Format** (JSON response):
```json
{
  "vector": [0.125, -0.089, 0.234, ..., -0.012],  // 512 float32 values
  "dimension": 512,
  "normalized": true,
  "model_version": "ViT-B/32"
}
```

**Validation**: `assert len(vector) == 512 and abs(np.linalg.norm(vector) - 1.0) < 0.01`

---

## 🎯 Phase 2 Task Assignment

Your tasks are already defined in `.context/Tasks.yaml` under `phase_2`. Here's the **priority order** (workflow-centric):

### Priority Sequence (DO IN THIS ORDER):

#### **Task 1: T002-01 - [workflow:warmup]** (P0 - CRITICAL)
**Title**: CLIP Model Loader & Warm-up Bundle

**What to Build**:
- Load CLIP ViT-B/32 model on startup
- Execute warm-up dummy forward pass (eliminate cold-start latency)
- Auto-detect device (CUDA if available, fallback to CPU)
- Return model in `eval()` mode, ready for inference

**Acceptance Criteria**:
- ✅ All files start with `warmup_` prefix
- ✅ Service starts without cold-start delay (first inference < 100ms extra)
- ✅ Model loads to correct device (auto-detect works)
- ✅ Warm-up completes in < 30 seconds

**Your Checklist**:
```python
# warmup_entities.py
class CLIPConfig(BaseModel):
	model_name: str = "ViT-B/32"
	device: str = "auto"  # "cuda", "cpu", or "auto"
	model_cache_dir: str

# warmup_adapters.py
def load_clip_model(config: CLIPConfig) -> Tuple[Model, str]:
	# Load from HuggingFace, place on device, return (model, actual_device)
	pass

def warmup_model(model: Model, device: str, iterations: int = 5) -> float:
	# Execute 5 forward passes with dummy 224x224 RGB tensors
	# Measure time, ensure memory is allocated
	# Return warmup_time_ms
	pass

# warmup_services.py
def initialize_and_warmup() -> Dict:
	# 1. Load model
	# 2. Run warm-up
	# 3. Return status (model loaded, device used, warmup time)
	pass
```

**Why It Matters**: Without warm-up, first inference request will be slow (~500ms on CPU). Warm-up at startup ensures all subsequent requests are fast (~100-200ms).

---

#### **Task 2: T002-02 - [workflow:image_embedding]** (P0 - CRITICAL)
**Title**: Image Preprocessing Pipeline Bundle

**What to Build**:
- Accept PIL.Image or bytes input
- Resize to 224×224
- Convert to RGB (handle grayscale/RGBA edge cases)
- Normalize using CLIP mean/std
- Output torch.Tensor shape `(1, 3, 224, 224)`

**Acceptance Criteria**:
- ✅ All files start with `image_embedding_` prefix
- ✅ Handle grayscale (2D) by expanding to RGB
- ✅ Handle RGBA by dropping alpha channel
- ✅ Output tensor shape correct `(1, 3, 224, 224)`

**Your Checklist**:
```python
# image_embedding_entities.py
class ImagePreprocessConfig(BaseModel):
	target_size: Tuple[int, int] = (224, 224)
	mean: List[float] = [0.48145466, 0.4578275, 0.40821073]  # CLIP mean
	std: List[float] = [0.26862954, 0.26130258, 0.27577711]   # CLIP std

# image_embedding_adapters.py
class ImagePreprocessor:
	def __init__(self, config: ImagePreprocessConfig):
		self.config = config

	def preprocess(self, image_input: Union[PIL.Image, bytes]) -> torch.Tensor:
		# 1. Load image (if bytes, use PIL.Image.open)
		# 2. Convert RGBA -> RGB, Grayscale -> RGB
		# 3. Resize to 224x224
		# 4. Normalize per CLIP spec
		# 5. Return (1, 3, 224, 224) tensor
		pass
```

---

#### **Task 3: T002-03 - [workflow:image_embedding]** (P0 - CRITICAL)
**Title**: POST /inference/embed/image Endpoint Bundle

**What to Build**:
- FastAPI endpoint that accepts multipart/form-data (image file)
- Validates content-type (image/jpeg, image/png only)
- Validates file size (max 20MB)
- Runs ImagePreprocessor → CLIP image encoder
- Returns 512-dim L2-normalized vector

**Acceptance Criteria**:
- ✅ All files start with `image_embedding_` prefix
- ✅ Returns 512-dim vector
- ✅ Latency < 500ms on CPU
- ✅ Correct content-type validation

**Your Checklist**:
```python
# image_embedding_routers.py
from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter(prefix="/inference")

@router.post("/embed/image")
async def embed_image(file: UploadFile = File(...)):
	# 1. Validate content-type
	# 2. Validate file size (< 20MB)
	# 3. Read file bytes
	# 4. Preprocess image
	# 5. Run CLIP image encoder
	# 6. L2-normalize result
	# 7. Return {"vector": [...], "dimension": 512}
	pass

# image_embedding_services.py
def embed_image(image_bytes: bytes) -> List[float]:
	# 1. Preprocess
	# 2. CLIP inference
	# 3. L2-normalize
	# 4. Return list of 512 floats
	pass
```

**Error Handling**:
```python
# Return 400 Bad Request if:
{
	"code": "ERR_INVALID_CONTENT_TYPE",
	"message": "Only image/jpeg and image/png are supported"
}

# Return 400 Bad Request if:
{
	"code": "ERR_FILE_TOO_LARGE",
	"message": "Maximum file size is 20MB"
}

# Return 500 Internal Server Error if:
{
	"code": "ERR_INTERNAL",
	"message": "Failed to generate embedding"
}
```

---

#### **Task 4: T002-04 - [workflow:text_embedding]** (P0 - CRITICAL)
**Title**: POST /inference/embed/text Endpoint Bundle

**What to Build**:
- FastAPI endpoint that accepts JSON `{"text": "..."}`
- Tokenizes text (max 77 tokens per CLIP spec)
- Runs CLIP text encoder
- Returns 512-dim L2-normalized vector (same vector space as images!)

**Acceptance Criteria**:
- ✅ All files start with `text_embedding_` prefix
- ✅ Returns 512-dim vector
- ✅ Vector in same space as image vectors (CLIP guarantee)
- ✅ Handles text up to 77 tokens

**Your Checklist**:
```python
# text_embedding_routers.py
@router.post("/embed/text")
async def embed_text(request: TextEmbedRequest):
	# request = {"text": "a photo of a dog"}
	# 1. Validate text (non-empty, valid UTF-8)
	# 2. Tokenize (check <= 77 tokens)
	# 3. Run CLIP text encoder
	# 4. L2-normalize
	# 5. Return {"vector": [...], "dimension": 512}
	pass

# text_embedding_services.py
def embed_text(text: str) -> List[float]:
	# 1. Tokenize
	# 2. CLIP inference
	# 3. L2-normalize
	# 4. Return list of 512 floats
	pass
```

---

#### **Task 5: T002-05 - [workflow:batch_embedding]** (P1 - NICE-TO-HAVE)
**Title**: Batch Embedding Endpoint Bundle

**What to Build**:
- POST /inference/embed/batch endpoint
- Accept list of images (at least 32 images)
- Return list of vectors
- Optimize for throughput

**Note**: This is lower priority (P1). Start if you finish T002-01..T002-04 early.

---

#### **Task 6: T002-06 - [workflow:ai_container]** (P0 - DEPLOYMENT)
**Title**: Dockerfile for AI Service Bundle

**What to Build**:
- Multi-stage Docker image
- Base: python:3.13-slim
- Final image: <500MB (model weights NOT baked in)
- Health check endpoint `/health/liveness`

**Your Dockerfile**:
```dockerfile
# Stage 1: Builder
FROM python:3.13-slim as builder
WORKDIR /app
COPY ai_requirements.txt .
RUN pip install -r ai_requirements.txt

# Stage 2: Runtime
FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY app/ /app/app/
COPY app_main.py /app/
ENV PYTHONUNBUFFERED=1
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8001/health/liveness')"
CMD ["python", "app_main.py"]
```

---

## 🔧 Environment Setup

### Step 1: Create Your Config File
```bash
# Copy template to local
cp modules/AIModule/configs/ai.env.example modules/AIModule/configs/ai.env.local
```

### Step 2: Fill in `ai.env.local`
```env
# Python & Environment
PYTHONUNBUFFERED=1
AI_SERVICE_PORT=8001
CLIP_MODEL_NAME=ViT-B/32
DEVICE=auto          # "auto" (detects GPU) or "cpu"
MODEL_CACHE_DIR=/tmp/clip_models

# Logging
LOG_LEVEL=INFO
```

### Step 3: Create Virtual Environment (Optional but Recommended)
```bash
py -3.13 -m venv modules/AIModule/.venv
# Windows:
modules/AIModule/.venv/Scripts/activate
# Linux/Mac:
source modules/AIModule/.venv/bin/activate
```

### Step 4: Install Dependencies
```bash
cd modules/AIModule
pip install -r ai_requirements.txt
```

### Step 5: Verify Setup
```bash
py -3.13 -c "import torch; import open_clip_torch; import fastapi; print('✓ All imports OK')"
```

---

## 📚 Knowledge Management (CRITICAL)

You are **100% responsible** for maintaining your knowledge files:

### Files You Must Maintain
- `.knowledge/agent01/KnowledgeBase_01.md` - Trusted references you discover
- `.knowledge/agent01/Skill_01.md` - Unexpected issues & their resolutions (problem-solving record)
- `.knowledge/agent01/Log_01.md` - Event journal (what you did, when you did it, why it mattered)

### Update Rules

**KnowledgeBase_01.md**: Update when you discover a trusted reference
- Example: "Found that CLIP tokenizer has max 77 tokens limit, documented in XYZ paper"
- Frequency: As needed

**Skill_01.md**: Update when you solve an UNEXPECTED problem
- NOT for "task completed" (that goes in Log)
- YES for "I tried X and got error Y, here's how I fixed it"
- Format: Problem → Root Cause → Solution → Prevention
- Examples:
  - ISS_AG01_001: "CUDA OOM on batch size 32" (solution: use CPU fallback)
  - ISS_AG01_002: "Image with alpha channel broke preprocessing" (solution: RGB conversion)
  - ISS_AG01_003: "Cold-start latency was 800ms" (solution: implemented warm-up)

**Log_01.md**: Update after significant events
- Example events (significance_score > 0.6):
  - Completed a workflow bundle
  - Discovered/resolved an issue
  - Achieved a performance milestone
  - Failed a test (document the investigation)
- Format: Event ID, timestamp, type, task_id, summary, details, metrics, tags

### Weekly Audit by AG-00
Every Friday, AG-00 reads your logs to verify:
- ✅ Recent events documented (within 24 hours)
- ✅ Issues properly categorized (Skill_01.md vs Log_01.md)
- ✅ No stale entries (older than 1 week without update)
- ✅ Links to tasks/commits are valid

---

## 🏃 Getting Started Checklist

- [ ] Read `.github/agents/AIModuleAgent.agent.md` completely
- [ ] Read `.knowledge/shared/Workflow_Centric_Architecture.md` completely
- [ ] Read `.context/data_schema.yaml` (focus on `global_configs` and `ai_service_spec`)
- [ ] Review AG-02's Phase 1 code in `modules/StorageModule/` (understand their 5-layer structure)
- [ ] Create `modules/AIModule/` directory structure (configs, app/, tests/)
- [ ] Create `ai.env.local` from template
- [ ] Install Python 3.13 (if not already)
- [ ] Install dependencies: `pip install -r ai_requirements.txt`
- [ ] Create initial entity classes (warmup_entities.py, image_embedding_entities.py, text_embedding_entities.py)
- [ ] Start building adapters (model loader, image preprocessor, etc.)
- [ ] Implement services (initialization, embedding functions)
- [ ] Create routers & FastAPI endpoints
- [ ] Write test scripts for each workflow
- [ ] Update Log_01.md as you progress

---

## 📞 Communication Channel

When you need clarification or hit a blocker:
1. **First**: Check your `.agent.md` file (most answers are there)
2. **Second**: Check `.context/Tasks.yaml` for task details
3. **Third**: Consult `.knowledge/shared/Workflow_Centric_Architecture.md` for patterns
4. **Fourth**: Review AG-02's Phase 1 code as a reference implementation
5. **Last Resort**: Message AG-00 in chat with:
   - What you tried
   - What error you got
   - Which file/line
   - What you expect

---

## 🎓 Reference Implementation (AG-02)

Study these files from AG-02's Phase 1 work to understand the pattern:

- `modules/StorageModule/app/entities/schema_entities.py` → Learn how to structure entities
- `modules/StorageModule/app/adapters/schema_adapters.py` → Learn adapter pattern
- `modules/StorageModule/app/services/schema_services.py` → Learn services pattern
- `modules/StorageModule/app/routers/schema_routers.py` → Learn routers pattern
- `modules/StorageModule/storage_main.py` → Learn entry point structure
- `modules/StorageModule/tests/test_schema_workflow.py` → Learn testing pattern

**Key Takeaway**: Everything is organized by workflow prefix. Same as you'll do with `warmup_`, `image_embedding_`, `text_embedding_`.

---

## 🚀 Success Criteria

When Phase 2 is complete and ready for review:

✅ **Code Structure**:
- All 6 tasks completed (T002-01..T002-06)
- All files follow prefix naming (warmup_, image_embedding_, text_embedding_, batch_embedding_, ai_container_)
- 5-layer architecture strictly enforced (entities, adapters, services, routers)

✅ **Functional Requirements**:
- POST /inference/embed/image returns 512-dim L2-normalized vectors
- POST /inference/embed/text returns 512-dim L2-normalized vectors
- Vectors in same space (CLIP guarantee)
- Latency < 500ms on CPU for single image
- Batch endpoint handles 32+ images

✅ **Quality & Knowledge**:
- All tests pass (test_*_workflow.py scripts)
- Log_01.md updated with at least 5 significant events
- Skill_01.md documents all issues encountered & resolved
- Docker image builds successfully

✅ **Documentation**:
- README in modules/AIModule/
- Comments on complex logic
- Docstrings on all public functions

✅ **Acceptance Criteria** (from Tasks.yaml):
- All acceptance_criteria in T002-01..T002-06 met

---

**You're ready! Questions? Check your .agent.md file first. 🚀**

Good luck, AG-01! Let's build great AI inference services! 💪
