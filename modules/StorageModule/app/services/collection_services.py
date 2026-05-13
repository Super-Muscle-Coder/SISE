from typing import Dict

from app.adapters import collection_adapters
from app.entities.collection_entities import MilvusConfig


class CollectionValidationError(ValueError):
    pass


def ensure_collection(config: MilvusConfig) -> None:
    collection_adapters.connect_to_milvus(config.host, config.port)

    if not collection_adapters.collection_exists(config.collection_name):
        fields = collection_adapters.build_collection_fields(config.vector_dim)
        collection = collection_adapters.create_collection(
            config.collection_name,
            fields,
        )
        collection_adapters.create_hnsw_index(
            collection,
            field_name="vector",
            index_params=config.index_params,
            metric_type=config.metric_type,
        )
        collection_adapters.load_collection(collection)
        return

    collection = collection_adapters.get_collection(config.collection_name)
    _validate_collection_schema(collection, config.vector_dim)
    _validate_index(collection, config.index_params, config.metric_type)
    collection_adapters.load_collection(collection)


def _validate_collection_schema(collection, vector_dim: int) -> None:
    schema_fields = {field.name: field for field in collection.schema.fields}
    expected_fields = {"image_id", "vector", "user_id", "privacy_level"}
    if set(schema_fields.keys()) != expected_fields:
        raise CollectionValidationError(
            f"Unexpected fields: {set(schema_fields.keys())}."
        )

    vector_field = schema_fields["vector"]
    if getattr(vector_field, "dim", None) != vector_dim:
        raise CollectionValidationError(
            f"Vector dim mismatch. Expected {vector_dim}."
        )

    if not schema_fields["image_id"].is_primary:
        raise CollectionValidationError("image_id must be primary key.")


def _validate_index(collection, index_params: Dict[str, int], metric_type: str) -> None:
    indexes = collection_adapters.get_indexes(collection)
    if not indexes:
        collection_adapters.create_hnsw_index(
            collection,
            field_name="vector",
            index_params=index_params,
            metric_type=metric_type,
        )
        return

    index = indexes[0]
    if index.field_name != "vector":
        raise CollectionValidationError("HNSW index must target vector field.")

    params = index.params or {}
    index_type = params.get("index_type")
    existing_metric = params.get("metric_type")
    existing_params = params.get("params") or {}

    if index_type != "HNSW":
        raise CollectionValidationError("Index type mismatch; expected HNSW.")
    if existing_metric != metric_type:
        raise CollectionValidationError("Metric type mismatch for HNSW index.")

    for key, expected_value in index_params.items():
        if existing_params.get(key) != expected_value:
            raise CollectionValidationError(
                f"Index param mismatch for {key}. Expected {expected_value}."
            )
