export type ViewMode = 'month' | 'week'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: string   // ISO datetime
  end: string     // ISO datetime
  allDay?: boolean
  color: string
  calendarId: string
  calendarName?: string
  editable: boolean  // true for own events, false for read-only imported
}

export interface GoogleCalendarInfo {
  id: string
  summary: string
  backgroundColor: string
  primary?: boolean
}

/** Shape returned by Google Calendar API v3 */
export interface GCalEvent {
  id: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  colorId?: string
  htmlLink?: string
}

export interface GCalList {
  items: Array<{
    id: string
    summary: string
    backgroundColor: string
    primary?: boolean
    accessRole: string
  }>
}

export interface GCalEventsResponse {
  items: GCalEvent[]
  nextPageToken?: string
}

/** Event form data for create/edit */
export interface EventFormData {
  title: string
  description: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:mm
  endTime: string    // HH:mm
  allDay: boolean
  calendarId: string
  color: string
}

export const EVENT_COLORS = [
  '#7c9a7e', // sage
  '#658067', // dark sage
  '#8eae90', // light sage
  '#a8c4a8', // mint
  '#c4a882', // warm
  '#9e9e96', // stone
  '#7a8fa6', // blue-grey
  '#a67a7a', // dusty rose
] as const
