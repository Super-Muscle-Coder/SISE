"""
Batch Embedding Adapters

Low-level utilities for batch validation, validation, and preprocessing.
All work is delegation to image adapters; batch adapter only orchestrates them.

Ownership: AG-01 (AIModuleAgent)
"""

from typing import List, Tuple

from app.entities import ImagePreprocessConfig
from .image_embedding_adapters import ImageValidator, ImagePreprocessor


class BatchValidator:
    """Validation utilities for batch embedding requests."""

    @staticmethod
    def validate_batch_size(num_files: int, max_batch_size: int = 32) -> None:
        """
        Validate that the batch size is within limits.

        Args:
            num_files: Number of files in the batch
            max_batch_size: Maximum allowed batch size

        Raises:
            ValueError: If batch size exceeds maximum
        """
        if num_files == 0:
            raise ValueError("ERR_EMPTY_BATCH: Batch must contain at least 1 image")
        if num_files > max_batch_size:
            raise ValueError(
                f"ERR_BATCH_TOO_LARGE: Batch size {num_files} exceeds maximum {max_batch_size}"
            )

    @staticmethod
    def validate_file_list(
        file_bytes_list: List[bytes],
        filenames_list: List[str],
        content_types_list: List[str],
    ) -> None:
        """
        Validate that file lists match in length and are non-empty.

        Args:
            file_bytes_list: List of file binary contents
            filenames_list: List of filenames

        Raises:
            ValueError: If lists don't match or are empty
        """
        if len(file_bytes_list) != len(filenames_list):
            raise ValueError("ERR_FILE_LIST_MISMATCH: File count and filename count don't match")
        if len(file_bytes_list) != len(content_types_list):
            raise ValueError("ERR_CONTENT_TYPE_MISMATCH: File count and content type count don't match")
        if len(file_bytes_list) == 0:
            raise ValueError("ERR_EMPTY_FILE_LIST: No files provided")


class BatchPreprocessor:
    """Preprocessing utilities for batch image processing."""

    @staticmethod
    def preprocess_batch(
        file_bytes_list: List[bytes],
        filenames_list: List[str],
        content_types_list: List[str],
        target_size: int = 224,
    ) -> Tuple[List[object], List[str]]:
        """
        Preprocess a batch of images in parallel (or sequential for simplicity).

        Args:
            file_bytes_list: List of image file bytes
            filenames_list: List of filenames
            target_size: Target size for image (default 224)

        Returns:
            Tuple of (preprocessed_tensors, error_messages)
            - preprocessed_tensors: List of torch.Tensor with shape (1, 3, target_size, target_size)
            - error_messages: List of error strings for failed images (empty string if successful)

        Note:
            This is a best-effort processor. It returns partial results even if some images fail.
        """
        preprocessed = []
        errors = []

        preprocess_config = ImagePreprocessConfig(target_size=target_size)
        preprocessor = ImagePreprocessor(preprocess_config)

        for i, (file_bytes, filename, content_type) in enumerate(
            zip(file_bytes_list, filenames_list, content_types_list)
        ):
            try:
                # Validate individual image
                is_valid, error_msg = ImageValidator.validate_image_input(file_bytes, content_type)
                if not is_valid:
                    raise ValueError(error_msg)

                # Preprocess individual image
                tensor, preprocess_error = preprocessor.preprocess(file_bytes)
                if tensor is None:
                    raise ValueError(preprocess_error or "ERR_PREPROCESSING_FAILED")

                preprocessed.append(tensor)
                errors.append("")  # No error for this image
            except ValueError as e:
                preprocessed.append(None)  # Placeholder
                errors.append(f"Image {i} ({filename}): {str(e)}")
            except Exception as e:
                preprocessed.append(None)  # Placeholder
                errors.append(f"Image {i} ({filename}): Unexpected error: {str(e)}")

        return preprocessed, errors
