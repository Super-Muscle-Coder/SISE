"""
Celery tasks for asynchronous indexing pipeline (S4/S5).
"""

from __future__ import annotations

import asyncio
import logging

from celery import Celery
from minio import Minio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from ..adapters.auth_adapters import AuthConfigAdapter
from ..adapters.indexing_adapters import IndexingAdapter
from ..adapters.scaffold_adapters import ScaffoldConfigAdapter
from ..adapters.upload_adapters import MinIOAdapter
from ..entities.indexing_entities import PermanentIndexingError, TransientIndexingError
from ..services.indexing_services import IndexingService

logger = logging.getLogger(__name__)

_config_adapter = ScaffoldConfigAdapter()
_db_config = _config_adapter.get_database_config()
_storage_config = _config_adapter.get_storage_config()
_global_config = _config_adapter.get_global_config()
_auth_config = _config_adapter.get_auth_config()
_celery_config = _config_adapter.get_celery_config()
_broker_url = _celery_config.broker_url
_result_backend = _celery_config.result_backend

if not _broker_url or not _result_backend:
    raise RuntimeError(
        "Celery config invalid: broker_url/result_backend not found via ScaffoldConfigAdapter"
    )

MAX_RETRIES = _global_config.retry_policy.max_retries
BACKOFF_MS = _global_config.retry_policy.backoff_ms
FACTOR = _global_config.retry_policy.factor

_ai_service_url = None
_ai_service_config = _config_adapter.get_ai_service_config()
_ai_service_url = _ai_service_config.url

_app_config = _config_adapter.get_app_config()
_backend_host = getattr(_app_config, "host", "localhost")
_backend_port = int(getattr(_app_config, "port", 8000))
_vector_index_base_url = f"http://{_backend_host}:{_backend_port}"

_auth_adapter = AuthConfigAdapter(auth_config=_auth_config)
_token_generator = _auth_adapter.get_token_generator()

celery_app = Celery(
    "backend_indexing_worker",
    broker=_broker_url,
    backend=_result_backend,
)


def _build_minio_client() -> Minio:
    endpoint = _storage_config.endpoint
    secure = endpoint.startswith("https://")
    normalized_endpoint = endpoint.removeprefix("http://").removeprefix("https://")
    return Minio(
        endpoint=normalized_endpoint,
        access_key=_storage_config.access_key,
        secret_key=_storage_config.secret_key,
        secure=secure,
    )


def _build_session_factory() -> async_sessionmaker:
    engine = create_async_engine(
        _db_config.url,
        echo=_db_config.echo,
        pool_size=_db_config.pool_size,
        max_overflow=_db_config.max_overflow,
    )
    return async_sessionmaker(bind=engine, expire_on_commit=False), engine


async def _run_indexing_once(image_id: str) -> None:
    session_factory, engine = _build_session_factory()
    try:
        async with session_factory() as session:
            minio_adapter = MinIOAdapter(
                minio_client=_build_minio_client(),
                bucket_name="raw-images",
                endpoint=_storage_config.endpoint,
            )
            adapter = IndexingAdapter(
                db_session=session,
                minio_adapter=minio_adapter,
                ai_service_url=_ai_service_url,
                vector_index_url=_vector_index_base_url,
            )
            service = IndexingService(
                adapter=adapter,
                token_generator=_token_generator,
                expected_vector_dim=_global_config.vector_dim,
            )
            await service.process_indexing(image_id=image_id)
    finally:
        await engine.dispose()


async def _mark_failed(image_id: str) -> None:
    session_factory, engine = _build_session_factory()
    try:
        async with session_factory() as session:
            minio_adapter = MinIOAdapter(
                minio_client=_build_minio_client(),
                bucket_name="raw-images",
                endpoint=_storage_config.endpoint,
            )
            adapter = IndexingAdapter(
                db_session=session,
                minio_adapter=minio_adapter,
                ai_service_url=_ai_service_url,
                vector_index_url=_vector_index_base_url,
            )
            await adapter.update_index_status(image_id=image_id, status="failed")
    finally:
        await engine.dispose()


@celery_app.task(bind=True, max_retries=MAX_RETRIES, name="indexing.process_image")
def process_image_indexing(self, image_id: str) -> dict:
    try:
        asyncio.run(_run_indexing_once(image_id=image_id))
        return {"status": "ready", "image_id": image_id}

    except PermanentIndexingError as exc:
        logger.error("Permanent indexing error for image %s: %s", image_id, str(exc))
        asyncio.run(_mark_failed(image_id=image_id))
        return {"status": "failed", "image_id": image_id, "reason": str(exc)}

    except TransientIndexingError as exc:
        current_retry = int(self.request.retries)
        if current_retry >= MAX_RETRIES:
            logger.error(
                "Transient indexing error exhausted retries for image %s: %s",
                image_id,
                str(exc),
            )
            asyncio.run(_mark_failed(image_id=image_id))
            raise

        countdown = int((BACKOFF_MS / 1000) * (FACTOR ** current_retry))
        logger.warning(
            "Transient indexing error for image %s (retry=%s/%s, countdown=%ss): %s",
            image_id,
            current_retry + 1,
            MAX_RETRIES,
            countdown,
            str(exc),
        )
        raise self.retry(exc=exc, countdown=countdown)

    except Exception as exc:
        current_retry = int(self.request.retries)
        wrapped = TransientIndexingError(f"Unexpected indexing error: {exc}")

        if current_retry >= MAX_RETRIES:
            logger.exception(
                "Unexpected indexing error exhausted retries for image %s",
                image_id,
            )
            asyncio.run(_mark_failed(image_id=image_id))
            raise wrapped

        countdown = int((BACKOFF_MS / 1000) * (FACTOR ** current_retry))
        logger.exception(
            "Unexpected indexing error for image %s (retry=%s/%s, countdown=%ss)",
            image_id,
            current_retry + 1,
            MAX_RETRIES,
            countdown,
        )
        raise self.retry(exc=wrapped, countdown=countdown)


__all__ = ["celery_app", "process_image_indexing"]