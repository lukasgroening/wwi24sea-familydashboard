from enum import Enum
from typing import Optional
from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class Role(str, Enum):
    SYSTEM_ADMIN = "System-Administrator"
    FAMILY_ADMIN = "Familien-Administrator"
    USER = "Nutzer"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str

    role: str = Field(default=Role.USER)


class UserCreate(BaseModel):
    username: str
    password: str
    role: Role


class UserPublic(BaseModel):
    id: int
    username: str
    role: Role


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Role] = None
