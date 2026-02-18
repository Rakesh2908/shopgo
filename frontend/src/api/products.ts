import api, { apiGet } from './client'
import type { ApiResponse, Product } from '@/types'

export interface GetProductsParams {
  page?: number
  limit?: number
  category?: string
}

export interface ProductsListResponse {
  data: Product[]
  meta: Record<string, unknown>
}

/**
 * Fetch products with optional pagination and category filter.
 */
export async function getProducts(
  params?: GetProductsParams,
): Promise<ProductsListResponse> {
  const res = await api.get<ApiResponse<Product[]>>('/products', { params })
  if (!res.data.success) {
    throw new Error(res.data.error?.message ?? 'Request failed')
  }
  return {
    data: res.data.data,
    meta: (res.data.meta as Record<string, unknown>) ?? {},
  }
}

/**
 * Fetch a single product by id.
 */
export async function getProduct(id: number): Promise<Product> {
  return apiGet<Product>(`/products/${id}`)
}

/**
 * Fetch all product categories.
 */
export async function getCategories(): Promise<string[]> {
  return apiGet<string[]>('/products/categories')
}

/**
 * Search products by query string.
 */
export async function searchProducts(q: string): Promise<Product[]> {
  return apiGet<Product[]>('/products/search', { params: { q } })
}
