import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

interface CalendarEvent {
  id?: number
  title: string
  description?: string | null
  start_time: string
  end_time: string
  location?: string | null
  color?: string | null
  is_external: boolean
  source_name?: string | null
}

interface NewEventForm {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  color: string
}

const EMPTY_FORM: NewEventForm = {
  title: '',
  description: '',
  date: '',
  startTime: '10:00',
  endTime: '11:00',
  location: '',
  color: '#7c9a7e',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7
}

export default function CalendarWidget() {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<NewEventForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const loadEvents = useCallback(async () => {
    try {
      setError(null)
      const { data } = await api.get<CalendarEvent[]>('/api/calendar/events')
      setEvents(data)
    } catch (err) {
      console.error('[CalendarWidget] Fehler beim Laden:', err)
      setError('Termine konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const handleCreate = async () => {
    if (!form.title.trim() || !form.date) return
    setSubmitting(true)
    try {
      const start_time = `${form.date}T${form.startTime}:00`
      const end_time = `${form.date}T${form.endTime}:00`
      await api.post('/api/calendar/events', {
        title: form.title,
        description: form.description || null,
        start_time,
        end_time,
        location: form.location || null,
        color: form.color,
      })
      setForm(EMPTY_FORM)
      setShowAddForm(false)
      await loadEvents()
    } catch (err) {
      console.error('[CalendarWidget] Fehler beim Erstellen:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const backup = [...events]
    setEvents((prev) => prev.filter((e) => e.id !== id))
    try {
      await api.delete(`/api/calendar/events/${id}`)
    } catch (err) {
      console.error('[CalendarWidget] Fehler beim Löschen:', err)
      setEvents(backup)
    }
  }

  const daysInMonth = getDaysInMonth(view.year, view.month)
  const firstDay = getFirstDayOfMonth(view.year, view.month)
  const daysInPrev = getDaysInMonth(view.year, view.month - 1)

  const cells: { day: number; current: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false })

  const eventDates = new Set(
    events
      .filter((e) => {
        const d = new Date(e.start_time)
        return d.getFullYear() === view.year && d.getMonth() === view.month
      })
      .map((e) => new Date(e.start_time).getDate())
  )

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const upcomingEvents = events
    .filter((e) => {
      const d = new Date(e.start_time)
      return d >= now && d <= in30Days
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5)

  const prev = () => setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const next = () => setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

  const isToday = (day: number, current: boolean) =>
    current && day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: '#9e9e96' }}>Lade Kalender…</p>
      </div>
    )
  }

  if (error && events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-2">
        <span className="text-2xl mb-2">⚠️</span>
        <p className="text-xs" style={{ color: '#9e9e96' }}>{error}</p>
        <button
          onClick={loadEvents}
          className="mt-2 text-xs px-3 py-1 rounded-lg"
          style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', color: '#7c9a7e' }}
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base">{MONTHS[view.month]} {view.year}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-colors"
            style={{ border: '1px solid #e8e8e2', background: showAddForm ? '#7c9a7e' : 'none', cursor: 'pointer', color: showAddForm ? 'white' : '#7c9a7e' }}
            title="Neuer Termin"
          >
            +
          </button>
          {[['‹', prev], ['›', next]].map(([label, fn]) => (
            <button
              key={label as string}
              onClick={fn as () => void}
              className="w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-colors"
              style={{ border: '1px solid #e8e8e2', background: 'none', cursor: 'pointer', color: '#7a7a72' }}
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>

      {showAddForm && (
        <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: '#f8f8f4', border: '1px solid #e8e8e2' }}>
          <input
            className="px-2 py-1.5 rounded-lg text-sm outline-none border"
            style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
            placeholder="Titel *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="px-2 py-1.5 rounded-lg text-sm outline-none border"
            style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
            placeholder="Beschreibung"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none border"
              style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              type="time"
              className="px-2 py-1.5 rounded-lg text-sm outline-none border"
              style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit', width: '90px' }}
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <span className="self-center text-xs" style={{ color: '#9e9e96' }}>–</span>
            <input
              type="time"
              className="px-2 py-1.5 rounded-lg text-sm outline-none border"
              style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit', width: '90px' }}
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <input
            className="px-2 py-1.5 rounded-lg text-sm outline-none border"
            style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
            placeholder="Ort"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <div className="flex gap-2 items-center">
            <input
              type="color"
              className="w-8 h-8 rounded border-none cursor-pointer"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              title="Farbe wählen"
            />
            <button
              onClick={handleCreate}
              disabled={!form.title.trim() || !form.date || submitting}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white font-medium transition-opacity disabled:opacity-50"
              style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {submitting ? 'Speichern…' : 'Termin erstellen'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM) }}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', color: '#7a7a72', fontFamily: 'inherit' }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-1 pb-2 tracking-wide" style={{ color: '#b5b5a8' }}>
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const today_ = isToday(cell.day, cell.current)
          const hasEvent = cell.current && eventDates.has(cell.day)
          return (
            <div
              key={i}
              className="text-center py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{
                background: today_ ? '#7c9a7e' : 'transparent',
                color: today_ ? 'white' : cell.current ? '#4a4a44' : '#c8c8c0',
                fontWeight: today_ ? 500 : 400,
              }}
            >
              {cell.day}
              {hasEvent && (
                <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: today_ ? 'rgba(255,255,255,0.7)' : '#7c9a7e' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Upcoming events */}
      <div className="border-t pt-3 flex flex-col gap-2 overflow-y-auto" style={{ borderColor: '#f0f0ea' }}>
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#b5b5a8' }}>
          Nächste Termine
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-xs py-2" style={{ color: '#b5b5a8' }}>Keine anstehenden Termine</p>
        ) : (
          upcomingEvents.map((ev) => {
            const startDate = new Date(ev.start_time)
            const startTimeStr = startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={`${ev.id ?? ev.title}-${ev.start_time}`} className="flex items-center gap-2.5 group">
                <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: ev.color ?? '#7c9a7e' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-1">
                    {ev.title}
                    {ev.is_external && (
                      <span className="text-xs px-1 py-0.5 rounded" style={{ background: '#f4f4f0', color: '#9e9e96', fontSize: '10px' }}>
                        {ev.source_name ?? 'extern'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: '#9e9e96' }}>
                    {startDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })} · {startTimeStr}
                    {ev.location && ` · ${ev.location}`}
                  </div>
                </div>
                {!ev.is_external && ev.id && (
                  <button
                    onClick={() => handleDelete(ev.id!)}
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#b5b5a8', background: 'none', border: 'none', cursor: 'pointer' }}
                    title="Termin löschen"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
