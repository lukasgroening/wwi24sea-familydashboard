from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database import get_session
from models.todo import ToDo, ToDoCreate, ToDoPublic, ToDoUpdate
from models.user import User
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/todos", tags=["To-Dos"], dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=ToDoPublic)
def create_todo(
    todo_in: ToDoCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Prüfen, ob der zugewiesene Benutzer in der gleichen Familie ist (falls angegeben)
    if todo_in.user_id is not None:
        user = session.get(User, todo_in.user_id)
        if not user or user.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Zugewiesener Benutzer nicht gefunden oder gehört nicht zur Familie."
            )

    db_todo = ToDo(
        **todo_in.model_dump(),
        family_id=current_user.family_id
    )

    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


@router.get("/", response_model=list[ToDoPublic])
def get_todos(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Nur To-Dos der eigenen Familie abrufen
    todos = session.exec(
        select(ToDo).where(ToDo.family_id == current_user.family_id)
    ).all()
    return todos


@router.patch("/{todo_id}", response_model=ToDoPublic)
def update_todo(
    todo_id: int, 
    todo_update: ToDoUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_todo = session.get(ToDo, todo_id)
    # Nur To-Dos der eigenen Familie bearbeiten
    if not db_todo or db_todo.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="To-Do nicht gefunden."
        )

    if todo_update.user_id is not None:
        user = session.get(User, todo_update.user_id)
        if not user or user.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Zugewiesener Benutzer nicht gefunden oder gehört nicht zur Familie."
            )

    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)

    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_todo = session.get(ToDo, todo_id)
    # Nur To-Dos der eigenen Familie löschen
    if not db_todo or db_todo.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="To-Do nicht gefunden."
        )

    session.delete(db_todo)
    session.commit()
    return None
