import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/utils/cn'

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  secondaryAction?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'md' ? 'gap-3 px-6 py-14' : 'gap-2 px-4 py-8',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink-faint">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </span>
      <div className="max-w-md space-y-1">
        <h3 className={cn('font-semibold text-ink', size === 'md' ? 'text-sm' : 'text-sm')}>{title}</h3>
        {description && <p className="text-xs leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Unable to load this data',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-state-critical-200 bg-state-critical-50 px-6 py-10 text-center dark:border-state-critical-700 dark:bg-state-critical-900/30',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-state-critical-100 text-state-critical-700 dark:bg-state-critical-900 dark:text-state-critical-200">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-state-critical-900 dark:text-state-critical-900">{title}</h3>
        {description && (
          <p className="text-xs leading-relaxed text-state-critical-700 dark:text-state-critical-200">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" leadingIcon={<RefreshCw className="size-3.5" />} onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export function OfflineState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorState
      title="Connection to the data service was lost"
      description="The last request did not complete. Check the API endpoint and retry — nothing has been lost."
      onRetry={onRetry}
      className={className}
    />
  )
}

export function ErrorStateIcon() {
  return <WifiOff className="size-4" aria-hidden="true" />
}

export function EmptyStateIcon() {
  return <Inbox className="size-4" aria-hidden="true" />
}
