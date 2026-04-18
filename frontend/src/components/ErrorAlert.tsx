import { X } from 'lucide-react'

interface Props {
  message: string | null | undefined
  onDismiss?: () => void
}

export default function ErrorAlert({ message, onDismiss }: Props) {
  if (!message) return null

  return (
    <div
      className="flex items-center justify-between text-sm px-3 py-2 rounded-lg"
      style={{
        background: 'var(--color-danger-50)',
        color: 'var(--color-danger-700)',
        border: onDismiss ? '1px solid var(--color-danger-200)' : 'none',
      }}
      role="alert"
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fehlermeldung schließen"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-danger-700)',
            lineHeight: 1,
            marginLeft: '12px',
            flexShrink: 0,
            display: 'flex',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
