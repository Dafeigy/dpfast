from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import create_session_token, password_matches, require_admin

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str = Field(min_length=1)


@router.post("/login")
async def login(payload: LoginRequest, response: Response) -> dict[str, str]:
    if not password_matches(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=create_session_token(),
        max_age=settings.auth_session_ttl_seconds,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path="/",
    )
    return {"status": "authenticated"}


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(settings.auth_cookie_name, path="/")
    return {"status": "logged_out"}


@router.get("/session", dependencies=[Depends(require_admin)])
async def session() -> dict[str, str]:
    return {"status": "authenticated"}
