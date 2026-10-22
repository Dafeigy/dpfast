"""create api logs

Revision ID: 20261022_0001
Revises:
Create Date: 2026-10-22
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20261022_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "api_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("level", sa.String(length=16), nullable=False),
        sa.Column("service", sa.String(length=64), nullable=False),
        sa.Column("environment", sa.String(length=32), nullable=False),
        sa.Column("request_id", sa.String(length=64), nullable=False),
        sa.Column("method", sa.String(length=16), nullable=False),
        sa.Column("path", sa.String(length=2048), nullable=False),
        sa.Column("query_params", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("request_headers", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("request_body", sa.Text(), nullable=True),
        sa.Column("request_body_truncated", sa.Boolean(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("duration_ms", sa.Float(), nullable=False),
        sa.Column("response_headers", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("response_body_truncated", sa.Boolean(), nullable=False),
        sa.Column("client_ip", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("exception", sa.Text(), nullable=True),
        sa.Column("context", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_logs_created_at", "api_logs", [sa.text("created_at DESC")])
    op.create_index(
        "ix_api_logs_level_created_at", "api_logs", ["level", sa.text("created_at DESC")]
    )
    op.create_index("ix_api_logs_request_id", "api_logs", ["request_id"])
    op.create_index("ix_api_logs_path_created_at", "api_logs", ["path", sa.text("created_at DESC")])
    op.create_index("ix_api_logs_context_gin", "api_logs", ["context"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_table("api_logs")
