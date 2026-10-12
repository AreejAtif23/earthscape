import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_PROPS } from './chartTheme'
import { ChartTooltip } from './ChartTooltip'
import { ProgressBar } from '../common/Progress'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'

export interface BeforeAfterDatum {
  dimension: string
  before: number
  after: number
}

export function QualityBeforeAfterChart({ data, height = 300 }: { data: BeforeAfterDatum[]; height?: number }) {
  const chartData = data.map((entry) => ({
    dimension: entry.dimension.replace('Quality score (%)', 'Quality score'),
    Before: entry.before,
    After: entry.after,
    isPercentage: entry.dimension.includes('Quality score'),
  }))

  const isScoreDimension = (dimension: string) => dimension.includes('Quality score')

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 4 }} barGap={3}>
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...AXIS_PROPS} tickMargin={6} />
          <YAxis
            type="category"
            dataKey="dimension"
            {...AXIS_PROPS}
            width={104}
            interval={0}
            tick={{ fill: 'var(--color-ink-muted)', fontSize: 10 }}
          />
          <Tooltip content={<ChartTooltip valueDecimals={0} />} cursor={{ fill: 'var(--color-surface-muted)' }} />
          <Bar
            dataKey="Before"
            name="Before cleaning"
            fill="var(--color-state-warning-500)"
            radius={[0, 3, 3, 0]}
            maxBarSize={13}
            animationDuration={520}
          >
            {chartData.map((entry) => (
              <Cell
                key={`before-${entry.dimension}`}
                fill={isScoreDimension(entry.dimension) ? 'var(--color-state-high-500)' : 'var(--color-state-warning-500)'}
              />
            ))}
          </Bar>
          <Bar
            dataKey="After"
            name="After cleaning"
            fill="var(--color-state-normal-500)"
            radius={[0, 3, 3, 0]}
            maxBarSize={13}
            animationDuration={520}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function QualityDeltaList({ data }: { data: BeforeAfterDatum[] }) {
  return (
    <ul className="space-y-3">
      {data.map((entry) => {
        const delta = entry.after - entry.before
        const isScore = entry.dimension.includes('Quality score')
        const max = isScore ? 100 : Math.max(entry.before, entry.after, 1)
        return (
          <li key={entry.dimension}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-xs text-ink-secondary">{entry.dimension}</span>
              <span className="flex items-center gap-2 text-[11px] tabular-nums">
                <span className="text-ink-faint line-through">{formatNumber(entry.before, 0)}</span>
                <span className="text-ink-faint" aria-hidden="true">
                  →
                </span>
                <span className="font-semibold text-ink">{formatNumber(entry.after, 0)}</span>
                {delta !== 0 && (
                  <span
                    className={cn(
                      'font-medium',
                      delta > 0 ? 'text-state-normal-600 dark:text-state-normal-200' : 'text-state-critical-600 dark:text-state-critical-200',
                    )}
                  >
                    {delta > 0 ? '+' : '−'}
                    {formatNumber(Math.abs(delta), 0)}
                  </span>
                )}
              </span>
            </div>
            <ProgressBar
              value={entry.after}
              max={max}
              size="xs"
              tone={isScore ? 'normal' : 'brand'}
              label={entry.dimension}
              animated={false}
            />
          </li>
        )
      })}
    </ul>
  )
}
