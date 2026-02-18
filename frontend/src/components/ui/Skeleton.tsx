import { clsx } from 'clsx'

export interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton block with pulse animation.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse rounded bg-slate-200', className)}
      aria-hidden
    />
  )
}

/**
 * Product card skeleton matching typical layout: image, title, price, CTA.
 * Uses shimmer via animate-pulse and bg-slate-200 blocks.
 */
export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl bg-white shadow-sm transition-shadow',
        className,
      )}
      aria-hidden
    >
      {/* Image area */}
      <Skeleton className="aspect-square w-full" />
      {/* Content */}
      <div className="p-4">
        {/* Title lines */}
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="mb-3 h-3 w-full" />
        <Skeleton className="mb-3 h-3 w-1/2" />
        {/* Price */}
        <Skeleton className="mb-4 h-6 w-20" />
        {/* CTA row */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
