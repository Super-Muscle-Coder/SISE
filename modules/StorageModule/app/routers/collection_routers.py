from app.entities.collection_entities import MilvusConfig
from app.services import collection_services


class CollectionWorkflowRouter:
    def __init__(self, milvus_config: MilvusConfig) -> None:
        self._milvus_config = milvus_config

    def setup_collection(self) -> None:
        collection_services.ensure_collection(self._milvus_config)
