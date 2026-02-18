import { apiDelete, apiGet, apiPost } from './client'
import type { Review, ReviewsResponse } from '@/types'

const defaultReviewLimit = 10

/**
 * Fetch reviews for a product with optional pagination.
 */
export async function getReviews(
  productId: number,
  page?: number,
): Promise<ReviewsResponse> {
  const pageNum = page ?? 1
  const res = await apiGet<{
    reviews: Review[]
    avgRating: number
    totalCount: number
  }>(`/products/${productId}/reviews`, {
    params: { page: pageNum, limit: defaultReviewLimit },
  })
  return {
    ...res,
    page: pageNum,
    limit: defaultReviewLimit,
  }
}

/**
 * Submit a review for a product.
 */
export async function submitReview(
  productId: number,
  data: { rating: number; comment: string },
): Promise<Review> {
  return apiPost<Review>(`/products/${productId}/reviews`, data)
}

/**
 * Delete a review by id (own review only).
 */
export async function deleteReview(reviewId: string): Promise<void> {
  await apiDelete<void>(`/reviews/${reviewId}`)
}
