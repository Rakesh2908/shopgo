import { useEffect } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Layout } from '@/components/layout'
import { Button } from '@/components/ui'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart'
import type { CartItem } from '@/types'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'

function CartRow({
  item,
  isAuthenticated,
  isMutating,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem
  isAuthenticated: boolean
  isMutating: boolean
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}) {
  const canDec = item.quantity > 1
  const canInc = item.quantity < 99

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <img
            src={item.image}
            alt={item.title}
            className="h-14 w-14 rounded-lg bg-white object-contain p-2"
          />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium text-slate-800">
              {item.title}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ${item.price.toFixed(2)} each
              {!isAuthenticated ? ' (guest)' : ''}
            </p>
          </div>
        </div>
      </td>

      <td className="py-4 pr-4">
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => onUpdateQty(Math.max(1, item.quantity - 1))}
            disabled={!canDec || isMutating}
            className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-[2rem] text-center text-sm font-medium text-slate-800">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQty(item.quantity + 1)}
            disabled={!canInc || isMutating}
            className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </td>

      <td className="py-4 pr-4">
        <p className="text-sm font-medium text-slate-800">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </td>

      <td className="py-4 text-right">
        <button
          type="button"
          onClick={onRemove}
          disabled={isMutating}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Remove
        </button>
      </td>
    </tr>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const updateQuantityOptimistic = useCartStore((s) => s.updateQuantityOptimistic)
  const removeItemOptimistic = useCartStore((s) => s.removeItemOptimistic)

  const { items, isLoading, isError, refetch } = useCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  useEffect(() => {
    document.title = 'Your Cart | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  const handleUpdateQty = (itemId: string, qty: number) => {
    if (isAuthenticated) {
      updateMutation.mutate({ itemId, quantity: qty })
      return
    }
    updateQuantityOptimistic(itemId, qty)
  }

  const handleRemove = (itemId: string) => {
    if (isAuthenticated) {
      removeMutation.mutate(itemId)
      return
    }
    removeItemOptimistic(itemId)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              Your cart
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review items and adjust quantities before checkout.
            </p>
          </div>
          <Link to="/products" className="text-sm font-medium text-accent hover:underline">
            Continue shopping
          </Link>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">Failed to load cart</p>
            <Button className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-sm font-medium text-slate-700">Your cart is empty</p>
            <p className="mt-2 text-sm text-slate-600">
              Add something you love, then come back here to checkout.
            </p>
            <Button className="mt-5" onClick={() => navigate('/products')}>
              Start shopping
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="px-4">
                      {items.map((item) => (
                        <CartRow
                          key={item.id}
                          item={item}
                          isAuthenticated={isAuthenticated}
                          isMutating={updateMutation.isPending || removeMutation.isPending}
                          onUpdateQty={(qty) => handleUpdateQty(item.id, qty)}
                          onRemove={() => handleRemove(item.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-20 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-primary">Order summary</h2>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Taxes and shipping are calculated at payment.
                </p>
                <Button className="mt-5 w-full" onClick={() => navigate('/checkout')}>
                  Proceed to Checkout
                </Button>
                {!isAuthenticated ? (
                  <p className="mt-3 text-xs text-slate-500">
                    You’ll be asked to log in before payment.
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}

