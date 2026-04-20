import { useState } from 'react'
import { X, Clipboard, Check, UserPlus } from 'lucide-react'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  familyName: string
  joinCode: string
}

export default function InviteModal({ isOpen, onClose, familyName, joinCode }: InviteModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(joinCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" 
        style={{ background: 'white' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--color-sage-500)' }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Familie Einladen</h2>
              <p className="text-xs" style={{ color: 'var(--color-stone-500)' }}>{familyName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-stone-400)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm mb-4 px-4" style={{ color: 'var(--color-stone-600)' }}>
            Teile diesen Code mit deinen Familienmitgliedern, damit sie deinem Dashboard beitreten können.
          </p>
          
          <div 
            className="relative group p-4 rounded-2xl border-2 border-dashed transition-all"
            style={{ 
              background: 'var(--color-stone-50)', 
              borderColor: copied ? 'var(--color-sage-400)' : 'var(--color-stone-200)' 
            }}
          >
            <div className="font-mono text-2xl font-bold tracking-[0.3em] mb-1" style={{ color: 'var(--color-sage-600)' }}>
              {joinCode}
            </div>
            
            <button
              onClick={handleCopy}
              className="mt-3 flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ 
                background: copied ? 'var(--color-sage-500)' : 'var(--color-stone-200)',
                color: copied ? 'white' : 'var(--color-stone-700)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} /> : <Clipboard size={14} />}
              {copied ? 'Kopiert!' : 'Code Kopieren'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{ 
            background: 'var(--color-stone-900)', 
            color: 'white',
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          Fertig
        </button>
      </div>
    </div>
  )
}
