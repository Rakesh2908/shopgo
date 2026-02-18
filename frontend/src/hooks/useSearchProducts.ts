import { useQuery } from '@tanstack/react-query'

import { searchProducts } from '@/api/products'
import { useDebounce } from '@/hooks/useDebounce'

const MAX_SUGGESTIONS = 6

/**
 * Returns up to 6 product suggestions for a debounced search query (300ms).
 * Only runs when query length >= 3.
 */
export function useSearchProducts(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 300)

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
  })

  return products.slice(0, MAX_SUGGESTIONS)
}
