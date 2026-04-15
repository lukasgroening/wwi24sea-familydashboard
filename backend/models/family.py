from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import BaseModel


class Family(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)


class FamilyCreate(BaseModel):
    name: str


class FamilyPublic(BaseModel):
    id: int
    name: str
    member_count: int = 0
