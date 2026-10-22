FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY pyproject.toml alembic.ini ./
COPY migrations ./migrations
COPY src ./src

FROM base AS development
RUN pip install --upgrade pip && pip install -e ".[dev]"
USER app
CMD ["uvicorn", "app.main:app", "--app-dir", "/app/src", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/src"]

FROM base AS runtime
RUN pip install --upgrade pip && pip install .
USER app
CMD ["fastapi", "run", "src/app/main.py", "--port", "8000"]

