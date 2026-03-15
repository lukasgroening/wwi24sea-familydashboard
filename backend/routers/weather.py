import requests
from fastapi import APIRouter, HTTPException, Query

from models.weather import WeatherPublic

router = APIRouter(prefix="/api/weather", tags=["Weather"])


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
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=de"
    geo_response = requests.get(geo_url)
    geo_data = geo_response.json()

    if "results" not in geo_data:
        raise HTTPException(status_code=404, detail=f"Stadt '{city}' nicht gefunden.")

    location = geo_data["results"][0]
    lat = location["latitude"]
    lon = location["longitude"]
    real_city_name = location["name"]

    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    weather_response = requests.get(weather_url)
    weather_data = weather_response.json()

    if "current_weather" not in weather_data:
        raise HTTPException(
            status_code=500, detail="Wetterdaten konnten nicht abgerufen werden."
        )

    current = weather_data["current_weather"]

    return WeatherPublic(
        city=real_city_name,
        temperature=current["temperature"],
        windspeed=current["windspeed"],
        description=get_weather_description(current["weathercode"]),
    )
