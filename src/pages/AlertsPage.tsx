import { useMemo, useState } from 'react'
import { BellRing, Check, Filter, RotateCcw, ShieldAlert, Siren, X } from 'lucide-react'
import { MetaItem, PageHeader, PageTabs } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge, severityTone } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { Select } from '@/components/common/Form'
import { SearchInput } from '@/components/common/SearchInput'
import { StatTile } from '@/components/common/Progress'
import { Modal } from '@/components/common/Modal'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useToast } from '@/hooks/useToast'
import { alertService } from '@/services'
import { METRIC_LABELS, STATION_LOCATIONS } from '@/data/climate'
import { ROUTES } from '@/routes/paths'
import { formatDateTime, relativeTime } from '@/utils/date'
import { formatNumber } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Alert, AlertFilters, ClimateMetric, Severity } from '@/types'

type StatusFilter = AlertFilters['status']
type TabId = 'inbox' | 'rules'

const STATUS_TONE = {
  active: 'critical',
  acknowledged: 'warning',
  resolved: 'normal',
} as const

const SOURCE_LABEL: Record<Alert['source'], string> = {
  'rule-engine': 'Threshold rule',
  'anomaly-model': 'Anomaly model',
  'prediction-model': 'Prediction model',
}

const RULES: Array<{
  id: string
  metric: ClimateMetric
  threshold: string
  severity: Severity
  scope: string
}> = [
  { id: 'R-101', metric: 'temperature', threshold: '> 38.0 °C for 30 min', severity: 'critical', scope: 'All stations' },
  { id: 'R-102', metric: 'rainfall', threshold: '> 120 mm in 24 h', severity: 'high', scope: 'Tropical stations' },
  { id: 'R-103', metric: 'windSpeed', threshold: '> 22 m/s sustained', severity: 'high', scope: 'Coastal stations' },
  { id: 'R-104', metric: 'humidity', threshold: '< 25 % for 2 h', severity: 'warning', scope: 'Arid stations' },
  { id: 'R-105', metric: 'pressure', threshold: 'Drop > 8 hPa in 3 h', severity: 'warning', scope: 'All stations' },
]

const BASE_FILTERS: AlertFilters = {
  search: '',
  severity: 'all',
  status: 'all',
  metric: 'all',
  location: 'all',
}

