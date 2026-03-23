from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from dependencies import get_current_user
from database import get_session
from models.note import Note, NoteCreate
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
    print(f"Notiz wird erstellt von: {current_user.username}")

    db_note = Note(title=note_in.title, content=note_in.content)

    session.add(db_note)
    session.commit()
    session.refresh(db_note)

    return db_note


@router.get("/", response_model=list[Note])
def read_notes(session: Session = Depends(get_session)):
    notes = session.exec(select(Note)).all()
    return notes
