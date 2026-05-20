# AG-01 Phase 2 Task Board & Execution Tracking

**Created By**: AG-00 (OrchestratorAgent)  
**For**: AG-01 (AIModuleAgent)  
**Date**: 2026-05-13  
**Status**: Ready to Execute  

---

## 📌 Quick Overview

| Phase | Component | Tasks | Priority | Timeline | Status |
|-------|-----------|-------|----------|----------|--------|
| Phase 2 | AI Inference Service | T002-01 to T002-06 | P0 (critical) | Next Sprint | 🟡 Ready to Start |

---

## 🎯 Task Sequence (Ordered by Dependency)

### Tier 1: Foundation (Do First)
These must be done first as they enable all others.

#### **T002-01: [workflow:warmup] CLIP Model Loader & Warm-up Bundle**
- **Priority**: P0 (CRITICAL)
- **Status**: 🟡 Pending
- **Assigned To**: AG-01
- **Depends On**: T000-02 (contract files available)
- **Effort Estimate**: 2-3 hours
- **Target Completion**: Day 1

**Detailed Description**:
```
Load CLIP ViT-B/32 model on application startup and execute warm-up 
forward passes to eliminate cold-start latency in first inference requests.
```

**Acceptance Criteria** ✓ Required:
1. ✅ All files start with `warmup_` prefix
   - warmup_entities.py (CLIPConfig, DeviceConfig)
   - warmup_adapters.py (load_clip_model, warmup_model functions)
   - warmup_services.py (initialize_and_warmup orchestrator)
   - warmup_routers.py (WarmupWorkflowRouter class)
   - __init__.py (exports via __all__)

2. ✅ Service starts without cold-start delay
   - First inference after warm-up takes ~100-200ms (not 500ms+)
   - Measured on CPU baseline

3. ✅ Model loads to correct device
   - Auto-detect GPU (CUDA) if available
   - Fallback to CPU gracefully
   - Log detected device

4. ✅ Warm-up completes in < 30 seconds
   - 5 dummy forward passes (224x224 RGB tensors)
   - All GPU memory allocated
   - Ready for inference immediately after

**Code Checklist**:
- [ ] CLIPConfig pydantic model with model_name, device, cache_dir
- [ ] load_clip_model() returns (model, device_str)
- [ ] warmup_model() measures time and returns warmup_ms
- [ ] Device auto-detection (cuda.is_available())
- [ ] Model set to eval() mode
- [ ] Test script: test_warmup_workflow.py passes

**Output Example**:
```python
{
	"status": "ready",
	"model": "ViT-B/32",
	"device": "cuda",
	"warmup_time_ms": 2345,
	"first_inference_estimate_ms": 150
}
```

**Testing Instructions**:
```bash
cd modules/AIModule
py -3.13 tests/test_warmup_workflow.py
# Expected: All steps pass except infrastructure-dependent ones
```

---

### Tier 2: Core Inference (Do Second)
Build the actual embedding extraction logic.

#### **T002-02: [workflow:image_embedding] Image Preprocessing Pipeline Bundle**
- **Priority**: P0 (CRITICAL)
- **Status**: 🟡 Pending
- **Assigned To**: AG-01
- **Depends On**: T002-01 (warm-up ready)
- **Effort Estimate**: 3-4 hours
- **Target Completion**: Day 1-2

**Detailed Description**:
```
Build image preprocessing pipeline that accepts PIL.Image or bytes,
resizes to 224×224, converts to RGB, normalizes per CLIP spec,
and outputs torch.Tensor shape (1, 3, 224, 224).
```

**Acceptance Criteria** ✓ Required:
1. ✅ All files start with `image_embedding_` prefix
2. ✅ Handle grayscale (2D) by expanding to RGB
3. ✅ Handle RGBA by dropping alpha channel
4. ✅ Output tensor shape correct `(1, 3, 224, 224)`
5. ✅ Normalization uses CLIP mean/std (from data_schema.yaml)

**Code Checklist**:
- [ ] ImagePreprocessConfig entity
- [ ] ImagePreprocessor class with preprocess() method
- [ ] Grayscale expansion logic (np.stack([img, img, img]))
- [ ] RGBA conversion logic (.convert('RGB'))
- [ ] Resize logic (PIL Image.resize)
- [ ] Normalization logic (torchvision.transforms.Normalize)
- [ ] Test script: test_image_embedding_workflow.py passes

