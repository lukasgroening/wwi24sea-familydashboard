import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/authStore'

// useNavigate mocken
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderSidebar(isOpen = true, onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <Sidebar isOpen={isOpen} onClose={onClose} onInviteClick={vi.fn()} />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
    vi.clearAllMocks()
  })

  // Anzeige

  it('zeigt den App-Namen "Famly" an', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    renderSidebar()

    expect(screen.getByText(/Famly/)).toBeInTheDocument()
  })

  it('zeigt den Benutzernamen an', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    renderSidebar()

    expect(screen.getByText('Max')).toBeInTheDocument()
  })

  it('zeigt die Benutzerrolle an', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    renderSidebar()

    expect(screen.getByText('Nutzer')).toBeInTheDocument()
  })

  it('zeigt "Gast" wenn kein User eingeloggt ist', () => {
    renderSidebar()

    expect(screen.getByText('Gast')).toBeInTheDocument()
  })

  // navigation

  it('zeigt die Standard-Navigation (Dashboard, Kalender, Stundenplan)', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    renderSidebar()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Kalender')).toBeInTheDocument()
    expect(screen.getByText('Stundenplan')).toBeInTheDocument()
  })

  it('zeigt KEINE Admin-Links für normale Nutzer', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    renderSidebar()

    expect(screen.queryByText('Mitglieder')).not.toBeInTheDocument()
    expect(screen.queryByText('System')).not.toBeInTheDocument()
  })

  it('zeigt Admin-Links für Familien-Administrator', () => {
    useAuthStore.setState({
      user: { id: 2, username: 'Admin', role: 'Familien-Administrator' },
      token: 'abc',
    })
    renderSidebar()

    expect(screen.getByText('Mitglieder')).toBeInTheDocument()
    expect(screen.queryByText('System')).not.toBeInTheDocument()
  })

  it('zeigt alle Admin-Links für System-Administrator', () => {
    useAuthStore.setState({
      user: { id: 3, username: 'SysAdmin', role: 'System-Administrator' },
      token: 'abc',
    })
    renderSidebar()

    expect(screen.getByText('Mitglieder')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  // interactions

  it('ruft onClose auf wenn der Schließen-Button geklickt wird', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    const onClose = vi.fn()
    renderSidebar(true, onClose)

    const closeButton = screen.getByLabelText('Menü schließen')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('navigiert zu /login nach Logout', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    renderSidebar()

    const logoutButton = screen.getByTitle('Abmelden')
    fireEvent.click(logoutButton)

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('setzt den User auf null nach Logout', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'Max', role: 'Nutzer' },
      token: 'abc',
    })
    renderSidebar()

    const logoutButton = screen.getByTitle('Abmelden')
    fireEvent.click(logoutButton)

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })
})
