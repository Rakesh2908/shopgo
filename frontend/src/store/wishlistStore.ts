import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

export type WishlistState = {
  productIds: Set<number>
  setWishlist: (ids: number[]) => void
  toggle: (id: number) => void
  isInWishlist: (id: number) => boolean
}

const storage: StateStorage =
  typeof window !== 'undefined'
    ? window.localStorage
    : {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      }

type WishlistPersisted = {
  productIds?: number[]
}

const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: new Set<number>(),

      setWishlist: (ids) => set({ productIds: new Set(ids) }),

      toggle: (id) =>
        set((state) => {
          const next = new Set(state.productIds)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return { productIds: next }
        }),

      isInWishlist: (id) => get().productIds.has(id),
    }),
    {
      name: 'shopgo-wishlist',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ productIds: Array.from(state.productIds) }),
      merge: (persisted, current) => {
        const p = persisted as WishlistPersisted | undefined
        return {
          ...current,
          productIds: new Set(p?.productIds ?? []),
        }
      },
    },
  ),
)

export default useWishlistStore
