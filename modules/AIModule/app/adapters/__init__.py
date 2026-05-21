"""
Adapters Layer — Low-level integrations with external systems (PyTorch, open_clip).

Exports adapter classes from workflow-specific modules using prefix convention.
"""

"""
Adapters Layer — Low-level integrations with external systems (PyTorch, open_clip).

Exports adapter classes from workflow-specific modules using prefix convention.

NOTE: VectorNormalizer is defined only in image_embedding_adapters and exported here
as a shared utility. This ensures consistency with data_schema.yaml constraints:
  - global_configs.vector_dim = 512
  - milvus.metric_type = COSINE (requires L2-normalized vectors)
"""

from app.adapters.warmup_adapters import DeviceManager, CLIPModelLoader, WarmupExecutor
from app.adapters.image_embedding_adapters import ImageValidator, ImagePreprocessor, VectorNormalizer
from app.adapters.text_embedding_adapters import TextValidator, TextTokenizer
from app.adapters.batch_embedding_adapters import BatchValidator, BatchPreprocessor

__all__ = [
    # Warmup workflow
    "DeviceManager",
    "CLIPModelLoader",
    "WarmupExecutor",
    # Image embedding workflow
    "ImageValidator",
    "ImagePreprocessor",
    "VectorNormalizer",  # SHARED: Used by both image_embedding and text_embedding workflows
    # Text embedding workflow
    "TextValidator",
    "TextTokenizer",
    # Batch embedding workflow
    "BatchValidator",
    "BatchPreprocessor",
]
