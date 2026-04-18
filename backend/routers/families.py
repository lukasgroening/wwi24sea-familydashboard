from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from dependencies import require_system_admin
from models.family import FamilyCreate, FamilyPublic
from services import family_service

router = APIRouter(
    prefix="/api/families",
    tags=["Familien"],
    dependencies=[Depends(require_system_admin)],
)


@router.get("/", response_model=List[FamilyPublic])
def get_families(session: Session = Depends(get_session)):
    return family_service.get_all_families(session)


@router.post("/", response_model=FamilyPublic)
def create_family(family_in: FamilyCreate, session: Session = Depends(get_session)):
    return family_service.create_family(session, family_in)


@router.delete("/{family_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family(family_id: int, session: Session = Depends(get_session)):
    family_service.delete_family(session, family_id)
    return None
