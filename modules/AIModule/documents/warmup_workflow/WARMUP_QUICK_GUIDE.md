# Warmup Workflow - Quick Guide

**Mục đích**: Tài liệu này cung cấp cái nhìn tổng thể nhanh về warmup workflow cho các developer mới tham gia dự án hoặc cần nắm bắt nhanh cốt lõi của hệ thống.

**Thời gian đọc**: 10-15 phút

---

## 1. Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa

Warmup workflow (T002-01) là quá trình khởi động CLIP model, thực hiện forward pass dummy, và chuẩn bị model cho việc xử lý các request embedding thực tế. Workflow này chạy tự động khi AI Service khởi động, loại bỏ cold-start latency cho các request đầu tiên.

**Vai trò trong hệ thống**:
- Ngôn ngữ khởi động của AI Service
- Đảm bảo model sẵn sàng trong eval mode trước khi nhận request
- Giảm latency cho request embedding đầu tiên (30-60s thành < 100ms)

### Quy trình cơ bản (High-level Steps)

Warmup workflow gồm các bước:

1. **Device Detection**: Tự động phát hiện device (CUDA/CPU)
2. **Model Loading**: Download/load CLIP model từ HuggingFace
3. **Model Preparation**: Đặt model vào eval mode, transfer lên device
4. **Warmup Execution**: Chạy forward pass dummy (image + text)
5. **Validation**: Kiểm tra model ready, log warmup time

### Kiến trúc đơn giản (Simple Architecture)

```
Environment Setup
	|
	v
Device Detection (CUDA/CPU auto-detect)
	|
	v
Model Loading (open_clip)
	|
	v
Model Preparation (eval mode, device transfer)
	|
	v
Warmup Forward Pass (dummy tensors)
	|
	v
Validation & Logging
	|
	v
Ready for Inference
```

---

## 2. Workflow này làm việc với dữ liệu gì? Input, Output là gì?

### Input

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Environment Variables** | CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR | ViT-B/32, cpu, /cache/ |
| **External Dependencies** | Network (HuggingFace download), Disk space (model cache) | Internet, 2GB+ free |
| **Model Artifacts** | CLIP weights (cached hoặc download) | pytorch_model.bin |

### Output

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Primary Output** | Loaded CLIP model object in eval mode, ready for inference | model instance, ready flag |
| **Side Effects** | Log file, warmup time metric, device info logged | warmup_duration_ms, device_type |
| **State Changes** | AI Service from "initializing" to "ready" | readiness status = True |

### Dữ liệu được xử lý

- **Loại**: CLIP model weights (~600MB for ViT-B/32)
- **Định dạng**: PyTorch .bin files, cached locally
- **Kích thước**: 600MB - 1.5GB tùy model
- **Tần suất**: 1 lần mỗi container startup

---

## 3. Các thành phần trọng tâm của Workflow?

### Thành phần chính (Core Components)

| Thành phần | Chức năng | Loại |
|-----------|---------|------|
| **WarmupConfig** | Lưu trữ cấu hình warmup (model name, device, timeout) | Config Entity |
| **DeviceManager** | Phát hiện và quản lý torch device (CUDA/CPU) | Adapter |
| **CLIPModelLoader** | Download/load CLIP model từ open_clip | Adapter |
| **WarmupExecutor** | Thực hiện forward pass dummy, validation | Adapter |
| **WarmupService** | Điều phối toàn bộ quy trình warmup | Service |
| **WarmupRouter** | Entry point for warmup handler (FastAPI lifespan) | Router |
| **ai_main.py** | Khởi chạy warmup tại startup (lifespan event) | Bootstrap |

### Sơ đồ mối quan hệ (Component Relationships)

```
Environment Variables
	|
	v
WarmupConfig (reads env)
	|
	v
DeviceManager + CLIPModelLoader + WarmupExecutor (adapters)
	|
	v
WarmupService (orchestrates)
	|
	v
WarmupRouter (FastAPI startup handler)
	|
	v
ai_main.py (calls at lifespan.startup)
	|
	v
Ready for Embedding Requests
```

---

## Quick Checklist

Để khởi động warmup workflow:

- [ ] Environment biến CLIP_MODEL_NAME set (hoặc default ViT-B/32)
- [ ] Environment biến DEVICE set hoặc auto-detect
- [ ] MODEL_CACHE_DIR tồn tại hoặc có write permission để tạo
- [ ] Internet connectivity (first time download model)
- [ ] Disk space >= 2GB
- [ ] PyTorch, open_clip installed
- [ ] Warmup completion logged (check logs for duration)

---

## Bước tiếp theo

- **Muốn hiểu chi tiết hơn?** -> Xem WARMUP_DEEP_GUIDE.md
- **Cần tham khảo cấu trúc tệp/thư mục?** -> Xem WARMUP_REFERENCES.md
- **Muốn xem code mẫu?** -> Xem source files trong modules/AIModule/app/

---

## Tài liệu liên quan
- [Tasks.yaml](.context/Tasks.yaml) - T002-01 task definition
- [DOS.md](.context/DOS.md) - System design
- [data_schema.yaml](.context/data_schema.yaml) - Data contracts
- [Image Embedding Workflow](../image_embedding_workflow/QUICK_GUIDE.md) - Depends on warmup
- [Text Embedding Workflow](../text_embedding_workflow/QUICK_GUIDE.md) - Depends on warmup
