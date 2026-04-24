import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardWidgetInstance, Role } from '../types'
import api from '../lib/api'

interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

interface DashboardState {
  widgets: DashboardWidgetInstance[]
  layouts: LayoutItem[]
  addWidget: (widgetId: string, settings?: Record<string, unknown>) => void
  removeWidget: (instanceId: string) => void
  updateLayouts: (layouts: LayoutItem[]) => void
  updateWidgetSettings: (instanceId: string, settings: Record<string, unknown>) => void
  hasWidget: (widgetId: string) => boolean
  loadFromBackend: () => Promise<void>
  saveToBackend: () => Promise<void>
}

function isAdminRole(role: Role | undefined): boolean {
  return role === 'Familien-Administrator' || role === 'System-Administrator'
}

const DEFAULT_LAYOUTS: Record<string, { w: number; h: number; minW: number; minH: number }> = {
  calendar:  { w: 6, h: 5, minW: 4, minH: 4 },
  weather:   { w: 3, h: 4, minW: 3, minH: 4 },
  todo:      { w: 5, h: 3, minW: 3, minH: 3 },
  schedule:  { w: 8, h: 3, minW: 4, minH: 3 },
  minigame:  { w: 5, h: 4, minW: 4, minH: 3 },
}

const DEFAULT_WEATHER_SETTINGS: Record<string, unknown> = {
  locationName: 'Frankfurt am Main',
  locationLat: 50.1155,
  locationLon: 8.68417,
  locationCountry: 'DE',
  temperatureUnit: 'celsius',
  showForecast: true,
  showMeteogram: true,
  forecastDays: 7,
}

const DEFAULT_CALENDAR_SETTINGS: Record<string, unknown> = {
  defaultView: 'month',
  showWeekends: true,
  weekStartHour: 6,
  weekEndHour: 22,
}

function clampLayouts(layouts: LayoutItem[], widgets: DashboardWidgetInstance[]): LayoutItem[] {
  return layouts.map((l) => {
    const widgetId = widgets.find(w => w.instanceId === l.i)?.widgetId
    const min = widgetId ? DEFAULT_LAYOUTS[widgetId] : undefined
    return {
      ...l,
      minW: min?.minW ?? 2,
      minH: min?.minH ?? 2,
      w: Math.max(l.w, min?.minW ?? 2),
      h: Math.max(l.h, min?.minH ?? 2),
    }
  })
}

function getDefaultSettings(widgetId: string): Record<string, unknown> {
  if (widgetId === 'weather') return { ...DEFAULT_WEATHER_SETTINGS }
  if (widgetId === 'calendar') return { ...DEFAULT_CALENDAR_SETTINGS }
  return {}
}

const defaultWidgets: DashboardWidgetInstance[] = [
  { instanceId: 'weather-default', widgetId: 'weather', colSpan: 3, rowSpan: 4, settings: { ...DEFAULT_WEATHER_SETTINGS } },
  { instanceId: 'calendar-default', widgetId: 'calendar', colSpan: 5, rowSpan: 4, settings: { ...DEFAULT_CALENDAR_SETTINGS } },
  { instanceId: 'todo-default', widgetId: 'todo', colSpan: 4, rowSpan: 2, settings: {} },
  { instanceId: 'schedule-default', widgetId: 'schedule', colSpan: 7, rowSpan: 2, settings: {} },
]

const defaultLayouts: LayoutItem[] = [
  { i: 'weather-default',   x: 0, y: 0, w: 3, h: 4, minW: 3, minH: 4 },
  { i: 'calendar-default',  x: 3, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
  { i: 'todo-default',      x: 9, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
  { i: 'schedule-default',  x: 0, y: 4, w: 8, h: 3, minW: 4, minH: 3 },
]

/** Wandelt den Store-State in das Backend-Format um */
function stateToBackendPayload(
  widgets: DashboardWidgetInstance[],
  layouts: LayoutItem[],
) {
  return widgets.map((w) => {
    const layout = layouts.find((l) => l.i === w.instanceId)
    return {
      type: w.widgetId,
      x: layout?.x ?? 0,
      y: layout?.y ?? 0,
      w: layout?.w ?? 4,
      h: layout?.h ?? 2,
      settings: w.settings,
    }
  })
}

/** Wandelt Backend-Antwort in Store-State um */
function backendToState(data: Array<{ id: number; type: string; x: number; y: number; w: number; h: number; settings: Record<string, unknown> }>) {
  const widgets: DashboardWidgetInstance[] = data.map((item) => ({
    instanceId: `${item.type}-${item.id}`,
    widgetId: item.type,
    colSpan: item.w,
    rowSpan: item.h,
    settings: item.settings ?? getDefaultSettings(item.type),
  }))
  const layouts: LayoutItem[] = data.map((item) => {
    const defaults = DEFAULT_LAYOUTS[item.type]
    return {
      i: `${item.type}-${item.id}`,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: defaults?.minW ?? 2,
      minH: defaults?.minH ?? 2,
    }
  })
  return { widgets, layouts: clampLayouts(layouts, widgets) }
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: [], // Startet leer
      layouts: [], // Startet leer

      loadFromBackend: async () => {
        try {
          const { data } = await api.get('/api/dashboard/widgets')
          if (data && data.length > 0) {
            const { widgets, layouts } = backendToState(data)
            set({ widgets, layouts })
            // Falls Clamping Größen korrigiert hat → direkt zurück speichern
            await get().saveToBackend()
          } else {
            // Backend leer -> Jetzt erst Defaults setzen und speichern
            const user = (await import('./authStore')).useAuthStore.getState().user
            if (isAdminRole(user?.role)) {
              set({ widgets: defaultWidgets, layouts: defaultLayouts })
              await get().saveToBackend()
            }
          }
        } catch {
          // Bei Fehler (z.B. Offline) Fallback auf Defaults, falls gar nichts da ist
          if (get().widgets.length === 0) {
            set({ widgets: defaultWidgets, layouts: defaultLayouts })
          }
        }
      },

      saveToBackend: async () => {
        const user = (await import('./authStore')).useAuthStore.getState().user
        if (!isAdminRole(user?.role)) return

        try {
          const { widgets, layouts } = get()
          const payload = stateToBackendPayload(widgets, layouts)
          await api.put('/api/dashboard/widgets', payload)
        } catch {
          // Fehler beim Speichern: still ignorieren, localStorage bleibt als Fallback
        }
      },

      addWidget: (widgetId, settings) => {
        const size = DEFAULT_LAYOUTS[widgetId] ?? { w: 4, h: 2, minW: 2, minH: 2 }
        const instanceId = `${widgetId}-${Date.now()}`
        const instance: DashboardWidgetInstance = {
          instanceId,
          widgetId,
          colSpan: size.w,
          rowSpan: size.h,
          settings: settings ?? getDefaultSettings(widgetId),
        }
        const newLayout: LayoutItem = {
          i: instanceId,
          x: 0,
          y: Infinity,
          w: size.w,
          h: size.h,
          minW: size.minW,
          minH: size.minH,
        }
        set((state) => ({
          widgets: [...state.widgets, instance],
          layouts: [...state.layouts, newLayout],
        }))
        get().saveToBackend()
      },

      removeWidget: (instanceId) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.instanceId !== instanceId),
          layouts: state.layouts.filter((l) => l.i !== instanceId),
        }))
        get().saveToBackend()
      },

      updateLayouts: (layouts) => {
        set({ layouts })
        get().saveToBackend()
      },

      updateWidgetSettings: (instanceId, settings) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.instanceId === instanceId ? { ...w, settings: { ...w.settings, ...settings } } : w,
          ),
        }))
        get().saveToBackend()
      },

      hasWidget: (widgetId) => {
        return get().widgets.some((w) => w.widgetId === widgetId)
      },
    }),
    {
      name: 'dashboard',
      version: 2,
      partialize: (state) => ({ widgets: state.widgets, layouts: state.layouts }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.layouts = clampLayouts(state.layouts, state.widgets)
        }
      },
    },
  ),
)
