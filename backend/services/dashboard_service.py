from sqlmodel import Session, select
from typing import List, Optional
from models.widget import WidgetConfig, WidgetCreate


def get_user_widgets(session: Session, user_id: int) -> List[WidgetConfig]:
    """Gibt das Dashboard-Layout (alle Widgets) eines spezifischen Benutzers zurück."""
    statement = select(WidgetConfig).where(WidgetConfig.user_id == user_id)
    return session.exec(statement).all()


def update_user_layout(
    session: Session, user_id: int, family_id: Optional[int], widgets: List[WidgetCreate]
) -> List[WidgetConfig]:
    """Aktualisiert das Dashboard-Layout eines Benutzers durch Überschreiben der bestehenden Konfiguration."""
    # Altes Layout des Users löschen
    old_widgets = get_user_widgets(session, user_id)
    for w in old_widgets:
        session.delete(w)

    # Neues Layout speichern
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
