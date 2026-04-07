from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List

from database import get_session
from models.widget import WidgetConfig, WidgetCreate, WidgetResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/widgets", response_model=List[WidgetResponse])
def get_dashboard_widgets(session: Session = Depends(get_session)):
    current_user_id = 1  # TODO: Take real user ID from auth
    
    statement = select(WidgetConfig).where(WidgetConfig.user_id == current_user_id)
    widgets = session.exec(statement).all()
    return widgets

@router.put("/widgets", response_model=List[WidgetResponse])
def update_dashboard_layout(widgets: List[WidgetCreate], session: Session = Depends(get_session)):
    current_user_id = 1
    
    statement = select(WidgetConfig).where(WidgetConfig.user_id == current_user_id)
    old_widgets = session.exec(statement).all()
    for w in old_widgets:
        session.delete(w)
        
    new_widgets = []
    for widget_data in widgets:
        db_widget = WidgetConfig.model_validate(widget_data, update={"user_id": current_user_id})
        session.add(db_widget)
        new_widgets.append(db_widget)
        
    session.commit()
    
    for w in new_widgets:
        session.refresh(w)
        
    return new_widgets