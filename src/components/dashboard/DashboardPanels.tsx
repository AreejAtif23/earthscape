import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CheckCircle2, Clock, Database, Radio, Wrench } from 'lucide-react'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge, severityTone } from '@/components/common/Badge'
import { EmptyState, ErrorState } from '@/components/common/States'
import { Skeleton } from '@/components/common/Skeleton'
import { ProgressBar } from '@/components/common/Progress'
import { formatDateTime, relativeTime } from '@/utils/date'
import { formatInteger } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { AnomalySummaryItem, ClimateStatusOverview, IngestionEvent } from '@/types'

export function AnomalySummary({
  items,
  total,
  isLoading,
  error,
  onRetry,
}: {
  items: AnomalySummaryItem[]
  total: number
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}) {
  if (error) return <ErrorState description={error} onRetry={onRetry} className="m-4" />

  return (
    <Card className="h-full">
      <CardHeader
        title="Anomaly register"
        description="Statistical events flagged in the current window"
        as="h3"
        icon={<Activity className="size-3.5" />}
        actions={
          <Badge tone={total > 0 ? 'warning' : 'normal'} size="sm">
            {formatInteger(total)} total
          </Badge>
        }
      />
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            size="sm"
            title="No anomalies detected"
            description="Every reading in the selected window sits inside the modelled seasonal envelope."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.severity}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge tone={severityTone(item.severity)} size="sm" dot>
                    {item.severity === 'normal' ? 'Within range' : item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                  </Badge>
                  <span className="text-[11px] tabular-nums text-ink-muted">
                    <span className="font-semibold text-ink">{formatInteger(item.count)}</span>
                    <span className="ml-1">({item.sharePercent}%)</span>
                  </span>
                </div>
                <ProgressBar
                  value={item.count}
                  max={Math.max(...items.map((entry) => entry.count), 1)}
                  size="xs"
                  tone={item.severity}
                  label={`${item.severity} anomalies`}
                  animated={false}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <Link
          to="/anomalies"
          className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-200"
        >
          Open anomaly register
        </Link>
      </div>
    </Card>
  )
}

const STATUS_TONE = {
  nominal: { tone: 'normal' as const, label: 'Nominal' },
  elevated: { tone: 'warning' as const, label: 'Elevated' },
  degraded: { tone: 'critical' as const, label: 'Degraded' },
}

const INGESTION_SOURCE_LABEL: Record<IngestionEvent['source'], string> = {
  api: 'API',
  csv: 'CSV',
  'sensor-stream': 'Stream',
}

const INGESTION_STATUS_TONE = {
  completed: 'normal',
  'in-progress': 'info',
  queued: 'neutral',
  failed: 'critical',
} as const

