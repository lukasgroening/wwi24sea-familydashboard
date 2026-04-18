import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TodoWidget from '../widgets/TodoWidget'

// api mocken
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

// Importiere mock api von oben
import api from '../lib/api'
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('TodoWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt "Lade Todos..." während die Daten geladen werden', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}))

    render(<TodoWidget />)

    expect(screen.getByText('Lade Todos...')).toBeInTheDocument()
  })

  it('zeigt "Keine Todos vorhanden" wenn die Liste leer ist', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    render(<TodoWidget />)

    await waitFor(() => {
      expect(screen.getByText('Keine Todos vorhanden')).toBeInTheDocument()
    })
  })

  it('zeigt die geladenen Todos an', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        { id: 1, title: 'Einkaufen gehen', is_completed: false, tag: null },
        { id: 2, title: 'Hausaufgaben machen', is_completed: true, tag: 'Kinder' },
      ],
    })

    render(<TodoWidget />)

    await waitFor(() => {
      expect(screen.getByText('Einkaufen gehen')).toBeInTheDocument()
      expect(screen.getByText('Hausaufgaben machen')).toBeInTheDocument()
    })
  })

  it('zeigt Tags neben den Todos an', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        { id: 1, title: 'Zimmer aufräumen', is_completed: false, tag: 'Kinder' },
      ],
    })

    render(<TodoWidget />)

    await waitFor(() => {
      const kinderElements = screen.getAllByText('Kinder')
      expect(kinderElements.length).toBeGreaterThanOrEqual(3)
      expect(screen.getByText('Zimmer aufräumen')).toBeInTheDocument()
    })
  })

  it('kann ein neues Todo hinzufügen', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    mockApi.post.mockResolvedValue({
      data: { id: 3, title: 'Arzt anrufen', is_completed: false, tag: null },
    })

    render(<TodoWidget />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Neue Aufgabe...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Neue Aufgabe...')
    fireEvent.change(input, { target: { value: 'Arzt anrufen' } })

    const addButton = screen.getByTitle('Todo hinzufügen')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/api/todos/', {
        title: 'Arzt anrufen',
        tag: null,
      })
    })
  })

  it('kann ein Todo per Enter-Taste hinzufügen', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    mockApi.post.mockResolvedValue({
      data: { id: 4, title: 'Wäsche waschen', is_completed: false, tag: null },
    })

    render(<TodoWidget />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Neue Aufgabe...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Neue Aufgabe...')
    fireEvent.change(input, { target: { value: 'Wäsche waschen' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalled()
    })
  })

  it('kann ein Todo als erledigt markieren (toggle)', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        { id: 1, title: 'Sport machen', is_completed: false, tag: null },
      ],
    })
    mockApi.patch.mockResolvedValue({ data: {} })

    render(<TodoWidget />)

    await waitFor(() => {
      expect(screen.getByText('Sport machen')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Sport machen'))

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith('/api/todos/1', {
        is_completed: true,
      })
    })
  })

  it('deaktiviert den Hinzufügen-Button wenn das Eingabefeld leer ist', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    render(<TodoWidget />)

    await waitFor(() => {
      expect(screen.getByTitle('Todo hinzufügen')).toBeInTheDocument()
    })

    const addButton = screen.getByTitle('Todo hinzufügen') as HTMLButtonElement
    expect(addButton.disabled).toBe(true)
  })

  it('zeigt die Tag-Auswahl-Buttons (Eltern, Au-Pair, Kinder)', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    render(<TodoWidget />)

    await waitFor(() => {
      expect(screen.getByText('Eltern')).toBeInTheDocument()
      expect(screen.getByText('Au-Pair')).toBeInTheDocument()
      expect(screen.getByText('Kinder')).toBeInTheDocument()
    })
  })
})
