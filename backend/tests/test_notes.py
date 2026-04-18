from fastapi import status
from auth import create_access_token


def test_create_note_success(client, test_user):
    """
    Test creating a note as a logged-in user.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"title": "Test Note", "content": "This is a test note content."}
    response = client.post("/api/notes/", json=payload, headers=headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Test Note"
    assert data["content"] == "This is a test note content."
    assert "id" in data


def test_get_notes_success(client, test_user):
    """
    Test retrieving the list of notes for a specific family.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/notes/", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_update_note_success(client, test_user):
    """
    Test updating a note as a logged-in user.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create a note first
    payload = {"title": "Update Me", "content": "Original content"}
    create_response = client.post("/api/notes/", json=payload, headers=headers)
    note_id = create_response.json()["id"]

    # Update the note
    update_payload = {"title": "Updated Title", "content": "Updated content"}
    response = client.patch(
        f"/api/notes/{note_id}", json=update_payload, headers=headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["content"] == "Updated content"


def test_delete_note_success(client, test_user):
    """
    Test deleting a note as a logged-in user.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create a note first
    payload = {"title": "Delete Me", "content": "I will be deleted"}
    create_response = client.post("/api/notes/", json=payload, headers=headers)
    note_id = create_response.json()["id"]

    # Delete the note
    response = client.delete(f"/api/notes/{note_id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's gone
    get_response = client.get("/api/notes/", headers=headers)
    notes = get_response.json()
    assert not any(n["id"] == note_id for n in notes)
