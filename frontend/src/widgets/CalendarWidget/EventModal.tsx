import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { CalendarEvent, GoogleCalendarInfo, EventFormData, } from './types'
import { EVENT_COLORS } from './types'

interface Props {
  event: CalendarEvent | null  // null = create new
  calendars: GoogleCalendarInfo[]
  defaultDate?: string // YYYY-MM-DD
  onSave: (data: EventFormData, existingEvent?: CalendarEvent) => void
  onDelete?: (event: CalendarEvent) => void
  onCancel: () => void
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function EventModal({ event, calendars, defaultDate, onSave, onDelete, onCancel }: Props) {
  const isEdit = !!event
  const modalRef = useRef<HTMLDivElement>(null)

  const startDate = event ? new Date(event.start) : null
  const endDate = event ? new Date(event.end) : null

  const [form, setForm] = useState<EventFormData>({
    title: event?.title ?? '',
    description: event?.description ?? '',
    date: startDate ? toDateStr(startDate) : (defaultDate ?? toDateStr(new Date())),
    startTime: startDate ? toTimeStr(startDate) : '09:00',
    endTime: endDate ? toTimeStr(endDate) : '10:00',
    allDay: event?.allDay ?? false,
    calendarId: event?.calendarId ?? calendars.find((c) => c.primary)?.id ?? calendars[0]?.id ?? 'primary',
    color: event?.color ?? EVENT_COLORS[0],
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCancel])

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave(form, event ?? undefined)
  }

  const update = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

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
        className="rounded-2xl p-6 flex flex-col gap-4 w-96 max-h-[90vh] overflow-y-auto"
        style={{ background: '#ffffff', border: '1px solid #e8e8e2', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div className="text-sm font-semibold" style={{ color: '#2d2d2d' }}>
          {isEdit ? 'Termin bearbeiten' : 'Neuer Termin'}
        </div>

        <div className="flex flex-col gap-3">
          {/* Title */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Titel *</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
              style={inputStyle}
              placeholder="z.B. Zahnarzt Lena"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Datum *</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
              style={inputStyle}
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>

          {/* All-day toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs"
              style={{
                border: form.allDay ? 'none' : '1.5px solid #c8c8c0',
                background: form.allDay ? '#7c9a7e' : 'transparent',
                color: 'white',
              }}
              onClick={() => update('allDay', !form.allDay)}
            >
              {form.allDay && '✓'}
            </div>
            <span className="text-sm" style={{ color: '#4a4a44' }}>Ganztägig</span>
          </label>

          {/* Time (if not all-day) */}
          {!form.allDay && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Von</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                  style={inputStyle}
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Bis</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                  style={inputStyle}
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Beschreibung</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border resize-none"
              style={{ ...inputStyle, minHeight: '60px' }}
              placeholder="Optional..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          {/* Calendar selector */}
          {calendars.length > 1 && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Kalender</label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                style={inputStyle}
                value={form.calendarId}
                onChange={(e) => update('calendarId', e.target.value)}
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary ? '(Primär)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Color picker */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#9e9e96' }}>Farbe</label>
            <div className="flex gap-1.5">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => update('color', c)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                  style={{
                    background: c,
                    border: form.color === c ? '2px solid #2d2d2d' : '2px solid transparent',
                    cursor: 'pointer',
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isEdit ? 'Speichern' : 'Erstellen'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: '#f4f4f0', color: '#7a7a72', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Abbrechen
          </button>
          {isEdit && event && onDelete && (
            <button
              onClick={() => onDelete(event)}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: '#fef2f2', color: '#c45c5c', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              title="Termin löschen"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
