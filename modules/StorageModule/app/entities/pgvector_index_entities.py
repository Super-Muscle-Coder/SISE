from dataclasses import dataclass, field
from typing import Dict


@dataclass(frozen=True)
class PgvectorIndexConfig:
    """Configuration for the pgvector-index workflow.

    Replaces MilvusConfig (v1.0.0). Vector store now lives inside
    PostgreSQL via the `vector` extension (pgvector >= 0.7.0).

    Attributes:
        database_url:    PostgreSQL connection string (same as schema workflow).
        vector_dim:      Embedding dimension. Must equal global_configs.vector_dim.
        index_name:      HNSW index name, e.g. idx_images_embedding_hnsw.
        index_params:    HNSW build params: {"m": 16, "ef_construction": 200}.
        operator_class:  pgvector operator class, e.g. vector_cosine_ops.
        search_ef:       Runtime hnsw.ef_search value (passed via SET LOCAL).
    """

    database_url: str
    vector_dim: int
    index_name: str
    index_params: Dict[str, int]
    operator_class: str
    search_ef: int

# Export
__all__=[
    "PgvectorIndexConfig", 
]