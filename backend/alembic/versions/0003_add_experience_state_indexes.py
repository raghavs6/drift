"""add experience state and filter indexes

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("experiences")}
    indexes = inspector.get_indexes("experiences")
    indexed_columns = {tuple(index["column_names"]) for index in indexes}

    if "state" not in columns:
        op.add_column("experiences", sa.Column("state", sa.Text(), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE experiences
            SET state = substring(location FROM ',\\s*([A-Z]{2})\\s*$')
            WHERE state IS NULL
              AND location ~ ',\\s*[A-Z]{2}\\s*$'
            """
        )
    )

    if ("category",) not in indexed_columns:
        op.create_index("ix_experiences_category", "experiences", ["category"])
    if ("state",) not in indexed_columns:
        op.create_index("ix_experiences_state", "experiences", ["state"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("experiences")}
    columns = {column["name"] for column in inspector.get_columns("experiences")}

    if "ix_experiences_state" in indexes:
        op.drop_index("ix_experiences_state", table_name="experiences")
    if "ix_experiences_category" in indexes:
        op.drop_index("ix_experiences_category", table_name="experiences")
    if "state" in columns:
        op.drop_column("experiences", "state")
