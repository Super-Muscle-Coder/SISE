from app.entities.pgvector_index_entities import PgvectorIndexConfig
from app.services import pgvector_index_services


class PgvectorIndexWorkflowRouter:
    """Router for the pgvector-index workflow.

    Orchestrates ensure_pgvector_index() which validates and (if needed)
    creates the HNSW index on images.embedding in PostgreSQL.
    """

    def __init__(self, pgvector_config: PgvectorIndexConfig) -> None:
        self._pgvector_config = pgvector_config

    def setup_pgvector_index(self) -> None:
        pgvector_index_services.ensure_pgvector_index(self._pgvector_config)