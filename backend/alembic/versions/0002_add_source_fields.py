"""add experience source fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("experiences", sa.Column("source", sa.Text(), nullable=True))
    op.add_column("experiences", sa.Column("source_id", sa.Text(), nullable=True))
    op.add_column("experiences", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("experiences", sa.Column("longitude", sa.Float(), nullable=True))
    op.create_index(
        "ix_experiences_source_source_id",
        "experiences",
        ["source", "source_id"],
        unique=True,
        postgresql_where=sa.text("source IS NOT NULL AND source_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_experiences_source_source_id", table_name="experiences")
    op.drop_column("experiences", "longitude")
    op.drop_column("experiences", "latitude")
    op.drop_column("experiences", "source_id")
    op.drop_column("experiences", "source")
