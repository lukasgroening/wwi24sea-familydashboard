from typing import Optional
from pydantic import BaseModel
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone


class Note(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NoteCreate(BaseModel):
    title: str
    content: str
