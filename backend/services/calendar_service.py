import requests
import logging
from icalendar import Calendar
from datetime import datetime, timedelta, date, timezone
from typing import List
from sqlmodel import Session, select
from fastapi import HTTPException, status
from models.calendar import (
    CalendarEvent,
    CalendarEventCreate,
    CalendarEventPublic,
    CalendarSource,
    CalendarSourceCreate,
)

logger = logging.getLogger(__name__)

# --- EXTERNAL API LOGIC ---


def fetch_external_events(source: CalendarSource) -> List[CalendarEventPublic]:
    """
    Fetches events from an external .ics URL and returns them as CalendarEventPublic objects.
    """
    events = []
    try:
        response = requests.get(source.url, timeout=10)
        response.raise_for_status()

        gcal = Calendar.from_ical(response.content)

        now = datetime.now(timezone.utc)
        start_threshold = now - timedelta(days=31)
        end_threshold = now + timedelta(days=365)

        for component in gcal.walk():
            if component.name == "VEVENT":
                summary = str(component.get("summary"))
                description = (
                    str(component.get("description"))
                    if component.get("description")
                    else None
                )
                location = (
                    str(component.get("location"))
                    if component.get("location")
                    else None
                )

                start = component.get("dtstart").dt
                end = component.get("dtend").dt if component.get("dtend") else start

                if isinstance(start, date) and not isinstance(start, datetime):
                    start = datetime.combine(start, datetime.min.time()).replace(
                        tzinfo=timezone.utc
                    )
                if isinstance(end, date) and not isinstance(end, datetime):
                    end = datetime.combine(end, datetime.min.time()).replace(
                        tzinfo=timezone.utc
                    )

                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)

                if start > end_threshold or end < start_threshold:
                    continue

                events.append(
                    CalendarEventPublic(
                        title=summary,
                        description=description,
                        start_time=start,
                        end_time=end,
                        location=location,
                        color=source.color,
                        is_external=True,
                        source_name=source.name,
                        family_id=source.family_id,
                    )
                )
    except Exception as e:
        logger.error(
            f"Error fetching calendar source '{source.name}' from {source.url}: {e}"
        )

    return events


# --- BUSINESS LOGIC (DB OPERATIONS) ---


def get_all_merged_events(
    session: Session, family_id: int
) -> List[CalendarEventPublic]:
    """Gibt eine kombinierte Liste aus lokalen und externen Events einer Familie zurück."""
    all_events: List[CalendarEventPublic] = []

    # 1. Lokale Events abrufen
    db_events = session.exec(
        select(CalendarEvent).where(CalendarEvent.family_id == family_id)
    ).all()
    for e in db_events:
        all_events.append(CalendarEventPublic(**e.model_dump(), is_external=False))

    # 2. Externe Events von aktiven Quellen abrufen
    active_sources = session.exec(
        select(CalendarSource).where(
            (CalendarSource.active) & (CalendarSource.family_id == family_id)
        )
    ).all()

    for source in active_sources:
        external_events = fetch_external_events(source)
        all_events.extend(external_events)

    all_events.sort(key=lambda x: x.start_time)
    return all_events


def create_local_event(
    session: Session, event_in: CalendarEventCreate, user_id: int, family_id: int
) -> CalendarEvent:
    """Erstellt ein lokales Kalender-Event."""
    db_event = CalendarEvent(
        **event_in.model_dump(), user_id=user_id, family_id=family_id
    )
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


def delete_local_event(session: Session, event_id: int, family_id: int) -> None:
    """Löscht ein lokales Kalender-Event."""
    db_event = session.get(CalendarEvent, event_id)
    if not db_event or db_event.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event nicht gefunden."
        )

    session.delete(db_event)
    session.commit()


def get_calendar_sources(session: Session, family_id: int) -> List[CalendarSource]:
    """Gibt alle Kalenderquellen einer Familie zurück."""
    return session.exec(
        select(CalendarSource).where(CalendarSource.family_id == family_id)
    ).all()


def add_calendar_source(
    session: Session, source_in: CalendarSourceCreate, family_id: int
) -> CalendarSource:
    """Fügt eine neue externe Kalenderquelle hinzu."""
    db_source = CalendarSource(**source_in.model_dump(), family_id=family_id)
    session.add(db_source)
    session.commit()
    session.refresh(db_source)
    return db_source


def remove_calendar_source(session: Session, source_id: int, family_id: int) -> None:
    """Löscht eine Kalenderquelle."""
    db_source = session.get(CalendarSource, source_id)
    if not db_source or db_source.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quelle nicht gefunden."
        )

    session.delete(db_source)
    session.commit()
