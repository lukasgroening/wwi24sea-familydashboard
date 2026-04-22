import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import CalendarWidget from '../widgets/CalendarWidget'

// api mocken
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

// Navigation mocken
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import api from '../lib/api'
const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> }

function renderCalendar() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CalendarWidget />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CalendarWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt die Wochentag-Header (Mo, Di, Mi, Do, Fr, Sa, So)', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    await waitFor(() => {
      expect(screen.getByText('Mo')).toBeInTheDocument()
      expect(screen.getByText('Di')).toBeInTheDocument()
      expect(screen.getByText('Mi')).toBeInTheDocument()
      expect(screen.getByText('Do')).toBeInTheDocument()
      expect(screen.getByText('Fr')).toBeInTheDocument()
      expect(screen.getByText('Sa')).toBeInTheDocument()
      expect(screen.getByText('So')).toBeInTheDocument()
    })
  })

  it('zeigt den aktuellen Monat und Jahr im Header', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    const now = new Date()
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
    ]
    const expectedText = `${monthNames[now.getMonth()]} ${now.getFullYear()}`

    await waitFor(() => {
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })
  })

  it('zeigt "Nächste Termine" Überschrift', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    await waitFor(() => {
      expect(screen.getByText('Nächste Termine')).toBeInTheDocument()
    })
  })

  it('zeigt "Keine bevorstehenden Termine." wenn keine Events da sind', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    await waitFor(() => {
      expect(screen.getByText('Keine bevorstehenden Termine.')).toBeInTheDocument()
    })
  })

  it('zeigt kommende Events an', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2)
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Zahnarzt',
          start_time: futureDate.toISOString(),
          end_time: new Date(futureDate.getTime() + 3600000).toISOString(),
          is_external: false,
        },
      ],
    })

    renderCalendar()

    await waitFor(() => {
      expect(screen.getByText('Zahnarzt')).toBeInTheDocument()
    })
  })

  it('zeigt den "Alle anzeigen" Button', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    await waitFor(() => {
      expect(screen.getByText('Alle anzeigen →')).toBeInTheDocument()
    })
  })

  it('navigiert zu /calendar wenn "Alle anzeigen" geklickt wird', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    await waitFor(() => {
      expect(screen.getByText('Alle anzeigen →')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Alle anzeigen →'))

    expect(mockNavigate).toHaveBeenCalledWith('/calendar')
  })

  it('kann zum nächsten Monat navigieren', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    const now = new Date()
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
    ]

    await waitFor(() => {
      expect(screen.getByText('›')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('›'))

    const nextMonth = (now.getMonth() + 1) % 12
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
    const expectedText = `${monthNames[nextMonth]} ${nextYear}`

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('kann zum vorherigen Monat navigieren', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderCalendar()

    const now = new Date()
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
    ]

    await waitFor(() => {
      expect(screen.getByText('‹')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('‹'))

    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const expectedText = `${monthNames[prevMonth]} ${prevYear}`

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('zeigt eine Fehlermeldung wenn die API fehlschlägt', async () => {
    mockApi.get.mockRejectedValue(new Error('Netzwerkfehler'))

    renderCalendar()

    await waitFor(() => {
      expect(screen.getByText('Termine konnten nicht geladen werden.')).toBeInTheDocument()
    })
  })
})
