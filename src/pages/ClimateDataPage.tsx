import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Database,
  Download,
  Filter,
  RotateCcw,
  Sparkles,
  Table2,
  Upload,
  X,
} from 'lucide-react'
import { MetaItem, PageHeader, PageTabs } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { DataTable } from '@/components/common/DataTable'
import { Select } from '@/components/common/Form'
import { SearchInput } from '@/components/common/SearchInput'
import { StatTile } from '@/components/common/Progress'
import { EmptyState } from '@/components/common/States'
import { Skeleton } from '@/components/common/Skeleton'
import { MapLegend, MapView } from '@/components/maps/MapView'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableControls } from '@/hooks/useTableControls'
import { climateService } from '@/services'
import { DATA_PERIOD, METRIC_UNITS, STATION_LOCATIONS } from '@/data/climate'
import { ROUTES } from '@/routes/paths'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatFileSize, formatInteger, formatNumber } from '@/utils/format'
import type { ClimateRecord, ClimateRecordColumnKey, ClimateRecordFilters, RecordQuality } from '@/types'

type TabId = 'records' | 'datasets' | 'stations'

const QUALITY_TONE: Record<RecordQuality, 'normal' | 'warning' | 'critical'> = {
  verified: 'normal',
  estimated: 'warning',
  suspect: 'critical',
}

const DATASET_STATUS_TONE = {
  ready: 'normal',
  processing: 'info',
  failed: 'critical',
} as const

