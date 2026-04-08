from fastapi import status
from auth import create_access_token

def test_create_note_success(client, test_user):
    """
    Test creating a note as a logged-in user.
    """
    token = create_access_token(data={"sub": test_user.username, "role": test_user.role})
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {"title": "Test Note", "content": "This is a test note content."}
    response = client.post("/api/notes/", json=payload, headers=headers)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Test Note"
    assert data["content"] == "This is a test note content."
    assert "id" in data

def test_get_notes_success(client):
    """
    Test retrieving the list of notes. 
    Note: The GET /api/notes/ endpoint in the router doesn't require authentication currently.
    """
    # Create a note first (needs auth)
    # We can use a separate session or just another request if we had one, 
    # but here we'll just check if we can get the list.
    response = client.get("/api/notes/")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
