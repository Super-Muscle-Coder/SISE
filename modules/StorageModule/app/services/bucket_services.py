from app.adapters import bucket_adapters
from app.entities.bucket_entities import MinioConfig


def ensure_buckets(config: MinioConfig) -> None:
    client = bucket_adapters.create_minio_client(
        config.endpoint,
        config.access_key,
        config.secret_key,
        config.secure,
    )

    for bucket in config.buckets:
        if not bucket_adapters.bucket_exists(client, bucket):
            bucket_adapters.make_bucket(client, bucket)
        bucket_adapters.delete_bucket_policy(client, bucket)

    for rule in config.lifecycle_rules:
        bucket_adapters.apply_lifecycle_rule(client, rule)
