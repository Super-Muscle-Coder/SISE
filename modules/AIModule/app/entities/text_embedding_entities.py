"""
Text Embedding Workflow — Entities Layer

Pure data structures for text embedding requests, results, and configuration.
Prefix: text_embedding_*

No business logic — these are just data containers.
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class TextEmbeddingRequest:
    """
    Request data for text embedding extraction.

    Attributes:
        text: Input text string (UTF-8 encoded)
        normalize_output: Whether to L2-normalize output vector (default: True)
    """
    text: str
    normalize_output: bool = True


@dataclass
class TextEmbeddingResult:
    """
    Result of text embedding extraction.

    Attributes:
        success: Whether embedding was extracted successfully
        vector: List of 512 float32 embedding values (L2-normalized if requested)
        vector_dimension: Always 512 (compatibility marker)
        processing_time_ms: Time taken to process text (milliseconds)
        error_code: Error code if failed (e.g., "ERR_TEXT_TOO_LONG", "ERR_MODEL_NOT_READY")
        error_message: Human-readable error message
    """
    success: bool
    vector: Optional[List[float]] = None
    vector_dimension: int = 512
    processing_time_ms: float = 0.0
    error_code: Optional[str] = None
    error_message: Optional[str] = None


@dataclass
class TextProcessConfig:
    """
    Configuration for text embedding preprocessing.

    Attributes:
        max_tokens: Maximum number of CLIP tokens allowed (default: 77, CLIP limit)
        tokenizer_name: Tokenizer model name (CLIP uses BPE, default: "ViT-B/32" implies CLIP BPE)
        enable_cache: Whether to cache tokenized strings (improves throughput, uses memory)
        truncate_strategy: How to handle over-length text ("truncate" or "error", default: "truncate")
    """
    max_tokens: int = 77  # CLIP ViT-B/32 and ViT-L/14 both support max 77 tokens
    tokenizer_name: str = "clip"
    enable_cache: bool = False
    truncate_strategy: str = "truncate"  # or "error"
