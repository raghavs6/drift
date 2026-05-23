from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, SQLModel


class Collection(SQLModel, table=True):
    __tablename__ = "collections"

    id: str = Field(primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)
    label: str = Field(nullable=False)
    icon: str | None = None
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )


class CollectionItem(SQLModel, table=True):
    __tablename__ = "collection_items"

    collection_id: str = Field(foreign_key="collections.id", primary_key=True)
    experience_id: str = Field(foreign_key="experiences.id", primary_key=True)
    added_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )
