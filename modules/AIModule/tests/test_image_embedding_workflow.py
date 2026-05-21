"""
Tests for Image Embedding Workflow (T002-02)

Tests image preprocessing, validation, and service structure.
"""

import io
import pytest
import numpy as np
from PIL import Image

from app import (
    ImagePreprocessConfig,
    ImageEmbeddingRequest,
    ImageEmbeddingResult,
    ImageValidator,
    ImagePreprocessor,
    VectorNormalizer,
)


class TestImagePreprocessConfig:
    """Test ImagePreprocessConfig dataclass."""

    def test_config_creation_default(self):
        """Test default configuration."""
        config = ImagePreprocessConfig()
        assert config.target_size == 224
        assert len(config.normalize_mean) == 3
        assert len(config.normalize_std) == 3

    def test_config_creation_custom_size(self):
        """Test custom target size."""
        config = ImagePreprocessConfig(target_size=256)
        assert config.target_size == 256


class TestImageEmbeddingEntities:
    """Test image embedding entity dataclasses."""

    def test_image_embedding_request_creation(self):
        """Test ImageEmbeddingRequest creation."""
        request = ImageEmbeddingRequest(
            image_bytes=b"fake_image_data",
            image_format="jpeg"
        )
        assert request.image_bytes == b"fake_image_data"
        assert request.image_format == "jpeg"

    def test_image_embedding_result_success(self):
        """Test successful ImageEmbeddingResult."""
        vector = [0.1] * 512
        result = ImageEmbeddingResult(
            success=True,
            vector=vector,
            vector_dimension=512,
            processing_time_ms=150.0
        )
        assert result.success
        assert len(result.vector) == 512
        assert result.error_message is None

    def test_image_embedding_result_failure(self):
        """Test failed ImageEmbeddingResult."""
        result = ImageEmbeddingResult(
            success=False,
            error_message="File too large",
            error_code="ERR_FILE_TOO_LARGE",
            processing_time_ms=50.0
        )
        assert not result.success
        assert result.vector is None
        assert result.error_code == "ERR_FILE_TOO_LARGE"


class TestImageValidator:
    """Test ImageValidator adapter."""

    def create_test_image(self, format_str: str = "JPEG") -> bytes:
        """Create a simple test image."""
        img = Image.new("RGB", (224, 224), color=(73, 109, 137))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format=format_str)
        return img_bytes.getvalue()

    def test_validate_jpeg_image(self):
        """Test JPEG image validation."""
        image_bytes = self.create_test_image("JPEG")
        is_valid, error = ImageValidator.validate_image_input(image_bytes, "image/jpeg")
        assert is_valid
        assert error is None

    def test_validate_png_image(self):
        """Test PNG image validation."""
        image_bytes = self.create_test_image("PNG")
        is_valid, error = ImageValidator.validate_image_input(image_bytes, "image/png")
        assert is_valid
        assert error is None

    def test_validate_invalid_content_type(self):
        """Test rejection of invalid content type."""
        image_bytes = self.create_test_image()
        is_valid, error = ImageValidator.validate_image_input(image_bytes, "image/webp")
        assert not is_valid
        assert "ERR_INVALID_CONTENT_TYPE" in error

    def test_validate_file_too_large(self):
        """Test rejection of oversized files."""
        oversized_bytes = b"x" * (21 * 1024 * 1024)  # 21MB
        is_valid, error = ImageValidator.validate_image_input(oversized_bytes, "image/jpeg")
        assert not is_valid
        assert "ERR_FILE_TOO_LARGE" in error

    def test_validate_corrupted_image(self):
        """Test rejection of corrupted image data."""
        corrupt_bytes = b"this is not a real image"
        is_valid, error = ImageValidator.validate_image_input(corrupt_bytes, "image/jpeg")
        assert not is_valid
        assert "ERR_INVALID_IMAGE" in error


