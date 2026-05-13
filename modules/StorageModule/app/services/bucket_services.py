from minio.commonconfig import Filter
from minio.lifecycleconfig import Expiration, LifecycleConfig, Rule, Transition

from app.adapters import bucket_adapters
from app.entities.bucket_entities import LifecycleRuleConfig, MinioConfig


def ensure_buckets(config: MinioConfig) -> None:
    client = bucket_adapters.create_minio_client(
        config.endpoint,
        config.access_key,
        config.secret_key,
        config.secure,
    )

    for bucket in config.buckets:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        _apply_private_policy(client, bucket)

    for rule in config.lifecycle_rules:
        _apply_lifecycle_rule(client, rule)


def _apply_private_policy(client, bucket: str) -> None:
    client.set_bucket_policy(bucket, "")


def _apply_lifecycle_rule(client, rule: LifecycleRuleConfig) -> None:
    lifecycle_config = _build_lifecycle_config(rule)
    client.set_bucket_lifecycle(bucket_name=rule.bucket, config=lifecycle_config)


def _build_lifecycle_config(rule: LifecycleRuleConfig) -> LifecycleConfig:
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
        return LifecycleConfig(
            rules=[
                Rule(
                    rule_id=f"{rule.bucket}-archive",
                    status="Enabled",
                    filter=Filter(prefix=""),
                    transition=Transition(days=rule.days, storage_class="GLACIER"),
                )
            ]
        )

    raise ValueError(f"Unsupported lifecycle rule: {rule.rule}.")
