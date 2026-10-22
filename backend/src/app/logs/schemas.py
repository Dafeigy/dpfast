import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    level: str
    service: str
    environment: str
    request_id: str
    method: str
    path: str
    query_params: dict[str, Any]
    request_headers: dict[str, Any]
    request_body: str | None
    request_body_truncated: bool
    status_code: int
    duration_ms: float
    response_headers: dict[str, Any]
    response_body: str | None
    response_body_truncated: bool
    client_ip: str | None
    user_agent: str | None
    message: str
    exception: str | None
    context: dict[str, Any]


class LogPage(BaseModel):
    items: list[LogItem]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total: int = Field(ge=0)
    pages: int = Field(ge=0)
