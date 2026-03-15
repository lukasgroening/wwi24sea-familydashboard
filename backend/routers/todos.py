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
def create_todo(todo_in: ToDoCreate, session: Session = Depends(get_session)):
    if todo_in.user_id is not None:
        user = session.get(User, todo_in.user_id)
        if not user:
            raise HTTPException(
                status_code=404, detail="Zugewiesener Benutzer existiert nicht."
            )

    db_todo = ToDo(**todo_in.model_dump())

    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


@router.get("/", response_model=list[ToDoPublic])
def get_todos(session: Session = Depends(get_session)):
    todos = session.exec(select(ToDo)).all()
    return todos


@router.patch("/{todo_id}", response_model=ToDoPublic)
def update_todo(
    todo_id: int, todo_update: ToDoUpdate, session: Session = Depends(get_session)
):
    db_todo = session.get(ToDo, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="To-Do nicht gefunden.")

    if todo_update.user_id is not None:
        user = session.get(User, todo_update.user_id)
        if not user:
            raise HTTPException(
                status_code=404, detail="Zugewiesener Benutzer existiert nicht."
            )

    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)

    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, session: Session = Depends(get_session)):
    db_todo = session.get(ToDo, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="To-Do nicht gefunden.")

    session.delete(db_todo)
    session.commit()
    return None
