from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from dependencies import get_current_user
from database import get_session
from models.note import Note, NoteCreate, NoteUpdate
from models.user import User

router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"],
)


@router.post("/", response_model=Note)
def create_note(
    note_in: NoteCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_note = Note(title=note_in.title, content=note_in.content)

    session.add(db_note)
    session.commit()
    session.refresh(db_note)

    return db_note


@router.get("/", response_model=list[Note])
def read_notes(session: Session = Depends(get_session)):
    notes = session.exec(select(Note)).all()
    return notes


@router.patch("/{note_id}", response_model=Note)
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notiz nicht gefunden."
        )

    update_data = note_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)

    session.add(note)
    session.commit()
    session.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notiz nicht gefunden."
        )

    session.delete(note)
    session.commit()
    return None
