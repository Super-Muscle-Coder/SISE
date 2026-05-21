"""
Text Embedding Workflow — Adapters Layer

Low-level utilities for text validation, tokenization, and vector normalization.
Prefix: text_embedding_*

Infrastructure-only; no business logic.
"""

import re
from typing import List, Optional, Tuple
import numpy as np
import torch

from app.entities import TextEmbeddingRequest, TextProcessConfig


class TextValidator:
    """Validate text input before processing."""

    @staticmethod
    def validate_text_input(
        text: str,
        max_chars: int = 4096,
        max_tokens: int = 77,
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate text input for embedding.

        Args:
            text: Input text string
            max_chars: Maximum character count (safety limit)
            max_tokens: Maximum token count (CLIP limit = 77)

        Returns:
            Tuple[valid: bool, error_message: Optional[str]]
        """
        # Check if text is empty or None
        if not text or not isinstance(text, str):
            return False, "ERR_EMPTY_TEXT"

        # Check character count
        if len(text) > max_chars:
            return False, f"ERR_TEXT_TOO_LONG: Exceeds {max_chars} characters"

        # Check for valid UTF-8 encoding
        try:
            text.encode('utf-8')
        except UnicodeEncodeError:
            return False, "ERR_INVALID_UTF8"

        # Basic sanity check (all whitespace is invalid)
        if text.strip() == "":
            return False, "ERR_EMPTY_TEXT: Text contains only whitespace"

        return True, None

    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Basic text sanitization (strip whitespace, normalize line breaks).

        Args:
            text: Input text

        Returns:
            Sanitized text
        """
        # Remove leading/trailing whitespace
        text = text.strip()

        # Normalize line breaks to spaces
        text = re.sub(r'\s+', ' ', text)

        return text


class TextTokenizer:
    """
    CLIP text tokenizer wrapper.

    Note: open_clip uses internal CLIP tokenizer (BPE). This adapter
    provides a utility layer for token counting and truncation.
    """

    # Approximate token counts (open_clip uses BPE with ~50k vocab)
    # This is a rough heuristic: avg ~0.75 tokens per word
    APPROX_TOKENS_PER_WORD = 0.75

    @staticmethod
    def estimate_token_count(text: str) -> int:
        """
        Estimate token count for CLIP text input (rough heuristic).

        The actual tokenizer is in open_clip, but we can estimate
        for validation purposes.

        Args:
            text: Input text

        Returns:
            Estimated token count
        """
        words = text.split()
        estimated = int(len(words) * TextTokenizer.APPROX_TOKENS_PER_WORD)
        # Add buffer for punctuation and special tokens
        return estimated + 5

    @staticmethod
    def truncate_text_to_tokens(
        text: str,
        max_tokens: int = 77,
        strategy: str = "truncate"
    ) -> Tuple[str, bool]:
        """
        Truncate text to fit within token limit.

        Args:
            text: Input text
            max_tokens: Maximum token limit
            strategy: "truncate" (silent) or "error" (raise)

        Returns:
            Tuple[truncated_text: str, was_truncated: bool]
        """
        est_tokens = TextTokenizer.estimate_token_count(text)

        if est_tokens <= max_tokens:
            return text, False

        if strategy == "error":
            raise ValueError(f"Text exceeds {max_tokens} tokens (estimated: {est_tokens})")

        # strategy == "truncate": binary search for fitting length
        words = text.split()
        low, high = 1, len(words)

        while low < high:
            mid = (low + high + 1) // 2
            truncated = " ".join(words[:mid])
            if TextTokenizer.estimate_token_count(truncated) <= max_tokens:
                low = mid
            else:
                high = mid - 1

        truncated = " ".join(words[:low])
        return truncated, True


class VectorNormalizer:
    """
    L2 normalization for embedding vectors.
    (Shared with image_embedding for consistency)
    """

    @staticmethod
    def normalize_vector(vector: np.ndarray) -> np.ndarray:
        """
        L2-normalize a vector to unit magnitude.

        Args:
            vector: NumPy array (any shape)

        Returns:
            Normalized vector with magnitude ~1.0
        """
        norm = np.linalg.norm(vector, ord=2)
        if norm < 1e-8:
            # Zero vector: return as-is to avoid division by zero
            return vector
        return vector / norm
