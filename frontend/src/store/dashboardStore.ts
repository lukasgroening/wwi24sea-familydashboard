import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardWidgetInstance } from '../types'
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

const DEFAULT_LAYOUTS: Record<string, { w: number; h: number }> = {
  calendar: { w: 5, h: 4 },
  weather: { w: 3, h: 4 },
  todo: { w: 4, h: 2 },
  schedule: { w: 7, h: 2 },
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
  { i: 'weather-default', x: 0, y: 0, w: 3, h: 4 },
  { i: 'calendar-default', x: 3, y: 0, w: 5, h: 4 },
  { i: 'todo-default', x: 8, y: 0, w: 4, h: 2 },
  { i: 'schedule-default', x: 0, y: 4, w: 7, h: 2 },
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
  const layouts: LayoutItem[] = data.map((item) => ({
    i: `${item.type}-${item.id}`,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }))
  return { widgets, layouts }
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      layouts: defaultLayouts,

      loadFromBackend: async () => {
        try {
          const { data } = await api.get('/api/dashboard/widgets')
          if (data && data.length > 0) {
            const { widgets, layouts } = backendToState(data)
            set({ widgets, layouts })
          }
          // Falls leer: lokales Default-Layout behalten
        } catch {
          // Backend nicht erreichbar: lokales Layout behalten
        }
      },

      saveToBackend: async () => {
        try {
          const { widgets, layouts } = get()
          const payload = stateToBackendPayload(widgets, layouts)
          await api.put('/api/dashboard/widgets', payload)
        } catch {
          // Fehler beim Speichern: still ignorieren, localStorage bleibt als Fallback
        }
      },

      addWidget: (widgetId, settings) => {
        const size = DEFAULT_LAYOUTS[widgetId] ?? { w: 4, h: 2 }
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
      partialize: (state) => ({ widgets: state.widgets, layouts: state.layouts }),
    },
  ),
)
