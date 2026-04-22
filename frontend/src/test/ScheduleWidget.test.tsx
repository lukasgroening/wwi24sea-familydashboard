import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ScheduleWidget from '../widgets/ScheduleWidget'

// api mocken
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

import api from '../lib/api'
const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> }

function renderScheduleWidget() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ScheduleWidget />
    </QueryClientProvider>
  )
}

describe('ScheduleWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt "Lade Stundenplan…" während geladen wird', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}))

    renderScheduleWidget()

    expect(screen.getByText('Lade Stundenplan…')).toBeInTheDocument()
  })

  it('zeigt "Kein Unterricht" wenn keine Einträge vorhanden sind', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderScheduleWidget()

    await waitFor(() => {
      expect(screen.getByText('Kein Unterricht')).toBeInTheDocument()
    })
  })

  it('zeigt die Wochentag-Buttons (Mo, Di, Mi, Do, Fr)', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderScheduleWidget()

    await waitFor(() => {
      expect(screen.getByText('Mo')).toBeInTheDocument()
      expect(screen.getByText('Di')).toBeInTheDocument()
      expect(screen.getByText('Mi')).toBeInTheDocument()
      expect(screen.getByText('Do')).toBeInTheDocument()
      expect(screen.getByText('Fr')).toBeInTheDocument()
    })
  })

  it('zeigt Unterrichtseinträge für den aktiven Tag', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: 1,
          subject: 'Mathematik',
          day_of_week: 'Montag',
          start_time: '08:00:00',
          end_time: '09:30:00',
          room: 'A101',
        },
        {
          id: 2,
          subject: 'Deutsch',
          day_of_week: 'Montag',
          start_time: '09:45:00',
          end_time: '11:15:00',
          room: null,
        },
        {
          id: 3,
          subject: 'Sport',
          day_of_week: 'Dienstag',
          start_time: '10:00:00',
          end_time: '11:30:00',
          room: 'Halle',
        },
      ],
    })

    renderScheduleWidget()

    // Klick auf "Mo" um Montag anzuzeigen
    await waitFor(() => {
      expect(screen.getByText('Mo')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Mo'))

    await waitFor(() => {
      expect(screen.getByText('Mathematik')).toBeInTheDocument()
      expect(screen.getByText('Deutsch')).toBeInTheDocument()
      expect(screen.getByText('A101')).toBeInTheDocument()
    })

    // Sport ist am Dienstag -> nicht sichtbar am Montag
    expect(screen.queryByText('Sport')).not.toBeInTheDocument()
  })

  it('wechselt den Tag wenn man auf einen anderen Button klickt', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: 1,
          subject: 'Mathematik',
          day_of_week: 'Montag',
          start_time: '08:00:00',
          end_time: '09:30:00',
          room: null,
        },
        {
          id: 2,
          subject: 'Kunst',
          day_of_week: 'Dienstag',
          start_time: '10:00:00',
          end_time: '11:30:00',
          room: 'B205',
        },
      ],
    })

    renderScheduleWidget()

    // Zu Dienstag wechseln
    await waitFor(() => {
      expect(screen.getByText('Di')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Di'))

    await waitFor(() => {
      expect(screen.getByText('Kunst')).toBeInTheDocument()
      expect(screen.getByText('B205')).toBeInTheDocument()
    })

    // Mathe (am Montag) sollte nicht mehr sichtbar sein
    expect(screen.queryByText('Mathematik')).not.toBeInTheDocument()
  })

  it('zeigt Uhrzeiten im richtigen Format an', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: 1,
          subject: 'Englisch',
          day_of_week: 'Montag',
          start_time: '14:00:00',
          end_time: '15:30:00',
          room: null,
        },
      ],
    })

    renderScheduleWidget()

    // Zu Montag wechseln
    await waitFor(() => {
      expect(screen.getByText('Mo')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Mo'))

    await waitFor(() => {
      // formatierung zeiten
      expect(screen.getByText('14:00 – 15:30')).toBeInTheDocument()
    })
  })

  it('zeigt eine Fehlermeldung wenn die API fehlschlägt', async () => {
    mockApi.get.mockRejectedValue(new Error('Netzwerkfehler'))

    renderScheduleWidget()

    await waitFor(() => {
      expect(screen.getByText('Stundenplan konnte nicht geladen werden.')).toBeInTheDocument()
    })
  })

  it('sortiert Einträge nach Startzeit', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: 2,
          subject: 'Physik',
          day_of_week: 'Montag',
          start_time: '10:00:00',
          end_time: '11:30:00',
          room: null,
        },
        {
          id: 1,
          subject: 'Mathe',
          day_of_week: 'Montag',
          start_time: '08:00:00',
          end_time: '09:30:00',
          room: null,
        },
      ],
    })

    renderScheduleWidget()

    await waitFor(() => {
      expect(screen.getByText('Mo')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Mo'))

    await waitFor(() => {
      const subjects = screen.getAllByText(/Mathe|Physik/)
      // Mathe (um 08:00) sollte vor Physik (um 10:00) stehen
      expect(subjects[0].textContent).toBe('Mathe')
      expect(subjects[1].textContent).toBe('Physik')
    })
  })
})
