"""
Warmup Workflow — Test Suite

Tests for CLIP model loading, device detection, and warm-up.
File: test_warmup_workflow.py
"""

import pytest
import torch
from pathlib import Path

# Adjust import path for pytest
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import (
    CLIPConfig,
    WarmupResult,
    DeviceManager,
    CLIPModelLoader,
    WarmupExecutor,
    WarmupService,
)
from ai_main import _build_warmup_config, _load_env_file


class TestDeviceManager:
    """Tests for device detection."""

    def test_device_manager_auto_detect(self):
        """Test auto-detection of CUDA/CPU."""
        device = DeviceManager.get_device("auto")
        assert device in ("cuda", "cpu")
        print(f"Auto-detect: {device}")

    def test_device_manager_cuda_fallback(self):
        """Test CUDA → CPU fallback if CUDA unavailable."""
        device = DeviceManager.get_device("cuda")
        assert device in ("cuda", "cpu")
        print(f"CUDA request → {device}")

    def test_device_manager_cpu_request(self):
        """Test explicit CPU request."""
        device = DeviceManager.get_device("cpu")
        assert device == "cpu"
        print(f"CPU request → {device}")


class TestCLIPConfig:
    """Tests for CLIPConfig entity."""

    def test_clip_config_creation(self):
        """Test creating CLIPConfig with defaults."""
        config = CLIPConfig(
            model_name="ViT-B/32",
            device="cpu",
            model_cache_dir="./models"
        )
        assert config.model_name == "ViT-B/32"
        assert config.device == "cpu"
        assert config.warmup_iterations == 5
        print("✅ CLIPConfig created with defaults")

    def test_clip_config_custom_iterations(self):
        """Test CLIPConfig with custom warm-up iterations."""
        config = CLIPConfig(
            model_name="ViT-L/14",
            device="cuda",
            model_cache_dir="./models",
            warmup_iterations=10
        )
        assert config.warmup_iterations == 10
        print("CLIPConfig custom iterations set")


class TestWarmupResult:
    """Tests for WarmupResult entity."""

    def test_warmup_result_success(self):
        """Test successful warmup result."""
        result = WarmupResult(
            success=True,
            device="cpu",
            model_name="ViT-B/32",
            warmup_time_ms=100.5
        )
        assert result.success is True
        assert result.device == "cpu"
        assert result.error_message is None
        print("WarmupResult success created")

    def test_warmup_result_failure(self):
        """Test failed warmup result."""
        result = WarmupResult(
            success=False,
            device="cpu",
            model_name="ViT-B/32",
            warmup_time_ms=50.0,
            error_message="Out of memory"
        )
        assert result.success is False
        assert result.error_message == "Out of memory"
        print("WarmupResult failure created")


class TestCLIPConfigLoading:
    """Tests for config loading from env vars."""

    def test_build_warmup_config_from_env(self):
        """Test building config from environment variables."""
        import os

        # Set up environment variables
        os.environ["CLIP_MODEL_NAME"] = "ViT-B/32"
        os.environ["DEVICE"] = "auto"
        os.environ["MODEL_CACHE_DIR"] = "./models"
        os.environ["WARMUP_ITERATIONS"] = "5"
        os.environ["WARMUP_TIMEOUT_SEC"] = "30.0"

        # Build config
        config = _build_warmup_config()

        # Verify
        assert config.model_name == "ViT-B/32"
        assert config.device == "auto"
        assert config.model_cache_dir == "./models"
        assert config.warmup_iterations == 5
        assert config.warmup_timeout_sec == 30.0

        print("✅ Config built from environment")



class TestWarmupServiceStructure:
    """Tests for WarmupService structure (no actual model loading)."""

    def test_warmup_service_creation(self):
        """Test WarmupService initialization."""
        config = CLIPConfig(
            model_name="ViT-B/32",
            device="cpu",
            model_cache_dir="./models"
        )
        service = WarmupService(config)
        assert service.is_ready is False
        assert service.model is None
        print("WarmupService created (not ready)")

    def test_warmup_service_health_check_before_init(self):
        """Test health check before initialization."""
        config = CLIPConfig(
            model_name="ViT-B/32",
            device="cpu",
            model_cache_dir="./models"
        )
        service = WarmupService(config)
        health = service.health_check()
        assert health["is_ready"] is False
        assert health["device"] == "unknown"  # device is None, so health_check returns "unknown"
        print("Health check pre-init shows not ready")


# ============================================================================
# SKIP: Model loading & warm-up (requires actual PyTorch/CUDA environment)
# ============================================================================

class TestCLIPModelLoaderSkipped:
    """Skipped: requires actual model weights"""

    @pytest.mark.skip(reason="Requires model weights download")
    def test_clip_model_loader_load(self):
        """[SKIP] Test actual CLIP model loading."""
        pass


class TestWarmupExecutorSkipped:
    """Skipped: requires actual model loading"""

    @pytest.mark.skip(reason="Requires loaded model")
    def test_warmup_executor_warmup(self):
        """[SKIP] Test actual warm-up execution."""
        pass


class TestWarmupServiceInitSkipped:
    """Skipped: requires actual model loading"""

    @pytest.mark.skip(reason="Requires model download + GPU/CPU time")
    def test_warmup_service_initialize_and_warmup(self):
        """[SKIP] Test full initialization & warm-up."""
        pass


if __name__ == "__main__":
    # Run tests: pytest tests/test_warmup_workflow.py -v
    pytest.main([__file__, "-v"])

