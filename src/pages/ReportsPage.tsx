import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  Printer,
  ShieldCheck,
  Table2,
} from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { Checkbox, Input, SegmentedControl, Select, Switch } from '@/components/common/Form'
import { EmptyState, ErrorState } from '@/components/common/States'
import { Skeleton } from '@/components/common/Skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { reportService } from '@/services'
import { STATION_LOCATIONS } from '@/data/climate'
import { ROUTES } from '@/routes/paths'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatInteger, titleCase } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { GeneratedReport, ReportConfig, ReportMetricsSelection, ReportStatus, ReportType } from '@/types'

const REPORT_TYPES: Array<{ value: ReportType; label: string; description: string }> = [
  { value: 'summary', label: 'Executive summary', description: 'Headline figures, risk level and one-page narrative' },
  { value: 'detailed', label: 'Detailed assessment', description: 'Full station tables with charts and methodology' },
  { value: 'anomaly', label: 'Anomaly dossier', description: 'Anomaly register, severity summary and inspection notes' },
  { value: 'trend', label: 'Trend analysis', description: 'Long-horizon trends, climatology comparison and projections' },
  { value: 'compliance', label: 'Compliance pack', description: 'Reporting-period evidence with data provenance' },
]

const METRIC_ROWS: Array<{ key: keyof ReportMetricsSelection; label: string; unit: string }> = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm' },
  { key: 'windSpeed', label: 'Wind speed', unit: 'm/s' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa' },
]

const STATUS_TONE: Record<ReportStatus, 'neutral' | 'info' | 'normal' | 'critical'> = {
  draft: 'neutral',
  queued: 'info',
  generating: 'info',
  ready: 'normal',
  failed: 'critical',
}

type PreviewRow = {
  label: string
  temperature: string
  rainfall: string
  humidity: string
  windSpeed: string
}

/** The station table carries four metrics; pressure is reported in the headline figures only. */
function tableCell(row: PreviewRow, key: keyof ReportMetricsSelection): string {
  return key === 'pressure' ? 'Not tabulated' : row[key]
}

function defaultConfig(): ReportConfig {  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 89)
  return {
    title: 'Q1 2026 network climate assessment',
    reportType: 'summary',
    location: 'all',
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: today.toISOString().slice(0, 10),
    metrics: { temperature: true, humidity: true, rainfall: true, windSpeed: false, pressure: false },
    includeCharts: true,
    includeAnomalies: true,
    includeMethodology: true,
    format: 'pdf',
  }
}

