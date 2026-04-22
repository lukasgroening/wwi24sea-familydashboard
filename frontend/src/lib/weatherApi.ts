import api from './api'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

/* ── Types ────────────────────────────────────────── */

export interface GeoLocation {
  name: string
  displayName: string
  lat: number
  lon: number
  country: string
}

/** Matches the backend WeatherPublic model */
export interface WeatherData {
  city: string
  temperature: number
  windspeed: number
  description: string
}

/* ── Backend Weather Fetch ────────────────────────── */

export async function fetchWeather(city: string): Promise<WeatherData> {
  const { data } = await api.get<WeatherData>('/api/weather/', {
    params: { city },
  })
  return data
}

/* ── Geocoding via Nominatim (OpenStreetMap) ──────── */

export async function searchCities(query: string, limit = 5): Promise<GeoLocation[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: String(limit),
    addressdetails: '1',
  })

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { 'Accept-Language': 'de' },
  })
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  const data: Record<string, unknown>[] = await res.json()

  return data
    .filter((r) => {
      const type = r.type as string
      return ['city', 'town', 'village', 'municipality', 'administrative'].includes(type)
        || (r.class as string) === 'place'
    })
    .slice(0, limit)
    .map((r) => {
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
