import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Layout } from '@/components/layout'

/**
 * Simple 404 page with a back button that navigates to home.
 */
export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  return (
    <Layout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-semibold text-primary">Page Not Found</h1>
        <p className="mt-2 text-center text-slate-600">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent/90 focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Home
        </Link>
      </div>
    </Layout>
  )
}
