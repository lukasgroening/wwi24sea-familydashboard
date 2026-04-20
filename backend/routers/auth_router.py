from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from database import get_session
from models.user import User, UserRegister, UserPublic
from models.family import Family
from auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from services import user_service

router = APIRouter(tags=["Authentication"])


@router.post("/api/login")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.username == form_data.username)).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falscher Benutzername oder Passwort",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Familien-Details laden falls vorhanden
    family_name = None
    join_code = None
    if user.family_id:
        family = session.get(Family, user.family_id)
        if family:
            family_name = family.name
            join_code = family.join_code

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "role": user.role,
            "id": user.id,
            "family_name": family_name,
            "join_code": join_code,
        },
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/api/register", response_model=UserPublic)
def register(
    user_in: UserRegister,
    session: Session = Depends(get_session),
):
    return user_service.register_user(session, user_in)
