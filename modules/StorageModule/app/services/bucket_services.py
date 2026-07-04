import logging

from app.adapters import bucket_adapters
from app.entities.bucket_entities import MinioConfig

logger = logging.getLogger(__name__)


def ensure_buckets(config: MinioConfig) -> None:
    """Ensure MinIO buckets exist with private access policy and lifecycle rules (idempotent).
    
    Per data_schema.yaml:
    - Creates buckets: raw-images (archive), thumbnails (expire after 365 days).
    - Enforces private storage_policy (no public access via bucket policy).
    - Applies lifecycle rules for retention/archival.
    
    Raises:
        Exception: If MinIO client creation or bucket operations fail.
    """
    try:
        client = bucket_adapters.create_minio_client(
            config.endpoint,
            config.access_key,
            config.secret_key,
            config.secure,
        )
        logger.info(
            f"MinIO client created: endpoint={config.endpoint}, "
            f"secure={config.secure}."
        )
    except Exception as e:
        logger.error(f"Failed to create MinIO client: {e}")
        raise

    # Step 1: Ensure buckets exist and enforce private access policy
    try:
        for bucket in config.buckets:
            if not bucket_adapters.bucket_exists(client, bucket):
                bucket_adapters.make_bucket(client, bucket)
                logger.info(f"Bucket '{bucket}' created.")
            else:
                logger.info(f"Bucket '{bucket}' already exists.")

            # Enforce private storage policy: delete any public bucket policy.
            # (MinIO allows anonymous access if bucket policy is set to public;
            # removing it enforces IAM-only access.)
            bucket_adapters.delete_bucket_policy(client, bucket)
            logger.info(f"Private access enforced for bucket '{bucket}' "
                       f"(bucket policy deleted).")
    except Exception as e:
        logger.error(f"Bucket creation/policy enforcement failed: {e}")
        raise

    # Step 2: Apply lifecycle rules (expire, archive)
    try:
        for rule in config.lifecycle_rules:
            bucket_adapters.apply_lifecycle_rule(client, rule)
    except Exception as e:
        logger.error(f"Lifecycle rule application failed: {e}")
        raise

    logger.info("Bucket workflow completed successfully.")


# Export
__all__ = [
    "ensure_buckets",
]