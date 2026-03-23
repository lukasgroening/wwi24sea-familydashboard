from pydantic import BaseModel


class WeatherPublic(BaseModel):
    city: str
    temperature: float
    windspeed: float
    description: str
