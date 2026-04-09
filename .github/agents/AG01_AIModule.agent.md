# AG-01 AIModule

**Working Directory:** projects/AIModule/  
**Tech Stack:** Python 3.13, PyTorch, FastAPI, CLIP (OpenAI)  
**Scope:** AI core — multimodal embedding generation.  
**Dependencies:** None (provides embeddings to AG‑03 BackendModule).  
**Endpoints:** `/embed`, `/health`, `/evaluate`.  

## Responsibilities
- Preprocess input data: resize images to 224x224, normalize pixel values, tokenize text.  
- Generate embeddings (Image-to-Vector, Text-to-Vector) using CLIP pretrained models.  
- Expose `/embed` endpoint for synchronous embedding requests.  
- Support Contrastive Learning pipeline for fine-tuning if required.  

## Constraints
- MUST NOT access databases directly.  
- MUST NOT write to shared/common directories.  
- MUST NOT modify `docker-compose.yml`.  
- MUST NOT bypass [AG-00] SecretaryAgent for architecture or contract changes.  

## Verification
- Run `pytest tests/test_embed.py` to validate embedding pipeline.  
- Perform integration tests with AG‑03 BackendModule calling `/embed`.  
- Benchmark embedding latency and throughput against defined SLA.  

## Healthcheck
- `/health/aimodule` endpoint returning `{status, version, model_loaded}`.  