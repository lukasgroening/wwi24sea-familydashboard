from sqlmodel import Session, select
from typing import List, Optional
from fastapi import HTTPException, status
from models.user import User, UserCreate, UserPublic, UserUpdate, UserRegister, Role
from models.family import Family, FamilyCreate
from auth import get_password_hash
from services import family_service


def get_available_roles() -> List[str]:
    """Gibt alle verfügbaren Benutzerrollen zurück."""
    return [role.value for role in Role]


def get_all_users(
    session: Session, current_user: User, family_id: Optional[int] = None
) -> List[User]:
    """
    Gibt Benutzer zurück.
    System-Admin sieht alle (optional gefiltert).
    Familien-Admin sieht nur seine Familie.
    """
    if current_user.role == Role.SYSTEM_ADMIN:
        if family_id is not None:
            return session.exec(select(User).where(User.family_id == family_id)).all()
        return session.exec(select(User)).all()

    # Familien-Admin sieht nur seine Familie
    return session.exec(
        select(User).where(User.family_id == current_user.family_id)
    ).all()


def _check_username_exists(
    session: Session, username: str, exclude_id: Optional[int] = None
) -> None:
    """Prüft, ob ein Benutzername bereits vergeben ist."""
    statement = select(User).where(User.username == username)
    if exclude_id:
        statement = statement.where(User.id != exclude_id)

    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Benutzername ist bereits vergeben.",
        )


def _check_last_admin(session: Session, user: User, action: str) -> None:
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


def create_user(session: Session, user_in: UserCreate, current_user: User) -> User:
    """Erstellt einen neuen Benutzer."""
    _check_username_exists(session, user_in.username)

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


def update_user(
    session: Session, user_id: int, user_update: UserUpdate, current_user: User
) -> User:
    """Aktualisiert einen Benutzer."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Benutzer nicht gefunden."
        )

    # Familien-Admin darf nur User aus seiner Familie bearbeiten
    if (
        current_user.role == Role.FAMILY_ADMIN
        and user.family_id != current_user.family_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert. Dieser Benutzer gehört nicht zu deiner Familie.",
        )

    if user_update.role is not None and user_update.role == Role.USER:
        _check_last_admin(session, user, "zu einem normalen Nutzer degradiert")

    if user_update.username is not None and user_update.username != user.username:
        _check_username_exists(session, user_update.username, exclude_id=user_id)

    update_data = user_update.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def delete_user(session: Session, user_id: int, current_user: User) -> None:
    """Löscht einen Benutzer."""
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
    if (
        current_user.role == Role.FAMILY_ADMIN
        and user.family_id != current_user.family_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert. Dieser Benutzer gehört nicht zu deiner Familie.",
        )

    _check_last_admin(session, user, "gelöscht")

    session.delete(user)
    session.commit()


def register_user(session: Session, user_in: UserRegister) -> User:
    """Registriert einen neuen Benutzer und erstellt ggf. eine neue Familie."""
    _check_username_exists(session, user_in.username)

    if not user_in.join_code and not user_in.family_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitte geben Sie entweder einen Join-Code an oder erstellen Sie eine neue Familie.",
        )

    if user_in.join_code and user_in.family_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitte geben Sie entweder einen Join-Code an ODER einen Familiennamen, nicht beides.",
        )

    role = Role.USER
    family_id = None

    if user_in.family_name:
        # Neue Familie vorbereiten (ohne commit)
        new_family = family_service.create_family(
            session, FamilyCreate(name=user_in.family_name), allow_commit=False
        )
        session.flush()  # Weist die ID zu, ohne zu committen
        family_id = new_family.id
        role = Role.FAMILY_ADMIN
    else:
        # Bestehender Familie beitreten
        family = session.exec(
            select(Family).where(Family.join_code == user_in.join_code)
        ).first()
        if not family:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Der angegebene Join-Code ist ungültig.",
            )
        family_id = family.id

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        hashed_password=hashed_password,
        role=role,
        family_id=family_id,
    )

    session.add(new_user)
    session.commit()  # Committet Familie UND User gleichzeitig
    session.refresh(new_user)
    
    # join_code für die Antwort laden
    final_join_code = None
    if family_id:
        family = session.get(Family, family_id)
        if family:
            final_join_code = family.join_code
            
    return UserPublic(
        id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        family_id=new_user.family_id,
        join_code=final_join_code
    )
