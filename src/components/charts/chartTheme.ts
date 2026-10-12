/**
 * Centralised chart configuration. Charts read colour and axis styling from
 * here so the visual language stays consistent and themeable.
 */

export const CHART_COLORS = {
  primary: 'var(--color-chart-1)',
  secondary: 'var(--color-chart-2)',
  tertiary: 'var(--color-chart-3)',
  quaternary: 'var(--color-chart-4)',
  neutral: 'var(--color-chart-5)',
  info: 'var(--color-chart-6)',
} as const

export const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.info,
  CHART_COLORS.neutral,
]

export const SEVERITY_COLORS = {
  normal: 'var(--color-state-normal-500)',
  warning: 'var(--color-state-warning-500)',
  high: 'var(--color-state-high-500)',
  critical: 'var(--color-state-critical-500)',
} as const

export const AXIS_PROPS = {
  stroke: 'var(--color-line-strong)',
  tick: {
    fill: 'var(--color-ink-muted)',
    fontSize: 11,
  },
  tickLine: false,
  axisLine: false,
} as const

export const GRID_PROPS = {
  stroke: 'var(--color-line)',
  strokeDasharray: '3 3',
  vertical: false,
} as const

export const LEGEND_PROPS = {
  wrapperStyle: { paddingTop: '4px', fontSize: '11px' },
  iconType: 'circle' as const,
  iconSize: 7,
}

export const CURSOR_PROPS = {
  stroke: 'var(--color-line-strong)',
  strokeWidth: 1,
}

export const BAR_RADIUS: [number, number, number, number] = [2, 2, 0, 0]

export function chartMargin(compact = false) {
  return compact
    ? { top: 6, right: 6, bottom: 0, left: -12 }
    : { top: 8, right: 12, bottom: 0, left: -8 }
}

export const ANIMATION_DURATION = 520
