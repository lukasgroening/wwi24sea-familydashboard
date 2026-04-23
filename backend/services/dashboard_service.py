from sqlmodel import Session, select
from typing import List, Optional
from models.widget import WidgetConfig, WidgetCreate


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


def update_dashboard_layout(
    session: Session, user_id: int, family_id: Optional[int], widgets: List[WidgetCreate]
) -> List[WidgetConfig]:
    """
    Aktualisiert das Dashboard-Layout.
    Wenn family_id vorhanden ist, wird das Layout für die gesamte Familie aktualisiert.
    Ansonsten nur für den Benutzer.
    """
    # Altes Layout löschen
    if family_id:
        old_widgets = session.exec(select(WidgetConfig).where(WidgetConfig.family_id == family_id)).all()
    else:
        old_widgets = session.exec(select(WidgetConfig).where(WidgetConfig.user_id == user_id)).all()
        
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
