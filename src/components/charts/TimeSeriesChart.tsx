import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, LEGEND_PROPS, chartMargin } from './chartTheme'
import { ChartTooltip } from './ChartTooltip'
import { formatAxisDate } from '@/utils/date'

export interface SeriesPoint {
  date: string
  [key: string]: string | number
}

export interface TimeSeriesChartProps {
  data: SeriesPoint[]
  series: Array<{ key: string; label: string; color: string; unit?: string; type?: 'line' | 'area' | 'bar' }>
  height?: number
  unit?: string
  decimals?: number
  showLegend?: boolean
  emptyMessage?: string
  referenceDate?: string
}

export function TimeSeriesChart({
  data,
  series,
  height = 260,
  unit,
  decimals = 1,
  showLegend = true,
  emptyMessage,
  referenceDate,
}: TimeSeriesChartProps) {
  const useComposed = series.length > 2
  const ChartComponent = useComposed ? ComposedChart : AreaChart
  const margin = chartMargin(series.length > 1)

  const lastPredictedIndex = useMemo(() => {
    if (!referenceDate) return -1
    return data.findIndex((point) => point.date === referenceDate)
  }, [data, referenceDate])

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink-muted">
        {emptyMessage ?? 'No data available for the selected filters.'}
      </div>
    )
  }

  return (
    <div style={{ height: height ?? '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={margin}>
        <defs>
          {series.map((entry) => (
            <linearGradient key={entry.key} id={`gradient-${entry.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={entry.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={entry.color} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          {...AXIS_PROPS}
          tickFormatter={formatAxisDate}
          minTickGap={28}
          tickMargin={8}
        />
        <YAxis {...AXIS_PROPS} tickMargin={6} width={44} unit={unit} />
        <Tooltip
          content={<ChartTooltip unit={unit} valueDecimals={decimals} />}
          cursor={{ stroke: 'var(--color-line-strong)', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        {showLegend && series.length > 1 && (
          <Legend {...LEGEND_PROPS} verticalAlign="bottom" height={22} />
        )}

        {lastPredictedIndex > 0 && (
          <ReferenceArea
            x1={data[lastPredictedIndex]?.date}
            x2={data[data.length - 1]?.date}
            fill="var(--color-brand-500)"
            fillOpacity={0.05}
            label={{ value: 'Forecast horizon', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-ink-muted)' }}
          />
        )}

        {series.map((entry) => {
          if (entry.type === 'bar') {
            return (
              <Bar
                key={entry.key}
                dataKey={entry.key}
                name={entry.label}
                fill={entry.color}
                radius={[2, 2, 0, 0]}
                maxBarSize={18}
                isAnimationActive
                animationDuration={520}
              />
            )
          }
          if (entry.type === 'area') {
            return (
              <Area
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color}
                strokeWidth={1.8}
                fill={`url(#gradient-${entry.key})`}
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                animationDuration={560}
              />
            )
          }
          return (
            <Line
              key={entry.key}
              type="monotone"
              dataKey={entry.key}
              name={entry.label}
              stroke={entry.color}
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--color-surface)' }}
              animationDuration={560}
            />
          )
        })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

export function BarComparisonChart({
  data,
  bars,
  height = 280,
  layout = 'horizontal',
  unit,
  decimals = 1,
}: {
  data: Array<Record<string, string | number>>
  bars: Array<{ key: string; label: string; color: string; unit?: string }>
  height?: number
  layout?: 'horizontal' | 'vertical'
  unit?: string
  decimals?: number
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink-muted">
        No data available for the selected filters.
      </div>
    )
  }

  const isVertical = layout === 'vertical'

  return (
    <div style={{ height: height ?? '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={isVertical ? { top: 4, right: 16, bottom: 4, left: 4 } : { top: 8, right: 8, bottom: 0, left: -8 }}
          barGap={2}
        >
          <CartesianGrid {...GRID_PROPS} vertical={isVertical} horizontal={!isVertical} />
          {isVertical ? (
            <>
              <XAxis type="number" {...AXIS_PROPS} tickMargin={6} />
              <YAxis type="category" dataKey={bars[0]?.key} {...AXIS_PROPS} width={78} interval={0} />
            </>
          ) : (
            <>
              <XAxis dataKey={bars[0]?.key} {...AXIS_PROPS} tickMargin={8} interval={0} />
              <YAxis {...AXIS_PROPS} tickMargin={6} width={44} unit={unit} />
            </>
          )}
          <Tooltip
            content={<ChartTooltip unit={unit} valueDecimals={decimals} />}
            cursor={{ fill: 'var(--color-surface-muted)' }}
          />
          {bars.length > 1 && <Legend {...LEGEND_PROPS} verticalAlign="bottom" height={22} />}
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color}
              radius={isVertical ? [0, 3, 3, 0] : [3, 3, 0, 0]}
              maxBarSize={isVertical ? 14 : 28}
              animationDuration={540}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DistributionChart({
  data,
  height = 240,
  color = CHART_COLORS.primary,
  unit = 'days',
}: {
  data: Array<{ bucket: string; count: number }>
  height?: number
  color?: string
  unit?: string
}) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-xs text-ink-muted">No distribution data.</div>
  }

  return (
    <div style={{ height: height ?? '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="bucket" {...AXIS_PROPS} tickMargin={8} interval="preserveStartEnd" />
          <YAxis {...AXIS_PROPS} tickMargin={6} width={38} />
          <Tooltip content={<ChartTooltip unit={unit} valueDecimals={0} />} cursor={{ fill: 'var(--color-surface-muted)' }} />
          <Bar dataKey="count" name="Observations" fill={color} radius={[3, 3, 0, 0]} maxBarSize={34} animationDuration={540} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
