from app.entities.schema_entities import PostgresConfig, SchemaConfig
from app.services import schema_services


class SchemaWorkflowRouter:
    def __init__(self, postgres_config: PostgresConfig, schema_config: SchemaConfig) -> None:
        self._postgres_config = postgres_config
        self._schema_config = schema_config

    def upgrade_schema(self) -> None:
        schema_services.run_schema_migrations(self._postgres_config, self._schema_config)

    def downgrade_schema(self) -> None:
        schema_services.downgrade_schema(self._postgres_config, self._schema_config)

# Export
__all__=[
    "SchemaWorkflowRouter",
]