export function AlertsPage() {
  const toast = useToast()
  const [tab, setTab] = useState<TabId>('inbox')
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<Severity | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [metric, setMetric] = useState<ClimateMetric | 'all'>('all')
  const [location, setLocation] = useState('all')
  const [selected, setSelected] = useState<Alert | null>(null)
  const [pendingAction, setPendingAction] = useState<'acknowledge' | 'resolve' | null>(null)

  const debouncedSearch = useDebouncedValue(search, 250)

  const filters = useMemo<AlertFilters>(
    () => ({ ...BASE_FILTERS, search: debouncedSearch, severity, status, metric, location }),
    [debouncedSearch, severity, status, metric, location],
  )

  const alerts = useAsync(() => alertService.listAlerts(filters), [filters])
  const counts = useAsync(() => alertService.getAlertCounts(), [])

  const isFiltered =
    debouncedSearch !== '' || severity !== 'all' || status !== 'all' || metric !== 'all' || location !== 'all'

  const resetFilters = () => {
    setSearch('')
    setSeverity('all')
    setStatus('all')
    setMetric('all')
    setLocation('all')
  }

  const runAction = async (alert: Alert, action: 'acknowledge' | 'resolve') => {
    setPendingAction(action)
    try {
      const updated = action === 'acknowledge' ? await alertService.acknowledgeAlert(alert.id) : await alertService.resolveAlert(alert.id)
      alerts.setData((current) => (current ?? []).map((entry) => (entry.id === alert.id ? updated : entry)))
      setSelected((current) => (current && current.id === alert.id ? updated : current))
      toast.success(
        action === 'acknowledge' ? 'Alert acknowledged' : 'Alert resolved',
        `${alert.id} · ${alert.title}`,
      )
      counts.reload()
    } catch (error) {
      toast.error('Action failed', error instanceof Error ? error.message : 'The alert could not be updated.')
    } finally {
      setPendingAction(null)
    }
  }

  const rows = alerts.data ?? []

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Threshold breaches raised by the rule engine, anomaly model and prediction model. Acknowledge to assign ownership, resolve to close the loop."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Alerts' }]}
        actions={
          <Button variant="secondary" size="sm" leadingIcon={<BellRing className="size-4" />} onClick={alerts.reload} isLoading={alerts.isLoading}>
            Refresh
          </Button>
        }
        meta={
          <>
            <MetaItem label="Active" value={counts.data?.active ?? '—'} />
            <MetaItem
              label="Critical"
              value={
                <Badge tone={(counts.data?.critical ?? 0) > 0 ? 'critical' : 'normal'} size="sm">
                  {counts.data?.critical ?? '—'}
                </Badge>
              }
            />
            <MetaItem label="Resolved" value={counts.data?.resolved ?? '—'} />
          </>
        }
        tabs={
          <PageTabs
            tabs={[
              { id: 'inbox', label: 'Alert inbox', count: rows.length },
              { id: 'rules', label: 'Threshold rules', count: RULES.length },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as TabId)}
          />
        }
      />

      {tab === 'inbox' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Active" value={counts.data?.active ?? '—'} hint="Awaiting response" tone="critical" icon={<Siren className="size-4" />} />
            <StatTile label="Critical" value={counts.data?.critical ?? '—'} hint="Immediate escalation" tone="critical" />
            <StatTile label="Warning" value={counts.data?.warning ?? '—'} hint="Within response window" tone="warning" />
            <StatTile label="Resolved" value={counts.data?.resolved ?? '—'} hint="Closed this period" tone="brand" />
          </div>

          <Card padding="sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="xl:col-span-2">
                <SearchInput
                  value={search}
                  onValueChange={setSearch}
                  label="Search alerts"
                  placeholder="Search alert ID, title or location"
                  size="sm"
                />
              </div>
              <Select selectSize="sm" label="Severity" value={severity} onChange={(event) => setSeverity(event.target.value as Severity | 'all')}>
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="warning">Warning</option>
                <option value="normal">Normal</option>
              </Select>
              <Select selectSize="sm" label="Status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                <option value="all">Any status</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </Select>
              <Select selectSize="sm" label="Location" value={location} onChange={(event) => setLocation(event.target.value)}>
                <option value="all">All locations</option>
                {STATION_LOCATIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Filter className="size-3.5" aria-hidden="true" />
                {isFiltered ? 'Custom filters applied' : 'Showing every alert in the retention window'}
              </p>
              {isFiltered && (
                <Button variant="ghost" size="xs" leadingIcon={<RotateCcw className="size-3.5" />} onClick={resetFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          </Card>

          {alerts.error ? (
            <Card>
              <div className="p-6 text-center text-sm text-state-critical-700 dark:text-state-critical-200" role="alert">
                {alerts.error}
              </div>
            </Card>
          ) : alerts.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="h-24 animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink-faint">
                  <ShieldAlert className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">No alerts match these filters</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Either the network is quiet or the filters are too narrow.
                  </p>
                </div>
                {isFiltered && (
                  <Button size="sm" variant="secondary" leadingIcon={<X className="size-3.5" />} onClick={resetFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <ul className="space-y-2.5">
              {rows.map((alert) => (
                <li key={alert.id}>
                  <Card
                    interactive
                    className={cn(
                      alert.severity === 'critical' && alert.status === 'active' && 'border-l-2 border-l-state-critical-500',
                      alert.severity === 'high' && alert.status === 'active' && 'border-l-2 border-l-state-high-500',
                      alert.severity === 'warning' && alert.status === 'active' && 'border-l-2 border-l-state-warning-500',
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelected(alert)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] text-ink-muted">{alert.id}</span>
                          <Badge tone={severityTone(alert.severity)} size="sm" dot>
                            {alert.severity}
                          </Badge>
                          <Badge tone={STATUS_TONE[alert.status]} size="sm">
                            {alert.status}
                          </Badge>
                          <Badge tone="outline" size="sm">
                            {SOURCE_LABEL[alert.source]}
                          </Badge>
                        </div>
                        <h3 className="mt-1.5 text-sm font-semibold text-ink">{alert.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{alert.description}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-faint">
                          <span>{alert.location}</span>
                          <span>{METRIC_LABELS[alert.metric]}</span>
                          <span>
                            Observed {formatNumber(alert.observedValue, 1)} {alert.unit} · limit{' '}
                            {formatNumber(alert.threshold, 1)} {alert.unit}
                          </span>
                          <span>{relativeTime(alert.triggeredAt)}</span>
                        </p>
                      </button>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {alert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            leadingIcon={<Check className="size-3.5" />}
                            onClick={() => void runAction(alert, 'acknowledge')}
                            isLoading={pendingAction === 'acknowledge'}
                            disabled={pendingAction !== null}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => void runAction(alert, 'resolve')}
                            isLoading={pendingAction === 'resolve'}
                            disabled={pendingAction !== null}
                          >
                            Resolve
                          </Button>
                        )}
                        <IconButton label={`Inspect ${alert.id}`} size="sm" variant="ghost" onClick={() => setSelected(alert)}>
                          <BellRing className="size-4" aria-hidden="true" />
                        </IconButton>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'rules' && (
        <Card padding="none">
          <div className="p-[var(--surface-pad)] pb-3">
            <CardHeader
              title="Threshold rules"
              description="Deterministic guards evaluated on every incoming observation"
              as="h3"
              icon={<ShieldAlert className="size-3.5" />}
              actions={
                <Button size="xs" variant="secondary" onClick={() => undefined} disabled title="Rule editing requires a connected configuration service">
                  New rule
                </Button>
              }
            />
          </div>
          <div className="overflow-x-auto border-t border-line scrollbar-thin">
            <table className="w-full min-w-max text-left text-sm">
              <caption className="sr-only">Configured alert threshold rules</caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted">
                  {['Rule', 'Metric', 'Condition', 'Scope', 'Severity'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-[var(--cell-pad-x)] py-2 text-[11px] font-semibold tracking-wide text-ink-muted uppercase"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RULES.map((rule) => (
                  <tr key={rule.id} className="border-b border-line last:border-0 transition-colors hover:bg-surface-muted">
                    <td className="px-[var(--cell-pad-x)] py-[var(--row-pad-y)] font-mono text-xs text-ink-secondary">
                      {rule.id}
                    </td>
                    <td className="px-[var(--cell-pad-x)] py-[var(--row-pad-y)] text-xs text-ink-secondary">
                      {METRIC_LABELS[rule.metric]}
                    </td>
                    <td className="px-[var(--cell-pad-x)] py-[var(--row-pad-y)] font-mono text-xs text-ink-secondary">
                      {rule.threshold}
                    </td>
                    <td className="px-[var(--cell-pad-x)] py-[var(--row-pad-y)] text-xs text-ink-secondary">
                      {rule.scope}
                    </td>
                    <td className="px-[var(--cell-pad-x)] py-[var(--row-pad-y)]">
                      <Badge tone={severityTone(rule.severity)} size="sm" dot>
                        {rule.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-[var(--surface-pad)] py-2.5 text-[11px] text-ink-muted">
            Rules are evaluated in order of severity. A critical breach suppresses lower-severity alerts for the same
            station and metric until it is acknowledged.
          </p>
        </Card>
      )}

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? selected.title : 'Alert'}
        description={selected ? `${selected.id} · ${selected.location}` : undefined}
        size="md"
        footer={
          selected && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
              {selected.status === 'active' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void runAction(selected, 'acknowledge')}
                  isLoading={pendingAction === 'acknowledge'}
                >
                  Acknowledge
                </Button>
              )}
              {selected.status !== 'resolved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void runAction(selected, 'resolve')}
                  isLoading={pendingAction === 'resolve'}
                >
                  Resolve alert
                </Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={severityTone(selected.severity)} size="md" dot>
                {selected.severity}
              </Badge>
              <Badge tone={STATUS_TONE[selected.status]} size="md">
                {selected.status}
              </Badge>
              <Badge tone="outline" size="md">
                {SOURCE_LABEL[selected.source]}
              </Badge>
            </div>

            <p className="text-sm leading-relaxed text-ink-secondary">{selected.description}</p>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Detail label="Metric" value={METRIC_LABELS[selected.metric]} />
              <Detail label="Station" value={selected.stationId} />
              <Detail label="Observed" value={`${formatNumber(selected.observedValue, 1)} ${selected.unit}`} />
              <Detail label="Threshold" value={`${formatNumber(selected.threshold, 1)} ${selected.unit}`} />
              <Detail label="Triggered" value={formatDateTime(selected.triggeredAt)} />
              <Detail label="Acknowledged" value={selected.acknowledgedAt ? formatDateTime(selected.acknowledgedAt) : 'Not yet'} />
              <Detail label="Resolved" value={selected.resolvedAt ? formatDateTime(selected.resolvedAt) : 'Open'} />
            </dl>

            <div className="rounded-md border border-line bg-surface-muted p-3">
              <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Response guidance</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                Cross-reference the anomaly register for {selected.location} over the preceding 48 hours, then confirm
                sensor health before escalating to the field team. Record the outcome so the compliance dossier can cite
                a complete chain of evidence.
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
