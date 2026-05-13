import os
from urllib.parse import urlparse

from app.entities.bucket_entities import LifecycleRuleConfig, MinioConfig
from app.entities.schema_entities import PostgresConfig
from app.entities.seed_entities import SeedConfig
from app.services.seed_services import seed_storage


def _get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}.")
    return value


def _parse_minio_endpoint(endpoint: str) -> tuple[str, bool]:
    parsed = urlparse(endpoint)
    if parsed.scheme in {"http", "https"}:
        return parsed.netloc, parsed.scheme == "https"
    return endpoint, False


def _build_minio_config() -> MinioConfig:
    endpoint = _get_required_env("MINIO_ENDPOINT")
    access_key = _get_required_env("MINIO_ACCESS_KEY")
    secret_key = _get_required_env("MINIO_SECRET_KEY")
    raw_bucket = _get_required_env("BUCKET_RAW_IMAGES")
    thumbnails_bucket = _get_required_env("BUCKET_THUMBNAILS")

    endpoint, secure = _parse_minio_endpoint(endpoint)

    lifecycle_rules = [
        LifecycleRuleConfig(
            bucket=thumbnails_bucket,
            rule=_get_required_env("BUCKET_THUMBNAILS_RULE"),
            days=int(_get_required_env("BUCKET_THUMBNAILS_DAYS")),
        ),
        LifecycleRuleConfig(
            bucket=raw_bucket,
            rule=_get_required_env("BUCKET_RAW_IMAGES_RULE"),
            days=int(_get_required_env("BUCKET_RAW_IMAGES_DAYS")),
        ),
    ]

    return MinioConfig(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure,
        buckets=[raw_bucket, thumbnails_bucket],
        lifecycle_rules=lifecycle_rules,
    )


def main() -> None:
    database_url = _get_required_env("DATABASE_URL")
    seed_user_count = int(_get_required_env("SEED_USER_COUNT"))
    seed_album_count = int(_get_required_env("SEED_ALBUM_COUNT"))
    seed_image_count = int(_get_required_env("SEED_IMAGE_COUNT"))

    seed_storage(
        PostgresConfig(database_url=database_url),
        _build_minio_config(),
        SeedConfig(
            user_count=seed_user_count,
            album_count=seed_album_count,
            image_count=seed_image_count,
        ),
    )


if __name__ == "__main__":
    main()
