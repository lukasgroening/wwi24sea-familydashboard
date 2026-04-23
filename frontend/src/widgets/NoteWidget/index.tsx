import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, StickyNote, X, Check, Edit2 } from 'lucide-react'
import api from '../../lib/api'
import { colors } from '../../lib/colors'
import { useAuthStore } from '../../store/authStore'

interface Note {
  id: number
  title: string
  content: string
  created_at: string
}

const COLORS = {
  background: colors.stone50,
  border: colors.stoneBorder,
  primary: colors.sage500,
  textPrimary: colors.stone900,
  textMuted: colors.stone600,
  paper: 'white',
}

export default function NoteWidget() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'Familien-Administrator' || user?.role === 'System-Administrator'

  const [isAdding, setIsAddding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => api.get<Note[]>('/api/notes/').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      api.post<Note>('/api/notes/', payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; title: string; content: string }) =>
      api.patch<Note>(`/api/notes/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setEditingId(null)
      setIsAddding(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const resetForm = () => {
    setNewTitle('')
    setNewContent('')
    setIsAddding(false)
    setEditingId(null)
  }

  const handleSave = () => {
    if (!newTitle.trim()) return
    if (editingId) {
      updateMutation.mutate({ id: editingId, title: newTitle, content: newContent })
    } else {
      createMutation.mutate({ title: newTitle, content: newContent })
    }
  }

  const startEdit = (note: Note) => {
    setNewTitle(note.title)
    setNewContent(note.content)
    setEditingId(note.id)
    setIsAddding(true)
  }

  if (isLoading) return <div className="flex items-center justify-center h-full text-xs" style={{ color: COLORS.textMuted }}>Lade Notizen...</div>

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header mit Add-Button */}
      {isAdmin && !isAdding && (
        <button
          onClick={() => setIsAddding(true)}
          className="flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed transition-colors hover:bg-stone-100"
          style={{ borderColor: COLORS.border, color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          <Plus size={14} /> Notiz hinzufügen
        </button>
      )}

      {/* Formular (Add/Edit) */}
      {isAdding && (
        <div className="flex flex-col gap-2 p-3 rounded-lg border" style={{ background: COLORS.paper, borderColor: COLORS.primary }}>
          <input
            className="text-sm font-semibold outline-none"
            placeholder="Titel"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="text-xs outline-none resize-none min-h-[60px]"
            placeholder="Inhalt..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-1">
            <button 
              onClick={resetForm} 
              className="p-1.5 rounded-md hover:bg-stone-100 flex items-center justify-center" 
              style={{ color: COLORS.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
            <button 
              onClick={handleSave} 
              disabled={!newTitle.trim() || createMutation.isPending || updateMutation.isPending}
              className="p-1.5 rounded-md text-white disabled:opacity-50 flex items-center justify-center" 
              style={{ background: COLORS.primary, border: 'none', cursor: 'pointer' }}
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Notiz-Liste */}
      <div className="flex flex-col gap-2 overflow-y-auto pr-1">
        {notes.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
            <StickyNote size={24} />
            <span className="text-xs mt-2">Keine Notizen</span>
          </div>
        )}
        {notes.map(note => (
          <div 
            key={note.id} 
            className="group relative flex flex-col gap-1 p-3 rounded-lg border transition-all hover:shadow-sm" 
            style={{ background: COLORS.paper, borderColor: COLORS.border }}
          >
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>{note.title}</h3>
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(note)} 
                    className="p-1 rounded hover:bg-stone-100 flex items-center justify-center" 
                    style={{ color: COLORS.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={() => deleteMutation.mutate(note.id)} 
                    className="p-1 rounded hover:bg-red-50 text-red-400 flex items-center justify-center"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs line-clamp-3" style={{ color: COLORS.textMuted, whiteSpace: 'pre-wrap' }}>
              {note.content}
            </p>
            <div className="text-[9px] mt-1 opacity-30" style={{ color: COLORS.textMuted }}>
              {new Date(note.created_at).toLocaleDateString('de-DE')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
