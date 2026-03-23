from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import BaseModel


class ToDo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    is_completed: bool = Field(default=False)

    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class ToDoCreate(BaseModel):
    title: str
    user_id: Optional[int] = None


class ToDoPublic(BaseModel):
    id: int
    title: str
    is_completed: bool
    user_id: Optional[int]


class ToDoUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    user_id: Optional[int] = None
