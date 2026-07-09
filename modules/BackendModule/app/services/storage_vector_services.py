"""
Storage Vector services.
"""

from __future__ import annotations

import json
from time import perf_counter
from typing import Any

from ..adapters.storage_vector_adapters import StorageVectorAdapter
from ..entities.storage_vector_entities import (
    FilterExpression,
    IndexVectorResponse,
    SearchHybridRequest,
    SearchResponse,
    SearchResultItem,
)
from ..entities.upload_entities import ImageMetadata, PrivacyLevel


class VectorDimensionMismatchError(ValueError):
    pass


class StorageVectorService:
    def __init__(self, adapter: StorageVectorAdapter, expected_vector_dim: int):
        self.adapter = adapter
        self.expected_vector_dim = expected_vector_dim
        self._param_counter = 0

    def _new_param_name(self) -> str:
        self._param_counter += 1
        return f"p_{self._param_counter}"

    def _validate_vector_dim(self, vector: list[float]) -> None:
        if len(vector) != self.expected_vector_dim:
            raise VectorDimensionMismatchError(
                f"Vector length {len(vector)} does not match expected dim {self.expected_vector_dim}"
            )

    async def index_vector(self, image_id: str, vector: list[float]) -> IndexVectorResponse:
        self._validate_vector_dim(vector)
        await self.adapter.index_vector(image_id=image_id, vector=vector)
        return IndexVectorResponse(status="completed", job_id=None)

    async def search_hybrid(self, req: SearchHybridRequest) -> SearchResponse:
        self._validate_vector_dim(req.vector)

        where_clause = ""
        where_params: dict[str, Any] = {}
        if req.filter is not None:
            self._param_counter = 0
            where_clause, where_params = self.compile_filter_to_sql(req.filter)

        start = perf_counter()
        rows = await self.adapter.search_hybrid(
            vector=req.vector,
            top_k=req.top_k,
            where_clause=where_clause,
            where_params=where_params,
        )
        latency_ms = (perf_counter() - start) * 1000.0

        items: list[SearchResultItem] = []
        for row in rows:
            minio_url = f"minio://{row['minio_bucket']}/{row['minio_object_name']}"
            metadata = ImageMetadata(
                image_id=row["image_id"],
                user_id=row["user_id"],
                album_id=row["album_id"],
                minio_url=minio_url,
                privacy_level=PrivacyLevel(row["privacy_level"]),
                tags=row["tags"],
                created_at=row["created_at"],
                index_status=row["index_status"],
            )
            score = 1.0 - float(row["distance"])
            items.append(
                SearchResultItem(
                    image_id=row["image_id"],
                    score=score,
                    minio_url=minio_url,
                    metadata=metadata,
                )
            )

        return SearchResponse(results=items, latency_ms=latency_ms, top_k=req.top_k)

    def compile_filter_to_sql(self, filter_expr: FilterExpression) -> tuple[str, dict[str, Any]]:
        allowed_fields = {
            "privacy_level": "privacy_level",
            "user_id": "user_id",
            "tags": "tags",
        }

        if filter_expr.and_ is not None:
            clauses: list[str] = []
            params: dict[str, Any] = {}
            for child in filter_expr.and_:
                c_sql, c_params = self.compile_filter_to_sql(child)
                clauses.append(f"({c_sql})")
                params.update(c_params)
            return " AND ".join(clauses), params

        if filter_expr.or_ is not None:
            clauses = []
            params: dict[str, Any] = {}
            for child in filter_expr.or_:
                c_sql, c_params = self.compile_filter_to_sql(child)
                clauses.append(f"({c_sql})")
                params.update(c_params)
            return " OR ".join(clauses), params

        # leaf
        assert filter_expr.field is not None
        assert filter_expr.op is not None
        value = filter_expr.value

        if filter_expr.field not in allowed_fields:
            raise ValueError(f"Unsupported filter field: {filter_expr.field}")

        column = allowed_fields[filter_expr.field]
        op = filter_expr.op

        if op == "contains":
            if column != "tags":
                raise ValueError("Operator 'contains' is only supported for tags")
            pname = self._new_param_name()
            if isinstance(value, list):
                payload = value
            else:
                payload = [value]
            return f"{column} @> CAST(:{pname} AS jsonb)", {pname: json.dumps(payload)}

        if op in {"eq", "gt", "lt"}:
            if isinstance(value, list):
                raise ValueError(f"Operator '{op}' expects scalar value")
            pname = self._new_param_name()
            sql_op = {"eq": "=", "gt": ">", "lt": "<"}[op]
            return f"{column} {sql_op} :{pname}", {pname: value}

        if op == "in":
            if not isinstance(value, list) or len(value) == 0:
                raise ValueError("Operator 'in' expects non-empty list value")
            placeholders: list[str] = []
            params: dict[str, Any] = {}
            for item in value:
                pname = self._new_param_name()
                placeholders.append(f":{pname}")
                params[pname] = item
            return f"{column} IN ({', '.join(placeholders)})", params

        raise ValueError(f"Unsupported filter operator: {op}")


__all__ = ["StorageVectorService", "VectorDimensionMismatchError"]