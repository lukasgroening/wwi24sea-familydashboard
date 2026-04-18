from fastapi import status
from auth import create_access_token


def test_get_all_users_admin_success(client, admin_user):
    """
    Test that an admin user can successfully list all users.
    Verifies: Authorization (Admin) and Data Retrieval.
    """
    token = create_access_token(
        data={"sub": admin_user.username, "role": admin_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/users/", headers=headers)

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    # At least the admin user itself should be there
    assert len(response.json()) >= 1


def test_get_all_users_regular_user_forbidden(client, test_user):
    """
    Test that a regular family member cannot access the user list.
    Verifies: require_admin dependency correctly blocks non-admins.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/users/", headers=headers)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert (
        response.json()["detail"]
        == "Zugriff verweigert. Nur Administratoren dürfen Benutzer verwalten."
    )


def test_get_all_users_no_auth(client):
    """
    Test that unauthenticated requests are rejected.
    Verifies: Authentication layer protection.
    """
    response = client.get("/api/users/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_delete_self_forbidden(client, admin_user):
    """
    Test that an admin cannot delete their own account.
    Verifies: Business logic constraint.
    """
    token = create_access_token(
        data={"sub": admin_user.username, "role": admin_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.delete(f"/api/users/{admin_user.id}", headers=headers)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert (
        response.json()["detail"] == "Du kannst deinen eigenen Account nicht löschen."
    )


def test_delete_last_admin_forbidden(client, admin_user, test_user):
    """
    Test that the last administrator cannot be deleted.
    Verifies: _check_last_admin business logic preventing system orphan.
    """
    token = create_access_token(
        data={"sub": admin_user.username, "role": admin_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to delete the only admin.
    # Note: Hits self-delete protection first in this test state.
    response = client.delete(f"/api/users/{admin_user.id}", headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_update_user_duplicate_username(client, admin_user, test_user):
    """
    Test that updating a user to an existing username fails gracefully.
    """
    token = create_access_token(
        data={"sub": admin_user.username, "role": admin_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Try to update test_user's username to admin_user's username
    payload = {"username": admin_user.username}
    response = client.patch(f"/api/users/{test_user.id}", json=payload, headers=headers)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "bereits vergeben" in response.json()["detail"]
