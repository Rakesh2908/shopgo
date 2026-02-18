import { apiDelete, apiGet, apiPatch, apiPost } from './client'
import type { CartItem, CartItemRequest } from '@/types'

/**
 * Get the current user's cart items.
 */
export async function getCart(): Promise<CartItem[]> {
  return apiGet<CartItem[]>('/cart')
}

/**
 * Add an item to the cart.
 */
export async function addToCart(data: CartItemRequest): Promise<CartItem> {
  return apiPost<CartItem>('/cart', data)
}

/**
 * Update the quantity of a cart item.
 */
export async function updateQuantity(
  itemId: string,
  quantity: number,
): Promise<CartItem> {
  return apiPatch<CartItem>(`/cart/${itemId}`, { quantity })
}

/**
 * Remove an item from the cart.
 */
export async function removeFromCart(itemId: string): Promise<void> {
  await apiDelete<void>(`/cart/${itemId}`)
}

/**
 * Clear all items from the cart.
 */
export async function clearCart(): Promise<void> {
  await apiDelete<void>('/cart')
}

/**
 * Merge guest cart items into the authenticated user's cart (e.g. after login).
 */
export async function mergeGuestCart(items: CartItemRequest[]): Promise<void> {
  await apiPost<void>('/cart/merge', { items })
}
