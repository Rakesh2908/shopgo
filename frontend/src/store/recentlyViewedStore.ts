import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

export type RecentlyViewedState = {
  productIds: number[]
  addProduct: (id: number) => void
}

const storage: StateStorage =
  typeof window !== 'undefined'
    ? window.localStorage
    : {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      }

const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      addProduct: (id) =>
        set((state) => {
          const next = [id, ...state.productIds.filter((x) => x !== id)].slice(0, 10)
          return { productIds: next }
        }),
    }),
    {
      name: 'shopgo-recently-viewed',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
)

export default useRecentlyViewedStore