**Edge Cases to Handle**:
- [ ] Small images < 224x224 (upscale)
- [ ] Large images > 1MB (handle without OOM)
- [ ] Corrupted image files (PIL error handling)
- [ ] Unsupported formats (only accept JPEG, PNG)

**Testing Instructions**:
```bash
py -3.13 tests/test_image_embedding_workflow.py
# Should test: grayscale, RGBA, size variations, corrupted files
```

---

#### **T002-03: [workflow:image_embedding] POST /inference/embed/image Endpoint Bundle**
- **Priority**: P0 (CRITICAL)
- **Status**: 🟡 Pending
- **Assigned To**: AG-01
- **Depends On**: T002-01, T002-02
- **Effort Estimate**: 3-4 hours
- **Target Completion**: Day 2

**Detailed Description**:
```
FastAPI endpoint POST /inference/embed/image that accepts multipart/form-data,
validates content-type and size, preprocesses image, runs CLIP image encoder,
L2-normalizes result, returns 512-dim float32 vector.
```

**Acceptance Criteria** ✓ Required:
1. ✅ All files start with `image_embedding_` prefix
2. ✅ Returns 512-dim vector (not more, not less)
3. ✅ Latency < 500ms on CPU
4. ✅ Correct content-type validation (image/jpeg, image/png only)

**Endpoint Specification**:
```
POST /inference/embed/image
Content-Type: multipart/form-data

Response (200 OK):
{
  "vector": [0.125, -0.089, ..., -0.012],  // 512 float32 values
  "dimension": 512,
  "normalized": true,
  "latency_ms": 145
}

Error (400 Bad Request):
{
  "code": "ERR_INVALID_CONTENT_TYPE",
  "message": "Only image/jpeg and image/png are supported"
}

Error (400 Bad Request):
{
  "code": "ERR_FILE_TOO_LARGE",
  "message": "Maximum file size is 20MB"
}

Error (500 Internal Server Error):
{
  "code": "ERR_INTERNAL",
  "message": "Failed to generate embedding"
}
```

**Code Checklist**:
- [ ] FastAPI router with @router.post("/embed/image")
- [ ] File upload validation (UploadFile type)
- [ ] Content-type check (image/jpeg or image/png)
- [ ] File size check (< 20MB)
- [ ] Image preprocessing call
- [ ] CLIP image encoder call
- [ ] L2-normalization
- [ ] Latency measurement
- [ ] Error handling with correct HTTP status codes
- [ ] Test script: test_image_embedding_workflow.py passes

**Performance Requirements**:
- Single image: < 500ms (CPU baseline)
- Should work without GPU (CPU-fallback)

**Testing Instructions**:
```bash
# Start service
py -3.13 app_main.py &

# Test endpoint (from another terminal)
curl -X POST -F "file=@test_image.jpg" http://localhost:8001/inference/embed/image

# Expected response: 512-dim vector in < 500ms
```

---

#### **T002-04: [workflow:text_embedding] POST /inference/embed/text Endpoint Bundle**
- **Priority**: P0 (CRITICAL)
- **Status**: 🟡 Pending
- **Assigned To**: AG-01
- **Depends On**: T002-01
- **Effort Estimate**: 2-3 hours
- **Target Completion**: Day 2

**Detailed Description**:
```
FastAPI endpoint POST /inference/embed/text that accepts JSON text query,
tokenizes with CLIP tokenizer (max 77 tokens), runs text encoder,
L2-normalizes, returns 512-dim vector in same space as image embeddings.
```

**Acceptance Criteria** ✓ Required:
1. ✅ All files start with `text_embedding_` prefix
2. ✅ Returns 512-dim vector
3. ✅ Vector in same space as image vectors (CLIP property)
4. ✅ Handles text up to 77 tokens

**Endpoint Specification**:
```
POST /inference/embed/text
Content-Type: application/json

Request:
{
  "text": "a photo of a dog"
}

Response (200 OK):
{
  "vector": [-0.089, 0.234, ..., 0.012],  // 512 float32 values
  "dimension": 512,
  "normalized": true,
  "tokens_used": 5,
  "max_tokens": 77,
  "latency_ms": 78
}

Error (400 Bad Request):
{
  "code": "ERR_TEXT_TOO_LONG",
  "message": "Text exceeds 77 token limit (got 120 tokens)"
}

Error (400 Bad Request):
{
  "code": "ERR_INVALID_TEXT",
  "message": "Text must be non-empty"
}
```

