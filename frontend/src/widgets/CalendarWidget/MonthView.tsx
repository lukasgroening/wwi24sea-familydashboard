import { useState } from 'react'
import type { CalendarEvent } from './types'
import DayEventsPopover from './DayEventsPopover'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

interface Props {
  viewYear: number
  viewMonth: number
  events: CalendarEvent[]
  onPrev: () => void
  onNext: () => void
  onEventClick: (event: CalendarEvent) => void
  onAddEvent: (date: string) => void
}

export default function MonthView({ viewYear, viewMonth, events, onPrev, onNext, onEventClick, onAddEvent }: Props) {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const daysInPrev = getDaysInMonth(viewYear, viewMonth - 1)

  const cells: { day: number; current: boolean; date: Date }[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i
    cells.push({ day: d, current: false, date: new Date(viewYear, viewMonth - 1, d) })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, date: new Date(viewYear, viewMonth, d) })
  }
  while (cells.length % 7 !== 0) {
    const d = cells.length - daysInMonth - firstDay + 1
    cells.push({ day: d, current: false, date: new Date(viewYear, viewMonth + 1, d) })
  }

  // Build map: dateKey → events[]
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const start = new Date(ev.start)
    const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
    const arr = eventsByDate.get(key) ?? []
    arr.push(ev)
    eventsByDate.set(key, arr)
  }

  const getEventsForDate = (d: Date) => {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    return eventsByDate.get(key) ?? []
  }

  const isToday = (cell: { day: number; current: boolean; date: Date }) =>
    cell.current && isSameDay(cell.date, today)

  const isSelected = (cell: { date: Date }) =>
    selectedDate && isSameDay(cell.date, selectedDate)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base" style={{ color: '#2d2d2d' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <div className="flex gap-1">
          {[['‹', onPrev], ['›', onNext]].map(([label, fn]) => (
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

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Day headers */}
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-1 pb-2 tracking-wide" style={{ color: '#b5b5a8' }}>
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, i) => {
          const dayEvents = getEventsForDate(cell.date)
          const today_ = isToday(cell)
          const selected_ = isSelected(cell)

          return (
            <div
              key={i}
              className="text-center py-1 rounded-lg text-xs cursor-pointer transition-colors relative"
              style={{
                background: selected_ ? '#f0f5f0' : today_ ? '#7c9a7e' : 'transparent',
                color: today_ ? 'white' : cell.current ? '#4a4a44' : '#c8c8c0',
                fontWeight: today_ || selected_ ? 500 : 400,
                border: selected_ ? '1px solid #7c9a7e' : '1px solid transparent',
              }}
              onClick={() => setSelectedDate(prev =>
                prev && isSameDay(prev, cell.date) ? null : cell.date
              )}
            >
              {cell.day}
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-px justify-center mt-0.5">
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <div
                      key={j}
                      className="w-1 h-1 rounded-full"
                      style={{ background: today_ ? 'rgba(255,255,255,0.7)' : ev.color }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: today_ ? 'rgba(255,255,255,0.4)' : '#d4d4cc' }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Day events popover / upcoming events */}
      {selectedDate ? (
        <DayEventsPopover
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
          onEventClick={onEventClick}
          onAddEvent={onAddEvent}
          onClose={() => setSelectedDate(null)}
        />
      ) : (
        <UpcomingEvents events={events} viewYear={viewYear} viewMonth={viewMonth} onEventClick={onEventClick} />
      )}
    </div>
  )
}

/* ─── Upcoming Events sub-component ─────────────────────────── */
function UpcomingEvents({
  events,
  viewYear,
  viewMonth,
  onEventClick,
}: {
  events: CalendarEvent[]
  viewYear: number
  viewMonth: number
  onEventClick: (ev: CalendarEvent) => void
}) {
  const now = new Date()
  const upcoming = events
    .filter((ev) => {
      const d = new Date(ev.start)
      return d >= now && d.getFullYear() === viewYear && d.getMonth() === viewMonth
    })
    .slice(0, 4)

  if (upcoming.length === 0) return null

  return (
    <div className="border-t pt-3 flex flex-col gap-2" style={{ borderColor: '#f0f0ea' }}>
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#b5b5a8' }}>
        Nächste Termine
      </div>
      {upcoming.map((ev) => (
        <div
          key={ev.id}
          className="flex items-center gap-2.5 cursor-pointer rounded-lg px-1 py-0.5 transition-colors"
          style={{ background: 'transparent' }}
          onClick={() => onEventClick(ev)}
        >
          <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: ev.color }} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{ev.title}</div>
            <div className="text-xs" style={{ color: '#9e9e96' }}>
              {new Date(ev.start).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
              {!ev.allDay && ` · ${new Date(ev.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>
          {ev.calendarName && (
            <div className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f4f4f0', color: '#9e9e96' }}>
              {ev.calendarName}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
