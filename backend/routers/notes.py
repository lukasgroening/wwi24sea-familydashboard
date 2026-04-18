from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from dependencies import get_current_user
from database import get_session
from models.note import Note, NoteCreate, NoteUpdate, NotePublic
from models.user import User

router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/", response_model=NotePublic)
def create_note(
    note_in: NoteCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_note = Note(
        title=note_in.title, 
        content=note_in.content,
        family_id=current_user.family_id
    )

    session.add(db_note)
    session.commit()
    session.refresh(db_note)

    return db_note


@router.get("/", response_model=list[NotePublic])
def read_notes(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    notes = session.exec(
        select(Note).where(Note.family_id == current_user.family_id)
    ).all()
    return notes


@router.patch("/{note_id}", response_model=NotePublic)
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_note = session.get(Note, note_id)
    if not db_note or db_note.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notiz nicht gefunden."
        )

    update_data = note_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)

    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_note = session.get(Note, note_id)
    if not db_note or db_note.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notiz nicht gefunden."
        )

    session.delete(db_note)
    session.commit()
    return None
