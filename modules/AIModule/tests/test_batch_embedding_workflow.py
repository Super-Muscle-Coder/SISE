"""
Test Suite: Batch Embedding Workflow (T002-05)

Validates:
  - BatchEmbeddingConfig entity creation
  - BatchValidator and BatchPreprocessor adapters
  - BatchEmbeddingService orchestration
  - Batch endpoint registration
  - Batch size limits and error handling
  - Partial failure handling (some images fail, others succeed)

Python: 3.13
"""

import pytest
import numpy as np
from pathlib import Path
from PIL import Image
import io

from app.entities import BatchEmbeddingConfig, BatchEmbeddingResult
from app.adapters import BatchValidator, BatchPreprocessor
from app.services import BatchEmbeddingService, WarmupService, ImageEmbeddingService
from app.routers import create_batch_embedding_router


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def batch_config():
    """Batch embedding configuration."""
    return BatchEmbeddingConfig(
        max_batch_size=32,
        enable_cache=False,
        cache_ttl_seconds=3600,
        timeout_ms=10000,
        vector_dim=512,
    )


@pytest.fixture
def sample_image_bytes():
    """Generate a valid JPEG image in memory."""
    img = Image.new("RGB", (224, 224), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()


@pytest.fixture
def invalid_image_bytes():
    """Generate invalid image bytes."""
    return b"not a real image"


@pytest.fixture
def grayscale_image_bytes():
    """Generate a grayscale image in memory."""
    img = Image.new("L", (224, 224), color=128)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


# ============================================================================
# Test: Batch Embedding Config (Entity)
# ============================================================================

def test_batch_embedding_config_creation(batch_config):
    """Test BatchEmbeddingConfig dataclass creation."""
    assert batch_config.max_batch_size == 32
    assert batch_config.enable_cache is False
    assert batch_config.vector_dim == 512
    assert batch_config.timeout_ms == 10000


def test_batch_embedding_result_creation():
    """Test BatchEmbeddingResult dataclass creation."""
    result = BatchEmbeddingResult(
        vectors=[
            [0.1] * 512,
            [0.2] * 512,
        ],
        successful_count=2,
        failed_count=0,
        processing_time_ms=100.5,
    )
    assert len(result.vectors) == 2
    assert result.successful_count == 2
    assert result.failed_count == 0


# ============================================================================
# Test: Batch Validator (Adapter)
# ============================================================================

def test_batch_validator_validate_file_list_empty():
    """Test validation fails on empty file list."""
    with pytest.raises(ValueError, match="ERR_EMPTY_FILE_LIST"):
        BatchValidator.validate_file_list([], [], [])


def test_batch_validator_validate_file_list_mismatch():
    """Test validation fails on file/filename count mismatch."""
    with pytest.raises(ValueError, match="ERR_FILE_LIST_MISMATCH"):
        BatchValidator.validate_file_list([b"data1", b"data2"], ["file1.jpg"], ["image/jpeg"])


def test_batch_validator_validate_content_type_mismatch():
    """Test validation fails on content-type count mismatch."""
    with pytest.raises(ValueError, match="ERR_CONTENT_TYPE_MISMATCH"):
        BatchValidator.validate_file_list([b"data1"], ["file1.jpg"], [])


def test_batch_validator_validate_batch_size_empty():
    """Test validation fails on empty batch."""
    with pytest.raises(ValueError, match="ERR_EMPTY_BATCH"):
        BatchValidator.validate_batch_size(0)


def test_batch_validator_validate_batch_size_too_large():
    """Test validation fails on oversized batch."""
    with pytest.raises(ValueError, match="ERR_BATCH_TOO_LARGE"):
        BatchValidator.validate_batch_size(50, max_batch_size=32)


def test_batch_validator_validate_batch_size_ok():
    """Test validation passes for valid batch size."""
    BatchValidator.validate_batch_size(10, max_batch_size=32)
    BatchValidator.validate_batch_size(32, max_batch_size=32)
    # No exception = pass


# ============================================================================
# Test: Batch Preprocessor (Adapter)
# ============================================================================

def test_batch_preprocessor_preprocess_valid_images(sample_image_bytes):
    """Test batch preprocessing with valid images."""
    file_bytes_list = [sample_image_bytes, sample_image_bytes]
    filenames_list = ["image1.jpg", "image2.jpg"]
    content_types_list = ["image/jpeg", "image/jpeg"]

    tensors, errors = BatchPreprocessor.preprocess_batch(file_bytes_list, filenames_list, content_types_list)

    assert len(tensors) == 2
    assert len(errors) == 2
    assert errors[0] == ""  # No error
    assert errors[1] == ""  # No error
    assert tensors[0] is not None
    assert tensors[1] is not None


def test_batch_preprocessor_preprocess_mixed_valid_invalid(sample_image_bytes, invalid_image_bytes):
    """Test batch preprocessing with mixed valid/invalid images."""
    file_bytes_list = [sample_image_bytes, invalid_image_bytes, sample_image_bytes]
    filenames_list = ["image1.jpg", "corrupt.jpg", "image3.jpg"]
    content_types_list = ["image/jpeg", "image/jpeg", "image/jpeg"]

    tensors, errors = BatchPreprocessor.preprocess_batch(file_bytes_list, filenames_list, content_types_list)

    assert len(tensors) == 3
    assert len(errors) == 3
    assert errors[0] == ""  # Valid
    assert errors[1] != ""  # Invalid
    assert errors[2] == ""  # Valid
    assert tensors[0] is not None
    assert tensors[1] is None
    assert tensors[2] is not None


def test_batch_preprocessor_preprocess_grayscale(grayscale_image_bytes):
    """Test batch preprocessing with grayscale image (edge case)."""
    file_bytes_list = [grayscale_image_bytes]
    filenames_list = ["gray.png"]
    content_types_list = ["image/png"]

    tensors, errors = BatchPreprocessor.preprocess_batch(file_bytes_list, filenames_list, content_types_list)

    assert len(tensors) == 1
    assert errors[0] == ""  # Should succeed (grayscale is converted to RGB)
    assert tensors[0] is not None


# ============================================================================
# Test: Batch Embedding Service (Service Layer)
# ============================================================================

@pytest.mark.skip(reason="Requires full CLIP model; defer to integration tests")
def test_batch_embedding_service_initialization(batch_config):
    """Test BatchEmbeddingService initialization."""
    # Note: This test is skipped because it requires a full WarmupService
    # and ImageEmbeddingService with loaded CLIP model.
    # Real integration testing should load the model.
    pass


def test_batch_embedding_service_error_codes(batch_config):
    """Verify batch embedding service error code constants."""
    assert hasattr(BatchEmbeddingService, "ERR_MODEL_NOT_READY")
    assert hasattr(BatchEmbeddingService, "ERR_BATCH_EMPTY")
    assert hasattr(BatchEmbeddingService, "ERR_BATCH_TOO_LARGE")
    assert hasattr(BatchEmbeddingService, "ERR_PREPROCESSING_FAILED")
    assert hasattr(BatchEmbeddingService, "ERR_VECTOR_DIM_MISMATCH")


# ============================================================================
# Test: Router Registration (Endpoint Layer)
# ============================================================================

@pytest.mark.skip(reason="Requires FastAPI test client setup")
def test_batch_embedding_router_creation():
    """Test batch embedding router is created successfully."""
    # This is skipped because it requires a full service instance with loaded model.
    pass


# ============================================================================
# Test: Contract Validation
# ============================================================================

def test_batch_embedding_config_vector_dim_matches_schema():
    """Verify batch embedding config respects data_schema.yaml global_configs.vector_dim."""
    config = BatchEmbeddingConfig()
    assert config.vector_dim == 512, "Vector dimension must match data_schema.yaml (512)"


def test_batch_embedding_result_vector_list_type():
    """Verify batch result stores vectors as List[List[float]]."""
    result = BatchEmbeddingResult(
        vectors=[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
        successful_count=2,
        failed_count=0,
    )
    assert isinstance(result.vectors, list)
    assert all(isinstance(v, list) for v in result.vectors)


# ============================================================================
# Test: Max Batch Size Constraint
# ============================================================================

def test_batch_config_max_batch_size_default():
    """Verify default max_batch_size is 32 (from spec)."""
    config = BatchEmbeddingConfig()
    assert config.max_batch_size == 32


def test_batch_config_max_batch_size_customizable():
    """Verify max_batch_size is customizable."""
    config = BatchEmbeddingConfig(max_batch_size=64)
    assert config.max_batch_size == 64


# ============================================================================
# Integration: Adapter + Entity Composition
# ============================================================================

def test_batch_preprocessing_output_shapes(sample_image_bytes):
    """Test that batch preprocessing returns consistent tensor shapes."""
    file_bytes_list = [sample_image_bytes] * 3
    filenames_list = [f"image{i}.jpg" for i in range(3)]
    content_types_list = ["image/jpeg"] * 3

    tensors, errors = BatchPreprocessor.preprocess_batch(file_bytes_list, filenames_list, content_types_list)

    # All should have shape (1, 3, 224, 224) if processed via ImagePreprocessor
    for i, (tensor, error) in enumerate(zip(tensors, errors)):
        if error == "" and tensor is not None:
            # Check tensor shape
            assert tensor.shape == (1, 3, 224, 224), f"Tensor {i} has wrong shape"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
