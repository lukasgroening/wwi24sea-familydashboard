from typing import Optional
from pydantic import BaseModel
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone


class NoteBase(SQLModel):
    title: str
    content: str


class Note(NoteBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    family_id: Optional[int] = Field(default=None, foreign_key="family.id")


class NoteCreate(NoteBase):
    pass


class NotePublic(NoteBase):
    id: int
    created_at: datetime
    family_id: Optional[int] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
