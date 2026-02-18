import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export const StripeContext = createContext<Promise<Stripe | null> | null>(
  stripePromise,
)

export interface StripeWrapperProps {
  children: ReactNode
}

/**
 * Provides Stripe instance (from loadStripe) via context for use in checkout and payment flows.
 */
export function StripeWrapper({ children }: StripeWrapperProps) {
  const value = useMemo(() => stripePromise, [])
  return (
    <StripeContext.Provider value={value}>{children}</StripeContext.Provider>
  )
}

/** Returns the Stripe promise from StripeWrapper context. */
export function useStripePromise(): Promise<Stripe | null> | null {
  return useContext(StripeContext)
}
