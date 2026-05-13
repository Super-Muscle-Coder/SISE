from dataclasses import dataclass
from typing import Dict


@dataclass(frozen=True)
class MilvusConfig:
    host: str
    port: int
    collection_name: str
    vector_dim: int
    index_params: Dict[str, int]
    metric_type: str
    search_params: Dict[str, int]
