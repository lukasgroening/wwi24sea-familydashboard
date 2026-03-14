from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models.note import Note

router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"],
)


@router.post("/", response_model=Note)
def create_note(note: Note, session: Session = Depends(get_session)):
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


@router.get("/", response_model=list[Note])
def read_notes(session: Session = Depends(get_session)):
    notes = session.exec(select(Note)).all()
    return notes
