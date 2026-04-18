import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null })
    localStorage.clear()
  })

  it('sollte initial keinen User und kein Token haben', () => {
    const state = useAuthStore.getState()

    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated()).toBe(false)
  })

  it('sollte nach Login User und Token setzen', () => {
    const store = useAuthStore.getState()
    store.login({ id: 1, username: 'Max', role: 'Nutzer' }, 'mein-token-123')

    const state = useAuthStore.getState()
    expect(state.user?.username).toBe('Max')
    expect(state.user?.role).toBe('Nutzer')
    expect(state.token).toBe('mein-token-123')
    expect(state.isAuthenticated()).toBe(true)
  })

  it('sollte das Token auch im localStorage speichern', () => {
    const store = useAuthStore.getState()
    store.login({ id: 1, username: 'Max', role: 'Nutzer' }, 'mein-token-123')

    expect(localStorage.getItem('token')).toBe('mein-token-123')
  })

  it('sollte nach Logout alles zurücksetzen', () => {
    const store = useAuthStore.getState()
    store.login({ id: 1, username: 'Max', role: 'Nutzer' }, 'mein-token-123')
    store.logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated()).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('sollte verschiedene Rollen korrekt speichern', () => {
    const store = useAuthStore.getState()

    store.login({ id: 2, username: 'Admin', role: 'Familien-Administrator' }, 'admin-token')
    expect(useAuthStore.getState().user?.role).toBe('Familien-Administrator')

    store.login({ id: 3, username: 'SysAdmin', role: 'System-Administrator' }, 'sys-token')
    expect(useAuthStore.getState().user?.role).toBe('System-Administrator')
  })
})
