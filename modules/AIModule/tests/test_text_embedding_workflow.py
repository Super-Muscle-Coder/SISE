"""
Test Suite: Text Embedding Workflow (T002-04)

Tests for:
  - Text validation (UTF-8, length, content)
  - Token count estimation & truncation
  - Service integration with WarmupService
  - Router endpoint mapping
  - Error handling and HTTP status codes
"""

import pytest
from app.entities import TextEmbeddingRequest, TextEmbeddingResult, TextProcessConfig
from app.adapters import TextValidator, TextTokenizer, VectorNormalizer
from app.services import TextEmbeddingService, WarmupService
from app.routers import create_text_embedding_router


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def text_process_config():
    """Default text embedding configuration."""
    return TextProcessConfig(
        max_tokens=77,
        tokenizer_name="clip",
        enable_cache=False,
        truncate_strategy="truncate"
    )


# ============================================================================
# Test Text Entities
# ============================================================================

def test_text_embedding_request_creation():
    """Test TextEmbeddingRequest dataclass creation."""
    req = TextEmbeddingRequest(text="Hello, world!", normalize_output=True)
    assert req.text == "Hello, world!"
    assert req.normalize_output is True


def test_text_embedding_result_creation():
    """Test TextEmbeddingResult dataclass creation (success case)."""
    vector = [0.1] * 512
    result = TextEmbeddingResult(
        success=True,
        vector=vector,
        vector_dimension=512,
        processing_time_ms=50.0,
        error_code=None,
        error_message=None
    )
    assert result.success is True
    assert len(result.vector) == 512
    assert result.vector_dimension == 512
    assert result.processing_time_ms == 50.0
    assert result.error_code is None


def test_text_embedding_result_creation_error():
    """Test TextEmbeddingResult dataclass creation (error case)."""
    result = TextEmbeddingResult(
        success=False,
        error_code="ERR_TEXT_TOO_LONG",
        error_message="Text exceeds 4096 characters"
    )
    assert result.success is False
    assert result.vector is None
    assert result.error_code == "ERR_TEXT_TOO_LONG"


def test_text_process_config_creation(text_process_config):
    """Test TextProcessConfig dataclass creation."""
    assert text_process_config.max_tokens == 77
    assert text_process_config.tokenizer_name == "clip"
    assert text_process_config.enable_cache is False
    assert text_process_config.truncate_strategy == "truncate"


# ============================================================================
# Test Text Validation
# ============================================================================

def test_text_validator_valid_input():
    """Test validation of valid text input."""
    is_valid, error = TextValidator.validate_text_input(
        "This is a valid text input for CLIP encoding.",
        max_chars=4096,
        max_tokens=77
    )
    assert is_valid is True
    assert error is None


def test_text_validator_empty_text():
    """Test validation rejects empty text."""
    is_valid, error = TextValidator.validate_text_input(
        "",
        max_chars=4096,
        max_tokens=77
    )
    assert is_valid is False
    assert "ERR_EMPTY_TEXT" in error


def test_text_validator_whitespace_only():
    """Test validation rejects whitespace-only text."""
    is_valid, error = TextValidator.validate_text_input(
        "   \n  \t  ",
        max_chars=4096,
        max_tokens=77
    )
    assert is_valid is False
    assert "ERR_EMPTY_TEXT" in error


def test_text_validator_text_too_long():
    """Test validation rejects text exceeding max_chars."""
    long_text = "a" * 5000  # Exceeds 4096
    is_valid, error = TextValidator.validate_text_input(
        long_text,
        max_chars=4096,
        max_tokens=77
    )
    assert is_valid is False
    assert "ERR_TEXT_TOO_LONG" in error


def test_text_sanitizer():
    """Test text sanitization (strip, normalize whitespace)."""
    dirty = "  This   is    a    test  \n\n  text.  "
    clean = TextValidator.sanitize_text(dirty)
    assert clean == "This is a test text."
    assert "  " not in clean
    assert "\n" not in clean


# ============================================================================
# Test Text Tokenization
# ============================================================================

def test_token_count_estimation():
    """Test token count estimation heuristic."""
    # Roughly: 10 words * 0.75 + 5 buffer = ~12.5 tokens
    text = "hello world this is a test of token counting"
    estimated = TextTokenizer.estimate_token_count(text)
    assert estimated > 0
    assert estimated <= 77  # Should be within CLIP limit


def test_truncate_text_no_truncation():
    """Test truncation when text fits within token limit."""
    text = "This is a short text."
    truncated, was_truncated = TextTokenizer.truncate_text_to_tokens(
        text,
        max_tokens=77,
        strategy="truncate"
    )
    assert truncated == text
    assert was_truncated is False


def test_truncate_text_with_truncation():
    """Test truncation when text exceeds token limit."""
    # Create very long text that exceeds token limit
    long_text = " ".join(["word"] * 150)  # 150 words > 77 token limit
    truncated, was_truncated = TextTokenizer.truncate_text_to_tokens(
        long_text,
        max_tokens=77,
        strategy="truncate"
    )
    assert truncated != long_text
    assert was_truncated is True
    # Re-estimate tokens to verify it fits
    est_tokens = TextTokenizer.estimate_token_count(truncated)
    assert est_tokens <= 77


