import json

from fastapi.testclient import TestClient

from app.logs.writer import log_writer
from app.main import app


def test_get_and_post_mock_endpoints() -> None:
    with TestClient(app) as client:
        ping = client.get("/api/v1/mock/ping")
        assert ping.status_code == 200
        assert ping.json()["message"] == "pong"

        echo = client.post(
            "/api/v1/mock/echo",
            json={"message": "hello", "metadata": {"source": "test"}},
        )
        assert echo.status_code == 200
        assert echo.json()["message"] == "hello"


def test_login_sets_http_only_cookie() -> None:
    with TestClient(app) as client:
        failed = client.post("/api/v1/auth/login", json={"password": "wrong"})
        assert failed.status_code == 401

        response = client.post("/api/v1/auth/login", json={"password": "test-password"})
        assert response.status_code == 200
        assert "admin_session" in response.cookies
        assert "HttpOnly" in response.headers["set-cookie"]

        session = client.get("/api/v1/auth/session")
        assert session.status_code == 200


def test_request_middleware_captures_bodies_and_redacts_password(monkeypatch) -> None:
    events = []
    monkeypatch.setattr(log_writer, "enqueue", events.append)

    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={"password": "test-password"})

    assert response.status_code == 200
    assert response.headers["x-request-id"] == events[0].request_id
    assert json.loads(events[0].request_body) == {"password": "[REDACTED]"}
    assert json.loads(events[0].response_body) == {"status": "authenticated"}
