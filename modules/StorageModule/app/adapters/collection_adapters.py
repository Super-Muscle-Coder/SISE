from typing import List

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    connections,
    utility,
)


def connect_to_milvus(host: str, port: int, alias: str = "default") -> None:
    connections.connect(alias=alias, host=host, port=port)


def collection_exists(collection_name: str) -> bool:
    return utility.has_collection(collection_name)


def build_collection_fields(vector_dim: int) -> List[FieldSchema]:
    return [
        FieldSchema(
            name="image_id",
            dtype=DataType.VARCHAR,
            is_primary=True,
            max_length=36,
        ),
        FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=vector_dim),
        FieldSchema(name="user_id", dtype=DataType.INT64),
        FieldSchema(name="privacy_level", dtype=DataType.INT32),
    ]


def create_collection(collection_name: str, fields: List[FieldSchema]) -> Collection:
    schema = CollectionSchema(fields, description="SISE image vectors")
    return Collection(name=collection_name, schema=schema)


def get_collection(collection_name: str) -> Collection:
    return Collection(collection_name)


def create_hnsw_index(
    collection: Collection,
    field_name: str,
    index_params: dict,
    metric_type: str,
) -> None:
    collection.create_index(
        field_name=field_name,
        index_params={
            "index_type": "HNSW",
            "params": index_params,
            "metric_type": metric_type,
        },
    )


def get_indexes(collection: Collection):
    return collection.indexes


def load_collection(collection: Collection) -> None:
    collection.load()


__all__ = [
    "connect_to_milvus",
    "collection_exists",
    "build_collection_fields",
    "create_collection",
    "get_collection",
    "create_hnsw_index",
    "get_indexes",
    "load_collection",
]
