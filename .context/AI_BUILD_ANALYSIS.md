# AI Module Container Build - Phân Tích Vấn Đề

## 🔴 VẤN ĐỀ CHÍNH

### 1. **Dockerfile Casing Warning (Cosmetic nhưng cần fix)**
**Dòng lệnh:** `FROM ... as builder` vs `FROM ... as runtime`
```
#1 WARN: FromAsCasing: 'as' and 'FROM' keywords' casing do not match (line 19)
#1 WARN: FromAsCasing: 'as' and 'FROM' keywords' casing do not match (line 43)
```
**Cách fix:** Thay `as` → `AS` để match với `FROM`

---

### 2. **PyTorch Download Rất Lớn (1.7GB+ CUDA dependencies)**
**Output build:**
```
Downloading torch-2.12.0-cp313-cp313-manylinux_2_28_x86_64.whl (532.3 MB)
Downloading nvidia_cudnn_cu13-9.20.0.48-py3-none-manylinux_2_27_x86_64.whl (366.2 MB)
Downloading nvidia_cublas-13.1.1.3-py3-none-manylinux_2_27_x86_64.whl (423.1 MB)
[... many more CUDA libs ...]
```

**Vấn đề:**
- PyTorch CUDA version tải toàn bộ CUDA runtime libraries
- Điều này thêm 1.7GB+ vào layer
- Chúng ta chạy trên **CPU** hoặc Docker Desktop không có NVIDIA GPU

**Cách fix:** Chỉ định PyTorch CPU version:
```
torch>=2.1.0 ; platform_machine == "x86_64" and platform_system == "Linux"
# Hoặc install torch CPU explicitly:
torch==2.1.2 --index-url https://download.pytorch.org/whl/cpu
```

---

### 3. **Entrypoint.py Kiểm Tra Env Vars Nhưng Không Set Defaults**
**Vấn đề:**
```python
# entrypoint.py yêu cầu tất cả các env var này:
REQUIRED_VARS = ["AI_SERVICE_PORT", "CLIP_MODEL_NAME", "DEVICE", "MODEL_CACHE_DIR"]
for var in REQUIRED_VARS:
	if not os.environ.get(var):
		log_error(f"Required env var not set: {var}")  # <- EXIT 1 nếu thiếu
```

**Nhưng Dockerfile không set chúng:**
```dockerfile
ENV PYTHONUNBUFFERED=1 \
	PYTHONDONTWRITEBYTECODE=1 \
	PYTHONPATH=/app/ai-service \
	LOG_LEVEL=INFO
# <- Thiếu AI_SERVICE_PORT, CLIP_MODEL_NAME, DEVICE, MODEL_CACHE_DIR
```

**Cách fix:** Thêm defaults vào Dockerfile hoặc entrypoint.py tự động set

---

### 4. **Entrypoint.py Path Issue**
**Dòng 119 trong entrypoint.py:**
```python
os.execvp("python", ["python", "-m", "uvicorn", "ai_main:app", ...])
```

**Vấn đề:**
- Container chạy `python /app/ai-service/entrypoint.py`
- Nhưng `ai_main:app` không có `.py` extension (module import)
- PYTHONPATH được set nhưng có thể không đủ

**Cách fix:** Đảm bảo `ai_main.py` có `create_app()` function đúng

---

### 5. **ai_main.py Load Env File Nhưng Không Có File trong Docker**
**Dockerfile chỉ copy:**
```dockerfile
COPY modules/AIModule/configs ./configs
```

**Nhưng ai_main.py load:**
```python
env_file = Path(__file__).parent / "ai.env.local"
```

**Vấn đề:**
- `/app/ai-service/ai.env.local` không tồn tại
- ai_main.py có thể crash khi khởi động

**Cách fix:** 
- Copy `ai.env.local` template vào Docker
- Hoặc thêm default env vars vào Dockerfile ENV

---

### 6. **HEALTHCHECK Command Có Thể Fail**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
	CMD python -c "import http.client; ..."
```

**Vấn đề:**
- Chạy python lại trong health check (overhead)
- Cần `ca-certificates` để HTTPS (đã có ✓)

---

## 📋 TÓMO TẮT TẤT CẢ FIX

| Vấn đề | Mức Độ | Fix |
|--------|--------|-----|
| Dockerfile Casing | ⚠️ Warning | Thay `as` → `AS` |
| PyTorch CUDA Heavy | 🔴 Critical | Chỉ định PyTorch CPU wheel |
| Missing Env Vars | 🔴 Critical | Set defaults trong Dockerfile |
| Entrypoint Module Path | 🟠 Major | Verify ai_main.py module import |
| ai.env.local Missing | 🟠 Major | Copy file hoặc set ENV vars |
| HEALTHCHECK Overhead | ⚠️ Minor | Có thể tối ưu sau |

---

## ✅ RECOMMENDED BUILD ORDER

1. Fix Dockerfile casing (FROM/AS)
2. Fix PyTorch to CPU wheel
3. Add missing ENV vars to Dockerfile
4. Verify ai_main.py structure
5. Create ai.env.local template in Docker
6. Rebuild và test

