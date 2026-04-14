from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Optional

from database import get_session
from models.user import Role, User, UserCreate, UserPublic, UserUpdate
from auth import get_password_hash
from dependencies import require_admin

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("/roles", response_model=list[str])
def get_available_roles(_: User = Depends(require_admin)):
    """Gibt alle verfügbaren Benutzerrollen als einfache Liste zurück."""
    return [role.value for role in Role]


@router.get("/", response_model=list[UserPublic])
def get_all_users(
    family_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """
    System-Admin: sieht alle User (optional nach family_id gefiltert).
    Familien-Admin: sieht nur User aus seiner eigenen Familie.
    """
    if current_user.role == Role.SYSTEM_ADMIN:
        if family_id is not None:
            users = session.exec(select(User).where(User.family_id == family_id)).all()
        else:
            users = session.exec(select(User)).all()
    else:
        # Familien-Admin sieht nur seine Familie
        users = session.exec(
            select(User).where(User.family_id == current_user.family_id)
        ).all()
    return users


@router.post("/", response_model=UserPublic)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    existing_user = session.exec(
        select(User).where(User.username == user_in.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Benutzername ist bereits vergeben."
        )

    # Familien-Admin kann nur User in seiner eigenen Familie anlegen
    family_id = user_in.family_id
    if current_user.role == Role.FAMILY_ADMIN:
        family_id = current_user.family_id

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        hashed_password=hashed_password,
        role=user_in.role,
        family_id=family_id,
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


def _check_last_admin(session: Session, user: User, action: str):
    """Prüft, ob versucht wird, den letzten Administrator zu löschen oder zu degradieren."""
    if user.role in [Role.FAMILY_ADMIN, Role.SYSTEM_ADMIN]:
        admins = session.exec(
            select(User).where(
                (User.role == Role.FAMILY_ADMIN) | (User.role == Role.SYSTEM_ADMIN)
            )
        ).all()
        if len(admins) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Aktion abgelehnt: Der letzte Administrator kann nicht {action} werden.",
            )


@router.patch("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Benutzer nicht gefunden."
        )

    # Familien-Admin darf nur User aus seiner Familie bearbeiten
    if current_user.role == Role.FAMILY_ADMIN and user.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert. Dieser Benutzer gehört nicht zu deiner Familie.",
        )

    if user_update.role is not None and user_update.role == Role.USER:
        _check_last_admin(session, user, "zu einem normalen Nutzer degradiert")

    update_data = user_update.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Benutzer nicht gefunden."
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Du kannst deinen eigenen Account nicht löschen.",
        )

    # Familien-Admin darf nur User aus seiner Familie löschen
    if current_user.role == Role.FAMILY_ADMIN and user.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert. Dieser Benutzer gehört nicht zu deiner Familie.",
        )

    _check_last_admin(session, user, "gelöscht")

    session.delete(user)
    session.commit()
    return None
