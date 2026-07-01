from app.adapters import seed_adapters
from app.entities.bucket_entities import MinioConfig
from app.entities.schema_entities import PostgresConfig
from app.entities.seed_entities import SeedConfig


def seed_storage(
    postgres_config: PostgresConfig,
    minio_config: MinioConfig,
    seed_config: SeedConfig,
) -> None:
    engine = seed_adapters.build_engine(postgres_config)
    tables = seed_adapters.reflect_storage_tables(engine)

    seed_adapters.ensure_seed_buckets(minio_config)

    seed_adapters.upsert_seed_users(engine, tables["users"], seed_config.user_count)
    user_rows = seed_adapters.fetch_users(engine, tables["users"])
    seed_adapters.upsert_seed_albums(
        engine, tables["albums"], user_rows, seed_config.album_count
    )
    album_rows = seed_adapters.fetch_albums(engine, tables["albums"])
    seed_adapters.upsert_seed_images_and_upload(
        engine,
        tables["images"],
        album_rows,
        seed_config.image_count,
        minio_config,
    )
