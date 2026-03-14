import { useState } from 'react'
import type { WidgetProps } from '../../types'
import { getPictoInfo } from '../../lib/weatherApi'
import { useWeather } from './useWeather'
import LocationSearch from './LocationSearch'

/** Format "2026-03-14" → "Fr" (short weekday) */
function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Heute'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short' })
}

export default function WeatherWidget(_props: WidgetProps) {
  const { weather, location, loading, error, selectLocation, searchCities } = useWeather()
  const [showSearch, setShowSearch] = useState(false)
  const [showMeteogram, setShowMeteogram] = useState(false)

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
          onSelect={selectLocation}
          onClose={() => setShowSearch(false)}
          searchCities={searchCities}
        />
      )}

      {/* City header — clickable to change location */}
      <button
        onClick={() => setShowSearch(true)}
        className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5 cursor-pointer group"
        style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}
      >
        <span className="group-hover:underline">Wetter · {location.name}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Current temperature + weather */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-5xl font-light tracking-tight leading-none mb-1">{current.temperature}°</div>
          <div className="text-sm flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <span className="text-lg">{picto.emoji}</span>
            {picto.label}
          </div>
        </div>
        <div className="text-right text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <div>Gefühlt {current.feelsLike}°</div>
          <div className="mt-0.5">💧 {current.humidity}%</div>
          <div className="mt-0.5">💨 {current.windSpeed} km/h</div>
        </div>
      </div>

      {/* Today's stats */}
      <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        {[
          { label: 'max', value: `↑ ${today.tempMax}°` },
          { label: 'min', value: `↓ ${today.tempMin}°` },
          { label: 'Regen', value: `${today.precipitationProbability}%` },
          { label: 'UV', value: `${today.uvindex}` },
        ].map((s) => (
          <div key={s.label} className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {s.value}
            <span className="block" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* 7-day forecast */}
      <div className="mt-3 pt-3 flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="grid grid-cols-7 gap-1 text-center">
          {forecasts.map((day, i) => {
            const dp = getPictoInfo(day.pictocode)
            return (
              <div key={day.date} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {dayLabel(day.date, i)}
                </span>
                <span className="text-sm">{dp.emoji}</span>
                <span className="text-[10px] font-medium">{day.tempMax}°</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{day.tempMin}°</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Meteogram link */}
      <button
        onClick={() => setShowMeteogram(true)}
        className="mt-2 text-[10px] text-center cursor-pointer group"
        style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}
      >
        <span className="group-hover:underline">📊 Meteogramm anzeigen</span>
      </button>
    </div>
  )
}
