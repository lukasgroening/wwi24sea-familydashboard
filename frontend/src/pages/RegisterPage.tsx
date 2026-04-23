import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Home, Users, UserPlus, Clipboard, Check } from 'lucide-react'
import axios from 'axios'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import ErrorAlert from '../components/ErrorAlert'

type RegisterMode = 'join' | 'create'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // Sofort zum Dashboard, wenn bereits eingeloggt
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const [mode, setMode] = useState<RegisterMode>('join')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [familyIdentifier, setFamilyIdentifier] = useState('') // join_code or family_name
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ username: string; join_code?: string; family_name?: string } | null>(null)
  const navigate = useNavigate()

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        username,
        password,
        [mode === 'join' ? 'join_code' : 'family_name']: familyIdentifier,
      }

      const { data } = await api.post('/api/register', payload)
      
      if (mode === 'create') {
        setSuccessData({ 
          username: data.username,
          family_name: familyIdentifier,
          join_code: data.join_code
        })
      } else {
        navigate('/login', { state: { message: 'Registrierung erfolgreich! Du kannst dich jetzt anmelden.' } })
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Registrierung fehlgeschlagen.')
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.')
      }
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
    background: active ? 'white' : 'transparent',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    color: active ? 'var(--color-sage-600)' : 'var(--color-stone-500)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  })

  if (successData) {
    const copyToClipboard = () => {
      if (successData.join_code) {
        navigator.clipboard.writeText(successData.join_code)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-stone-100)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-sage-50)', color: 'var(--color-sage-500)' }}>
            <Check size={32} />
          </div>
          <h1 className="text-xl font-semibold mb-2">Familie erstellt!</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-stone-600)' }}>
            Herzlich Willkommen, <strong>{successData.username}</strong>.<br />
            Deine Familie <strong>{successData.family_name}</strong> wurde erfolgreich angelegt.
          </p>
          
          <div className="bg-white p-6 rounded-2xl border mb-6" style={{ borderColor: 'var(--color-stone-border)' }}>
            <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--color-stone-400)' }}>
              Dein Familien-Join-Code
            </p>
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-stone-50 border border-dashed" style={{ borderColor: 'var(--color-stone-border)', background: 'var(--color-stone-50)' }}>
              <span className="font-mono text-lg font-bold tracking-widest" style={{ color: 'var(--color-sage-600)' }}>
                {successData.join_code}
              </span>
              <button 
                onClick={copyToClipboard}
                className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
                title="Code kopieren"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-stone-500)' }}
              >
                <Clipboard size={16} />
              </button>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--color-stone-500)' }}>
              Teile diesen Code mit deinen Familienmitgliedern, damit sie beitreten können.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer' }}
          >
            Weiter zum Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-stone-100)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: 'var(--color-sage-500)' }}>
            <Home size={24} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Registrierung</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-stone-600)' }}>Erstelle dein Konto</p>
          </div>
        </div>

        <div className="rounded-2xl p-7" style={{ background: 'white', border: '1px solid var(--color-stone-border)' }}>
          <div className="flex p-1 rounded-xl mb-6" style={{ background: 'var(--color-stone-100)' }}>
            <div style={tabStyle(mode === 'join')} onClick={() => { setMode('join'); setFamilyIdentifier(''); }}>
              <Users size={16} />
              Beitreten
            </div>
            <div style={tabStyle(mode === 'create')} onClick={() => { setMode('create'); setFamilyIdentifier(''); }}>
              <UserPlus size={16} />
              Neu Erstellen
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="z.B. Max Mustermann"
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

            <hr className="my-1 border-stone-100" />

            {mode === 'join' ? (
              <div>
                <label className="block text-sm font-medium mb-1.5">Familien-Join-Code</label>
                <input
                  type="text"
                  value={familyIdentifier}
                  onChange={(e) => setFamilyIdentifier(e.target.value.toUpperCase())}
                  placeholder="CODE12345678"
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  required
                />
                <p className="text-[11px] mt-1.5 px-1" style={{ color: 'var(--color-stone-500)' }}>
                  Frage dein Familienoberhaupt nach dem Code.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1.5">Name der neuen Familie</label>
                <input
                  type="text"
                  value={familyIdentifier}
                  onChange={(e) => setFamilyIdentifier(e.target.value)}
                  placeholder="z.B. Familie Schmidt"
                  style={inputStyle}
                  required
                />
                <p className="text-[11px] mt-1.5 px-1" style={{ color: 'var(--color-stone-500)' }}>
                  Du wirst automatisch zum Administrator dieser Familie.
                </p>
              </div>
            )}

            <ErrorAlert message={error} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Verarbeitung...' : mode === 'join' ? 'Beitreten' : 'Familie Gründen'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-stone-600)' }}>
            Bereits einen Account?{' '}
            <Link to="/login" style={{ color: 'var(--color-sage-600)', fontWeight: 500, textDecoration: 'none' }}>
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
