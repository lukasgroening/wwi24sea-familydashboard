import { useState, useRef, useEffect } from 'react'

export interface CalendarSettingsData {
  defaultView: 'month' | 'week'
  showWeekends: boolean
  weekStartHour: number
  weekEndHour: number
}

interface Props {
  settings: CalendarSettingsData
  onSave: (settings: CalendarSettingsData) => void
  onCancel: () => void
}

export default function CalendarSettings({ settings, onSave, onCancel }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<CalendarSettingsData>({ ...settings })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCancel])

  const inputStyle: React.CSSProperties = {
    background: '#f8f8f4',
    borderColor: '#e8e8e2',
    fontFamily: 'inherit',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
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
            Kalender-Einstellungen
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#9e9e96' }}>
            Konfiguriere die Darstellung des Kalender-Widgets
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Default View */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: '#4a4a44' }}>
              Standard-Ansicht
            </label>
            <div className="flex gap-2">
              {([['month', 'Monat'], ['week', 'Woche']] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setForm((f) => ({ ...f, defaultView: value }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: form.defaultView === value ? '#f0f5f0' : '#f8f8f4',
                    color: form.defaultView === value ? '#7c9a7e' : '#7a7a72',
                    fontWeight: form.defaultView === value ? 600 : 400,
                    border: form.defaultView === value ? '1.5px solid #7c9a7e' : '1px solid #e8e8e2',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Show Weekends */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs transition-colors"
                style={{
                  border: form.showWeekends ? 'none' : '1.5px solid #c8c8c0',
                  background: form.showWeekends ? '#7c9a7e' : 'transparent',
                  color: 'white',
                }}
                onClick={() => setForm((f) => ({ ...f, showWeekends: !f.showWeekends }))}
              >
                {form.showWeekends && '✓'}
              </div>
              <div>
                <span className="text-sm" style={{ color: '#4a4a44' }}>Wochenenden anzeigen</span>
                <span className="block text-xs" style={{ color: '#9e9e96' }}>
                  Sa/So in der Wochenansicht ein-/ausblenden
                </span>
              </div>
            </label>
          </div>

          {/* Week View Hours */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: '#4a4a44' }}>
              Stundenbereich (Wochenansicht)
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Von</label>
                <select
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                  style={inputStyle}
                  value={form.weekStartHour}
                  onChange={(e) => setForm((f) => ({ ...f, weekStartHour: Number(e.target.value) }))}
                >
                  {Array.from({ length: 13 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm mt-4" style={{ color: '#b5b5a8' }}>–</div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Bis</label>
                <select
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                  style={inputStyle}
                  value={form.weekEndHour}
                  onChange={(e) => setForm((f) => ({ ...f, weekEndHour: Number(e.target.value) }))}
                >
                  {Array.from({ length: 13 }, (_, i) => i + 12).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
    </div>
  )
}
