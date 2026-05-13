import io
import uuid
from typing import List

from sqlalchemy import MetaData, Table, select
from sqlalchemy.dialects.postgresql import insert

from app.adapters import seed_adapters
from app.entities.bucket_entities import MinioConfig
from app.entities.schema_entities import PostgresConfig
from app.entities.seed_entities import SeedConfig


def seed_storage(
    postgres_config: PostgresConfig,
    minio_config: MinioConfig,
    seed_config: SeedConfig,
) -> None:
    engine = seed_adapters.create_postgres_engine(postgres_config.database_url)
    metadata = MetaData()
    metadata.reflect(bind=engine, only=["users", "albums", "images"])

    users = metadata.tables["users"]
    albums = metadata.tables["albums"]
    images = metadata.tables["images"]

    client = seed_adapters.create_minio_client(
        minio_config.endpoint,
        minio_config.access_key,
        minio_config.secret_key,
        minio_config.secure,
    )

    _ensure_minio_buckets(client, minio_config.buckets)

    with engine.begin() as connection:
        _seed_users(connection, users, seed_config.user_count)
        user_rows = connection.execute(select(users.c.id, users.c.username)).fetchall()
        _seed_albums(connection, albums, user_rows, seed_config.album_count)

        album_rows = connection.execute(
            select(albums.c.id, albums.c.user_id, albums.c.title)
        ).fetchall()

        _seed_images(
            connection,
            images,
            album_rows,
            seed_config.image_count,
            client,
            minio_config.buckets[0],
        )


def _ensure_minio_buckets(client, buckets: List[str]) -> None:
    for bucket in buckets:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)


def _seed_users(connection, users: Table, user_count: int) -> None:
    for index in range(1, user_count + 1):
        username = f"seed_user_{index}"
        email = f"seed_user_{index}@example.com"
        stmt = insert(users).values(
            username=username,
            email=email,
            password_hash="seed_password_hash",
        )
        stmt = stmt.on_conflict_do_nothing(index_elements=["username"])
        connection.execute(stmt)


def _seed_albums(connection, albums: Table, users, album_count: int) -> None:
    if not users:
        return

    existing_titles = {
        row[0]
        for row in connection.execute(select(albums.c.title)).fetchall()
    }

    for index in range(1, album_count + 1):
        title = f"Seed Album {index:02d}"
        if title in existing_titles:
            continue
        user_id = users[(index - 1) % len(users)].id
        stmt = insert(albums).values(
            user_id=user_id,
            title=title,
            description="Seed album for testing",
            is_public=True,
        )
        connection.execute(stmt)


def _seed_images(
    connection,
    images: Table,
    albums,
    image_count: int,
    minio_client,
    bucket_name: str,
) -> None:
    if not albums:
        return

    for index in range(1, image_count + 1):
        album = albums[(index - 1) % len(albums)]
        image_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"seed-image-{index}")
        object_name = f"{album.user_id}/{album.id}/{image_id}.jpg"
        stmt = insert(images).values(
            id=str(image_id),
            user_id=album.user_id,
            album_id=album.id,
            minio_object_name=object_name,
            minio_bucket=bucket_name,
            privacy_level=2,
            tags=["seed", "sample"],
            index_status="ready",
        )
        stmt = stmt.on_conflict_do_nothing(index_elements=["minio_object_name"])
        connection.execute(stmt)

        data = io.BytesIO(b"seed-image")
        data_length = len(data.getvalue())
        minio_client.put_object(
            bucket_name=bucket_name,
            object_name=object_name,
            data=data,
            length=data_length,
            content_type="image/jpeg",
        )
