from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import BaseModel


class ToDoBase(SQLModel):
    title: str
    is_completed: bool = Field(default=False)
    tag: Optional[str] = Field(default=None)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class ToDo(ToDoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    family_id: Optional[int] = Field(default=None, foreign_key="family.id")


class ToDoCreate(BaseModel):
    title: str
    tag: Optional[str] = None
    user_id: Optional[int] = None


class ToDoPublic(ToDoBase):
    id: int
    family_id: int


class ToDoUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    tag: Optional[str] = None
    user_id: Optional[int] = None
