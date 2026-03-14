import { useState, useRef, useEffect } from 'react'
import type { GeoLocation } from '../../lib/weatherApi'

interface Props {
  onSelect: (location: GeoLocation) => void
  onClose: () => void
  searchCities: (query: string) => Promise<GeoLocation[]>
}

export default function LocationSearch({ onSelect, onClose, searchCities }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoLocation[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const cities = await searchCities(value.trim())
        setResults(cities)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  function handleSelect(loc: GeoLocation) {
    onSelect(loc)
    onClose()
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-2xl p-4" style={{ background: '#7c9a7e' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Standort wählen
        </span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors text-lg leading-none cursor-pointer"
          style={{ background: 'none', border: 'none', fontFamily: 'inherit' }}
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>

      {/* Search input */}
      <div className="relative mb-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Stadt suchen…"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            fontFamily: 'inherit',
          }}
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {results.map((loc, i) => (
          <button
            key={`${loc.lat}-${loc.lon}-${i}`}
            onClick={() => handleSelect(loc)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            style={{
              color: 'white',
              background: 'transparent',
              border: 'none',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="font-medium">{loc.name}</span>
            <span className="ml-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              · {loc.country}
            </span>
          </button>
        ))}

        {query.trim().length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs px-3 py-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Keine Ergebnisse gefunden
          </p>
        )}

        {query.trim().length < 2 && (
          <p className="text-xs px-3 py-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Mindestens 2 Zeichen eingeben…
          </p>
        )}
      </div>
    </div>
  )
}
