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
    role: Role = Field(default=Role.USER)
    family_id: Optional[int] = Field(default=None, foreign_key="family.id")


class UserCreate(BaseModel):
    username: str
    password: str
    role: Role
    family_id: Optional[int] = None


class UserRegister(BaseModel):
    username: str
    password: str
    join_code: Optional[str] = None
    family_name: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    username: str
    role: Role
    family_id: Optional[int] = None
    join_code: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    family_id: Optional[int] = None
