from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from database import get_session
from dependencies import get_current_user
from models.user import User
from models.widget import WidgetCreate, WidgetResponse
from services import dashboard_service

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
    return dashboard_service.get_user_widgets(session, current_user.id)


@router.put("/widgets", response_model=List[WidgetResponse])
def update_dashboard_layout(
    widgets: List[WidgetCreate],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return dashboard_service.update_user_layout(
        session, current_user.id, current_user.family_id, widgets
    )
