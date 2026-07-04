from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class LifecycleRuleConfig:
    """Lifecycle rule configuration per data_schema.yaml.
    
    Attributes:
        bucket: Target bucket name (raw-images, thumbnails).
        rule: Rule type ("expire" or "archive").
        days: Days before action triggered.
    """
    bucket: str
    rule: str
    days: int


@dataclass(frozen=True)
class MinioConfig:
    """MinIO bucket configuration (per data_schema.yaml).
    
    Attributes:
        endpoint: MinIO API endpoint (e.g., http://minio:9000).
        access_key: Root user access key.
        secret_key: Root user secret key.
        secure: Use HTTPS (False for localhost, True for production).
        buckets: List of bucket names to create (raw-images, thumbnails).
        lifecycle_rules: List of lifecycle rules to apply.
    """
    endpoint: str
    access_key: str
    secret_key: str
    secure: bool
    buckets: List[str]
    lifecycle_rules: List[LifecycleRuleConfig]

# Export 
__all__ = [
    "LifecycleRuleConfig",
    "MinioConfig",
]