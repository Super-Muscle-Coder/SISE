import os
from pathlib import Path

from app.adapters import schema_adapters
from app.entities.schema_entities import PostgresConfig, SchemaConfig


def run_schema_migrations(postgres_config: PostgresConfig, schema_config: SchemaConfig) -> None:
    if schema_config.migration_tool != "alembic":
        raise ValueError("Unsupported migration tool for schema workflow.")

    script_location = _resolve_migration_path()
    alembic_config = schema_adapters.build_alembic_config(
        script_location=script_location,
        database_url=postgres_config.database_url,
    )
    schema_adapters.run_upgrade(alembic_config, schema_config.target_revision)


def downgrade_schema(postgres_config: PostgresConfig, schema_config: SchemaConfig) -> None:
    if schema_config.migration_tool != "alembic":
        raise ValueError("Unsupported migration tool for schema workflow.")

    script_location = _resolve_migration_path()
    alembic_config = schema_adapters.build_alembic_config(
        script_location=script_location,
        database_url=postgres_config.database_url,
    )
    schema_adapters.run_downgrade(alembic_config, schema_config.downgrade_revision)


def _resolve_migration_path() -> str:
    module_root = Path(__file__).resolve().parents[2]
    return os.fspath(module_root / "migrations")

# Export
__all__=[
    "run_schema_migrations",
    "downgrade_schema",
]