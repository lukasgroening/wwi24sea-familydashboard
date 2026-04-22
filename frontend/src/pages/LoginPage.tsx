import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import type { User } from '../types'
import ErrorAlert from '../components/ErrorAlert'

function FamilySceneRight() {
  const figures = [
    { x: 120, h: 72, accent: false, delay: 0 },
    { x: 200, h: 66, accent: true,  delay: 0.4 },
    { x: 270, h: 50, accent: false, delay: 0.8 },
    { x: 330, h: 40, accent: true,  delay: 1.2 },
  ]
  const ink = '#2a241d'
  const accent = 'oklch(55% 0.12 146)'
  const paper = '#f5efe3'
  const ground = 160

  return (
    <svg viewBox="0 0 460 200" style={{ width: '100%', maxWidth: 420, opacity: 0.7 }}>
      {/* ground */}
      <path d="M 0 160 C 80 158, 200 162, 460 159" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
      {/* grass tufts */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = 20 + i * 24
        return (
          <g key={i}>
            <line x1={x} y1={ground} x2={x - 1} y2={ground - 5} stroke="oklch(55% 0.09 120)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            <line x1={x + 3} y1={ground} x2={x + 4} y2={ground - 7} stroke="oklch(62% 0.09 120)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          </g>
        )
      })}
      {/* house (small) */}
      <path d="M 30 160 L 30 95 L 75 72 L 120 95 L 120 160 Z" fill="#e9dcc0" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
      <path d="M 24 98 L 75 68 L 126 98" fill="none" stroke="#8c3a22" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="42" y="115" width="22" height="26" fill="oklch(85% 0.14 75)" stroke={ink} strokeWidth="1.2" />
      <rect x="72" y="118" width="28" height="42" fill="#3a2010" stroke={ink} strokeWidth="1.2" />
      {figures.map((f, i) => (
        <g key={i} style={{ animation: `idleBob${i} ${2.4 + f.delay * 0.3}s ease-in-out ${f.delay}s infinite` }}>
          <g transform={`translate(${f.x} ${ground})`}>
            <line x1="0" y1={-f.h} x2="0" y2={-f.h * 0.45} stroke={f.accent ? accent : ink} strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="0" cy={-f.h - f.h * 0.14} r={f.h * 0.14} fill={paper} stroke={f.accent ? accent : ink} strokeWidth="1.8" />
            <line x1="0" y1={-f.h * 0.88} x2={-f.h * 0.28} y2={-f.h * 0.55} stroke={f.accent ? accent : ink} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1={-f.h * 0.88} x2={f.h * 0.28} y2={-f.h * 0.55} stroke={f.accent ? accent : ink} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1={-f.h * 0.45} x2={-f.h * 0.14} y2={0} stroke={f.accent ? accent : ink} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1={-f.h * 0.45} x2={f.h * 0.14} y2={0} stroke={f.accent ? accent : ink} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
      ))}
      <style>{`
        @keyframes idleBob0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes idleBob1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes idleBob2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes idleBob3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3.5px)} }
      `}</style>
    </svg>
  )
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as { message?: string } | null)?.message

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
      if (!payload.sub || !payload.role) { setError('Ungültiger Token vom Server.'); return }
      const user: User = { id: payload.id ?? 0, username: payload.sub, role: payload.role as User['role'] }
      login(user, token)
      navigate('/dashboard')
    } catch {
      setError('Benutzername oder Passwort falsch.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 6,
    border: '1.5px solid rgba(42,36,29,0.2)', background: 'rgba(255,255,255,0.6)',
    fontFamily: '"Geist Mono", monospace', fontSize: 13, color: '#2a241d', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f5efe3', fontFamily: '"Geist Mono", monospace' }}>
      {/* Left panel */}
      <div style={{
        flex: '0 0 440px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 52px', borderRight: '1px solid rgba(42,36,29,0.12)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 13, color: 'oklch(55% 0.12 146)', letterSpacing: '0.06em', marginBottom: 4 }}>
              ← zurück zur Startseite
            </div>
          </Link>
          <div style={{ marginTop: 20, fontSize: 10, letterSpacing: '0.26em', color: '#8a7d6a', textTransform: 'uppercase', marginBottom: 8 }}>
            Welcome Home,
          </div>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 'clamp(64px, 9vw, 88px)', color: 'oklch(45% 0.10 146)', lineHeight: 0.95, marginBottom: 2 }}>
            Famly<span style={{ color: 'oklch(65% 0.14 20)' }}>.</span>
          </div>
        </div>

        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 34, color: '#2a241d', lineHeight: 1.15, margin: '0 0 8px' }}>
          Schön, dass du<br />wieder da bist.
        </h1>
        <p style={{ fontSize: 12, color: '#8a7d6a', lineHeight: 1.7, margin: '0 0 32px' }}>
          Melde dich an und sieh,<br />was in deiner Familie los ist.
        </p>

        {successMessage && (
          <div style={{ background: 'oklch(92% 0.04 146)', border: '1px solid oklch(70% 0.09 146)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'oklch(40% 0.09 146)' }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#554a3c', marginBottom: 6 }}>
              Benutzername
            </label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Mama_Admin" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#554a3c', marginBottom: 6 }}>
              Passwort
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>

          <ErrorAlert message={error} />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 6, marginTop: 4,
              background: '#2a241d', color: '#f5efe3', border: 'none',
              fontFamily: '"Geist Mono", monospace', fontSize: 12, letterSpacing: '0.2em',
              textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 200ms',
            }}
          >
            {loading ? 'Anmelden…' : 'Anmelden →'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 12, color: '#8a7d6a', textAlign: 'center' }}>
          Noch kein Account?{' '}
          <Link to="/register" style={{ color: '#2a241d', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid #2a241d' }}>
            Familie gründen
          </Link>
        </div>

        <div style={{ marginTop: 28, padding: '12px 16px', background: 'rgba(255,255,255,0.5)', borderRadius: 8, border: '1px solid rgba(42,36,29,0.1)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a7d6a', marginBottom: 6 }}>Demo</div>
          <div style={{ fontSize: 11, color: '#554a3c', lineHeight: 1.8 }}>
            <div>Mama_Admin / geheim123123</div>
            <div>system_admin / system123</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', gap: 32 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(42,36,29,0.05) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 'clamp(60px, 10vw, 130px)', color: 'rgba(42,36,29,0.05)', lineHeight: 1, userSelect: 'none', marginBottom: 8 }}>
            Famly
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#8a7d6a', textTransform: 'uppercase' }}>
            dein digitales Zuhause
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <FamilySceneRight />
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#8a7d6a', letterSpacing: '0.1em' }}>
            Deine Familie wartet auf dich.
          </div>
        </div>
      </div>
    </div>
  )
}
