from fastapi import status

def test_login_success(client, test_user):
    """
    Test that a valid user can login and receive a JWT token.
    Verifies: Correct password verification and token structure.
    """
    response = client.post(
        "/api/login",
        data={"username": "testuser", "password": "testpassword"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, test_user):
    """
    Test that an incorrect password returns a 401 Unauthorized.
    Verifies: Your verify_password logic works correctly for failures.
    """
    response = client.post(
        "/api/login",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Falscher Benutzername oder Passwort"

def test_login_non_existent_user(client):
    """
    Test that a non-existent user cannot login.
    Verifies: Database lookup logic in the login router.
    """
    response = client.post(
        "/api/login",
        data={"username": "nonexistent", "password": "anypassword"}
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
