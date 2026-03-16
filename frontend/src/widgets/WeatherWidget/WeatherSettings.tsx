import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { GeoLocation } from '../../lib/weatherApi'
import { searchCities } from '../../lib/weatherApi'

export interface WeatherSettingsData {
  locationName: string
  locationLat: number
  locationLon: number
  locationCountry: string
  temperatureUnit: 'celsius' | 'fahrenheit'
  showForecast: boolean
  showMeteogram: boolean
  forecastDays: number
}

interface Props {
  settings: WeatherSettingsData
  onSave: (settings: WeatherSettingsData) => void
  onCancel: () => void
}

export default function WeatherSettings({ settings, onSave, onCancel }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<WeatherSettingsData>({ ...settings })

  // Location search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([])
  const [searching, setSearching] = useState(false)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCancel])

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const cities = await searchCities(value.trim())
        setSearchResults(cities)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  function handleSelectLocation(loc: GeoLocation) {
    setForm((f) => ({
      ...f,
      locationName: loc.name,
      locationLat: loc.lat,
      locationLon: loc.lon,
      locationCountry: loc.country,
    }))
    setShowLocationSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const inputStyle: React.CSSProperties = {
    background: '#f8f8f4',
    borderColor: '#e8e8e2',
    fontFamily: 'inherit',
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        ref={modalRef}
        className="rounded-2xl p-6 flex flex-col gap-5 w-96 max-h-[90vh] overflow-y-auto"
        style={{
          background: '#ffffff',
          border: '1px solid #e8e8e2',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div>
          <div className="text-sm font-semibold" style={{ color: '#2d2d2d' }}>
            Wetter-Einstellungen
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#9e9e96' }}>
            Konfiguriere Datenquelle und Darstellung des Wetter-Widgets
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Location / Datenquelle */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: '#4a4a44' }}>
              Standort (Datenquelle)
            </label>
            {!showLocationSearch ? (
              <button
                onClick={() => setShowLocationSearch(true)}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-left flex items-center justify-between transition-colors"
                style={{
                  background: '#f8f8f4',
                  border: '1px solid #e8e8e2',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: '#2d2d2d',
                }}
              >
                <span>
                  📍 {form.locationName}
                  <span className="ml-1" style={{ color: '#9e9e96' }}>· {form.locationCountry}</span>
                </span>
                <span style={{ color: '#9e9e96' }}>✎</span>
              </button>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Stadt suchen…"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                    style={inputStyle}
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div
                        className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                        style={{ borderColor: '#e8e8e2', borderTopColor: '#7c9a7e' }}
                      />
                    </div>
                  )}
                </div>
                <div className="max-h-36 overflow-y-auto rounded-lg" style={{ border: searchResults.length > 0 ? '1px solid #e8e8e2' : 'none' }}>
                  {searchResults.map((loc, i) => (
                    <button
                      key={`${loc.lat}-${loc.lon}-${i}`}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-gray-50"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontFamily: 'inherit',
                        color: '#2d2d2d',
                      }}
                    >
                      <span className="font-medium">{loc.name}</span>
                      <span className="ml-1" style={{ color: '#9e9e96' }}>· {loc.country}</span>
                    </button>
                  ))}
                  {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-xs px-3 py-2" style={{ color: '#9e9e96' }}>
                      Keine Ergebnisse gefunden
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setShowLocationSearch(false); setSearchQuery(''); setSearchResults([]) }}
                  className="text-xs self-start"
                  style={{ color: '#9e9e96', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>

          {/* Temperature Unit */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: '#4a4a44' }}>
              Temperatureinheit
            </label>
            <div className="flex gap-2">
              {([['celsius', '°C – Celsius'], ['fahrenheit', '°F – Fahrenheit']] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setForm((f) => ({ ...f, temperatureUnit: value }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: form.temperatureUnit === value ? '#f0f5f0' : '#f8f8f4',
                    color: form.temperatureUnit === value ? '#7c9a7e' : '#7a7a72',
                    fontWeight: form.temperatureUnit === value ? 600 : 400,
                    border: form.temperatureUnit === value ? '1.5px solid #7c9a7e' : '1px solid #e8e8e2',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Show Forecast */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs transition-colors"
                style={{
                  border: form.showForecast ? 'none' : '1.5px solid #c8c8c0',
                  background: form.showForecast ? '#7c9a7e' : 'transparent',
                  color: 'white',
                }}
                onClick={() => setForm((f) => ({ ...f, showForecast: !f.showForecast }))}
              >
                {form.showForecast && '✓'}
              </div>
              <div>
                <span className="text-sm" style={{ color: '#4a4a44' }}>Vorhersage anzeigen</span>
                <span className="block text-xs" style={{ color: '#9e9e96' }}>
                  Mehrtägige Wettervorhersage ein-/ausblenden
                </span>
              </div>
            </label>
          </div>

          {/* Forecast Days */}
          {form.showForecast && (
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: '#4a4a44' }}>
                Vorhersage-Tage
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                style={inputStyle}
                value={form.forecastDays}
                onChange={(e) => setForm((f) => ({ ...f, forecastDays: Number(e.target.value) }))}
              >
                {[3, 5, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} Tage
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show Meteogram */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs transition-colors"
                style={{
                  border: form.showMeteogram ? 'none' : '1.5px solid #c8c8c0',
                  background: form.showMeteogram ? '#7c9a7e' : 'transparent',
                  color: 'white',
                }}
                onClick={() => setForm((f) => ({ ...f, showMeteogram: !f.showMeteogram }))}
              >
                {form.showMeteogram && '✓'}
              </div>
              <div>
                <span className="text-sm" style={{ color: '#4a4a44' }}>Meteogramm-Link anzeigen</span>
                <span className="block text-xs" style={{ color: '#9e9e96' }}>
                  Link zum detaillierten Meteogramm ein-/ausblenden
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Speichern
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: '#f4f4f0', color: '#7a7a72', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
