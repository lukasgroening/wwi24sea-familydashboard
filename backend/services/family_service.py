import secrets
import string
from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from models.family import Family, FamilyCreate, FamilyPublic
from models.user import User
from models.note import Note
from models.todo import ToDo
from models.schedule import ScheduleEntry
from models.calendar import CalendarEvent, CalendarSource
from models.game_score import GameScore
from models.widget import WidgetConfig


def generate_join_code(length: int = 12) -> str:
    """Generiert einen zufälligen, sicheren Join-Code."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def get_all_families(session: Session) -> List[FamilyPublic]:
    """Gibt alle Familien inklusive der Anzahl ihrer Mitglieder zurück."""
    families = session.exec(select(Family)).all()
    result = []
    for f in families:
        count = len(session.exec(select(User).where(User.family_id == f.id)).all())
        result.append(
            FamilyPublic(
                id=f.id, name=f.name, join_code=f.join_code, member_count=count
            )
        )
    return result


def create_family(
    session: Session, family_in: FamilyCreate, allow_commit: bool = True
) -> Family:
    """Erstellt eine neue Familie und prüft auf Namensduplikate."""
    existing = session.exec(select(Family).where(Family.name == family_in.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eine Familie mit diesem Namen existiert bereits.",
        )

    # Sicherstellen, dass der join_code eindeutig ist
    while True:
        join_code = generate_join_code()
        if not session.exec(
            select(Family).where(Family.join_code == join_code)
        ).first():
            break

    db_family = Family(name=family_in.name, join_code=join_code)
    session.add(db_family)

    if allow_commit:
        session.commit()
        session.refresh(db_family)

    return db_family


def delete_family(session: Session, family_id: int) -> None:
    """Löscht eine Familie und alle verknüpften Daten."""
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Familie nicht gefunden."
        )

    # Alle verknüpften Daten löschen oder entkoppeln
    #  User: family_id auf None setzen
    members = session.exec(select(User).where(User.family_id == family_id)).all()
    for member in members:
        member.family_id = None
        session.add(member)
    # Daten löschen
    notes = session.exec(select(Note).where(Note.family_id == family_id)).all()
    for note in notes:
        session.delete(note)
    
    todos = session.exec(select(ToDo).where(ToDo.family_id == family_id)).all()
    for todo in todos:
        session.delete(todo)
    
    schedules = session.exec(select(ScheduleEntry).where(ScheduleEntry.family_id == family_id)).all()
    for schedule in schedules:
        session.delete(schedule)
    
    calendar_events = session.exec(select(CalendarEvent).where(CalendarEvent.family_id == family_id)).all()
    for event in calendar_events:
        session.delete(event)
    
    calendar_sources = session.exec(select(CalendarSource).where(CalendarSource.family_id == family_id)).all()
    for source in calendar_sources:
        session.delete(source)
    
    game_scores = session.exec(select(GameScore).where(GameScore.family_id == family_id)).all()
    for score in game_scores:
        session.delete(score)
    
    widgets = session.exec(select(WidgetConfig).where(WidgetConfig.family_id == family_id)).all()
    for widget in widgets:
        session.delete(widget)
    
    session.flush()
    
    # Familie löschen
    session.delete(family)
    session.commit()


def regenerate_join_code(session: Session, family_id: int) -> Family:
    """Generiert einen neuen Join-Code für eine Familie."""
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Familie nicht gefunden."
        )

    while True:
        new_code = generate_join_code()
        if not session.exec(
            select(Family).where(Family.join_code == new_code)
        ).first():
            break

    family.join_code = new_code
    session.add(family)
    session.commit()
    session.refresh(family)
    return family
