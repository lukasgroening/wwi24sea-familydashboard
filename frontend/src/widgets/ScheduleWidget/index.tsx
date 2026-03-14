import { useState, useRef, useEffect } from 'react'
import type { WidgetProps } from '../../types'

interface Lesson {
  id: number
  time: string
  subject: string
  room: string
  color: string
}

interface Person {
  id: string
  name: string
  role: 'child' | 'aupair'
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematik: '#7c9a7e',
  Deutsch: '#658067',
  Englisch: '#8eae90',
  Sachkunde: '#a8c4a8',
  Kunst: '#b8d4b8',
  Musik: '#c4d4c4',
  Sport: '#506651',
  Physik: '#3b4d3c',
  Biologie: '#7c9a7e',
  Geschichte: '#9e9e96',
  Erdkunde: '#a8c4a8',
}

function colorForSubject(subject: string): string {
  return SUBJECT_COLORS[subject] ?? '#7c9a7e'
}

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'] as const
type Day = (typeof DAYS)[number]

const PEOPLE: Person[] = [
  { id: 'lena', name: 'Lena', role: 'child' },
  { id: 'max', name: 'Max', role: 'child' },
  { id: 'sophie', name: 'Sophie (Au-Pair)', role: 'aupair' },
]

const initialSchedules: Record<string, Record<Day, Lesson[]>> = {
  lena: {
    Mo: [
      { id: 1, time: '08:00 - 08:45', subject: 'Mathematik', room: 'R. 204', color: '#7c9a7e' },
      { id: 2, time: '08:50 - 09:35', subject: 'Kunst', room: 'R. 015', color: '#b8d4b8' },
      { id: 3, time: '09:55 - 10:40', subject: 'Sachkunde', room: 'R. 112', color: '#a8c4a8' },
    ],
    Di: [
      { id: 4, time: '08:00 - 08:45', subject: 'Deutsch', room: 'R. 112', color: '#658067' },
      { id: 5, time: '08:50 - 09:35', subject: 'Musik', room: 'Aula', color: '#c4d4c4' },
      { id: 6, time: '09:55 - 10:40', subject: 'Mathematik', room: 'R. 204', color: '#7c9a7e' },
      { id: 7, time: '10:45 - 11:30', subject: 'Sport', room: 'Turnhalle', color: '#506651' },
    ],
    Mi: [
      { id: 8, time: '08:00 - 08:45', subject: 'Englisch', room: 'R. 308', color: '#8eae90' },
      { id: 9, time: '08:50 - 09:35', subject: 'Deutsch', room: 'R. 112', color: '#658067' },
    ],
    Do: [
      { id: 10, time: '08:00 - 08:45', subject: 'Mathematik', room: 'R. 204', color: '#7c9a7e' },
      { id: 11, time: '08:50 - 09:35', subject: 'Deutsch', room: 'R. 112', color: '#658067' },
      { id: 12, time: '09:55 - 10:40', subject: 'Englisch', room: 'R. 308', color: '#8eae90' },
      { id: 13, time: '10:45 - 11:30', subject: 'Sport', room: 'Turnhalle', color: '#506651' },
    ],
    Fr: [
      { id: 14, time: '08:00 - 08:45', subject: 'Sachkunde', room: 'R. 112', color: '#a8c4a8' },
      { id: 15, time: '08:50 - 09:35', subject: 'Mathematik', room: 'R. 204', color: '#7c9a7e' },
      { id: 16, time: '09:55 - 10:40', subject: 'Kunst', room: 'R. 015', color: '#b8d4b8' },
    ],
  },
  max: {
    Mo: [
      { id: 101, time: '08:00 - 08:45', subject: 'Deutsch', room: 'R. 110', color: '#658067' },
      { id: 102, time: '08:50 - 09:35', subject: 'Mathematik', room: 'R. 202', color: '#7c9a7e' },
    ],
    Di: [
      { id: 103, time: '08:00 - 08:45', subject: 'Sport', room: 'Turnhalle', color: '#506651' },
      { id: 104, time: '08:50 - 09:35', subject: 'Englisch', room: 'R. 305', color: '#8eae90' },
      { id: 105, time: '09:55 - 10:40', subject: 'Kunst', room: 'R. 015', color: '#b8d4b8' },
    ],
    Mi: [
      { id: 106, time: '08:00 - 08:45', subject: 'Mathematik', room: 'R. 202', color: '#7c9a7e' },
      { id: 107, time: '08:50 - 09:35', subject: 'Sachkunde', room: 'R. 112', color: '#a8c4a8' },
      { id: 108, time: '09:55 - 10:40', subject: 'Musik', room: 'Aula', color: '#c4d4c4' },
    ],
    Do: [
      { id: 109, time: '08:00 - 08:45', subject: 'Deutsch', room: 'R. 110', color: '#658067' },
      { id: 110, time: '08:50 - 09:35', subject: 'Englisch', room: 'R. 305', color: '#8eae90' },
    ],
    Fr: [
      { id: 111, time: '08:00 - 08:45', subject: 'Mathematik', room: 'R. 202', color: '#7c9a7e' },
      { id: 112, time: '08:50 - 09:35', subject: 'Sport', room: 'Turnhalle', color: '#506651' },
    ],
  },
  sophie: {
    Mo: [
      { id: 201, time: '09:00 - 10:30', subject: 'Deutsch', room: 'VHS R. 3', color: '#658067' },
    ],
    Di: [],
    Mi: [
      { id: 202, time: '09:00 - 10:30', subject: 'Deutsch', room: 'VHS R. 3', color: '#658067' },
      { id: 203, time: '11:00 - 12:30', subject: 'Englisch', room: 'VHS R. 7', color: '#8eae90' },
    ],
    Do: [],
    Fr: [
      { id: 204, time: '09:00 - 10:30', subject: 'Deutsch', room: 'VHS R. 3', color: '#658067' },
    ],
  },
}

