from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from dependencies import get_current_user
from database import get_session
from models.note import NoteCreate, NoteUpdate, NotePublic
from models.user import User
from services import note_service

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
    return note_service.create_note(session, note_in, current_user.family_id)


@router.get("/", response_model=list[NotePublic])
def read_notes(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return note_service.get_family_notes(session, current_user.family_id)


@router.patch("/{note_id}", response_model=NotePublic)
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return note_service.update_note(
        session, note_id, note_update, current_user.family_id
    )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    note_service.delete_note(session, note_id, current_user.family_id)
    return None
