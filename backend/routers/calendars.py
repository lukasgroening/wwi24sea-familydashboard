from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from dependencies import get_current_user
from models.user import User
from models.calendar import (
    CalendarEvent, CalendarEventCreate, CalendarEventPublic,
    CalendarSource, CalendarSourceCreate, CalendarSourcePublic
)
from services.calendar_service import fetch_external_events

router = APIRouter(
    prefix="/api/calendar",
    tags=["Kalender"],
    dependencies=[Depends(get_current_user)]
)

# --- EVENTS ---

@router.get("/events", response_model=List[CalendarEventPublic])
def get_all_events(session: Session = Depends(get_session)):
    """
    Returns a merged list of local database events and external events from all active sources.
    """
    all_events: List[CalendarEventPublic] = []

    db_events = session.exec(select(CalendarEvent)).all()
    for e in db_events:
        all_events.append(CalendarEventPublic(
            id=e.id,
            title=e.title,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            location=e.location,
            color=e.color,
            is_external=False
        ))

    active_sources = session.exec(select(CalendarSource).where(CalendarSource.active)).all()
    for source in active_sources:
        external_events = fetch_external_events(source)
        all_events.extend(external_events)

    all_events.sort(key=lambda x: x.start_time)
    
    return all_events

@router.post("/events", response_model=CalendarEventPublic)
def create_local_event(
    event_in: CalendarEventCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_event = CalendarEvent(**event_in.model_dump())
    if db_event.user_id is None:
        db_event.user_id = current_user.id
        
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    
    return CalendarEventPublic(
        id=db_event.id,
        title=db_event.title,
        description=db_event.description,
        start_time=db_event.start_time,
        end_time=db_event.end_time,
        location=db_event.location,
        color=db_event.color,
        is_external=False
    )

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_local_event(event_id: int, session: Session = Depends(get_session)):
    db_event = session.get(CalendarEvent, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden.")
    
    session.delete(db_event)
    session.commit()
    return None

# --- SOURCES (External Calendars) ---

@router.get("/sources", response_model=List[CalendarSourcePublic])
def get_calendar_sources(session: Session = Depends(get_session)):
    return session.exec(select(CalendarSource)).all()

@router.post("/sources", response_model=CalendarSourcePublic)
def add_calendar_source(source_in: CalendarSourceCreate, session: Session = Depends(get_session)):
    db_source = CalendarSource(**source_in.model_dump())
    session.add(db_source)
    session.commit()
    session.refresh(db_source)
    return db_source

@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_calendar_source(source_id: int, session: Session = Depends(get_session)):
    db_source = session.get(CalendarSource, source_id)
    if not db_source:
        raise HTTPException(status_code=404, detail="Quelle nicht gefunden.")
    
    session.delete(db_source)
    session.commit()
    return None
