import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

import { CartDrawer } from '@/components/layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { StripeWrapper } from '@/components/StripeWrapper'
import useAuthStore from '@/store/authStore'

const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 1,
    },
  },
})

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2
        className="h-10 w-10 animate-spin text-accent"
        aria-label="Loading"
      />
    </div>
  )
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StripeWrapper>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <CartDrawer />
          <Toaster position="bottom-right" />
        </StripeWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
