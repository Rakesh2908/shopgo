import type { ReactNode } from 'react'

import { Footer } from './Footer'
import { Navbar } from './Navbar'

export interface LayoutProps {
  children: ReactNode
}

/**
 * Wraps pages with Navbar, main content area, and Footer. CartDrawer and Toaster are at App level.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">{children}</main>
      <Footer />
    </>
  )
}
