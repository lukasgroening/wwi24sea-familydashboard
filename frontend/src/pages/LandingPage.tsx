import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const W = 1600
const H = 600
const HOUSE_X = 0
const DOOR_X = HOUSE_X + 215
const GROUND_Y = 470

function getTimeOfDay(): 'day' | 'dusk' | 'night' {
  const h = new Date().getHours()
  if (h >= 6 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

const PALETTES = {
  day:   { paper: '#f5efe3', paper2: '#ede5d2', ink: '#2a241d', ink2: '#554a3c', inkSoft: '#8a7d6a', grass: 'oklch(62% 0.09 120)', grass2: 'oklch(55% 0.09 120)', hill: 'oklch(76% 0.04 90)', glow: 'oklch(85% 0.14 75)', houseRoof: '#8c3a22', door: '#5a3a24' },
  dusk:  { paper: '#efd9be', paper2: '#e4bf99', ink: '#2a1c1a', ink2: '#5b3a2e', inkSoft: '#8a6250', grass: 'oklch(52% 0.10 80)', grass2: 'oklch(44% 0.10 80)', hill: 'oklch(62% 0.09 50)', glow: 'oklch(82% 0.17 55)', houseRoof: '#8c3a22', door: '#5a3a24' },
  night: { paper: '#1a1d2a', paper2: '#141626', ink: '#eae3d4', ink2: '#c2b8a3', inkSoft: '#7b7564', grass: 'oklch(30% 0.05 230)', grass2: 'oklch(22% 0.05 230)', hill: 'oklch(35% 0.03 260)', glow: 'oklch(85% 0.15 75)', houseRoof: '#6a2a12', door: '#3a2214' },
}

const CHARS = [
  { name: 'Dad',  height: 90, speed: 45, shirt: 'oklch(55% 0.12 250)', pants: 'oklch(35% 0.04 260)', hair: '#3a2818', skin: '#e3b892' },
  { name: 'Mom',  height: 85, speed: 50, shirt: 'oklch(65% 0.14 20)',  pants: 'oklch(45% 0.08 260)', hair: '#5a3a1c', skin: '#ecc4a0' },
  { name: 'Kind', height: 62, speed: 55, shirt: 'oklch(72% 0.14 140)', pants: 'oklch(50% 0.10 240)', hair: '#7a4a20', skin: '#eec5a2' },
  { name: 'Baby', height: 48, speed: 40, shirt: 'oklch(75% 0.15 70)',  pants: 'oklch(55% 0.08 30)',  hair: '#c88a4a', skin: '#f0caa8' },
]

interface Char {
  id: number; name: string; height: number; speed: number
  x: number; dir: number; mode: 'idle' | 'walk' | 'run'
  nextDecision: number; atHome: boolean
  shirt: string; pants: string; hair: string; skin: string
}

function StickFigure({ ch, t, ink, paper, accent, onClick }: { ch: Char; t: number; ink: string; paper: string; accent: boolean; onClick?: () => void }) {
  const { x, height: H, dir, mode } = ch
  const phase = (t / 1000) * (mode === 'run' ? 9 : mode === 'walk' ? 5 : 1.8)
  const bob = mode === 'idle' ? Math.sin(phase * 1.2) * 1.2 : Math.abs(Math.sin(phase * 2)) * (mode === 'run' ? 4 : 2)
  const legSwing = mode === 'idle' ? Math.sin(phase) * 1.5 : Math.sin(phase) * (mode === 'run' ? 18 : 12)
  const armSwing = mode === 'idle' ? Math.sin(phase * 0.9) * 3 : -Math.sin(phase) * (mode === 'run' ? 30 : 18)
  const tilt = mode === 'run' ? 8 * dir * -1 : 0
  const headR = H * 0.14
  const neckY = -H
  const headCy = neckY - headR
  const hipY = -H * 0.45
  const sw = 2.4
  const stroke = accent ? 'oklch(65% 0.14 20)' : ink

  return (
    <g
      transform={`translate(${x} ${GROUND_Y + bob}) scale(${dir} 1)`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <g transform={`rotate(${tilt})`}>
        <line x1="0" y1={neckY} x2="0" y2={hipY} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <circle cx="0" cy={headCy} r={headR} fill={paper} stroke={stroke} strokeWidth={sw} />
        <circle cx={headR*0.35} cy={headCy + 1} r="1.4" fill={stroke} />
        <line x1="0" y1={neckY + 8} x2={armSwing} y2={neckY + 8 + H * 0.32} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1="0" y1={neckY + 8} x2={-armSwing * 0.9} y2={neckY + 10 + H * 0.32} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1="0" y1={hipY} x2={legSwing} y2={-4} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1="0" y1={hipY} x2={-legSwing} y2={-4} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1={legSwing - 3} y1={-4} x2={legSwing + 5} y2={-4} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1={-legSwing - 5} y1={-4} x2={-legSwing + 3} y2={-4} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </g>
    </g>
  )
}

function Smoke({ x, y }: { x: number; y: number }) {
  return (
    <g opacity="0.55">
      {[0, 1, 2].map(i => (
        <circle key={i} cx={x} cy={y - 20 - i * 22} r={6 + i * 2} fill="none" stroke="#8a7d6a" strokeWidth="1.5">
          <animate attributeName="opacity" values="0.6;0;0.6" dur={`${4 + i}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0,0;-18,-60;0,0" dur={`${4 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function House({ doorOpen, pal }: { doorOpen: boolean; pal: typeof PALETTES.day }) {
  const w = '#e9dcc0'
  return (
    <g>
      <ellipse cx={HOUSE_X + 140} cy={GROUND_Y + 18} rx="190" ry="8" fill="rgba(42,36,29,0.10)" />
      <path d={`M ${HOUSE_X} ${GROUND_Y} L ${HOUSE_X} 260 L ${HOUSE_X+140} 180 L ${HOUSE_X+280} 260 L ${HOUSE_X+280} ${GROUND_Y} Z`} fill={w} stroke={pal.ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M ${HOUSE_X-12} 268 L ${HOUSE_X+140} 170 L ${HOUSE_X+292} 268`} fill="none" stroke={pal.houseRoof} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <rect x={HOUSE_X+200} y={200} width="22" height="42" fill={pal.houseRoof} stroke={pal.ink} strokeWidth="2" />
      <Smoke x={HOUSE_X + 211} y={200} />
      <rect x={HOUSE_X+40} y={310} width="60" height="70" fill={pal.glow} stroke={pal.ink} strokeWidth="2" />
      <line x1={HOUSE_X+70} y1={310} x2={HOUSE_X+70} y2={380} stroke={pal.ink} strokeWidth="2" />
      <line x1={HOUSE_X+40} y1={345} x2={HOUSE_X+100} y2={345} stroke={pal.ink} strokeWidth="2" />
      <rect x={HOUSE_X+170} y={340} width="90" height="130" fill="#1a1208" stroke={pal.ink} strokeWidth="2" />
      {doorOpen && <rect x={HOUSE_X+170} y={340} width="90" height="130" fill={pal.glow} opacity="0.7" />}
      <g style={{ transformOrigin: `${HOUSE_X+170}px 405px`, transform: doorOpen ? 'scaleX(0.15)' : 'scaleX(1)', transition: 'transform 700ms cubic-bezier(.45,.05,.55,.95)' }}>
        <rect x={HOUSE_X+170} y={340} width="90" height="130" fill={pal.door} stroke={pal.ink} strokeWidth="2" />
        <rect x={HOUSE_X+178} y={350} width="74" height="50" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
        <rect x={HOUSE_X+178} y={408} width="74" height="54" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
        <circle cx={HOUSE_X+246} cy={408} r="3" fill="oklch(72% 0.16 60)" />
      </g>
      <rect x={HOUSE_X+160} y={470} width="110" height="10" fill={pal.ink2} opacity="0.3" />
    </g>
  )
}

function Landscape({ pal, timeOfDay }: { pal: typeof PALETTES.day; timeOfDay: 'day' | 'dusk' | 'night' }) {
  const stars = useMemo(() => Array.from({ length: 35 }).map((_, i) => ({ x: ((i * 137.5) % W), y: ((i * 73.1) % 260), r: 0.6 + (i % 5) * 0.2, d: (i % 4) })), [])
  return (
    <g>
      {timeOfDay === 'night' && stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={pal.ink}>
          <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + s.d}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {timeOfDay === 'night'
        ? <><circle cx={1280} cy={110} r="42" fill="oklch(92% 0.05 85)" /><circle cx={1300} cy={100} r="42" fill={pal.paper} /></>
        : <circle cx={timeOfDay === 'dusk' ? 1280 : 1320} cy={timeOfDay === 'dusk' ? 180 : 110} r={timeOfDay === 'dusk' ? 46 : 38} fill={timeOfDay === 'dusk' ? 'oklch(82% 0.17 45)' : 'oklch(88% 0.14 80)'} stroke={pal.ink} strokeWidth="2" opacity="0.9" />
      }
      <path d={`M 0 ${GROUND_Y-10} C 180 ${GROUND_Y-80}, 320 ${GROUND_Y-30}, 520 ${GROUND_Y-50} S 900 ${GROUND_Y-100}, 1100 ${GROUND_Y-60} S 1400 ${GROUND_Y-20}, 1600 ${GROUND_Y-40} L 1600 ${GROUND_Y} L 0 ${GROUND_Y} Z`} fill={pal.hill} opacity="0.7" />
      <path d={`M 0 ${GROUND_Y} C 200 ${GROUND_Y+2}, 450 ${GROUND_Y-6}, 700 ${GROUND_Y-2} S 1100 ${GROUND_Y+4}, 1600 ${GROUND_Y-3}`} fill="none" stroke={pal.ink} strokeWidth="2.2" strokeLinecap="round" />
      {Array.from({ length: 40 }).map((_, i) => {
        const x = 40 + i * 40 + (i % 3) * 5
        if (x > 300 && x < 500) return null
        return (
          <g key={i}>
            <line x1={x} y1={GROUND_Y} x2={x-2} y2={GROUND_Y-6} stroke={pal.grass2} strokeWidth="1.4" strokeLinecap="round" />
            <line x1={x+3} y1={GROUND_Y} x2={x+3} y2={GROUND_Y-8} stroke={pal.grass} strokeWidth="1.4" strokeLinecap="round" />
          </g>
        )
      })}
      {/* Trees */}
      {[720, 1240].map((tx, i) => {
        const h = i === 0 ? 130 : 90
        return (
          <g key={tx}>
            <line x1={tx} y1={GROUND_Y} x2={tx} y2={GROUND_Y-h+20} stroke={pal.ink} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={tx-4} cy={GROUND_Y-h+10} r={h*0.26} fill={pal.grass} stroke={pal.ink} strokeWidth="2" />
            <circle cx={tx+14} cy={GROUND_Y-h-4} r={h*0.2} fill={pal.grass2} stroke={pal.ink} strokeWidth="2" />
          </g>
        )
      })}
      {/* Birds */}
      {[{x:900,y:120,d:0},{x:1100,y:90,d:1.3},{x:1250,y:140,d:2.6}].map((b, i) => (
        <g key={i} style={{ animation: `birdFly 18s linear ${b.d}s infinite` }}>
          <path d={`M ${b.x} ${b.y} q 6 -6 12 0 q 6 -6 12 0`} fill="none" stroke={pal.ink} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
      <style>{`@keyframes birdFly { 0%{transform:translate(0,0)} 100%{transform:translate(-1800px,-30px)} }`}</style>
    </g>
  )
}

type LoginPhase = 'idle' | 'running' | 'entering' | 'done'

export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(state => !!state.token)
  const timeOfDay = useMemo(() => getTimeOfDay(), [])
  const pal = PALETTES[timeOfDay]

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const [phase, setPhase] = useState<LoginPhase>('idle')
  const [hoverLogin, setHoverLogin] = useState(false)

  const charsRef = useRef<Char[]>([])
  const [, rerender] = useState(0)
  const forceRender = useCallback(() => rerender(x => (x + 1) % 1e6), [])
  const phaseRef = useRef<LoginPhase>('idle')
  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    charsRef.current = CHARS.map((p, i) => ({
      id: i, name: p.name, height: p.height, speed: p.speed,
      x: 500 + i * 130, dir: i % 2 === 0 ? 1 : -1,
      mode: 'idle', nextDecision: performance.now() + 800 + Math.random() * 2000,
      atHome: false,
      shirt: p.shirt, pants: p.pants, hair: p.hair, skin: p.skin,
    }))
    forceRender()
  }, [forceRender])

  const tRef = useRef(0)
  useEffect(() => {
    let raf: number
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      tRef.current = now
      const chars = charsRef.current
      const ph = phaseRef.current

      for (const c of chars) {
        if (ph === 'idle') {
          if (now > c.nextDecision) {
            if (Math.random() < 0.45) {
              c.mode = 'idle'
              c.nextDecision = now + 1500 + Math.random() * 2500
            } else {
              c.mode = 'walk'
              c.dir = Math.random() > 0.5 ? 1 : -1
              c.nextDecision = now + 1500 + Math.random() * 2200
            }
          }
          if (c.mode === 'walk') {
            c.x += c.dir * c.speed * 0.6 * dt
            if (c.x < 420) { c.x = 420; c.dir = 1 }
            if (c.x > 1480) { c.x = 1480; c.dir = -1 }
          }
        } else if (ph === 'running') {
          if (!c.atHome) {
            const dx = DOOR_X - c.x
            if (Math.abs(dx) > 4) {
              c.mode = 'run'
              c.dir = dx > 0 ? 1 : -1
              c.x += c.dir * Math.max(c.speed, 60) * 5 * dt
            } else {
              c.x = DOOR_X
              c.atHome = true
            }
          }
        }
      }
      forceRender()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [forceRender])

  const handleLogin = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('running')
    phaseRef.current = 'running'
    const check = setInterval(() => {
      if (charsRef.current.every(c => c.atHome)) {
        clearInterval(check)
        setPhase('entering')
        phaseRef.current = 'entering'
        setTimeout(() => navigate('/login'), 2500)
      }
    }, 80)
  }, [phase, navigate])

  const handleRegister = () => navigate('/register')
  const handleDashboard = () => navigate('/dashboard')

  const doorOpen = phase === 'running' || phase === 'entering' || phase === 'done'
  // eslint-disable-next-line react-hooks/refs
  const visibleChars = charsRef.current.filter(c => !c.atHome)
  const t = tRef.current

  return (
    <div style={{ position: 'fixed', inset: 0, background: pal.paper, overflow: 'hidden', fontFamily: '"Geist Mono", monospace' }}>
      {/* dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(rgba(42,36,29,0.07) 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      }} />

      {/* SVG world */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMinYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Landscape pal={pal} timeOfDay={timeOfDay} />
        <House doorOpen={doorOpen} pal={pal} />
        {/* eslint-disable-next-line react-hooks/refs */}
        {visibleChars.map((c, i) => (
          <StickFigure
            key={c.id}
            ch={c}
            t={t}
            ink={pal.ink}
            paper={pal.paper}
            accent={i % 2 === 1}
            onClick={undefined}
          />
        ))}
      </svg>

      {/* fade-out overlay when entering */}
      <div style={{
        position: 'absolute', inset: 0, background: pal.paper, pointerEvents: 'none',
        opacity: phase === 'entering' ? 1 : 0,
        transition: 'opacity 900ms ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: pal.inkSoft, textTransform: 'uppercase' }}>
          Welcome Home
        </div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 52, color: pal.ink, lineHeight: 1 }}>
          Famly.
        </div>
      </div>

      {/* HUD */}
      <div className="landing-hud" style={{
        position: 'absolute', top: 'clamp(16px, 4vw, 40px)', left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '0 clamp(16px, 4vw, 56px)', pointerEvents: 'none',
        flexWrap: 'wrap', gap: 16,
      }}>
        {/* Left: Branding */}
        <div style={{ pointerEvents: 'all' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', color: pal.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>
            est. 2026 · dein digitales Zuhause
          </div>
          <h1 style={{ margin: 0, fontFamily: '"Instrument Serif", serif', fontSize: 'clamp(36px, 7vw, 110px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: pal.ink }}>
            Famly<br />
            <em style={{ fontStyle: 'italic', color: 'oklch(55% 0.12 146)' }}>Dashboard</em>
          </h1>
        </div>

        {/* Right: Actions */}
        <div style={{ pointerEvents: 'all', textAlign: 'right' }}>
          {isAuthenticated ? (
            <button
              onClick={handleDashboard}
              style={{
                fontFamily: '"Geist Mono", monospace', fontSize: 'clamp(10px, 2vw, 12px)', letterSpacing: '0.18em', textTransform: 'uppercase',
                background: pal.ink, color: pal.paper, border: `1.5px solid ${pal.ink}`,
                padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 28px)', borderRadius: 2, cursor: 'pointer', transition: 'all 200ms',
              }}
            >
              Dashboard →
            </button>
          ) : (
            <>
              <button
                onClick={handleLogin}
                onMouseEnter={() => setHoverLogin(true)}
                onMouseLeave={() => setHoverLogin(false)}
                disabled={phase !== 'idle'}
                style={{
                  fontFamily: '"Geist Mono", monospace', fontSize: 'clamp(10px, 2vw, 12px)', letterSpacing: '0.2em', textTransform: 'uppercase',
                  background: hoverLogin ? pal.ink : 'transparent', color: hoverLogin ? pal.paper : pal.ink,
                  border: `1.5px solid ${pal.ink}`, padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 28px)', borderRadius: 2,
                  cursor: phase === 'idle' ? 'pointer' : 'default', transition: 'all 200ms',
                  opacity: phase === 'idle' ? 1 : 0.5,
                }}
              >
                Login →
              </button>
              <div style={{ marginTop: 10, fontSize: 11, color: pal.inkSoft }}>
                Neu hier?{' '}
                <span
                  onClick={handleRegister}
                  style={{ borderBottom: `1px solid ${pal.inkSoft}`, cursor: 'pointer' }}
                >
                  Familie gründen
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer" style={{
        position: 'absolute', bottom: 'clamp(12px, 2vw, 24px)', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', padding: '0 clamp(16px, 4vw, 56px)',
        fontSize: 10, letterSpacing: '0.22em', color: pal.inkSoft, textTransform: 'uppercase',
        pointerEvents: 'none', flexWrap: 'wrap', gap: '4px 24px', textAlign: 'center',
      }}>
        <span>Famly · Familien Dashboard</span>
        <span className="landing-footer-desc" style={{ letterSpacing: '0.1em', textTransform: 'none', fontSize: 11 }}>Termine, Aufgaben, Einkaufslisten — alles an einem Ort.</span>
        <span>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
      </div>

    </div>
  )
}
