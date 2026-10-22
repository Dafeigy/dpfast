import json
import time
import traceback
import uuid
from typing import Any
from urllib.parse import parse_qsl

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import settings
from app.logs.writer import LogEvent, log_writer

SENSITIVE_KEYS = {
    "access_token",
    "apikey",
    "api_key",
    "authorization",
    "cookie",
    "password",
    "refresh_token",
    "secret",
    "set-cookie",
    "token",
    "x-api-key",
}


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: "[REDACTED]" if key.lower() in SENSITIVE_KEYS else _redact(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_redact(item) for item in value]
    return value


def _headers(raw_headers: list[tuple[bytes, bytes]]) -> dict[str, str]:
    result: dict[str, str] = {}
    for raw_key, raw_value in raw_headers:
        key = raw_key.decode("latin-1").lower()
        result[key] = "[REDACTED]" if key in SENSITIVE_KEYS else raw_value.decode("latin-1")
    return result


def _body_text(body: bytes, content_type: str) -> str | None:
    if not body:
        return None
    if "json" in content_type:
        try:
            return json.dumps(_redact(json.loads(body)), ensure_ascii=False)
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
    if "application/x-www-form-urlencoded" in content_type:
        parsed = dict(parse_qsl(body.decode("utf-8", errors="replace"), keep_blank_values=True))
        return json.dumps(_redact(parsed), ensure_ascii=False)
    if "multipart/form-data" in content_type:
        return f"[MULTIPART {len(body)} BYTES]"
    if content_type.startswith("text/") or "json" in content_type:
        return body.decode("utf-8", errors="replace")
    return f"[BINARY {len(body)} BYTES]"


class RequestLogMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"].startswith(settings.excluded_log_prefixes):
            await self.app(scope, receive, send)
            return

        started = time.perf_counter()
        supplied_request_id = dict(scope.get("headers", [])).get(b"x-request-id", b"").decode()
        request_id = supplied_request_id[:64] or str(uuid.uuid4())
        request_body = bytearray()
        response_body = bytearray()
        request_truncated = False
        response_truncated = False
        status_code = 500
        response_headers: list[tuple[bytes, bytes]] = []
        exception_text: str | None = None
        recorded = False

        def capture(target: bytearray, chunk: bytes) -> bool:
            remaining = settings.log_body_max_bytes - len(target)
            if remaining > 0:
                target.extend(chunk[:remaining])
            return len(chunk) > remaining

        async def receive_wrapper() -> Message:
            nonlocal request_truncated
            message = await receive()
            if message["type"] == "http.request":
                request_truncated = (
                    capture(request_body, message.get("body", b"")) or request_truncated
                )
            return message

        async def record() -> None:
            nonlocal recorded
            if recorded:
                return
            recorded = True
            request_headers = _headers(scope.get("headers", []))
            safe_response_headers = _headers(response_headers)
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            client = scope.get("client")
            log_writer.enqueue(
                LogEvent(
                    level="ERROR"
                    if status_code >= 500
                    else "WARNING"
                    if status_code >= 400
                    else "INFO",
                    service=settings.service_name,
                    environment=settings.environment,
                    request_id=request_id,
                    method=scope["method"],
                    path=scope["path"][:2048],
                    query_params=_redact(
                        dict(
                            parse_qsl(
                                scope.get("query_string", b"").decode(),
                                keep_blank_values=True,
                            )
                        )
                    ),
                    request_headers=request_headers,
                    request_body=_body_text(
                        bytes(request_body), request_headers.get("content-type", "")
                    ),
                    request_body_truncated=request_truncated,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    response_headers=safe_response_headers,
                    response_body=_body_text(
                        bytes(response_body), safe_response_headers.get("content-type", "")
                    ),
                    response_body_truncated=response_truncated,
                    client_ip=client[0] if client else None,
                    user_agent=request_headers.get("user-agent"),
                    message=f"{scope['method']} {scope['path']} -> {status_code}",
                    exception=exception_text,
                )
            )

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code, response_headers, response_truncated
            if message["type"] == "http.response.start":
                status_code = message["status"]
                response_headers = message.get("headers", [])
                headers = list(response_headers)
                headers.append((b"x-request-id", request_id.encode()))
                message["headers"] = headers
            elif message["type"] == "http.response.body":
                response_truncated = (
                    capture(response_body, message.get("body", b"")) or response_truncated
                )
                if not message.get("more_body", False):
                    await record()
            await send(message)

        try:
            await self.app(scope, receive_wrapper, send_wrapper)
        except BaseException:
            exception_text = traceback.format_exc()
            await record()
            raise
