import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
} from 'lucide-react'
import { Button, IconButton } from './Button'
import { EmptyState, ErrorState } from './States'
import { SkeletonTable } from './Skeleton'
import { cn } from '@/utils/cn'
import { formatInteger } from '@/utils/format'

export interface DataTableColumn<T> {
  key: string
  header: string
  accessor?: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  width?: string
  sortable?: boolean
  /** Hidden by default; user can reveal via the column visibility menu. */
  defaultHidden?: boolean
  mono?: boolean
  headerHint?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  caption: string
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSortChange?: (key: string) => void
  columnVisibilityEnabled?: boolean
  toolbar?: ReactNode
  rowActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  stickyHeader?: boolean
  maxBodyHeight?: string
  footerSummary?: ReactNode
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records match the current filters',
  emptyDescription,
  emptyAction,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  sortKey,
  sortDirection = 'asc',
  onSortChange,
  columnVisibilityEnabled = true,
  toolbar,
  rowActions,
  onRowClick,
  stickyHeader = true,
  maxBodyHeight,
  footerSummary,
}: DataTableProps<T>) {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() =>
    columns.filter((column) => column.defaultHidden).map((column) => column.key),
  )
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false)

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.includes(column.key)),
    [columns, hiddenColumns],
  )

  const recordCount = total ?? rows.length
  const pageCount = Math.max(1, Math.ceil(recordCount / pageSize))
  const firstRowIndex = recordCount === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRowIndex = Math.min(page * pageSize, recordCount)

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />
  }

  if (isLoading) {
    return <SkeletonTable columns={visibleColumns.length} rows={Math.min(pageSize, 8)} />
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {(toolbar || columnVisibilityEnabled) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-muted px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">{toolbar}</div>
          {columnVisibilityEnabled && columns.length > 2 && (
            <div className="relative shrink-0">
              <Button
                variant="ghost"
                size="xs"
                leadingIcon={<Columns3 className="size-3.5" />}
                onClick={() => setIsColumnMenuOpen((open) => !open)}
                aria-expanded={isColumnMenuOpen}
                aria-haspopup="true"
              >
                Columns
              </Button>
              {isColumnMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close column menu"
                    onClick={() => setIsColumnMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-line bg-surface p-1.5 shadow-lg">
                    <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                      Visible columns
                    </p>
                    {columns.map((column) => {
                      const isVisible = !hiddenColumns.includes(column.key)
                      return (
                        <label
                          key={column.key}
                          className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-ink-secondary transition-colors hover:bg-surface-muted"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() =>
                              setHiddenColumns((current) =>
                                current.includes(column.key)
                                  ? current.filter((key) => key !== column.key)
                                  : [...current, column.key],
                              )
                            }
                            className="size-3.5 cursor-pointer accent-brand-600"
                          />
                          <span className="truncate">{column.header}</span>
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div
        className={cn('overflow-x-auto scrollbar-thin', maxBodyHeight && 'overflow-y-auto')}
        style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}
      >
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="border-b border-line bg-surface-muted">
              {visibleColumns.map((column) => {
                const isSorted = sortKey === column.key
                const isSortable = column.sortable ?? Boolean(onSortChange && column.sortValue)
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'px-[var(--cell-pad-x)] py-2 text-[11px] font-semibold tracking-wide text-ink-muted uppercase whitespace-nowrap',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.align !== 'right' && column.align !== 'center' && 'text-left',
                    )}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange?.(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded transition-colors hover:text-ink',
                          isSorted && 'text-brand-700 dark:text-brand-200',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                        title={column.headerHint ?? `Sort by ${column.header}`}
                      >
                        <span>{column.header}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="size-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span title={column.headerHint}>{column.header}</span>
                    )}
                  </th>
                )
              })}
              {rowActions && <th scope="col" className="w-px px-3 py-2 text-right text-[11px] uppercase text-ink-muted">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <motion.tr
                key={rowKey(row)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.16, delay: Math.min(rowIndex * 0.012, 0.14) }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter') onRowClick(row)
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  'border-b border-line last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500',
                )}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-[var(--cell-pad-x)] py-[var(--row-pad-y)] text-ink-secondary',
                      column.mono && 'font-mono text-xs tabular-nums',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                    )}
                  >
                    {column.accessor ? column.accessor(row) : (column.sortValue?.(row) ?? '—')}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-3 py-[var(--row-pad-y)] text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                      {rowActions(row)}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-line bg-surface-muted px-3 py-2 sm:flex-row">
        <div className="flex items-center gap-3">
          <p className="text-xs text-ink-muted" aria-live="polite">
            {recordCount === 0
              ? 'No records'
              : `Showing ${formatInteger(firstRowIndex)}–${formatInteger(lastRowIndex)} of ${formatInteger(recordCount)}`}
          </p>
          {onPageSizeChange && (
            <label className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="sr-only sm:not-sr-only">Rows</span>
              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="h-7 cursor-pointer rounded-sm border border-line-strong bg-surface px-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {footerSummary}

        {onPageChange && (
          <nav aria-label="Table pagination" className="flex items-center gap-1">
            <IconButton
              label="First page"
              size="xs"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft className="size-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Previous page"
              size="xs"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </IconButton>
            <span className="px-2 text-xs tabular-nums text-ink-secondary">
              Page <span className="font-medium text-ink">{page}</span> of {pageCount}
            </span>
            <IconButton
              label="Next page"
              size="xs"
              variant="outline"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Last page"
              size="xs"
              variant="outline"
              disabled={page >= pageCount}
              onClick={() => onPageChange(pageCount)}
            >
              <ChevronsRight className="size-3.5" aria-hidden="true" />
            </IconButton>
          </nav>
        )}
      </div>
    </div>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (candidate) => candidate === 1 || candidate === pageCount || Math.abs(candidate - page) <= 1,
  )

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <IconButton label="Previous page" size="xs" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="size-3.5" aria-hidden="true" />
      </IconButton>
      {pages.map((candidate, index) => {
        const previous = pages[index - 1]
        return (
          <span key={candidate} className="flex items-center gap-1">
            {previous !== undefined && candidate - previous > 1 && (
              <span className="px-1 text-xs text-ink-faint">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(candidate)}
              aria-current={candidate === page ? 'page' : undefined}
              className={cn(
                'size-7 rounded-sm text-xs font-medium transition-colors',
                candidate === page
                  ? 'bg-brand-600 text-white'
                  : 'text-ink-secondary hover:bg-surface-muted',
              )}
            >
              {candidate}
            </button>
          </span>
        )
      })}
      <IconButton
        label="Next page"
        size="xs"
        variant="outline"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </IconButton>
    </nav>
  )
}
