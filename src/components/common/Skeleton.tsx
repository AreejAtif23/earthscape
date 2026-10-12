import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-surface-sunken dark:bg-navy-700', className)}
      {...rest}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-line bg-surface p-[var(--surface-pad)]', className)} role="status">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="size-9 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-10 w-full" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function SkeletonTable({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface" role="status" aria-label="Loading table data">
      <div className="flex items-center gap-4 border-b border-line bg-surface-muted px-4 py-2.5">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className="h-3 flex-1"
              // eslint-disable-next-line react/no-array-index-key
              style={{ maxWidth: `${60 + ((rowIndex + columnIndex) % 4) * 12}%` }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading table data…</span>
    </div>
  )
}

export function SkeletonChart({ height = 260, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn('flex items-end gap-2 rounded-md p-4', className)}
      style={{ height }}
      role="status"
      aria-label="Loading chart"
    >
      {[38, 62, 45, 78, 54, 88, 66, 42, 72, 58, 84, 50].map((heightPercent, index) => (
        <Skeleton
          key={index}
          className="flex-1 rounded-t-sm"
          style={{ height: `${heightPercent}%` }}
        />
      ))}
      <span className="sr-only">Loading chart…</span>
    </div>
  )
}

export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}
