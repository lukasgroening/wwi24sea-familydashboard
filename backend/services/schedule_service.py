from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from models.schedule import ScheduleEntry, ScheduleEntryCreate, ScheduleEntryUpdate
from models.user import User


def get_family_schedule(session: Session, family_id: int) -> List[ScheduleEntry]:
    """Gibt den kompletten Stundenplan einer Familie zurück."""
    return session.exec(
        select(ScheduleEntry).where(ScheduleEntry.family_id == family_id)
    ).all()


def get_user_schedule(
    session: Session, user_id: int, family_id: int
) -> List[ScheduleEntry]:
    """Gibt den Stundenplan eines spezifischen Benutzers innerhalb der Familie zurück."""
    # Prüfen, ob der Ziel-User zur gleichen Familie gehört
    target_user = session.get(User, user_id)
    if not target_user or target_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert. Dieser Benutzer gehört nicht zu deiner Familie.",
        )

    return session.exec(
        select(ScheduleEntry).where(ScheduleEntry.user_id == user_id)
    ).all()


def get_schedule_entry_by_id(
    session: Session, entry_id: int, family_id: int
) -> ScheduleEntry:
    """Sucht einen Stundenplaneintrag nach ID und prüft die Familienzugehörigkeit."""
    db_entry = session.get(ScheduleEntry, entry_id)
    if not db_entry or db_entry.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stundenplaneintrag nicht gefunden.",
        )
    return db_entry


def _check_user_in_family(session: Session, user_id: int, family_id: int) -> None:
    """Prüft, ob ein User existiert und zur angegebenen Familie gehört."""
    user = session.get(User, user_id)
    if not user or user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zugewiesener Benutzer nicht gefunden oder gehört nicht zur Familie.",
        )


def create_schedule_entry(
    session: Session, entry_in: ScheduleEntryCreate, family_id: int
) -> ScheduleEntry:
    """Erstellt einen neuen Stundenplaneintrag."""
    if entry_in.user_id is not None:
        _check_user_in_family(session, entry_in.user_id, family_id)

    db_entry = ScheduleEntry(**entry_in.model_dump(), family_id=family_id)
    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry


def update_schedule_entry(
    session: Session, entry_id: int, entry_update: ScheduleEntryUpdate, family_id: int
) -> ScheduleEntry:
    """Aktualisiert einen bestehenden Stundenplaneintrag."""
    db_entry = get_schedule_entry_by_id(session, entry_id, family_id)

    if entry_update.user_id is not None:
        _check_user_in_family(session, entry_update.user_id, family_id)

    update_data = entry_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry


def delete_schedule_entry(session: Session, entry_id: int, family_id: int) -> None:
    """Löscht einen Stundenplaneintrag."""
    db_entry = get_schedule_entry_by_id(session, entry_id, family_id)
    session.delete(db_entry)
    session.commit()
