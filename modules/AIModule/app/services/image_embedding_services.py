"""
Image Embedding Workflow — Services Layer

Orchestrates image preprocessing and embedding extraction.
Prefix: image_embedding_*
"""

import time
import numpy as np
import torch

from app.entities import (
    ImagePreprocessConfig,
    ImageEmbeddingRequest,
    ImageEmbeddingResult,
)
from app.adapters import ImageValidator, ImagePreprocessor, VectorNormalizer


class ImageEmbeddingService:
    """
    High-level service for image embedding extraction.

    Manages:
      1. Input validation (file format, size)
      2. Image preprocessing (resize, normalize, RGB conversion)
      3. CLIP model inference (delegated to warmup_service.model)
      4. Vector normalization (L2 normalize for cosine similarity)
      5. Result composition
    """

    def __init__(self, warmup_service, config: ImagePreprocessConfig = None):
        """
        Initialize image embedding service.

        Args:
            warmup_service: WarmupService instance (provides loaded CLIP model)
            config: ImagePreprocessConfig (optional, uses default if None)
        """
        self.warmup_service = warmup_service
        self.config = config or ImagePreprocessConfig()
        self.validator = ImageValidator()
        self.preprocessor = ImagePreprocessor(self.config)
        self.normalizer = VectorNormalizer()

    def extract_image_embedding(
        self,
        image_bytes: bytes,
        content_type: str
    ) -> ImageEmbeddingResult:
        """
        Complete pipeline: validate → preprocess → encode → normalize.

        Args:
            image_bytes: Raw image file bytes
            content_type: MIME type (e.g., 'image/jpeg')

        Returns:
            ImageEmbeddingResult with vector or error
        """
        start_time = time.time()

        try:
            # Step 1: Validate input
            is_valid, error_msg = self.validator.validate_image_input(image_bytes, content_type)
            if not is_valid:
                elapsed_ms = (time.time() - start_time) * 1000
                error_code = error_msg.split(":")[0] if ":" in error_msg else "ERR_VALIDATION_FAILED"
                return ImageEmbeddingResult(
                    success=False,
                    processing_time_ms=elapsed_ms,
                    error_message=error_msg,
                    error_code=error_code,
                )

            # Step 2: Preprocess image
            tensor, preprocess_error = self.preprocessor.preprocess(image_bytes)
            if tensor is None:
                elapsed_ms = (time.time() - start_time) * 1000
                error_code = preprocess_error.split(":")[0] if ":" in preprocess_error else "ERR_PREPROCESSING_FAILED"
                return ImageEmbeddingResult(
                    success=False,
                    processing_time_ms=elapsed_ms,
                    error_message=preprocess_error,
                    error_code=error_code,
                )

            # Step 3: Get model and device from warmup service
            if not self.warmup_service.is_ready:
                elapsed_ms = (time.time() - start_time) * 1000
                return ImageEmbeddingResult(
                    success=False,
                    processing_time_ms=elapsed_ms,
                    error_message="CLIP model not ready",
                    error_code="ERR_MODEL_NOT_READY",
                )

            model = self.warmup_service.get_model()
            device = self.warmup_service.get_device()

            # Step 4: Encode image with CLIP
            tensor = tensor.to(device)
            with torch.no_grad():
                embedding = model.encode_image(tensor)  # (1, vector_dim)

            # Convert to numpy
            vector = embedding.cpu().numpy().astype(np.float32).squeeze()  # (vector_dim,)

            # Step 5: Normalize vector
            normalized_vector, is_normalized = self.normalizer.normalize_vector(vector)

            if not is_normalized:
                elapsed_ms = (time.time() - start_time) * 1000
                return ImageEmbeddingResult(
                    success=False,
                    processing_time_ms=elapsed_ms,
                    error_message="Vector normalization failed",
                    error_code="ERR_NORMALIZATION_FAILED",
                )

            # Step 6: Validate vector dimension (data_schema.yaml -> global_configs.vector_dim)
            if len(normalized_vector) != self.config.vector_dim:
                elapsed_ms = (time.time() - start_time) * 1000
                return ImageEmbeddingResult(
                    success=False,
                    processing_time_ms=elapsed_ms,
                    error_message=f"Vector dimension mismatch: got {len(normalized_vector)}, expected {self.config.vector_dim}",
                    error_code="ERR_VECTOR_DIM_MISMATCH",
                )

            elapsed_ms = (time.time() - start_time) * 1000

            return ImageEmbeddingResult(
                success=True,
                vector=normalized_vector.tolist(),
                vector_dimension=self.config.vector_dim,
                processing_time_ms=elapsed_ms,
            )

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            return ImageEmbeddingResult(
                success=False,
                processing_time_ms=elapsed_ms,
                error_message=str(e),
                error_code="ERR_INTERNAL",
            )

# Export 
__all__ = ["ImageEmbeddingService"]