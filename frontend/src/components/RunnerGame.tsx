import { useEffect, useRef, useState, useCallback } from 'react'

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

interface Props {
  onClose: () => void
  inkColor: string
  paperColor: string
  onGameOver?: (score: number) => void
}

interface Obstacle {
  x: number
  w: number
  h: number
  type: 'bush' | 'rock'
}

const GAME_W = 700
const GAME_H = 200
const GROUND = 155
const GRAVITY = 0.6
const JUMP_V = -13
const CHAR_X = 80
const CHAR_W = 28
const CHAR_H = 36

export default function RunnerGame({ onClose, inkColor, paperColor, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    y: GROUND - CHAR_H,
    vy: 0,
    onGround: true,
    obstacles: [] as Obstacle[],
    score: 0,
    speed: 4,
    framesSinceObstacle: 0,
    dead: false,
    started: false,
    highScore: parseInt(localStorage.getItem('famly_runner_hs') || '0'),
  })
  const [dead, setDead] = useState(false)
  const [score, setScore] = useState(0)
  const rafRef = useRef(0)

  const jump = useCallback(() => {
    const s = stateRef.current
    if (!s.started) { s.started = true; return }
    if (s.dead) { restart(); return }
    if (s.onGround) { s.vy = JUMP_V; s.onGround = false }
  }, [])

  const restart = () => {
    const s = stateRef.current
    s.y = GROUND - CHAR_H
    s.vy = 0
    s.onGround = true
    s.obstacles = []
    s.score = 0
    s.speed = 4
    s.framesSinceObstacle = 0
    s.dead = false
    s.started = true
    setDead(false)
    setScore(0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump() }
      if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [jump, onClose])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const drawChar = (y: number, frame: number) => {
      const phase = frame * 0.18
      const legSwing = stateRef.current.onGround ? Math.sin(phase) * 8 : 0
      const armSwing = stateRef.current.onGround ? -Math.sin(phase) * 10 : -15

      ctx.strokeStyle = inkColor
      ctx.fillStyle = inkColor
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      const cx = CHAR_X
      const gy = y + CHAR_H

      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.beginPath()
      ctx.ellipse(cx, gy + 2, 14, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // legs
      ctx.fillStyle = '#3a5a8c'
      rrect(ctx, cx - 10 + legSwing * 0.4, gy - 22, 8, 20, 3); ctx.fill()
      rrect(ctx, cx + 2 - legSwing * 0.4, gy - 22, 8, 20, 3); ctx.fill()

      // shoes
      ctx.fillStyle = inkColor
      ctx.beginPath(); ctx.ellipse(cx - 6 + legSwing * 0.4, gy - 1, 7, 3, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(cx + 6 - legSwing * 0.4, gy - 1, 7, 3, 0, 0, Math.PI * 2); ctx.fill()

      // body
      ctx.fillStyle = 'oklch(65% 0.14 20)'; ctx.strokeStyle = inkColor; ctx.lineWidth = 1.5
      rrect(ctx, cx - 12, gy - 44, 24, 22, 6); ctx.fill(); ctx.stroke()

      // arms
      ctx.fillStyle = 'oklch(65% 0.14 20)'
      rrect(ctx, cx - 18 + armSwing * 0.3, gy - 42, 7, 18, 3); ctx.fill(); ctx.stroke()
      rrect(ctx, cx + 11 - armSwing * 0.3, gy - 42, 7, 18, 3); ctx.fill(); ctx.stroke()

      // head
      ctx.fillStyle = '#ecc4a0'
      ctx.beginPath()
      ctx.arc(cx, gy - 53, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = inkColor
      ctx.lineWidth = 1.5
      ctx.stroke()

      // hair
      ctx.fillStyle = '#5a3a1c'
      ctx.beginPath()
      ctx.arc(cx, gy - 60, 9, Math.PI, Math.PI * 2)
      ctx.fill()

      // eyes
      ctx.fillStyle = inkColor
      ctx.beginPath()
      ctx.arc(cx - 3, gy - 54, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4, gy - 54, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawObstacle = (obs: Obstacle) => {
      if (obs.type === 'bush') {
        ctx.fillStyle = 'oklch(55% 0.09 120)'
        ctx.strokeStyle = inkColor
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(obs.x + obs.w * 0.3, GROUND - obs.h * 0.6, obs.w * 0.3, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
        ctx.beginPath()
        ctx.arc(obs.x + obs.w * 0.7, GROUND - obs.h * 0.5, obs.w * 0.25, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
        ctx.beginPath()
        ctx.arc(obs.x + obs.w * 0.5, GROUND - obs.h * 0.8, obs.w * 0.28, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
      } else {
        ctx.fillStyle = 'oklch(65% 0.03 80)'
        ctx.strokeStyle = inkColor
        ctx.lineWidth = 1.5
        rrect(ctx, obs.x, GROUND - obs.h, obs.w, obs.h, 4); ctx.fill(); ctx.stroke()
      }
    }

    let frame = 0
    const loop = () => {
      const s = stateRef.current
      ctx.clearRect(0, 0, GAME_W, GAME_H)

      // background
      ctx.fillStyle = paperColor
      ctx.fillRect(0, 0, GAME_W, GAME_H)

      // ground line
      ctx.strokeStyle = inkColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, GROUND)
      ctx.lineTo(GAME_W, GROUND)
      ctx.stroke()

      // grass tufts
      ctx.strokeStyle = 'oklch(55% 0.09 120)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < GAME_W; i += 30) {
        const gx = (i - (frame * (s.speed * 0.3)) % 30 + GAME_W) % GAME_W
        ctx.beginPath()
        ctx.moveTo(gx, GROUND)
        ctx.lineTo(gx + 3, GROUND - 6)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(gx + 6, GROUND)
        ctx.lineTo(gx + 9, GROUND - 8)
        ctx.stroke()
      }

      if (!s.started) {
        ctx.fillStyle = inkColor
        ctx.font = `500 13px "Geist Mono", monospace`
        ctx.textAlign = 'center'
        ctx.fillText('LEERTASTE oder KLICK zum Starten', GAME_W / 2, GAME_H / 2 - 10)
        drawChar(s.y, 0)
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      if (!s.dead) {
        frame++
        s.score++
        s.speed = 4 + Math.floor(s.score / 300) * 0.5

        // physics
        s.vy += GRAVITY
        s.y += s.vy
        if (s.y >= GROUND - CHAR_H) {
          s.y = GROUND - CHAR_H
          s.vy = 0
          s.onGround = true
        } else {
          s.onGround = false
        }

        // spawn obstacles
        s.framesSinceObstacle++
        const minGap = Math.max(60, 90 - Math.floor(s.score / 200) * 5)
        if (s.framesSinceObstacle > minGap && Math.random() < 0.03) {
          const isBush = Math.random() > 0.4
          s.obstacles.push({
            x: GAME_W + 10,
            w: isBush ? 32 : 20,
            h: isBush ? 30 : 25,
            type: isBush ? 'bush' : 'rock',
          })
          s.framesSinceObstacle = 0
        }

        // move obstacles
        s.obstacles = s.obstacles
          .map(o => ({ ...o, x: o.x - s.speed }))
          .filter(o => o.x > -60)

        // collision
        for (const obs of s.obstacles) {
          if (
            CHAR_X + CHAR_W - 6 > obs.x + 4 &&
            CHAR_X + 6 < obs.x + obs.w - 4 &&
            s.y + CHAR_H > GROUND - obs.h + 4
          ) {
            s.dead = true
            if (s.score > s.highScore) {
              s.highScore = s.score
              localStorage.setItem('famly_runner_hs', String(s.score))
            }
            setDead(true)
            onGameOver?.(s.score)
          }
        }

        setScore(Math.floor(s.score / 10))
      }

      s.obstacles.forEach(drawObstacle)
      drawChar(s.y, frame)

      if (s.dead) {
        ctx.fillStyle = `${inkColor}cc`
        ctx.font = `italic 28px "Instrument Serif", serif`
        ctx.textAlign = 'center'
        ctx.fillText('Ausgerutscht!', GAME_W / 2, GAME_H / 2 - 16)
        ctx.font = `500 12px "Geist Mono", monospace`
        ctx.fillText(`LEERTASTE zum Neustart`, GAME_W / 2, GAME_H / 2 + 14)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [inkColor, paperColor, onGameOver])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={jump}
    >
      <div
        style={{ background: paperColor, borderRadius: 16, padding: 28, position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, color: inkColor }}>Famly Runner</span>
            <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 11, color: inkColor, opacity: 0.5, marginLeft: 12 }}>
              klick / leertaste = springen
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12, color: inkColor, opacity: 0.6 }}>
              HS {stateRef.current.highScore > 0 ? Math.floor(stateRef.current.highScore / 10) : 0}
            </span>
            <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 14, color: inkColor, fontWeight: 500 }}>
              {score}
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: `1px solid ${inkColor}40`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: inkColor, fontFamily: '"Geist Mono", monospace', fontSize: 11 }}
            >
              ESC
            </button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={GAME_W}
          height={GAME_H}
          onClick={jump}
          style={{ display: 'block', borderRadius: 8, border: `1.5px solid ${inkColor}20`, cursor: 'pointer', maxWidth: '100%' }}
        />
        {dead && (
          <div style={{ textAlign: 'center', marginTop: 10, fontFamily: '"Geist Mono", monospace', fontSize: 11, color: inkColor, opacity: 0.6 }}>
            Highscore: {Math.floor(stateRef.current.highScore / 10)}
          </div>
        )}
      </div>
    </div>
  )
}
