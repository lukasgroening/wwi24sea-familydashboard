import { useState, useRef, useEffect, forwardRef } from 'react'
import { X, Cloud, Calendar, CheckSquare, LayoutList, Plus } from 'lucide-react'
import { ReactGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WIDGETS } from '../widgets'
import { useAuthStore } from '../store/authStore'
import { useDashboardStore } from '../store/dashboardStore'
import type { Role } from '../types'
import WeatherWidget from '../widgets/WeatherWidget'

const ink = '#2a241d'
const ink2 = '#554a3c'
const inkSoft = '#8a7d6a'
const paper = '#f5efe3'
const paper2 = '#ede5d2'
const border = '#ddd3be'
const accent = 'oklch(55% 0.12 146)'

function isAdminRole(role: Role | undefined): boolean {
  return role === 'Familien-Administrator' || role === 'System-Administrator'
}

function canSeeWidget(widgetRole: Role | undefined, userRole: Role | undefined): boolean {
  if (!widgetRole) return true
  if (isAdminRole(userRole)) return true
  return widgetRole === 'Nutzer'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

const todayStr = new Date().toLocaleDateString('de-DE', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

interface WidgetShellProps extends React.HTMLAttributes<HTMLDivElement> {
  onRemove: () => void
  variant: 'weather' | 'default'
  children: React.ReactNode
  title?: string
  isAdmin?: boolean
}

const WidgetShell = forwardRef<HTMLDivElement, WidgetShellProps>(
  ({ onRemove, variant, children, title, isAdmin, className = '', style, ...rest }, ref) => {
    const isWeather = variant === 'weather'
    return (
      <div
        ref={ref}
        className={`group h-full overflow-hidden relative ${className}`}
        style={{
          borderRadius: 12,
          padding: 20,
          background: isWeather ? accent : paper,
          border: isWeather ? 'none' : `1px solid ${border}`,
          boxShadow: '0 1px 4px rgba(42,36,29,0.06)',
          ...style,
        }}
        {...rest}
      >
        {/* drag handle */}
        {isAdmin && (
          <div className="widget-drag-handle absolute top-2 left-2 right-10 h-6 cursor-grab z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div style={{ width: 28, height: 3, borderRadius: 2, background: isWeather ? 'rgba(245,239,227,0.4)' : border }} />
          </div>
        )}
        {/* remove button */}
        {isAdmin && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: isWeather ? 'rgba(245,239,227,0.15)' : 'rgba(42,36,29,0.06)',
              border: 'none', cursor: 'pointer',
              color: isWeather ? paper : ink2,
              minHeight: 'unset', minWidth: 'unset',
            }}
            title="Widget entfernen"
          >
            <X size={12} />
          </button>
        )}
        {title && (
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: inkSoft, marginBottom: 14 }}>
            {title}
          </div>
        )}
        {children}
      </div>
    )
  }
)

