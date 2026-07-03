from app.entities.collection_entities import PgvectorIndexConfig
from app.services import collection_services


class PgvectorIndexWorkflowRouter:
    """Router for the pgvector-index workflow.

    Orchestrates ensure_pgvector_index() which validates and (if needed)
    creates the HNSW index on images.embedding in PostgreSQL.
    """

    def __init__(self, pgvector_config: PgvectorIndexConfig) -> None:
        self._pgvector_config = pgvector_config

    def setup_pgvector_index(self) -> None:
        collection_services.ensure_pgvector_index(self._pgvector_config)