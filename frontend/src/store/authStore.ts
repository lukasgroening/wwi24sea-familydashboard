import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },

      isAuthenticated: () => get().token !== null,
    }),
    {
      name: 'auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
