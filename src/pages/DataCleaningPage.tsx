import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Database, Filter, PlayCircle, Rows3, Trash2 } from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Checkbox, Select } from '@/components/common/Form'
import { ProgressBar, ScoreRing, StatTile } from '@/components/common/Progress'
import { EmptyState, ErrorState } from '@/components/common/States'
import { Skeleton } from '@/components/common/Skeleton'
import { DataTable } from '@/components/common/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { cleaningService } from '@/services'
import { ROUTES } from '@/routes/paths'
import { formatDateTime } from '@/utils/date'
import { formatInteger, formatNumber, formatPercent, pluralise } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CleaningIssue, CleaningSummary } from '@/types'

type CategoryFilter = 'all' | CleaningIssue['category']

const CATEGORY_LABELS: Record<CleaningIssue['category'], string> = {
  missing: 'Missing values',
  duplicate: 'Duplicates',
  invalid: 'Invalid values',
  outlier: 'Outliers',
  format: 'Formatting',
}

const CATEGORY_TONES: Record<CleaningIssue['category'], 'warning' | 'info' | 'critical' | 'neutral'> = {
  missing: 'warning',
  duplicate: 'info',
  invalid: 'critical',
  outlier: 'warning',
  format: 'neutral',
}

const ACTION_LABELS: Record<CleaningIssue['action'], string> = {
  impute: 'Impute',
  drop: 'Drop row',
  clip: 'Clip to bounds',
  cast: 'Cast type',
  flag: 'Flag only',
}

