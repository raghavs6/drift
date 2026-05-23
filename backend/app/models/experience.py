from datetime import datetime

from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class Experience(SQLModel, table=True):
    __tablename__ = "experiences"

    id: str = Field(primary_key=True)
    title: str
    hook: str | None = None
    location: str | None = None
    distance: str | None = None
    difficulty: str | None = None
    cost: str | None = None
    time: str | None = None
    season: str | None = None
    category: str | None = None
    category_label: str | None = None
    description: str | None = None
    description2: str | None = None
    condition: str | None = None
    condition_type: str | None = None
    kid_friendly: bool = Field(default=False)
    min_age: int | None = None
    condition_score: float | None = None
    what_to_bring: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    images: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )
    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
    )
