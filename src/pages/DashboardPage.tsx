import { useMemo, useState } from 'react'
import { Activity, Filter, RotateCcw, ShieldCheck, Sigma, X } from 'lucide-react'
import { MetaItem, PageHeader, PageTabs } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge, severityTone } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable } from '@/components/common/DataTable'
import { Select } from '@/components/common/Form'
import { SearchInput } from '@/components/common/SearchInput'
import { StatTile } from '@/components/common/Progress'
import { Modal } from '@/components/common/Modal'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useToast } from '@/hooks/useToast'
import { alertService } from '@/services'
import { DATA_PERIOD, METRIC_LABELS, METRIC_UNITS, STATION_LOCATIONS } from '@/data/climate'
import { ROUTES } from '@/routes/paths'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatNumber } from '@/utils/format'
import type { Anomaly, AnomalyFilters, ClimateMetric, Severity } from '@/types'

type StatusFilter = AnomalyFilters['status']
type TabId = 'register' | 'methodology'

const STATUS_TONE = {
  open: 'critical',
  investigating: 'warning',
  resolved: 'normal',
  'false-positive': 'neutral',
} as const

const BASE_FILTERS: AnomalyFilters = {
  search: '',
  location: 'all',
  metric: 'all',
  severity: 'all',
  status: 'all',
  dateFrom: DATA_PERIOD.from,
  dateTo: DATA_PERIOD.to,
}

const METHODOLOGY = [
  {
    title: 'Robust z-score',
    body: 'Each reading is compared to a 30-day rolling median with the median absolute deviation (MAD) as the scale estimator, so a single extreme value cannot inflate the band that is meant to catch it.',
  },
  {
    title: 'Seasonal envelope',
    body: 'Expected bounds are derived per station and per calendar week, reflecting the local seasonal cycle rather than a flat annual threshold.',
  },
  {
    title: 'Isolation forest',
    body: 'An unsupervised ensemble scores each observation on how easily it can be separated from the rest of the window. Events flagged by both methods are escalated.',
  },
  {
    title: 'Escalation rule',
    body: 'A deviation beyond three robust sigma is flagged high; beyond four sigma it is flagged critical and an alert is raised to the on-duty analyst.',
  },
]

