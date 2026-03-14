import axios from 'axios'

/**
 * Meteoblue API client + Nominatim geocoding (OpenStreetMap)
 * API key via env variable VITE_METEOBLUE_API_KEY
 */

const METEOBLUE_BASE = 'https://my.meteoblue.com'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

function getApiKey(): string {
  const key = import.meta.env.VITE_METEOBLUE_API_KEY
  if (!key) console.warn('[WeatherWidget] VITE_METEOBLUE_API_KEY is not set in .env')
  return key ?? ''
}

/* ── Types ────────────────────────────────────────── */

export interface GeoLocation {
  name: string
  displayName: string
  lat: number
  lon: number
  country: string
}

export interface DayForecast {
  date: string
  tempMax: number
  tempMin: number
  tempMean: number
  precipitation: number
  precipitationProbability: number
  precipitationHours: number
  windspeedMean: number
  windspeedMax: number
  humidityMean: number
  pictocode: number
  predictability: number
  uvindex: number
}

export interface CurrentHourData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  precipitation: number
  precipitationProbability: number
  pictocode: number
}

export interface WeatherData {
  forecasts: DayForecast[]
  today: DayForecast
  current: CurrentHourData
  meteogramUrl: string
}

/* ── Pictocode → emoji + description ──────────────── */

const PICTO_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '☀️', label: 'Sonnig' },
  2: { emoji: '🌤️', label: 'Leicht bewölkt' },
  3: { emoji: '⛅', label: 'Teilweise bewölkt' },
  4: { emoji: '☁️', label: 'Bewölkt' },
  5: { emoji: '🌫️', label: 'Nebel' },
  6: { emoji: '🌧️', label: 'Bewölkt mit Regen' },
  7: { emoji: '🌦️', label: 'Wechselhaft mit Schauern' },
  8: { emoji: '🌧️', label: 'Schauer' },
  9: { emoji: '🌧️', label: 'Bedeckt mit Regen' },
  10: { emoji: '🌨️', label: 'Wechselhaft mit Schneeschauern' },
  11: { emoji: '🌨️', label: 'Schneeschauer' },
  12: { emoji: '🌨️', label: 'Bedeckt mit Schnee' },
  13: { emoji: '⛈️', label: 'Gewitter möglich' },
  14: { emoji: '⛈️', label: 'Gewitter wahrscheinlich' },
  15: { emoji: '⛈️', label: 'Gewitter' },
  16: { emoji: '🌧️', label: 'Leichter Regen' },
  17: { emoji: '🌧️', label: 'Starker Regen' },
  18: { emoji: '🌨️', label: 'Leichter Schnee' },
  19: { emoji: '🌧️', label: 'Leichter Regen' },
  20: { emoji: '🌧️', label: 'Regen' },
  21: { emoji: '⛅', label: 'Wechselhaft' },
  22: { emoji: '☁️', label: 'Bewölkt' },
  23: { emoji: '❄️', label: 'Schnee' },
  24: { emoji: '🌨️', label: 'Eisregen' },
  25: { emoji: '🌞', label: 'Sehr heiß' },
  26: { emoji: '🥶', label: 'Sehr kalt' },
  27: { emoji: '💨', label: 'Windig' },
  28: { emoji: '🌤️', label: 'Heiter' },
  29: { emoji: '☁️', label: 'Bedeckt' },
  30: { emoji: '🌨️', label: 'Schneeregen' },
  31: { emoji: '🌧️', label: 'Regen möglich' },
  32: { emoji: '🌨️', label: 'Schnee möglich' },
  33: { emoji: '🌧️', label: 'Regnerisch' },
  34: { emoji: '🌨️', label: 'Schneefall' },
  35: { emoji: '⛈️', label: 'Gewitter' },
}

export function getPictoInfo(code: number): { emoji: string; label: string } {
  return PICTO_MAP[code] ?? { emoji: '🌡️', label: 'Unbekannt' }
}

/* ── Geocoding via Nominatim (OpenStreetMap) ──────── */

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

  // Filter to places (cities, towns, villages)
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

/* ── Meteoblue forecast ───────────────────────────── */

export async function fetchWeather(lat: number, lon: number, locationName: string): Promise<WeatherData> {
  const apiKey = getApiKey()

  // Fetch forecast data
  const { data } = await axios.get(`${METEOBLUE_BASE}/packages/basic-1h_basic-day`, {
    params: {
      apikey: apiKey,
      lat,
      lon,
      asl: 113,
      format: 'json',
    },
  })

  // Parse daily forecasts
  const daily = data.data_day
  const forecasts: DayForecast[] = daily.time.map((_: string, i: number) => ({
    date: daily.time[i],
    tempMax: Math.round(daily.temperature_max[i]),
    tempMin: Math.round(daily.temperature_min[i]),
    tempMean: Math.round(daily.temperature_mean[i]),
    precipitation: daily.precipitation[i],
    precipitationProbability: daily.precipitation_probability[i],
    precipitationHours: daily.precipitation_hours[i],
    windspeedMean: Math.round(daily.windspeed_mean[i] * 3.6), // m/s → km/h
    windspeedMax: Math.round(daily.windspeed_max[i] * 3.6),
    humidityMean: daily.relativehumidity_mean[i],
    pictocode: daily.pictocode[i],
    predictability: daily.predictability[i],
    uvindex: daily.uvindex[i],
  }))

  // Find current hour data from 1h data
  const now = new Date()
  const currentHour = now.getHours()
  // Today's data starts at index 0 in the 1h arrays
  const hourIndex = Math.min(currentHour, (data.data_1h.time?.length ?? 1) - 1)

  const hourly = data.data_1h
  const current: CurrentHourData = {
    temperature: Math.round(hourly.temperature[hourIndex]),
    feelsLike: Math.round(hourly.felttemperature[hourIndex]),
    humidity: hourly.relativehumidity[hourIndex],
    windSpeed: Math.round(hourly.windspeed[hourIndex] * 3.6),
    windDirection: hourly.winddirection[hourIndex],
    precipitation: hourly.precipitation[hourIndex],
    precipitationProbability: hourly.precipitation_probability[hourIndex],
    pictocode: hourly.pictocode[hourIndex],
  }

  // Build meteogram image URL
  const meteogramUrl = `${METEOBLUE_BASE}/images/meteogram?` + new URLSearchParams({
    apikey: apiKey,
    lat: lat.toString(),
    lon: lon.toString(),
    asl: '113',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    format: 'png',
    dpi: '72',
    lang: 'de',
    temperature_units: 'C',
    precipitation_units: 'mm',
    windspeed_units: 'kmh',
    location_name: locationName,
  }).toString()

  return {
    forecasts,
    today: forecasts[0],
    current,
    meteogramUrl,
  }
}
