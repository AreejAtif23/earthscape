import { formatAxisDate } from '@/utils/date'
import { formatNumber } from '@/utils/format'

export interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
  unit?: string
  isPredicted?: boolean
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  unit,
  valueDecimals = 1,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  labelFormatter?: (label: string | number) => string
  unit?: string
  valueDecimals?: number
}) {
  if (!active || !payload || payload.length === 0) return null

  const visibleEntries = payload.filter((entry) => entry.value !== undefined && entry.value !== null)

  return (
    <div className="pointer-events-none rounded-md border border-line bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-[11px] font-medium text-ink-muted">
        {labelFormatter ? labelFormatter(label ?? '') : typeof label === 'string' ? formatAxisDate(label) : label}
      </p>
      <ul className="space-y-1">
        {visibleEntries.map((entry, index) => {
          const numericValue = typeof entry.value === 'number' ? entry.value : Number(entry.value)
          const entryUnit = (entry.payload?.unit as string | undefined) ?? unit ?? ''
          return (
            <li key={`${entry.dataKey ?? entry.name ?? index}`} className="flex items-center gap-2 text-[11px]">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? 'var(--color-chart-1)' }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate capitalize text-ink-muted">
                {String(entry.name ?? entry.dataKey ?? '')}
                {entry.isPredicted && <span className="ml-1 text-ink-faint">(predicted)</span>}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-ink">
                {Number.isFinite(numericValue) ? formatNumber(numericValue, valueDecimals) : '—'}
                <span className="ml-0.5 font-normal text-ink-muted">{entryUnit}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
