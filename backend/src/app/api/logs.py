import math
import uuid
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_admin
from app.db.session import get_session
from app.logs.models import ApiLog
from app.logs.schemas import LogItem, LogPage

router = APIRouter(prefix="/logs", tags=["logs"], dependencies=[Depends(require_admin)])
SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("", response_model=LogPage)
async def list_logs(
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    level: str | None = None,
    method: str | None = None,
    path: str | None = None,
    error_code: int | None = Query(None, ge=100, le=599),
    status: Literal["success", "failure"] | None = None,
    status_code: int | None = Query(None, ge=100, le=599),
    request_id: str | None = None,
    search: str | None = Query(None, max_length=200),
    created_from: datetime | None = None,
    created_to: datetime | None = None,
) -> LogPage:
    filters = []
    if level:
        filters.append(ApiLog.level == level.upper())
    if method:
        filters.append(ApiLog.method == method.upper())
    if path:
        filters.append(ApiLog.path == path)
    if error_code:
        filters.append(ApiLog.status_code == error_code)
    elif status_code:
        filters.append(ApiLog.status_code == status_code)
    if status == "success":
        filters.append(ApiLog.status_code == 200)
    elif status == "failure":
        filters.append(ApiLog.status_code != 200)
    if request_id:
        filters.append(ApiLog.request_id == request_id)
    if created_from:
        filters.append(ApiLog.created_at >= created_from)
    if created_to:
        filters.append(ApiLog.created_at <= created_to)
    if search:
        pattern = f"%{search}%"
        filters.append(
            or_(
                ApiLog.message.ilike(pattern),
                ApiLog.request_body.ilike(pattern),
                ApiLog.response_body.ilike(pattern),
            )
        )

    total = await session.scalar(select(func.count(ApiLog.id)).where(*filters)) or 0
    result = await session.scalars(
        select(ApiLog)
        .where(*filters)
        .order_by(ApiLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return LogPage(
        items=[LogItem.model_validate(item) for item in result],
        page=page,
        page_size=page_size,
        total=total,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/{log_id}", response_model=LogItem)
async def get_log(log_id: uuid.UUID, session: SessionDep) -> LogItem:
    item = await session.get(ApiLog, log_id)
    if not item:
        raise HTTPException(status_code=404, detail="Log not found")
    return LogItem.model_validate(item)
