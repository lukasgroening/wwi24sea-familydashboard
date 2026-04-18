from fastapi import APIRouter, Query, Depends
from models.weather import WeatherPublic
from services import weather_service
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/weather", tags=["Weather"], dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=WeatherPublic)
def get_weather(
    city: str = Query(..., description="Name der Stadt (z.B. Mannheim, Nürnberg)"),
):
    """
    Abfrage der aktuellen Wetterdaten über den weather_service.
    Erfordert Authentifizierung.
    """
    return weather_service.fetch_weather_data(city)
