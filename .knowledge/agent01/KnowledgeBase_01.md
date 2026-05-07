# =============================================================================
# KNOWLEDGE BASE — AG-01 AIModuleAgent
# =============================================================================
# Writer  : Project Owner + AG-00 + AG-01 (đề xuất, AG-00 approve)
# Reader  : AG-01 chủ yếu
# =============================================================================

## 1. DOMAIN KNOWLEDGE: CLIP MODEL

### 1.1 Kiến trúc CLIP (Contrastive Language-Image Pretraining)

CLIP được OpenAI huấn luyện trên 400 triệu cặp (ảnh, caption) từ internet.
Nó gồm 2 encoder độc lập chạy song song:
- **Image Encoder** (Vision Transformer hoặc ResNet): nhận ảnh → vector.
- **Text Encoder** (Transformer): nhận text → vector.

Cả hai encoder ánh xạ đầu ra vào cùng một **shared embedding space** — đây là điểm mấu chốt cho phép tìm kiếm image-to-image và text-to-image trong cùng pipeline.

### 1.2 Phiên bản được dùng trong SISE

| Phiên bản | Vector dim | Tốc độ | Độ chính xác |
|---|---|---|---|
| **ViT-B/32** (mặc định) | 512 | Nhanh, CPU-friendly | Tốt |
| ViT-L/14 | 768 | Chậm hơn, cần GPU | Cao hơn |

> ⚠️ **CRITICAL**: `vector_dim` trong code của AG-01 PHẢI bằng `global_configs.vector_dim` trong `data_schema.yaml`. Hiện tại = **512**. Không tự ý thay đổi.

### 1.3 Load model đúng cách

```python
import open_clip
import torch

model, _, preprocess = open_clip.create_model_and_transforms(
    'ViT-B-32',
    pretrained='openai'
)
model.eval()  # BẮT BUỘC — tắt dropout và batch norm training mode

# Warm-up: tránh cold-start delay
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
dummy = torch.zeros(1, 3, 224, 224).to(device)
with torch.no_grad():
    model.encode_image(dummy)  # Dummy forward pass
```

---

## 2. PREPROCESSING PIPELINE

### 2.1 Quy trình chuẩn

```python
from PIL import Image
import io

def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")      # BẮT BUỘC: xử lý grayscale (L) và RGBA
    tensor = preprocess(img)      # CLIP's built-in preprocess: resize + normalize
    return tensor.unsqueeze(0)    # Add batch dimension: (3, 224, 224) → (1, 3, 224, 224)
```

### 2.2 Các edge case phải xử lý

| Edge case | Nguyên nhân | Xử lý |
|---|---|---|
| Ảnh grayscale (mode 'L') | Camera đen trắng | `img.convert("RGB")` |
| Ảnh có alpha (mode 'RGBA') | PNG với transparency | `img.convert("RGB")` |
| Ảnh rất nhỏ (< 32px) | Thumbnail corrupt | Raise `ValueError` |
| File không phải ảnh | Upload sai | Catch `PIL.UnidentifiedImageError` |

---

## 3. EMBEDDING EXTRACTION

```python
def embed_image(image_bytes: bytes) -> list[float]:
    tensor = preprocess_image(image_bytes).to(device)
    with torch.no_grad():
        features = model.encode_image(tensor)
        features = features / features.norm(dim=-1, keepdim=True)  # L2 normalize
    return features.squeeze().cpu().tolist()  # → list[float] len=512

def embed_text(text: str) -> list[float]:
    tokens = open_clip.tokenize([text]).to(device)
    with torch.no_grad():
        features = model.encode_text(tokens)
        features = features / features.norm(dim=-1, keepdim=True)  # L2 normalize
    return features.squeeze().cpu().tolist()  # → list[float] len=512
```

> **Tại sao L2 normalize?** Cosine similarity giữa 2 vector normalized = dot product → tính toán nhanh hơn trong Milvus.

---

## 4. FASTAPI SERVICE STRUCTURE

```
modules/AIModule/
├── app/
│   ├── main.py           # FastAPI app, startup event (warm-up)
│   ├── routers/
│   │   └── embed.py      # POST /embed/image, /embed/text, /embed/batch
│   ├── services/
│   │   └── embedding.py  # EmbeddingService class
│   └── schemas/
│       └── embed.py      # Pydantic request/response models
├── Dockerfile
└── pyproject.toml
```

---

## 5. RANH GIỚI CỨNG (KHÔNG ĐƯỢC VƯỢT QUA)

- AG-01 **không** kết nối trực tiếp đến PostgreSQL, Milvus, hoặc MinIO.
- AG-01 **không** biết về `user_id`, `album_id`, hay `privacy_level`.
- AG-01 chỉ nhận raw data (bytes hoặc string) và trả về vector. Đó là tất cả.
- Mọi business logic nằm ở AG-03, không phải AG-01.

---

## 6. PERFORMANCE TARGETS

| Metric | Target | Cách đo |
|---|---|---|
| Single image embed latency | < 500ms (CPU) | `time.perf_counter()` |
| Single text embed latency | < 100ms (CPU) | `time.perf_counter()` |
| Batch size 32 latency | < 5s (CPU) | Tổng thời gian cho 32 ảnh |
| Memory footprint | < 2GB RAM | `psutil.Process().memory_info()` |
