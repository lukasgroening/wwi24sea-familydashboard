from unittest.mock import patch, MagicMock
from fastapi import status
from auth import create_access_token


def test_get_weather_success(client, test_user):
    """
    Test successful weather retrieval by mocking external API calls.
    Verifies: Mocking external dependencies and response mapping.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Define mock data for the geocoding API
    mock_geo_data = {
        "results": [{"latitude": 49.4891, "longitude": 8.4662, "name": "Mannheim"}]
    }

    # Define mock data for the weather API
    mock_weather_data = {
        "current_weather": {"temperature": 15.5, "windspeed": 10.2, "weathercode": 0}
    }

    with patch("requests.get") as mock_get:
        # Geocoding response
        res1 = MagicMock()
        res1.json.return_value = mock_geo_data
        res1.status_code = 200

        # Weather response
        res2 = MagicMock()
        res2.json.return_value = mock_weather_data
        res2.status_code = 200

        mock_get.side_effect = [res1, res2]

        response = client.get("/api/weather/?city=Mannheim", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["city"] == "Mannheim"
        assert data["temperature"] == 15.5
        assert data["description"] == "Klarer Himmel"


def test_get_weather_city_not_found(client, test_user):
    """
    Test error handling when a city is not found by the geocoding API.
    Verifies: API error mapping.
    """
    token = create_access_token(
        data={"sub": test_user.username, "role": test_user.role}
    )
    headers = {"Authorization": f"Bearer {token}"}

    mock_geo_data = {"error": "not found"}  # No 'results' key

    with patch("requests.get") as mock_get:
        res = MagicMock()
        res.json.return_value = mock_geo_data
        mock_get.return_value = res

        response = client.get("/api/weather/?city=NonExistentCity", headers=headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "nicht gefunden" in response.json()["detail"]
