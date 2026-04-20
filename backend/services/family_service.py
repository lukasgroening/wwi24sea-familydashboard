import secrets
import string
from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from models.family import Family, FamilyCreate, FamilyPublic
from models.user import User


def generate_join_code(length: int = 12) -> str:
    """Generiert einen zufälligen, sicheren Join-Code."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def get_all_families(session: Session) -> List[FamilyPublic]:
    """Gibt alle Familien inklusive der Anzahl ihrer Mitglieder zurück."""
    families = session.exec(select(Family)).all()
    result = []
    for f in families:
        count = len(session.exec(select(User).where(User.family_id == f.id)).all())
        result.append(
            FamilyPublic(
                id=f.id, name=f.name, join_code=f.join_code, member_count=count
            )
        )
    return result


def create_family(
    session: Session, family_in: FamilyCreate, allow_commit: bool = True
) -> Family:
    """Erstellt eine neue Familie und prüft auf Namensduplikate."""
    existing = session.exec(select(Family).where(Family.name == family_in.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eine Familie mit diesem Namen existiert bereits.",
        )

    # Sicherstellen, dass der join_code eindeutig ist
    while True:
        join_code = generate_join_code()
        if not session.exec(
            select(Family).where(Family.join_code == join_code)
        ).first():
            break

    db_family = Family(name=family_in.name, join_code=join_code)
    session.add(db_family)

    if allow_commit:
        session.commit()
        session.refresh(db_family)

    return db_family


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


def regenerate_join_code(session: Session, family_id: int) -> Family:
    """Generiert einen neuen Join-Code für eine Familie."""
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Familie nicht gefunden."
        )

    while True:
        new_code = generate_join_code()
        if not session.exec(
            select(Family).where(Family.join_code == new_code)
        ).first():
            break

    family.join_code = new_code
    session.add(family)
    session.commit()
    session.refresh(family)
    return family
