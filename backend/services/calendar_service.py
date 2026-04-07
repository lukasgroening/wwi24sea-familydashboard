import requests
from icalendar import Calendar
from datetime import datetime, timedelta, date
from typing import List
from models.calendar import CalendarEventPublic, CalendarSource
import pytz

def fetch_external_events(source: CalendarSource) -> List[CalendarEventPublic]:
    """
    Fetches events from an external .ics URL and returns them as CalendarEventPublic objects.
    """
    events = []
    try:
        # 1. Fetch the ICS content
        response = requests.get(source.url, timeout=10)
        response.raise_for_status()
        
        # 2. Parse the calendar
        gcal = Calendar.from_ical(response.content)
        
        # We only want events within a reasonable timeframe (e.g., -1 month to +1 year)
        now = datetime.now(pytz.UTC)
        start_threshold = now - timedelta(days=31)
        end_threshold = now + timedelta(days=365)

        for component in gcal.walk():
            if component.name == "VEVENT":
                summary = str(component.get('summary'))
                description = str(component.get('description')) if component.get('description') else None
                location = str(component.get('location')) if component.get('location') else None
                
                start = component.get('dtstart').dt
                end = component.get('dtend').dt if component.get('dtend') else start
                
                # Normalize to datetime (some are just 'date' objects)
                if isinstance(start, date) and not isinstance(start, datetime):
                    start = datetime.combine(start, datetime.min.time()).replace(tzinfo=pytz.UTC)
                if isinstance(end, date) and not isinstance(end, datetime):
                    end = datetime.combine(end, datetime.min.time()).replace(tzinfo=pytz.UTC)
                
                # Ensure tzinfo is present (assume UTC if missing)
                if start.tzinfo is None:
                    start = start.replace(tzinfo=pytz.UTC)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=pytz.UTC)

                # Filter by timeframe
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
        # In a real app, we might want to log this or return a partial result
    
    return events
