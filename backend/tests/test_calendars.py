from unittest.mock import patch
from fastapi import status
from auth import create_access_token


@patch("services.calendar_service.fetch_external_events")
def test_get_calendar_events_success(mock_fetch, client, test_user):
    """
    Test retrieving all calendar events with mocked external events.
    """
    mock_fetch.return_value = []
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create an active source to trigger the mock
    client.post(
        "/api/calendar/sources",
        json={
            "name": "Test Source",
            "url": "http://example.com/test.ics",
            "active": True,
        },
        headers=headers,
    )

    response = client.get("/api/calendar/events", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    mock_fetch.assert_called()


def test_create_local_event_success(client, test_user):
    """
    Test creating a local calendar event.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Family Dinner",
        "description": "Weekly gathering",
        "start_time": "2023-12-24T18:00:00",
        "end_time": "2023-12-24T21:00:00",
        "location": "Dining Room",
        "color": "#FF0000",
        "user_id": test_user.id,
    }
    response = client.post("/api/calendar/events", json=payload, headers=headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Family Dinner"
    assert "id" in data


def test_delete_local_event_success(client, test_user):
    """
    Test deleting a local calendar event.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    create_res = client.post(
        "/api/calendar/events",
        json={
            "title": "Delete Me",
            "start_time": "2023-12-25T10:00:00",
            "end_time": "2023-12-25T11:00:00",
        },
        headers=headers,
    )
    event_id = create_res.json()["id"]

    # Delete
    response = client.delete(f"/api/calendar/events/{event_id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify (must mock fetch_external_events again for GET)
    with patch("services.calendar_service.fetch_external_events", return_value=[]):
        get_res = client.get("/api/calendar/events", headers=headers)
        assert not any(event["id"] == event_id for event in get_res.json())


def test_get_calendar_sources_success(client, test_user):
    """
    Test retrieving calendar sources.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/calendar/sources", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_add_calendar_source_success(client, test_user):
    """
    Test adding a calendar source.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Google Calendar",
        "url": "https://calendar.google.com/calendar/ical/example/public/basic.ics",
        "color": "#4285F4",
    }
    response = client.post("/api/calendar/sources", json=payload, headers=headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Google Calendar"
    assert data["url"] == payload["url"]
    assert "id" in data


def test_remove_calendar_source_success(client, test_user):
    """
    Test removing a calendar source.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    create_res = client.post(
        "/api/calendar/sources",
        json={"name": "Delete Source", "url": "https://example.com/delete.ics"},
        headers=headers,
    )
    source_id = create_res.json()["id"]

    # Delete
    response = client.delete(f"/api/calendar/sources/{source_id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify
    get_res = client.get("/api/calendar/sources", headers=headers)
    assert not any(source["id"] == source_id for source in get_res.json())
