import { useQuery } from '@tanstack/react-query'
import { fetchWeather, searchCities, type WeatherData } from '../../lib/weatherApi'

const DEFAULT_CITY = 'Mannheim'

export function useWeather(settings?: Record<string, unknown>) {
  const cityName = (settings?.locationName as string) ?? DEFAULT_CITY

  const { data: weather, isLoading: loading, error: rawError } = useQuery<WeatherData>({
    queryKey: ['weather', cityName],
    queryFn: () => fetchWeather(cityName),
    refetchInterval: 15 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  })

  const error = rawError ? 'Wetterdaten konnten nicht geladen werden' : null

  return { weather, loading, error, searchCities }
}
