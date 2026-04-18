from fastapi import status
from auth import create_access_token


def test_create_todo_success(client, test_user):
    """
    Test that a logged-in user can create a todo.
    Verifies: CRUD (Create) and Authorization.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"title": "New Test Task"}
    response = client.post("/api/todos/", json=payload, headers=headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "New Test Task"
    assert "id" in data


def test_get_todos_success(client, test_user):
    """
    Test that a logged-in user can retrieve the todo list.
    Verifies: CRUD (Read).
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create one first
    client.post("/api/todos/", json={"title": "Existing Task"}, headers=headers)

    response = client.get("/api/todos/", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) >= 1


def test_update_todo_status(client, test_user):
    """
    Test updating a todo's completion status.
    Verifies: CRUD (Update).
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    res = client.post("/api/todos/", json={"title": "Update Me"}, headers=headers)
    todo_id = res.json()["id"]

    # Update
    response = client.patch(
        f"/api/todos/{todo_id}", json={"is_completed": True}, headers=headers
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_completed"] is True


def test_delete_todo_success(client, test_user):
    """
    Test deleting a todo.
    Verifies: CRUD (Delete).
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    res = client.post("/api/todos/", json={"title": "Delete Me"}, headers=headers)
    todo_id = res.json()["id"]

    # Delete
    response = client.delete(f"/api/todos/{todo_id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's gone
    get_res = client.get("/api/todos/", headers=headers)
    assert not any(t["id"] == todo_id for t in get_res.json())


def test_delete_todo_not_found(client, test_user):
    """
    Test that deleting a non-existent todo returns 404.
    Verifies: Error handling.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.delete("/api/todos/9999", headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
