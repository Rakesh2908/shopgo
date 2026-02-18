import { clsx } from 'clsx'

export interface CartBadgeProps {
  count: number
  className?: string
}

/**
 * Small red circle badge showing cart item count. Intended to be absolute-positioned on a cart icon.
 */
export function CartBadge({ count, className }: CartBadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className={clsx(
        'absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-medium text-white',
        className,
      )}
      aria-label={`${count} items in cart`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
