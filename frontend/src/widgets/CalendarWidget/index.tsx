import { useState, useEffect, useCallback } from 'react'
import type { WidgetProps } from '../../types'
import type { CalendarEvent, EventFormData, ViewMode } from './types'
import { useGoogleCalendar } from './useGoogleCalendar'
import GoogleAuthButton from './GoogleAuthButton'
import MonthView from './MonthView'
import WeekView from './WeekView'
import EventModal from './EventModal'

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

export default function CalendarWidget(_props: WidgetProps) {
  const {
    isSignedIn,
    isLoading,
    error,
    calendars,
    events,
    signIn,
    signOut,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useGoogleCalendar()

  /* ── View state ───────────────────────────────────────────── */
  const today = new Date()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [weekOffset, setWeekOffset] = useState(0)

  /* ── Modal state ──────────────────────────────────────────── */
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [defaultDate, setDefaultDate] = useState<string | undefined>()

  /* ── Compute time range for fetching ──────────────────────── */
  const getTimeRange = useCallback((): { min: Date; max: Date } => {
    if (viewMode === 'month') {
      // Fetch 6 weeks around the month to cover edge days
      const min = new Date(viewYear, viewMonth, -6)
      const max = new Date(viewYear, viewMonth + 1, 7)
      return { min, max }
    } else {
      // Week view: current week ± offset
      const refDate = new Date(today)
      refDate.setDate(refDate.getDate() + weekOffset * 7)
      const dayOfWeek = (refDate.getDay() + 6) % 7
      const min = new Date(refDate)
      min.setDate(refDate.getDate() - dayOfWeek)
      min.setHours(0, 0, 0, 0)
      const max = new Date(min)
      max.setDate(min.getDate() + 7)
      return { min, max }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, viewYear, viewMonth, weekOffset])

  /* ── Fetch events when signed in or view changes ──────────── */
  useEffect(() => {
    if (!isSignedIn) return
    const { min, max } = getTimeRange()
    fetchEvents(min, max)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, viewMode, viewYear, viewMonth, weekOffset])

  /* ── Month navigation ─────────────────────────────────────── */
  const prevMonth = () =>
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11 }
      return m - 1
    })
  const nextMonth = () =>
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0 }
      return m + 1
    })

  /* ── Week navigation ──────────────────────────────────────── */
  const prevWeek = () => setWeekOffset((o) => o - 1)
  const nextWeek = () => setWeekOffset((o) => o + 1)

  /* ── Event handlers ───────────────────────────────────────── */
  const handleEventClick = (ev: CalendarEvent) => {
    if (ev.editable) {
      setModalEvent(ev)
      setModalMode('edit')
    }
  }

  const handleAddEvent = (date: string) => {
    if (!isSignedIn) {
      signIn()
      return
    }
    setDefaultDate(date)
    setModalEvent(null)
    setModalMode('create')
  }

  const handleSave = async (data: EventFormData, existingEvent?: CalendarEvent) => {
    const eventBody = data.allDay
      ? {
          summary: data.title,
          description: data.description || undefined,
          start: { date: data.date },
          end: { date: data.date },
        }
      : {
          summary: data.title,
          description: data.description || undefined,
          start: { dateTime: `${data.date}T${data.startTime}:00`, timeZone: TZ },
          end: { dateTime: `${data.date}T${data.endTime}:00`, timeZone: TZ },
        }

    if (existingEvent) {
      await updateEvent(existingEvent.calendarId, existingEvent.id, eventBody)
    } else {
      await createEvent(data.calendarId, eventBody as Parameters<typeof createEvent>[1])
    }

    setModalMode(null)
    setModalEvent(null)

    // Refresh events
    const { min, max } = getTimeRange()
    fetchEvents(min, max)
  }

  const handleDelete = async (ev: CalendarEvent) => {
    await deleteEvent(ev.calendarId, ev.id)
    setModalMode(null)
    setModalEvent(null)

    const { min, max } = getTimeRange()
    fetchEvents(min, max)
  }

  /* ── Not signed in: Show connect screen ───────────────────── */
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full py-8">
        <div className="text-3xl" style={{ opacity: 0.3 }}>📅</div>
        <div className="text-center">
          <div className="text-sm font-medium mb-1" style={{ color: '#2d2d2d' }}>
            Google Kalender verbinden
          </div>
          <div className="text-xs max-w-[220px] mx-auto" style={{ color: '#9e9e96' }}>
            Verbinde deinen Google Kalender um Termine der Familie anzuzeigen und zu verwalten.
          </div>
        </div>
        <GoogleAuthButton isSignedIn={false} onSignIn={signIn} onSignOut={signOut} />
        {error && (
          <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#fef2f2', color: '#c45c5c' }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  /* ── Signed in: Show calendar ─────────────────────────────── */
  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Top bar: view toggle + auth */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['month', 'week'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode)
                if (mode === 'week') setWeekOffset(0)
              }}
              className="px-3 py-1 rounded-lg text-xs transition-colors"
              style={{
                background: viewMode === mode ? '#f4f4f0' : 'transparent',
                color: viewMode === mode ? '#2d2d2d' : '#9e9e96',
                fontWeight: viewMode === mode ? 600 : 400,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {mode === 'month' ? 'Monat' : 'Woche'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="text-xs" style={{ color: '#b5b5a8' }}>Laden...</div>
          )}
          <button
            onClick={() => handleAddEvent(
              `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            )}
            className="w-7 h-7 rounded-lg text-white text-base flex items-center justify-center flex-shrink-0"
            style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer' }}
            title="Neuer Termin"
          >
            +
          </button>
          <GoogleAuthButton isSignedIn={isSignedIn} onSignIn={signIn} onSignOut={signOut} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#fef2f2', color: '#c45c5c' }}>
          {error}
        </div>
      )}

      {/* View */}
      <div className="flex-1 min-h-0">
        {viewMode === 'month' ? (
          <MonthView
            viewYear={viewYear}
            viewMonth={viewMonth}
            events={events}
            onPrev={prevMonth}
            onNext={nextMonth}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
          />
        ) : (
          <WeekView
            weekOffset={weekOffset}
            events={events}
            onPrevWeek={prevWeek}
            onNextWeek={nextWeek}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
          />
        )}
      </div>

      {/* Event Modal */}
      {modalMode && (
        <EventModal
          event={modalMode === 'edit' ? modalEvent : null}
          calendars={calendars}
          defaultDate={defaultDate}
          onSave={handleSave}
          onDelete={modalMode === 'edit' ? handleDelete : undefined}
          onCancel={() => { setModalMode(null); setModalEvent(null) }}
        />
      )}
    </div>
  )
}
