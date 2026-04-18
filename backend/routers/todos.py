from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from dependencies import get_current_user
from database import get_session
from models.todo import ToDoCreate, ToDoPublic, ToDoUpdate
from models.user import User
from services import todo_service

router = APIRouter(
    prefix="/api/todos",
    tags=["To-Dos"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/", response_model=ToDoPublic)
def create_todo(
    todo_in: ToDoCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return todo_service.create_todo(session, todo_in, current_user.family_id)


@router.get("/", response_model=list[ToDoPublic])
def read_todos(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return todo_service.get_family_todos(session, current_user.family_id)


@router.patch("/{todo_id}", response_model=ToDoPublic)
def update_todo(
    todo_id: int,
    todo_update: ToDoUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return todo_service.update_todo(
        session, todo_id, todo_update, current_user.family_id
    )


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    todo_service.delete_todo(session, todo_id, current_user.family_id)
    return None
