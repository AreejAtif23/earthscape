import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
  breadcrumb?: Array<{ label: string; to?: string }>
  tabs?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  breadcrumb,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-5', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
            {breadcrumb.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {index > 0 && <span aria-hidden="true">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="transition-colors hover:text-ink">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-ink-secondary" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-muted">{description}</p>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {tabs && <div className="mt-4 border-b border-line">{tabs}</div>}
    </header>
  )
}

export function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
      <span className="text-ink-faint">{label}</span>
      <span className="font-medium text-ink-secondary">{value}</span>
    </span>
  )
}

export function PageTabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>
  activeTab: string
  onTabChange: (id: string) => void
}) {
  return (
    <div role="tablist" aria-label="Page sections" className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors',
              'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500',
              isActive
                ? 'border-brand-600 text-brand-700 dark:border-brand-300 dark:text-brand-200'
                : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  isActive ? 'bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-brand-100' : 'bg-surface-sunken text-ink-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