const todayIndex = Math.min(new Date().getDay() - 1, 4)
const todayKey: Day = DAYS[todayIndex >= 0 ? todayIndex : 0]

let nextId = 1000

interface EditModalProps {
  lesson: Lesson | null 
  onSave: (lesson: Lesson) => void
  onDelete?: () => void
  onCancel: () => void
}

function EditModal({ lesson, onSave, onDelete, onCancel }: EditModalProps) {
  const [subject, setSubject] = useState(lesson?.subject ?? '')
  const [time, setTime] = useState(lesson?.time ?? '')
  const [room, setRoom] = useState(lesson?.room ?? '')
  const modalRef = useRef<HTMLDivElement>(null)

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
    if (!subject.trim() || !time.trim()) return
    onSave({
      id: lesson?.id ?? ++nextId,
      subject: subject.trim(),
      time: time.trim(),
      room: room.trim(),
      color: colorForSubject(subject.trim()),
    })
  }

  const inputStyle: React.CSSProperties = {
    background: '#f8f8f4',
    borderColor: '#e8e8e2',
    fontFamily: 'inherit',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        ref={modalRef}
        className="rounded-2xl p-6 flex flex-col gap-4 w-80"
        style={{ background: '#ffffff', border: '1px solid #e8e8e2', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      >
        <div className="text-sm font-semibold" style={{ color: '#2d2d2d' }}>
          {lesson ? 'Stunde bearbeiten' : 'Neue Stunde'}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Fach *</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
              style={inputStyle}
              placeholder="z.B. Mathematik"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Zeit *</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
              style={inputStyle}
              placeholder="z.B. 08:00 – 08:45"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9e9e96' }}>Raum</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
              style={inputStyle}
              placeholder="z.B. R. 204"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Speichern
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: '#f4f4f0', color: '#7a7a72', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Abbrechen
          </button>
          {lesson && onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: '#fef2f2', color: '#c45c5c', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              title="Stunde löschen"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ScheduleWidget(_props: WidgetProps) {
  const [selectedPerson, setSelectedPerson] = useState<string>(PEOPLE[0].id)
  const [activeDay, setActiveDay] = useState<Day>(todayKey)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [editingLesson, setEditingLesson] = useState<Lesson | null | 'new'>(null)

  const person = PEOPLE.find((p) => p.id === selectedPerson)!
  const lessons = schedules[selectedPerson]?.[activeDay] ?? []

  const saveLesson = (lesson: Lesson) => {
    setSchedules((prev) => {
      const personSchedule = { ...prev[selectedPerson] }
      const dayLessons = [...(personSchedule[activeDay] ?? [])]

      const idx = dayLessons.findIndex((l) => l.id === lesson.id)
      if (idx >= 0) {
        dayLessons[idx] = lesson
      } else {
        dayLessons.push(lesson)
      }

      // Sort by time
      dayLessons.sort((a, b) => a.time.localeCompare(b.time))
      personSchedule[activeDay] = dayLessons
      return { ...prev, [selectedPerson]: personSchedule }
    })
    setEditingLesson(null)
  }

  const deleteLesson = (id: number) => {
    setSchedules((prev) => {
      const personSchedule = { ...prev[selectedPerson] }
      personSchedule[activeDay] = (personSchedule[activeDay] ?? []).filter((l) => l.id !== id)
      return { ...prev, [selectedPerson]: personSchedule }
    })
    setEditingLesson(null)
  }

  const personSchedule = schedules[selectedPerson] ?? {}

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {PEOPLE.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPerson(p.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors flex-shrink-0"
              style={{
                background: selectedPerson === p.id ? '#7c9a7e' : '#f4f4f0',
                color: selectedPerson === p.id ? '#ffffff' : '#7a7a72',
                fontWeight: selectedPerson === p.id ? 500 : 400,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
                style={{
                  background: selectedPerson === p.id ? 'rgba(255,255,255,0.25)' : '#e8e8e2',
                  color: selectedPerson === p.id ? '#ffffff' : '#9e9e96',
                }}
              >
                {p.name[0]}
              </span>
              {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEditingLesson('new')}
          className="w-7 h-7 rounded-lg text-white text-base flex items-center justify-center flex-shrink-0"
          style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer' }}
          title="Stunde hinzufügen"
        >
          +
        </button>
      </div>

      <div className="flex gap-1">
        {DAYS.map((d) => {
          const count = personSchedule[d]?.length ?? 0
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors flex-1"
              style={{
                background: activeDay === d ? '#f4f4f0' : 'transparent',
                color: activeDay === d ? '#2d2d2d' : '#9e9e96',
                fontWeight: activeDay === d ? 600 : 400,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span>{d}</span>
              {count > 0 && (
                <div className="flex gap-px">
                  {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ background: activeDay === d ? '#7c9a7e' : '#d4d4cc' }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
        {lessons.map((lesson, i) => (
          <div
            key={lesson.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group"
            style={{ background: '#f4f9f4', borderLeft: `3px solid ${lesson.color}` }}
            onClick={() => setEditingLesson(lesson)}
            title="Klicken zum Bearbeiten"
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
              style={{ background: lesson.color, color: '#ffffff' }}
            >
              {i + 1}
            </div>

            <div className="text-xs w-24 flex-shrink-0" style={{ color: '#9e9e96' }}>
              {lesson.time}
            </div>

            <div className="text-sm font-medium flex-1" style={{ color: '#2d2d2d' }}>
              {lesson.subject}
            </div>

            <div
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: '#f4f4f0', color: '#9e9e96' }}
            >
              {lesson.room}
            </div>

            <div
              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: '#b5b5a8' }}
            >
              ✎
            </div>
          </div>
        ))}

        {lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="text-2xl" style={{ opacity: 0.3 }}>📚</div>
            <div className="text-sm" style={{ color: '#b5b5a8' }}>
              Kein Unterricht am {activeDay === 'Mo' ? 'Montag' : activeDay === 'Di' ? 'Dienstag' : activeDay === 'Mi' ? 'Mittwoch' : activeDay === 'Do' ? 'Donnerstag' : 'Freitag'}
            </div>
            <button
              onClick={() => setEditingLesson('new')}
              className="text-xs px-3 py-1.5 rounded-lg mt-1"
              style={{ background: '#f0f5f0', color: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Stunde hinzufügen
            </button>
          </div>
        )}
      </div>

      {lessons.length > 0 && (
        <div
          className="flex items-center justify-between text-xs px-3 py-2 rounded-lg mt-auto"
          style={{ background: '#f8f8f4', color: '#9e9e96' }}
        >
          <span>{person.name} · {activeDay === 'Mo' ? 'Montag' : activeDay === 'Di' ? 'Dienstag' : activeDay === 'Mi' ? 'Mittwoch' : activeDay === 'Do' ? 'Donnerstag' : 'Freitag'}</span>
          <span>{lessons.length} {lessons.length === 1 ? 'Stunde' : 'Stunden'}</span>
        </div>
      )}

      {editingLesson !== null && (
        <EditModal
          lesson={editingLesson === 'new' ? null : editingLesson}
          onSave={saveLesson}
          onDelete={
            editingLesson !== 'new' && editingLesson
              ? () => deleteLesson(editingLesson.id)
              : undefined
          }
          onCancel={() => setEditingLesson(null)}
        />
      )}
    </div>
  )
}
