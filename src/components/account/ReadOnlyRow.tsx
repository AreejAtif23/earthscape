import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Label/value pair used across detail panels. Values wrap rather than truncate
 * so long identifiers stay reachable on narrow screens.
 */
export function ReadOnlyRow({
  label,
  value,
  icon,
  className,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5', className)}>
      <dt className="flex shrink-0 items-center gap-1.5 text-xs text-ink-secondary">
        {icon && (
          <span className="text-ink-faint" aria-hidden="true">
            {icon}
          </span>
        )}
        {label}
      </dt>
      <dd className="min-w-0 text-right text-xs font-medium break-words text-ink">{value}</dd>
    </div>
  )
}
