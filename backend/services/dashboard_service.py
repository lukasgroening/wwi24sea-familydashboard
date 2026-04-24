from sqlmodel import Session, select
from typing import List, Optional
from models.widget import WidgetConfig, WidgetCreate
from models.family import Family

DEFAULT_WIDGETS = [
    {
        "type": "weather",
        "x": 0, "y": 0, "w": 3, "h": 4,
        "settings": {
            "locationName": "Frankfurt am Main",
            "locationLat": 50.1155,
            "locationLon": 8.68417,
            "locationCountry": "DE",
            "temperatureUnit": "celsius",
            "showForecast": True,
            "showMeteogram": True,
            "forecastDays": 7,
        },
    },
    {
        "type": "calendar",
        "x": 3, "y": 0, "w": 6, "h": 5,
        "settings": {
            "defaultView": "month",
            "showWeekends": True,
            "weekStartHour": 6,
            "weekEndHour": 22,
        },
    },
    {
        "type": "todo",
        "x": 9, "y": 0, "w": 3, "h": 3,
        "settings": {},
    },
    {
        "type": "schedule",
        "x": 0, "y": 4, "w": 8, "h": 3,
        "settings": {},
    },
]


def get_dashboard_widgets(session: Session, user_id: int, family_id: Optional[int]) -> List[WidgetConfig]:
    """
    Gibt das Dashboard-Layout zurück. 
    Wenn family_id vorhanden ist, werden die Widgets der Familie geladen.
    Ansonsten die Widgets des spezifischen Benutzers.
    """
    if family_id:
        statement = select(WidgetConfig).where(WidgetConfig.family_id == family_id)
    else:
        statement = select(WidgetConfig).where(WidgetConfig.user_id == user_id)
    
    return session.exec(statement).all()


def initialize_default_widgets(session: Session, user_id: int, family_id: Optional[int]) -> None:
    """Erstellt die Standard-Widgets für eine neue Familie oder einen neuen Nutzer."""
    for w_data in DEFAULT_WIDGETS:
        db_widget = WidgetConfig(
            type=w_data["type"],
            x=w_data["x"],
            y=w_data["y"],
            w=w_data["w"],
            h=w_data["h"],
            settings=w_data["settings"],
            user_id=user_id,
            family_id=family_id
        )
        session.add(db_widget)


def update_dashboard_layout(
    session: Session, user_id: int, family_id: Optional[int], widgets: List[WidgetCreate]
) -> List[WidgetConfig]:
    """
    Aktualisiert das Dashboard-Layout mit Locking gegen Race Conditions.
    """
    # 1. Sperre setzen (Locking)
    # Wir sperren die Familien-Zeile (oder den User), damit niemand anderes gleichzeitig das Layout ändern kann.
    if family_id:
        # SELECT ... FOR UPDATE sperrt die Zeile in Postgres bis zum commit
        session.get(Family, family_id, with_for_update=True)
        old_widgets = session.exec(select(WidgetConfig).where(WidgetConfig.family_id == family_id)).all()
    else:
        # Hier könnte man die User-Zeile sperren, falls nötig
        old_widgets = session.exec(select(WidgetConfig).where(WidgetConfig.user_id == user_id)).all()
        
    # 2. Altes Layout löschen
    for w in old_widgets:
        session.delete(w)

    # 3. Neues Layout speichern
    new_widgets = []
    for widget_data in widgets:
        db_widget = WidgetConfig.model_validate(
            widget_data, update={"user_id": user_id, "family_id": family_id}
        )
        session.add(db_widget)
        new_widgets.append(db_widget)

    session.commit()

    for w in new_widgets:
        session.refresh(w)

    return new_widgets
