"""
Warmup Workflow — Services Layer

Orchestrates model loading and warm-up lifecycle.
Prefix: warmup_*
"""

from typing import Optional

from app.entities import CLIPConfig, WarmupResult
from app.adapters import CLIPModelLoader, WarmupExecutor


class WarmupService:
    """
    High-level service for CLIP model initialization and warm-up.

    Manages:
      1. Model loading from OpenAI weights
      2. Device placement (GPU/CPU)
      3. Tokenizer loading (required by text_embedding workflow)
      4. Warm-up forward passes
      5. State persistence
    """

    def __init__(self, config: CLIPConfig):
        self.config = config
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self.device = None
        self.warmup_result = None
        self.is_ready = False

    def initialize_and_warmup(self) -> WarmupResult:
        """
        Complete initialization pipeline:
        1. Load CLIP model, preprocess transform, and tokenizer
        2. Validate structure
        3. Execute warm-up

        Returns:
            WarmupResult with final status
        """
        print("\n" + "=" * 70)
        print("CLIP Model Initialization & Warm-up Pipeline")
        print("=" * 70)

        try:
            # Step 1: Load model (+ tokenizer)
            print("\n[1/3] Loading CLIP model...")
            loader = CLIPModelLoader(self.config)
            self.model, self.preprocess, self.tokenizer, self.device = loader.load()

            # Step 2: Validate
            print("\n[2/3] Validating model structure...")
            if not loader.validate_model(self.model):
                raise RuntimeError("Model validation failed")
            print("  Model structure valid")

            # Step 3: Warm-up
            print("\n[3/3] Running warm-up forward passes...")
            executor = WarmupExecutor(self.model, self.preprocess, self.device, self.config)
            self.warmup_result = executor.warmup()

            if not self.warmup_result.success:
                raise RuntimeError(f"Warm-up failed: {self.warmup_result.error_message}")

            self.is_ready = True

            print("\n" + "=" * 70)
            print(f"INITIALIZATION COMPLETE")
            print(f"   Device: {self.device}")
            print(f"   Model: {self.config.model_name}")
            print(f"   Warm-up Time: {self.warmup_result.warmup_time_ms:.1f}ms")
            print(f"   Vector Dimension: {self.warmup_result.vector_dimension}")
            print("=" * 70 + "\n")

            return self.warmup_result

        except Exception as e:
            print("\n" + "=" * 70)
            print(f"INITIALIZATION FAILED: {e}")
            print("=" * 70 + "\n")

            self.is_ready = False
            return WarmupResult(
                success=False,
                device="unknown",
                model_name=self.config.model_name,
                warmup_time_ms=0.0,
                error_message=str(e),
                vector_dimension=self.config.vector_dim,
            )

    def get_model(self):
        """Returns loaded CLIP model. Raise error if not ready."""
        if not self.is_ready:
            raise RuntimeError("Model not loaded. Call initialize_and_warmup() first.")
        return self.model

    def get_preprocess(self):
        """Returns preprocessing function. Raise error if not ready."""
        if not self.is_ready:
            raise RuntimeError("Model not loaded. Call initialize_and_warmup() first.")
        return self.preprocess

    def get_tokenizer(self):
        """Returns CLIP text tokenizer. Raise error if not ready."""
        if not self.is_ready:
            raise RuntimeError("Model not loaded. Call initialize_and_warmup() first.")
        return self.tokenizer

    def get_device(self):
        """Returns device string (cuda/cpu)."""
        if not self.is_ready:
            raise RuntimeError("Model not loaded. Call initialize_and_warmup() first.")
        return self.device

    def get_vector_dim(self) -> int:
        """
        Returns configured vector dimension (data_schema.yaml -> global_configs.vector_dim).

        Unlike get_model()/get_preprocess()/get_tokenizer()/get_device(), this
        getter does NOT raise if warm-up hasn't completed: vector_dim is a
        static configuration value (self.config.vector_dim) known since
        construction, not a runtime artifact produced by
        initialize_and_warmup(). This is required so that GET /health/readiness
        can include the X-Expected-Vector-Dim header in BOTH the 200 and 503
        responses (openapi.yaml contract), even when the model failed to load.
        """
        return self.config.vector_dim

    def health_check(self) -> dict:
        """Returns health status of warmup service."""
        return {
            "is_ready": self.is_ready,
            "device": self.device if self.device else "unknown",
            "model_name": self.config.model_name,
            "warmup_time_ms": self.warmup_result.warmup_time_ms if self.warmup_result else None
        }

# Export 
__all__ = ["WarmupService"]