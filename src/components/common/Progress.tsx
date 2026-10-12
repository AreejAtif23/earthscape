import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface ProgressBarProps {
  value: number
  max?: number
  label: string
  showValue?: boolean
  size?: 'xs' | 'sm' | 'md'
  tone?: 'brand' | 'normal' | 'warning' | 'high' | 'critical' | 'info'
  className?: string
  valueFormatter?: (value: number) => string
  animated?: boolean
}

const TONE_BAR: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  brand: 'bg-brand-600',
  normal: 'bg-state-normal-500',
  warning: 'bg-state-warning-500',
  high: 'bg-state-high-500',
  critical: 'bg-state-critical-500',
  info: 'bg-state-info-500',
}

const TONE_TEXT: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  brand: 'text-brand-700 dark:text-brand-200',
  normal: 'text-state-normal-700 dark:text-state-normal-200',
  warning: 'text-state-warning-700 dark:text-state-warning-200',
  high: 'text-state-high-700 dark:text-state-high-200',
  critical: 'text-state-critical-700 dark:text-state-critical-200',
  info: 'text-state-info-700 dark:text-state-info-200',
}

const HEIGHTS = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' } as const

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'sm',
  tone = 'brand',
  className,
  valueFormatter,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max === 0 ? 0 : (clamped / max) * 100
  const displayValue = valueFormatter ? valueFormatter(clamped) : `${Math.round(percent)}%`

  return (
    <div className={className}>
      {(showValue || valueFormatter) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-xs text-ink-muted">{label}</span>
          <span className={cn('text-xs font-semibold tabular-nums', TONE_TEXT[tone])}>{displayValue}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('w-full overflow-hidden rounded-full bg-surface-sunken', HEIGHTS[size])}
      >
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
          className={cn('h-full rounded-full', TONE_BAR[tone])}
        />
      </div>
      {showValue && !valueFormatter && (
        <span className="sr-only">
          {label}: {displayValue}
        </span>
      )}
    </div>
  )
}

export function ScoreRing({
  value,
  label,
  size = 96,
  caption,
}: {
  value: number
  label: string
  size?: number
  caption?: string
}) {
  const clamped = Math.min(Math.max(value, 0), 100)
  const strokeWidth = size >= 100 ? 8 : 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clamped / 100) * circumference

  const tone =
    clamped >= 90
      ? 'stroke-state-normal-500'
      : clamped >= 75
        ? 'stroke-state-info-500'
        : clamped >= 60
          ? 'stroke-state-warning-500'
          : 'stroke-state-critical-500'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`${label}: ${Math.round(clamped)} out of 100`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-surface-sunken"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className={tone}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-ink" data-numeric>
            {Math.round(clamped)}
          </span>
          {caption && <span className="text-[10px] text-ink-muted">{caption}</span>}
        </div>
      </div>
      <span className="text-center text-xs text-ink-muted">{label}</span>
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'neutral' | 'brand' | 'warning' | 'critical'
}) {
  const toneClass = {
    neutral: 'text-ink',
    brand: 'text-brand-700 dark:text-brand-200',
    warning: 'text-state-warning-700 dark:text-state-warning-200',
    critical: 'text-state-critical-700 dark:text-state-critical-200',
  }[tone]

  return (
    <div className="rounded-md border border-line bg-surface-muted px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">{label}</p>
        {icon && <span className={cn('shrink-0', toneClass)} aria-hidden="true">{icon}</span>}
      </div>
      <p className={cn('mt-1 text-lg font-semibold tabular-nums', toneClass)} data-numeric>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p>}
    </div>
  )
}
