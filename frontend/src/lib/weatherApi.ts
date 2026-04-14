import axios from 'axios'
import api from './api'


//  ALTERNATIVE API:
//  Meteoblue API – Key liegt in .env (VITE_METEOBLUE_API_KEY)
//  Docs: https://docs.meteoblue.com/en/weather-apis/packages-api/introduction


const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'


export interface GeoLocation {
  name: string
  displayName: string
  lat: number
  lon: number
  country: string
}

export interface WeatherData {
  city: string
  temperature: number
  windspeed: number
  description: string
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const { data } = await api.get<WeatherData>('/api/weather/', {
    params: { city },
  })
  return data
}

export async function searchCities(query: string, limit = 5): Promise<GeoLocation[]> {
  if (!query.trim()) return []
  const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
    params: {
      q: query,
      format: 'json',
      limit,
      addressdetails: 1,
    },
    headers: {
      'Accept-Language': 'de',
    },
  })

  return data
    .filter((r: Record<string, unknown>) => {
      const type = r.type as string
      return ['city', 'town', 'village', 'municipality', 'administrative'].includes(type)
        || (r.class as string) === 'place'
    })
    .slice(0, limit)
    .map((r: Record<string, unknown>) => {
      const address = r.address as Record<string, string> | undefined
      return {
        name: (address?.city || address?.town || address?.village || address?.municipality || r.name) as string,
        displayName: r.display_name as string,
        lat: parseFloat(r.lat as string),
        lon: parseFloat(r.lon as string),
        country: address?.country_code?.toUpperCase() ?? '',
      }
    })
}
