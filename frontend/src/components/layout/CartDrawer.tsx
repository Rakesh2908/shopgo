import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import type { CartItem } from '@/types'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'

function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
  isUpdating,
}: {
  item: CartItem
  onUpdateQty: (qty: number) => void
  onRemove: () => void
  isUpdating: boolean
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
      <img
        src={item.image}
        alt={item.title}
        className="h-10 w-10 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-slate-200">
            <button
              type="button"
              onClick={() => onUpdateQty(Math.max(0, item.quantity - 1))}
              disabled={isUpdating || item.quantity <= 1}
              className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.quantity + 1)}
              disabled={isUpdating}
              className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-sm font-medium text-slate-700">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={isUpdating}
        className="shrink-0 p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
        aria-label="Remove item"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Slide-in cart drawer from the right. Controlled by cartStore isOpen / closeDrawer.
 */
export function CartDrawer() {
  const navigate = useNavigate()
  const isOpen = useCartStore((s) => s.isOpen)
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  const updateQuantityOptimistic = useCartStore((s) => s.updateQuantityOptimistic)
  const removeItemOptimistic = useCartStore((s) => s.removeItemOptimistic)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { items } = useCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const handleUpdateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      handleRemove(itemId)
      return
    }
    if (isAuthenticated) {
      updateMutation.mutate({ itemId, quantity: qty })
    } else {
      updateQuantityOptimistic(itemId, qty)
    }
  }

  const handleRemove = (itemId: string) => {
    if (isAuthenticated) {
      removeMutation.mutate(itemId)
    } else {
      removeItemOptimistic(itemId)
    }
  }

  const handleCheckout = () => {
    closeDrawer()
    navigate('/checkout')
  }

  const handleContinueShopping = () => {
    closeDrawer()
    navigate('/products')
  }

  const handleStartShopping = () => {
    closeDrawer()
    navigate('/products')
  }

  useEffect(() => {
    if (!isOpen) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [isOpen, closeDrawer])

  if (!isOpen) return null

  return (
    <>
      <div
        role="presentation"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={closeDrawer}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-primary">
            Your Cart
            {itemCount > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-slate-300" aria-hidden />
              <p className="mt-4 text-slate-600">Your cart is empty</p>
              <Button
                className="mt-4"
                onClick={handleStartShopping}
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id}>
                  <CartItemRow
                    item={item}
                    onUpdateQty={(qty) => handleUpdateQty(item.id, qty)}
                    onRemove={() => handleRemove(item.id)}
                    isUpdating={
                      updateMutation.isPending || removeMutation.isPending
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex justify-between text-base font-semibold text-primary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={handleCheckout}
            >
              Checkout
            </Button>
            <Link
              to="/products"
              onClick={handleContinueShopping}
              className="mt-3 block text-center text-sm text-accent hover:underline"
            >
              Continue Shopping
            </Link>
          </footer>
        )}
      </aside>
    </>
  )
}
