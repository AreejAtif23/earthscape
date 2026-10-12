import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Severity } from '@/types'

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'normal'
  | 'warning'
  | 'high'
  | 'critical'
  | 'info'
  | 'outline'

export type BadgeSize = 'sm' | 'md'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-secondary ring-1 ring-inset ring-line',
  brand: 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200 dark:bg-brand-900 dark:text-brand-100 dark:ring-brand-700',
  normal: 'bg-state-normal-50 text-state-normal-700 ring-1 ring-inset ring-state-normal-200 dark:text-state-normal-200 dark:ring-state-normal-700',
  warning: 'bg-state-warning-50 text-state-warning-700 ring-1 ring-inset ring-state-warning-200 dark:text-state-warning-200 dark:ring-state-warning-700',
  high: 'bg-state-high-50 text-state-high-700 ring-1 ring-inset ring-state-high-200 dark:text-state-high-200 dark:ring-state-high-700',
  critical: 'bg-state-critical-50 text-state-critical-700 ring-1 ring-inset ring-state-critical-200 dark:text-state-critical-200 dark:ring-state-critical-700',
  info: 'bg-state-info-50 text-state-info-700 ring-1 ring-inset ring-state-info-200 dark:text-state-info-200 dark:ring-state-info-700',
  outline: 'bg-transparent text-ink-secondary ring-1 ring-inset ring-line-strong',
}

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-faint',
  brand: 'bg-brand-500',
  normal: 'bg-state-normal-500',
  warning: 'bg-state-warning-500',
  high: 'bg-state-high-500',
  critical: 'bg-state-critical-500',
  info: 'bg-state-info-500',
  outline: 'bg-ink-faint',
}

const SEVERITY_TO_TONE: Record<Severity, BadgeTone> = {
  normal: 'normal',
  warning: 'warning',
  high: 'high',
  critical: 'critical',
}

const SEVERITY_LABEL: Record<Severity, string> = {
  normal: 'Normal',
  warning: 'Warning',
  high: 'High',
  critical: 'Critical',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: BadgeSize
  dot?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function Badge({ tone = 'neutral', size = 'sm', dot = false, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', DOT_CLASSES[tone])} aria-hidden="true" />}
      {icon && <span aria-hidden="true" className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export function StatusBadge({
  severity,
  label,
  size = 'sm',
  dot = true,
}: {
  severity: Severity
  label?: string
  size?: BadgeSize
  dot?: boolean
}) {
  return (
    <Badge tone={SEVERITY_TO_TONE[severity]} size={size} dot={dot}>
      {label ?? SEVERITY_LABEL[severity]}
    </Badge>
  )
}

export function severityTone(severity: Severity): BadgeTone {
  return SEVERITY_TO_TONE[severity]
}

export function severityLabel(severity: Severity): string {
  return SEVERITY_LABEL[severity]
}
