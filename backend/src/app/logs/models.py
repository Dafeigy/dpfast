import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Float, Integer, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")


class ApiLog(Base):
    __tablename__ = "api_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    level: Mapped[str] = mapped_column(String(16), default="INFO", index=True)
    service: Mapped[str] = mapped_column(String(64))
    environment: Mapped[str] = mapped_column(String(32))
    request_id: Mapped[str] = mapped_column(String(64), index=True)
    method: Mapped[str] = mapped_column(String(16))
    path: Mapped[str] = mapped_column(String(2048), index=True)
    query_params: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, default=dict)
    request_headers: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, default=dict)
    request_body: Mapped[str | None] = mapped_column(Text)
    request_body_truncated: Mapped[bool] = mapped_column(Boolean, default=False)
    status_code: Mapped[int] = mapped_column(Integer)
    duration_ms: Mapped[float] = mapped_column(Float)
    response_headers: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, default=dict)
    response_body: Mapped[str | None] = mapped_column(Text)
    response_body_truncated: Mapped[bool] = mapped_column(Boolean, default=False)
    client_ip: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(Text)
    message: Mapped[str] = mapped_column(Text)
    exception: Mapped[str | None] = mapped_column(Text)
    context: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, default=dict)
