from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


class GameScore(SQLModel, table=True):
    __tablename__ = "game_scores"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    family_id: Optional[int] = Field(default=None, foreign_key="family.id")
    username: str
    score: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GameScoreCreate(SQLModel):
    score: int


class GameScorePublic(SQLModel):
    id: int
    user_id: int
    username: str
    score: int
    created_at: datetime
    family_name: Optional[str] = None
