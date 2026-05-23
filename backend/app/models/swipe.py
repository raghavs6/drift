from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, Column, DateTime, Index, func
from sqlmodel import Field, SQLModel


class Swipe(SQLModel, table=True):
    __tablename__ = "swipes"
    __table_args__ = (
        Index("ix_swipes_user_created", "user_id", "created_at"),
    )

    id: int | None = Field(default=None, sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    user_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)
    experience_id: str = Field(foreign_key="experiences.id", nullable=False)
    action: str = Field(nullable=False)
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )
