import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'

const DAY_MAP: Record<string, string> = {
  Mo: 'Montag',
  Di: 'Dienstag',
  Mi: 'Mittwoch',
  Do: 'Donnerstag',
  Fr: 'Freitag',
}

const DAYS = Object.keys(DAY_MAP)

const COLORS = ['#7c9a7e', '#a8c4a8', '#c4d4c4', '#8bb08d', '#6b8e6b']

interface ScheduleEntry {
  id: number
  subject: string
  day_of_week: string
  start_time: string 
  end_time: string
  room: string | null
  teacher: string | null
  user_id: number | null
}

interface NewEntryForm {
  subject: string
  day_of_week: string
  startTime: string
  endTime: string
  room: string
  teacher: string
}

const todayIndex = Math.min(new Date().getDay() - 1, 4)
const todayKey = DAYS[todayIndex >= 0 ? todayIndex : 0]

function formatTime(t: string): string {
  return t.substring(0, 5)
}

export default function ScheduleWidget() {
  const [activeDay, setActiveDay] = useState(todayKey)
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const EMPTY_FORM: NewEntryForm = {
    subject: '',
    day_of_week: DAY_MAP[activeDay],
    startTime: '08:00',
    endTime: '08:45',
    room: '',
    teacher: '',
  }
  const [form, setForm] = useState<NewEntryForm>(EMPTY_FORM)

  const loadSchedule = useCallback(async () => {
    try {
      setError(null)
      const { data } = await api.get<ScheduleEntry[]>('/api/schedule/')
      setEntries(data)
    } catch (err) {
      console.error('[ScheduleWidget] Fehler beim Laden:', err)
      setError('Stundenplan konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  const dayFullName = DAY_MAP[activeDay]
  const lessons = entries
    .filter((e) => e.day_of_week === dayFullName)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const handleCreate = async () => {
    if (!form.subject.trim()) return
    setSubmitting(true)
    try {
      await api.post('/api/schedule/', {
        subject: form.subject,
        day_of_week: form.day_of_week,
        start_time: form.startTime + ':00',
        end_time: form.endTime + ':00',
        room: form.room || null,
        teacher: form.teacher || null,
      })
      setForm({ ...EMPTY_FORM, day_of_week: DAY_MAP[activeDay] })
      setShowAddForm(false)
      await loadSchedule()
    } catch (err) {
      console.error('[ScheduleWidget] Fehler beim Erstellen:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const backup = [...entries]
    setEntries((prev) => prev.filter((e) => e.id !== id))
    try {
      await api.delete(`/api/schedule/${id}`)
    } catch (err) {
      console.error('[ScheduleWidget] Fehler beim Löschen:', err)
      setEntries(backup)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: '#9e9e96' }}>Lade Stundenplan…</p>
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-2">
        <span className="text-2xl mb-2">⚠️</span>
        <p className="text-xs" style={{ color: '#9e9e96' }}>{error}</p>
        <button
          onClick={loadSchedule}
          className="mt-2 text-xs px-3 py-1 rounded-lg"
          style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', color: '#7c9a7e' }}
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-1 items-center">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => { setActiveDay(d); setForm((f) => ({ ...f, day_of_week: DAY_MAP[d] })) }}
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
        <button
          onClick={() => { setShowAddForm(!showAddForm); setForm({ ...EMPTY_FORM, day_of_week: DAY_MAP[activeDay] }) }}
          className="ml-auto w-6 h-6 rounded-lg text-sm flex items-center justify-center transition-colors"
          style={{ border: '1px solid #e8e8e2', background: showAddForm ? '#7c9a7e' : 'none', cursor: 'pointer', color: showAddForm ? 'white' : '#7c9a7e' }}
          title="Neue Stunde"
        >
          +
        </button>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: '#f8f8f4', border: '1px solid #e8e8e2' }}>
          <input
            className="px-2 py-1.5 rounded-lg text-sm outline-none border"
            style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
            placeholder="Fach *"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <div className="flex gap-2">
            <select
              className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none border"
              style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
              value={form.day_of_week}
              onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
            >
              {Object.entries(DAY_MAP).map(([short, full]) => (
                <option key={short} value={full}>{full}</option>
              ))}
            </select>
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
          <div className="flex gap-2">
            <input
              className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none border"
              style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
              placeholder="Raum"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            />
            <input
              className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none border"
              style={{ background: 'white', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
              placeholder="Lehrer"
              value={form.teacher}
              onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!form.subject.trim() || submitting}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white font-medium transition-opacity disabled:opacity-50"
              style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {submitting ? 'Speichern…' : 'Stunde hinzufügen'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', color: '#7a7a72', fontFamily: 'inherit' }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Lessons */}
      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {lessons.map((lesson, i) => (
          <div
            key={lesson.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
            style={{ background: '#f4f9f4', borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}
          >
            <div className="text-xs w-24 flex-shrink-0" style={{ color: '#9e9e96' }}>
              {formatTime(lesson.start_time)} – {formatTime(lesson.end_time)}
            </div>
            <div className="text-sm font-medium flex-1">{lesson.subject}</div>
            {lesson.teacher && (
              <div className="text-xs" style={{ color: '#9e9e96' }}>
                {lesson.teacher}
              </div>
            )}
            {lesson.room && (
              <div className="text-xs px-2 py-0.5 rounded" style={{ background: '#f4f4f0', color: '#9e9e96' }}>
                {lesson.room}
              </div>
            )}
            <button
              onClick={() => handleDelete(lesson.id)}
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: '#b5b5a8', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Stunde löschen"
            >
              ✕
            </button>
          </div>
        ))}
        {lessons.length === 0 && !showAddForm && (
          <div className="text-sm text-center py-6" style={{ color: '#b5b5a8' }}>
            Kein Unterricht
          </div>
        )}
      </div>
    </div>
  )
}
