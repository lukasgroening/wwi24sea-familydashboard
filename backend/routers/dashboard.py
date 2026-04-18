from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List

from database import get_session
from dependencies import get_current_user
from models.user import User
from models.widget import WidgetConfig, WidgetCreate, WidgetResponse

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/widgets", response_model=List[WidgetResponse])
def get_dashboard_widgets(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(WidgetConfig).where(WidgetConfig.user_id == current_user.id)
    widgets = session.exec(statement).all()
    return widgets


@router.put("/widgets", response_model=List[WidgetResponse])
def update_dashboard_layout(
    widgets: List[WidgetCreate],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Altes Layout des Users löschen
    old_widgets = session.exec(
        select(WidgetConfig).where(WidgetConfig.user_id == current_user.id)
    ).all()
    for w in old_widgets:
        session.delete(w)

    # Neues Layout speichern
    new_widgets = []
    for widget_data in widgets:
        db_widget = WidgetConfig.model_validate(
            widget_data, update={"user_id": current_user.id}
        )
        session.add(db_widget)
        new_widgets.append(db_widget)

    session.commit()

    for w in new_widgets:
        session.refresh(w)

    return new_widgets
