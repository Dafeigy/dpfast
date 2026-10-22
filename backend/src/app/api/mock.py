from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/mock", tags=["mock"])


class EchoRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    metadata: dict[str, Any] = Field(default_factory=dict)


@router.get("/ping")
async def ping() -> dict[str, Any]:
    return {"message": "pong", "timestamp": datetime.now(UTC)}


@router.post("/echo")
async def echo(payload: EchoRequest) -> dict[str, Any]:
    return {
        "id": str(uuid4()),
        "message": payload.message,
        "metadata": payload.metadata,
        "received_at": datetime.now(UTC),
    }
