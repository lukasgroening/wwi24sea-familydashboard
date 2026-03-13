import { useState } from 'react'
import type { WidgetProps } from '../../types'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr']

// Mock data — swap with: api.get('/schedule?personId=...') once backend is ready
const mockSchedule: Record<string, { time: string; subject: string; room: string; color: string }[]> = {
  Mo: [
    { time: '08:00 – 08:45', subject: 'Mathematik', room: 'R. 204', color: '#7c9a7e' },
    { time: '08:50 – 09:35', subject: 'Kunst', room: 'R. 015', color: '#a8c4a8' },
    { time: '09:55 – 10:40', subject: 'Sachkunde', room: 'R. 112', color: '#c4d4c4' },
  ],
  Di: [
    { time: '08:00 – 08:45', subject: 'Deutsch', room: 'R. 112', color: '#7c9a7e' },
    { time: '08:50 – 09:35', subject: 'Musik', room: 'Aula', color: '#a8c4a8' },
    { time: '09:55 – 10:40', subject: 'Mathematik', room: 'R. 204', color: '#c4d4c4' },
    { time: '10:45 – 11:30', subject: 'Sport', room: 'Turnhalle', color: '#7c9a7e' },
  ],
  Mi: [
    { time: '08:00 – 08:45', subject: 'Englisch', room: 'R. 308', color: '#7c9a7e' },
    { time: '08:50 – 09:35', subject: 'Deutsch', room: 'R. 112', color: '#a8c4a8' },
  ],
  Do: [
    { time: '08:00 – 08:45', subject: 'Mathematik', room: 'R. 204', color: '#7c9a7e' },
    { time: '08:50 – 09:35', subject: 'Deutsch', room: 'R. 112', color: '#a8c4a8' },
    { time: '09:55 – 10:40', subject: 'Englisch', room: 'R. 308', color: '#c4d4c4' },
    { time: '10:45 – 11:30', subject: 'Sport', room: 'Turnhalle', color: '#7c9a7e' },
  ],
  Fr: [
    { time: '08:00 – 08:45', subject: 'Sachkunde', room: 'R. 112', color: '#7c9a7e' },
    { time: '08:50 – 09:35', subject: 'Mathematik', room: 'R. 204', color: '#a8c4a8' },
    { time: '09:55 – 10:40', subject: 'Kunst', room: 'R. 015', color: '#c4d4c4' },
  ],
}

const todayIndex = Math.min(new Date().getDay() - 1, 4)
const todayKey = DAYS[todayIndex >= 0 ? todayIndex : 0]

export default function ScheduleWidget(_props: WidgetProps) {
  const [activeDay, setActiveDay] = useState(todayKey)
  const lessons = mockSchedule[activeDay] ?? []

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
            {d}
          </button>
        ))}
      </div>

      {/* Lessons */}
      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {lessons.map((lesson, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: '#f4f9f4', borderLeft: `3px solid ${lesson.color}` }}
          >
            <div className="text-xs w-20 flex-shrink-0" style={{ color: '#9e9e96' }}>{lesson.time}</div>
            <div className="text-sm font-medium flex-1">{lesson.subject}</div>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: '#f4f4f0', color: '#9e9e96' }}>
              {lesson.room}
            </div>
          </div>
        ))}
        {lessons.length === 0 && (
          <div className="text-sm text-center py-6" style={{ color: '#b5b5a8' }}>
            Kein Unterricht
          </div>
        )}
      </div>
    </div>
  )
}
