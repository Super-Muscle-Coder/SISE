from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class PostgresConfig:
    database_url: str


@dataclass(frozen=True)
class SchemaConfig:
    migration_tool: str
    target_revision: str
    downgrade_revision: str
    extensions: List[str]

# Export
__all__ = [
    "PostgresConfig",
    "SchemaConfig",
]