from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from database import get_session
from models.schedule import ScheduleEntry, ScheduleEntryCreate, ScheduleEntryPublic, ScheduleEntryUpdate
from models.user import Role, User
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/schedule",
    tags=["Stundenplan"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=ScheduleEntryPublic)
def create_schedule_entry(entry_in: ScheduleEntryCreate, session: Session = Depends(get_session)):
    if entry_in.user_id is not None:
        user = session.get(User, entry_in.user_id)
        if not user:
            raise HTTPException(
                status_code=404, detail="Zugewiesener Benutzer existiert nicht."
            )

    db_entry = ScheduleEntry(**entry_in.model_dump())

    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry


@router.get("/", response_model=List[ScheduleEntryPublic])
def get_schedule_entries(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role in (Role.SYSTEM_ADMIN, Role.FAMILY_ADMIN):
        entries = session.exec(select(ScheduleEntry)).all()
    else:
        entries = session.exec(
            select(ScheduleEntry).where(ScheduleEntry.user_id == current_user.id)
        ).all()
    return entries


@router.get("/user/{user_id}", response_model=List[ScheduleEntryPublic])
def get_schedule_by_user(user_id: int, session: Session = Depends(get_session)):
    entries = session.exec(select(ScheduleEntry).where(ScheduleEntry.user_id == user_id)).all()
    return entries


@router.patch("/{entry_id}", response_model=ScheduleEntryPublic)
def update_schedule_entry(
    entry_id: int, entry_update: ScheduleEntryUpdate, session: Session = Depends(get_session)
):
    db_entry = session.get(ScheduleEntry, entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")

    if entry_update.user_id is not None:
        user = session.get(User, entry_update.user_id)
        if not user:
            raise HTTPException(
                status_code=404, detail="Zugewiesener Benutzer existiert nicht."
            )

    update_data = entry_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_entry(entry_id: int, session: Session = Depends(get_session)):
    db_entry = session.get(ScheduleEntry, entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")

    session.delete(db_entry)
    session.commit()
    return None
