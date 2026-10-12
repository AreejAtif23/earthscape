import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { CHART_COLORS } from './chartTheme'
import { Badge } from '../common/Badge'
import type { TrendDirection } from '@/types'

/** Compact trend indicator used inside KPI cards and table cells. */
export function TrendBadge({
  direction,
  value,
  label,
  invertSemantics = false,
  className,
}: {
  direction: TrendDirection
  value?: string
  label?: string
  invertSemantics?: boolean
  className?: string
}) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus

  const isPositiveSemantics = invertSemantics ? direction === 'down' : direction === 'up'
  const tone = direction === 'stable' ? 'neutral' : isPositiveSemantics ? 'normal' : 'warning'

  return (
    <Badge tone={tone} size="sm" className={className} icon={<Icon className="size-3" />}>
      {value}
      {label && <span className="font-normal opacity-80">{label}</span>}
    </Badge>
  )
}

export function Sparkline({
  values,
  color = CHART_COLORS.primary,
  width = 88,
  height = 28,
  strokeWidth = 1.5,
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
  strokeWidth?: number
}) {
  if (values.length < 2) return <div style={{ width, height }} aria-hidden="true" />

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values.map((value, index) => {
    const x = index * step
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      role="img"
      aria-label={`Trend sparkline, ${values.length} points, latest value ${values[values.length - 1]}`}
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2}
        r={2}
        fill={color}
      />
    </svg>
  )
}

export function MiniBarSeries({
  values,
  color = CHART_COLORS.secondary,
  height = 28,
}: {
  values: number[]
  color?: string
  height?: number
}) {
  const max = Math.max(...values, 1)
  return (
    <div
      className="flex items-end gap-[3px]"
      style={{ height }}
      role="img"
      aria-label={`Bar series of ${values.length} values, peak ${max}`}
    >
      {values.map((value, index) => (
        <span
          key={index}
          className="flex-1 rounded-t-[1px]"
          style={{ height: `${Math.max((value / max) * 100, 6)}%`, backgroundColor: color, opacity: 0.45 + (value / max) * 0.55 }}
        />
      ))}
    </div>
  )
}