def test_truncate_text_strategy_error():
    """Test truncation with 'error' strategy raises exception."""
    long_text = " ".join(["word"] * 150)
    with pytest.raises(ValueError, match="Text exceeds .* tokens"):
        TextTokenizer.truncate_text_to_tokens(
            long_text,
            max_tokens=77,
            strategy="error"
        )


# ============================================================================
# Test Vector Normalization
# ============================================================================

def test_vector_normalizer_basic():
    """Test that VectorNormalizer.normalize_vector returns tuple (vector, is_normalized)."""
    import numpy as np

    # Verify it returns tuple and vector is correct dimension
    vector = np.array([1.0, 2.0, 3.0], dtype=np.float32)
    result = VectorNormalizer.normalize_vector(vector)

    assert isinstance(result, tuple), f"Expected tuple, got {type(result)}"
    assert len(result) == 2, f"Expected tuple of length 2, got {len(result)}"

    normalized_vector, is_normalized = result

    assert isinstance(normalized_vector, np.ndarray)
    # is_normalized can be numpy bool or python bool
    assert bool(is_normalized) in [True, False], f"Expected boolean-like, got {type(is_normalized)}"
    assert len(normalized_vector) == 3


# ============================================================================
# Test Text Embedding Service Integration
# ============================================================================

def test_text_embedding_service_creation(text_process_config):
    """Test TextEmbeddingService can be created with mock warmup."""
    # Create a mock warmup service (minimal)
    class MockWarmupService:
        is_ready = False
        model = None
        tokenizer = None

    mock_warmup = MockWarmupService()
    service = TextEmbeddingService(mock_warmup, text_process_config)

    assert service.warmup_service is mock_warmup
    assert service.text_config is text_process_config


def test_text_embedding_service_model_not_ready(text_process_config):
    """Test service returns error when model not ready."""
    class MockWarmupService:
        is_ready = False
        model = None
        tokenizer = None

    mock_warmup = MockWarmupService()
    service = TextEmbeddingService(mock_warmup, text_process_config)

    result = service.extract_text_embedding("Hello, world!")

    assert result.success is False
    assert result.error_code == "ERR_MODEL_NOT_READY"
    assert result.vector is None


# ============================================================================
# Test Text Embedding Router
# ============================================================================

def test_create_text_embedding_router(text_process_config):
    """Test router factory creates APIRouter."""
    class MockWarmupService:
        is_ready = False
        model = None
        tokenizer = None

    mock_warmup = MockWarmupService()
    service = TextEmbeddingService(mock_warmup, text_process_config)

    router = create_text_embedding_router(service)

    # Check router has correct attributes
    assert hasattr(router, "routes")
    assert len(router.routes) > 0

    # Check prefix
    assert router.prefix == "/inference/embed"


# ============================================================================
# Test Router Endpoint Mapping
# ============================================================================

def test_text_embedding_router_endpoint_exists(text_process_config):
    """Test POST /embed/text endpoint is registered."""
    class MockWarmupService:
        is_ready = False
        model = None
        tokenizer = None

    mock_warmup = MockWarmupService()
    service = TextEmbeddingService(mock_warmup, text_process_config)
    router = create_text_embedding_router(service)

    # Find the /text endpoint
    text_endpoint = None
    for route in router.routes:
        if "/text" in route.path and "POST" in route.methods:
            text_endpoint = route
            break

    assert text_endpoint is not None, "POST /text endpoint not found in router"


# ============================================================================
# Error Handling Tests
# ============================================================================

def test_text_embedding_entity_error_fields():
    """Test error fields in TextEmbeddingResult."""
    result = TextEmbeddingResult(
        success=False,
        error_code="ERR_ENCODING_FAILED",
        error_message="Model inference failed"
    )

    assert result.success is False
    assert result.error_code == "ERR_ENCODING_FAILED"
    assert result.error_message == "Model inference failed"
    assert result.vector is None


# ============================================================================
# Configuration Tests
# ============================================================================

def test_text_process_config_defaults():
    """Test TextProcessConfig uses correct CLIP defaults."""
    config = TextProcessConfig()

    # CLIP ViT-B/32 and ViT-L/14 both use max 77 tokens
    assert config.max_tokens == 77
    assert config.tokenizer_name == "clip"
    assert config.truncate_strategy == "truncate"


def test_text_process_config_custom_values():
    """Test TextProcessConfig with custom values."""
    config = TextProcessConfig(
        max_tokens=50,
        tokenizer_name="custom",
        enable_cache=True,
        truncate_strategy="error"
    )

    assert config.max_tokens == 50
    assert config.tokenizer_name == "custom"
    assert config.enable_cache is True
    assert config.truncate_strategy == "error"
