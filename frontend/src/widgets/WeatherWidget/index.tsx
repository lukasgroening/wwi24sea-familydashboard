import { useState } from 'react'
import { Settings, Wind, AlertTriangle } from 'lucide-react'
import type { WidgetProps } from '../../types'
import { useWeather } from './useWeather'
import LocationSearch from './LocationSearch'
import WeatherSettings from './WeatherSettings'
import type { WeatherSettingsData } from './WeatherSettings'

function toFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32)
}

function formatTemp(celsius: number, unit: string): string {
  if (unit === 'fahrenheit') return `${toFahrenheit(celsius)}`
  return `${Math.round(celsius)}`
}

export default function WeatherWidget({
  settings,
  onSettingsChange,
}: WidgetProps) {
  const weatherSettings: WeatherSettingsData = {
    locationName: (settings?.locationName as string) ?? 'Frankfurt am Main',
    locationCountry: (settings?.locationCountry as string) ?? 'DE',
    temperatureUnit: (settings?.temperatureUnit as 'celsius' | 'fahrenheit') ?? 'celsius',
  }

  const { weather, loading, error, searchCities } = useWeather(settings)
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const unit = weatherSettings.temperatureUnit
  const unitSuffix = unit === 'fahrenheit' ? '°F' : '°C'

  function handleLocationSelect(geo: { name: string; country: string }) {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        locationName: geo.name,
        locationCountry: geo.country,
      })
    }
    setShowSearch(false)
  }

  if (loading && !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ color: 'white' }}>
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin mb-2"
          style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
        />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Laden…</span>
      </div>
    )
  }

  if (error && !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-2" style={{ color: 'white' }}>
        <AlertTriangle size={24} className="mb-2" />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Backend erreichbar?
        </p>
      </div>
    )
  }

  if (!weather) return null

  return (
    <div className="h-full flex flex-col relative" style={{ color: 'white' }}>
      {showSearch && (
        <LocationSearch
          onSelect={handleLocationSelect}
          onClose={() => setShowSearch(false)}
          searchCities={searchCities}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowSearch(true)}
          className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer group"
          style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}
        >
          <span className="group-hover:underline">Wetter · {weather.city}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-6 h-6 rounded-lg text-sm flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
          title="Einstellungen"
        >
          <Settings size={14} />
        </button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="text-5xl font-light tracking-tight leading-none mb-1">
            {formatTemp(weather.temperature, unit)}{unitSuffix}
          </div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {weather.description}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
          <Wind size={12} />
          {weather.windspeed} km/h
          <span className="block" style={{ color: 'rgba(255,255,255,0.5)' }}>Wind</span>
        </div>
      </div>

      {showSettings && (
        <WeatherSettings
          settings={weatherSettings}
          onSave={(newSettings) => {
            if (onSettingsChange) {
              onSettingsChange(newSettings as unknown as Record<string, unknown>)
            }
            setShowSettings(false)
          }}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
