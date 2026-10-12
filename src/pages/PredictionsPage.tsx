import { useMemo, useState } from 'react'
import { BrainCircuit, Cpu, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { SegmentedControl } from '@/components/common/Form'
import { EmptyState } from '@/components/common/States'
import { Skeleton } from '@/components/common/Skeleton'
import { ChartCard, ChartInsight } from '@/components/charts/ChartCard'
import { PredictionChart } from '@/components/charts/PredictionChart'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { predictionService } from '@/services'
import { METRIC_LABELS } from '@/data/climate'
import { ROUTES } from '@/routes/paths'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatInteger, formatNumber } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { ClimateMetric } from '@/types'

const HORIZONS = [7, 14, 30] as const
type Horizon = (typeof HORIZONS)[number]

const AVAILABLE_METRICS: ClimateMetric[] = ['temperature', 'rainfall', 'humidity', 'windSpeed']

const MODEL_STATUS_TONE = {
  deployed: 'normal',
  candidate: 'info',
  retraining: 'warning',
} as const

export function PredictionsPage() {
  const toast = useToast()
  const [horizon, setHorizon] = useState<Horizon>(14)
  const [selectedMetrics, setSelectedMetrics] = useState<ClimateMetric[]>(['temperature', 'rainfall'])
  const [isRegenerating, setIsRegenerating] = useState(false)

  const series = useAsync(() => predictionService.getPredictions(selectedMetrics, horizon), [horizon, selectedMetrics])
  const models = useAsync(() => predictionService.listModels(), [])
  const generatedAt = useAsync(() => predictionService.getGeneratedAt(), [])

  const toggleMetric = (metric: ClimateMetric) => {
    setSelectedMetrics((current) => {
      if (current.includes(metric)) {
        return current.length === 1 ? current : current.filter((entry) => entry !== metric)
      }
      return [...current, metric]
    })
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      series.reload()
      generatedAt.reload()
      toast.success('Forecast regenerated', `${horizon}-day horizon across ${selectedMetrics.length} metrics.`)
    } finally {
      setIsRegenerating(false)
    }
  }

  const activeSeries = useMemo(() => series.data ?? [], [series.data])
  const deployedModel = models.data?.find((model) => model.status === 'deployed')

  const insightItems = useMemo(() => {
    if (activeSeries.length === 0) return []
    const primary = activeSeries[0]
    const firstPredicted = primary.predicted[0]
    const lastPredicted = primary.predicted[primary.predicted.length - 1]
    const observedLast = primary.historical[primary.historical.length - 1]
    return [
      { label: 'Forecast start', value: firstPredicted ? formatDate(firstPredicted.date) : '—' },
      { label: 'Forecast end', value: lastPredicted ? formatDate(lastPredicted.date) : '—' },
      {
        label: 'Change',
        value:
          firstPredicted && observedLast
            ? `${primary.changePercent > 0 ? '+' : ''}${formatNumber(primary.changePercent, 1)}%`
            : '—',
        tone:
          primary.changePercent > 2
            ? ('warning' as const)
            : primary.changePercent < -2
              ? ('default' as const)
              : ('default' as const),
      },
      { label: 'Confidence', value: `${primary.confidencePercent}%` },
    ]
  }, [activeSeries])

  return (
    <>
      <PageHeader
        title="Predictions"
        description="Machine-learning forecasts with calibrated prediction intervals. Solid lines are measured history; dashed lines are model output."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Predictions' }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<RefreshCw className="size-4" />}
            onClick={() => void handleRegenerate()}
            isLoading={isRegenerating}
            loadingText="Regenerating…"
          >
            Regenerate forecast
          </Button>
        }
        meta={
          <>
            <MetaItem label="Horizon" value={`${horizon} days`} />
            <MetaItem label="Model" value={deployedModel?.name ?? 'Loading…'} />
            <MetaItem
              label="Generated"
              value={generatedAt.data ? formatDateTime(generatedAt.data) : 'Pending'}
            />
          </>
        }
      />

      <Card padding="sm" className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-secondary">Metrics</span>
            {AVAILABLE_METRICS.map((metric) => {
              const isActive = selectedMetrics.includes(metric)
              return (
                <button
                  key={metric}
                  type="button"
                  onClick={() => toggleMetric(metric)}
                  aria-pressed={isActive}
                  disabled={selectedMetrics.length === 1 && isActive}
                  className={cn(
                    'h-7 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    isActive
                      ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
                      : 'border-line-strong bg-surface text-ink-secondary hover:bg-surface-muted',
                  )}
                >
                  {METRIC_LABELS[metric]}
                </button>
              )
            })}
          </div>

          <SegmentedControl
            label="Forecast horizon"
            size="sm"
            value={String(horizon)}
            onChange={(value) => setHorizon(Number(value) as Horizon)}
            options={HORIZONS.map((days) => ({ value: String(days), label: `${days} days` }))}
          />
        </div>
      </Card>

      {series.error && (
        <Card className="mb-4">
          <div role="alert" className="p-6 text-center text-sm text-state-critical-700 dark:text-state-critical-200">
            {series.error}
          </div>
        </Card>
      )}

      {activeSeries.length === 0 && !series.isLoading ? (
        <Card>
          <EmptyState
            title="No forecasts selected"
            description="Choose at least one metric to generate a forecast series."
            action={
              <Button size="sm" variant="secondary" onClick={() => setSelectedMetrics(['temperature'])}>
                Select temperature
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {AVAILABLE_METRICS.map((metric) => {
            const entry = activeSeries.find((item) => item.metric === metric)
            if (!entry) return null

            return (
              <ChartCard
                key={metric}
                title={`${entry.label} forecast`}
                description={`${entry.trend === 'up' ? 'Rising' : entry.trend === 'down' ? 'Falling' : 'Stable'} · ${entry.confidencePercent}% confidence`}
                height={300}
                isLoading={series.isLoading}
                badge={
                  <Badge tone={entry.trend === 'up' ? 'warning' : entry.trend === 'down' ? 'info' : 'neutral'} size="sm">
                    {entry.trend === 'up' ? 'Rising' : entry.trend === 'down' ? 'Falling' : 'Stable'}
                  </Badge>
                }
                footer={
                  entry.metric === 'temperature' ? <ChartInsight items={insightItems} /> : undefined
                }
              >
                <PredictionChart series={entry} height={300} />
              </ChartCard>
            )
          })}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Model registry"
            description="Deployed and candidate forecasting models"
            as="h3"
            icon={<BrainCircuit className="size-3.5" />}
          />
          <div className="mt-4">
            {models.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full" />
                ))}
              </div>
            ) : (models.data?.length ?? 0) === 0 ? (
              <EmptyState size="sm" title="No models registered" description="Connect the training pipeline to register models." />
            ) : (
              <ul className="space-y-3">
                {models.data?.map((model) => (
                  <li key={model.id} className="rounded-md border border-line bg-surface-muted p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-xs font-semibold text-ink">{model.name}</p>
                          <Badge tone={MODEL_STATUS_TONE[model.status]} size="sm" dot>
                            {model.status}
                          </Badge>
                          <Badge tone="outline" size="sm">
                            v{model.version}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-ink-muted">
                          {model.family} · {model.algorithm} · {model.horizonDays}-day horizon
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{model.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] tracking-wide text-ink-muted uppercase">Trained on</p>
                        <p className="text-xs font-medium text-ink-secondary">{formatInteger(model.trainingRecords)}</p>
                        <p className="text-[10px] text-ink-faint">records · {formatDate(model.trainedOn)}</p>
                      </div>
                    </div>
                    <dl className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
                      {model.metrics.map((metric) => (
                        <div key={metric.name}>
                          <dt className="text-[10px] tracking-wide text-ink-muted uppercase">{metric.name}</dt>
                          <dd className="text-xs font-semibold tabular-nums text-ink">
                            {formatNumber(metric.value, metric.unit === '%' ? 0 : 2)}
                            <span className="ml-0.5 text-[10px] font-normal text-ink-muted">{metric.unit}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Forecast assumptions"
            description="What the model is allowed to use"
            as="h3"
            icon={<Cpu className="size-3.5" />}
          />
          <ul className="mt-4 space-y-3">
            {[
              {
                icon: TrendingUp,
                title: 'Momentum term',
                body: 'The trailing seven-day gradient is carried forward with a decay factor of 0.85 per day.',
              },
              {
                icon: TrendingDown,
                title: 'Mean reversion',
                body: 'Deviation from the 180-day climatological mean is damped so extremes do not extrapolate indefinitely.',
              },
              {
                icon: Cpu,
                title: 'Interval calibration',
                body: 'Prediction intervals are calibrated on the trailing 90 days of residuals, so they widen when the network is volatile.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <li key={item.title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{item.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
            Forecasts are decision support, not measurement. Every dossier produced from this workspace carries the
            model name, version and generation timestamp so a reviewer can reproduce the figure.
          </p>
        </Card>
      </div>
    </>
  )
}
