import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Droplets,
  Gauge,
  MapPin,
  Minus,
  Thermometer,
  Wind,
} from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/common/Form'
import { ErrorState, EmptyState } from '@/components/common/States'
import { StatTile } from '@/components/common/Progress'
import { BarComparisonChart, DistributionChart, TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { ChartCard, ChartInsight } from '@/components/charts/ChartCard'
import { CHART_COLORS } from '@/components/charts/chartTheme'
import { useAsync } from '@/hooks/useAsync'
import { analyticsService } from '@/services'
import { DATA_PERIOD, METRIC_LABELS, METRIC_UNITS, STATION_LOCATIONS } from '@/data/climate'
import { ROUTES } from '@/routes/paths'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Aggregation, ClimateMetric } from '@/types'

const AGGREGATIONS: Array<{ value: Aggregation; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const AGGREGATION_NOTE: Record<Aggregation, string> = {
  hourly: 'Hourly buckets require raw telemetry; the catalogue stores daily aggregates.',
  daily: 'Daily aggregates are the platform default and match the stored resolution.',
  weekly: 'Weekly buckets average seven daily aggregates; wet-day counts are recalculated.',
  monthly: 'Monthly buckets average all daily aggregates in the calendar month.',
}

const CORRELATION_TONE = {
  strong: 'normal',
  moderate: 'info',
  weak: 'warning',
  negligible: 'neutral',
} as const

export function AnalyticsPage() {
  const [location, setLocation] = useState('all')
  const [metric, setMetric] = useState<ClimateMetric>('temperature')
  const [aggregation, setAggregation] = useState<Aggregation>('daily')
  const [dateFrom, setDateFrom] = useState(DATA_PERIOD.from)
  const [dateTo, setDateTo] = useState(DATA_PERIOD.to)

  const overview = useAsync(
    () => analyticsService.getOverview({ location, metric, aggregation, dateFrom, dateTo }),
    [location, metric, aggregation, dateFrom, dateTo],
  )

  const data = overview.data

  const metricSeries = useMemo(() => {
    if (!data) return []
    const key = metric === 'windSpeed' ? 'windSpeed' : metric
    return data.series.map((point) => ({
      date: point.date,
      value: Number(point[key as keyof typeof point] ?? 0),
    }))
  }, [data, metric])

  const primaryChart = useMemo(() => {
    if (!data) return []
    return data.series.map((point) => ({
      date: point.date,
      temperature: point.temperature,
      rainfall: point.rainfall,
      humidity: point.humidity,
      windSpeed: point.windSpeed,
    }))
  }, [data])

  return (
    <>
      <PageHeader
        title="Analytics workspace"
        description="Statistical exploration across the station network: trends, distributions, cross-metric correlation and inter-station comparison."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Analytics' }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Gauge className="size-4" />}
            onClick={overview.reload}
            isLoading={overview.isLoading}
          >
            Recompute
          </Button>
        }
        meta={
          <>
            <MetaItem label="Window" value={`${formatDate(dateFrom)} – ${formatDate(dateTo)}`} />
            <MetaItem label="Aggregation" value={AGGREGATIONS.find((a) => a.value === aggregation)?.label ?? 'Daily'} />
            <MetaItem label="Scope" value={location === 'all' ? 'All stations' : location} />
            <MetaItem label="Method" value="Pearson r, pairwise complete" />
          </>
        }
      />

      {overview.error && (
        <div className="mb-4">
          <ErrorState description={overview.error} onRetry={overview.reload} />
        </div>
      )}

      <Card padding="sm" className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={overview.isLoading}
          >
            <option value="all">All locations</option>
            {STATION_LOCATIONS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
          <Select
            label="Primary metric"
            value={metric}
            onChange={(event) => setMetric(event.target.value as ClimateMetric)}
            disabled={overview.isLoading}
          >
            {(Object.keys(METRIC_LABELS) as ClimateMetric[]).map((entry) => (
              <option key={entry} value={entry}>
                {METRIC_LABELS[entry]}
              </option>
            ))}
          </Select>
          <Select
            label="Aggregation"
            value={aggregation}
            onChange={(event) => setAggregation(event.target.value as Aggregation)}
            disabled={overview.isLoading}
          >
            {AGGREGATIONS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </Select>
          <div>
            <label htmlFor="analytics-from" className="mb-1.5 block text-xs font-medium text-ink-secondary">
              From
            </label>
            <input
              id="analytics-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
          </div>
          <div>
            <label htmlFor="analytics-to" className="mb-1.5 block text-xs font-medium text-ink-secondary">
              To
            </label>
            <input
              id="analytics-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
          </div>
        </div>
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] text-ink-muted">{AGGREGATION_NOTE[aggregation]}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Mean temperature"
          value={data ? `${formatNumber(data.temperature.average, 1)} °C` : '—'}
          hint={data ? `Range ${formatNumber(data.temperature.range, 1)} °C` : 'Computing…'}
          icon={<Thermometer className="size-4" />}
        />
        <StatTile
          label="Total rainfall"
          value={data ? `${formatNumber(data.rainfall.total, 1)} mm` : '—'}
          hint={data ? `${data.rainfall.wetDays} wet days` : 'Computing…'}
          icon={<Droplets className="size-4" />}
          tone="brand"
        />
        <StatTile
          label="Mean humidity"
          value={data ? `${formatNumber(data.humidity.average, 1)} %` : '—'}
          hint={data ? `${formatNumber(data.humidity.min, 0)}–${formatNumber(data.humidity.max, 0)} %` : 'Computing…'}
          icon={<Droplets className="size-4" />}
        />
        <StatTile
          label="Mean wind"
          value={data ? `${formatNumber(data.wind.average, 1)} m/s` : '—'}
          hint={data ? `Dominant ${data.wind.dominantDirection}` : 'Computing…'}
          icon={<Wind className="size-4" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title={`${METRIC_LABELS[metric]} over time`}
          description="Network mean for the selected window"
          height={288}
          isLoading={overview.isLoading}
          badge={<Badge tone="neutral" size="sm">{METRIC_UNITS[metric]}</Badge>}
          footer={
            data ? (
              <ChartInsight
                items={[
                  { label: 'Mean', value: `${formatNumber(data.temperature.average, 1)} °C` },
                  { label: 'Minimum', value: `${formatNumber(data.temperature.min, 1)} °C` },
                  { label: 'Maximum', value: `${formatNumber(data.temperature.max, 1)} °C` },
                  { label: 'Wet days', value: String(data.rainfall.wetDays) },
                ]}
              />
            ) : undefined
          }
        >
          <TimeSeriesChart
            data={metricSeries}
            series={[
              {
                key: 'value',
                label: METRIC_LABELS[metric],
                color: CHART_COLORS.primary,
                type: 'area',
              },
            ]}
            height={288}
            unit={METRIC_UNITS[metric]}
            showLegend={false}
            emptyMessage="No observations fall inside the selected window."
          />
        </ChartCard>

        <ChartCard
          title="Temperature distribution"
          description="Daily observations in 2 °C bins"
          height={288}
          isLoading={overview.isLoading}
        >
          <DistributionChart data={data?.distribution ?? []} height={288} />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Multi-metric overview"
          description="Temperature and rainfall are charted against the shared date axis"
          height={300}
          isLoading={overview.isLoading}
        >
          <TimeSeriesChart
            data={primaryChart}
            series={[
              { key: 'temperature', label: 'Temperature', color: CHART_COLORS.primary, type: 'line' },
              { key: 'rainfall', label: 'Rainfall', color: CHART_COLORS.info, type: 'bar' },
              { key: 'humidity', label: 'Humidity', color: CHART_COLORS.tertiary, type: 'line' },
            ]}
            height={300}
            showLegend
            decimals={1}
          />
        </ChartCard>

        <ChartCard
          title="Station comparison"
          description="Mean temperature by location, most recent window"
          height={300}
          isLoading={overview.isLoading}
        >
          <BarComparisonChart
            data={(data?.locationComparison ?? []).slice(0, 8).map((entry) => ({
              location: entry.location,
              temperature: entry.temperature,
            }))}
            bars={[{ key: 'location', label: 'Location', color: CHART_COLORS.primary }]}
            layout="vertical"
            height={300}
            unit=" °C"
          />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Cross-metric correlation matrix"
            description="Pearson coefficients computed on pairwise-complete observations"
            as="h3"
          />
          <div className="mt-4">
            {overview.isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-md border border-line bg-surface-muted" />
                ))}
              </div>
            ) : (data?.correlations.length ?? 0) === 0 ? (
              <EmptyState
                size="sm"
                title="Not enough overlapping observations"
                description="Widen the date window so at least two metrics share observations."
              />
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {data?.correlations.map((pair) => (
                  <CorrelationTile
                    key={`${pair.metricA}-${pair.metricB}`}
                    metricA={pair.metricA}
                    metricB={pair.metricB}
                    coefficient={pair.coefficient}
                    strength={pair.strength}
                    direction={pair.direction}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
            Coefficients above 0.8 or below −0.8 are considered strong for climate telemetry. Values near zero indicate
            the two metrics vary independently over this window.
          </p>
        </Card>

        <Card>
          <CardHeader title="Extremes" description="Records worth reviewing" as="h3" icon={<MapPin className="size-3.5" />} />
          <dl className="mt-4 space-y-3">
            <ExtremeRow
              label="Warmest day"
              value={data ? `${formatNumber(data.temperature.max, 1)} °C` : '—'}
              detail={data?.rainfall.peakDay ? `Peak rainfall on ${formatDate(data.rainfall.peakDay)}` : undefined}
              tone="warning"
            />
            <ExtremeRow
              label="Coldest day"
              value={data ? `${formatNumber(data.temperature.min, 1)} °C` : '—'}
              detail="Across the selected window"
              tone="info"
            />
            <ExtremeRow
              label="Strongest wind"
              value={data ? `${formatNumber(data.wind.max, 1)} m/s` : '—'}
              detail={data ? `Dominant ${data.wind.dominantDirection}` : undefined}
              tone="critical"
            />
            <ExtremeRow
              label="Driest air"
              value={data ? `${formatNumber(data.humidity.min, 0)} %` : '—'}
              detail="Relative humidity minimum"
              tone="neutral"
            />
          </dl>
        </Card>
      </div>
    </>
  )
}

function CorrelationTile({
  metricA,
  metricB,
  coefficient,
  strength,
  direction,
}: {
  metricA: ClimateMetric
  metricB: ClimateMetric
  coefficient: number
  strength: 'negligible' | 'weak' | 'moderate' | 'strong'
  direction: 'positive' | 'negative' | 'none'
}) {
  const Icon = direction === 'positive' ? ArrowUpRight : direction === 'negative' ? ArrowDownRight : Minus
  const magnitude = Math.abs(coefficient)

  return (
    <div className="rounded-md border border-line bg-surface-muted p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-medium text-ink-secondary">
          {METRIC_LABELS[metricA]} · {METRIC_LABELS[metricB]}
        </p>
        <Badge tone={CORRELATION_TONE[strength]} size="sm">
          {strength}
        </Badge>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="flex items-center gap-1 text-xl font-semibold tabular-nums text-ink">
          <Icon className="size-4 text-ink-muted" aria-hidden="true" />
          {coefficient.toFixed(3)}
        </p>
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
          <div
            className={cn(
              'h-full rounded-full',
              magnitude >= 0.8 ? 'bg-brand-600' : magnitude >= 0.5 ? 'bg-accent-500' : 'bg-state-warning-500',
            )}
            style={{ width: `${Math.min(magnitude * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ExtremeRow({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail?: string
  tone: 'neutral' | 'warning' | 'critical' | 'info'
}) {
  const toneClass = {
    neutral: 'text-ink',
    warning: 'text-state-warning-700 dark:text-state-warning-200',
    critical: 'text-state-critical-700 dark:text-state-critical-200',
    info: 'text-state-info-700 dark:text-state-info-200',
  }[tone]

  return (
    <div className="flex items-start justify-between gap-3 border-b border-line pb-2.5 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <dt className="text-xs text-ink-muted">{label}</dt>
        {detail && <dd className="mt-0.5 text-[11px] text-ink-faint">{detail}</dd>}
      </div>
      <span className={cn('shrink-0 text-sm font-semibold tabular-nums', toneClass)}>{value}</span>
    </div>
  )
}
