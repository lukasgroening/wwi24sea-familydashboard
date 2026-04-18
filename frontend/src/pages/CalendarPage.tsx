import { useState } from 'react'
import { X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import ErrorAlert from '../components/ErrorAlert'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

interface CalendarEvent {
  id: number | null
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
  start_time: string
  end_time: string
  location: string
  color: string
}

const COLOR_OPTIONS = [
  { label: 'Grün',     value: 'oklch(0.655 0.053 146.8)' },
  { label: 'Hellgrün', value: 'oklch(0.792 0.049 145.2)' },
  { label: 'Sand',     value: 'oklch(0.747 0.061 75.1)'  },
  { label: 'Blau',     value: 'oklch(0.705 0.060 247.1)' },
  { label: 'Lila',     value: 'oklch(0.667 0.104 310.1)' },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7
}
function toLocalDatetimeInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  borderRadius: '10px',
  border: '1px solid var(--color-stone-border)',
  background: 'var(--color-stone-50)',
  fontFamily: 'inherit',
  fontSize: '14px',
  outline: 'none',
  color: 'var(--color-stone-900)',
  boxSizing: 'border-box',
}

export default function CalendarPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [form, setForm] = useState<NewEventForm>({
    title: '',
    description: '',
    start_time: toLocalDatetimeInput(today),
    end_time: toLocalDatetimeInput(new Date(today.getTime() + 60 * 60 * 1000)),
    location: '',
    color: COLOR_OPTIONS[0].value,
  })
  const [formError, setFormError] = useState('')

  const isAdmin = user?.role === 'Familien-Administrator' || user?.role === 'System-Administrator'

  const { data: events = [], isLoading, error } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events'],
    queryFn: () => api.get('/api/calendar/events').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<NewEventForm, 'description' | 'location'> & { description?: string; location?: string }) =>
      api.post('/api/calendar/events', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setShowModal(false)
      setFormError('')
      setForm({
        title: '',
        description: '',
        start_time: toLocalDatetimeInput(today),
        end_time: toLocalDatetimeInput(new Date(today.getTime() + 60 * 60 * 1000)),
        location: '',
        color: COLOR_OPTIONS[0].value,
      })
    },
    onError: () => setFormError('Fehler beim Erstellen des Termins.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/calendar/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setDeleteConfirm(null)
    },
  })

  const daysInMonth = getDaysInMonth(view.year, view.month)
  const firstDay = getFirstDayOfMonth(view.year, view.month)
  const daysInPrev = getDaysInMonth(view.year, view.month - 1)

  const cells: { day: number; current: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false })

  const eventsByDay: Record<number, CalendarEvent[]> = {}
  events.forEach((ev) => {
    const d = new Date(ev.start_time)
    if (d.getFullYear() === view.year && d.getMonth() === view.month) {
      const day = d.getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push(ev)
    }
  })

  const selectedEvents = selectedDay !== null
    ? (eventsByDay[selectedDay] ?? []).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    : [...events]
        .filter((e) => new Date(e.start_time) >= new Date(today.toDateString()))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 8)

  const isToday = (day: number, current: boolean) =>
    current && day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear()

  const handleDayClick = (day: number, current: boolean) => {
    if (!current) return
    setSelectedDay(selectedDay === day ? null : day)
  }

  const openCreateModal = () => {
    const base = selectedDay
      ? new Date(view.year, view.month, selectedDay, 10, 0)
      : today
    setForm({
      title: '',
      description: '',
      start_time: toLocalDatetimeInput(base),
      end_time: toLocalDatetimeInput(new Date(base.getTime() + 60 * 60 * 1000)),
      location: '',
      color: COLOR_OPTIONS[0].value,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Titel ist erforderlich.'); return }
    if (form.end_time <= form.start_time) { setFormError('Endzeit muss nach der Startzeit liegen.'); return }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location || undefined,
      color: form.color,
    })
  }

  const prev = () => {
    setSelectedDay(null)
    setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  }
  const next = () => {
    setSelectedDay(null)
    setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kalender</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-stone-600)' }}>Familientermine auf einen Blick</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Termin hinzufügen
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar grid */}
        <div
          className="rounded-2xl p-6 flex-shrink-0"
          style={{ background: 'white', border: '1px solid var(--color-stone-border)', width: '100%', maxWidth: '480px' }}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="font-semibold text-base">{MONTHS[view.month]} {view.year}</span>
            <div className="flex gap-1">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                style={{ border: '1px solid var(--color-stone-border)', background: 'none', cursor: 'pointer', color: 'var(--color-stone-700)' }}
              >‹</button>
              <button
                onClick={next}
                className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                style={{ border: '1px solid var(--color-stone-border)', background: 'none', cursor: 'pointer', color: 'var(--color-stone-700)' }}
              >›</button>
            </div>
          </div>

          {isLoading && <p className="text-sm text-center py-8" style={{ color: 'var(--color-stone-500)' }}>Lade Termine…</p>}
          {error && <p className="text-sm text-center py-8" style={{ color: 'var(--color-danger-700)' }}>Fehler beim Laden.</p>}

          {!isLoading && (
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--color-stone-500)' }}>
                  {d}
                </div>
              ))}
              {cells.map((cell, i) => {
                const today_ = isToday(cell.day, cell.current)
                const isSelected = cell.current && selectedDay === cell.day
                const dayEvents = cell.current ? (eventsByDay[cell.day] ?? []) : []
                return (
                  <div
                    key={i}
                    onClick={() => handleDayClick(cell.day, cell.current)}
                    className="flex flex-col items-center py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      background: today_ ? 'var(--color-sage-500)' : isSelected ? 'var(--color-sage-50)' : 'transparent',
                      color: today_ ? 'white' : cell.current ? 'var(--color-stone-800)' : 'var(--color-stone-dim)',
                      fontWeight: today_ || isSelected ? 500 : 400,
                      cursor: cell.current ? 'pointer' : 'default',
                      border: isSelected && !today_ ? '1px solid var(--color-sage-500)' : '1px solid transparent',
                    }}
                  >
                    {cell.day}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, j) => (
                          <div
                            key={j}
                            className="w-1 h-1 rounded-full"
                            style={{ background: today_ ? 'oklch(1 0 0 / 0.7)' : (ev.color ?? 'var(--color-sage-500)') }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Event list */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="text-sm font-semibold" style={{ color: 'var(--color-stone-900)' }}>
            {selectedDay !== null
              ? `${selectedDay}. ${MONTHS[view.month]} ${view.year}`
              : 'Nächste Termine'}
          </div>

          {selectedDay !== null && selectedEvents.length === 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'white', border: '1px solid var(--color-stone-border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-stone-500)' }}>Keine Termine an diesem Tag.</p>
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="mt-3 px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Termin hinzufügen
                </button>
              )}
            </div>
          )}

          {selectedEvents.map((ev, i) => (
            <div
              key={ev.id ?? i}
              className="rounded-2xl p-4 flex gap-3"
              style={{ background: 'white', border: '1px solid var(--color-stone-border)' }}
            >
              <div
                className="w-1 rounded-full flex-shrink-0 self-stretch"
                style={{ background: ev.color ?? 'var(--color-sage-500)', minHeight: '40px' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{ev.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-stone-600)' }}>
                      {new Date(ev.start_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(ev.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(ev.end_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {ev.location && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-stone-500)' }}>📍 {ev.location}</div>
                    )}
                    {ev.description && (
                      <div className="text-xs mt-1" style={{ color: 'var(--color-stone-600)' }}>{ev.description}</div>
                    )}
                  </div>
                  {isAdmin && !ev.is_external && ev.id !== null && (
                    deleteConfirm === ev.id ? (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => deleteMutation.mutate(ev.id!)}
                          disabled={deleteMutation.isPending}
                          className="px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'var(--color-danger-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-danger-700)' }}
                        >
                          Löschen
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
                        >
                          Abbruch
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(ev.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                        style={{ background: 'var(--color-danger-50)', border: 'none', cursor: 'pointer', color: 'var(--color-danger-500)' }}
                        title="Termin löschen"
                      >
                        <X size={12} />
                      </button>
                    )
                  )}
                </div>
                {ev.is_external && ev.source_name && (
                  <span className="mt-1 inline-block px-2 py-0.5 rounded text-xs" style={{ background: 'var(--color-stone-100)', color: 'var(--color-stone-600)' }}>
                    Extern · {ev.source_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 w-full"
            style={{ background: 'white', border: '1px solid var(--color-stone-border)', boxShadow: '0 8px 32px oklch(0 0 0 / 0.12)', maxWidth: '480px' }}
          >
            <div>
              <div className="text-base font-semibold">Neuer Termin</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-stone-600)' }}>Termin für alle Familienmitglieder</div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Titel *</label>
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="z.B. Elternabend"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Start</label>
                  <input
                    type="datetime-local"
                    style={inputStyle}
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ende</label>
                  <input
                    type="datetime-local"
                    style={inputStyle}
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Ort</label>
                <input
                  style={inputStyle}
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="z.B. Schule, Zuhause"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Beschreibung</label>
                <textarea
                  style={{ ...inputStyle, resize: 'none', height: '72px' }}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optionale Notiz…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Farbe</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        background: c.value,
                        border: form.color === c.value ? '2px solid var(--color-stone-900)' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: form.color === c.value ? 'scale(1.2)' : 'scale(1)',
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <ErrorAlert message={formError} />

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                  style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {createMutation.isPending ? 'Speichern…' : 'Speichern'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
