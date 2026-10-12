import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkline } from '@/components/charts/Sparkline'
import { TrendBadge } from '@/components/charts/Sparkline'
import { AnimatedNumber, StaggerGroup, fadeInUp } from '@/components/common/Motion'
import { Skeleton } from '@/components/common/Skeleton'
import { cn } from '@/utils/cn'
import type { Severity, TrendDirection } from '@/types'

export interface KpiCardProps {
  label: string
  value: number
  unit: string
  decimals?: number
  delta: number
  deltaLabel: string
  trend: TrendDirection
  severity?: Severity
  icon: ReactNode
  sparkline?: number[]
  sparklineColor?: string
  to?: string
  isLoading?: boolean
  invertDeltaSemantics?: boolean
  footnote?: string
}

export function KpiCard({
  label,
  value,
  unit,
  decimals = 1,
  delta,
  deltaLabel,
  trend,
  severity = 'normal',
  icon,
  sparkline,
  sparklineColor,
  to,
  isLoading = false,
  invertDeltaSemantics = false,
  footnote,
}: KpiCardProps) {
  const severityRing: Record<Severity, string> = {
    normal: 'before:bg-state-normal-500',
    warning: 'before:bg-state-warning-500',
    high: 'before:bg-state-high-500',
    critical: 'before:bg-state-critical-500',
  }

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">{label}</p>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
          {icon}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1 text-2xl leading-none font-semibold text-ink">
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <AnimatedNumber value={value} decimals={decimals} />
            )}
            <span className="text-sm font-medium text-ink-muted">{unit}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <>
                <TrendBadge
                  direction={trend}
                  value={`${delta > 0 ? '+' : ''}${delta.toFixed(decimals)}${unit}`}
                  invertSemantics={invertDeltaSemantics}
                />
                <span className="text-[11px] text-ink-muted">{deltaLabel}</span>
              </>
            )}
          </div>
        </div>

        {sparkline && sparkline.length > 1 && !isLoading && (
          <Sparkline values={sparkline} color={sparklineColor ?? 'var(--color-chart-1)'} width={80} height={30} />
        )}
      </div>

      {footnote && <p className="mt-2.5 border-t border-line pt-2 text-[11px] text-ink-muted">{footnote}</p>}
    </>
  )

  const className = cn(
    'relative overflow-hidden rounded-lg border border-line bg-surface p-[var(--surface-pad)] shadow-xs transition-all duration-150',
    'before:absolute before:inset-x-0 before:top-0 before:h-0.5',
    severityRing[severity],
    to && 'hover:border-line-strong hover:shadow-md focus-within:border-brand-400',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
  )

  return (
    <motion.div variants={fadeInUp} className="min-w-0">
      {to ? (
        <Link to={to} className={cn(className, 'block h-full')}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </motion.div>
  )
}

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <StaggerGroup
      className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6', className)}
    >
      {children}
    </StaggerGroup>
  )
}
