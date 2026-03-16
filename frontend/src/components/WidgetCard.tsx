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
      style={{ background: '#ffffff', border: '1px solid #e8e8e2', ...style }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#b5b5a8' }}>
        {widget.name}
      </div>
      <Component />
    </div>
  )
}
