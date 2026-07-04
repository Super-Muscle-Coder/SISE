import io
import uuid
from typing import Any, List

from sqlalchemy import MetaData, Table, select
from sqlalchemy.dialects.postgresql import insert

from app.adapters.bucket_adapters import bucket_exists, create_minio_client, make_bucket
from app.adapters.schema_adapters import create_postgres_engine
from app.entities.bucket_entities import MinioConfig
from app.entities.schema_entities import PostgresConfig


def build_engine(postgres_config: PostgresConfig):
    return create_postgres_engine(postgres_config.database_url)


def reflect_storage_tables(engine) -> dict:
    metadata = MetaData()
    metadata.reflect(bind=engine, only=["users", "albums", "images"])
    return dict(metadata.tables)


def ensure_seed_buckets(minio_config: MinioConfig) -> None:
    client = create_minio_client(
        minio_config.endpoint,
        minio_config.access_key,
        minio_config.secret_key,
        minio_config.secure,
    )
    for bucket in minio_config.buckets:
        if not bucket_exists(client, bucket):
            make_bucket(client, bucket)


def upsert_seed_users(engine, users_table: Table, user_count: int) -> None:
    with engine.begin() as conn:
        for i in range(1, user_count + 1):
            stmt = (
                insert(users_table)
                .values(
                    username=f"seed_user_{i}",
                    email=f"seed_user_{i}@example.com",
                    password_hash="seed_password_hash",
                )
                .on_conflict_do_nothing(index_elements=["username"])
            )
            conn.execute(stmt)


def fetch_users(engine, users_table: Table) -> List[Any]:
    with engine.connect() as conn:
        return conn.execute(select(users_table.c.id, users_table.c.username)).fetchall()


def upsert_seed_albums(
    engine, albums_table: Table, user_rows: List[Any], album_count: int
) -> None:
    if not user_rows:
        return
    with engine.begin() as conn:
        existing_titles = {
            row[0] for row in conn.execute(select(albums_table.c.title)).fetchall()
        }
        for i in range(1, album_count + 1):
            title = f"Seed Album {i:02d}"
            if title in existing_titles:
                continue
            user_id = user_rows[(i - 1) % len(user_rows)].id
            conn.execute(
                insert(albums_table).values(
                    user_id=user_id,
                    title=title,
                    description="Seed album for testing",
                    is_public=True,
                )
            )


def fetch_albums(engine, albums_table: Table) -> List[Any]:
    with engine.connect() as conn:
        return conn.execute(
            select(albums_table.c.id, albums_table.c.user_id, albums_table.c.title)
        ).fetchall()


def upsert_seed_images_and_upload(
    engine,
    images_table: Table,
    album_rows: List[Any],
    image_count: int,
    minio_config: MinioConfig,
) -> None:
    if not album_rows:
        return
    client = create_minio_client(
        minio_config.endpoint,
        minio_config.access_key,
        minio_config.secret_key,
        minio_config.secure,
    )
    bucket_name = minio_config.buckets[0]
    with engine.begin() as conn:
        for i in range(1, image_count + 1):
            album = album_rows[(i - 1) % len(album_rows)]
            image_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"seed-image-{i}")
            object_name = f"{album.user_id}/{album.id}/{image_id}.jpg"
            conn.execute(
                insert(images_table)
                .values(
                    id=str(image_id),
                    user_id=album.user_id,
                    album_id=album.id,
                    minio_object_name=object_name,
                    minio_bucket=bucket_name,
                    privacy_level=2,
                    tags=["seed", "sample"],
                    index_status="ready",
                )
                .on_conflict_do_nothing(index_elements=["minio_object_name"])
            )
            data = io.BytesIO(b"seed-image")
            client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=data,
                length=len(data.getvalue()),
                content_type="image/jpeg",
            )

# Export
__all__ = [
    "build_engine",
    "reflect_storage_tables",
    "ensure_seed_buckets",
    "upsert_seed_users",
    "fetch_users",
    "upsert_seed_albums",
    "fetch_albums",
    "upsert_seed_images_and_upload",
]
