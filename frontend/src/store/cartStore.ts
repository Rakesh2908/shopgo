import { create } from 'zustand'

import type { CartItem } from '@/types'

export type CartState = {
  items: CartItem[]
  isOpen: boolean

  openDrawer: () => void
  closeDrawer: () => void

  setItems: (items: CartItem[]) => void

  addItemOptimistic: (item: CartItem) => void
  removeItemOptimistic: (itemId: string) => void
  updateQuantityOptimistic: (itemId: string, qty: number) => void
  clearOptimistic: () => void

  getTotal: () => number
  getCount: () => number
}

const guestCartKey = 'shopgo-guest-cart'

function readGuestCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(guestCartKey)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as CartItem[]
  } catch {
    return []
  }
}

function writeGuestCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(guestCartKey)
      return
    }
    window.localStorage.setItem(guestCartKey, JSON.stringify(items))
  } catch {
    // Silent: localStorage may be unavailable.
  }
}

const useCartStore = create<CartState>((set, get) => ({
  items: readGuestCart(),
  isOpen: false,

  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),

  setItems: (items) => set({ items }),

  addItemOptimistic: (item) => {
    set((state) => ({ items: [item, ...state.items] }))
    writeGuestCart(get().items)
  },

  removeItemOptimistic: (itemId) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }))
    writeGuestCart(get().items)
  },

  updateQuantityOptimistic: (itemId, qty) => {
    if (qty <= 0) {
      get().removeItemOptimistic(itemId)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)),
    }))
    writeGuestCart(get().items)
  },

  clearOptimistic: () => {
    set({ items: [] })
    writeGuestCart([])
  },

  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))

export default useCartStore
