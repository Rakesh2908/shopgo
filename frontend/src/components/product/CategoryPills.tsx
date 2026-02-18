import { clsx } from 'clsx'

import { useCategories } from '@/hooks/useProducts'

export interface CategoryPillsProps {
  selected?: string
  onSelect: (cat: string | undefined) => void
}

/**
 * Horizontal scrollable row of category filter pills.
 */
export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  const { data: categories, isLoading, isError } = useCategories()

  if (isError) {
    return null
  }

  const handleSelect = (value: string | undefined) => {
    onSelect(value)
  }

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-2">
      <div className="flex min-w-max items-center gap-2">
        <button
          type="button"
          onClick={() => handleSelect(undefined)}
          className={clsx(
            'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            selected == null
              ? 'bg-accent text-white border-accent'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
          )}
        >
          All
        </button>

        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="h-8 w-16 animate-pulse rounded-full bg-slate-200"
                aria-hidden
              />
            ))
          : categories?.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelect(cat)}
                className={clsx(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                  selected === cat
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                )}
              >
                {cat}
              </button>
            ))}
      </div>
    </div>
  )
}

