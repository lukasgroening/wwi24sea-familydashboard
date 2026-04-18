from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List
from database import get_session
from dependencies import get_current_user
from models.user import User
from models.calendar import (
    CalendarEventCreate,
    CalendarEventPublic,
    CalendarSourceCreate,
    CalendarSourcePublic,
)
from services import calendar_service

router = APIRouter(
    prefix="/api/calendar", tags=["Kalender"], dependencies=[Depends(get_current_user)]
)

# --- EVENTS ---


@router.get("/events", response_model=List[CalendarEventPublic])
def get_all_events(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return calendar_service.get_all_merged_events(session, current_user.family_id)


@router.post("/events", response_model=CalendarEventPublic)
def create_local_event(
    event_in: CalendarEventCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_event = calendar_service.create_local_event(
        session, event_in, current_user.id, current_user.family_id
    )
    return CalendarEventPublic(**db_event.model_dump(), is_external=False)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_local_event(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    calendar_service.delete_local_event(session, event_id, current_user.family_id)
    return None


# --- SOURCES (External Calendars) ---


@router.get("/sources", response_model=List[CalendarSourcePublic])
def get_calendar_sources(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return calendar_service.get_calendar_sources(session, current_user.family_id)


@router.post("/sources", response_model=CalendarSourcePublic)
def add_calendar_source(
    source_in: CalendarSourceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return calendar_service.add_calendar_source(
        session, source_in, current_user.family_id
    )


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_calendar_source(
    source_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    calendar_service.remove_calendar_source(session, source_id, current_user.family_id)
    return None
