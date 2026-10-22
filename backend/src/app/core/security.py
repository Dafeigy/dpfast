import secrets

from fastapi import HTTPException, Request, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import settings

serializer = URLSafeTimedSerializer(settings.auth_secret, salt="admin-session")


def password_matches(candidate: str) -> bool:
    return secrets.compare_digest(candidate.encode(), settings.admin_password.encode())


def create_session_token() -> str:
    return serializer.dumps({"role": "admin"})


def require_admin(request: Request) -> None:
    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    try:
        payload = serializer.loads(token, max_age=settings.auth_session_ttl_seconds)
    except (BadSignature, SignatureExpired) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        ) from exc
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