export function DashboardPage() {
  const toast = useToast()
  const [tab, setTab] = useState<TabId>('register')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('all')
  const [metric, setMetric] = useState<ClimateMetric | 'all'>('all')
  const [severity, setSeverity] = useState<Severity | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState(DATA_PERIOD.from)
  const [dateTo, setDateTo] = useState(DATA_PERIOD.to)
  const [pending, setPending] = useState<Anomaly | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 250)

  const filters = useMemo<AnomalyFilters>(
    () => ({ ...BASE_FILTERS, search: debouncedSearch, location, metric, severity, status, dateFrom, dateTo }),
    [debouncedSearch, location, metric, severity, status, dateFrom, dateTo],
  )

  const anomalies = useAsync(() => alertService.listAnomalies(filters), [filters])
  const counts = useAsync(() => alertService.getAnomalyCounts(), [])

  const isFiltered =
    debouncedSearch !== '' ||
    location !== 'all' ||
    metric !== 'all' ||
    severity !== 'all' ||
    status !== 'all' ||
    dateFrom !== DATA_PERIOD.from ||
    dateTo !== DATA_PERIOD.to

  const resetFilters = () => {
    setSearch('')
    setLocation('all')
    setMetric('all')
    setSeverity('all')
    setStatus('all')
    setDateFrom(DATA_PERIOD.from)
    setDateTo(DATA_PERIOD.to)
  }

  const handleStatusChange = async (anomaly: Anomaly, nextStatus: Anomaly['status']) => {
    setIsUpdating(true)
    try {
      await alertService.updateAnomalyStatus(anomaly.id, nextStatus)
      anomalies.setData((current) =>
        (current ?? []).map((entry) => (entry.id === anomaly.id ? { ...entry, status: nextStatus } : entry)),
      )
      toast.success('Anomaly updated', `${anomaly.id} moved to ${nextStatus.replace('-', ' ')}.`)
      setPending(null)
    } catch (error) {
      toast.error('Update failed', error instanceof Error ? error.message : 'The anomaly could not be updated.')
    } finally {
      setIsUpdating(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: 'Event',
        width: '8.5rem',
        mono: true,
        sortValue: (row: Anomaly) => row.id,
        accessor: (row: Anomaly) => (
          <button
            type="button"
            onClick={() => setPending(row)}
            className="font-mono text-xs font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-200"
          >
            {row.id}
          </button>
        ),
      },
      {
        key: 'detectedAt',
        header: 'Detected',
        width: '9rem',
        sortValue: (row: Anomaly) => row.detectedAt,
        accessor: (row: Anomaly) => <span className="whitespace-nowrap">{formatDateTime(row.detectedAt)}</span>,
      },
      {
        key: 'location',
        header: 'Location',
        width: '11rem',
        sortValue: (row: Anomaly) => row.location,
        accessor: (row: Anomaly) => (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink">{row.location}</p>
            <p className="truncate font-mono text-[10px] text-ink-muted">{row.stationId}</p>
          </div>
        ),
      },
      {
        key: 'metric',
        header: 'Metric',
        width: '8rem',
        sortValue: (row: Anomaly) => row.metric,
        accessor: (row: Anomaly) => METRIC_LABELS[row.metric],
      },
      {
        key: 'observed',
        header: 'Observed',
        align: 'right' as const,
        width: '7rem',
        mono: true,
        accessor: (row: Anomaly) => `${formatNumber(row.actualValue, 1)} ${METRIC_UNITS[row.metric]}`,
      },
      {
        key: 'expected',
        header: 'Expected band',
        align: 'right' as const,
        width: '10rem',
        mono: true,
        accessor: (row: Anomaly) =>
          `${formatNumber(row.expectedMin, 1)} – ${formatNumber(row.expectedMax, 1)}`,
      },
      {
        key: 'deviationSigma',
        header: 'σ',
        align: 'right' as const,
        width: '6rem',
        mono: true,
        sortValue: (row: Anomaly) => row.deviationSigma,
        accessor: (row: Anomaly) => (
          <span className="inline-flex items-center gap-1">
            <Sigma className="size-3 text-ink-faint" aria-hidden="true" />
            {formatNumber(row.deviationSigma, 1)}
          </span>
        ),
      },
      {
        key: 'severity',
        header: 'Severity',
        width: '7rem',
        sortValue: (row: Anomaly) => row.severity,
        accessor: (row: Anomaly) => (
          <Badge tone={severityTone(row.severity)} size="sm" dot>
            {row.severity}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '8.5rem',
        sortValue: (row: Anomaly) => row.status,
        accessor: (row: Anomaly) => (
          <Badge tone={STATUS_TONE[row.status]} size="sm">
            {row.status === 'false-positive' ? 'False positive' : row.status}
          </Badge>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="Anomaly register"
        description="Statistical events detected across the station network, with the expected seasonal envelope and the evidence behind each flag."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Anomalies' }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Activity className="size-4" />}
            onClick={anomalies.reload}
            isLoading={anomalies.isLoading}
          >
            Rescan window
          </Button>
        }
        meta={
          <>
            <MetaItem label="Window" value={`${formatDate(dateFrom)} – ${formatDate(dateTo)}`} />
            <MetaItem label="Method" value="Robust z-score + isolation forest" />
            <MetaItem
              label="Open"
              value={
                <Badge tone={counts.isLoading ? 'neutral' : 'critical'} size="sm">
                  {counts.data?.open ?? '—'}
                </Badge>
              }
            />
          </>
        }
        tabs={
          <PageTabs
            tabs={[
              { id: 'register', label: 'Event register', count: anomalies.data?.length },
              { id: 'methodology', label: 'Detection method' },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as TabId)}
          />
        }
      />

      {tab === 'register' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Total events"
              value={anomalies.isLoading ? '—' : (anomalies.data?.length ?? 0)}
              hint="Matching current filters"
              icon={<Activity className="size-4" />}
            />
            <StatTile
              label="Open"
              value={counts.data?.open ?? '—'}
              hint="Awaiting triage"
              tone="critical"
            />
            <StatTile
              label="Investigating"
              value={counts.data?.investigating ?? '—'}
              hint="Assigned to an analyst"
              tone="warning"
            />
            <StatTile
              label="Closed"
              value={counts.data?.resolved ?? '—'}
              hint="Resolved or false positive"
              tone="brand"
            />
          </div>

          <Card padding="sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="xl:col-span-2">
                <SearchInput
                  value={search}
                  onValueChange={setSearch}
                  label="Search anomalies"
                  placeholder="Search event ID, location or note"
                  size="sm"
                />
              </div>
              <Select
                selectSize="sm"
                label="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                <option value="all">All locations</option>
                {STATION_LOCATIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Select>
              <Select
                selectSize="sm"
                label="Metric"
                value={metric}
                onChange={(event) => setMetric(event.target.value as ClimateMetric | 'all')}
              >
                <option value="all">All metrics</option>
                {(Object.keys(METRIC_LABELS) as ClimateMetric[]).map((entry) => (
                  <option key={entry} value={entry}>
                    {METRIC_LABELS[entry]}
                  </option>
                ))}
              </Select>
              <Select
                selectSize="sm"
                label="Severity"
                value={severity}
                onChange={(event) => setSeverity(event.target.value as Severity | 'all')}
              >
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="warning">Warning</option>
                <option value="normal">Normal</option>
              </Select>
              <Select
                selectSize="sm"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
              >
                <option value="all">Any status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false-positive">False positive</option>
              </Select>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Filter className="size-3.5" aria-hidden="true" />
                {isFiltered ? 'Custom filters applied' : 'Showing every event in the window'}
              </p>
              {isFiltered && (
                <Button variant="ghost" size="xs" leadingIcon={<RotateCcw className="size-3.5" />} onClick={resetFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          </Card>

          <DataTable<Anomaly>
            caption="Detected climate anomalies"
            columns={columns}
            rows={anomalies.data ?? []}
            rowKey={(row) => row.id}
            isLoading={anomalies.isLoading}
            error={anomalies.error}
            onRetry={anomalies.reload}
            emptyTitle="No anomalies match these filters"
            emptyDescription="Either the window is quiet or the filters are too narrow. Reset them to see the full register."
            emptyAction={
              isFiltered ? (
                <Button size="sm" variant="secondary" leadingIcon={<X className="size-3.5" />} onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
            onRowClick={(row) => setPending(row)}
          />
        </div>
      )}

      {tab === 'methodology' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {METHODOLOGY.map((item, index) => (
            <Card key={item.title}>
              <CardHeader
                title={item.title}
                as="h3"
                icon={<ShieldCheck className="size-3.5" />}
                badge={<Badge tone="neutral" size="sm">Step {index + 1}</Badge>}
              />
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
            </Card>
          ))}
          <Card className="lg:col-span-2">
            <CardHeader title="Reproducibility" description="What an analyst can rely on" as="h3" />
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-secondary">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                Every flag stores the observed value, the expected bounds and the sigma distance used to raise it.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                Re-running detection on the same window reproduces the same register — the mock layer is deterministic by
                design.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                Resolving an event records who changed it and when, so compliance dossiers can cite the audit trail.
              </li>
            </ul>
          </Card>
        </div>
      )}

      <Modal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? `Anomaly ${pending.id}` : 'Anomaly'}
        description={pending ? `${METRIC_LABELS[pending.metric]} deviation at ${pending.location}` : undefined}
        size="md"
        footer={
          pending && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setPending(null)} disabled={isUpdating}>
                Close
              </Button>
              {pending.status !== 'false-positive' && pending.status !== 'resolved' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleStatusChange(pending, 'false-positive')}
                  disabled={isUpdating}
                >
                  Mark false positive
                </Button>
              )}
              {pending.status === 'open' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleStatusChange(pending, 'investigating')}
                  disabled={isUpdating}
                  isLoading={isUpdating}
                >
                  Start investigating
                </Button>
              )}
              {pending.status !== 'resolved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleStatusChange(pending, 'resolved')}
                  disabled={isUpdating}
                >
                  Resolve event
                </Button>
              )}
            </>
          )
        }
      >
        {pending && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={severityTone(pending.severity)} size="md" dot>
                {pending.severity}
              </Badge>
              <Badge tone={STATUS_TONE[pending.status]} size="md">
                {pending.status === 'false-positive' ? 'False positive' : pending.status}
              </Badge>
              <Badge tone="outline" size="md">
                {pending.confidencePercent}% confidence
              </Badge>
            </div>

            <p className="text-sm leading-relaxed text-ink-secondary">{pending.note}</p>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Detail label="Observed" value={`${formatNumber(pending.actualValue, 1)} ${METRIC_UNITS[pending.metric]}`} />
              <Detail label="Expected minimum" value={`${formatNumber(pending.expectedMin, 1)} ${METRIC_UNITS[pending.metric]}`} />
              <Detail label="Expected maximum" value={`${formatNumber(pending.expectedMax, 1)} ${METRIC_UNITS[pending.metric]}`} />
              <Detail label="Deviation" value={formatNumber(pending.deviation, 1)} />
              <Detail label="Sigma distance" value={`${formatNumber(pending.deviationSigma, 1)} σ`} />
              <Detail label="Method" value={pending.zScoreMethod} />
              <Detail label="Station" value={pending.stationId} />
              <Detail label="Detected" value={formatDateTime(pending.detectedAt)} />
              <Detail label="Confidence" value={`${pending.confidencePercent}%`} />
            </dl>

            <div className="rounded-md border border-line bg-surface-muted p-3">
              <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Interpretation</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                The reading sits {formatNumber(pending.deviationSigma, 1)} robust sigma outside the seasonal envelope for
                this station, which places it in the {pending.severity} band. Cross-check the neighbouring stations in{' '}
                {pending.location} before escalating — a regional event is usually accompanied by correlated shifts.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-2.5 py-2">
      <dt className="text-[10px] tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-xs font-medium text-ink">{value}</dd>
    </div>
  )
}