**Code Checklist**:
- [ ] TextEmbedRequest pydantic model with text field
- [ ] CLIP tokenizer integration
- [ ] Token count check (max 77)
- [ ] Text validation (non-empty, valid UTF-8)
- [ ] CLIP text encoder call
- [ ] L2-normalization
- [ ] Latency measurement
- [ ] Error handling
- [ ] Test script: test_text_embedding_workflow.py passes

**Important**: Verify that image + text vectors are in same space!
- Test: embed same concept as image and text, verify cosine similarity > 0.8
- Example: Embed image of dog + text "a dog" → similarity should be high

**Testing Instructions**:
```bash
# Test endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"a photo of a cat"}' \
  http://localhost:8001/inference/embed/text

# Expected: 512-dim vector, fast response (< 150ms)

# Verify cross-modal similarity
# Embed both image of dog and text "dog" → high similarity
```

---

### Tier 3: Optimization (Do Third)
Add batch processing and containerization.

#### **T002-05: [workflow:batch_embedding] Batch Embedding Endpoint Bundle**
- **Priority**: P1 (NICE-TO-HAVE)
- **Status**: 🟡 Pending
- **Assigned To**: AG-01 (if time permits)
- **Depends On**: T002-03
- **Effort Estimate**: 2-3 hours
- **Target Completion**: Day 3 (optional)

**Detailed Description**:
```
Optimize throughput by implementing batch embedding endpoint that accepts
multiple images at once, returns multiple vectors efficiently.
Minimum batch size: 32 images without OOM on CPU.
```

**Acceptance Criteria** ✓ Required:
1. ✅ All files start with `batch_embedding_` prefix
2. ✅ Support batch size >= 32 images
3. ✅ No OOM on CPU machines
4. ✅ Better throughput than serial calls

**Endpoint Specification**:
```
POST /inference/embed/batch
Content-Type: multipart/form-data

Request:
- Multiple file fields: file1, file2, ..., file32

Response (200 OK):
{
  "vectors": [
	[0.125, -0.089, ..., -0.012],
	[0.234, -0.145, ..., 0.089],
	...
  ],
  "count": 32,
  "batch_latency_ms": 2100,
  "per_image_latency_ms": 65
}
```

**Code Checklist**:
- [ ] Batch file upload handling
- [ ] Batch preprocessing (parallel or sequential)
- [ ] Batch inference (via torch.stack or loop)
- [ ] Memory efficiency (no OOM on 32 images)
- [ ] Performance improvement measurement
- [ ] Test script: test_batch_embedding_workflow.py passes

**Note**: This is lower priority. Focus on T002-01..T002-04 first. Only do this if you have extra time.

---

#### **T002-06: [workflow:ai_container] Dockerfile for AI Service Bundle**
- **Priority**: P0 (CRITICAL)
- **Status**: 🟡 Pending
- **Assigned To**: AG-01
- **Depends On**: T002-01..T002-05 (service code complete)
- **Effort Estimate**: 1-2 hours
- **Target Completion**: Day 3

**Detailed Description**:
```
Create multi-stage Docker image for AI Service.
Base: python:3.13-slim
Final image size: < 500MB (model weights NOT embedded)
Health check endpoint: GET /health/liveness
```

**Acceptance Criteria** ✓ Required:
1. ✅ All files start with `ai_container_` prefix (if separate files)
2. ✅ docker build succeeds
3. ✅ Container starts and stays healthy
4. ✅ Image size < 500MB

**Dockerfile Template**:
```dockerfile
# Dockerfile (save as modules/AIModule/Dockerfile)

# Stage 1: Builder
FROM python:3.13-slim as builder
WORKDIR /app
COPY ai_requirements.txt .
RUN pip install --user -r ai_requirements.txt

# Stage 2: Runtime
FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Copy application code
COPY app/ /app/app/
COPY app_main.py /app/
COPY configs/ /app/configs/

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8001/health/liveness')"

CMD ["python", "app_main.py"]
```

