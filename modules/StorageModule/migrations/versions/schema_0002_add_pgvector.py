"""add pgvector extension, embedding column, and HNSW index

Revision ID: 0002_add_pgvector
Revises: 0001_create_storage_schema
Create Date: 2026-07-03 00:00:00.000000

Changes (data_schema.yaml v1.1.0):
  - Enable PostgreSQL extension `vector` (pgvector >= 0.7.0)
  - Add nullable column images.embedding vector(512)
    (nullable until Celery worker completes S4_Async_Index)
  - Create HNSW index idx_images_embedding_hnsw with
    m=16, ef_construction=200, vector_cosine_ops (<=> operator)
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0002_add_pgvector"
down_revision = "0001_create_storage_schema"
branch_labels = None
depends_on = None

_INDEX_NAME = "idx_images_embedding_hnsw"
_VECTOR_DIM = 512          # Must equal global_configs.vector_dim in data_schema.yaml
_HNSW_M = 16
_HNSW_EF_CONSTRUCTION = 200
_OPERATOR_CLASS = "vector_cosine_ops"


def upgrade() -> None:
    # 1. Enable pgvector extension (idempotent)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Add embedding column (nullable; populated by Celery S4_Async_Index)
    op.execute(
        f"ALTER TABLE images "
        f"ADD COLUMN IF NOT EXISTS embedding vector({_VECTOR_DIM})"
    )

    # 3. Create HNSW index (idempotent via IF NOT EXISTS)
    #    Uses CREATE INDEX (not CONCURRENTLY) because this runs at migration time
    #    on an empty or small dataset. For production reindex use CONCURRENTLY.
    op.execute(
        f"CREATE INDEX IF NOT EXISTS {_INDEX_NAME} "
        f"ON images USING hnsw (embedding {_OPERATOR_CLASS}) "
        f"WITH (m = {_HNSW_M}, ef_construction = {_HNSW_EF_CONSTRUCTION})"
    )


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {_INDEX_NAME}")
    op.execute("ALTER TABLE images DROP COLUMN IF EXISTS embedding")
    op.execute("DROP EXTENSION IF EXISTS vector")