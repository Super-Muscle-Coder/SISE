"""pgvector-index workflow adapters.

Provides low-level PostgreSQL DDL operations for the pgvector-index
workflow: extension checks, column checks, and HNSW index management.
All operations use raw SQL via SQLAlchemy Core to avoid coupling to
the pgvector Python ORM layer (not required for setup tooling).
"""

from typing import Optional

import sqlalchemy as sa
from sqlalchemy import text


def create_pgvector_engine(database_url: str) -> sa.Engine:
    """Create a SQLAlchemy engine for pgvector DDL operations."""
    return sa.create_engine(database_url, pool_pre_ping=True)


def extension_exists(conn: sa.Connection, extension_name: str) -> bool:
    """Return True if the given PostgreSQL extension is installed."""
    result = conn.execute(
        text("SELECT 1 FROM pg_extension WHERE extname = :name"),
        {"name": extension_name},
    )
    return result.scalar() is not None


def column_exists(conn: sa.Connection, table: str, column: str) -> bool:
    """Return True if the column exists in the given table."""
    result = conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    )
    return result.scalar() is not None


def hnsw_index_exists(conn: sa.Connection, index_name: str) -> bool:
    """Return True if an index with the given name exists in pg_indexes."""
    result = conn.execute(
        text("SELECT 1 FROM pg_indexes WHERE indexname = :name"),
        {"name": index_name},
    )
    return result.scalar() is not None


def get_hnsw_index_reloptions(
    conn: sa.Connection, index_name: str
) -> Optional[list]:
    """Return the reloptions list of an index (e.g. ['m=16', 'ef_construction=200']).

    Returns None if the index does not exist or has no reloptions set.
    """
    result = conn.execute(
        text(
            "SELECT reloptions FROM pg_class "
            "WHERE relname = :name AND relkind = 'i'"
        ),
        {"name": index_name},
    )
    row = result.fetchone()
    if row is None:
        return None
    return row[0]  # list[str] or None when no options stored


def create_hnsw_index(
    conn: sa.Connection,
    table: str,
    column: str,
    index_name: str,
    operator_class: str,
    m: int,
    ef_construction: int,
) -> None:
    """Create the HNSW index if it does not already exist (idempotent)."""
    conn.execute(
        text(
            f"CREATE INDEX IF NOT EXISTS {index_name} "
            f"ON {table} USING hnsw ({column} {operator_class}) "
            f"WITH (m = {m}, ef_construction = {ef_construction})"
        )
    )

# Export
__all__ = [
    "create_pgvector_engine",
    "extension_exists",
    "column_exists",
    "hnsw_index_exists",
    "get_hnsw_index_reloptions",
    "create_hnsw_index",
]