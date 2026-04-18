import { useState } from 'react'
import { X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import api from '../lib/api'
import type { User, Role, Family } from '../types'
import ErrorAlert from '../components/ErrorAlert'

const ROLES: Role[] = ['System-Administrator', 'Familien-Administrator', 'Nutzer']

const ROLE_BADGE: Record<Role, { background: string; color: string }> = {
  'System-Administrator': { background: 'var(--color-warning-50)', color: 'var(--color-warning-800)' },
  'Familien-Administrator': { background: 'var(--color-sage-50)', color: 'oklch(0.480 0.091 145)' },
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

export default function SystemAdminPage() {
  const queryClient = useQueryClient()

  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [familyError, setFamilyError] = useState('')
  const [deleteFamilyConfirm, setDeleteFamilyConfirm] = useState<number | null>(null)

  const [showUserForm, setShowUserForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<number | null>(null)
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'Nutzer' as Role, family_id: '' })
  const [userError, setUserError] = useState('')
  const [deleteUserError, setDeleteUserError] = useState('')

  const { data: families = [], isLoading: familiesLoading } = useQuery<Family[]>({
    queryKey: ['families'],
    queryFn: () => api.get('/api/families/').then((r) => r.data),
  })

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users/').then((r) => r.data),
  })

  const createFamilyMutation = useMutation({
    mutationFn: (name: string) => api.post('/api/families/', { name }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      setShowFamilyForm(false)
      setFamilyName('')
      setFamilyError('')
    },
    onError: (err: AxiosError<{ detail?: string }>) =>
      setFamilyError(err.response?.data?.detail ?? 'Fehler beim Erstellen.'),
  })

  const deleteFamilyMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/families/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteFamilyConfirm(null)
    },
  })

  const createUserMutation = useMutation({
    mutationFn: (data: { username: string; password: string; role: Role; family_id?: number }) =>
      api.post('/api/users/', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeUserForm()
    },
    onError: (err: AxiosError<{ detail?: string }>) =>
      setUserError(err.response?.data?.detail ?? 'Fehler beim Erstellen.'),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ username: string; password: string; role: Role; family_id: number | null }> }) =>
      api.patch(`/api/users/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeUserForm()
    },
    onError: (err: AxiosError<{ detail?: string }>) =>
      setUserError(err.response?.data?.detail ?? 'Fehler beim Aktualisieren.'),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteUserConfirm(null)
      setDeleteUserError('')
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      setDeleteUserError(err.response?.data?.detail ?? 'Fehler beim Löschen.')
      setDeleteUserConfirm(null)
    },
  })

  const closeUserForm = () => {
    setShowUserForm(false)
    setEditUser(null)
    setUserForm({ username: '', password: '', role: 'Nutzer', family_id: '' })
    setUserError('')
  }

  const openEditUser = (user: User) => {
    setEditUser(user)
    setUserForm({
      username: user.username,
      password: '',
      role: user.role,
      family_id: user.family_id ? String(user.family_id) : '',
    })
    setUserError('')
    setShowUserForm(false)
  }

  const handleUserSubmit: React.ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault()
    const payload = {
      username: userForm.username,
      role: userForm.role,
      family_id: userForm.family_id ? Number(userForm.family_id) : undefined,
    }
    if (editUser) {
      const data: Parameters<typeof updateUserMutation.mutate>[0]['data'] = {
        username: userForm.username || undefined,
        role: userForm.role,
        family_id: userForm.family_id ? Number(userForm.family_id) : null,
      }
      if (userForm.password) data.password = userForm.password
      updateUserMutation.mutate({ id: editUser.id, data })
    } else {
      if (!userForm.password) { setUserError('Passwort ist erforderlich.'); return }
      createUserMutation.mutate({ ...payload, password: userForm.password })
    }
  }

  const getFamilyName = (family_id?: number | null) => {
    if (!family_id) return null
    return families.find((f) => f.id === family_id)?.name ?? null
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">System-Verwaltung</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-stone-600)' }}>
            Familien und alle Benutzer systemweit verwalten
          </p>
        </div>

        {/* ── FAMILIEN ─────────────────────────────────────────── */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Familien</h2>
            <button
              onClick={() => { setShowFamilyForm(true); setFamilyError(''); setFamilyName('') }}
              className="px-3 py-1.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Neue Familie
            </button>
          </div>

          {showFamilyForm && (
            <div className="mb-4 p-4 rounded-xl flex flex-col gap-3" style={{ background: 'var(--color-stone-50)', border: '1px solid var(--color-stone-border)' }}>
              <div className="text-sm font-medium">Neue Familie anlegen</div>
              <div className="flex gap-2">
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="z.B. Familie Müller"
                  onKeyDown={(e) => { if (e.key === 'Enter' && familyName.trim()) createFamilyMutation.mutate(familyName.trim()) }}
                />
                <button
                  onClick={() => { if (familyName.trim()) createFamilyMutation.mutate(familyName.trim()) }}
                  disabled={!familyName.trim() || createFamilyMutation.isPending}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  Speichern
                </button>
                <button
                  onClick={() => { setShowFamilyForm(false); setFamilyName('') }}
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
                >
                  Abbruch
                </button>
              </div>
              <ErrorAlert message={familyError} />
            </div>
          )}

          {familiesLoading && <p className="text-sm" style={{ color: 'var(--color-stone-600)' }}>Lade Familien…</p>}
          {!familiesLoading && families.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-stone-500)' }}>Noch keine Familien angelegt.</p>
          )}
          {families.length > 0 && (
            <div className="flex flex-col gap-2">
              {families.map((family) => (
                <div
                  key={family.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'var(--color-stone-50)', border: '1px solid var(--color-stone-border)' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ background: 'var(--color-sage-500)' }}>
                    {family.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{family.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-stone-600)' }}>{family.member_count} Mitglied{family.member_count !== 1 ? 'er' : ''}</div>
                  </div>
                  {deleteFamilyConfirm === family.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => deleteFamilyMutation.mutate(family.id)}
                        disabled={deleteFamilyMutation.isPending}
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: 'var(--color-danger-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-danger-700)' }}
                      >
                        Löschen
                      </button>
                      <button
                        onClick={() => setDeleteFamilyConfirm(null)}
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
                      >
                        Abbruch
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteFamilyConfirm(family.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: 'var(--color-danger-50)', border: 'none', cursor: 'pointer', color: 'var(--color-danger-500)' }}
                      title="Familie löschen"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ALLE USER ────────────────────────────────────────── */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base font-semibold">Alle Benutzer</h2>
            <button
              onClick={() => { setShowUserForm(true); setEditUser(null); setUserForm({ username: '', password: '', role: 'Nutzer', family_id: '' }); setUserError('') }}
              className="px-3 py-1.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Benutzer hinzufügen
            </button>
          </div>

          {(showUserForm || editUser) && (
            <div className="mb-4 p-4 rounded-xl flex flex-col gap-3" style={{ background: 'var(--color-stone-50)', border: '1px solid var(--color-stone-border)' }}>
              <div className="text-sm font-medium">
                {editUser ? `Benutzer bearbeiten: ${editUser.username}` : 'Neuen Benutzer anlegen'}
              </div>
              <form onSubmit={handleUserSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Benutzername</label>
                    <input
                      style={inputStyle}
                      value={userForm.username}
                      onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                      placeholder="z.B. Papa"
                      required={!editUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Passwort {editUser && <span style={{ color: 'var(--color-stone-600)' }}>(leer = unverändert)</span>}
                    </label>
                    <input
                      type="password"
                      style={inputStyle}
                      value={userForm.password}
                      onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      required={!editUser}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Rolle</label>
                    <select
                      style={{ ...inputStyle, appearance: 'none' }}
                      value={userForm.role}
                      onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as Role }))}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Familie</label>
                    <select
                      style={{ ...inputStyle, appearance: 'none' }}
                      value={userForm.family_id}
                      onChange={(e) => setUserForm((f) => ({ ...f, family_id: e.target.value }))}
                    >
                      <option value="">Keine Familie</option>
                      {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <ErrorAlert message={userError} />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                    style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {createUserMutation.isPending || updateUserMutation.isPending ? 'Speichern…' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={closeUserForm}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          )}

          <ErrorAlert message={deleteUserError} onDismiss={() => setDeleteUserError('')} />

          {usersLoading && <p className="text-sm" style={{ color: 'var(--color-stone-600)' }}>Lade Benutzer…</p>}
          {!usersLoading && users.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-stone-500)' }}>Keine Benutzer gefunden.</p>
          )}
          {users.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-stone-border)' }}>
                    <th className="text-left pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>Benutzer</th>
                    <th className="text-left pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>Rolle</th>
                    <th className="text-left pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>Familie</th>
                    <th className="text-right pb-3 font-medium" style={{ color: 'var(--color-stone-600)' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--color-stone-row)' }}>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                            style={{ background: 'var(--color-sage-500)' }}>
                            {user.username[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={ROLE_BADGE[user.role] ?? { background: 'var(--color-stone-100)', color: 'var(--color-stone-700)' }}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-sm" style={{ color: 'var(--color-stone-600)' }}>
                        {getFamilyName(user.family_id) ?? <span style={{ color: 'var(--color-stone-400)' }}>—</span>}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => openEditUser(user)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-900)' }}
                          >
                            Bearbeiten
                          </button>
                          {deleteUserConfirm === user.id ? (
                            <>
                              <button
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: 'var(--color-danger-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-danger-700)' }}
                              >
                                Bestätigen
                              </button>
                              <button
                                onClick={() => setDeleteUserConfirm(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
                              >
                                Abbruch
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteUserConfirm(user.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: 'var(--color-danger-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-danger-700)' }}
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
