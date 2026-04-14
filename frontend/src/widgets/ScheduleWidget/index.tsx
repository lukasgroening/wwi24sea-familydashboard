import { useState, useEffect } from 'react'
import api from '../../lib/api'

const DAY_LABELS: Record<string, string> = {
  Montag: 'Mo',
  Dienstag: 'Di',
  Mittwoch: 'Mi',
  Donnerstag: 'Do',
  Freitag: 'Fr',
  Samstag: 'Sa',
  Sonntag: 'So',
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

interface ScheduleEntry {
  id: number
  subject: string
  day_of_week: string
  start_time: string
  end_time: string
  room?: string | null
  teacher?: string | null
  user_id?: number | null
}

const todayIndex = Math.min(new Date().getDay() - 1, 4)
const todayKey = DAYS[todayIndex >= 0 ? todayIndex : 0]

function formatTime(t: string) {
  // t is "HH:MM:SS" or "HH:MM"
  return t.slice(0, 5)
}

export default function ScheduleWidget() {
  const [activeDay, setActiveDay] = useState(todayKey)
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<ScheduleEntry[]>('/api/schedule/')
      .then((r) => setEntries(r.data))
      .catch(() => setError('Stundenplan konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [])

  const lessons = entries
    .filter((e) => e.day_of_week === activeDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const COLORS = ['#7c9a7e', '#a8c4a8', '#c4d4c4', '#8fb8a0', '#b5cdb5']

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Day tabs */}
      <div className="flex gap-1">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className="px-3 py-1 rounded-lg text-xs transition-colors"
            style={{
              background: activeDay === d ? '#f4f4f0' : 'transparent',
              color: activeDay === d ? '#2d2d2d' : '#9e9e96',
              fontWeight: activeDay === d ? 500 : 400,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {loading && (
          <p className="text-sm text-center py-6" style={{ color: '#b5b5a8' }}>Lade Stundenplan…</p>
        )}
        {error && (
          <p className="text-sm text-center py-6" style={{ color: '#b91c1c' }}>{error}</p>
        )}
        {!loading && !error && lessons.length === 0 && (
          <div className="text-sm text-center py-6" style={{ color: '#b5b5a8' }}>
            Kein Unterricht
          </div>
        )}
        {!loading && lessons.map((lesson, i) => (
          <div
            key={lesson.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: '#f4f9f4', borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}
          >
            <div className="text-xs w-20 flex-shrink-0" style={{ color: '#9e9e96' }}>
              {formatTime(lesson.start_time)} – {formatTime(lesson.end_time)}
            </div>
            <div className="text-sm font-medium flex-1">{lesson.subject}</div>
            {lesson.room && (
              <div className="text-xs px-2 py-0.5 rounded" style={{ background: '#f4f4f0', color: '#9e9e96' }}>
                {lesson.room}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
