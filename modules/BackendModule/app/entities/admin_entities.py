"""
Admin Workflow Entities
"""

from typing import Optional

from pydantic import BaseModel, Field


class ReindexRequest(BaseModel):
    batch_size: int = Field(default=100, ge=1, description="Số ảnh xử lý mỗi lần gọi")
    resume_from: Optional[str] = Field(
        default=None,
        description="Cursor UUID (chỉ lấy ảnh có id > resume_from)",
    )


class ReindexResponse(BaseModel):
    job_id: str = Field(..., description="Request-scoped reindex job identifier")


__all__ = ["ReindexRequest", "ReindexResponse"]