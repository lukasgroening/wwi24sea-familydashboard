from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import BaseModel
from datetime import time


class DayOfWeek(str, Enum):
    MONTAG = "Montag"
    DIENSTAG = "Dienstag"
    MITTWOCH = "Mittwoch"
    DONNERSTAG = "Donnerstag"
    FREITAG = "Freitag"
    SAMSTAG = "Samstag"
    SONNTAG = "Sonntag"


class ScheduleEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subject: str
    day_of_week: str = Field(default=DayOfWeek.MONTAG)
    start_time: time
    end_time: time
    room: Optional[str] = Field(default=None)
    teacher: Optional[str] = Field(default=None)

    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class ScheduleEntryCreate(BaseModel):
    subject: str
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room: Optional[str] = None
    teacher: Optional[str] = None
    user_id: Optional[int] = None


class ScheduleEntryPublic(BaseModel):
    id: int
    subject: str
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room: Optional[str]
    teacher: Optional[str]
    user_id: Optional[int]


class ScheduleEntryUpdate(BaseModel):
    subject: Optional[str] = None
    day_of_week: Optional[DayOfWeek] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None
    teacher: Optional[str] = None
    user_id: Optional[int] = None
