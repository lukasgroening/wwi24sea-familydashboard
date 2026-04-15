from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from database import get_session
from dependencies import require_system_admin
from models.family import Family, FamilyCreate, FamilyPublic
from models.user import User

router = APIRouter(
    prefix="/api/families",
    tags=["Familien"],
    dependencies=[Depends(require_system_admin)],
)


@router.get("/", response_model=List[FamilyPublic])
def get_families(session: Session = Depends(get_session)):
    families = session.exec(select(Family)).all()
    result = []
    for f in families:
        count = len(session.exec(select(User).where(User.family_id == f.id)).all())
        result.append(FamilyPublic(id=f.id, name=f.name, member_count=count))
    return result


@router.post("/", response_model=FamilyPublic)
def create_family(family_in: FamilyCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Family).where(Family.name == family_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Eine Familie mit diesem Namen existiert bereits.")
    db_family = Family(name=family_in.name)
    session.add(db_family)
    session.commit()
    session.refresh(db_family)
    return FamilyPublic(id=db_family.id, name=db_family.name, member_count=0)


@router.delete("/{family_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family(family_id: int, session: Session = Depends(get_session)):
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(status_code=404, detail="Familie nicht gefunden.")
    # family_id bei allen Mitgliedern entfernen
    members = session.exec(select(User).where(User.family_id == family_id)).all()
    for member in members:
        member.family_id = None
        session.add(member)
    session.delete(family)
    session.commit()
    return None
