import { apiRequest } from './httpClient'
import {
  CLIMATE_RECORDS,
  DATA_PERIOD,
  DATASETS,
  INGESTION_EVENTS,
  METRIC_LABELS,
  METRIC_UNITS,
  NETWORK_SERIES,
  STATIONS,
} from '@/data/climate'
import type {
  ClimateMetric,
  ClimateRecord,
  ClimateRecordFilters,
  ClimateStation,
  DatasetStatistics,
  DatasetSummary,
  IngestionEvent,
  Paginated,
} from '@/types'

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), pageCount)
  const start = (safePage - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total, page: safePage, pageSize, pageCount }
}

function applyRecordFilters(filters: ClimateRecordFilters): ClimateRecord[] {
  const search = filters.search.trim().toLowerCase()

  return CLIMATE_RECORDS.filter((record) => {
    if (search) {
      const haystack = `${record.location} ${record.sensorId} ${record.stationId} ${record.date}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filters.location !== 'all' && record.location !== filters.location) return false
    if (filters.sensorId !== 'all' && record.sensorId !== filters.sensorId) return false
    if (filters.quality !== 'all' && record.quality !== filters.quality) return false
    if (filters.dateFrom && record.date < filters.dateFrom) return false
    if (filters.dateTo && record.date > filters.dateTo) return false
    return true
  }).sort((a, b) => {
    const direction = filters.sortDirection === 'asc' ? 1 : -1
    const left = a[filters.sortKey]
    const right = b[filters.sortKey]
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction
    return String(left).localeCompare(String(right)) * direction
  })
}

export const climateService = {
  /** REST contract: GET /climate/records */
  async listRecords(filters: ClimateRecordFilters): Promise<Paginated<ClimateRecord>> {
    return apiRequest<Paginated<ClimateRecord>>({
      url: '/climate/records',
      params: { ...filters },
      latencyMs: 520,
      mock: () => paginate(applyRecordFilters(filters), filters.page, filters.pageSize),
    })
  },

  /** REST contract: GET /climate/stations */
  async listStations(): Promise<ClimateStation[]> {
    return apiRequest<ClimateStation[]>({
      url: '/climate/stations',
      latencyMs: 340,
      mock: () => STATIONS,
    })
  },

  /** REST contract: GET /climate/series */
  async getNetworkSeries(metric: ClimateMetric, days = 180) {
    return apiRequest<Array<{ date: string; value: number }>>({
      url: '/climate/series',
      params: { metric, days },
      latencyMs: 300,
      mock: () => NETWORK_SERIES[metric].slice(-days),
    })
  },

  async getMetricMeta() {
    return apiRequest<Record<ClimateMetric, { label: string; unit: string }>>({
      url: '/climate/metrics',
      latencyMs: 150,
      mock: () =>
        Object.fromEntries(
          (Object.keys(METRIC_LABELS) as ClimateMetric[]).map((metric) => [
            metric,
            { label: METRIC_LABELS[metric], unit: METRIC_UNITS[metric] },
          ]),
        ),
    })
  },

  /** REST contract: GET /datasets */
  async listDatasets(): Promise<DatasetSummary[]> {
    return apiRequest<DatasetSummary[]>({
      url: '/datasets',
      latencyMs: 420,
      mock: () => DATASETS,
    })
  },

  async getDatasetStatistics(): Promise<DatasetStatistics> {
    return apiRequest<DatasetStatistics>({
      url: '/datasets/statistics',
      latencyMs: 460,
      mock: () => ({
        totalRecords: CLIMATE_RECORDS.length,
        stationCount: STATIONS.length,
        dateRange: { from: DATA_PERIOD.from, to: DATA_PERIOD.to },
        metrics: (Object.keys(METRIC_LABELS) as ClimateMetric[]).map((metric) => {
          const values = NETWORK_SERIES[metric].map((point) => point.value)
          const total = values.reduce((accumulator, value) => accumulator + value, 0)
          return {
            metric,
            label: METRIC_LABELS[metric],
            min: Math.min(...values),
            max: Math.max(...values),
            mean: Math.round((total / values.length) * 10) / 10,
            unit: METRIC_UNITS[metric],
          }
        }),
      }),
    })
  },

  /** REST contract: GET /ingestion/events */
  async listIngestionEvents(): Promise<IngestionEvent[]> {
    return apiRequest<IngestionEvent[]>({
      url: '/ingestion/events',
      latencyMs: 380,
      mock: () => INGESTION_EVENTS,
    })
  },

  async getSensorIds(): Promise<string[]> {
    return apiRequest<string[]>({
      url: '/climate/sensors',
      latencyMs: 200,
      mock: () => Array.from(new Set(STATIONS.map((station) => station.sensorId))).sort(),
    })
  },
}
