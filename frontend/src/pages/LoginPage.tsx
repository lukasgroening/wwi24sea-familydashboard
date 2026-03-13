import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

// Mock login — swap with: api.post('/auth/login', { email, password }) once backend is ready
const MOCK_USERS = [
  { id: '1', name: 'Mama', email: 'mama@family.de', password: 'test', role: 'admin' as const, familyId: 'f1', avatarInitials: 'M' },
  { id: '2', name: 'Papa', email: 'papa@family.de', password: 'test', role: 'admin' as const, familyId: 'f1', avatarInitials: 'P' },
  { id: '3', name: 'Lena', email: 'lena@family.de', password: 'test', role: 'user' as const, familyId: 'f1', avatarInitials: 'L' },
  { id: '4', name: 'Au Pair Anna', email: 'anna@family.de', password: 'test', role: 'user' as const, familyId: 'f1', avatarInitials: 'A' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const user = MOCK_USERS.find((u) => u.email === email && u.password === password)
    if (!user) {
      setError('E-Mail oder Passwort falsch.')
      return
    }
    login(user, `mock-token-${user.id}`)
    navigate('/')
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
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl" style={{ background: '#7c9a7e' }}>
            ⌂
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">FamilyBoard</h1>
            <p className="text-sm mt-1" style={{ color: '#9e9e96' }}>Melde dich an</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: '#ffffff', border: '1px solid #e8e8e2' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mama@family.de"
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
              className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
              style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Anmelden
            </button>
          </form>
        </div>

        {/* Dev hint */}
        <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: '#f0f5f0', color: '#7c9a7e' }}>
          <strong>Demo:</strong> mama@family.de / test · papa@family.de / test · lena@family.de / test
        </div>
      </div>
    </div>
  )
}
