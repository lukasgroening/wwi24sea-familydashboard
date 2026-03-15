from enum import Enum
from typing import Optional
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
