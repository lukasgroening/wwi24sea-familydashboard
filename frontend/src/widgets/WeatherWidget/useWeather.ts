import { useState, useEffect, useCallback } from 'react'
import { fetchWeather, searchCities, type WeatherData, type GeoLocation } from '../../lib/weatherApi'

const STORAGE_KEY = 'weather-widget-location'

interface StoredLocation {
  name: string
  lat: number
  lon: number
  country: string
}

function loadLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLocation(loc: StoredLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
}

/* Default: Frankfurt am Main */
const DEFAULT_LOCATION: StoredLocation = {
  name: 'Frankfurt am Main',
  lat: 50.1155,
  lon: 8.68417,
  country: 'DE',
}

export function useWeather() {
  const [location, setLocation] = useState<StoredLocation>(loadLocation() ?? DEFAULT_LOCATION)
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

  /* Select a new city from search results */
  const selectLocation = useCallback((geo: GeoLocation) => {
    const loc: StoredLocation = {
      name: geo.name,
      lat: geo.lat,
      lon: geo.lon,
      country: geo.country,
    }
    saveLocation(loc)
    setLocation(loc)
  }, [])

  return {
    weather,
    location,
    loading,
    error,
    refresh,
    selectLocation,
    searchCities,
  }
}
