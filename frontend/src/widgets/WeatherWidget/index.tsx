import { useState } from 'react'
import type { WidgetProps } from '../../types'
import { useWeather } from './useWeather'
import LocationSearch from './LocationSearch'
import WeatherSettings from './WeatherSettings'
import type { WeatherSettingsData } from './WeatherSettings'

/** Convert Celsius to Fahrenheit */
function toFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32)
}

/** Format temperature based on unit setting */
function formatTemp(celsius: number, unit: string): string {
  if (unit === 'fahrenheit') return `${toFahrenheit(celsius)}`
  return `${Math.round(celsius)}`
}

export default function WeatherWidget({
  settings,
  onSettingsChange,
}: WidgetProps & { onSettingsChange?: (s: Record<string, unknown>) => void }) {
  // Parse settings with defaults
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

  /** Handle location change from inline search — persists via settings */
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

  /* ── Loading state ──────────────────────────────── */
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

  /* ── Error state ────────────────────────────────── */
  if (error && !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-2" style={{ color: 'white' }}>
        <span className="text-2xl mb-2">⚠️</span>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Backend erreichbar?
        </p>
      </div>
    )
  }

  if (!weather) return null

  /* ── Main widget ────────────────────────────────── */
  return (
    <div className="h-full flex flex-col relative" style={{ color: 'white' }}>
      {/* Location search overlay */}
      {showSearch && (
        <LocationSearch
          onSelect={handleLocationSelect}
          onClose={() => setShowSearch(false)}
          searchCities={searchCities}
        />
      )}

      {/* City header — clickable to change location */}
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
        {/* Settings gear */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-6 h-6 rounded-lg text-sm flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
          title="Einstellungen"
        >
          ⚙
        </button>
      </div>

      {/* Current temperature + weather */}
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

      {/* Wind info */}
      <div className="flex gap-3 mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
          💨 {weather.windspeed} km/h
          <span className="block" style={{ color: 'rgba(255,255,255,0.5)' }}>Wind</span>
        </div>
      </div>

      {/* Settings Modal */}
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