export function ReportsPage() {
  const toast = useToast()
  const [config, setConfig] = useState<ReportConfig>(defaultConfig)
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof reportService.previewReport>> | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [generated, setGenerated] = useState<GeneratedReport[]>([])

  const history = useAsync(() => reportService.listReports(), [])

  useEffect(() => {
    if (history.data) setGenerated(history.data)
  }, [history.data])

  const patch = (updates: Partial<ReportConfig>) => setConfig((current) => ({ ...current, ...updates }))

  const patchMetric = (key: keyof ReportMetricsSelection, value: boolean) =>
    setConfig((current) => ({ ...current, metrics: { ...current.metrics, [key]: value } }))

  const selectedMetrics = useMemo(
    () => METRIC_ROWS.filter((row) => config.metrics[row.key]),
    [config.metrics],
  )

  const dateError =
    config.dateFrom && config.dateTo && config.dateFrom > config.dateTo
      ? 'The start date must be on or before the end date.'
      : undefined

  const runPreview = async () => {
    if (dateError) {
      setPreviewError(dateError)
      return
    }
    if (selectedMetrics.length === 0) {
      setPreviewError('Select at least one metric for the report table.')
      return
    }
    setIsPreviewing(true)
    setPreviewError(null)
    try {
      setPreview(await reportService.previewReport(config))
    } catch (error) {
      setPreview(null)
      setPreviewError(error instanceof Error ? error.message : 'The preview could not be built.')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleGenerate = async () => {
    if (dateError) {
      setPreviewError(dateError)
      return
    }
    setIsGenerating(true)
    try {
      const report = await reportService.generateReport(config)
      setGenerated((current) => [report, ...current])
      toast.success('Report generated', `${report.title} is ready to download.`)
    } catch (error) {
      toast.error('Generation failed', error instanceof Error ? error.message : 'The report could not be produced.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (report: GeneratedReport) => {
    setDownloadingId(report.id)
    try {
      const { blob, fileName } = await reportService.downloadReport(report.id, config)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('Download started', fileName)
    } catch (error) {
      toast.error('Download failed', error instanceof Error ? error.message : 'The export could not be produced.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Assemble a reviewable dossier from the ingested catalogue, preview the exact wording, then export it as a document."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Reports' }]}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Table2 className="size-4" />}
              onClick={() => void runPreview()}
              isLoading={isPreviewing}
              loadingText="Building preview…"
              disabled={isGenerating}
            >
              Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<FileText className="size-4" />}
              onClick={() => void handleGenerate()}
              isLoading={isGenerating}
              loadingText="Generating…"
            >
              Generate report
            </Button>
          </>
        }
        meta={
          <>
            <MetaItem label="Type" value={titleCase(config.reportType)} />
            <MetaItem label="Period" value={`${formatDate(config.dateFrom)} – ${formatDate(config.dateTo)}`} />
            <MetaItem label="Generated today" value={generated.length} />
          </>
        }
      />

      {previewError && (
        <ErrorState
          title="The report configuration needs attention"
          description={previewError}
          onRetry={() => setPreviewError(null)}
          retryLabel="Dismiss"
          className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Report configuration" description="Scope, metrics and output format" as="h3" />
            <div className="mt-4 space-y-4">
              <Input
                label="Report title"
                value={config.title}
                onChange={(event) => patch({ title: event.target.value })}
                required
                hint="Appears in the header of the exported document"
              />

              <fieldset>
                <legend className="text-xs font-medium text-ink-secondary">Report type</legend>
                <div className="mt-2 space-y-1.5">
                  {REPORT_TYPES.map((type) => {
                    const isActive = config.reportType === type.value
                    return (
                      <label
                        key={type.value}
                        className={cn(
                          'flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 transition-colors',
                          isActive
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                            : 'border-line bg-surface hover:bg-surface-muted',
                        )}
                      >
                        <input
                          type="radio"
                          name="report-type"
                          value={type.value}
                          checked={isActive}
                          onChange={() => patch({ reportType: type.value })}
                          className="mt-0.5 size-3.5 cursor-pointer accent-brand-600"
                        />
                        <span className="min-w-0">
                          <span
                            className={cn(
                              'block text-xs font-medium',
                              isActive ? 'text-brand-900 dark:text-brand-100' : 'text-ink',
                            )}
                          >
                            {type.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">
                            {type.description}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <Select
                label="Location scope"
                value={config.location}
                onChange={(event) => patch({ location: event.target.value })}
              >
                <option value="all">All stations</option>
                {STATION_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="date"
                  label="Period from"
                  value={config.dateFrom}
                  max={config.dateTo}
                  onChange={(event) => patch({ dateFrom: event.target.value })}
                  error={dateError}
                  required
                />
                <Input
                  type="date"
                  label="Period to"
                  value={config.dateTo}
                  min={config.dateFrom}
                  onChange={(event) => patch({ dateTo: event.target.value })}
                  required
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Sections and metrics" description="Choose what the document contains" as="h3" />
            <div className="mt-4 space-y-4">
              <fieldset>
                <legend className="text-xs font-medium text-ink-secondary">Metrics in the data table</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {METRIC_ROWS.map((row) => (
                    <Checkbox
                      key={row.key}
                      label={`${row.label} (${row.unit})`}
                      checked={config.metrics[row.key]}
                      onChange={(event) => patchMetric(row.key, event.target.checked)}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-ink-muted">
                  {selectedMetrics.length} of {METRIC_ROWS.length} metrics selected
                </p>
              </fieldset>

              <div className="space-y-3 border-t border-line pt-3">
                <Switch
                  label="Include charts"
                  description="Embed the trend and anomaly figures used in the assessment"
                  checked={config.includeCharts}
                  onCheckedChange={(value) => patch({ includeCharts: value })}
                />
                <Switch
                  label="Include anomaly register"
                  description="Append the anomaly table with severity and inspection status"
                  checked={config.includeAnomalies}
                  onCheckedChange={(value) => patch({ includeAnomalies: value })}
                />
                <Switch
                  label="Include methodology appendix"
                  description="Data provenance, cleaning rules applied and model version"
                  checked={config.includeMethodology}
                  onCheckedChange={(value) => patch({ includeMethodology: value })}
                />
              </div>

              <div className="border-t border-line pt-3">
                <SegmentedControl
                  label="Export format"
                  size="sm"
                  value={config.format}
                  onChange={(value) => patch({ format: value })}
                  options={[
                    { value: 'pdf' as const, label: 'PDF', icon: <FileText className="size-3" /> },
                    { value: 'csv' as const, label: 'CSV', icon: <FileSpreadsheet className="size-3" /> },
                    { value: 'xlsx' as const, label: 'XLSX', icon: <Table2 className="size-3" /> },
                  ]}
                />
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
                  <ShieldCheck className="mt-px size-3 shrink-0" aria-hidden="true" />
                  Exports carry a checksum and the generating user so a reviewer can confirm the file has not been
                  altered after issue.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-3">
          <Card padding="none">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                  <Printer className="size-3.5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Preview</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {preview ? 'Matches the current configuration' : 'Build a preview to review the wording'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {preview && (
                  <Badge tone={preview.severity} size="sm" dot>
                    {preview.anomalyCount} anomalies in period
                  </Badge>
                )}
                <Button size="sm" variant="secondary" onClick={() => void runPreview()} isLoading={isPreviewing}>
                  Refresh preview
                </Button>
              </div>
            </div>

            <div className="p-4">
              {isPreviewing && !preview ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : !preview ? (
                <EmptyState
                  icon={<Printer className="size-5" />}
                  title="No preview yet"
                  description="Configure the report on the left, then build a preview to see the exact headline figures and narrative that will be exported."
                  action={
                    <Button size="sm" variant="primary" onClick={() => void runPreview()}>
                      Build preview
                    </Button>
                  }
                />
              ) : (
                <article className="space-y-4">
                  <header className="border-b border-line pb-3">
                    <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">EarthScape</p>
                    <h3 className="mt-1 text-base font-semibold text-ink">{preview.title}</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {preview.subtitle} · {preview.location} · {preview.periodLabel}
                    </p>
                  </header>

                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {preview.headlineMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-md border border-line bg-surface-muted px-3 py-2">
                        <dt className="text-[11px] text-ink-muted">{metric.label}</dt>
                        <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{metric.value}</dd>
                        <dd className="mt-0.5 text-[11px] text-ink-muted">{metric.delta}</dd>
                      </div>
                    ))}
                  </dl>

                  {preview.summaryParagraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)} className="text-xs leading-relaxed text-ink-secondary">
                      {paragraph}
                    </p>
                  ))}

                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-max border-collapse text-left text-xs">
                      <caption className="sr-only">Station summary table</caption>
                      <thead>
                        <tr className="border-b border-line bg-surface-muted">
                          <th scope="col" className="px-3 py-2 font-semibold tracking-wide text-ink-muted uppercase">
                            Station
                          </th>
                          {selectedMetrics.map((metric) => (
                            <th
                              key={metric.key}
                              scope="col"
                              className="px-3 py-2 text-right font-semibold tracking-wide text-ink-muted uppercase"
                            >
                              {metric.label} <span className="font-normal normal-case">({metric.unit})</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.tableRows.map((row) => (
                          <tr key={row.label} className="border-b border-line last:border-0">
                            <th scope="row" className="px-3 py-2 text-left font-medium text-ink">
                              {row.label}
                            </th>
                            {selectedMetrics.map((metric) => (
                              <td key={metric.key} className="px-3 py-2 text-right tabular-nums text-ink-secondary">
                                {tableCell(row, metric.key)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Sections included</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {preview.sectionsIncluded.map((section) => (
                        <li key={section}>
                          <Badge tone="outline">{section}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge severity={preview.severity} label={`${titleCase(preview.severity)} risk`} />
                      <span className="text-[11px] text-ink-muted">
                        {preview.anomalyCount} anomalies recorded in this period
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      leadingIcon={<FileText className="size-4" />}
                      onClick={() => void handleGenerate()}
                      isLoading={isGenerating}
                      loadingText="Generating…"
                    >
                      Generate {config.format.toUpperCase()}
                    </Button>
                  </footer>
                </article>
              )}
            </div>
          </Card>

          <Card padding="none">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                  <History className="size-3.5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Report history</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatInteger(generated.length)} {generated.length === 1 ? 'report' : 'reports'} issued by this
                    workspace
                  </p>
                </div>
              </div>
            </div>

            {history.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : history.error ? (
              <ErrorState description={history.error} onRetry={() => history.reload()} className="m-4" />
            ) : generated.length === 0 ? (
              <EmptyState
                title="No reports issued yet"
                description="Generated dossiers appear here with their format, size and issuing user."
              />
            ) : (
              <ul className="divide-y divide-line">
                {generated.map((report) => (
                  <li key={report.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted text-ink-secondary">
                      <FileText className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-xs font-medium text-ink">{report.title}</p>
                        <Badge tone={STATUS_TONE[report.status]} size="sm" dot>
                          {report.status}
                        </Badge>
                        <Badge tone="outline" size="sm">
                          {report.format.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {report.location} · {report.periodLabel} · {formatDateTime(report.createdAt)} ·{' '}
                        {formatInteger(report.sizeKb)} KB · {report.createdBy}
                      </p>
                    </div>
                    <IconButton
                      label={`Download ${report.title}`}
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDownload(report)}
                      disabled={report.status !== 'ready' || downloadingId !== null}
                    >
                      {downloadingId === report.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="size-3.5" aria-hidden="true" />
                      )}
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
