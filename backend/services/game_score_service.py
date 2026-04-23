from sqlmodel import Session, select, col
from typing import List, Optional
from models.game_score import GameScore, GameScoreCreate, GameScorePublic
from models.family import Family
from models.user import User


def submit_score(session: Session, score_in: GameScoreCreate, current_user: User) -> GameScore:
    """
    Speichert einen neuen Score, falls dieser höher als der bisherige Bestwert des Nutzers ist.
    Gibt den (neuen oder bestehenden) Highscore zurück.
    """
    existing = session.exec(
        select(GameScore)
        .where(GameScore.user_id == current_user.id)
        .order_by(col(GameScore.score).desc())
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
        .order_by(col(GameScore.score).desc())
    ).first()


def get_family_leaderboard(session: Session, family_id: int, limit: int = 10) -> List[GameScorePublic]:
    """
    Gibt die Top-Scores einer Familie zurück. 
    Nur der beste Score pro Benutzer wird berücksichtigt.
    """
    statement = (
        select(GameScore, Family.name.label("family_name"))
        .join(Family, GameScore.family_id == Family.id, isouter=True)
        .where(GameScore.family_id == family_id)
        .order_by(col(GameScore.score).desc())
    )
    results = session.exec(statement).all()

    seen: set[int] = set()
    leaderboard: list[GameScorePublic] = []
    for score, family_name in results:
        if score.user_id not in seen:
            seen.add(score.user_id)
            leaderboard.append(
                GameScorePublic(
                    **score.model_dump(),
                    family_name=family_name
                )
            )
        if len(leaderboard) >= limit:
            break

    return leaderboard


def get_global_leaderboard(session: Session, limit: int = 10) -> List[GameScorePublic]:
    """
    Gibt die Top-Scores über alle Familien hinweg zurück.
    Nur der beste Score pro Benutzer wird berücksichtigt.
    """
    statement = (
        select(GameScore, Family.name.label("family_name"))
        .join(Family, GameScore.family_id == Family.id, isouter=True)
        .order_by(col(GameScore.score).desc())
    )
    results = session.exec(statement).all()

    seen: set[int] = set()
    leaderboard: list[GameScorePublic] = []
    for score, family_name in results:
        if score.user_id not in seen:
            seen.add(score.user_id)
            leaderboard.append(
                GameScorePublic(
                    **score.model_dump(),
                    family_name=family_name
                )
            )
        if len(leaderboard) >= limit:
            break

    return leaderboard
