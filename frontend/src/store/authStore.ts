import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import * as authApi from '@/api/auth'
import { resetAuthFailureState } from '@/api/client'
import type { User } from '@/types'

export type AuthState = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean

  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (token: string) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

const storage: StateStorage =
  typeof window !== 'undefined'
    ? window.localStorage
    : {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      }

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        resetAuthFailureState()
        set({
          user,
          accessToken,
          isAuthenticated: true,
        })
      },

      setAccessToken: (token) => set({ accessToken: token }),

      logout: async () => {
        set({ user: null, accessToken: null, isAuthenticated: false })
        try {
          await authApi.logout()
        } catch {
          // Silent: user is already logged out locally.
        }
      },

      initialize: async () => {
        try {
          if (!get().accessToken) {
            const tokens = await authApi.refreshToken()
            if (tokens.accessToken) {
              get().setAccessToken(tokens.accessToken)
            }
          }

          const user = await authApi.getMe()
          const token = get().accessToken
          if (token) {
            get().setAuth(user, token)
          } else {
            set({ user, isAuthenticated: true })
          }
        } catch {
          // Silent: remain logged out.
        }
      },
    }),
    {
      name: 'shopgo-auth',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ user: state.user }),
      merge: (persisted, current) => {
        const p = persisted as { user?: User | null } | undefined
        return {
          ...current,
          user: p?.user ?? null,
        }
      },
    },
  ),
)

export default useAuthStore

