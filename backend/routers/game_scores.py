from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from dependencies import get_current_user
from models.user import User
from models.game_score import GameScoreCreate, GameScorePublic
from services import game_score_service

router = APIRouter(
    prefix="/api/game",
    tags=["Game"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/score", response_model=GameScorePublic)
def submit_score(
    score_in: GameScoreCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return game_score_service.submit_score(session, score_in, current_user)


@router.get("/score/me", response_model=Optional[GameScorePublic])
def get_my_highscore(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return game_score_service.get_user_highscore(session, current_user.id)


@router.get("/score/family", response_model=List[GameScorePublic])
def get_family_leaderboard(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.family_id:
        return []

    return game_score_service.get_family_leaderboard(session, current_user.family_id)


@router.get("/score/global", response_model=List[GameScorePublic])
def get_global_leaderboard(
    session: Session = Depends(get_session),
):
    return game_score_service.get_global_leaderboard(session)
