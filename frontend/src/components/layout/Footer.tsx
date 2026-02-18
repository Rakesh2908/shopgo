import { Link } from 'react-router-dom'

/**
 * Site footer with brand and links in a simple two-column layout.
 */
export function Footer() {
  return (
    <footer className="bg-primary text-white/80 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <Link to="/" className="text-xl font-bold text-white">
              ShopGo
            </Link>
            <p className="mt-2 text-sm text-white/80">
              Your one-stop shop for quality products. Simple, fast, reliable.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <Link
              to="/"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Products
            </Link>
            <Link
              to="/orders"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
