import { apiGet, apiPost } from './client'
import type { WishlistItem } from '@/types'

export interface ToggleWishlistResponse {
  added: boolean
  productId: number
}

/**
 * Toggle a product in the wishlist. Returns whether the product was added or removed.
 */
export async function toggleWishlist(
  productId: number,
): Promise<ToggleWishlistResponse> {
  return apiPost<ToggleWishlistResponse>(`/wishlist/${productId}`)
}

/**
 * Get the current user's wishlist items.
 */
export async function getWishlist(): Promise<WishlistItem[]> {
  return apiGet<WishlistItem[]>('/wishlist')
}
