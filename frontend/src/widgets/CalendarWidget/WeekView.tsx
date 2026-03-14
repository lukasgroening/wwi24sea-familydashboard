import type { CalendarEvent } from './types'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06:00 – 22:00
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getWeekDates(refDate: Date): Date[] {
  const d = new Date(refDate)
  const dayOfWeek = (d.getDay() + 6) % 7 // Monday-based
  d.setDate(d.getDate() - dayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d)
    date.setDate(d.getDate() + i)
    return date
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getWeekLabel(dates: Date[]): string {
  const first = dates[0]
  const last = dates[6]
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}. – ${last.toLocaleDateString('de-DE', opts)} ${first.getFullYear()}`
  }
  return `${first.toLocaleDateString('de-DE', opts)} – ${last.toLocaleDateString('de-DE', opts)} ${last.getFullYear()}`
}

interface Props {
  weekOffset: number
  events: CalendarEvent[]
  onPrevWeek: () => void
  onNextWeek: () => void
  onEventClick: (event: CalendarEvent) => void
  onAddEvent: (date: string) => void
}

export default function WeekView({ weekOffset, events, onPrevWeek, onNextWeek, onEventClick, onAddEvent }: Props) {
  const today = new Date()
  const refDate = new Date(today)
  refDate.setDate(refDate.getDate() + weekOffset * 7)
  const weekDates = getWeekDates(refDate)

  // Map events to days
  const eventsByDay: CalendarEvent[][] = weekDates.map((d) =>
    events.filter((ev) => {
      const start = new Date(ev.start)
      return isSameDay(start, d)
    }),
  )

  const HOUR_HEIGHT = 48 // px per hour
  const HEADER_HEIGHT = 44

  function getEventPosition(ev: CalendarEvent) {
    if (ev.allDay) return null
    const start = new Date(ev.start)
    const end = new Date(ev.end)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const top = ((startMinutes - 360) / 60) * HOUR_HEIGHT // 360 = 6:00
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20)
    return { top, height }
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base" style={{ color: '#2d2d2d' }}>
          {getWeekLabel(weekDates)}
        </span>
        <div className="flex gap-1">
          {[['‹', onPrevWeek], ['›', onNextWeek]].map(([label, fn]) => (
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

      {/* Week grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-lg" style={{ border: '1px solid #e8e8e2' }}>
        <div className="flex" style={{ minHeight: HOURS.length * HOUR_HEIGHT + HEADER_HEIGHT }}>
          {/* Time column */}
          <div className="flex-shrink-0" style={{ width: '44px' }}>
            <div style={{ height: HEADER_HEIGHT }} />
            {HOURS.map((h) => (
              <div
                key={h}
                className="text-xs text-right pr-2 relative"
                style={{ height: HOUR_HEIGHT, color: '#b5b5a8' }}
              >
                <span style={{ position: 'relative', top: '-6px' }}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date, colIdx) => {
            const isToday_ = isSameDay(date, today)
            const dayEvents = eventsByDay[colIdx]
            const allDayEvents = dayEvents.filter((ev) => ev.allDay)
            const timedEvents = dayEvents.filter((ev) => !ev.allDay)
            const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

            return (
              <div
                key={colIdx}
                className="flex-1 relative"
                style={{ borderLeft: '1px solid #f0f0ea', minWidth: 0 }}
              >
                {/* Day header */}
                <div
                  className="flex flex-col items-center justify-center sticky top-0 z-10"
                  style={{
                    height: HEADER_HEIGHT,
                    background: isToday_ ? '#7c9a7e' : '#fafaf8',
                    borderBottom: '1px solid #e8e8e2',
                  }}
                >
                  <div className="text-xs font-semibold" style={{ color: isToday_ ? 'rgba(255,255,255,0.7)' : '#b5b5a8' }}>
                    {DAY_LABELS[colIdx]}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: isToday_ ? '#ffffff' : '#4a4a44' }}>
                    {date.getDate()}
                  </div>
                </div>

                {/* All-day events */}
                {allDayEvents.length > 0 && (
                  <div className="px-0.5 py-0.5">
                    {allDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onEventClick(ev)}
                        className="text-xs px-1 py-0.5 rounded mb-0.5 truncate cursor-pointer"
                        style={{ background: ev.color, color: '#ffffff', fontSize: '10px' }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                )}

                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="cursor-pointer transition-colors"
                    style={{
                      height: HOUR_HEIGHT,
                      borderTop: '1px solid #f4f4f0',
                    }}
                    onClick={() => onAddEvent(ymd)}
                    title={`${String(h).padStart(2, '0')}:00 – Termin erstellen`}
                  />
                ))}

                {/* Timed events positioned absolutely */}
                {timedEvents.map((ev) => {
                  const pos = getEventPosition(ev)
                  if (!pos) return null
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                      className="absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden cursor-pointer transition-opacity hover:opacity-90"
                      style={{
                        top: HEADER_HEIGHT + pos.top,
                        height: pos.height,
                        background: ev.color,
                        color: '#ffffff',
                        fontSize: '10px',
                        lineHeight: '1.3',
                        zIndex: 5,
                        opacity: 0.85,
                      }}
                    >
                      <div className="font-medium truncate">{ev.title}</div>
                      {pos.height > 30 && (
                        <div style={{ opacity: 0.8 }}>
                          {new Date(ev.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Current time indicator */}
                {isToday_ && (() => {
                  const nowMinutes = today.getHours() * 60 + today.getMinutes()
                  const top = ((nowMinutes - 360) / 60) * HOUR_HEIGHT
                  if (top < 0 || top > HOURS.length * HOUR_HEIGHT) return null
                  return (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: HEADER_HEIGHT + top }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#c45c5c' }} />
                        <div className="flex-1 h-px" style={{ background: '#c45c5c' }} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
