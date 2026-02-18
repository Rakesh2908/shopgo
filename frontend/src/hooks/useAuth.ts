import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import * as authApi from '@/api/auth'
import { mergeGuestCart } from '@/api/cart'
import type { CartItemRequest } from '@/types'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'

/**
 * Login with email/password. On success: set auth, merge guest cart, show toast.
 */
export function useLogin() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (tokens) => {
      setAccessToken(tokens.accessToken)
      const user = await authApi.getMe()
      setAuth(user, tokens.accessToken)

      const guestItems = useCartStore.getState().items
      if (guestItems.length > 0) {
        const toMerge: CartItemRequest[] = guestItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        }))
        await mergeGuestCart(toMerge)
        useCartStore.getState().clearOptimistic()
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
      toast.success('Welcome back!')
    },
  })
}

/**
 * Register a new user. On success: auto-login (same flow as useLogin).
 */
export function useRegister() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async (_user, variables) => {
      const tokens = await authApi.login({
        email: variables.email,
        password: variables.password,
      })
      setAccessToken(tokens.accessToken)
      const user = await authApi.getMe()
      setAuth(user, tokens.accessToken)

      const guestItems = useCartStore.getState().items
      if (guestItems.length > 0) {
        const toMerge: CartItemRequest[] = guestItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        }))
        await mergeGuestCart(toMerge)
        useCartStore.getState().clearOptimistic()
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
      toast.success('Account created!')
    },
  })
}

/**
 * Logout. On success: clear auth, clear optimistic cart, redirect to /.
 */
export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const clearOptimistic = useCartStore((s) => s.clearOptimistic)

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      clearOptimistic()
      navigate('/', { replace: true })
    },
  })
}
