import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import type { User } from '../types'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const { data } = await api.post<{ access_token: string }>('/api/login', params)
      const token = data.access_token

      const payload = JSON.parse(atob(token.split('.')[1]))
      const user: User = {
        id: 0,
        username: payload.sub,
        role: payload.role,
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
    border: '1px solid #e8e8e2',
    background: '#f8f8f4',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    color: '#2d2d2d',
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f4f0' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl" style={{ background: '#7c9a7e' }}>
            ⌂
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">FamilyBoard</h1>
            <p className="text-sm mt-1" style={{ color: '#9e9e96' }}>Melde dich an</p>
          </div>
        </div>

        <div className="rounded-2xl p-7" style={{ background: '#ffffff', border: '1px solid #e8e8e2' }}>
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

            {error && (
              <div className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>

        <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: '#f0f5f0', color: '#7c9a7e' }}>
          <strong>Demo:</strong> Mama_Admin / geheim123123
        </div>
      </div>
    </div>
  )
}
