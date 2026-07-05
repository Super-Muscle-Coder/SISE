"""
Batch Embedding Service

Workflow orchestration for batch embedding extraction.
Coordinates validation, preprocessing, CLIP encoding, and normalization.

Ownership: AG-01 (AIModuleAgent)
"""

import time
from typing import List, Tuple
import torch
import numpy as np

from ..entities.batch_embedding_entities import BatchEmbeddingConfig, BatchEmbeddingResult
from .image_embedding_services import ImageEmbeddingService
from ..adapters.image_embedding_adapters import VectorNormalizer
from ..adapters.batch_embedding_adapters import BatchValidator, BatchPreprocessor
from .warmup_services import WarmupService


class BatchEmbeddingService:
    """
    Batch embedding extraction service.

    Orchestrates validation, preprocessing, CLIP encoding, and normalization
    for multiple images in a single request.
    """

    # Error codes (matching data_schema.yaml)
    ERR_MODEL_NOT_READY = "ERR_MODEL_NOT_READY"
    ERR_BATCH_EMPTY = "ERR_BATCH_EMPTY"
    ERR_BATCH_TOO_LARGE = "ERR_BATCH_TOO_LARGE"
    ERR_PREPROCESSING_FAILED = "ERR_PREPROCESSING_FAILED"
    ERR_VECTOR_DIM_MISMATCH = "ERR_VECTOR_DIM_MISMATCH"

    def __init__(
        self,
        warmup_service: WarmupService,
        image_embedding_service: ImageEmbeddingService,
        config: BatchEmbeddingConfig | None = None,
    ):
        """
        Initialize batch embedding service.

        Args:
            warmup_service: Reference to warmup service (for model availability checks)
            image_embedding_service: Reference to image embedding service (reserved for
                future per-image delegation; not currently invoked directly — see
                notes_to_ag00 regarding the removed _get_model() dead code path)
            config: BatchEmbeddingConfig with batch size limits and timeouts
        """
        self.warmup_service = warmup_service
        self.image_embedding_service = image_embedding_service
        self.config = config or BatchEmbeddingConfig()
        self.normalizer = VectorNormalizer()

    def extract_batch_embeddings(
        self,
        file_bytes_list: List[bytes],
        filenames_list: List[str],
        content_types_list: List[str],
    ) -> Tuple[BatchEmbeddingResult, str | None]:
        """
        Extract embeddings for a batch of images.

        Args:
            file_bytes_list: List of image file binary contents
            filenames_list: List of filenames
            content_types_list: List of MIME types (one per file)

        Returns:
            Tuple of (BatchEmbeddingResult, error_code)
            - BatchEmbeddingResult: Contains vectors list, counts, and timing
            - error_code: None if successful, error string if critical failure

        Error Codes:
            - ERR_MODEL_NOT_READY: Warmup service not ready
            - ERR_BATCH_EMPTY: No files provided
            - ERR_BATCH_TOO_LARGE: Batch exceeds max_batch_size
            - ERR_PREPROCESSING_FAILED: Too many images failed preprocessing
            - ERR_VECTOR_DIM_MISMATCH: Output vector dimension mismatch (code bug)
        """
        start_time = time.time()
        result = BatchEmbeddingResult()

        # Check model readiness
        if not self.warmup_service.is_ready:
            return result, self.ERR_MODEL_NOT_READY

        # Validate batch size
        try:
            BatchValidator.validate_file_list(file_bytes_list, filenames_list, content_types_list)
            BatchValidator.validate_batch_size(len(file_bytes_list), self.config.max_batch_size)
        except ValueError as e:
            error_msg = str(e)
            if "ERR_EMPTY" in error_msg:
                return result, self.ERR_BATCH_EMPTY
            elif "ERR_BATCH_TOO_LARGE" in error_msg:
                return result, self.ERR_BATCH_TOO_LARGE
            else:
                return result, self.ERR_PREPROCESSING_FAILED

        # Preprocess batch
        preprocessed_tensors, preprocess_errors = BatchPreprocessor.preprocess_batch(
            file_bytes_list,
            filenames_list,
            content_types_list,
            target_size=224,
        )

        # Count preprocessing failures
        failed_preprocessing = sum(1 for e in preprocess_errors if e != "")
        if failed_preprocessing > 0:
            # Log but continue if some passed
            pass

        # Extract embeddings for successful preprocessed images
        vectors = []
        successful_count = 0
        failed_count = 0

        for i, (tensor, error) in enumerate(zip(preprocessed_tensors, preprocess_errors)):
            if error:  # Preprocessing failed for this image
                failed_count += 1
                continue

            if tensor is None:
                failed_count += 1
                continue

            try:
                # Use CLIP model directly for batch (avoid per-image service overhead)
                with torch.no_grad():
                    # tensor shape: (1, 3, 224, 224)
                    model = self.warmup_service.get_model()
                    device = self.warmup_service.get_device()
                    tensor = tensor.to(device)
                    image_features = model.encode_image(tensor)
                    # image_features shape: (1, vector_dim)

                # Normalize to L2 norm = 1.0 (for COSINE similarity)
                vector_np = image_features.cpu().numpy().astype(np.float32).flatten()
                vector_normalized, is_normalized = self.normalizer.normalize_vector(vector_np)
                if not is_normalized:
                    failed_count += 1
                    continue

                # Validate output dimension (data_schema.yaml -> global_configs.vector_dim)
                if len(vector_normalized) != self.config.vector_dim:
                    return result, self.ERR_VECTOR_DIM_MISMATCH

                vectors.append(vector_normalized.tolist())
                successful_count += 1
            except Exception:
                # Log and continue
                failed_count += 1

        result.vectors = vectors
        result.successful_count = successful_count
        result.failed_count = failed_count + failed_preprocessing
        result.processing_time_ms = (time.time() - start_time) * 1000

        return result, None

# Export
__all__ = ["BatchEmbeddingService"]