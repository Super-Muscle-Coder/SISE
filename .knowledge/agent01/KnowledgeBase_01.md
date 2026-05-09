# KnowledgeBase_01.md

## Metadata  
- **id**: KB_AG01_01
- **title**: AI & Image Processing Knowledge Base (AI Module)
- **version**: 1.0.1
- **created_at**: 2024-05-18
- **created_by**: Project Owner
- **last_updated**: 2024-05-18
- **last_reviewed**: 2024-05-18
- **review_owner**: AG-00 Auditor
- **status**: active
- **visibility**: internal
- **retention_policy_days**: 365

---

## Scope and Purpose  
- **scope_summary**: Provides the knowledge required for AG-01 to engineer and maintain the AI Service. Focuses specifically on multimodal processing (CLIP), vector embedding generation, and CPU/GPU inference optimization.
- **dos_reference**: 
  - Section 2.1: The Brain (AI & Data Processing) - Knowledge regarding the Embedding Model and Feature Extraction pipelines.

---

## Core Concepts  
- **CLIP (Contrastive Language-Image Pretraining)**: An OpenAI model capable of bridging text and image modalities into a shared vector space, forming the foundation of Text-to-Image and Image-to-Image search features.
- **Vector Embedding**: The expected output payload is always an array of `float32`. The `vector_dim` acts as an immutable constant (e.g., 512 for ViT-B/32) and must be strictly respected to ensure Milvus compatibility.
- **Warm-up / Cold-start Mitigation**: The Machine Learning model must be loaded into memory immediately upon service boot (e.g., FastAPI Startup Event). Avoid instantiating the model on a per-request basis.
- **Batching & Normalization**: Before inference, image tensors must be rigorously pre-processed (e.g., 224x224 resizing, RGB norm) using PyTorch/Numpy to reduce latency.
- **Graceful Hardware Fallback**: The inference service must dynamically check and prioritize appropriate compute targets (`cuda`/`mps`/`cpu`) depending on the deployment environment.

---

## Trusted References  
1. **OpenAI CLIP - Hugging Face**
   - title: Model Card transformers/clip
   - url: https://huggingface.co/docs/transformers/model_doc/clip
   - type: Official Library Docs
   - trust_level: High
   - notes: Best practices for CLIP inference via the Hugging Face Transformers library.
2. **PyTorch Tensor Operations**
   - title: PyTorch Tensor Documentation
   - url: https://pytorch.org/docs/stable/tensors.html
   - type: Official Docs
   - trust_level: High
   - notes: Essential for tensor transformations matching model inputs.
3. **FastAPI Lifespan Events**
   - title: FastAPI Advanced (Lifespan events)
   - url: https://fastapi.tiangolo.com/advanced/events/
   - type: Official Docs
   - trust_level: High
   - notes: Architecture for injecting models at startup without blocking handlers.

---

## Internal References  
- `E:\SISE\.context\DOS.md`: The ultimate system guideline.
- `E:\SISE\.context\data_schema.yaml`: Output JSON validation for the AI Service (`float32[]`).
- `E:\SISE\.knowledge\agent01\Skill_01.md`: Resolution records for memory leaks and model loading state issues.

---

## Do Not Do  
- ATTEMPT DATABASE CONNECTIVITY: The AI Service (AG-01) is strictly a stateless computational node. Do not invoke PostgreSQL or Milvus drivers.
- SILENTLY UPGRADE MODELS: Changing the underlying model (e.g., dimensions from 512 to 768) will irreparably break the Vector DB (AG-02). Alterations require AG-00 approval and schema migrations.
- ARBITRARY RESPONSE WRAPPING: Ensure the output response precisely matches the structure mandated in `data_schema.yaml` for AG-03 compatibility.

---

## Provenance and Change Log  
- 2024-05-18 | Project Owner + AI | Translated | Converted to professional technical English.

---

## Validation Hooks  
- Unit tests must enforce that predictions return accurately sized `float32` arrays for all inputs.
- CI pipeline must include memory leak profiling over 100 consecutive predictions.

---

## Review Cadence  
- **review_interval_days**: 90
- **next_review_due**: 2024-08-18

---

## Tags and Search Metadata  
- **tags**: [ai, clip, embedding, pytorch, computer-vision, multimodal]
- **keywords**: model warmup, vector dimension, vit-b/32, inference, tensor, fallback
- **canonical_id**: kb.ag01.clip.1
