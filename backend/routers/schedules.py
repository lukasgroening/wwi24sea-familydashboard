from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from models.schedule import (
    ScheduleEntryCreate,
    ScheduleEntryPublic,
    ScheduleEntryUpdate,
)
from models.user import User
from dependencies import get_current_user
from services import schedule_service

router = APIRouter(
    prefix="/api/schedule",
    tags=["Stundenplan"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/", response_model=ScheduleEntryPublic)
def create_schedule_entry(
    entry_in: ScheduleEntryCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return schedule_service.create_schedule_entry(
        session, entry_in, current_user.family_id
    )


@router.get("/", response_model=List[ScheduleEntryPublic])
def get_schedule_entries(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return schedule_service.get_family_schedule(session, current_user.family_id)


@router.get("/user/{user_id}", response_model=List[ScheduleEntryPublic])
def get_schedule_by_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return schedule_service.get_user_schedule(session, user_id, current_user.family_id)


@router.patch("/{entry_id}", response_model=ScheduleEntryPublic)
def update_schedule_entry(
    entry_id: int,
    entry_update: ScheduleEntryUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return schedule_service.update_schedule_entry(
        session, entry_id, entry_update, current_user.family_id
    )


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_entry(
    entry_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    schedule_service.delete_schedule_entry(session, entry_id, current_user.family_id)
    return None
