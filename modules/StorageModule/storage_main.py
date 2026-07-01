import argparse
import os
from typing import List
from urllib.parse import urlparse

from app.entities.bucket_entities import LifecycleRuleConfig, MinioConfig
from app.entities.collection_entities import MilvusConfig
from app.entities.schema_entities import PostgresConfig, SchemaConfig
from app.entities.seed_entities import SeedConfig
from app.routers.bucket_routers import BucketWorkflowRouter
from app.routers.collection_routers import CollectionWorkflowRouter
from app.routers.schema_routers import SchemaWorkflowRouter
from app.routers.seed_routers import SeedWorkflowRouter


def _parse_minio_endpoint(endpoint: str) -> tuple[str, bool]:
    parsed = urlparse(endpoint)
    if parsed.scheme in {"http", "https"}:
        return parsed.netloc, parsed.scheme == "https"
    return endpoint, False


def _get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}.")
    return value


def _get_int_env(name: str) -> int:
    value = _get_required_env(name)
    return int(value)


def _build_lifecycle_rules(
    thumbnails_bucket: str,
    raw_bucket: str,
    thumbnails_rule: str,
    thumbnails_days: int,
    raw_rule: str,
    raw_days: int,
) -> List[LifecycleRuleConfig]:
    return [
        LifecycleRuleConfig(
            bucket=thumbnails_bucket,
            rule=thumbnails_rule,
            days=thumbnails_days,
        ),
        LifecycleRuleConfig(
            bucket=raw_bucket,
            rule=raw_rule,
            days=raw_days,
        ),
    ]


def _build_configs() -> tuple[PostgresConfig, SchemaConfig, MilvusConfig, MinioConfig]:
    database_url = _get_required_env("DATABASE_URL")
    minio_endpoint = _get_required_env("MINIO_ENDPOINT")
    minio_access_key = _get_required_env("MINIO_ACCESS_KEY")
    minio_secret_key = _get_required_env("MINIO_SECRET_KEY")
    milvus_host = _get_required_env("MILVUS_HOST")
    milvus_port = _get_int_env("MILVUS_PORT")

    extensions_raw = _get_required_env("SCHEMA_EXTENSIONS")
    extensions = [value.strip() for value in extensions_raw.split(",") if value.strip()]
    schema_config = SchemaConfig(
        migration_tool=_get_required_env("SCHEMA_MIGRATION_TOOL"),
        target_revision=_get_required_env("SCHEMA_TARGET_REVISION"),
        downgrade_revision=_get_required_env("SCHEMA_DOWNGRADE_REVISION"),
        extensions=extensions,
    )

    collection_config = MilvusConfig(
        host=milvus_host,
        port=milvus_port,
        collection_name=_get_required_env("COLLECTION_NAME"),
        vector_dim=_get_int_env("COLLECTION_VECTOR_DIM"),
        index_type=_get_required_env("COLLECTION_INDEX_TYPE"),
        index_params={
            "M": _get_int_env("COLLECTION_INDEX_M"),
            "efConstruction": _get_int_env("COLLECTION_INDEX_EF_CONSTRUCTION"),
        },
        metric_type=_get_required_env("COLLECTION_METRIC_TYPE"),
        search_params={"ef": _get_int_env("COLLECTION_SEARCH_EF")},
    )

    raw_bucket = _get_required_env("BUCKET_RAW_IMAGES")
    thumbnails_bucket = _get_required_env("BUCKET_THUMBNAILS")
    endpoint, secure = _parse_minio_endpoint(minio_endpoint)
    lifecycle_rules = _build_lifecycle_rules(
        thumbnails_bucket=thumbnails_bucket,
        raw_bucket=raw_bucket,
        thumbnails_rule=_get_required_env("BUCKET_THUMBNAILS_RULE"),
        thumbnails_days=_get_int_env("BUCKET_THUMBNAILS_DAYS"),
        raw_rule=_get_required_env("BUCKET_RAW_IMAGES_RULE"),
        raw_days=_get_int_env("BUCKET_RAW_IMAGES_DAYS"),
    )

    bucket_config = MinioConfig(
        endpoint=endpoint,
        access_key=minio_access_key,
        secret_key=minio_secret_key,
        secure=secure,
        buckets=[raw_bucket, thumbnails_bucket],
        lifecycle_rules=lifecycle_rules,
    )

    return (
        PostgresConfig(database_url=database_url),
        schema_config,
        collection_config,
        bucket_config,
    )


def _build_seed_config() -> SeedConfig:
    return SeedConfig(
        user_count=_get_int_env("SEED_USER_COUNT"),
        album_count=_get_int_env("SEED_ALBUM_COUNT"),
        image_count=_get_int_env("SEED_IMAGE_COUNT"),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Storage module setup utility")
    parser.add_argument(
        "command",
        choices=["schema", "collection", "bucket", "seed", "init", "all"],
        help="Which storage setup workflow to run. 'init' runs schema+collection+bucket (no seed).",
    )
    args = parser.parse_args()

    postgres_config, schema_config, collection_config, bucket_config = _build_configs()

    if args.command in {"schema", "init", "all"}:
        schema_router = SchemaWorkflowRouter(postgres_config, schema_config)
        schema_router.upgrade_schema()

    if args.command in {"collection", "init", "all"}:
        collection_router = CollectionWorkflowRouter(collection_config)
        collection_router.setup_collection()

    if args.command in {"bucket", "init", "all"}:
        bucket_router = BucketWorkflowRouter(bucket_config)
        bucket_router.setup_buckets()

    if args.command in {"seed", "all"}:
        # 'init' intentionally excluded — seed must not run in production
        seed_router = SeedWorkflowRouter(postgres_config, bucket_config)
        seed_router.run_seed(_build_seed_config())


if __name__ == "__main__":
    main()
