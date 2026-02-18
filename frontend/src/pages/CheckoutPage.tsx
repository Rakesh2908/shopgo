import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { createPaymentIntent } from '@/api/orders'
import { Layout } from '@/components/layout'
import { Button } from '@/components/ui'
import { useStripePromise } from '@/components/StripeWrapper'
import { useCart } from '@/hooks/useCart'
import useAuthStore from '@/store/authStore'

function CheckoutForm() {
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()

  const handlePlaceOrder = async () => {
    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
    })

    if (error) {
      toast.error(error.message ?? 'Payment failed')
      return
    }

    navigate('/orders', { replace: true })
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button
        className="w-full"
        size="lg"
        disabled={!stripe || !elements}
        onClick={handlePlaceOrder}
      >
        Place Order
      </Button>
      <p className="text-xs text-slate-500">
        Test mode: use Stripe test card numbers.
      </p>
    </div>
  )
}

export default function CheckoutPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const stripePromise = useStripePromise()
  const { items, isLoading } = useCart()

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  )

  const intentQuery = useQuery({
    queryKey: ['checkout', 'intent'],
    queryFn: createPaymentIntent,
    enabled: isAuthenticated && items.length > 0 && stripePromise != null,
  })

  useEffect(() => {
    document.title = 'Checkout | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review your order and complete payment securely.
          </p>
        </div>

        {stripePromise == null ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              Stripe publishable key missing
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Set <span className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</span> to enable
              checkout.
            </p>
          </div>
        ) : isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">Your cart is empty</p>
            <p className="mt-2 text-sm text-slate-600">
              Add items to your cart before checking out.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <section className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-primary">Order summary</h2>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-12 w-12 rounded-lg bg-white object-contain p-2"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-700">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            <section className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-primary">Payment</h2>

                {intentQuery.isLoading ? (
                  <div className="mt-4 space-y-3">
                    <div className="h-10 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 animate-pulse rounded bg-slate-200" />
                  </div>
                ) : intentQuery.isError || !intentQuery.data?.clientSecret ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-700">
                    <p>Failed to start checkout. Please try again.</p>
                    <Button className="mt-4" onClick={() => intentQuery.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Elements
                      stripe={stripePromise}
                      options={{ clientSecret: intentQuery.data.clientSecret }}
                    >
                      <CheckoutForm />
                    </Elements>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  )
}

