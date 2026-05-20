"""
Warmup Workflow — Adapters Layer

Handles CLIP model loading and device management.
Prefix: warmup_*
"""

import os
import time
from typing import Optional

import torch
import open_clip

from app.entities import CLIPConfig, WarmupResult


class DeviceManager:
    """Manages CLIP model device placement (GPU/CPU auto-detection)."""

    @staticmethod
    def get_device(device_arg: str) -> str:
        """
        Determine compute device for model.

        Args:
            device_arg: 'cuda', 'cpu', or 'auto'

        Returns:
            Actual device string: 'cuda' or 'cpu'
        """
        if device_arg == "auto":
            return "cuda" if torch.cuda.is_available() else "cpu"
        elif device_arg == "cuda":
            if not torch.cuda.is_available():
                print("CUDA not available, falling back to CPU")
                return "cpu"
            return "cuda"
        else:
            return "cpu"


class CLIPModelLoader:
    """Loads CLIP model from OpenAI/HuggingFace weights."""

    def __init__(self, config: CLIPConfig):
        self.config = config
        self.device = DeviceManager.get_device(config.device)
        self.model = None
        self.preprocess = None

    def load(self) -> tuple:
        """
        Load CLIP model and preprocessing function.

        Returns:
            (model, preprocess, device)

        Raises:
            RuntimeError: If model loading fails
        """
        try:
            # Set cache directory
            os.environ["HF_HOME"] = self.config.model_cache_dir

            # Load model using open_clip
            print(f"Loading CLIP model '{self.config.model_name}' on {self.device}...")
            model, _, preprocess = open_clip.create_model_and_transforms(
                self.config.model_name,
                device=self.device,
                pretrained="openai"
            )

            print(f"Model loaded successfully")
            return model, preprocess, self.device

        except Exception as e:
            raise RuntimeError(f"Failed to load CLIP model: {e}")

    def validate_model(self, model) -> bool:
        """
        Validate loaded model structure.

        Args:
            model: Loaded CLIP model

        Returns:
            True if model is valid
        """
        try:
            # Check if model has required methods
            assert hasattr(model, "encode_image"), "Model missing encode_image"
            assert hasattr(model, "encode_text"), "Model missing encode_text"
            return True
        except AssertionError as e:
            print(f"Model validation failed: {e}")
            return False


class WarmupExecutor:
    """Executes model warm-up to eliminate cold-start latency."""

    def __init__(self, model, preprocess, device: str, config: CLIPConfig):
        self.model = model
        self.preprocess = preprocess
        self.device = device
        self.config = config

    def warmup(self) -> WarmupResult:
        """
        Run warm-up forward passes to trigger CUDA/CPU caching.

        Returns:
            WarmupResult with timing and status
        """
        start_time = time.time()

        try:
            self.model.eval()

            with torch.no_grad():
                # Create dummy image tensor (1, 3, 224, 224)
                dummy_image = torch.randn(1, 3, 224, 224).to(self.device)

                # Create dummy text tokens (CLIP text encoder expects tokenized input)
                # For simplicity, use a dummy tensor
                dummy_text = torch.zeros(1, 77, dtype=torch.int64).to(self.device)

                # Run warm-up iterations
                for i in range(self.config.warmup_iterations):
                    _ = self.model.encode_image(dummy_image)
                    _ = self.model.encode_text(dummy_text)

                    if i == 0:
                        print(f"  Iteration 1/{self.config.warmup_iterations}...")

            elapsed_ms = (time.time() - start_time) * 1000

            print(f"  Warm-up completed in {elapsed_ms:.1f}ms")

            return WarmupResult(
                success=True,
                device=self.device,
                model_name=self.config.model_name,
                warmup_time_ms=elapsed_ms,
                vector_dimension=512
            )

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            print(f"  Warm-up failed: {e}")

            return WarmupResult(
                success=False,
                device=self.device,
                model_name=self.config.model_name,
                warmup_time_ms=elapsed_ms,
                error_message=str(e),
                vector_dimension=512
            )


__all__ = ["DeviceManager", "CLIPModelLoader", "WarmupExecutor"]
