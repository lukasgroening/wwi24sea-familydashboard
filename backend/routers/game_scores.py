from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List, Optional

from database import get_session
from dependencies import get_current_user
from models.user import User
from models.game_score import GameScore, GameScoreCreate, GameScorePublic

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
    existing = session.exec(
        select(GameScore)
        .where(GameScore.user_id == current_user.id)
        .order_by(GameScore.score.desc())
    ).first()

    if existing and existing.score >= score_in.score:
        return existing

    new_score = GameScore(
        score=score_in.score,
        user_id=current_user.id,
        family_id=current_user.family_id,
        username=current_user.username,
    )
    session.add(new_score)
    session.commit()
    session.refresh(new_score)
    return new_score


@router.get("/score/me", response_model=Optional[GameScorePublic])
def get_my_highscore(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return session.exec(
        select(GameScore)
        .where(GameScore.user_id == current_user.id)
        .order_by(GameScore.score.desc())
    ).first()


@router.get("/score/family", response_model=List[GameScorePublic])
def get_family_leaderboard(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.family_id:
        return []

    scores = session.exec(
        select(GameScore)
        .where(GameScore.family_id == current_user.family_id)
        .order_by(GameScore.score.desc())
    ).all()

    seen: set[int] = set()
    leaderboard: list[GameScore] = []
    for s in scores:
        if s.user_id not in seen:
            seen.add(s.user_id)
            leaderboard.append(s)
        if len(leaderboard) >= 10:
            break

    return leaderboard
