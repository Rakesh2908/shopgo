import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Menu, ShoppingCart, X } from 'lucide-react'

import { CartBadge } from '@/components/ui/CartBadge'
import { useCart } from '@/hooks/useCart'
import { useSearchProducts } from '@/hooks/useSearchProducts'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'

function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Navbar() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const suggestions = useSearchProducts(searchQuery)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const openDrawer = useCartStore((s) => s.openDrawer)
  const { items: cartItems } = useCart()
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false)
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = (
    <>
      <Link
        to="/"
        className="text-slate-700 hover:text-primary font-medium transition-colors"
        onClick={() => setMobileMenuOpen(false)}
      >
        Home
      </Link>
      <Link
        to="/products"
        className="text-slate-700 hover:text-primary font-medium transition-colors"
        onClick={() => setMobileMenuOpen(false)}
      >
        Products
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Logo + desktop nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-primary shrink-0">
            ShopGo
          </Link>
          <div className="hidden md:flex items-center gap-6">{navLinks}</div>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="relative flex-1 max-w-xl mx-4">
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-3 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Search products"
            aria-expanded={searchOpen && suggestions.length > 0}
            aria-haspopup="listbox"
          />
          {searchOpen && searchQuery.trim().length >= 3 && (
            <ul
              role="listbox"
              className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              {suggestions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">
                  No products found
                </li>
              ) : (
                suggestions.map((product) => (
                  <li key={product.id} role="option">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 truncate"
                      onClick={() => {
                        navigate(`/products/${product.id}`)
                        setSearchQuery('')
                        setSearchOpen(false)
                        setMobileMenuOpen(false)
                      }}
                    >
                      {product.title}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* Right: Wishlist, Cart, User */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/wishlist"
            className="p-2 text-slate-600 hover:text-primary transition-colors rounded-lg hover:bg-slate-100"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            className="relative p-2 text-slate-600 hover:text-primary transition-colors rounded-lg hover:bg-slate-100"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            <CartBadge count={cartCount} />
          </button>

          <div ref={userMenuRef} className="relative hidden md:block">
            {isAuthenticated && user ? (
              <>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full bg-primary/10 px-2 py-1.5 text-primary font-medium hover:bg-primary/20 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm">
                    {getInitials(user.fullName)}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        logout()
                        setUserMenuOpen(false)
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 text-slate-600 hover:text-primary md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks}
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/orders"
                  className="text-slate-700 hover:text-primary font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <button
                  type="button"
                  className="text-left text-slate-700 hover:text-primary font-medium"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-primary font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-slate-700 hover:text-primary font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
