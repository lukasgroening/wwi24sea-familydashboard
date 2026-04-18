from fastapi import status
from auth import create_access_token


def test_create_schedule_entry_success(client, test_user):
    """
    Test creating a schedule entry as a logged-in user.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "subject": "Mathematik",
        "day_of_week": "Montag",
        "start_time": "08:00:00",
        "end_time": "09:30:00",
        "room": "B123",
        "teacher": "Dr. Schmidt",
        "user_id": test_user.id,
    }
    response = client.post("/api/schedule/", json=payload, headers=headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["subject"] == "Mathematik"
    assert data["user_id"] == test_user.id
    assert "id" in data


def test_get_schedule_entries_success(client, test_user):
    """
    Test retrieving all schedule entries.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/schedule/", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_get_schedule_by_user_success(client, test_user):
    """
    Test retrieving schedule entries for a specific user.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create an entry first
    client.post(
        "/api/schedule/",
        json={
            "subject": "User Specific",
            "day_of_week": "Dienstag",
            "start_time": "10:00:00",
            "end_time": "11:30:00",
            "user_id": test_user.id,
        },
        headers=headers,
    )

    response = client.get(f"/api/schedule/user/{test_user.id}", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert any(entry["subject"] == "User Specific" for entry in data)


def test_update_schedule_entry_success(client, test_user):
    """
    Test updating a schedule entry.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    create_res = client.post(
        "/api/schedule/",
        json={
            "subject": "Old Subject",
            "day_of_week": "Mittwoch",
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "user_id": test_user.id,
        },
        headers=headers,
    )
    entry_id = create_res.json()["id"]

    # Update
    update_payload = {"subject": "New Subject", "room": "C456"}
    response = client.patch(
        f"/api/schedule/{entry_id}", json=update_payload, headers=headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["subject"] == "New Subject"
    assert data["room"] == "C456"


def test_delete_schedule_entry_success(client, test_user):
    """
    Test deleting a schedule entry.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    create_res = client.post(
        "/api/schedule/",
        json={
            "subject": "Delete Me",
            "day_of_week": "Donnerstag",
            "start_time": "14:00:00",
            "end_time": "15:00:00",
            "user_id": test_user.id,
        },
        headers=headers,
    )
    entry_id = create_res.json()["id"]

    # Delete
    response = client.delete(f"/api/schedule/{entry_id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's gone
    get_res = client.get("/api/schedule/", headers=headers)
    assert not any(entry["id"] == entry_id for entry in get_res.json())
