import logging

from app.entities.bucket_entities import MinioConfig
from app.services import bucket_services

logger = logging.getLogger(__name__)


class BucketWorkflowRouter:
    """Router for the bucket-workflow.
    
    Orchestrates ensure_buckets() which idempotently creates MinIO buckets
    and applies lifecycle rules (per data_schema.yaml).
    """

    def __init__(self, minio_config: MinioConfig) -> None:
        self._minio_config = minio_config

    def setup_buckets(self) -> None:
        """Setup MinIO buckets and lifecycle rules (idempotent).
        
        Raises:
            Exception: If MinIO operations fail (propagated from services).
        """
        try:
            bucket_services.ensure_buckets(self._minio_config)
            logger.info("Bucket workflow completed successfully.")
        except Exception as e:
            logger.error(f"Bucket workflow failed: {e}")
            raise

# Export 
__all__ = [
    "BucketWorkflowRouter",
]