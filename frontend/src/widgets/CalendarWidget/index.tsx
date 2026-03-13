import { useState } from 'react'
import type { WidgetProps } from '../../types'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

// Mock events — swap with: api.get('/events') once backend is ready
const mockEvents = [
  { date: '2026-03-13', title: 'Elternabend', time: '19:00', color: '#7c9a7e' },
  { date: '2026-03-18', title: 'Zahnarzt Lena', time: '15:00', color: '#a8c4a8' },
  { date: '2026-03-28', title: 'Geburtstag Oma', time: 'ganztags', color: '#c4a882' },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // Monday-based: 0=Mo … 6=So
  return (new Date(year, month, 1).getDay() + 6) % 7
}

export default function CalendarWidget(_props: WidgetProps) {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const daysInMonth = getDaysInMonth(view.year, view.month)
  const firstDay = getFirstDayOfMonth(view.year, view.month)
  const daysInPrev = getDaysInMonth(view.year, view.month - 1)

  const cells: { day: number; current: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false })

  const eventDates = new Set(
    mockEvents
      .filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === view.year && d.getMonth() === view.month
      })
      .map((e) => new Date(e.date).getDate())
  )

  const prev = () => setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const next = () => setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

  const isToday = (day: number, current: boolean) =>
    current && day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear()

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base">{MONTHS[view.month]} {view.year}</span>
        <div className="flex gap-1">
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
      <div className="border-t pt-3 flex flex-col gap-2" style={{ borderColor: '#f0f0ea' }}>
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#b5b5a8' }}>
          Nächste Termine
        </div>
        {mockEvents.map((ev) => (
          <div key={ev.title} className="flex items-center gap-2.5">
            <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: ev.color }} />
            <div>
              <div className="text-sm font-medium">{ev.title}</div>
              <div className="text-xs" style={{ color: '#9e9e96' }}>
                {new Date(ev.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })} · {ev.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
