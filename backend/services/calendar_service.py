import requests
from icalendar import Calendar
from datetime import datetime, timedelta, date, timezone
from typing import List
from models.calendar import CalendarEventPublic, CalendarSource

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
                summary = str(component.get('summary'))
                description = str(component.get('description')) if component.get('description') else None
                location = str(component.get('location')) if component.get('location') else None
                
                start = component.get('dtstart').dt
                end = component.get('dtend').dt if component.get('dtend') else start
                
                if isinstance(start, date) and not isinstance(start, datetime):
                    start = datetime.combine(start, datetime.min.time()).replace(tzinfo=timezone.utc)
                if isinstance(end, date) and not isinstance(end, datetime):
                    end = datetime.combine(end, datetime.min.time()).replace(tzinfo=timezone.utc)
                
                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)

                if start > end_threshold or end < start_threshold:
                    continue

                events.append(CalendarEventPublic(
                    title=summary,
                    description=description,
                    start_time=start,
                    end_time=end,
                    location=location,
                    color=source.color,
                    is_external=True,
                    source_name=source.name
                ))
    except Exception as e:
        print(f"Error fetching calendar source '{source.name}': {e}")
    
    return events
