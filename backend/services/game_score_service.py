from sqlmodel import Session, select
from typing import List, Optional
from models.game_score import GameScore, GameScoreCreate
from models.user import User


def submit_score(session: Session, score_in: GameScoreCreate, current_user: User) -> GameScore:
    """
    Speichert einen neuen Score, falls dieser höher als der bisherige Bestwert des Nutzers ist.
    Gibt den (neuen oder bestehenden) Highscore zurück.
    """
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


def get_user_highscore(session: Session, user_id: int) -> Optional[GameScore]:
    """Gibt den höchsten Score eines spezifischen Benutzers zurück."""
    return session.exec(
        select(GameScore)
        .where(GameScore.user_id == user_id)
        .order_by(GameScore.score.desc())
    ).first()


def get_family_leaderboard(session: Session, family_id: int, limit: int = 10) -> List[GameScore]:
    """
    Gibt die Top-Scores einer Familie zurück. 
    Nur der beste Score pro Benutzer wird berücksichtigt.
    """
    scores = session.exec(
        select(GameScore)
        .where(GameScore.family_id == family_id)
        .order_by(GameScore.score.desc())
    ).all()

    seen: set[int] = set()
    leaderboard: list[GameScore] = []
    for s in scores:
        if s.user_id not in seen:
            seen.add(s.user_id)
            leaderboard.append(s)
        if len(leaderboard) >= limit:
            break

    return leaderboard
