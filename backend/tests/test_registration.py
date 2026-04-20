from fastapi import status
from models.user import Role


def test_register_new_family(client):
    """Test registering a new user and creating a new family."""
    response = client.post(
        "/api/register",
        json={
            "username": "newuser",
            "password": "newpassword",
            "family_name": "New Family"
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "newuser"
    assert data["role"] == Role.FAMILY_ADMIN
    assert data["family_id"] is not None


def test_register_join_family(client, test_family):
    """Test registering a new user and joining an existing family using join_code."""
    response = client.post(
        "/api/register",
        json={
            "username": "joineduser",
            "password": "joinedpassword",
            "join_code": test_family.join_code
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "joineduser"
    assert data["role"] == Role.USER
    assert data["family_id"] == test_family.id


def test_register_missing_info(client):
    """Test registration failure when both join_code and family_name are missing."""
    response = client.post(
        "/api/register",
        json={
            "username": "failuser",
            "password": "failpassword"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Bitte geben Sie entweder einen Join-Code an oder erstellen Sie eine neue Familie." in response.json()["detail"]


def test_register_duplicate_username(client, test_user):
    """Test registration failure when username is already taken."""
    response = client.post(
        "/api/register",
        json={
            "username": "testuser",
            "password": "anypassword",
            "family_name": "Some Family"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Benutzername ist bereits vergeben." in response.json()["detail"]


def test_register_duplicate_family_name(client, test_family):
    """Test registration failure when family name is already taken."""
    response = client.post(
        "/api/register",
        json={
            "username": "otheruser",
            "password": "otherpassword",
            "family_name": test_family.name
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Eine Familie mit diesem Namen existiert bereits." in response.json()["detail"]


def test_register_invalid_join_code(client):
    """Test registration failure with an invalid join code."""
    response = client.post(
        "/api/register",
        json={
            "username": "invalidcodeuser",
            "password": "password",
            "join_code": "NONEXISTENT"
        }
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Der angegebene Join-Code ist ungültig." in response.json()["detail"]


def test_register_mutual_exclusion(client):
    """Test registration failure when both join_code and family_name are provided."""
    response = client.post(
        "/api/register",
        json={
            "username": "bothuser",
            "password": "password",
            "join_code": "SOMECODE",
            "family_name": "New Family"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Bitte geben Sie entweder einen Join-Code an ODER einen Familiennamen, nicht beides." in response.json()["detail"]