export default function DashboardPage() {
  const { user } = useAuthStore()
  const {
    widgets: dashboardWidgets,
    layouts,
    addWidget,
    removeWidget,
    updateLayouts,
    updateWidgetSettings,
    loadFromBackend,
    saveToBackend,
  } = useDashboardStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const isAdmin = user?.role === 'Familien-Administrator' || user?.role === 'System-Administrator'

  useEffect(() => {
    loadFromBackend()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Responsive columns: fewer on small screens
  const cols = containerWidth < 480 ? 2 : containerWidth < 768 ? 4 : 12

  const handleLayoutChange = (newLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    updateLayouts(newLayout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })))
  }

  // Layout für die Anzeige vorbereiten (static setzen wenn kein Admin)
  const displayLayout = layouts.map(l => ({
    ...l,
    static: !isAdmin
  }))

  return (
    <div style={{ flex: 1, padding: '28px 28px 40px', overflowY: 'auto', minWidth: 0 }} ref={containerRef}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 'clamp(22px, 3vw, 32px)', color: ink, lineHeight: 1.1, margin: 0 }}>
            {getGreeting()}{user?.username ? `, ${user.username}` : ''}.
          </h1>
          <p style={{ fontSize: 11, color: inkSoft, marginTop: 4, letterSpacing: '0.04em' }}>{todayStr}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
              borderRadius: 6, background: ink, color: paper, border: 'none',
              fontFamily: '"Geist Mono", monospace', fontSize: 11, letterSpacing: '0.16em',
              textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
              minHeight: 44,
            }}
          >
            <Plus size={13} /> Widget
          </button>
        )}
      </div>

      {/* Grid */}
      <ReactGridLayout
        className="layout"
        layout={displayLayout}
        cols={cols}
        rowHeight={90}
        width={containerWidth - 56}
        onLayoutChange={handleLayoutChange}
        onDragStop={saveToBackend}
        onResizeStop={saveToBackend}
        draggableHandle=".widget-drag-handle"
        isResizable={isAdmin}
        isDraggable={isAdmin}
        compactType="vertical"
        margin={[12, 12]}
      >
        {dashboardWidgets.map((instance) => {
          const config = WIDGETS.find((w) => w.id === instance.widgetId)
          if (!config) return <div key={instance.instanceId} />
          if (!canSeeWidget(config.requiredRole, user?.role)) return <div key={instance.instanceId} />
          
          const isWeather = instance.widgetId === 'weather'
          
          return (
            <WidgetShell
              key={instance.instanceId}
              onRemove={() => removeWidget(instance.instanceId)}
              variant={isWeather ? 'weather' : 'default'}
              title={isWeather ? undefined : config.name}
              isAdmin={isAdmin}
            >
              <config.component 
                settings={instance.settings}
                onSettingsChange={(s) => updateWidgetSettings(instance.instanceId, s)}
              />
            </WidgetShell>
          )
        })}
      </ReactGridLayout>

      {/* Add Widget Modal */}
      {showAddModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(42,36,29,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: 16,
          }}
        >
          <div style={{
            background: paper, borderRadius: 12, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 16,
            width: '100%', maxWidth: 380,
            border: `1px solid ${border}`,
            boxShadow: '0 12px 40px rgba(42,36,29,0.15)',
          }}>
            <div>
              <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, color: ink }}>Widget hinzufügen</div>
              <div style={{ fontSize: 11, color: inkSoft, marginTop: 4 }}>Wähle ein Widget für dein Dashboard</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WIDGETS.filter((w) => canSeeWidget(w.requiredRole, user?.role)).map((w) => {
                const isActive = dashboardWidgets.some((dw) => dw.widgetId === w.id)
                const WidgetIcon = w.id === 'weather' ? Cloud : w.id === 'calendar' ? Calendar : w.id === 'todo' ? CheckSquare : LayoutList
                return (
                  <div
                    key={w.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 8, border: `1px solid ${border}`,
                      background: isActive ? paper2 : paper,
                      opacity: isActive ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: paper2, color: ink2,
                    }}>
                      <WidgetIcon size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: ink }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: inkSoft }}>{w.description}</div>
                    </div>
                    {isActive ? (
                      <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: 'oklch(92% 0.04 146)', color: accent, letterSpacing: '0.06em' }}>
                        Aktiv
                      </span>
                    ) : (
                      <button
                        onClick={() => { addWidget(w.id); setShowAddModal(false) }}
                        style={{
                          padding: '6px 12px', borderRadius: 6, fontSize: 11,
                          background: ink, color: paper, border: 'none', cursor: 'pointer',
                          fontFamily: '"Geist Mono", monospace', letterSpacing: '0.1em',
                          minHeight: 'unset',
                        }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              style={{
                padding: '11px', borderRadius: 6, fontSize: 11, letterSpacing: '0.14em',
                background: paper2, color: ink2, border: `1px solid ${border}`,
                cursor: 'pointer', fontFamily: '"Geist Mono", monospace', textTransform: 'uppercase',
                minHeight: 44,
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
