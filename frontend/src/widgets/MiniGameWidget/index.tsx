import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Play } from 'lucide-react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import RunnerGame from '../../components/RunnerGame'

interface ScoreEntry {
  id: number
  user_id: number
  username: string
  score: number
  created_at: string
  family_name?: string
}

const INK = '#2a241d'
const PAPER = '#f5efe3'

export default function MiniGameWidget() {
  const queryClient = useQueryClient()
  const [showGame, setShowGame] = useState(false)
  const [view, setView] = useState<'family' | 'global'>('family')

  const user = useAuthStore(state => state.user)

  const { data: myHighscore } = useQuery<ScoreEntry | null>({
    queryKey: ['game-score-me', user?.id],
    queryFn: () => api.get<ScoreEntry | null>('/api/game/score/me').then(r => r.data),
  })

  const { data: familyLeaderboard = [] } = useQuery<ScoreEntry[]>({
    queryKey: ['game-score-family', user?.join_code], // join_code als Proxy für die Familie
    queryFn: () => api.get<ScoreEntry[]>('/api/game/score/family').then(r => r.data),
  })

  const { data: globalLeaderboard = [] } = useQuery<ScoreEntry[]>({
    queryKey: ['game-score-global'],
    queryFn: () => api.get<ScoreEntry[]>('/api/game/score/global').then(r => r.data),
  })

  const leaderboard = view === 'family' ? familyLeaderboard : globalLeaderboard

  const submitScore = useMutation({
    mutationFn: (score: number) =>
      api.post<ScoreEntry>('/api/game/score', { score }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-score-me'] })
      queryClient.invalidateQueries({ queryKey: ['game-score-family'] })
      queryClient.invalidateQueries({ queryKey: ['game-score-global'] })
    },
  })

  const handleGameOver = (score: number) => {
    submitScore.mutate(score)
  }

  const displayHs = myHighscore ? Math.floor(myHighscore.score / 10) : null

  return (
    <>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: '"Geist Mono", monospace', color: INK }}>

        {/* Header: persönlicher HS + Spielen-Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={14} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {displayHs !== null ? `Dein Rekord: ${displayHs}` : 'Noch kein Score'}
            </span>
          </div>
          <button
            onClick={() => setShowGame(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: '"Geist Mono", monospace',
              fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 6,
              border: `1px solid ${INK}30`,
              background: INK, color: PAPER,
              cursor: 'pointer',
            }}
          >
            <Play size={11} />
            Spielen
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 16, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <button
            onClick={() => setView('family')}
            style={{
              background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
              color: INK, opacity: view === 'family' ? 1 : 0.4,
              borderBottom: view === 'family' ? `2px solid ${INK}` : '2px solid transparent',
              fontWeight: view === 'family' ? 600 : 400,
              fontFamily: 'inherit',
            }}
          >
            Familie
          </button>
          <button
            onClick={() => setView('global')}
            style={{
              background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
              color: INK, opacity: view === 'global' ? 1 : 0.4,
              borderBottom: view === 'global' ? `2px solid ${INK}` : '2px solid transparent',
              fontWeight: view === 'global' ? 600 : 400,
              fontFamily: 'inherit',
            }}
          >
            Weltweit
          </button>
        </div>

        {/* Leaderboard */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.4, fontSize: 12, paddingTop: 24 }}>
              {view === 'family' ? 'Noch keine Scores in der Familie.' : 'Weltweit noch keine Scores.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 8px 8px', textAlign: 'left', opacity: 0.4, fontWeight: 500 }}>#</th>
                  <th style={{ padding: '0 8px 8px', textAlign: 'left', opacity: 0.4, fontWeight: 500 }}>Nutzer</th>
                  <th style={{ padding: '0 8px 8px', textAlign: 'right', opacity: 0.4, fontWeight: 500 }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr
                    key={entry.id}
                    style={{ borderTop: `1px solid ${INK}10` }}
                  >
                    <td style={{ padding: '8px', opacity: 0.5, fontSize: 11 }}>
                      {i === 0 ? '🏆' : `#${i + 1}`}
                    </td>
                    <td style={{ padding: '8px', fontWeight: i === 0 ? 600 : 400 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{entry.username}</span>
                        {view === 'global' && entry.family_name && (
                          <span style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {entry.family_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                      {Math.floor(entry.score / 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Game Modal — via Portal um CSS transform von react-grid-layout zu umgehen */}
      {showGame && createPortal(
        <RunnerGame
          onClose={() => setShowGame(false)}
          inkColor={INK}
          paperColor={PAPER}
          onGameOver={handleGameOver}
        />,
        document.body,
      )}
    </>
  )
}
