import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  value: string
  onValueChange: (value: string) => void
  containerClassName?: string
  size?: 'sm' | 'md'
  /** Accessible name for the search field. */
  label?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, placeholder = 'Search', label = 'Search', className, containerClassName, size = 'md', ...rest },
  ref,
) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-faint',
          size === 'sm' ? 'left-2.5 size-3.5' : 'left-3 size-4',
        )}
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        aria-label={label}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border border-line-strong bg-surface text-ink transition-colors duration-150',
          'placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
          'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint',
          size === 'sm' ? 'h-8 pr-8 pl-8 text-xs' : 'h-9 pr-9 pl-9 text-sm',
          value ? 'pr-9' : 'pr-3',
          className,
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
})