export function DataCleaningPage() {
  const toast = useToast()
  const datasets = useAsync(() => cleaningService.listCleanableDatasets(), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [enabledRules, setEnabledRules] = useState<string[]>([])
  const [summary, setSummary] = useState<CleaningSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)

  useEffect(() => {
    const first = datasets.data?.[0]
    if (first && selectedId === null) setSelectedId(first.datasetId)
  }, [datasets.data, selectedId])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setIsLoadingSummary(true)
    setSummaryError(null)
    setHasRun(false)
    cleaningService
      .getCleaningSummary(selectedId)
      .then((result) => {
        if (cancelled) return
        setSummary(result)
        setEnabledRules(result.issues.filter((issue) => issue.severity !== 'info').map((issue) => issue.id))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSummary(null)
        setSummaryError(error instanceof Error ? error.message : 'The cleaning summary could not be loaded.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSummary(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, retryNonce])

  const visibleIssues = useMemo(() => {
    if (!summary) return []
    return category === 'all' ? summary.issues : summary.issues.filter((issue) => issue.category === category)
  }, [summary, category])

  const affectedInView = visibleIssues.reduce((total, issue) => total + issue.affectedRows, 0)

  const toggleRule = (issue: CleaningIssue) => {
    setEnabledRules((current) =>
      current.includes(issue.id) ? current.filter((id) => id !== issue.id) : [...current, issue.id],
    )
  }

  const handleRun = async () => {
    if (!summary) return
    if (enabledRules.length === 0) {
      toast.error('No rules selected', 'Enable at least one cleaning rule before running the pipeline.')
      return
    }
    setIsRunning(true)
    try {
      const result = await cleaningService.runCleaning(summary.datasetId, enabledRules)
      setSummary(result)
      setHasRun(true)
      toast.success(
        'Cleaning pipeline finished',
        `${enabledRules.length} ${pluralise(enabledRules.length, 'rule')} applied to ${formatInteger(result.totalRecords)} records.`,
      )
    } catch (error) {
      toast.error('Cleaning run failed', error instanceof Error ? error.message : 'The pipeline did not complete.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Data cleaning"
        description="Inspect data quality issues, choose the rules the pipeline should apply, and run the cleaning job against a dataset."
        breadcrumb={[
          { label: 'Climate data', to: ROUTES.climateData },
          { label: 'Data cleaning' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<PlayCircle className="size-4" />}
            onClick={() => void handleRun()}
            isLoading={isRunning}
            loadingText="Running pipeline…"
            disabled={!summary || isLoadingSummary}
          >
            Run cleaning
          </Button>
        }
        meta={
          <>
            <MetaItem label="Datasets in queue" value={datasets.data?.length ?? '—'} />
            <MetaItem label="Rules enabled" value={enabledRules.length} />
            <MetaItem label="Last run" value={hasRun && summary ? formatDateTime(summary.processedAt) : 'Not run yet'} />
          </>
        }
      />

      {datasets.error && (
        <ErrorState
          title="The cleaning queue is unavailable"
          description={datasets.error}
          onRetry={() => datasets.reload()}
          className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-1" padding="sm">
          <CardHeader title="Datasets" description="Awaiting review" as="h3" icon={<Database className="size-3.5" />} />
          <div className="mt-3">
            {datasets.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : (datasets.data?.length ?? 0) === 0 ? (
              <EmptyState
                size="sm"
                title="Queue is empty"
                description="Upload a dataset to add it to the cleaning queue."
                action={
                  <Link
                    to={ROUTES.dataUpload}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-muted"
                  >
                    Upload dataset
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-1.5" role="radiogroup" aria-label="Dataset to clean">
                {datasets.data?.map((dataset) => {
                  const isActive = dataset.datasetId === selectedId
                  return (
                    <li key={dataset.datasetId}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setSelectedId(dataset.datasetId)}
                        className={cn(
                          'w-full rounded-md border px-3 py-2.5 text-left transition-colors',
                          isActive
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                            : 'border-line bg-surface hover:border-line-strong hover:bg-surface-muted',
                        )}
                      >
                        <p className={cn('text-xs font-medium', isActive ? 'text-brand-900 dark:text-brand-100' : 'text-ink')}>
                          {dataset.datasetName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          {formatInteger(dataset.totalRecords)} records · {dataset.columnCount} columns
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-3">
          {summaryError && (
            <ErrorState
              title="The dataset summary could not be loaded"
              description={summaryError}
              onRetry={() => setRetryNonce((value) => value + 1)}
            />
          )}

          {isLoadingSummary && !summary && (
            <Card>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
              <Skeleton className="mt-4 h-40 w-full" />
            </Card>
          )}

          {!summary && !isLoadingSummary && !summaryError && (
            <Card>
              <EmptyState
                title="Select a dataset"
                description="Choose a dataset from the queue to review its quality profile and cleaning rules."
              />
            </Card>
          )}

          {summary && (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-ink">{summary.datasetName}</h2>
                      <Badge tone={hasRun ? 'normal' : 'warning'} size="sm" dot>
                        {hasRun ? 'Pipeline applied' : 'Review pending'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatInteger(summary.totalRecords)} records · {summary.columnCount} columns · assessed{' '}
                      {formatDateTime(summary.processedAt)}
                    </p>
                  </div>
                  <ScoreRing
                    value={hasRun ? summary.qualityScoreAfter : summary.qualityScoreBefore}
                    label={hasRun ? 'Quality after' : 'Quality before'}
                    caption={hasRun ? `was ${summary.qualityScoreBefore}` : 'before cleaning'}
                    size={92}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <StatTile
                    label="Missing"
                    value={formatInteger(summary.missingValues)}
                    hint="cells to impute"
                    icon={<AlertTriangle className="size-3.5" />}
                    tone={summary.missingValues > 0 ? 'warning' : 'neutral'}
                  />
                  <StatTile
                    label="Duplicates"
                    value={formatInteger(summary.duplicateRecords)}
                    hint="repeated rows"
                    icon={<Rows3 className="size-3.5" />}
                    tone={summary.duplicateRecords > 0 ? 'warning' : 'neutral'}
                  />
                  <StatTile
                    label="Invalid"
                    value={formatInteger(summary.invalidRecords)}
                    hint="unparseable"
                    icon={<AlertTriangle className="size-3.5" />}
                    tone={summary.invalidRecords > 0 ? 'critical' : 'neutral'}
                  />
                  <StatTile
                    label="Outliers"
                    value={formatInteger(summary.outlierRecords)}
                    hint="beyond 3σ"
                    icon={<AlertTriangle className="size-3.5" />}
                    tone={summary.outlierRecords > 0 ? 'warning' : 'neutral'}
                  />
                  <StatTile
                    label="Clean"
                    value={formatInteger(summary.cleanRecords)}
                    hint="pass all rules"
                    icon={<CheckCircle2 className="size-3.5" />}
                    tone="neutral"
                  />
                </div>

                {hasRun && (
                  <div className="mt-4 rounded-md border border-state-normal-200 bg-state-normal-50 px-3 py-3 dark:border-state-normal-700 dark:bg-state-normal-900/30">
                    <p className="text-xs font-medium text-state-normal-800 dark:text-state-normal-200">
                      Quality score improved from {summary.qualityScoreBefore} to {summary.qualityScoreAfter}
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <ProgressBar
                        value={summary.qualityScoreBefore}
                        label="Before"
                        size="xs"
                        tone="critical"
                        valueFormatter={(value) => String(value)}
                      />
                      <ProgressBar
                        value={summary.qualityScoreAfter}
                        label="After"
                        size="xs"
                        tone="normal"
                        valueFormatter={(value) => String(value)}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-state-normal-700 dark:text-state-normal-200">
                      <Trash2 className="mr-1 inline size-3 align-[-2px]" aria-hidden="true" />
                      Rows removed by the pipeline are retained in the audit log for 30 days so a reviewer can restore
                      them.
                    </p>
                  </div>
                )}
              </Card>

              <Card padding="none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                      <Filter className="size-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">Cleaning rules</h3>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {visibleIssues.length} of {summary.issues.length} {pluralise(summary.issues.length, 'issue')} ·{' '}
                        {formatInteger(affectedInView)} rows affected
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      selectSize="sm"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as CategoryFilter)}
                      className="w-auto"
                      aria-label="Filter issues by category"
                    >
                      <option value="all">All categories</option>
                      {(Object.keys(CATEGORY_LABELS) as Array<CleaningIssue['category']>).map((key) => (
                        <option key={key} value={key}>
                          {CATEGORY_LABELS[key]}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setEnabledRules(
                          visibleIssues.filter((issue) => issue.severity !== 'info').map((issue) => issue.id),
                        )
                      }
                      disabled={visibleIssues.length === 0}
                    >
                      Select all
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEnabledRules([])} disabled={enabledRules.length === 0}>
                      Clear
                    </Button>
                  </div>
                </div>

                {visibleIssues.length === 0 ? (
                  <EmptyState
                    title="No issues in this category"
                    description={
                      summary.issues.length === 0
                        ? 'This dataset passed every quality rule on assessment.'
                        : 'Choose a different category to review the remaining issues.'
                    }
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {visibleIssues.map((issue) => {
                      const isEnabled = enabledRules.includes(issue.id)
                      return (
                        <li
                          key={issue.id}
                          className={cn(
                            'flex flex-wrap items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-muted',
                            isEnabled && 'bg-surface-muted/60',
                          )}
                        >
                          <Checkbox
                            className="mt-0.5 min-w-0 flex-1"
                            label={
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{issue.rule}</span>
                                <Badge tone={CATEGORY_TONES[issue.category]} size="sm">
                                  {CATEGORY_LABELS[issue.category]}
                                </Badge>
                                <Badge tone="outline" size="sm">
                                  {issue.column}
                                </Badge>
                              </span>
                            }
                            description={issue.description}
                            checked={isEnabled}
                            disabled={isRunning}
                            onChange={() => toggleRule(issue)}
                          />
                          <div className="flex shrink-0 items-center gap-3 text-right">
                            <div>
                              <p className="text-[10px] tracking-wide text-ink-muted uppercase">Affected</p>
                              <p className="text-xs font-semibold tabular-nums text-ink">
                                {formatInteger(issue.affectedRows)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] tracking-wide text-ink-muted uppercase">Action</p>
                              <p className="text-xs font-medium text-ink-secondary">{ACTION_LABELS[issue.action]}</p>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Column profile" description="Distribution before cleaning" as="h3" />
                  <div className="mt-4 overflow-x-auto scrollbar-thin">
                    <DataTable
                      caption="Column profile before cleaning"
                      columns={[
                        {
                          key: 'column',
                          header: 'Column',
                          sortable: true,
                          accessor: (row) => <span className="font-mono text-xs">{row.column}</span>,
                        },
                        {
                          key: 'dtype',
                          header: 'Type',
                          accessor: (row) => <span className="text-xs text-ink-secondary">{row.dtype}</span>,
                        },
                        {
                          key: 'nullRate',
                          header: 'Nulls',
                          align: 'right',
                          sortable: true,
                          accessor: (row) => (
                            <span
                              className={cn(
                                'text-xs tabular-nums',
                                row.nullRate > 0.05
                                  ? 'text-state-warning-700 dark:text-state-warning-200'
                                  : 'text-ink-secondary',
                              )}
                            >
                              {formatPercent(row.nullRate * 100, 1)}
                            </span>
                          ),
                        },
                        {
                          key: 'range',
                          header: 'Range',
                          align: 'right',
                          accessor: (row) => (
                            <span className="text-xs tabular-nums text-ink-secondary">
                              {row.min === null || row.max === null
                                ? '—'
                                : `${formatNumber(row.min, 1)} → ${formatNumber(row.max, 1)}`}
                            </span>
                          ),
                        },
                      ]}
                      rows={summary.columnProfiles}
                      rowKey={(row) => row.column}
                      emptyTitle="No column profile available"
                      emptyDescription="The dataset has no numeric columns to profile."
                      columnVisibilityEnabled={false}
                    />
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Impact preview" description="Expected effect of the enabled rules" as="h3" />
                  <div className="mt-4 space-y-3">
                    {summary.beforeAfter.map((entry) => {
                      const delta = entry.after - entry.before
                      const isPositive = delta > 0
                      return (
                        <div key={entry.dimension}>
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-xs text-ink-secondary">{entry.dimension}</p>
                            <p className="text-xs tabular-nums text-ink-muted">
                              <span className={cn('font-semibold', isPositive ? 'text-state-normal-700 dark:text-state-normal-200' : 'text-ink')}>
                                {formatInteger(entry.after)}
                              </span>{' '}
                              from {formatInteger(entry.before)}
                            </p>
                          </div>
                          <ProgressBar
                            value={entry.after}
                            max={Math.max(entry.before, entry.after, 1)}
                            label={`${entry.dimension} after cleaning`}
                            size="xs"
                            tone={isPositive ? 'normal' : 'warning'}
                            className="mt-1"
                            valueFormatter={(value) => formatInteger(value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
                    The pipeline runs in the Python cleaning service. With the mock transport these figures are
                    deterministic fixtures; against a live deployment they reflect the actual run, including any rows the
                    rules could not repair.
                  </p>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
