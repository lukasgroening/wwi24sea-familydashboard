import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const DAY_LABELS: Record<string, string> = {
  Montag: 'Mo', Dienstag: 'Di', Mittwoch: 'Mi',
  Donnerstag: 'Do', Freitag: 'Fr', Samstag: 'Sa', Sonntag: 'So',
}
const WEEKDAYS = DAYS.slice(0, 5)

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

interface EntryForm {
  subject: string
  day_of_week: string
  start_time: string
  end_time: string
  room: string
  teacher: string
  user_id: string
}

const COLORS = ['#7c9a7e', '#a8c4a8', '#c4d4c4', '#8fb8a0', '#b5cdb5', '#82a4c4', '#a8b8c4']

const todayIndex = Math.min(new Date().getDay() - 1, 4)
const todayKey = WEEKDAYS[todayIndex >= 0 ? todayIndex : 0]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  borderRadius: '10px',
  border: '1px solid #e8e8e2',
  background: '#f8f8f4',
  fontFamily: 'inherit',
  fontSize: '14px',
  outline: 'none',
  color: '#2d2d2d',
  boxSizing: 'border-box',
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default function SchedulePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'Familien-Administrator' || user?.role === 'System-Administrator'

  const [activeDay, setActiveDay] = useState(todayKey)
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<EntryForm>({
    subject: '', day_of_week: activeDay, start_time: '08:00',
    end_time: '08:45', room: '', teacher: '', user_id: '',
  })

  const { data: entries = [], isLoading, error } = useQuery<ScheduleEntry[]>({
    queryKey: ['schedule'],
    queryFn: () => api.get('/api/schedule/').then((r) => r.data),
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users/').then((r) => r.data),
    enabled: isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: (data: { subject: string; day_of_week: string; start_time: string; end_time: string; room?: string; teacher?: string; user_id?: number }) =>
      api.post('/api/schedule/', data).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedule'] }); closeModal() },
    onError: (err: AxiosError<{ detail?: string }>) =>
      setFormError(err.response?.data?.detail ?? 'Fehler beim Erstellen.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { subject?: string; day_of_week?: string; start_time?: string; end_time?: string; room?: string; teacher?: string; user_id?: number } }) =>
      api.patch(`/api/schedule/${id}`, data).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedule'] }); closeModal() },
    onError: (err: AxiosError<{ detail?: string }>) =>
      setFormError(err.response?.data?.detail ?? 'Fehler beim Aktualisieren.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/schedule/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedule'] }); setDeleteConfirm(null) },
  })

  const closeModal = () => {
    setShowModal(false)
    setEditEntry(null)
    setFormError('')
    setForm({ subject: '', day_of_week: activeDay, start_time: '08:00', end_time: '08:45', room: '', teacher: '', user_id: '' })
  }

  const openCreate = () => {
    setEditEntry(null)
    setForm({ subject: '', day_of_week: activeDay, start_time: '08:00', end_time: '08:45', room: '', teacher: '', user_id: '' })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (entry: ScheduleEntry) => {
    setEditEntry(entry)
    setForm({
      subject: entry.subject,
      day_of_week: entry.day_of_week,
      start_time: formatTime(entry.start_time),
      end_time: formatTime(entry.end_time),
      room: entry.room ?? '',
      teacher: entry.teacher ?? '',
      user_id: entry.user_id ? String(entry.user_id) : '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim()) { setFormError('Fach ist erforderlich.'); return }
    if (form.end_time <= form.start_time) { setFormError('Endzeit muss nach der Startzeit liegen.'); return }

    const payload = {
      subject: form.subject,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room || undefined,
      teacher: form.teacher || undefined,
      user_id: form.user_id ? Number(form.user_id) : undefined,
    }

    if (editEntry) {
      updateMutation.mutate({ id: editEntry.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const dayMatch = e.day_of_week === activeDay
    const userMatch = filterUserId === 'all' || String(e.user_id) === filterUserId
    return dayMatch && userMatch
  }).sort((a, b) => a.start_time.localeCompare(b.start_time))

  // All users who have schedule entries (for filter)
  const usersWithEntries = users.filter((u) => entries.some((e) => e.user_id === u.id))

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Stundenplan</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9e9e96' }}>Wochenplan für alle Familienmitglieder</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Eintrag hinzufügen
          </button>
        )}
      </div>

      {/* Day tabs + person filter */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {WEEKDAYS.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className="px-4 py-2 rounded-xl text-sm transition-colors min-w-[44px] min-h-[44px]"
              style={{
                background: activeDay === d ? '#7c9a7e' : '#f4f4f0',
                color: activeDay === d ? 'white' : '#7a7a72',
                fontWeight: activeDay === d ? 500 : 400,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Person filter */}
        {usersWithEntries.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#9e9e96' }}>Person:</span>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterUserId('all')}
                className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{
                  background: filterUserId === 'all' ? '#7c9a7e' : '#f4f4f0',
                  color: filterUserId === 'all' ? 'white' : '#7a7a72',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Alle
              </button>
              {usersWithEntries.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setFilterUserId(String(u.id))}
                  className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{
                    background: filterUserId === String(u.id) ? '#7c9a7e' : '#f4f4f0',
                    color: filterUserId === String(u.id) ? 'white' : '#7a7a72',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {u.username}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule list */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: '#ffffff', border: '1px solid #e8e8e2' }}
      >
        {isLoading && <p className="text-sm text-center py-8" style={{ color: '#b5b5a8' }}>Lade Stundenplan…</p>}
        {error && <p className="text-sm text-center py-8" style={{ color: '#b91c1c' }}>Fehler beim Laden.</p>}
        {!isLoading && !error && filteredEntries.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#b5b5a8' }}>Kein Unterricht an diesem Tag.</p>
            {isAdmin && (
              <button
                onClick={openCreate}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Eintrag hinzufügen
              </button>
            )}
          </div>
        )}
        {filteredEntries.map((entry, i) => {
          const assignedUser = users.find((u) => u.id === entry.user_id)
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#f8f8f4', borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}
            >
              <div className="text-xs w-24 flex-shrink-0 font-medium tabular-nums" style={{ color: '#9e9e96' }}>
                {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{entry.subject}</div>
                {(entry.teacher || assignedUser) && (
                  <div className="text-xs mt-0.5" style={{ color: '#b5b5a8' }}>
                    {assignedUser && <span>{assignedUser.username}</span>}
                    {assignedUser && entry.teacher && <span> · </span>}
                    {entry.teacher && <span>{entry.teacher}</span>}
                  </div>
                )}
              </div>
              {entry.room && (
                <div className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ background: '#f0f0ea', color: '#9e9e96' }}>
                  {entry.room}
                </div>
              )}
              {isAdmin && (
                <div className="flex gap-1 flex-shrink-0">
                  {deleteConfirm === entry.id ? (
                    <>
                      <button
                        onClick={() => deleteMutation.mutate(entry.id)}
                        disabled={deleteMutation.isPending}
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#b91c1c' }}
                      >
                        Löschen
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#6b6b63' }}
                      >
                        Abbruch
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openEdit(entry)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', color: '#7a7a72' }}
                        title="Bearbeiten"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(entry.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#c45c5c' }}
                        title="Löschen"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 w-full"
            style={{ background: '#ffffff', border: '1px solid #e8e8e2', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: '440px' }}
          >
            <div>
              <div className="text-base font-semibold">
                {editEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Fach *</label>
                <input
                  style={inputStyle}
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="z.B. Mathematik"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Tag</label>
                <select
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={form.day_of_week}
                  onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Startzeit</label>
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Endzeit</label>
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Raum</label>
                  <input
                    style={inputStyle}
                    value={form.room}
                    onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                    placeholder="z.B. R. 204"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Lehrer</label>
                  <input
                    style={inputStyle}
                    value={form.teacher}
                    onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}
                    placeholder="z.B. Hr. Müller"
                  />
                </div>
              </div>

              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Person</label>
                  <select
                    style={{ ...inputStyle, appearance: 'none' }}
                    value={form.user_id}
                    onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                  >
                    <option value="">Keine Zuweisung</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
              )}

              {formError && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                  style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Speichern…' : 'Speichern'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#6b6b63' }}
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
