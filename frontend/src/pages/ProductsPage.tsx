import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { CategoryPills } from '@/components/product/CategoryPills'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Layout } from '@/components/layout'
import { Button, Input } from '@/components/ui'
import { useProducts, useSearchProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'

const PAGE_SIZE = 12

type SortKey = 'price-asc' | 'price-desc' | 'rating'

function toInt(value: string | null, fallback: number) {
  const n = value ? Number.parseInt(value, 10) : Number.NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function metaNumber(meta: Record<string, unknown> | undefined, key: string): number | null {
  const raw = meta?.[key]
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return null
}

function sortProducts(items: Product[], sort: SortKey): Product[] {
  const next = [...items]
  if (sort === 'price-asc') next.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') next.sort((a, b) => b.price - a.price)
  if (sort === 'rating') next.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0))
  return next
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = toInt(searchParams.get('page'), 1)
  const category = searchParams.get('category') || undefined
  const q = searchParams.get('q') ?? ''

  const [sort, setSort] = useState<SortKey>('rating')

  const searchEnabled = q.trim().length > 1
  const listQuery = useProducts({ page, limit: PAGE_SIZE, category })
  const searchQuery = useSearchProducts(q.trim())

  const baseProducts: Product[] = useMemo(() => {
    const items = searchEnabled ? (searchQuery.data ?? []) : (listQuery.data?.data ?? [])
    const filtered = category ? items.filter((p) => p.category === category) : items
    return sortProducts(filtered, sort)
  }, [category, listQuery.data?.data, searchEnabled, searchQuery.data, sort])

  const { paged, totalPages } = useMemo(() => {
    if (searchEnabled) {
      const total = baseProducts.length
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
      const safePage = Math.min(page, pages)
      const start = (safePage - 1) * PAGE_SIZE
      return {
        paged: baseProducts.slice(start, start + PAGE_SIZE),
        totalPages: pages,
      }
    }

    const total = metaNumber(listQuery.data?.meta, 'total')
    const pages = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : Math.max(1, page)
    return {
      paged: baseProducts,
      totalPages: pages,
    }
  }, [baseProducts, listQuery.data?.meta, page, searchEnabled])

  const isLoading = searchEnabled ? searchQuery.isLoading : listQuery.isLoading
  const isError = searchEnabled ? searchQuery.isError : listQuery.isError
  const refetch = searchEnabled ? searchQuery.refetch : listQuery.refetch

  useEffect(() => {
    document.title = 'Products | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  const updateParam = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([k, v]) => {
      if (!v) merged.delete(k)
      else merged.set(k, v)
    })
    if (!merged.get('page')) merged.set('page', '1')
    setSearchParams(merged, { replace: true })
  }

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-xl">
            <Input
              label="Search"
              placeholder="Search products..."
              value={q}
              onChange={(e) => updateParam({ q: e.target.value || undefined, page: '1' })}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="sort">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
            >
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        <div className="sticky top-14 z-10 -mx-4 border-b border-slate-100 bg-slate-50/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
          <CategoryPills
            selected={category}
            onSelect={(cat) => updateParam({ category: cat, page: '1' })}
          />
        </div>

        <div className="mt-6">
          {isError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
              <p className="text-sm font-medium text-slate-700">Failed to load products</p>
              <Button className="mt-4" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <ProductGrid products={paged} isLoading={isLoading} />
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-slate-600">
            Page <span className="font-medium text-slate-800">{page}</span> of{' '}
            <span className="font-medium text-slate-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={!canPrev}
              onClick={() => {
                if (!canPrev) return
                updateParam({ page: String(page - 1) })
              }}
            >
              Prev
            </Button>
            <Button
              disabled={!canNext}
              onClick={() => {
                if (!canNext) return
                updateParam({ page: String(page + 1) })
              }}
            >
              Next
            </Button>
            <Button variant="ghost" onClick={() => navigate('/products?page=1')}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

