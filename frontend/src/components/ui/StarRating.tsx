import { Star } from 'lucide-react'
import { clsx } from 'clsx'

export interface StarRatingProps {
  rating: number
  count?: number
  interactive?: boolean
  onChange?: (value: number) => void
  className?: string
}

const TOTAL_STARS = 5

/**
 * Displays 5 stars with filled/half/empty state. Optional interactive mode for setting rating.
 */
export function StarRating({
  rating,
  count,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      const value = index + 1
      onChange(value)
    }
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div className="flex" role={interactive ? 'slider' : undefined} aria-valuenow={rating}>
        {Array.from({ length: TOTAL_STARS }, (_, i) => {
          const starValue = i + 1
          const filled = rating >= starValue
          const half = rating >= i + 0.5 && rating < starValue
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(i)}
              className={clsx(
                'p-0.5 transition-transform',
                interactive && 'cursor-pointer hover:scale-110',
                !interactive && 'cursor-default',
              )}
              aria-label={interactive ? `Rate ${starValue} stars` : undefined}
            >
              <Star
                className={clsx(
                  'h-5 w-5',
                  filled && 'fill-amber-400 text-amber-400',
                  half && 'fill-amber-400/50 text-amber-400',
                  !filled && !half && 'fill-none text-slate-200',
                )}
                strokeWidth={1.5}
              />
            </button>
          )
        })}
      </div>
      {count != null ? (
        <span className="ml-1 text-sm text-slate-500">({count})</span>
      ) : null}
    </div>
  )
}
