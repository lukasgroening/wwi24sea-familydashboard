import type { CalendarEvent } from './types'

interface Props {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onAddEvent: (date: string) => void
  onClose: () => void
}

function formatTime(isoStr: string, allDay?: boolean): string {
  if (allDay) return 'Ganztags'
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function DayEventsPopover({ date, events, onEventClick, onAddEvent, onClose }: Props) {
  const dateStr = date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: '#ffffff',
        border: '1px solid #e8e8e2',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        minWidth: '220px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: '#2d2d2d' }}>{dateStr}</div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-xs"
          style={{ background: '#f4f4f0', color: '#9e9e96', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Events */}
      {events.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => onEventClick(ev)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
              style={{ background: '#f8f8f4' }}
            >
              <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: ev.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{ev.title}</div>
                <div className="text-xs" style={{ color: '#9e9e96' }}>
                  {formatTime(ev.start, ev.allDay)}
                  {!ev.allDay && ` – ${formatTime(ev.end)}`}
                </div>
              </div>
              {ev.editable && (
                <div className="text-xs" style={{ color: '#b5b5a8' }}>✎</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-center py-2" style={{ color: '#b5b5a8' }}>
          Keine Termine
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => onAddEvent(ymd)}
        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ background: '#f0f5f0', color: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        + Termin hinzufügen
      </button>
    </div>
  )
}
