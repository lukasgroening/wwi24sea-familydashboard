import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import api from '../lib/api'
import type { User, Role } from '../types'
import ErrorAlert from '../components/ErrorAlert'
import { useAuthStore } from '../store/authStore'

const ROLES: Role[] = ['System-Administrator', 'Familien-Administrator', 'Nutzer']

const ROLE_BADGE: Record<Role, { background: string; color: string }> = {
  'System-Administrator': { background: 'var(--color-warning-50)', color: 'var(--color-warning-800)' },
  'Familien-Administrator': { background: 'var(--color-sage-50)', color: 'var(--color-role-family)' },
  'Nutzer': { background: 'var(--color-stone-100)', color: 'var(--color-stone-700)' },
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid var(--color-stone-border)',
  borderRadius: '16px',
  padding: '24px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  borderRadius: '10px',
  border: '1px solid var(--color-stone-border)',
  background: 'var(--color-stone-50)',
  fontFamily: 'inherit',
  fontSize: '14px',
  outline: 'none',
  color: 'var(--color-stone-900)',
  boxSizing: 'border-box',
}

const MIN_PASSWORD_LENGTH = 6

export default function AdminPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'Nutzer' as Role })
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const isSystemAdmin = currentUser?.role === 'System-Administrator'
  const availableRoles = isSystemAdmin ? ROLES : ROLES.filter(r => r !== 'System-Administrator')

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users/').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string; role: Role }) =>
      api.post('/api/users/', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFormMode(null)
      setForm({ username: '', password: '', role: 'Nutzer' })
      setFormError('')
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      setFormError(err.response?.data?.detail ?? 'Fehler beim Erstellen.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ username: string; password: string; role: Role }> }) =>
      api.patch(`/api/users/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFormMode(null)
      setEditUser(null)
      setFormError('')
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      setFormError(err.response?.data?.detail ?? 'Fehler beim Aktualisieren.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteConfirm(null)
      setDeleteError('')
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      setDeleteError(err.response?.data?.detail ?? 'Fehler beim Löschen.')
      setDeleteConfirm(null)
    },
  })

  const handleCreate: React.ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault()
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`)
      return
    }
    createMutation.mutate(form)
  }

  const handleUpdate: React.ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault()
    if (!editUser) return
    if (form.password && form.password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`)
      return
    }
    const data: Partial<{ username: string; password: string; role: Role }> = {
      username: form.username || undefined,
      role: form.role,
    }
    if (form.password) data.password = form.password
    updateMutation.mutate({ id: editUser.id, data })
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setForm({ username: user.username, password: '', role: user.role })
    setFormError('')
    setFormMode('edit')
  }

  const openCreate = () => {
    setFormMode('create')
    setEditUser(null)
    setForm({ username: '', password: '', role: 'Nutzer' })
    setFormError('')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditUser(null)
    setFormError('')
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Mitgliederverwaltung</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-stone-600)' }}>
            Benutzer hinzufügen, bearbeiten und entfernen
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Benutzer hinzufügen
        </button>
      </div>

      {formMode !== null && (
        <div style={cardStyle}>
          <h2 className="text-base font-semibold mb-4">
            {formMode === 'edit' && editUser ? `Benutzer bearbeiten: ${editUser.username}` : 'Neuen Benutzer anlegen'}
          </h2>
          <form onSubmit={formMode === 'edit' ? handleUpdate : handleCreate} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Benutzername</label>
                <input
                  style={inputStyle}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="z.B. Papa"
                  required={formMode === 'create'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Passwort {formMode === 'edit' && <span style={{ color: 'var(--color-stone-600)' }}>(leer lassen = unverändert)</span>}
                </label>
                <input
                  type="password"
                  style={inputStyle}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required={formMode === 'create'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Rolle</label>
              <select
                style={inputStyle}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <ErrorAlert message={formError} onDismiss={() => setFormError('')} />

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      <ErrorAlert message={deleteError} onDismiss={() => setDeleteError('')} />

      <div style={cardStyle}>
        {isLoading && <p className="text-sm" style={{ color: 'var(--color-stone-600)' }}>Lade Benutzer...</p>}
        {error && <p className="text-sm" style={{ color: 'var(--color-danger-700)' }}>Fehler beim Laden der Benutzer.</p>}
        {!isLoading && users.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-stone-600)' }}>Keine Benutzer gefunden.</p>
        )}
        {users.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-stone-border)' }}>
                <th className="text-left pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>ID</th>
                <th className="text-left pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>Benutzername</th>
                <th className="text-left pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>Rolle</th>
                <th className="text-right pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-stone-row)' }}>
                  <td className="py-3" style={{ color: 'var(--color-stone-500)' }}>#{user.id}</td>
                  <td className="py-3 font-medium">{user.username}</td>
                  <td className="py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={ROLE_BADGE[user.role] ?? { background: 'var(--color-stone-100)', color: 'var(--color-stone-700)' }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {(!isSystemAdmin && user.role === 'System-Administrator') ? (
                      <span className="text-xs italic" style={{ color: 'var(--color-stone-400)' }}>Schreibgeschützt</span>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(user)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-900)' }}
                        >
                          Bearbeiten
                        </button>
                        {deleteConfirm === user.id ? (
                          <>
                            <button
                              onClick={() => deleteMutation.mutate(user.id)}
                              disabled={deleteMutation.isPending}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: 'var(--color-danger-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-danger-700)' }}
                            >
                              Bestätigen
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
                            >
                              Abbrechen
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'var(--color-danger-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-danger-700)' }}
                          >
                            Löschen
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
