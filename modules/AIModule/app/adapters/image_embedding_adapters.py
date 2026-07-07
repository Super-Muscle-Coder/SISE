"""
Image Embedding Workflow — Adapters Layer

Handles image preprocessing, format validation, and normalization.
Prefix: image_embedding_*
"""

import io
import time
from typing import Optional, Tuple

import torch
import numpy as np
from PIL import Image

from app.entities import ImagePreprocessConfig, ImageEmbeddingResult


class ImageValidator:
    """Validates image input format and content."""

    MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
    ALLOWED_FORMATS = {"jpeg", "jpg", "png"}

    @staticmethod
    def validate_image_input(file_bytes: bytes, content_type: str) -> Tuple[bool, Optional[str]]:
        """
        Validate image file size and format.

        Args:
            file_bytes: Raw image bytes
            content_type: MIME type (e.g., 'image/jpeg', 'image/png')

        Returns:
            (is_valid, error_message)
        """
        # Check file size
        if len(file_bytes) > ImageValidator.MAX_FILE_SIZE:
            return False, f"ERR_FILE_TOO_LARGE: Max {ImageValidator.MAX_FILE_SIZE / 1024 / 1024:.0f}MB"

        # Check content type
        mime_to_format = {
            "image/jpeg": "jpeg",
            "image/jpg": "jpeg",
            "image/png": "png",
        }

        if content_type not in mime_to_format:
            return False, f"ERR_INVALID_CONTENT_TYPE: Only JPEG and PNG supported, got {content_type}"

        # Try to open and validate image integrity
        try:
            img = Image.open(io.BytesIO(file_bytes))
            if img.mode not in ["RGB", "L", "RGBA"]:
                return False, f"ERR_UNSUPPORTED_IMAGE_MODE: {img.mode}"
            return True, None
        except Exception as e:
            return False, f"ERR_INVALID_IMAGE: {str(e)}"


class ImagePreprocessor:
    """Preprocesses images for CLIP model input."""

    def __init__(self, config: ImagePreprocessConfig):
        self.config = config

    def preprocess(self, file_bytes: bytes) -> Tuple[Optional[torch.Tensor], Optional[str]]:
        """
        Convert raw image bytes to CLIP-compatible tensor.

        Process:
          1. Load image from bytes
          2. Convert to RGB (handle grayscale/RGBA edge cases)
          3. Resize to 224x224
          4. Normalize using CLIP standard mean/std
          5. Return (1, 3, 224, 224) tensor

        Args:
            file_bytes: Raw image bytes

        Returns:
            (preprocessed_tensor, error_message)
        """
        try:
            # Step 1: Load image
            img = Image.open(io.BytesIO(file_bytes))

            # Step 2: Convert to RGB
            if img.mode == "L":  # Grayscale
                img = img.convert("RGB")
            elif img.mode == "RGBA":  # RGBA with alpha
                img = img.convert("RGB")
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Step 3: Resize to target size
            img = img.resize((self.config.target_size, self.config.target_size), Image.Resampling.LANCZOS)

            # Step 4: Convert to numpy array and normalize
            img_array = np.array(img, dtype=np.float32) / 255.0  # [0, 1]

            # Apply CLIP normalization
            for i in range(3):
                img_array[:, :, i] = (img_array[:, :, i] - self.config.normalize_mean[i]) / self.config.normalize_std[i]

            # Step 5: Convert to tensor (1, 3, 224, 224)
            tensor = torch.from_numpy(img_array).permute(2, 0, 1).unsqueeze(0)  # (1, 3, H, W)

            return tensor, None

        except Exception as e:
            return None, f"ERR_PREPROCESSING_FAILED: {str(e)}"


class VectorNormalizer:
    """Normalizes embedding vectors to unit length (for cosine similarity)."""

    @staticmethod
    def normalize_vector(vector: np.ndarray, tolerance: float = 0.01) -> Tuple[np.ndarray, bool]:
        """
        L2-normalize vector to unit length.

        Args:
            vector: Raw embedding vector (typically 512-dim)
            tolerance: Allowed deviation from magnitude 1.0

        Returns:
            (normalized_vector, is_valid)
        """
        try:
            norm = np.linalg.norm(vector)
            if norm < 1e-8:
                return vector, False  # All zeros

            normalized = vector / norm

            # Verify normalization
            final_norm = np.linalg.norm(normalized)
            is_valid = abs(final_norm - 1.0) < tolerance

            return normalized, is_valid

        except Exception:
            return vector, False


# Export
__all__ = [
    "ImageValidator",
    "ImagePreprocessor",
    "VectorNormalizer",
]
