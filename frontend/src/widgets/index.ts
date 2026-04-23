import type { WidgetConfig } from '../types'
import WeatherWidget from './WeatherWidget'
import TodoWidget from './TodoWidget'
import CalendarWidget from './CalendarWidget'
import ScheduleWidget from './ScheduleWidget'
import MiniGameWidget from './MiniGameWidget'
import NoteWidget from './NoteWidget'

export const WIDGETS: WidgetConfig[] = [
  {
    id: 'weather',
    name: 'Wetter',
    description: 'Aktuelle Vorhersage für deinen Standort',
    component: WeatherWidget,
    defaultSize: 'medium',
    requiredRole: 'Nutzer',
  },
  {
    id: 'calendar',
    name: 'Kalender',
    description: 'Nächste Termine und Familien-Events',
    component: CalendarWidget,
    defaultSize: 'medium',
    requiredRole: 'Nutzer',
  },
  {
    id: 'todo',
    name: 'To-Do Liste',
    description: 'Aufgaben gemeinsam planen und erledigen',
    component: TodoWidget,
    defaultSize: 'medium',
    requiredRole: 'Nutzer',
  },
  {
    id: 'schedule',
    name: 'Stundenplan',
    description: 'Wochenübersicht über alle Termine',
    component: ScheduleWidget,
    defaultSize: 'large',
    requiredRole: 'Nutzer',
  },
  {
    id: 'minigame',
    name: 'Famly Runner',
    description: 'Endless-Runner-Spiel mit Familien-Highscore',
    component: MiniGameWidget,
    defaultSize: 'large',
    requiredRole: 'Nutzer',
  },
  {
    id: 'notes',
    name: 'Notizen',
    description: 'Wichtige Gedanken und Familien-Memos',
    component: NoteWidget,
    defaultSize: 'medium',
    requiredRole: 'Nutzer',
  },
]
