from typing import Dict, Any, Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from models.user import User

class WidgetBase(SQLModel):
    type: str
    x: int
    y: int
    w: int
    h: int
    settings: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

class WidgetConfig(WidgetBase, table=True):
    __tablename__ = "widget_configs"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")

class WidgetCreate(WidgetBase):
    pass

class WidgetResponse(WidgetBase):
    id: int
    user_id: int