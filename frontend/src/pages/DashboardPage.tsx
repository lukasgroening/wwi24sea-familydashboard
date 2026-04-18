import { useState, useRef, useEffect, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Cloud, Calendar, CheckSquare, LayoutList, Plus, LogOut } from 'lucide-react'
import { ReactGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WIDGETS } from '../widgets'
import { useAuthStore } from '../store/authStore'
import { useDashboardStore } from '../store/dashboardStore'
import type { Role } from '../types'
import WeatherWidget from '../widgets/WeatherWidget'

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
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

interface WidgetShellProps extends React.HTMLAttributes<HTMLDivElement> {
  onRemove: () => void
  variant: 'weather' | 'default'
  children: React.ReactNode
  title?: string
}

const WidgetShell = forwardRef<HTMLDivElement, WidgetShellProps>(
  ({ onRemove, variant, children, title, className = '', style, ...rest }, ref) => {
  const isWeather = variant === 'weather'
  const baseStyle: React.CSSProperties = isWeather
    ? { background: 'var(--color-sage-500)' }
    : { background: 'white', border: '1px solid var(--color-stone-border)' }
  return (
    <div
      ref={ref}
      className={`rounded-2xl p-5 relative group h-full overflow-hidden ${className}`}
      style={{ ...baseStyle, ...style }}
      {...rest}
    >
      <div className="widget-drag-handle absolute top-2 left-2 right-10 h-6 cursor-grab z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-8 h-1 rounded-full" style={{ background: isWeather ? 'oklch(1 0 0 / 0.4)' : 'var(--color-stone-400)' }} />
      </div>
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        style={isWeather
          ? { background: 'oklch(1 0 0 / 0.15)', border: 'none', cursor: 'pointer', color: 'oklch(1 0 0 / 0.8)' }
          : { background: 'var(--color-danger-50)', border: 'none', cursor: 'pointer', color: 'var(--color-danger-500)' }
        }
        title="Widget entfernen"
      >
        <X size={12} />
      </button>
      {title && (
        <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-stone-500)' }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
})

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
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
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = (newLayout: any) => {
    const mapped = (newLayout as Array<{ i: string; x: number; y: number; w: number; h: number }>).map((l) => ({
      i: l.i,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
    }))
    updateLayouts(mapped)
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto" ref={containerRef}>
      {/* Topbar */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-stone-900)' }}>
            {getGreeting()}{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-stone-600)' }}>{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Plus size={14} /> Widget
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--color-stone-100)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-stone-700)' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Drag-and-Drop Grid */}
      <ReactGridLayout
        className="layout"
        layout={layouts}
        cols={12}
        rowHeight={90}
        width={containerWidth - 64}
        onLayoutChange={handleLayoutChange}
        onDragStop={saveToBackend}
        onResizeStop={saveToBackend}
        draggableHandle=".widget-drag-handle"
        isResizable={true}
        isDraggable={true}
        compactType="vertical"
        margin={[14, 14]}
      >
        {dashboardWidgets.map((instance) => {
          const config = WIDGETS.find((w) => w.id === instance.widgetId)
          if (!config) return <div key={instance.instanceId} />
          if (!canSeeWidget(config.requiredRole, user?.role)) return <div key={instance.instanceId} />

          const isWeather = instance.widgetId === 'weather'

          if (isWeather) {
            return (
              <WidgetShell
                key={instance.instanceId}
                onRemove={() => removeWidget(instance.instanceId)}
                variant="weather"
              >
                <WeatherWidget
                  settings={instance.settings}
                  onSettingsChange={(newSettings) =>
                    updateWidgetSettings(instance.instanceId, newSettings)
                  }
                />
              </WidgetShell>
            )
          }

          return (
            <WidgetShell
              key={instance.instanceId}
              onRemove={() => removeWidget(instance.instanceId)}
              variant="default"
              title={config.name}
            >
              <config.component />
            </WidgetShell>
          )
        })}
      </ReactGridLayout>

      {/* Add Widget Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'oklch(0 0 0 / 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}
        >
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 w-96"
            style={{ background: 'white', border: '1px solid var(--color-stone-border)', boxShadow: '0 8px 32px oklch(0 0 0 / 0.12)' }}
          >
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-stone-900)' }}>
                Widget hinzufügen
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-stone-600)' }}>
                Wähle ein Widget für dein Dashboard
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {WIDGETS.filter((w) => canSeeWidget(w.requiredRole, user?.role)).map((w) => {
                const isActive = dashboardWidgets.some((dw) => dw.widgetId === w.id)
                const WidgetIcon = w.id === 'weather' ? Cloud : w.id === 'calendar' ? Calendar : w.id === 'todo' ? CheckSquare : LayoutList
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: isActive ? 'var(--color-stone-50)' : 'white',
                      border: '1px solid var(--color-stone-border)',
                      opacity: isActive ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'var(--color-stone-100)', color: 'var(--color-stone-600)' }}>
                      <WidgetIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: 'var(--color-stone-900)' }}>
                        {w.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-stone-600)' }}>
                        {w.description}
                      </div>
                    </div>
                    {isActive ? (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--color-sage-50)', color: 'var(--color-sage-500)' }}>
                        Aktiv
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          addWidget(w.id)
                          setShowAddModal(false)
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ background: 'var(--color-sage-500)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Hinzufügen
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 rounded-xl text-sm"
              style={{ background: 'var(--color-stone-100)', color: 'var(--color-stone-700)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
