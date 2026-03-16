import type { WidgetConfig } from '../types'
import WeatherWidget from './WeatherWidget'
import TodoWidget from './TodoWidget'
import CalendarWidget from './CalendarWidget'
import ScheduleWidget from './ScheduleWidget'

/**
 * WIDGET REGISTRY
 * ---------------
 * Um ein neues Widget hinzuzufügen:
 * 1. Neuen Ordner unter src/widgets/MeinWidget/ erstellen
 * 2. index.tsx mit einer React-Komponente erstellen (siehe WidgetProps in types/index.ts)
 * 3. Widget hier unten in die Liste eintragen — fertig!
 */
export const WIDGETS: WidgetConfig[] = [
  {
    id: 'weather',
    name: 'Wetter',
    description: 'Aktuelle Wetterinfos für einen Standort',
    component: WeatherWidget,
    defaultSize: 'small',
    requiredRole: 'Nutzer',
  },
  {
    id: 'todo',
    name: 'To-Do Liste',
    description: 'Gemeinsame Aufgabenliste der Familie',
    component: TodoWidget,
    defaultSize: 'medium',
    requiredRole: 'Nutzer',
  },
  {
    id: 'calendar',
    name: 'Familienkalender',
    description: 'Termine und Events der Familie',
    component: CalendarWidget,
    defaultSize: 'large',
    requiredRole: 'Nutzer',
  },
  {
    id: 'schedule',
    name: 'Stundenplan',
    description: 'Schulplan für Kinder und Au Pairs',
    component: ScheduleWidget,
    defaultSize: 'medium',
    requiredRole: 'Nutzer',
  },
]
