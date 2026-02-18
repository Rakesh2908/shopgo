import { useEffect, useMemo, useState } from 'react'
import { Heart, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

import { submitReview } from '@/api/reviews'
import { Layout } from '@/components/layout'
import { Badge, Button, StarRating } from '@/components/ui'
import { useAddToCart } from '@/hooks/useCart'
import { useProduct, useProductReviews } from '@/hooks/useProducts'
import { useToggleWishlist } from '@/hooks/useWishlist'
import type { CartItem, Review } from '@/types'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import useRecentlyViewedStore from '@/store/recentlyViewedStore'
import useWishlistStore from '@/store/wishlistStore'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required').max(500),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <li className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <StarRating rating={review.rating} />
        <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
        {review.comment || 'No comment.'}
      </p>
    </li>
  )
}

export default function ProductDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams()

  const id = Number(params.id)
  const productQuery = useProduct(Number.isFinite(id) ? id : 0)
  const reviewsQuery = useProductReviews(Number.isFinite(id) ? id : 0, 1)

  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct)
  useEffect(() => {
    if (Number.isFinite(id) && id > 0) addRecentlyViewed(id)
  }, [addRecentlyViewed, id])

  const product = productQuery.data
  useEffect(() => {
    if (product) {
      document.title = `${product.title} | ShopGo`
    } else if (Number.isFinite(id) && id > 0) {
      document.title = 'Product | ShopGo'
    }
    return () => {
      document.title = 'ShopGo'
    }
  }, [id, product])

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [qty, setQty] = useState(1)
  const addToCartMutation = useAddToCart()
  const addItemOptimistic = useCartStore((s) => s.addItemOptimistic)

  const isInWishlist = useWishlistStore((s) => (Number.isFinite(id) ? s.isInWishlist(id) : false))
  const toggleWishlistMutation = useToggleWishlist()

  const averageRating = reviewsQuery.data?.avgRating ?? product?.rating?.rate ?? 0
  const reviewCount = reviewsQuery.data?.totalCount ?? product?.rating?.count ?? 0
  const reviews = reviewsQuery.data?.reviews ?? []

  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '' },
    mode: 'onSubmit',
  })

  const createReview = useMutation({
    mutationFn: (values: ReviewFormValues) => submitReview(id, values),
    onSuccess: () => {
      toast.success('Review submitted!')
      reviewForm.reset({ rating: 5, comment: '' })
      queryClient.invalidateQueries({ queryKey: ['reviews', id, 1] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to submit review'
      toast.error(msg)
    },
  })

  const canDec = qty > 1
  const canInc = qty < 10

  const handleAddToCart = () => {
    if (!product) return

    if (isAuthenticated) {
      addToCartMutation.mutate({ productId: product.id, quantity: qty })
      return
    }

    const item: CartItem = {
      id: `guest-${product.id}-${Date.now()}`,
      productId: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      quantity: qty,
      subtotal: product.price * qty,
    }
    addItemOptimistic(item)
    toast.success('Added to cart!')
  }

  const handleToggleWishlist = () => {
    if (!Number.isFinite(id) || id <= 0) return
    if (!isAuthenticated) {
      toast.error('Please login to manage your wishlist.')
      navigate('/login')
      return
    }
    toggleWishlistMutation.mutate(id)
  }

  const qtyLabel = useMemo(() => `Quantity: ${qty}`, [qty])

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {productQuery.isLoading ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-24 w-full animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ) : productQuery.isError ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">Failed to load product</p>
            <Button className="mt-4" onClick={() => productQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : product ? (
          <>
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <img
                  src={product.image}
                  alt={product.title}
                  className="aspect-square w-full object-contain"
                />
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 capitalize">
                    {product.category}
                  </Badge>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                  {product.title}
                </h1>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold text-accent">
                      ${product.price.toFixed(2)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <StarRating rating={averageRating} count={reviewCount} />
                      <span className="text-sm text-slate-600">Avg. rating</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className={clsx(
                      'inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      isInWishlist
                        ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={isInWishlist}
                  >
                    <Heart
                      className={clsx(
                        'mr-2 h-4 w-4',
                        isInWishlist ? 'fill-red-500 text-red-500' : 'fill-transparent',
                      )}
                      aria-hidden
                    />
                    Wishlist
                  </button>
                </div>

                <p className="leading-relaxed text-slate-700">{product.description}</p>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <span className="text-sm font-medium text-slate-700">{qtyLabel}</span>
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        disabled={!canDec}
                        className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-medium text-slate-800">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.min(10, q + 1))}
                        disabled={!canInc}
                        className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    loading={addToCartMutation.isPending}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5" aria-hidden />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>

            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Reviews</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Average rating <span className="font-medium">{averageRating.toFixed(1)}</span>{' '}
                    from <span className="font-medium">{reviewCount}</span> reviews.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-8 lg:grid-cols-2">
                <div>
                  {reviewsQuery.isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          className="h-24 animate-pulse rounded-xl bg-slate-200"
                        />
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
                      No reviews yet. Be the first to share your thoughts.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {reviews.map((r) => (
                        <ReviewRow key={r.id} review={r} />
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-primary">Write a Review</h3>
                  {!isAuthenticated ? (
                    <div className="mt-3 text-sm text-slate-600">
                      Please{' '}
                      <button
                        type="button"
                        className="font-medium text-accent hover:underline"
                        onClick={() => navigate('/login')}
                      >
                        log in
                      </button>{' '}
                      to write a review.
                    </div>
                  ) : (
                    <form
                      className="mt-4 space-y-4"
                      onSubmit={reviewForm.handleSubmit((values: ReviewFormValues) => createReview.mutate(values))}
                    >
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Rating
                        </label>
                        <StarRating
                          rating={reviewForm.watch('rating')}
                          interactive
                          onChange={(value) => reviewForm.setValue('rating', value, { shouldValidate: true })}
                        />
                        {reviewForm.formState.errors.rating?.message ? (
                          <p className="mt-2 text-sm text-red-600" role="alert">
                            {reviewForm.formState.errors.rating.message}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor="comment"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Comment
                        </label>
                        <textarea
                          id="comment"
                          rows={4}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-primary placeholder-slate-400 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
                          placeholder="Share what you liked"
                          {...reviewForm.register('comment')}
                        />
                        {reviewForm.formState.errors.comment?.message ? (
                          <p className="mt-2 text-sm text-red-600" role="alert">
                            {reviewForm.formState.errors.comment.message}
                          </p>
                        ) : null}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        loading={createReview.isPending}
                      >
                        Submit Review
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">Product not found</p>
            <Button className="mt-4" onClick={() => navigate('/products')}>
              Back to products
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

