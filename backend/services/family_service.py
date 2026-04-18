from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from models.family import Family, FamilyCreate, FamilyPublic
from models.user import User


def get_all_families(session: Session) -> List[FamilyPublic]:
    """Gibt alle Familien inklusive der Anzahl ihrer Mitglieder zurück."""
    families = session.exec(select(Family)).all()
    result = []
    for f in families:
        count = len(session.exec(select(User).where(User.family_id == f.id)).all())
        result.append(FamilyPublic(id=f.id, name=f.name, member_count=count))
    return result


def create_family(session: Session, family_in: FamilyCreate) -> FamilyPublic:
    """Erstellt eine neue Familie und prüft auf Namensduplikate."""
    existing = session.exec(select(Family).where(Family.name == family_in.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eine Familie mit diesem Namen existiert bereits.",
        )

    db_family = Family(name=family_in.name)
    session.add(db_family)
    session.commit()
    session.refresh(db_family)

    return FamilyPublic(id=db_family.id, name=db_family.name, member_count=0)


def delete_family(session: Session, family_id: int) -> None:
    """Löscht eine Familie und setzt die family_id aller Mitglieder auf None."""
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Familie nicht gefunden."
        )

    # family_id bei allen Mitgliedern entfernen, um Fremdschlüssel-Konflikte zu vermeiden
    members = session.exec(select(User).where(User.family_id == family_id)).all()
    for member in members:
        member.family_id = None
        session.add(member)

    session.delete(family)
    session.commit()
