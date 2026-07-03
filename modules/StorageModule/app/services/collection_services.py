"""pgvector-index workflow service layer.

Implements ensure_pgvector_index(): the idempotent setup operation that
validates (and repairs if necessary) the HNSW index on images.embedding.

Dependency order:
  1. vector extension must exist (owned by schema migration).
  2. images.embedding column must exist (owned by schema migration).
  3. idx_images_embedding_hnsw HNSW index — created here if absent,
     validated here if present.
"""

import sqlalchemy as sa

from app.adapters import collection_adapters
from app.entities.collection_entities import PgvectorIndexConfig


class PgvectorIndexValidationError(ValueError):
    """Raised when the existing HNSW index parameters do not match the contract."""


def ensure_pgvector_index(config: PgvectorIndexConfig) -> None:
    """Ensure the HNSW index on images.embedding exists and matches config.

    Steps:
      1. Verify the `vector` extension is installed (schema migration concern).
      2. Verify images.embedding column exists (schema migration concern).
      3. If HNSW index absent: create it.
      4. If HNSW index present: validate m and ef_construction parameters.

    Raises:
        PgvectorIndexValidationError: If extension/column is missing (migration
            not applied) or if existing index params mismatch the contract.
    """
    engine = collection_adapters.create_pgvector_engine(config.database_url)
    with engine.connect() as conn:
        _assert_extension(conn)
        _assert_embedding_column(conn)
        _ensure_hnsw_index(conn, config)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _assert_extension(conn: sa.Connection) -> None:
    if not collection_adapters.extension_exists(conn, "vector"):
        raise PgvectorIndexValidationError(
            "pgvector extension 'vector' is not installed. "
            "Run 'alembic upgrade head' to apply schema migrations first."
        )


def _assert_embedding_column(conn: sa.Connection) -> None:
    if not collection_adapters.column_exists(conn, "images", "embedding"):
        raise PgvectorIndexValidationError(
            "Column 'images.embedding' not found. "
            "Run 'alembic upgrade head' to apply schema migrations first."
        )


def _ensure_hnsw_index(conn: sa.Connection, config: PgvectorIndexConfig) -> None:
    if not collection_adapters.hnsw_index_exists(conn, config.index_name):
        collection_adapters.create_hnsw_index(
            conn,
            table="images",
            column="embedding",
            index_name=config.index_name,
            operator_class=config.operator_class,
            m=config.index_params["m"],
            ef_construction=config.index_params["ef_construction"],
        )
        conn.commit()
        return

    _validate_hnsw_params(conn, config)


def _validate_hnsw_params(
    conn: sa.Connection, config: PgvectorIndexConfig
) -> None:
    """Validate existing HNSW index parameters against the contract.

    Parses reloptions (e.g. ['m=16', 'ef_construction=200']) and compares
    to config.index_params. No-op if reloptions is None (PostgreSQL stores
    defaults implicitly for some index types).
    """
    reloptions = collection_adapters.get_hnsw_index_reloptions(
        conn, config.index_name
    )
    if not reloptions:
        return

    option_dict: dict[str, int] = {}
    for opt in reloptions:
        key, _, value = opt.partition("=")
        option_dict[key.strip()] = int(value.strip())

    expected_m = config.index_params["m"]
    expected_ef = config.index_params["ef_construction"]
    actual_m = option_dict.get("m")
    actual_ef = option_dict.get("ef_construction")

    if actual_m is not None and actual_m != expected_m:
        raise PgvectorIndexValidationError(
            f"HNSW index param mismatch: m={actual_m}, expected {expected_m}. "
            "Use REINDEX INDEX CONCURRENTLY to rebuild with correct parameters."
        )
    if actual_ef is not None and actual_ef != expected_ef:
        raise PgvectorIndexValidationError(
            f"HNSW index param mismatch: ef_construction={actual_ef}, "
            f"expected {expected_ef}. "
            "Use REINDEX INDEX CONCURRENTLY to rebuild with correct parameters."
        )