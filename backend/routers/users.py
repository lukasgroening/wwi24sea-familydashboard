from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import Optional

from database import get_session
from models.user import User, UserCreate, UserPublic, UserUpdate
from dependencies import require_admin
from services import user_service

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("/roles", response_model=list[str])
def get_available_roles(_: User = Depends(require_admin)):
    """Gibt alle verfügbaren Benutzerrollen als einfache Liste zurück."""
    return user_service.get_available_roles()


@router.get("/", response_model=list[UserPublic])
def get_all_users(
    family_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    return user_service.get_all_users(session, current_user, family_id)


@router.post("/", response_model=UserPublic)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    return user_service.create_user(session, user_in, current_user)


@router.patch("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    return user_service.update_user(session, user_id, user_update, current_user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user_service.delete_user(session, user_id, current_user)
    return None
