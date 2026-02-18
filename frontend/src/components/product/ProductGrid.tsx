import { ShoppingBag } from 'lucide-react'

import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui'
import type { Product } from '@/types'

export interface ProductGridProps {
  products?: Product[]
  isLoading?: boolean
  count?: number
  showWishlist?: boolean
}

/**
 * Responsive grid of product cards with loading and empty states.
 */
export function ProductGrid({
  products,
  isLoading,
  count,
  showWishlist = true,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  const items = (products ?? []).slice(
    0,
    count && count > 0 ? count : products?.length ?? 0,
  )

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
        <ShoppingBag className="h-10 w-10 text-slate-300" aria-hidden />
        <p className="mt-3 text-sm font-medium text-slate-700">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showWishlist={showWishlist}
        />
      ))}
    </div>
  )
}

