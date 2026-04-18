import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { GeoLocation } from '../../lib/weatherApi'
import { searchCities } from '../../lib/weatherApi'

export interface WeatherSettingsData {
  locationName: string
  locationCountry: string
  temperatureUnit: 'celsius' | 'fahrenheit'
}

interface Props {
  settings: WeatherSettingsData
  onSave: (settings: WeatherSettingsData) => void
  onCancel: () => void
}

export default function WeatherSettings({ settings, onSave, onCancel }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<WeatherSettingsData>({ ...settings })

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
      locationCountry: loc.country,
    }))
    setShowLocationSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-stone-50)',
    borderColor: 'var(--color-stone-border)',
    fontFamily: 'inherit',
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'oklch(0 0 0 / 0.2)',
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
          background: 'white',
          border: '1px solid var(--color-stone-border)',
          boxShadow: '0 8px 32px oklch(0 0 0 / 0.12)',
        }}
      >
        {/* Header */}
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-stone-900)' }}>
            Wetter-Einstellungen
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-stone-600)' }}>
            Standort und Darstellung des Wetter-Widgets konfigurieren
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Location */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--color-stone-800)' }}>
              Standort
            </label>
            {!showLocationSearch ? (
              <button
                onClick={() => setShowLocationSearch(true)}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-left flex items-center justify-between transition-colors"
                style={{
                  background: 'var(--color-stone-50)',
                  border: '1px solid var(--color-stone-border)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--color-stone-900)',
                }}
              >
                <span>
                  📍 {form.locationName}
                  <span className="ml-1" style={{ color: 'var(--color-stone-600)' }}>· {form.locationCountry}</span>
                </span>
                <span style={{ color: 'var(--color-stone-600)' }}>✎</span>
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
                        style={{ borderColor: 'var(--color-stone-border)', borderTopColor: 'var(--color-sage-500)' }}
                      />
                    </div>
                  )}
                </div>
                <div className="max-h-36 overflow-y-auto rounded-lg" style={{ border: searchResults.length > 0 ? '1px solid var(--color-stone-border)' : 'none' }}>
                  {searchResults.map((loc, i) => (
                    <button
                      key={`${loc.lat}-${loc.lon}-${i}`}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-gray-50"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontFamily: 'inherit',
                        color: 'var(--color-stone-900)',
                      }}
                    >
                      <span className="font-medium">{loc.name}</span>
                      <span className="ml-1" style={{ color: 'var(--color-stone-600)' }}>· {loc.country}</span>
                    </button>
                  ))}
                  {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-xs px-3 py-2" style={{ color: 'var(--color-stone-600)' }}>
                      Keine Ergebnisse gefunden
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setShowLocationSearch(false); setSearchQuery(''); setSearchResults([]) }}
                  className="text-xs self-start"
                  style={{ color: 'var(--color-stone-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>

          {/* Temperature Unit */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--color-stone-800)' }}>
              Temperatureinheit
            </label>
            <div className="flex gap-2">
              {([['celsius', '°C – Celsius'], ['fahrenheit', '°F – Fahrenheit']] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setForm((f) => ({ ...f, temperatureUnit: value }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: form.temperatureUnit === value ? 'var(--color-sage-50)' : 'var(--color-stone-50)',
                    color: form.temperatureUnit === value ? 'var(--color-sage-500)' : 'var(--color-stone-700)',
                    fontWeight: form.temperatureUnit === value ? 600 : 400,
                    border: form.temperatureUnit === value
                      ? '1.5px solid var(--color-sage-500)'
                      : '1px solid var(--color-stone-border)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Speichern
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--color-stone-100)', color: 'var(--color-stone-700)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
