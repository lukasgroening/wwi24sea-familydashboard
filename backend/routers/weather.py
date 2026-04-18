import requests
import logging
from fastapi import APIRouter, HTTPException, Query, status

from models.weather import WeatherPublic

router = APIRouter(prefix="/api/weather", tags=["Weather"])

logger = logging.getLogger(__name__)

def get_weather_description(code: int) -> str:
    descriptions = {
        0: "Klarer Himmel",
        1: "Überwiegend heiter",
        2: "Teilweise bewölkt",
        3: "Bedeckt",
        45: "Nebel",
        48: "Raureifnebel",
        51: "Leichter Nieselregen",
        53: "Mäßiger Nieselregen",
        55: "Dichter Nieselregen",
        61: "Leichter Regen",
        63: "Mäßiger Regen",
        65: "Starker Regen",
        71: "Leichter Schneefall",
        73: "Mäßiger Schneefall",
        75: "Starker Schneefall",
        95: "Gewitter",
    }
    return descriptions.get(code, "Unbekannt")


@router.get("/", response_model=WeatherPublic)
def get_weather(
    city: str = Query(..., description="Name der Stadt (z.B. Mannheim, Nürnberg)"),
):
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=de"
        geo_response = requests.get(geo_url, timeout=10)
        geo_response.raise_for_status()
        geo_data = geo_response.json()

        if "results" not in geo_data or not geo_data["results"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Stadt '{city}' nicht gefunden."
            )

        location = geo_data["results"][0]
        lat = location["latitude"]
        lon = location["longitude"]
        real_city_name = location["name"]

        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        weather_response = requests.get(weather_url, timeout=10)
        weather_response.raise_for_status()
        weather_data = weather_response.json()

        if "current_weather" not in weather_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Wetterdaten konnten nicht abgerufen werden."
            )

        current = weather_data["current_weather"]

        return WeatherPublic(
            city=real_city_name,
            temperature=current["temperature"],
            windspeed=current["windspeed"],
            description=get_weather_description(current["weathercode"]),
        )
    except requests.RequestException as e:
        logger.error(f"Error fetching weather data: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Externer Wetter-Dienst nicht erreichbar."
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Unexpected error in get_weather: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ein interner Fehler ist aufgetreten."
        )
