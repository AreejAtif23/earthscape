import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-[var(--surface-pad)]',
  lg: 'p-5',
} as const

export function Card({ padding = 'md', interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface shadow-xs',
        interactive &&
          'transition-all duration-150 hover:border-line-strong hover:shadow-md focus-within:border-brand-400',
        PADDING_CLASSES[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
  icon?: ReactNode
  className?: string
  as?: 'h2' | 'h3' | 'h4'
}

export function CardHeader({
  title,
  description,
  actions,
  badge,
  icon,
  className,
  as: Heading = 'h3',
}: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Heading className="text-sm font-semibold text-ink">{title}</Heading>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 flex items-center justify-between gap-3 border-t border-line pt-3', className)} {...rest}>
      {children}
    </div>
  )
}

export function Divider({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  if (orientation === 'vertical') {
    return <span role="separator" aria-orientation="vertical" className={cn('h-full w-px bg-line', className)} />
  }
  return <hr className={cn('border-0 border-t border-line', className)} />
}

export function SectionHeading({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
