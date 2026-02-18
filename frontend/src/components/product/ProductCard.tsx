import { useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

import { Badge, Button, StarRating } from '@/components/ui'
import { useAddToCart } from '@/hooks/useCart'
import { useToggleWishlist } from '@/hooks/useWishlist'
import type { Product, CartItem } from '@/types'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import useWishlistStore from '@/store/wishlistStore'

export type ProductCardSize = 'sm' | 'md'

export interface ProductCardProps {
  product: Product
  showWishlist?: boolean
  size?: ProductCardSize
}

/**
 * Product card with image, rating, price, wishlist toggle, and add-to-cart CTA.
 */
export function ProductCard({
  product,
  showWishlist = true,
  size = 'md',
}: ProductCardProps) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const addToCartMutation = useAddToCart()
  const addItemOptimistic = useCartStore((s) => s.addItemOptimistic)

  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id))
  const toggleWishlistMutation = useToggleWishlist()

  const handleNavigate = () => {
    navigate(`/products/${product.id}`)
  }

  const handleAddToCart = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()

      if (isAuthenticated) {
        addToCartMutation.mutate({ productId: product.id, quantity: 1 })
        return
      }

      const item: CartItem = {
        id: `guest-${product.id}-${Date.now()}`,
        productId: product.id,
        title: product.title,
        image: product.image,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      }
      addItemOptimistic(item)
      toast.success('Added to cart!')
    },
    [addToCartMutation, addItemOptimistic, isAuthenticated, product],
  )

  const handleToggleWishlist = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()

      if (!showWishlist) return

      if (!isAuthenticated) {
        toast.error('Please login to manage your wishlist.')
        navigate('/login')
        return
      }

      toggleWishlistMutation.mutate(product.id)
    },
    [isAuthenticated, navigate, product.id, showWishlist, toggleWishlistMutation],
  )

  const isLowStock = product.rating?.count != null && product.rating.count < 10

  const cardPadding = size === 'sm' ? 'p-3' : 'p-4'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleNavigate()
        }
      }}
      className={clsx(
        'group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
      )}
    >
      <div className="relative bg-white">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="aspect-square w-full bg-white p-4 object-contain"
        />

        <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-3">
          {/* Wishlist */}
          {showWishlist ? (
            <button
              type="button"
              onClick={handleToggleWishlist}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:bg-white"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isInWishlist}
            >
              <Heart
                className={clsx(
                  'h-4 w-4 transition-colors',
                  isInWishlist
                    ? 'fill-red-500 text-red-500'
                    : 'fill-transparent text-slate-400 group-hover:text-red-500',
                )}
              />
            </button>
          ) : null}

          {/* Category */}
          <Badge className="pointer-events-auto bg-slate-100 text-xs capitalize text-slate-700">
            {product.category}
          </Badge>
        </div>
      </div>

      <div className={clsx('flex flex-1 flex-col gap-2', cardPadding)}>
        <div className="flex-1 space-y-1">
          <h3 className="line-clamp-2 text-sm font-medium text-slate-800">
            {product.title}
          </h3>
          <StarRating
            rating={product.rating?.rate ?? 0}
            count={product.rating?.count}
            className="mt-1"
          />
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xl font-bold text-accent">
            ${product.price.toFixed(2)}
          </p>
          {isLowStock ? (
            <Badge variant="warning" className="shrink-0">
              Low Stock
            </Badge>
          ) : null}
        </div>

        <Button
          type="button"
          onClick={handleAddToCart}
          loading={addToCartMutation.isPending}
          className="mt-3 w-full"
        >
          Add to Cart
        </Button>
      </div>
    </div>
  )
}

