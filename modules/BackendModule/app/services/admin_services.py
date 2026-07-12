"""
Admin Workflow Services
"""

from __future__ import annotations

import logging
import uuid
from typing import Optional

from app.adapters.admin_adapters import AdminAdapter

logger = logging.getLogger(__name__)


class AdminService:
    def __init__(self, adapter: AdminAdapter):
        self.adapter = adapter

    async def trigger_reindex(
        self,
        bearer_token: str,
        batch_size: int = 100,
        resume_from: Optional[str] = None,
    ) -> dict[str, str]:
        job_id = str(uuid.uuid4())

        images = await self.adapter.fetch_images_for_reindex(
            batch_size=batch_size,
            resume_from=resume_from,
        )

        if not images:
            logger.info("admin_reindex job_id=%s no images found", job_id)
            return {"job_id": job_id}

        embedded = await self.adapter.request_batch_embeddings(
            images=images,
            bearer_token=bearer_token,
        )

        success_count = 0
        failed_count = 0

        for item in embedded:
            image_id = item["image_id"]
            vector = item.get("vector")

            if not isinstance(vector, list) or len(vector) == 0:
                await self.adapter.update_index_status(image_id=image_id, status_value="failed")
                failed_count += 1
                continue

            ok = await self.adapter.call_vector_index(
                image_id=image_id,
                vector=vector,
                bearer_token=bearer_token,
            )

            if ok:
                await self.adapter.update_index_status(image_id=image_id, status_value="ready")
                success_count += 1
            else:
                await self.adapter.update_index_status(image_id=image_id, status_value="failed")
                failed_count += 1

        logger.info(
            "admin_reindex job_id=%s total=%s success=%s failed=%s resume_from=%s batch_size=%s",
            job_id,
            len(images),
            success_count,
            failed_count,
            resume_from,
            batch_size,
        )
        return {"job_id": job_id}


__all__ = ["AdminService"]