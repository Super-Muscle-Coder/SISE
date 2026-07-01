from typing import Optional

from minio import Minio
from minio.commonconfig import Filter
from minio.lifecycleconfig import Expiration, LifecycleConfig, Rule

from app.entities.bucket_entities import LifecycleRuleConfig


def create_minio_client(endpoint: str, access_key: str, secret_key: str, secure: bool) -> Minio:
    return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)


def bucket_exists(client: Minio, bucket: str) -> bool:
    return client.bucket_exists(bucket)


def make_bucket(client: Minio, bucket: str) -> None:
    client.make_bucket(bucket)


def delete_bucket_policy(client: Minio, bucket: str) -> None:
    client.delete_bucket_policy(bucket_name=bucket)


def apply_lifecycle_rule(client: Minio, rule: LifecycleRuleConfig) -> None:
    lifecycle_config = _build_lifecycle_config(rule)
    if lifecycle_config is None:
        return
    client.set_bucket_lifecycle(bucket_name=rule.bucket, config=lifecycle_config)


def _build_lifecycle_config(rule: LifecycleRuleConfig) -> Optional[LifecycleConfig]:
    if rule.rule == "expire":
        return LifecycleConfig(
            rules=[
                Rule(
                    rule_id=f"{rule.bucket}-expire",
                    status="Enabled",
                    filter=Filter(prefix=""),
                    expiration=Expiration(days=rule.days),
                )
            ]
        )
    if rule.rule == "archive":
        # MinIO standalone: storage class transitions not supported.
        # Silently skip — handled at cloud deployment level.
        return None
    raise ValueError(f"Unsupported lifecycle rule: {rule.rule}.")


__all__ = [
    "create_minio_client",
    "bucket_exists",
    "make_bucket",
    "delete_bucket_policy",
    "apply_lifecycle_rule",
]