**Code Checklist**:
- [ ] Multi-stage Dockerfile created
- [ ] Python 3.13 base image
- [ ] Dependencies installed in builder stage
- [ ] Application code copied in runtime stage
- [ ] Health check configured
- [ ] Environment variables set
- [ ] Port 8001 exposed
- [ ] docker build succeeds (< 500MB)
- [ ] Container starts without errors
- [ ] /health/liveness returns 200

**Build Instructions**:
```bash
cd modules/AIModule
docker build -t sise-ai-service:latest .

# Verify image size
docker images | grep sise-ai-service

# Run container
docker run -p 8001:8001 -e AI_SERVICE_PORT=8001 -e DEVICE=cpu sise-ai-service:latest

# Test endpoint
curl http://localhost:8001/health/liveness
# Expected: 200 OK
```

---

## 📊 Progress Tracking

### Daily Checklist
- [ ] Day 1: Complete T002-01 (warmup) + begin T002-02 (image preprocessing)
- [ ] Day 1-2: Complete T002-02 + begin T002-03 (image endpoint)
- [ ] Day 2: Complete T002-03 + begin T002-04 (text endpoint)
- [ ] Day 2-3: Complete T002-04
- [ ] Day 3: (Optional) Complete T002-05 (batch) + T002-06 (Dockerfile)
- [ ] Day 3: Update Log_01.md and Skill_01.md with final status

### Weekly Check-in (by AG-00)
- Every Friday: AG-00 audits Log_01.md and Skill_01.md
- Verify: Recent events documented, issues categorized, links valid

---

## 🚨 Common Pitfalls to Avoid

1. **Pitfall**: Vector dimension mismatch (513 or 511 instead of 512)
   - **Fix**: Add assertion: `assert len(vector) == 512`
   - **Lesson**: Data contract is strict

2. **Pitfall**: L2-normalization missing
   - **Fix**: `vector = vector / np.linalg.norm(vector)`
   - **Lesson**: Cosine similarity requires normalized vectors

3. **Pitfall**: Image preprocessing breaks on grayscale/RGBA
   - **Fix**: Convert all to RGB before processing
   - **Lesson**: Handle edge cases upfront

4. **Pitfall**: Cold-start latency kills first request
   - **Fix**: Implement warm-up at startup
   - **Lesson**: Warm-up is worth it

5. **Pitfall**: No error handling for invalid images
   - **Fix**: Try/catch PIL.Image.open, return 400 with proper error code
   - **Lesson**: Input validation is security

6. **Pitfall**: Importing cross-module code
   - **Fix**: Only import from your own modules/AIModule/
   - **Lesson**: Respect boundaries (AG-00 will catch this in review)

---

## 🔍 Code Review Checklist (For AG-00)

When AG-01 submits Phase 2 for review, AG-00 will check:

- ✅ **Structure**: All files follow prefix naming convention
- ✅ **5-Layer Architecture**: entities/adapters/services/routers properly separated
- ✅ **Output Contract**: Vectors are exactly 512-dim, L2-normalized
- ✅ **Error Handling**: All error cases return correct HTTP status + error codes
- ✅ **Latency**: Single image < 500ms (CPU), single text < 150ms
- ✅ **Knowledge**: Log_01.md has 5+ events, Skill_01.md documents issues
- ✅ **Tests**: All test_*_workflow.py scripts pass
- ✅ **Docker**: Image builds, container healthy, size < 500MB
- ✅ **No Boundary Violations**: No database access, no .context/ writes

---

## 📞 Support Resources

**Before asking for help:**
1. Check your `.agent.md` file
2. Check `.context/Tasks.yaml` for task details
3. Read `.knowledge/shared/Workflow_Centric_Architecture.md`
4. Review AG-02's Phase 1 code in `modules/StorageModule/`

**When asking for help:**
- What you tried
- What error you got
- Which file/line
- What you expect

---

## ✅ Final Acceptance

Phase 2 is complete when:
- All 6 tasks marked `done` in Tasks.yaml
- Code structure meets 5-layer architecture
- All acceptance criteria met
- All tests pass
- Log_01.md & Skill_01.md properly maintained
- AG-00 approval received

---

**Good luck, AG-01! 🚀**

Remember: Quality > Speed. Better to ship excellent Phase 2 than rushed Phase 3.
