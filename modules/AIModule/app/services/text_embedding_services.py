"""
Text Embedding Workflow — Services Layer

Text embedding orchestration logic.
Prefix: text_embedding_*

Coordinates text validation → tokenization → CLIP text encoder → normalization.
"""

import time
from typing import Optional
import torch
import numpy as np

from app.entities import (
    TextEmbeddingRequest,
    TextEmbeddingResult,
    TextProcessConfig,
)
from app.adapters import (
    TextValidator,
    TextTokenizer,
    VectorNormalizer,
)
from .warmup_services import WarmupService


class TextEmbeddingService:
    """
    Text embedding extraction orchestration.

    Coordinates:
      1. Text validation (UTF-8, length, content)
      2. Tokenization & truncation
      3. CLIP text encoder inference
      4. Vector normalization (L2)
      5. Structured error handling
    """

    def __init__(
        self,
        warmup_service: WarmupService,
        text_config: TextProcessConfig,
    ):
        """
        Initialize TextEmbeddingService.

        Args:
            warmup_service: Ready WarmupService with loaded CLIP model
            text_config: TextProcessConfig with tokenization parameters
        """
        self.warmup_service = warmup_service
        self.text_config = text_config

    def extract_text_embedding(
        self,
        text: str,
    ) -> TextEmbeddingResult:
        """
        Extract embedding vector from text input.

        Args:
            text: Input text string (UTF-8 encoded)

        Returns:
            TextEmbeddingResult with vector (or error details)
        """
        start_time = time.time()

        try:
            # ================================================================
            # 1. Check Model Ready
            # ================================================================
            if not self.warmup_service.is_ready:
                return TextEmbeddingResult(
                    success=False,
                    error_code="ERR_MODEL_NOT_READY",
                    error_message="CLIP model is not loaded or warm-up incomplete",
                    processing_time_ms=0.0,
                )

            # ================================================================
            # 2. Validate Text Input
            # ================================================================
            is_valid, error_msg = TextValidator.validate_text_input(
                text,
                max_chars=4096,
                max_tokens=self.text_config.max_tokens,
            )
            if not is_valid:
                elapsed_ms = (time.time() - start_time) * 1000
                return TextEmbeddingResult(
                    success=False,
                    error_code=error_msg or "ERR_INVALID_TEXT",
                    error_message=error_msg or "Text validation failed",
                    processing_time_ms=elapsed_ms,
                )

            # ================================================================
            # 3. Sanitize Text
            # ================================================================
            text = TextValidator.sanitize_text(text)

            # ================================================================
            # 4. Tokenization & Truncation
            # ================================================================
            try:
                truncated_text, was_truncated = TextTokenizer.truncate_text_to_tokens(
                    text,
                    max_tokens=self.text_config.max_tokens,
                    strategy=self.text_config.truncate_strategy,
                )
                if was_truncated:
                    # Log warning: text was truncated
                    # (In production, could emit metric or structured log)
                    pass
            except ValueError as ve:
                elapsed_ms = (time.time() - start_time) * 1000
                return TextEmbeddingResult(
                    success=False,
                    error_code="ERR_TEXT_TOO_LONG",
                    error_message=f"Text exceeds token limit: {str(ve)}",
                    processing_time_ms=elapsed_ms,
                )

            # ================================================================
            # 5. CLIP Text Encoder
            # ================================================================
            try:
                # Use the WarmupService getters (consistent with
                # image_embedding_services.py / batch_embedding_services.py)
                # instead of reaching into .model / .tokenizer attributes directly.
                model = self.warmup_service.get_model()
                tokenizer = self.warmup_service.get_tokenizer()

                if model is None or tokenizer is None:
                    return TextEmbeddingResult(
                        success=False,
                        error_code="ERR_MODEL_STATE_INVALID",
                        error_message="Model or tokenizer is None",
                        processing_time_ms=(time.time() - start_time) * 1000,
                    )

                # Tokenize text via open_clip tokenizer
                with torch.no_grad():
                    text_tokens = tokenizer([truncated_text])
                    text_embedding = model.encode_text(text_tokens)

                # Convert to numpy (detach from GPU if needed)
                vector_np = text_embedding.cpu().numpy().squeeze()

            except Exception as e:
                elapsed_ms = (time.time() - start_time) * 1000
                return TextEmbeddingResult(
                    success=False,
                    error_code="ERR_ENCODING_FAILED",
                    error_message=f"Text encoder failed: {str(e)}",
                    processing_time_ms=elapsed_ms,
                )

            # ================================================================
            # 6. Validate Vector Dimension (data_schema.yaml -> global_configs.vector_dim)
            # ================================================================
            if len(vector_np.shape) > 1 or vector_np.shape[0] != self.text_config.vector_dim:
                elapsed_ms = (time.time() - start_time) * 1000
                return TextEmbeddingResult(
                    success=False,
                    error_code="ERR_VECTOR_DIM_MISMATCH",
                    error_message=f"Expected {self.text_config.vector_dim}-dim vector, got {vector_np.shape}",
                    processing_time_ms=elapsed_ms,
                )

            # ================================================================
            # 7. L2 Normalization
            #
            # NOTE (bug fixed): VectorNormalizer.normalize_vector() — the
            # canonical implementation shared via app/adapters/__init__.py
            # (defined in image_embedding_adapters.py) — returns a TUPLE
            # (normalized_vector, is_valid). The previous code here treated
            # the return value as a bare ndarray and called `.tolist()` on
            # the tuple directly, which raises AttributeError on every
            # single request. Fixed by unpacking the tuple, matching the
            # exact pattern already used correctly in
            # image_embedding_services.py and batch_embedding_services.py.
            # ================================================================
            try:
                vector_normalized, is_normalized = VectorNormalizer.normalize_vector(vector_np)
                if not is_normalized:
                    elapsed_ms = (time.time() - start_time) * 1000
                    return TextEmbeddingResult(
                        success=False,
                        error_code="ERR_NORMALIZATION_FAILED",
                        error_message="Vector normalization failed",
                        processing_time_ms=elapsed_ms,
                    )
                vector_list = vector_normalized.tolist()
            except Exception as e:
                elapsed_ms = (time.time() - start_time) * 1000
                return TextEmbeddingResult(
                    success=False,
                    error_code="ERR_NORMALIZATION_FAILED",
                    error_message=f"Vector normalization failed: {str(e)}",
                    processing_time_ms=elapsed_ms,
                )

            # ================================================================
            # 8. Success Response
            # ================================================================
            elapsed_ms = (time.time() - start_time) * 1000
            return TextEmbeddingResult(
                success=True,
                vector=vector_list,
                vector_dimension=self.text_config.vector_dim,
                processing_time_ms=elapsed_ms,
                error_code=None,
                error_message=None,
            )

        except Exception as e:
            # Catch-all for unexpected errors
            elapsed_ms = (time.time() - start_time) * 1000
            return TextEmbeddingResult(
                success=False,
                error_code="ERR_INTERNAL",
                error_message=f"Unexpected error: {str(e)}",
                processing_time_ms=elapsed_ms,
            )

# Export 
__all__ = ["TextEmbeddingService"]