from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class CalendarEventBase(SQLModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    color: Optional[str] = "#3b82f6"


class CalendarEvent(CalendarEventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    family_id: Optional[int] = Field(default=None, foreign_key="family.id")


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventPublic(CalendarEventBase):
    id: Optional[int] = None
    is_external: bool = False
    source_name: Optional[str] = None
    family_id: Optional[int] = None


class CalendarSourceBase(SQLModel):
    name: str
    url: str
    active: bool = True
    color: str = "#ef4444"


class CalendarSource(CalendarSourceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    family_id: Optional[int] = Field(default=None, foreign_key="family.id")


class CalendarSourceCreate(CalendarSourceBase):
    pass


class CalendarSourcePublic(CalendarSourceBase):
    id: int
    family_id: int
