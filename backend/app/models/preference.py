from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class UserPreference(SQLModel, table=True):
    __tablename__ = "user_preferences"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    location: str | None = None
    distance: str | None = None
    age: str | None = None
    comfort: str | None = None
    kid_friendly: bool = Field(default=False)
    child_age: int | None = None
    vibes: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    onboarding_complete: bool = Field(default=False)
    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
    )
