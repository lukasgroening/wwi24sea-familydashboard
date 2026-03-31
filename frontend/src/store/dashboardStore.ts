import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardWidgetInstance } from '../types'

/** react-grid-layout Layout item */
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
}

/** Default grid positions per widget type */
const DEFAULT_LAYOUTS: Record<string, { w: number; h: number }> = {
  calendar: { w: 5, h: 4 },
  weather: { w: 3, h: 4 },
  todo: { w: 4, h: 2 },
  schedule: { w: 7, h: 2 },
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

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      layouts: defaultLayouts,

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
        // Place new widget at the bottom (y = Infinity lets react-grid-layout auto-place it)
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
      },

      removeWidget: (instanceId) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.instanceId !== instanceId),
          layouts: state.layouts.filter((l) => l.i !== instanceId),
        }))
      },

      updateLayouts: (layouts) => {
        set({ layouts })
      },

      updateWidgetSettings: (instanceId, settings) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.instanceId === instanceId ? { ...w, settings: { ...w.settings, ...settings } } : w,
          ),
        }))
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
