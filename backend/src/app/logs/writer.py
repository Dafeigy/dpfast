import asyncio
import logging
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete

from app.core.config import settings
from app.db.session import SessionFactory
from app.logs.models import ApiLog

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class LogEvent:
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
    exception: str | None = None
    context: dict[str, Any] = field(default_factory=dict)


class LogWriter:
    def __init__(self) -> None:
        self.queue: asyncio.Queue[LogEvent] = asyncio.Queue(maxsize=settings.log_queue_size)
        self._writer_task: asyncio.Task[None] | None = None
        self._cleanup_task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        if not settings.log_persistence_enabled:
            return
        self._writer_task = asyncio.create_task(self._write_loop(), name="log-writer")
        self._cleanup_task = asyncio.create_task(self._cleanup_loop(), name="log-cleanup")

    async def stop(self) -> None:
        if not settings.log_persistence_enabled:
            return
        try:
            await asyncio.wait_for(self.queue.join(), timeout=5)
        except TimeoutError:
            logger.warning("Log queue did not drain before shutdown")
        for task in (self._writer_task, self._cleanup_task):
            if task:
                task.cancel()
        await asyncio.gather(
            *(task for task in (self._writer_task, self._cleanup_task) if task),
            return_exceptions=True,
        )

    def enqueue(self, event: LogEvent) -> None:
        if not settings.log_persistence_enabled:
            return
        try:
            self.queue.put_nowait(event)
        except asyncio.QueueFull:
            logger.error(
                "Log queue is full; request log dropped", extra={"request_id": event.request_id}
            )

    async def _write_loop(self) -> None:
        while True:
            batch = [await self.queue.get()]
            deadline = asyncio.get_running_loop().time() + settings.log_flush_interval_seconds
            while len(batch) < settings.log_batch_size:
                timeout = deadline - asyncio.get_running_loop().time()
                if timeout <= 0:
                    break
                try:
                    batch.append(await asyncio.wait_for(self.queue.get(), timeout=timeout))
                except TimeoutError:
                    break
            try:
                async with SessionFactory() as session:
                    session.add_all(ApiLog(**asdict(event)) for event in batch)
                    await session.commit()
            except Exception:
                logger.exception("Failed to persist request log batch")
            finally:
                for _ in batch:
                    self.queue.task_done()

    async def _cleanup_loop(self) -> None:
        while True:
            await self.cleanup_expired()
            await asyncio.sleep(settings.log_cleanup_interval_seconds)

    async def cleanup_expired(self) -> None:
        cutoff = datetime.now(UTC) - timedelta(days=settings.log_retention_days)
        try:
            async with SessionFactory() as session:
                await session.execute(delete(ApiLog).where(ApiLog.created_at < cutoff))
                await session.commit()
        except Exception:
            logger.exception("Failed to clean expired request logs")


log_writer = LogWriter()
