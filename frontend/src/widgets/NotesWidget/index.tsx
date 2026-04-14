import { useState, useEffect } from 'react'
import api from '../../lib/api'

interface Note {
  id: number
  title: string
  content: string
  created_at: string
}

const COLORS = {
  background: '#f8f8f4',
  border: '#e8e8e2',
  primary: '#7c9a7e',
  textPrimary: '#2d2d2d',
  textMuted: '#9e9e96',
  white: 'white',
  danger: '#c45c5c',
  dangerBg: '#fef2f2',
}

export default function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const { data } = await api.get<Note[]>('/api/notes/')
      setNotes(data)
    } catch (error) {
      console.error('Fehler beim Laden der Notizen:', error)
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    const t = title.trim()
    const c = content.trim()
    if (!t) return

    try {
      const { data } = await api.post<Note>('/api/notes/', { title: t, content: c })
      setNotes((prev) => [data, ...prev])
      resetForm()
    } catch (error) {
      console.error('Fehler beim Erstellen der Notiz:', error)
    }
  }

  const updateNote = async () => {
    if (!editingNote) return
    const t = title.trim()
    if (!t) return

    try {
      const { data } = await api.patch<Note>(`/api/notes/${editingNote.id}`, {
        title: t,
        content: content.trim(),
      })
      setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)))
      resetForm()
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error)
    }
  }

  const deleteNote = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const backup = [...notes]
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (expandedId === id) setExpandedId(null)

    try {
      await api.delete(`/api/notes/${id}`)
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      setNotes(backup)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingNote(null)
    setTitle('')
    setContent('')
  }

  const openEdit = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingNote(note)
    setTitle(note.title)
    setContent(note.content)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingNote) {
      updateNote()
    } else {
      addNote()
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const inputStyle: React.CSSProperties = {
    background: COLORS.background,
    borderColor: COLORS.border,
    fontFamily: 'inherit',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Lade Notizen...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header with add button */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditingNote(null); setTitle(''); setContent('') }}
          className="w-full px-3 py-2 rounded-lg text-sm border border-dashed transition-colors hover:border-solid"
          style={{ background: 'transparent', borderColor: COLORS.border, color: COLORS.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Neue Notiz
        </button>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: COLORS.background, border: `1px solid ${COLORS.border}` }}>
          <input
            className="px-3 py-2 rounded-lg text-sm outline-none border"
            style={inputStyle}
            placeholder="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="px-3 py-2 rounded-lg text-sm outline-none border resize-none"
            style={{ ...inputStyle, minHeight: '60px' }}
            placeholder="Inhalt..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity disabled:opacity-50"
              style={{ background: COLORS.primary, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {editingNote ? 'Speichern' : 'Hinzufügen'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: COLORS.background, border: `1px solid ${COLORS.border}`, cursor: 'pointer', fontFamily: 'inherit', color: COLORS.textMuted }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Notes list */}
      <div className="flex flex-col gap-2 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Keine Notizen vorhanden</p>
          </div>
        ) : (
          notes.map((note) => {
            const isExpanded = expandedId === note.id
            return (
              <div
                key={note.id}
                onClick={() => setExpandedId(isExpanded ? null : note.id)}
                className="px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:opacity-90"
                style={{ background: COLORS.background, border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                      {note.title}
                    </div>
                    {!isExpanded && note.content && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>
                        {note.content}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2">
                    {note.content && (
                      <p className="text-sm whitespace-pre-wrap mb-2" style={{ color: COLORS.textPrimary }}>
                        {note.content}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <button
                        onClick={(e) => openEdit(note, e)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: COLORS.background, border: `1px solid ${COLORS.border}`, cursor: 'pointer', fontFamily: 'inherit', color: COLORS.textPrimary }}
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={(e) => deleteNote(note.id, e)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: COLORS.dangerBg, border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: COLORS.danger }}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
