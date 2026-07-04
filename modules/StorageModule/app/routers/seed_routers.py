from app.entities.bucket_entities import MinioConfig
from app.entities.schema_entities import PostgresConfig
from app.entities.seed_entities import SeedConfig
from app.services import seed_services


class SeedWorkflowRouter:
    def __init__(self, postgres_config: PostgresConfig, minio_config: MinioConfig) -> None:
        self._postgres_config = postgres_config
        self._minio_config = minio_config

    def run_seed(self, seed_config: SeedConfig) -> None:
        seed_services.seed_storage(self._postgres_config, self._minio_config, seed_config)

# Export
__all__=[
    "SeedWorkflowRouter",
]