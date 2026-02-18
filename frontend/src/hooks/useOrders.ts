import { useQuery } from '@tanstack/react-query'

import { getOrder, getOrders } from '@/api/orders'
import useAuthStore from '@/store/authStore'

/**
 * Fetch all orders for the current user. Protected (only when authenticated).
 */
export function useOrders() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  })
}

/**
 * Fetch a single order by id.
 */
export function useOrder(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: isAuthenticated && id.length > 0,
  })
}
