import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getWishlist, toggleWishlist } from '@/api/wishlist'
import useAuthStore from '@/store/authStore'
import useWishlistStore from '@/store/wishlistStore'

/**
 * Fetch wishlist when authenticated. Disabled when not logged in.
 * Syncs fetched product IDs to wishlistStore for optimistic UI consistency.
 */
export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setWishlist = useWishlistStore((s) => s.setWishlist)

  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (query.data?.length != null) {
      setWishlist(query.data.map((i) => i.productId))
    }
  }, [query.data, setWishlist])

  return query
}

/**
 * Toggle a product in the wishlist. Optimistic update via wishlistStore.
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const wishlistStore = useWishlistStore.getState()

  return useMutation({
    mutationFn: (productId: number) => toggleWishlist(productId),
    onMutate: async (productId) => {
      if (!isAuthenticated) return undefined
      const previousIds = new Set(wishlistStore.productIds)
      wishlistStore.toggle(productId)
      return { previousIds }
    },
    onError: (_err, _productId, context) => {
      if (context?.previousIds != null) {
        wishlistStore.setWishlist(Array.from(context.previousIds))
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}