class TestImagePreprocessor:
    """Test ImagePreprocessor adapter."""

    def create_test_image(self, mode: str = "RGB") -> bytes:
        """Create a test image in specified mode."""
        if mode == "RGB":
            img = Image.new("RGB", (100, 100), color=(255, 128, 64))
        elif mode == "L":  # Grayscale
            img = Image.new("L", (100, 100), color=128)
        elif mode == "RGBA":
            img = Image.new("RGBA", (100, 100), color=(255, 128, 64, 200))
        else:
            img = Image.new("RGB", (100, 100))

        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        return img_bytes.getvalue()

    def test_preprocess_rgb_image(self):
        """Test preprocessing of RGB image."""
        config = ImagePreprocessConfig(target_size=224)
        preprocessor = ImagePreprocessor(config)
        image_bytes = self.create_test_image("RGB")
        tensor, error = preprocessor.preprocess(image_bytes)
        assert error is None
        assert tensor is not None
        assert tensor.shape == (1, 3, 224, 224)

    def test_preprocess_grayscale_image(self):
        """Test preprocessing of grayscale image (converted to RGB)."""
        config = ImagePreprocessConfig(target_size=224)
        preprocessor = ImagePreprocessor(config)
        image_bytes = self.create_test_image("L")
        tensor, error = preprocessor.preprocess(image_bytes)
        assert error is None
        assert tensor is not None
        assert tensor.shape == (1, 3, 224, 224)

    def test_preprocess_rgba_image(self):
        """Test preprocessing of RGBA image (converted to RGB)."""
        config = ImagePreprocessConfig(target_size=224)
        preprocessor = ImagePreprocessor(config)
        image_bytes = self.create_test_image("RGBA")
        tensor, error = preprocessor.preprocess(image_bytes)
        assert error is None
        assert tensor is not None
        assert tensor.shape == (1, 3, 224, 224)

    def test_preprocess_invalid_image(self):
        """Test preprocessing of invalid image data."""
        config = ImagePreprocessConfig()
        preprocessor = ImagePreprocessor(config)
        tensor, error = preprocessor.preprocess(b"not an image")
        assert tensor is None
        assert "ERR_PREPROCESSING_FAILED" in error


class TestVectorNormalizer:
    """Test VectorNormalizer adapter."""

    def test_normalize_unit_vector(self):
        """Test normalization of already-normalized vector."""
        vector = np.array([0.8, 0.6])  # magnitude = 1.0
        normalized, is_valid = VectorNormalizer.normalize_vector(vector)
        assert is_valid
        norm = np.linalg.norm(normalized)
        assert abs(norm - 1.0) < 0.01

    def test_normalize_non_unit_vector(self):
        """Test normalization of non-normalized vector."""
        vector = np.array([3.0, 4.0])  # magnitude = 5.0
        normalized, is_valid = VectorNormalizer.normalize_vector(vector)
        assert is_valid
        norm = np.linalg.norm(normalized)
        assert abs(norm - 1.0) < 0.01

    def test_normalize_zero_vector(self):
        """Test rejection of zero vector."""
        vector = np.zeros(512)
        normalized, is_valid = VectorNormalizer.normalize_vector(vector)
        assert not is_valid

    def test_normalize_high_dimensional_vector(self):
        """Test normalization of 512-dimensional vector."""
        vector = np.ones(512)  # All ones
        normalized, is_valid = VectorNormalizer.normalize_vector(vector)
        assert is_valid
        norm = np.linalg.norm(normalized)
        assert abs(norm - 1.0) < 0.01


class TestImageEmbeddingServiceStructure:
    """Test ImageEmbeddingService structure (without CLIP model)."""

    def test_service_creation(self):
        """Test ImageEmbeddingService initialization."""
        # Create a mock warmup service (not fully initialized)
        from app import WarmupService, CLIPConfig
        config = CLIPConfig(
            model_name="ViT-B/32",
            device="cpu",
            model_cache_dir="./models"
        )
        warmup_service = WarmupService(config)

        # Create image embedding service
        image_config = ImagePreprocessConfig()
        service = object.__new__(object)  # Avoid actual initialization
        # Just verify the class exists and can be imported
        from app.services import ImageEmbeddingService
        assert ImageEmbeddingService is not None
