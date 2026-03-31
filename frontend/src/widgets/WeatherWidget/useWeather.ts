import { useState, useEffect, useCallback } from 'react'
import { fetchWeather, searchCities, type WeatherData } from '../../lib/weatherApi'

const DEFAULT_CITY = 'Mannheim'

/**
 * Weather hook — fetches weather data from the backend API.
 * The backend handles geocoding + weather API calls (Open-Meteo).
 */
export function useWeather(settings?: Record<string, unknown>) {
  const cityName = (settings?.locationName as string) ?? DEFAULT_CITY

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeather(cityName)
      setWeather(data)
    } catch (err) {
      console.error('[WeatherWidget]', err)
      setError('Wetterdaten konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [cityName])

  useEffect(() => {
    refresh()
    // Refresh every 15 minutes
    const interval = setInterval(refresh, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  return {
    weather,
    cityName,
    loading,
    error,
    refresh,
    searchCities,
  }
}
