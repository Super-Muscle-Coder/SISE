from app.entities.bucket_entities import MinioConfig
from app.services import bucket_services


class BucketWorkflowRouter:
    def __init__(self, minio_config: MinioConfig) -> None:
        self._minio_config = minio_config

    def setup_buckets(self) -> None:
        bucket_services.ensure_buckets(self._minio_config)
