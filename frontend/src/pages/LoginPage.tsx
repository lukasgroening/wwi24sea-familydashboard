import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import type { User } from '../types'
import ErrorAlert from '../components/ErrorAlert'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const { data } = await api.post<{ access_token: string }>('/api/login', params)
      const token = data.access_token

      let payload: { sub?: string; role?: string; id?: number }
      try {
        payload = JSON.parse(atob(token.split('.')[1]))
      } catch {
        setError('Ungültiger Token vom Server.')
        return
      }

      if (!payload.sub || !payload.role) {
        setError('Ungültiger Token vom Server.')
        return
      }

      const user: User = {
        id: payload.id ?? 0,
        username: payload.sub,
        role: payload.role as User['role'],
      }

      login(user, token)
      navigate('/')
    } catch {
      setError('Benutzername oder Passwort falsch.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--color-stone-border)',
    background: 'var(--color-stone-50)',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    color: 'var(--color-stone-900)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-stone-100)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: 'var(--color-sage-500)' }}>
            <Home size={24} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">FamilyBoard</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-stone-600)' }}>Melde dich an</p>
          </div>
        </div>

        <div className="rounded-2xl p-7" style={{ background: 'white', border: '1px solid var(--color-stone-border)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Mama_Admin"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>

            <ErrorAlert message={error} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>

        <div className="mt-4 p-3 rounded-xl text-xs flex flex-col gap-1" style={{ background: 'var(--color-sage-50)', color: 'var(--color-sage-500)' }}>
          <div><strong>Demo:</strong> Mama_Admin / geheim123123</div>
          <div><strong>System-Admin:</strong> system_admin / system123</div>
        </div>
      </div>
    </div>
  )
}
