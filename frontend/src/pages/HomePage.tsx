import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { CategoryPills } from '@/components/product/CategoryPills'
import { ProductGrid } from '@/components/product/ProductGrid'
import { RecentlyViewed } from '@/components/product/RecentlyViewed'
import { Layout } from '@/components/layout'
import { Button } from '@/components/ui'
import { useProducts } from '@/hooks/useProducts'

const FEATURED_LIMIT = 8

export default function HomePage() {
  const navigate = useNavigate()
  const categoriesRef = useRef<HTMLDivElement>(null)
  const [category, setCategory] = useState<string | undefined>(undefined)

  const productsQuery = useProducts({ page: 1, limit: FEATURED_LIMIT, category })

  const featured = useMemo(
    () => productsQuery.data?.data ?? [],
    [productsQuery.data?.data],
  )

  useEffect(() => {
    document.title = 'ShopGo — Discover Amazing Products'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  return (
    <Layout>
      <section className="bg-gradient-to-br from-primary to-accent text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Discover Amazing Products
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
              Curated essentials, beautiful design, and fast checkout—everything you
              need in one clean storefront.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate('/products')}
                className="bg-white text-primary hover:bg-white/90 focus:ring-white/40"
              >
                Shop products
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => categoriesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-white hover:bg-white/10 focus:ring-white/30"
              >
                Browse categories
                <Search className="h-5 w-5" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div
        ref={categoriesRef}
        className="sticky top-14 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <CategoryPills selected={category} onSelect={setCategory} />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Featured products</h2>
            <p className="mt-1 text-sm text-slate-600">
              A quick look at what’s trending right now.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            View all
          </Button>
        </div>

        {productsQuery.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="text-sm font-medium text-slate-700">Failed to load products</p>
            <Button className="mt-4" onClick={() => productsQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <ProductGrid
            products={featured}
            isLoading={productsQuery.isLoading}
            count={FEATURED_LIMIT}
          />
        )}

        <RecentlyViewed />
      </section>
    </Layout>
  )
}

