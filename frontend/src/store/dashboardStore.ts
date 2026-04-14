import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'
import type { DashboardWidgetInstance } from '../types'

interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

interface BackendWidget {
  id: number
  user_id: number
  type: string
  x: number
  y: number
  w: number
  h: number
  settings: Record<string, unknown>
}

interface DashboardState {
  widgets: DashboardWidgetInstance[]
  layouts: LayoutItem[]
  syncing: boolean
  addWidget: (widgetId: string, settings?: Record<string, unknown>) => void
  removeWidget: (instanceId: string) => void
  updateLayouts: (layouts: LayoutItem[]) => void
  updateWidgetSettings: (instanceId: string, settings: Record<string, unknown>) => void
  hasWidget: (widgetId: string) => boolean
  loadFromBackend: () => Promise<void>
  syncToBackend: () => Promise<void>
}

/** Default grid positions per widget type */
const DEFAULT_LAYOUTS: Record<string, { w: number; h: number }> = {
  calendar: { w: 5, h: 4 },
  weather: { w: 3, h: 4 },
  todo: { w: 4, h: 2 },
  schedule: { w: 7, h: 2 },
  notes: { w: 4, h: 3 },
}

/** Default settings for the weather widget */
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

/** Default settings for the calendar widget */
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

/** Backend - Frontend mapping */

function backendToFrontend(backendWidgets: BackendWidget[]): {
  widgets: DashboardWidgetInstance[]
  layouts: LayoutItem[]
} {
  const widgets: DashboardWidgetInstance[] = []
  const layouts: LayoutItem[] = []

  for (const bw of backendWidgets) {
    const instanceId = `${bw.type}-${bw.id}`
    widgets.push({
      instanceId,
      widgetId: bw.type,
      colSpan: bw.w,
      rowSpan: bw.h,
      settings: bw.settings ?? getDefaultSettings(bw.type),
    })
    layouts.push({
      i: instanceId,
      x: bw.x,
      y: bw.y,
      w: bw.w,
      h: bw.h,
    })
  }

  return { widgets, layouts }
}

function frontendToBackend(
  widgets: DashboardWidgetInstance[],
  layouts: LayoutItem[],
): Array<{ type: string; x: number; y: number; w: number; h: number; settings: Record<string, unknown> }> {
  return widgets.map((widget) => {
    const layout = layouts.find((l) => l.i === widget.instanceId)
    return {
      type: widget.widgetId,
      x: layout?.x ?? 0,
      y: layout?.y ?? 0,
      w: layout?.w ?? widget.colSpan,
      h: layout?.h ?? widget.rowSpan,
      settings: widget.settings,
    }
  })
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null
let isLoadingFromBackend = false

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      layouts: defaultLayouts,
      syncing: false,

      loadFromBackend: async () => {
        isLoadingFromBackend = true
        try {
          const { data } = await api.get<BackendWidget[]>('/api/dashboard/widgets')
          if (data && data.length > 0) {
            const { widgets, layouts } = backendToFrontend(data)
            set({ widgets, layouts })
            console.log('[Dashboard] Layout vom Backend geladen:', data.length, 'Widgets')
          } else {
            console.log('[Dashboard] Backend leer → lade lokalen State hoch')
            const state = get()
            const payload = frontendToBackend(state.widgets, state.layouts)
            await api.put('/api/dashboard/widgets', payload)
          }
        } catch (err) {
          console.warn('[Dashboard] Backend nicht erreichbar, verwende lokalen State:', err)
        } finally {
          setTimeout(() => { isLoadingFromBackend = false }, 1000)
        }
      },

      syncToBackend: async () => {
        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(async () => {
          const state = get()
          const payload = frontendToBackend(state.widgets, state.layouts)
          try {
            await api.put('/api/dashboard/widgets', payload)
            console.log('[Dashboard] Layout ans Backend synchronisiert')
          } catch (err) {
            console.warn('[Dashboard] Sync fehlgeschlagen:', err)
          }
        }, 800)
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
        get().syncToBackend()
      },

      removeWidget: (instanceId) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.instanceId !== instanceId),
          layouts: state.layouts.filter((l) => l.i !== instanceId),
        }))
        get().syncToBackend()
      },

      updateLayouts: (layouts) => {
        set({ layouts })
        if (!isLoadingFromBackend) {
          get().syncToBackend()
        }
      },

      updateWidgetSettings: (instanceId, settings) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.instanceId === instanceId ? { ...w, settings: { ...w.settings, ...settings } } : w,
          ),
        }))
        get().syncToBackend()
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
