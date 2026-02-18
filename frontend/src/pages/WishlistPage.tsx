import { useEffect, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Heart } from 'lucide-react'

import { getProduct } from '@/api/products'
import { Layout } from '@/components/layout'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Button } from '@/components/ui'
import { useWishlist } from '@/hooks/useWishlist'
import type { Product } from '@/types'
import useAuthStore from '@/store/authStore'
import useWishlistStore from '@/store/wishlistStore'

export default function WishlistPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Fetch + sync wishlist ids when authenticated.
  useWishlist()

  const ids = useWishlistStore((s) => Array.from(s.productIds))

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['product', id] as const,
      queryFn: () => getProduct(id),
      enabled: id > 0,
    })),
  })

  const { products, isLoading, isError } = useMemo(() => {
    if (queries.length === 0) return { products: [] as Product[], isLoading: false, isError: false }
    const loading = queries.some((q) => q.isLoading)
    const hasError = queries.some((q) => q.isError)
    const data = queries.map((q) => q.data).filter((p): p is Product => p != null)
    return { products: data, isLoading: loading, isError: hasError }
  }, [queries])

  const refetchAll = () => {
    queries.forEach((q) => q.refetch())
  }

  useEffect(() => {
    document.title = 'Wishlist | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              Wishlist
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Products you’ve saved for later.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            Browse products
          </Button>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">Failed to load wishlist</p>
            <Button className="mt-4" onClick={refetchAll}>
              Try again
            </Button>
          </div>
        ) : ids.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 text-sm font-medium text-slate-700">Your wishlist is empty</p>
            <p className="mt-2 text-sm text-slate-600">
              Tap the heart on any product to save it here.
            </p>
            <Button className="mt-5" onClick={() => navigate('/products')}>
              Discover products
            </Button>
          </div>
        ) : (
          <ProductGrid products={products} isLoading={isLoading} />
        )}
      </div>
    </Layout>
  )
}

