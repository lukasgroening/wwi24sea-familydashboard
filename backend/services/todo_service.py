from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from models.todo import ToDo, ToDoCreate, ToDoUpdate
from models.user import User


def get_family_todos(session: Session, family_id: int) -> List[ToDo]:
    """Gibt alle To-Dos einer Familie zurück."""
    return session.exec(select(ToDo).where(ToDo.family_id == family_id)).all()


def get_todo_by_id(session: Session, todo_id: int, family_id: int) -> ToDo:
    """Sucht ein To-Do nach ID und prüft die Familienzugehörigkeit."""
    db_todo = session.get(ToDo, todo_id)
    if not db_todo or db_todo.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="To-Do nicht gefunden."
        )
    return db_todo


def _check_user_in_family(session: Session, user_id: int, family_id: int) -> None:
    """Prüft, ob ein User existiert und zur angegebenen Familie gehört."""
    user = session.get(User, user_id)
    if not user or user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zugewiesener Benutzer nicht gefunden oder gehört nicht zur Familie.",
        )


def create_todo(session: Session, todo_in: ToDoCreate, family_id: int) -> ToDo:
    """Erstellt ein neues To-Do für eine Familie."""
    if todo_in.user_id is not None:
        _check_user_in_family(session, todo_in.user_id, family_id)

    db_todo = ToDo(**todo_in.model_dump(), family_id=family_id)
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


def update_todo(
    session: Session, todo_id: int, todo_update: ToDoUpdate, family_id: int
) -> ToDo:
    """Aktualisiert ein bestehendes To-Do."""
    db_todo = get_todo_by_id(session, todo_id, family_id)

    if todo_update.user_id is not None:
        _check_user_in_family(session, todo_update.user_id, family_id)

    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)

    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


def delete_todo(session: Session, todo_id: int, family_id: int) -> None:
    """Löscht ein To-Do."""
    db_todo = get_todo_by_id(session, todo_id, family_id)
    session.delete(db_todo)
    session.commit()
