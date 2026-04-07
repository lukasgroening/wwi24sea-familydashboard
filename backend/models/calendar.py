from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import BaseModel


class CalendarEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    color: Optional[str] = "#7c9a7e"  # Default dashboard green
    
    # Optional: Link to a user who created it
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class CalendarSource(SQLModel, table=True):
    """Stores external iCal/ICS URLs for integration."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str  # e.g., "Google Kalender Mama"
    url: str   # The public .ics URL
    color: Optional[str] = "#a8c4a8"
    active: bool = True


# --- DTOs ---

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    color: Optional[str] = None
    user_id: Optional[int] = None


class CalendarEventPublic(BaseModel):
    id: Optional[int] = None  # External events might not have a DB id
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    color: Optional[str] = None
    is_external: bool = False
    source_name: Optional[str] = None


class CalendarSourceCreate(BaseModel):
    name: str
    url: str
    color: Optional[str] = None


class CalendarSourcePublic(BaseModel):
    id: int
    name: str
    url: str
    color: Optional[str]
    active: bool
