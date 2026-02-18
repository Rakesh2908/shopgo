import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import toast from 'react-hot-toast'

import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateQuantity,
} from '@/api/cart'
import type { CartItem, CartItemRequest } from '@/types'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'

/**
 * Unified cart state: useQuery when authenticated, otherwise cartStore (guest).
 */
export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const cartStoreItems = useCartStore((s) => s.items)

  const query = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated,
  })

  const items: CartItem[] = isAuthenticated
    ? (query.data ?? [])
    : cartStoreItems

  return {
    items,
    isLoading: isAuthenticated ? query.isLoading : false,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Add item to cart. On success invalidates cart and shows toast.
 */
export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CartItemRequest) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart!')
    },
  })
}

/**
 * Update cart item quantity with optimistic update.
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useMutation({
    mutationFn: ({
      itemId,
      quantity,
    }: {
      itemId: string
      quantity: number
    }) => updateQuantity(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      if (!isAuthenticated) return undefined
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previous = queryClient.getQueryData<CartItem[]>(['cart'])
      queryClient.setQueryData<CartItem[]>(['cart'], (old) =>
        old
          ? old.map((i) =>
              i.id === itemId ? { ...i, quantity, subtotal: i.price * quantity } : i,
            )
          : [],
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(['cart'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Remove cart item with optimistic update.
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useMutation({
    mutationFn: (itemId: string) => removeFromCart(itemId),
    onMutate: async (itemId) => {
      if (!isAuthenticated) return undefined
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previous = queryClient.getQueryData<CartItem[]>(['cart'])
      queryClient.setQueryData<CartItem[]>(['cart'], (old) =>
        old ? old.filter((i) => i.id !== itemId) : [],
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(['cart'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Clear entire cart.
 */
export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
