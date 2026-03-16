import { useState } from 'react'
import type { WidgetProps } from '../../types'
import { getPictoInfo } from '../../lib/weatherApi'
import { useWeather } from './useWeather'
import LocationSearch from './LocationSearch'
import WeatherSettings from './WeatherSettings'
import type { WeatherSettingsData } from './WeatherSettings'

/** Format "2026-03-14" → "Fr" (short weekday) */
function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Heute'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short' })
}

/** Convert Celsius to Fahrenheit */
function toFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32)
}

/** Format temperature based on unit setting */
function formatTemp(celsius: number, unit: string): string {
  if (unit === 'fahrenheit') return `${toFahrenheit(celsius)}`
  return `${celsius}`
}

export default function WeatherWidget({
  settings,
  onSettingsChange,
}: WidgetProps & { onSettingsChange?: (s: Record<string, unknown>) => void }) {
  // Parse settings with defaults
  const weatherSettings: WeatherSettingsData = {
    locationName: (settings?.locationName as string) ?? 'Frankfurt am Main',
    locationLat: (settings?.locationLat as number) ?? 50.1155,
    locationLon: (settings?.locationLon as number) ?? 8.68417,
    locationCountry: (settings?.locationCountry as string) ?? 'DE',
    temperatureUnit: (settings?.temperatureUnit as 'celsius' | 'fahrenheit') ?? 'celsius',
    showForecast: (settings?.showForecast as boolean) ?? true,
    showMeteogram: (settings?.showMeteogram as boolean) ?? true,
    forecastDays: (settings?.forecastDays as number) ?? 7,
  }

  const { weather, location, loading, error, searchCities } = useWeather(settings)
  const [showSearch, setShowSearch] = useState(false)
  const [showMeteogram, setShowMeteogram] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const unit = weatherSettings.temperatureUnit
  const unitSuffix = unit === 'fahrenheit' ? '°F' : '°'

  /** Handle location change from inline search — also persists via settings */
  function handleLocationSelect(geo: { name: string; lat: number; lon: number; country: string }) {
    if (onSettingsChange) {
      onSettingsChange({
        locationName: geo.name,
        locationLat: geo.lat,
        locationLon: geo.lon,
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
          Prüfe deinen API-Key in .env
        </p>
      </div>
    )
  }

  if (!weather) return null

  const { current, today, forecasts, meteogramUrl } = weather
  const picto = getPictoInfo(current.pictocode)

  /* ── Meteogram overlay ──────────────────────────── */
  if (showMeteogram) {
    return (
      <div className="h-full flex flex-col relative" style={{ color: 'white' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Meteogramm · {location.name}
          </span>
          <button
            onClick={() => setShowMeteogram(false)}
            className="text-white/60 hover:text-white transition-colors text-lg leading-none cursor-pointer"
            style={{ background: 'none', border: 'none', fontFamily: 'inherit' }}
            aria-label="Zurück"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden rounded-lg">
          <img
            src={meteogramUrl}
            alt="Meteogramm"
            className="w-full h-full object-contain rounded-lg"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
        </div>
      </div>
    )
  }

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
          <span className="group-hover:underline">Wetter · {location.name}</span>
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
            {formatTemp(current.temperature, unit)}{unitSuffix}
          </div>
          <div className="text-sm flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <span className="text-lg">{picto.emoji}</span>
            {picto.label}
          </div>
        </div>
        <div className="text-right text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <div>Gefühlt {formatTemp(current.feelsLike, unit)}{unitSuffix}</div>
          <div className="mt-0.5">💧 {current.humidity}%</div>
          <div className="mt-0.5">💨 {current.windSpeed} km/h</div>
        </div>
      </div>

      {/* Today's stats */}
      <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        {[
          { label: 'max', value: `↑ ${formatTemp(today.tempMax, unit)}${unitSuffix}` },
          { label: 'min', value: `↓ ${formatTemp(today.tempMin, unit)}${unitSuffix}` },
          { label: 'Regen', value: `${today.precipitationProbability}%` },
          { label: 'UV', value: `${today.uvindex}` },
        ].map((s) => (
          <div key={s.label} className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {s.value}
            <span className="block" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Multi-day forecast (configurable) */}
      {weatherSettings.showForecast && (
        <div className="mt-3 pt-3 flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div className={`grid gap-1 text-center`} style={{ gridTemplateColumns: `repeat(${Math.min(weatherSettings.forecastDays, forecasts.length)}, 1fr)` }}>
            {forecasts.slice(0, weatherSettings.forecastDays).map((day, i) => {
              const dp = getPictoInfo(day.pictocode)
              return (
                <div key={day.date} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {dayLabel(day.date, i)}
                  </span>
                  <span className="text-sm">{dp.emoji}</span>
                  <span className="text-[10px] font-medium">{formatTemp(day.tempMax, unit)}°</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {formatTemp(day.tempMin, unit)}°
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Meteogram link (configurable) */}
      {weatherSettings.showMeteogram && (
        <button
          onClick={() => setShowMeteogram(true)}
          className="mt-2 text-[10px] text-center cursor-pointer group"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}
        >
          <span className="group-hover:underline">📊 Meteogramm anzeigen</span>
        </button>
      )}

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
