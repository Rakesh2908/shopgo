import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui'
import { getProduct } from '@/api/products'
import type { Product } from '@/types'
import useRecentlyViewedStore from '@/store/recentlyViewedStore'

/**
 * Section showing a horizontal list of recently viewed products.
 */
export function RecentlyViewed() {
  const productIds = useRecentlyViewedStore((s) => s.productIds)

  const queries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ['product', id] as const,
      queryFn: () => getProduct(id),
      enabled: id > 0,
    })),
  })

  const { products, isLoading } = useMemo(() => {
    if (!queries.length) {
      return { products: [] as Product[], isLoading: false }
    }
    const loading = queries.some((q) => q.isLoading)
    const data = queries
      .map((q) => q.data)
      .filter((p): p is Product => p != null)

    return { products: data, isLoading: loading }
  }, [queries])

  if (!productIds.length || (!isLoading && products.length === 0)) {
    return null
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-primary">Recently Viewed</h2>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex gap-4">
          {isLoading && products.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="w-56 shrink-0"
                >
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className="w-56 shrink-0">
                  <ProductCard product={product} size="sm" showWishlist={false} />
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}

