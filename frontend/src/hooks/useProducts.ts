import { useQuery } from '@tanstack/react-query'

import {
  getCategories,
  getProduct,
  getProducts,
  searchProducts,
} from '@/api/products'
import { getReviews } from '@/api/reviews'
import type { GetProductsParams } from '@/api/products'
import type { Product, ReviewsResponse } from '@/types'

import { useDebounce } from './useDebounce'

const CATEGORIES_STALE_MS = 10 * 60 * 1000 // 10 minutes
const SEARCH_DEBOUNCE_MS = 300

/**
 * Fetch products with optional pagination and category filter.
 */
export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  })
}

/**
 * Fetch a single product by id.
 */
export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: id > 0,
  })
}

/**
 * Fetch all product categories. Cached for 10 minutes.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: CATEGORIES_STALE_MS,
  })
}

/**
 * Search products by query string. Debounced 300ms, runs only when q.length > 1.
 */
export function useSearchProducts(q: string) {
  const debouncedQ = useDebounce(q, SEARCH_DEBOUNCE_MS)
  return useQuery({
    queryKey: ['products', 'search', debouncedQ],
    queryFn: (): Promise<Product[]> => searchProducts(debouncedQ),
    enabled: debouncedQ.length > 1,
  })
}

/**
 * Fetch paginated reviews for a product.
 */
export function useProductReviews(productId: number, page: number = 1) {
  return useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: (): Promise<ReviewsResponse> => getReviews(productId, page),
    enabled: productId > 0,
  })
}
