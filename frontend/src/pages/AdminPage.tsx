import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { User, Role } from '../types'

const ROLES: Role[] = ['System-Administrator', 'Familien-Administrator', 'Nutzer']

const ROLE_BADGE: Record<Role, { bg: string; color: string }> = {
  'System-Administrator': { bg: '#fef3c7', color: '#92400e' },
  'Familien-Administrator': { bg: '#f0f5f0', color: '#3a6b3c' },
  'Nutzer': { bg: '#f4f4f0', color: '#6b6b63' },
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e8e8e2',
  borderRadius: '16px',
  padding: '24px',
}

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

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'Nutzer' as Role })
  const [formError, setFormError] = useState('')

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users/').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string; role: Role }) =>
      api.post('/api/users/', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setForm({ username: '', password: '', role: 'Nutzer' })
      setFormError('')
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail ?? 'Fehler beim Erstellen.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ username: string; password: string; role: Role }> }) =>
      api.patch(`/api/users/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditUser(null)
      setFormError('')
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail ?? 'Fehler beim Aktualisieren.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteConfirm(null)
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
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
    setShowForm(false)
  }

  const openCreate = () => {
    setShowForm(true)
    setEditUser(null)
    setForm({ username: '', password: '', role: 'Nutzer' })
    setFormError('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mitgliederverwaltung</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9e9e96' }}>
            Benutzer hinzufügen, bearbeiten und entfernen
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Benutzer hinzufügen
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showForm || editUser) && (
        <div style={cardStyle}>
          <h2 className="text-base font-semibold mb-4">
            {editUser ? `Benutzer bearbeiten: ${editUser.username}` : 'Neuen Benutzer anlegen'}
          </h2>
          <form onSubmit={editUser ? handleUpdate : handleCreate} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Benutzername</label>
                <input
                  style={inputStyle}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="z.B. Papa"
                  required={!editUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Passwort {editUser && <span style={{ color: '#9e9e96' }}>(leer lassen = unverändert)</span>}
                </label>
                <input
                  type="password"
                  style={inputStyle}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required={!editUser}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Rolle</label>
              <select
                style={{ ...inputStyle, appearance: 'none' }}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {formError && (
              <div className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                {formError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditUser(null) }}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#6b6b63' }}
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User List */}
      <div style={cardStyle}>
        {isLoading && <p className="text-sm" style={{ color: '#9e9e96' }}>Lade Benutzer...</p>}
        {error && <p className="text-sm" style={{ color: '#b91c1c' }}>Fehler beim Laden der Benutzer.</p>}
        {!isLoading && users.length === 0 && (
          <p className="text-sm" style={{ color: '#9e9e96' }}>Keine Benutzer gefunden.</p>
        )}
        {users.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e8e2' }}>
                <th className="text-left pb-3 font-medium" style={{ color: '#9e9e96' }}>ID</th>
                <th className="text-left pb-3 font-medium" style={{ color: '#9e9e96' }}>Benutzername</th>
                <th className="text-left pb-3 font-medium" style={{ color: '#9e9e96' }}>Rolle</th>
                <th className="text-right pb-3 font-medium" style={{ color: '#9e9e96' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0ea' }}>
                  <td className="py-3" style={{ color: '#b5b5a8' }}>#{user.id}</td>
                  <td className="py-3 font-medium">{user.username}</td>
                  <td className="py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={ROLE_BADGE[user.role] ?? { bg: '#f4f4f0', color: '#6b6b63' }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(user)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#2d2d2d' }}
                      >
                        Bearbeiten
                      </button>
                      {deleteConfirm === user.id ? (
                        <>
                          <button
                            onClick={() => deleteMutation.mutate(user.id)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#b91c1c' }}
                          >
                            Bestätigen
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: '#f4f4f0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#6b6b63' }}
                          >
                            Abbrechen
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#b91c1c' }}
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