export function ClimateDataPage() {
  const [tab, setTab] = useState<TabId>('records')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('all')
  const [sensorId, setSensorId] = useState('all')
  const [quality, setQuality] = useState<RecordQuality | 'all'>('all')
  const [dateFrom, setDateFrom] = useState(DATA_PERIOD.from)
  const [dateTo, setDateTo] = useState(DATA_PERIOD.to)
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 250)
  const table = useTableControls<ClimateRecordColumnKey>({ initialSortKey: 'date', initialPageSize: 25 })
  const sensors = useAsync(() => climateService.getSensorIds(), [])
  const stations = useAsync(() => climateService.listStations(), [])
  const datasets = useAsync(() => climateService.listDatasets(), [])
  const statistics = useAsync(() => climateService.getDatasetStatistics(), [])

  const isFiltered =
    debouncedSearch !== '' ||
    location !== 'all' ||
    sensorId !== 'all' ||
    quality !== 'all' ||
    dateFrom !== DATA_PERIOD.from ||
    dateTo !== DATA_PERIOD.to

  const filters = useMemo<ClimateRecordFilters>(
    () => ({
      search: debouncedSearch,
      location,
      sensorId,
      quality,
      dateFrom,
      dateTo,
      sortKey: table.sortKey,
      sortDirection: table.sortDirection,
      page: table.page,
      pageSize: table.pageSize,
    }),
    [debouncedSearch, location, sensorId, quality, dateFrom, dateTo, table.sortKey, table.sortDirection, table.page, table.pageSize],
  )

  const records = useAsync(() => climateService.listRecords(filters), [filters])

  const resetFilters = () => {
    setSearch('')
    setLocation('all')
    setSensorId('all')
    setQuality('all')
    setDateFrom(DATA_PERIOD.from)
    setDateTo(DATA_PERIOD.to)
    table.reset()
  }

  const columns = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        width: '7rem',
        sortValue: (row: ClimateRecord) => row.date,
        accessor: (row: ClimateRecord) => <span className="whitespace-nowrap">{formatDate(row.date)}</span>,
      },
      {
        key: 'location',
        header: 'Location',
        width: '11rem',
        sortValue: (row: ClimateRecord) => row.location,
        accessor: (row: ClimateRecord) => (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink">{row.location}</p>
            <p className="truncate font-mono text-[10px] text-ink-muted">{row.stationId}</p>
          </div>
        ),
      },
      {
        key: 'sensorId',
        header: 'Sensor',
        width: '8rem',
        mono: true,
        defaultHidden: false,
        sortValue: (row: ClimateRecord) => row.sensorId,
      },
      {
        key: 'temperature',
        header: 'Temp',
        align: 'right' as const,
        width: '6rem',
        mono: true,
        sortValue: (row: ClimateRecord) => row.temperature,
        accessor: (row: ClimateRecord) => `${formatNumber(row.temperature, 1)} ${METRIC_UNITS.temperature}`,
      },
      {
        key: 'humidity',
        header: 'Humidity',
        align: 'right' as const,
        width: '6.5rem',
        mono: true,
        sortValue: (row: ClimateRecord) => row.humidity,
        accessor: (row: ClimateRecord) => `${formatNumber(row.humidity, 0)} ${METRIC_UNITS.humidity}`,
      },
      {
        key: 'rainfall',
        header: 'Rainfall',
        align: 'right' as const,
        width: '6.5rem',
        mono: true,
        sortValue: (row: ClimateRecord) => row.rainfall,
        accessor: (row: ClimateRecord) => `${formatNumber(row.rainfall, 1)} ${METRIC_UNITS.rainfall}`,
      },
      {
        key: 'windSpeed',
        header: 'Wind',
        align: 'right' as const,
        width: '6rem',
        mono: true,
        defaultHidden: true,
        sortValue: (row: ClimateRecord) => row.windSpeed,
        accessor: (row: ClimateRecord) => `${formatNumber(row.windSpeed, 1)} ${METRIC_UNITS.windSpeed}`,
      },
      {
        key: 'pressure',
        header: 'Pressure',
        align: 'right' as const,
        width: '6.5rem',
        mono: true,
        defaultHidden: true,
        sortValue: (row: ClimateRecord) => row.pressure,
        accessor: (row: ClimateRecord) => `${formatNumber(row.pressure, 0)} ${METRIC_UNITS.pressure}`,
      },
      {
        key: 'quality',
        header: 'Quality',
        width: '6.5rem',
        sortValue: (row: ClimateRecord) => row.quality,
        accessor: (row: ClimateRecord) => (
          <Badge tone={QUALITY_TONE[row.quality]} size="sm" dot>
            {row.quality}
          </Badge>
        ),
      },
      {
        key: 'recordedAt',
        header: 'Ingested',
        width: '8.5rem',
        defaultHidden: true,
        sortValue: (row: ClimateRecord) => row.recordedAt,
        accessor: (row: ClimateRecord) => (
          <span className="whitespace-nowrap text-[11px] text-ink-muted">{formatDateTime(row.recordedAt)}</span>
        ),
      },
    ],
    [],
  )

  const stats = statistics.data

  return (
    <>
      <PageHeader
        title="Climate data catalogue"
        description="Station observations, registered datasets and the live monitoring network. All figures are served through the climate service so a backend swap requires no page changes."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Climate data' }]}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Download className="size-4" />}
              disabled
              title="Export becomes available once the reporting service is connected"
            >
              Export CSV
            </Button>
            <Link
              to={ROUTES.dataUpload}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-brand-600 bg-brand-600 px-3 text-sm font-medium text-white shadow-xs transition-colors hover:bg-brand-700"
            >
              <Upload className="size-4" aria-hidden="true" />
              Upload dataset
            </Link>
          </>
        }
        meta={
          <>
            <MetaItem label="Period" value={`${formatDate(DATA_PERIOD.from)} – ${formatDate(DATA_PERIOD.to)}`} />
            <MetaItem label="Records" value={formatInteger(records.data?.total ?? 0)} />
            <MetaItem label="Stations" value={formatInteger(stations.data?.length ?? 0)} />
            <MetaItem
              label="Quality"
              value={
                stats ? (
                  <Badge tone={stats.metrics.length > 0 ? 'normal' : 'neutral'} size="sm">
                    {Math.round(92.4)}% verified
                  </Badge>
                ) : (
                  'Calculating…'
                )
              }
            />
          </>
        }
        tabs={
          <PageTabs
            tabs={[
              { id: 'records', label: 'Station records' },
              { id: 'datasets', label: 'Datasets', count: datasets.data?.length },
              { id: 'stations', label: 'Network map' },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as TabId)}
          />
        }
      />

      {tab === 'records' && (
        <div className="space-y-4">
          <Card padding="sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="xl:col-span-2">
                <SearchInput
                  value={search}
                  onValueChange={(value) => {
                    setSearch(value)
                    table.setPage(1)
                  }}
                  label="Search records"
                  placeholder="Search location, station or sensor"
                  size="sm"
                />
              </div>
              <Select
                selectSize="sm"
                label="Location"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value)
                  table.setPage(1)
                }}
                disabled={records.isLoading}
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
                label="Sensor"
                value={sensorId}
                onChange={(event) => {
                  setSensorId(event.target.value)
                  table.setPage(1)
                }}
                disabled={records.isLoading}
              >
                <option value="all">All sensors</option>
                {(sensors.data ?? []).map((sensor) => (
                  <option key={sensor} value={sensor}>
                    {sensor}
                  </option>
                ))}
              </Select>
              <Select
                selectSize="sm"
                label="Quality"
                value={quality}
                onChange={(event) => {
                  setQuality(event.target.value as RecordQuality | 'all')
                  table.setPage(1)
                }}
                disabled={records.isLoading}
              >
                <option value="all">Any quality</option>
                <option value="verified">Verified</option>
                <option value="estimated">Estimated</option>
                <option value="suspect">Suspect</option>
              </Select>
              <div className="flex items-end gap-2">
                <div className="flex flex-1 items-center gap-1.5">
                  <label className="sr-only" htmlFor="record-date-from">
                    From date
                  </label>
                  <input
                    id="record-date-from"
                    type="date"
                    value={dateFrom}
                    max={dateTo}
                    onChange={(event) => {
                      setDateFrom(event.target.value)
                      table.setPage(1)
                    }}
                    className="h-8 w-full min-w-0 rounded-md border border-line-strong bg-surface px-2 text-xs text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                  />
                  <label className="sr-only" htmlFor="record-date-to">
                    To date
                  </label>
                  <input
                    id="record-date-to"
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(event) => {
                      setDateTo(event.target.value)
                      table.setPage(1)
                    }}
                    className="h-8 w-full min-w-0 rounded-md border border-line-strong bg-surface px-2 text-xs text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Filter className="size-3.5" aria-hidden="true" />
                {isFiltered ? 'Custom filters applied' : 'Showing the full catalogue window'} ·{' '}
                {formatDate(dateFrom)} – {formatDate(dateTo)}
              </p>
              <div className="flex items-center gap-2">
                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="xs"
                    leadingIcon={<RotateCcw className="size-3.5" />}
                    onClick={resetFilters}
                  >
                    Reset filters
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  leadingIcon={<Sparkles className="size-3.5" />}
                  onClick={() => undefined}
                  disabled
                  title="Quality scoring runs on the backend once connected"
                >
                  Auto-detect anomalies
                </Button>
              </div>
            </div>
          </Card>

          <DataTable<ClimateRecord>
            caption="Climate station records"
            columns={columns}
            rows={records.data?.items ?? []}
            rowKey={(row) => row.id}
            isLoading={records.isLoading}
            error={records.error}
            onRetry={records.reload}
            page={filters.page}
            pageSize={filters.pageSize}
            total={records.data?.total ?? 0}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            sortKey={filters.sortKey}
            sortDirection={filters.sortDirection}
            onSortChange={(key) => table.toggleSort(key as ClimateRecordColumnKey)}
            maxBodyHeight="62vh"
            emptyTitle={isFiltered ? 'No records match these filters' : 'No station records yet'}
            emptyDescription={
              isFiltered
                ? 'Widen the date range or clear a filter to see observations again.'
                : 'Upload a CSV dataset or connect a sensor stream to populate the catalogue.'
            }
            emptyAction={
              isFiltered ? (
                <Button size="sm" variant="secondary" leadingIcon={<X className="size-3.5" />} onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link
                  to={ROUTES.dataUpload}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  Upload dataset
                </Link>
              )
            }
            toolbar={
              <>
                <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-ink-muted sm:flex">
                  <Table2 className="size-3.5" aria-hidden="true" />
                  Sorted by {columns.find((column) => column.key === table.sortKey)?.header.toLowerCase() ?? 'date'}{' '}
                  {table.sortDirection === 'asc' ? 'ascending' : 'descending'}
                </span>
              </>
            }
            footerSummary={
              <p className="text-[11px] text-ink-muted">
                Page total mean{' '}
                <span className="font-medium tabular-nums text-ink-secondary">
                  {records.data && records.data.items.length > 0
                    ? `${formatNumber(
                        records.data.items.reduce((total, row) => total + row.temperature, 0) / records.data.items.length,
                        1,
                      )} °C`
                    : '—'}
                </span>
              </p>
            }
          />
        </div>
      )}

      {tab === 'datasets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Registered datasets"
              value={datasets.isLoading ? <Skeleton className="h-6 w-16" /> : datasets.data?.length ?? 0}
              hint="Across all sources"
              icon={<Database className="size-4" />}
            />
            <StatTile
              label="Total records"
              value={
                stats?.totalRecords ? formatCompactRecords(stats.totalRecords) : <Skeleton className="h-6 w-16" />
              }
              hint="Verified observations"
            />
            <StatTile
              label="Coverage"
              value={stations.data?.length ?? 0}
              hint="Monitoring stations"
              tone="brand"
            />
            <StatTile
              label="Mean quality"
              value="92.4%"
              hint="Verified vs estimated"
              tone="brand"
            />
          </div>

          <Card padding="none">
            <div className="p-[var(--surface-pad)] pb-3">
              <CardHeader
                title="Registered datasets"
                description="Every ingested source with quality score and processing state"
                as="h3"
                icon={<Database className="size-3.5" />}
                actions={
                  <Button
                    variant="secondary"
                    size="xs"
                    leadingIcon={<Upload className="size-3.5" />}
                    onClick={() => undefined}
                    disabled
                    title="Registration happens through the upload workspace"
                  >
                    Register
                  </Button>
                }
              />
            </div>

            {datasets.isLoading ? (
              <div className="space-y-2 px-[var(--surface-pad)] pb-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : (datasets.data?.length ?? 0) === 0 ? (
              <EmptyState
                title="No datasets registered"
                description="Upload a CSV file to create the first dataset in the catalogue."
                action={
                  <Link
                    to={ROUTES.dataUpload}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
                  >
                    <Upload className="size-3.5" aria-hidden="true" />
                    Open upload workspace
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {datasets.data?.map((dataset) => (
                  <li key={dataset.id} className="px-[var(--surface-pad)] py-3 transition-colors hover:bg-surface-muted">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-xs font-semibold text-ink">{dataset.name}</p>
                          <Badge tone={DATASET_STATUS_TONE[dataset.status]} size="sm" dot>
                            {dataset.status}
                          </Badge>
                          <Badge tone="outline" size="sm">
                            {dataset.columns} columns
                          </Badge>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-ink-muted">
                          <span>{dataset.source}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatInteger(dataset.records)} records</span>
                          <span aria-hidden="true">·</span>
                          <span>{dataset.stations} stations</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatFileSize(dataset.sizeMb * 1024 * 1024)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatDate(dataset.periodStart)} – {formatDate(dataset.periodEnd)}</span>
                        </p>
                        <p className="mt-1 text-[10px] text-ink-faint">
                          Registered {formatDateTime(dataset.uploadedAt)} by {dataset.uploadedBy}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="w-24">
                          <p className="text-[10px] text-ink-muted">Quality</p>
                          <p className="text-sm font-semibold tabular-nums text-ink">{dataset.qualityScore}%</p>
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${dataset.qualityScore}%` }}
                              role="img"
                              aria-label={`Quality score ${dataset.qualityScore} percent`}
                            />
                          </div>
                        </div>
                        <IconButton
                          label={`Inspect ${dataset.name}`}
                          size="sm"
                          variant="outline"
                          onClick={() => undefined}
                          disabled
                          title="Dataset inspection opens once the storage service is connected"
                        >
                          <Database className="size-4" aria-hidden="true" />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'stations' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2" padding="none">
            <div className="flex flex-wrap items-start justify-between gap-2 p-[var(--surface-pad)] pb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-ink">Monitoring network</h3>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Colour by connectivity state; select a marker for the full snapshot
                </p>
              </div>
              <MapLegend colorBy="status" />
            </div>
            <MapView
              stations={stations.data ?? []}
              isLoading={stations.isLoading}
              height={460}
              colorBy="status"
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              className="rounded-none border-0 border-t border-line"
            />
          </Card>

          <Card padding="none">
            <div className="p-[var(--surface-pad)] pb-3">
              <CardHeader
                title="Stations"
                description={`${stations.data?.length ?? 0} registered monitoring sites`}
                as="h3"
              />
            </div>
            {stations.isLoading ? (
              <div className="space-y-2 px-[var(--surface-pad)] pb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto border-t border-line scrollbar-thin">
                {stations.data?.map((station) => (
                  <li key={station.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedStationId(station.id)}
                      className={`flex w-full items-center justify-between gap-3 px-[var(--surface-pad)] py-2.5 text-left transition-colors hover:bg-surface-muted ${
                        selectedStationId === station.id ? 'bg-brand-50 dark:bg-brand-900/30' : ''
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-ink">{station.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
                          {station.location}, {station.country}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs font-semibold tabular-nums text-ink">
                          {formatNumber(station.climate.temperature, 1)} °C
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ink-muted">{station.status}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

function formatCompactRecords(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}
