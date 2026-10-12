
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Download, Maximize2 } from 'lucide-react'
import { Card } from '../common/Card'
import { IconButton } from '../common/Button'
import { SkeletonChart } from '../common/Skeleton'
import { cn } from '@/utils/cn'

export interface ChartCardProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  height?: number
  isLoading?: boolean
  className?: string
  footer?: ReactNode
  badge?: ReactNode
  onDownload?: () => void
  ariaLabel?: string
}

export function ChartCard({
  title,
  description,
  actions,
  children,
  height = 260,
  isLoading = false,
  className,
  footer,
  badge,
  onDownload,
  ariaLabel,
}: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)} padding="md">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {onDownload && (
            <IconButton label={`Download ${title}`} size="xs" variant="ghost" onClick={onDownload}>
              <Download className="size-3.5" aria-hidden="true" />
            </IconButton>
          )}
          <IconButton
            label={`Expand ${title}`}
            size="xs"
            variant="ghost"
            onClick={() => undefined}
            disabled
            title="Full-screen view available once the report renderer is connected"
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      <div className="mt-3 flex-1" style={{ minHeight: height }}>
        {isLoading ? (
          <SkeletonChart height={height} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            style={{ height }}
            role="img"
            aria-label={ariaLabel ?? `${title} chart`}
          >
            {children}
          </motion.div>
        )}
      </div>

      {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
    </Card>
  )
}

export function ChartLegend({
  items,
  className,
}: {
  items: Array<{ label: string; color: string; value?: string }>
  className?: string
}) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span>{item.label}</span>
          {item.value && <span className="font-medium tabular-nums text-ink-secondary">{item.value}</span>}
        </li>
      ))}
    </ul>
  )
}

export function ChartInsight({
  items,
  className,
}: {
  items: Array<{ label: string; value: string; tone?: 'default' | 'warning' | 'critical' | 'normal' }>
  className?: string
}) {
  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4', className)}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] text-ink-muted">{item.label}</dt>
          <dd
            className={cn(
              'text-sm font-semibold tabular-nums',
              item.tone === 'warning' && 'text-state-warning-700 dark:text-state-warning-200',
              item.tone === 'critical' && 'text-state-critical-700 dark:text-state-critical-200',
              item.tone === 'normal' && 'text-state-normal-700 dark:text-state-normal-200',
              (!item.tone || item.tone === 'default') && 'text-ink',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
