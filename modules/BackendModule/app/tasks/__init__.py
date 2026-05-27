"""
Tasks Layer: Celery async tasks for upload workflow.
Exported for use in services and main application.
"""

from .upload_celery_tasks import (
    process_image_embedding_and_index,
)

__all__ = [
    "process_image_embedding_and_index",
]
