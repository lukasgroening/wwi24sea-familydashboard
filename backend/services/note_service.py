from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from models.note import Note, NoteCreate, NoteUpdate


def get_family_notes(session: Session, family_id: int) -> List[Note]:
    """Gibt alle Notizen einer Familie zurück."""
    return session.exec(select(Note).where(Note.family_id == family_id)).all()


def get_note_by_id(session: Session, note_id: int, family_id: int) -> Note:
    """Sucht eine Notiz nach ID und prüft die Familienzugehörigkeit."""
    db_note = session.get(Note, note_id)
    if not db_note or db_note.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notiz nicht gefunden."
        )
    return db_note


def create_note(session: Session, note_in: NoteCreate, family_id: int) -> Note:
    """Erstellt eine neue Notiz für eine Familie."""
    db_note = Note(**note_in.model_dump(), family_id=family_id)
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note


def update_note(
    session: Session, note_id: int, note_update: NoteUpdate, family_id: int
) -> Note:
    """Aktualisiert eine bestehende Notiz."""
    db_note = get_note_by_id(session, note_id, family_id)

    update_data = note_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)

    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note


def delete_note(session: Session, note_id: int, family_id: int) -> None:
    """Löscht eine Notiz."""
    db_note = get_note_by_id(session, note_id, family_id)
    session.delete(db_note)
    session.commit()
