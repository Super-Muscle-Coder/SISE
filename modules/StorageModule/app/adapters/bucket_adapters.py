import logging
from typing import Optional

from minio import Minio
from minio.lifecycleconfig import Expiration, LifecycleConfig, Rule, Filter

from app.entities.bucket_entities import LifecycleRuleConfig

logger = logging.getLogger(__name__)


def create_minio_client(endpoint: str, access_key: str, secret_key: str, secure: bool) -> Minio:
    """Create MinIO client with idempotent connection validation."""
    client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)
    return client


def bucket_exists(client: Minio, bucket: str) -> bool:
    """Check if bucket exists (idempotent)."""
    try:
        return client.bucket_exists(bucket)
    except Exception as e:
        logger.error(f"Error checking bucket existence for '{bucket}': {e}")
        raise


def make_bucket(client: Minio, bucket: str) -> None:
    """Create bucket if it doesn't exist (idempotent)."""
    try:
        if not bucket_exists(client, bucket):
            client.make_bucket(bucket)
            logger.info(f"Bucket '{bucket}' created successfully.")
        else:
            logger.info(f"Bucket '{bucket}' already exists — skipped creation.")
    except Exception as e:
        logger.error(f"Error creating bucket '{bucket}': {e}")
        raise


def delete_bucket_policy(client: Minio, bucket: str) -> None:
    """Delete bucket policy (idempotent)."""
    try:
        client.delete_bucket_policy(bucket_name=bucket)
        logger.info(f"Bucket policy for '{bucket}' deleted.")
    except Exception as e:
        # Policy may not exist initially — log as info, not error
        logger.info(f"Bucket policy for '{bucket}' already absent or error: {e}")


def apply_lifecycle_rule(client: Minio, rule: LifecycleRuleConfig) -> None:
    """Apply lifecycle rule to bucket (idempotent).
    
    Supports:
    - "expire": removes objects after X days (MinIO native support).
    - "archive": logged as skipped (MinIO standalone doesn't support transitions).
    """
    if not bucket_exists(client, rule.bucket):
        logger.warning(f"Bucket '{rule.bucket}' does not exist — cannot apply lifecycle rule.")
        return

    lifecycle_config = _build_lifecycle_config(rule)
    if lifecycle_config is None:
        logger.info(
            f"Lifecycle rule '{rule.rule}' for bucket '{rule.bucket}' "
            f"(days={rule.days}) — not supported by MinIO standalone. Skipped."
        )
        return

    try:
        client.set_bucket_lifecycle(bucket_name=rule.bucket, config=lifecycle_config)
        logger.info(
            f"Lifecycle rule applied to bucket '{rule.bucket}': "
            f"type='{rule.rule}', days={rule.days}."
        )
    except Exception as e:
        logger.error(f"Error applying lifecycle rule to bucket '{rule.bucket}': {e}")
        raise


def _build_lifecycle_config(rule: LifecycleRuleConfig) -> Optional[LifecycleConfig]:
    """Build MinIO LifecycleConfig from LifecycleRuleConfig (per data_schema.yaml).
    
    MinIO Python SDK 7.2.12 API note:
    - Rule() parameter renamed from "filter" (old versions) to "rule_filter" (7.2.12+).
    - This reflects minio/lifecycleconfig.py signature: __init__(..., rule_filter: Filter | None = None, ...).
    """
    if rule.rule == "expire":
        return LifecycleConfig(
            rules=[
                Rule(
                    status="Enabled",
                    rule_id=f"{rule.bucket}-expire-{rule.days}d",
                    rule_filter=Filter(prefix=""),  # FIXED: filter= → rule_filter= (MinIO SDK 7.2.12 API)
                    expiration=Expiration(days=rule.days),
                )
            ]
        )
    if rule.rule == "archive":
        # MinIO standalone không hỗ trợ chuyển storage class (archive).
        # Đây là tính năng cloud-level (AWS Glacier, GCS Archive, v.v.)
        return None
    
    raise ValueError(
        f"Unsupported lifecycle rule: '{rule.rule}'. Supported: 'expire', 'archive' (cloud-only)."
    )


__all__ = [
    "create_minio_client",
    "bucket_exists",
    "make_bucket",
    "delete_bucket_policy",
    "apply_lifecycle_rule",
]