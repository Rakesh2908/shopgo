import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'

import { Layout } from '@/components/layout'
import { Badge, Button } from '@/components/ui'
import { useOrders } from '@/hooks/useOrders'
import type { Order } from '@/types'
import useAuthStore from '@/store/authStore'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function formatMoney(cents: number): string {
  const dollars = cents / 100
  return `$${dollars.toFixed(2)}`
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  const s = status.toLowerCase()
  if (s === 'paid') return 'success'
  if (s === 'pending') return 'warning'
  if (s === 'failed') return 'danger'
  return 'default'
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const ordersQuery = useOrders()
  const { data: orders = [], isLoading, isError } = ordersQuery
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    document.title = 'Your Orders | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  const sorted = useMemo(() => {
    const next = [...orders]
    next.sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0))
    return next
  }, [orders])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            Your orders
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Newest first. Click an order to view items.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">Failed to load orders</p>
            <Button className="mt-4" onClick={() => ordersQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">No orders yet</p>
            <p className="mt-2 text-sm text-slate-600">
              When you place an order, it will show up here.
            </p>
            <Button className="mt-5" onClick={() => navigate('/products')}>
              Browse products
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((order: Order) => {
              const isOpen = expanded.has(order.id)
              const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0
              return (
                <li key={order.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev)
                        if (next.has(order.id)) next.delete(order.id)
                        else next.add(order.id)
                        return next
                      })
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(order.status)} className="capitalize">
                          {order.status}
                        </Badge>
                        <span className="text-sm font-medium text-slate-800">
                          {formatMoney(order.totalCents)}
                        </span>
                        <span className="text-sm text-slate-500">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                    </div>

                    <ChevronDown
                      className={clsx('h-5 w-5 text-slate-400 transition-transform', isOpen && 'rotate-180')}
                      aria-hidden
                    />
                  </button>

                  {isOpen ? (
                    <div className="border-t border-slate-100 px-5 py-4">
                      <ul className="space-y-3">
                        {order.items?.map((item) => (
                          <li key={item.id} className="flex items-center gap-3">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-12 w-12 rounded-lg bg-white object-contain p-2"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {item.title}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Qty {item.quantity} · {formatMoney(item.priceCents)}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-slate-800">
                              {formatMoney(item.priceCents * item.quantity)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}

