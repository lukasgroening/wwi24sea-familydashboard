import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  CalendarEvent,
  GoogleCalendarInfo,
  GCalEvent,
  GCalEventsResponse,
  GCalList,
} from './types'

/* ─── Google Identity Services types ─────────────────────────── */
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
const API_BASE = 'https://www.googleapis.com/calendar/v3'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

/* ─── Helper: convert Google event to our model ──────────────── */
function toCalendarEvent(
  ev: GCalEvent,
  calendarId: string,
  calendarColor: string,
  calendarName: string,
  editable: boolean,
): CalendarEvent {
  const startRaw = ev.start?.dateTime ?? ev.start?.date ?? ''
  const endRaw = ev.end?.dateTime ?? ev.end?.date ?? ''
  const allDay = !ev.start?.dateTime

  return {
    id: ev.id,
    title: ev.summary ?? '(Kein Titel)',
    description: ev.description,
    start: startRaw,
    end: endRaw,
    allDay,
    color: calendarColor,
    calendarId,
    calendarName,
    editable,
  }
}

/* ─── Hook ───────────────────────────────────────────────────── */
export function useGoogleCalendar() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null)

  /* ── Initialize token client ──────────────────────────────── */
  useEffect(() => {
    const initGIS = () => {
      if (!window.google?.accounts?.oauth2) {
        // GIS script not loaded yet, retry
        setTimeout(initGIS, 300)
        return
      }

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            setError(`Auth-Fehler: ${response.error}`)
            return
          }
          if (response.access_token) {
            setAccessToken(response.access_token)
            setIsSignedIn(true)
            setError(null)
          }
        },
      })
    }

    initGIS()
  }, [])

  /* ── Sign in ──────────────────────────────────────────────── */
  const signIn = useCallback(() => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken()
    } else {
      setError('Google Identity Services noch nicht geladen')
    }
  }, [])

  /* ── Sign out ─────────────────────────────────────────────── */
  const signOut = useCallback(() => {
    setAccessToken(null)
    setIsSignedIn(false)
    setCalendars([])
    setEvents([])
  }, [])

  /* ── API helper ───────────────────────────────────────────── */
  const apiFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      if (!accessToken) throw new Error('Nicht angemeldet')
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(options?.headers ?? {}),
        },
      })
      if (res.status === 401) {
        setIsSignedIn(false)
        setAccessToken(null)
        throw new Error('Token abgelaufen – bitte erneut anmelden')
      }
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`API-Fehler ${res.status}: ${body}`)
      }
      // DELETE returns 204 with no body
      if (res.status === 204) return null
      return res.json()
    },
    [accessToken],
  )

  /* ── Fetch calendar list ──────────────────────────────────── */
  const fetchCalendars = useCallback(async () => {
    try {
      const data: GCalList = await apiFetch(`${API_BASE}/users/me/calendarList`)
      const cals: GoogleCalendarInfo[] = data.items.map((c) => ({
        id: c.id,
        summary: c.summary,
        backgroundColor: c.backgroundColor,
        primary: c.primary,
      }))
      setCalendars(cals)
      return cals
    } catch (err) {
      setError((err as Error).message)
      return []
    }
  }, [apiFetch])

  /* ── Fetch events for a time range ────────────────────────── */
  const fetchEvents = useCallback(
    async (timeMin: Date, timeMax: Date) => {
      setIsLoading(true)
      setError(null)
      try {
        let cals = calendars
        if (cals.length === 0) {
          cals = await fetchCalendars()
        }

        const allEvents: CalendarEvent[] = []

        for (const cal of cals) {
          const params = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '250',
          })

          const data: GCalEventsResponse = await apiFetch(
            `${API_BASE}/calendars/${encodeURIComponent(cal.id)}/events?${params}`,
          )

          const mapped = (data.items ?? []).map((ev) =>
            toCalendarEvent(ev, cal.id, cal.backgroundColor, cal.summary, true),
          )
          allEvents.push(...mapped)
        }

        // Sort by start time
        allEvents.sort((a, b) => a.start.localeCompare(b.start))
        setEvents(allEvents)
        return allEvents
      } catch (err) {
        setError((err as Error).message)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [apiFetch, calendars, fetchCalendars],
  )

  /* ── Create event ─────────────────────────────────────────── */
  const createEvent = useCallback(
    async (
      calendarId: string,
      event: {
        summary: string
        description?: string
        start: { dateTime?: string; date?: string; timeZone?: string }
        end: { dateTime?: string; date?: string; timeZone?: string }
      },
    ) => {
      setError(null)
      try {
        const data = await apiFetch(
          `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
          { method: 'POST', body: JSON.stringify(event) },
        )
        return data
      } catch (err) {
        setError((err as Error).message)
        return null
      }
    },
    [apiFetch],
  )

  /* ── Update event ─────────────────────────────────────────── */
  const updateEvent = useCallback(
    async (
      calendarId: string,
      eventId: string,
      event: {
        summary?: string
        description?: string
        start?: { dateTime?: string; date?: string; timeZone?: string }
        end?: { dateTime?: string; date?: string; timeZone?: string }
      },
    ) => {
      setError(null)
      try {
        const data = await apiFetch(
          `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
          { method: 'PATCH', body: JSON.stringify(event) },
        )
        return data
      } catch (err) {
        setError((err as Error).message)
        return null
      }
    },
    [apiFetch],
  )

  /* ── Delete event ─────────────────────────────────────────── */
  const deleteEvent = useCallback(
    async (calendarId: string, eventId: string) => {
      setError(null)
      try {
        await apiFetch(
          `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
          { method: 'DELETE' },
        )
        return true
      } catch (err) {
        setError((err as Error).message)
        return false
      }
    },
    [apiFetch],
  )

  return {
    isSignedIn,
    isLoading,
    error,
    calendars,
    events,
    signIn,
    signOut,
    fetchCalendars,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
