import { useState, useRef, useEffect } from 'react'
import { ReactGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { WIDGETS } from '../widgets'
import { useAuthStore } from '../store/authStore'
import { useDashboardStore } from '../store/dashboardStore'
import type { Role } from '../types'
import WeatherWidget from '../widgets/WeatherWidget'

function canSeeWidget(widgetRole: Role | undefined, userRole: Role | undefined): boolean {
  if (!widgetRole) return true
  if (userRole === 'sysadmin') return true
  if (userRole === 'admin') return true
  return widgetRole === 'user'
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

export default function DashboardPage() {
  const { user } = useAuthStore()
  const {
    widgets: dashboardWidgets,
    layouts,
    addWidget,
    removeWidget,
    updateLayouts,
    updateWidgetSettings,
  } = useDashboardStore()

  const [showAddModal, setShowAddModal] = useState(false)

  // Track container width for react-grid-layout
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

  // Handle layout change from drag/resize
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
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#1a1a1a' }}>
            {getGreeting()}{user?.name ? `, ${user.name}` : ''} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9e9e96' }}>{todayStr}</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'sysadmin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ＋ Widget
          </button>
        )}
      </div>

      {/* Drag-and-Drop Grid */}
      <ReactGridLayout
        className="layout"
        layout={layouts}
        cols={12}
        rowHeight={90}
        width={containerWidth - 64}
        onLayoutChange={handleLayoutChange}
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

          // Weather widget — special green background + settings + remove
          if (isWeather) {
            return (
              <div key={instance.instanceId} className="rounded-2xl p-5 relative group" style={{ background: '#7c9a7e' }}>
                {/* Drag handle */}
                <div className="widget-drag-handle absolute top-2 left-2 right-10 h-6 cursor-grab z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
                </div>
                {/* Remove button */}
                <button
                  onClick={() => removeWidget(instance.instanceId)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg text-xs flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}
                  title="Widget entfernen"
                >
                  ✕
                </button>
                {/* Weather widget with settings */}
                <WeatherWidget
                  settings={instance.settings}
                  onSettingsChange={(newSettings) =>
                    updateWidgetSettings(instance.instanceId, newSettings)
                  }
                />
              </div>
            )
          }

          // Other widgets (calendar, todo, schedule) — standard rendering
          return (
            <div
              key={instance.instanceId}
              className="rounded-2xl p-5 relative group"
              style={{ background: '#ffffff', border: '1px solid #e8e8e2' }}
            >
              {/* Drag handle */}
              <div className="widget-drag-handle absolute top-2 left-2 right-10 h-6 cursor-grab z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-8 h-1 rounded-full" style={{ background: '#d4d4cc' }} />
              </div>
              {/* Remove button */}
              <button
                onClick={() => removeWidget(instance.instanceId)}
                className="absolute top-2 right-2 w-6 h-6 rounded-lg text-xs flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#c45c5c' }}
                title="Widget entfernen"
              >
                ✕
              </button>
              {/* Header */}
              <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#b5b5a8' }}>
                {config.name}
              </div>
              <config.component />
            </div>
          )
        })}
      </ReactGridLayout>

      {/* Add Widget Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}
        >
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 w-96"
            style={{ background: '#ffffff', border: '1px solid #e8e8e2', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <div>
              <div className="text-sm font-semibold" style={{ color: '#2d2d2d' }}>
                Widget hinzufügen
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#9e9e96' }}>
                Wähle ein Widget für dein Dashboard
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {WIDGETS.filter((w) => canSeeWidget(w.requiredRole, user?.role)).map((w) => {
                const isActive = dashboardWidgets.some((dw) => dw.widgetId === w.id)
                const emoji = w.id === 'weather' ? '🌤️' : w.id === 'calendar' ? '📅' : w.id === 'todo' ? '✅' : '📋'
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: isActive ? '#f8f8f4' : '#ffffff',
                      border: '1px solid #e8e8e2',
                      opacity: isActive ? 0.6 : 1,
                    }}
                  >
                    <div className="text-2xl">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: '#2d2d2d' }}>
                        {w.name}
                      </div>
                      <div className="text-xs" style={{ color: '#9e9e96' }}>
                        {w.description}
                      </div>
                    </div>
                    {isActive ? (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#f0f5f0', color: '#7c9a7e' }}>
                        Aktiv
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          addWidget(w.id)
                          setShowAddModal(false)
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
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
              style={{ background: '#f4f4f0', color: '#7a7a72', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
