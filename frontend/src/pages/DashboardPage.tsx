import { useState, useRef, useEffect, forwardRef, useMemo } from 'react'
import { X, Cloud, Calendar, CheckSquare, LayoutList, Plus } from 'lucide-react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WIDGETS } from '../widgets'
import { useAuthStore } from '../store/authStore'
import { useDashboardStore } from '../store/dashboardStore'
import type { Role } from '../types'

const ResponsiveGridLayout = WidthProvider(Responsive)

// ... (ink colors and helper functions stay the same)

export default function DashboardPage() {
  const { user } = useAuthStore()
  const {
    widgets: dashboardWidgets,
    layouts: storeLayouts,
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
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)

  const WIDGET_MINS: Record<string, { minW: number; minH: number }> = {
    weather:  { minW: 2, minH: 3 },
    calendar: { minW: 3, minH: 3 },
    todo:     { minW: 2, minH: 2 },
    schedule: { minW: 3, minH: 2 },
    minigame: { minW: 3, minH: 2 },
  }

  const clampLayout = (l: { i: string; x: number; y: number; w: number; h: number }, currentCols: number) => {
    const widgetId = dashboardWidgets.find(w => w.instanceId === l.i)?.widgetId
    const min = widgetId ? (WIDGET_MINS[widgetId] ?? { minW: 2, minH: 2 }) : { minW: 2, minH: 2 }
    
    const effectiveMinW = Math.min(min.minW, currentCols)
    // Auf schmalen Screens (1-2 Spalten) erzwingen wir volle Breite
    const w = currentCols <= 2 ? currentCols : Math.max(Math.min(l.w, currentCols), effectiveMinW)
    const x = currentCols <= 2 ? 0 : Math.min(l.x, Math.max(0, currentCols - w))
    
    return { ...l, x, minW: effectiveMinW, minH: min.minH, w, h: Math.max(l.h, min.minH) }
  }

  // useMemo ist extrem wichtig, damit das Grid nicht flackert oder sich verschluckt
  const responsiveLayouts = useMemo(() => {
    const lg = storeLayouts.map(l => ({ ...clampLayout(l, 12), static: !isAdmin }))
    return {
      lg,
      md: storeLayouts.map(l => clampLayout(l, 10)),
      sm: storeLayouts.map(l => clampLayout(l, 6)),
      xs: storeLayouts.map(l => clampLayout(l, 2)),
      xxs: storeLayouts.map(l => clampLayout(l, 1))
    }
  }, [storeLayouts, dashboardWidgets, isAdmin])

  const handleLayoutChange = (current: any, allLayouts: any) => {
    // Nur speichern, wenn wir im Desktop-Modus (lg) sind
    // react-grid-layout übergibt im allLayouts-Objekt alle Breakpoints
    if (allLayouts.lg) {
      updateLayouts(allLayouts.lg.map((l: any) => clampLayout(l, 12)))
    }
  }

  return (
    <div style={{ flex: 1, padding: '12px 12px 40px', overflowY: 'auto', minWidth: 0 }} ref={containerRef}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap', padding: '12px 16px 0' }}>
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

      <ResponsiveGridLayout
        className="layout"
        layouts={responsiveLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 2, xxs: 1 }}
        rowHeight={90}
        onLayoutChange={handleLayoutChange}
        onDragStop={saveToBackend}
        onResizeStop={saveToBackend}
        draggableHandle=".widget-drag-handle"
        isResizable={isAdmin}
        isDraggable={isAdmin}
        compactType="vertical"
        margin={[12, 12]}
        useCSSTransforms={true}
        measureBeforeMount={true} // Wichtig für korrektes initiales Mobile-Rendering
      >
        {dashboardWidgets.map((instance) => {
          const config = WIDGETS.find((w) => w.id === instance.widgetId)
          if (!config) return <div key={instance.instanceId} />
          if (!canSeeWidget(config.requiredRole, user?.role)) return <div key={instance.instanceId} />
          
          const isWeather = instance.widgetId === 'weather'
          
          return (
            <div key={instance.instanceId}>
              <WidgetShell
                onRemove={() => removeWidget(instance.instanceId)}
                variant={isWeather ? 'weather' : 'default'}
                title={isWeather ? undefined : config.name}
                isAdmin={isAdmin}
                isMobile={true} // Auf Mobile immer Touch-freundlichere UI
              >
                <config.component 
                  settings={instance.settings}
                  onSettingsChange={(s) => updateWidgetSettings(instance.instanceId, s)}
                />
              </WidgetShell>
            </div>
          )
        })}
      </ResponsiveGridLayout>

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
