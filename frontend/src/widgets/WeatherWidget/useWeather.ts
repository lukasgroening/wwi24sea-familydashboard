import { useState, useEffect, useCallback } from 'react'
import { fetchWeather, searchCities, type WeatherData } from '../../lib/weatherApi'

interface LocationData {
  name: string
  lat: number
  lon: number
  country: string
}

/* Default: Frankfurt am Main */
const DEFAULT_LOCATION: LocationData = {
  name: 'Frankfurt am Main',
  lat: 50.1155,
  lon: 8.68417,
  country: 'DE',
}

/**
 * Weather hook that reads location from widget settings (persisted via dashboardStore).
 * Falls back to DEFAULT_LOCATION if no settings are provided.
 */
export function useWeather(settings?: Record<string, unknown>) {
  // Derive location from settings or use default
  const location: LocationData = {
    name: (settings?.locationName as string) ?? DEFAULT_LOCATION.name,
    lat: (settings?.locationLat as number) ?? DEFAULT_LOCATION.lat,
    lon: (settings?.locationLon as number) ?? DEFAULT_LOCATION.lon,
    country: (settings?.locationCountry as string) ?? DEFAULT_LOCATION.country,
  }

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* Fetch weather when location changes */
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeather(location.lat, location.lon, location.name)
      setWeather(data)
    } catch (err) {
      console.error('[WeatherWidget]', err)
      setError('Wetterdaten konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [location.lat, location.lon, location.name])

  useEffect(() => {
    refresh()
    // Refresh every 15 minutes
    const interval = setInterval(refresh, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  return {
    weather,
    location,
    loading,
    error,
    refresh,
    searchCities,
  }
}
