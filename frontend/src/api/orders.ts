import { apiGet, apiPost } from './client'
import type { Order, PaymentIntent } from '@/types'

/**
 * Fetch all orders for the current user.
 */
export async function getOrders(): Promise<Order[]> {
  return apiGet<Order[]>('/orders')
}

/**
 * Fetch a single order by id.
 */
export async function getOrder(id: string): Promise<Order> {
  return apiGet<Order>(`/orders/${id}`)
}

/**
 * Create a Stripe PaymentIntent for the current cart. Returns client secret and amount info.
 */
export async function createPaymentIntent(): Promise<PaymentIntent> {
  return apiPost<PaymentIntent>('/checkout/intent')
}