export function RecentIngestions({
  events,
  isLoading,
  error,
  onRetry,
}: {
  events: IngestionEvent[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}) {
  if (error) return <ErrorState description={error} onRetry={onRetry} className="m-4" />

  return (
    <Card className="h-full" padding="none">
      <div className="p-[var(--surface-pad)] pb-3">
        <CardHeader
          title="Recent data ingestion"
          description="Latest dataset and stream events"
          as="h3"
          icon={<Database className="size-3.5" />}
          actions={
            <Link
              to="/climate-data/upload"
              className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-200"
            >
              Upload
            </Link>
          }
        />
      </div>

      {isLoading ? (
        <div className="space-y-2 px-[var(--surface-pad)] pb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState size="sm" title="No ingestion events" description="Upload a dataset to populate the catalogue." />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {events.slice(0, 5).map((event) => (
            <li key={event.id} className="px-[var(--surface-pad)] py-2.5 transition-colors hover:bg-surface-muted">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink">{event.datasetName}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
                    <span>{INGESTION_SOURCE_LABEL[event.source]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatInteger(event.records)} records</span>
                    <span aria-hidden="true">·</span>
                    <span>{relativeTime(event.startedAt)}</span>
                  </p>
                  <p className="mt-1 truncate text-[11px] text-ink-faint">{event.note}</p>
                </div>
                <Badge tone={INGESTION_STATUS_TONE[event.status]} size="sm" className="shrink-0">
                  {event.status === 'in-progress' ? 'Running' : event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function ClimateStatusOverviewPanel({
  overview,
  isLoading,
}: {
  overview: ClimateStatusOverview | null
  isLoading?: boolean
}) {
  const [lastIngestionRunAt, setLastIngestionRunAt] = useState<string>('')

  useEffect(() => {
    setLastIngestionRunAt(new Date(Date.now() - 6 * 3_600_000).toISOString())
  }, [])

  if (isLoading || !overview) {
    return (
      <Card className="h-full">
        <CardHeader title="Network status" description="Station health and data freshness" as="h3" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  const status = STATUS_TONE[overview.overallState]
  const totalStations = Object.values(overview.stationHealth).reduce((sum, value) => sum + value, 0)

  return (
    <Card className="h-full">
      <CardHeader
        title="Network status"
        description="Station health and data freshness"
        as="h3"
        icon={<Radio className="size-3.5" />}
        actions={<Badge tone={status.tone} dot>{status.label}</Badge>}
      />

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatusTile icon={<CheckCircle2 className="size-3.5" />} label="Online" value={overview.stationHealth.online} tone="normal" />
          <StatusTile icon={<Activity className="size-3.5" />} label="Degraded" value={overview.stationHealth.degraded} tone="warning" />
          <StatusTile icon={<Radio className="size-3.5" />} label="Offline" value={overview.stationHealth.offline} tone="critical" />
          <StatusTile icon={<Wrench className="size-3.5" />} label="Maintenance" value={overview.stationHealth.maintenance} tone="info" />
        </div>

        <div className="space-y-2.5 border-t border-line pt-3">
          <ProgressBar
            value={overview.networkCoveragePercent}
            size="sm"
            tone={overview.networkCoveragePercent >= 90 ? 'normal' : 'warning'}
            label="Network coverage"
            valueFormatter={(value) => `${value}% reporting`}
          />
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 text-ink-muted">
              <Clock className="size-3" aria-hidden="true" />
              Data freshness
            </span>
            <span className="font-medium tabular-nums text-ink-secondary">
              {overview.dataFreshnessMinutes} min behind
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 text-ink-muted">
              <Database className="size-3" aria-hidden="true" />
              Records processed today
            </span>
            <span className="font-medium tabular-nums text-ink-secondary">
              {formatInteger(overview.recordsProcessedToday)}
            </span>
          </div>
        </div>

        <p className="border-t border-line pt-2.5 text-[11px] text-ink-muted">
          {overview.activeDatasets} datasets registered across {totalStations} stations. Ingestion scheduler last ran{' '}
          {formatDateTime(lastIngestionRunAt)}.
        </p>
      </div>
    </Card>
  )
}

function StatusTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'normal' | 'warning' | 'critical' | 'info'
}) {
  const toneClass = {
    normal: 'text-state-normal-600 dark:text-state-normal-200',
    warning: 'text-state-warning-600 dark:text-state-warning-200',
    critical: 'text-state-critical-600 dark:text-state-critical-200',
    info: 'text-state-info-600 dark:text-state-info-200',
  }[tone]

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-muted px-2.5 py-2">
      <span className={cn('flex items-center gap-1.5 text-[11px] text-ink-muted', toneClass)}>
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-ink">{value}</span>
    </div>
  )
}

export function PredictionSummaryPanel({
  items,
  isLoading,
}: {
  items: Array<{ metric: string; label: string; horizonDays: number; predictedValue: number; unit: string; trend: 'up' | 'down' | 'stable'; confidencePercent: number }>
  isLoading?: boolean
}) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Forecast summary"
        description="Model output for the next 14 days"
        as="h3"
        icon={<Activity className="size-3.5" />}
        actions={
          <Link
            to="/predictions"
            className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-200"
          >
            Details
          </Link>
        }
      />
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.metric} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink">{item.label}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Day {item.horizonDays} · {item.confidencePercent}% confidence
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {item.predictedValue}
                    <span className="ml-0.5 text-[11px] font-normal text-ink-muted">{item.unit}</span>
                  </span>
                  <Badge tone={item.trend === 'up' ? 'warning' : item.trend === 'down' ? 'info' : 'neutral'} size="sm">
                    {item.trend === 'up' ? 'Rising' : item.trend === 'down' ? 'Falling' : 'Steady'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
