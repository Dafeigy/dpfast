from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.logs import router as logs_router
from app.api.mock import router as mock_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(logs_router)
api_router.include_router(mock_router)
