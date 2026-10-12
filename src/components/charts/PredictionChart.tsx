import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_PROPS, CHART_COLORS, chartMargin } from './chartTheme'
import { ChartTooltip } from './ChartTooltip'
import { formatAxisDate, formatDate } from '@/utils/date'
import { Badge } from '../common/Badge'
import type { PredictionSeries } from '@/types'

export interface PredictionChartProps {
  series: PredictionSeries
  height?: number
}

/**
 * Historical observations and model output are drawn as visually distinct
 * layers: solid for measured history, dashed with a confidence band for the
 * forecast horizon, separated by an explicit reference line.
 */
export function PredictionChart({ series, height = 300 }: PredictionChartProps) {
  const historyLength = series.historical.length

  const combined = [
    ...series.historical.map((point, index) => ({
      date: point.date,
      observed: point.value,
      // Bridge the two layers so the lines meet at the forecast origin.
      predicted: index === historyLength - 1 ? point.value : null,
      lower: index === historyLength - 1 ? point.value : null,
      upper: index === historyLength - 1 ? point.value : null,
      phase: 'observed',
    })),
    ...series.predicted.map((point, index) => ({
      date: point.date,
      observed: null,
      predicted: point.value,
      lower: series.lowerBound[index]?.value ?? point.value,
      upper: series.upperBound[index]?.value ?? point.value,
      phase: 'predicted',
    })),
  ]

  const forecastOrigin = series.historical[historyLength - 1]?.date
  const observedValues = series.historical.map((point) => point.value)
  const allValues = [...observedValues, ...series.predicted.map((point) => point.value)]
  const domainPadding = Math.max((Math.max(...allValues) - Math.min(...allValues)) * 0.18, 1)

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="brand" dot>
          Observed
        </Badge>
        <Badge tone="outline">Model forecast</Badge>
        <Badge tone="neutral">80% prediction interval</Badge>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combined} margin={chartMargin()}>
            <defs>
              <linearGradient id={`prediction-band-${series.metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              {...AXIS_PROPS}
              tickFormatter={formatAxisDate}
              minTickGap={30}
              tickMargin={8}
            />
            <YAxis
              {...AXIS_PROPS}
              tickMargin={6}
              width={46}
              unit={series.unit}
              domain={[
                Math.min(...allValues) - domainPadding,
                Math.max(...allValues) + domainPadding,
              ]}
            />
            <Tooltip
              content={<ChartTooltip unit={series.unit} valueDecimals={1} />}
              cursor={{ stroke: 'var(--color-line-strong)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            <Area
              dataKey="upper"
              stroke="none"
              fill={`url(#prediction-band-${series.metric})`}
              connectNulls
              isAnimationActive={false}
              legendType="none"
              name="Upper bound"
            />
            <Area
              dataKey="lower"
              stroke="none"
              fill="var(--color-surface)"
              fillOpacity={0.72}
              connectNulls
              isAnimationActive={false}
              legendType="none"
              name="Lower bound"
            />

            {forecastOrigin && (
              <ReferenceLine
                x={forecastOrigin}
                stroke="var(--color-line-strong)"
                strokeDasharray="4 4"
                label={{
                  value: 'Forecast origin',
                  position: 'top',
                  fontSize: 10,
                  fill: 'var(--color-ink-muted)',
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="observed"
              name="Observed"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--color-surface)' }}
              connectNulls={false}
              animationDuration={560}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted"
              stroke={CHART_COLORS.quaternary}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--color-surface)' }}
              connectNulls
              animationDuration={560}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {forecastOrigin && (
        <p className="mt-2 text-[11px] text-ink-muted">
          Forecast generated from observations up to {formatDate(forecastOrigin)}. Values beyond the dashed line are model
          output, not measurements.
        </p>
      )}
    </div>
  )
}
