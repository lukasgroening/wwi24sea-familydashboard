import type { WidgetConfig } from '../types'

interface Props {
  widget: WidgetConfig
  className?: string
  style?: React.CSSProperties
}

export default function WidgetCard({ widget, className = '', style }: Props) {
  const Component = widget.component
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: 'white', border: '1px solid var(--color-stone-border)', ...style }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-stone-500)' }}>
        {widget.name}
      </div>
      <Component />
    </div>
  )
}
