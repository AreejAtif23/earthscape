import { apiRequest } from './httpClient'
import { ANOMALIES } from '@/data/anomalies'
import { ALERTS } from '@/data/alerts'
import { NETWORK_SERIES, STATIONS } from '@/data/climate'
import { METRIC_LABELS, METRIC_UNITS } from '@/data/climate'
import { correlationStrength, maxOf, mean, minOf, pearsonCorrelation, round, sum } from '@/utils/number'
import type {
  Alert,
  AlertCounts,
  AlertFilters,
  AnalyticsFilters,
  AnalyticsOverview,
  Anomaly,
  AnomalyFilters,
} from '@/types'

function filterAnomalies(filters: AnomalyFilters): Anomaly[] {
  const search = filters.search.trim().toLowerCase()
  return ANOMALIES.filter((anomaly) => {
    if (search && !`${anomaly.id} ${anomaly.location} ${anomaly.note}`.toLowerCase().includes(search)) return false
    if (filters.location !== 'all' && anomaly.location !== filters.location) return false
    if (filters.metric !== 'all' && anomaly.metric !== filters.metric) return false
    if (filters.severity !== 'all' && anomaly.severity !== filters.severity) return false
    if (filters.status !== 'all' && anomaly.status !== filters.status) return false
    if (filters.dateFrom && anomaly.detectedAt.slice(0, 10) < filters.dateFrom) return false
    if (filters.dateTo && anomaly.detectedAt.slice(0, 10) > filters.dateTo) return false
    return true
  })
}

function filterAlerts(filters: AlertFilters): Alert[] {
  const search = filters.search.trim().toLowerCase()
  return ALERTS.filter((alert) => {
    if (search && !`${alert.id} ${alert.title} ${alert.location}`.toLowerCase().includes(search)) return false
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false
    if (filters.status !== 'all' && alert.status !== filters.status) return false
    if (filters.metric !== 'all' && alert.metric !== filters.metric) return false
    if (filters.location !== 'all' && alert.location !== filters.location) return false
    return true
  })
}

export const alertService = {
  /** REST contract: GET /anomalies */
  async listAnomalies(filters: AnomalyFilters): Promise<Anomaly[]> {
    return apiRequest<Anomaly[]>({
      url: '/anomalies',
      params: { ...filters },
      latencyMs: 480,
      mock: () => filterAnomalies(filters),
    })
  },

  /** REST contract: GET /alerts */
  async listAlerts(filters: AlertFilters): Promise<Alert[]> {
    return apiRequest<Alert[]>({
      url: '/alerts',
      params: { ...filters },
      latencyMs: 440,
      mock: () => filterAlerts(filters),
    })
  },

  /** REST contract: GET /anomalies/counts */
  async getAnomalyCounts(): Promise<{ total: number; open: number; investigating: number; resolved: number }> {
    return apiRequest<{ total: number; open: number; investigating: number; resolved: number }>({
      url: '/anomalies/counts',
      latencyMs: 220,
      mock: () => ({
        total: ANOMALIES.length,
        open: ANOMALIES.filter((anomaly) => anomaly.status === 'open').length,
        investigating: ANOMALIES.filter((anomaly) => anomaly.status === 'investigating').length,
        resolved: ANOMALIES.filter((anomaly) => anomaly.status === 'resolved' || anomaly.status === 'false-positive')
          .length,
      }),
    })
  },

  async getAlertCounts(): Promise<AlertCounts> {
    return apiRequest<AlertCounts>({
      url: '/alerts/counts',
      latencyMs: 260,
      mock: () => ({
        active: ALERTS.filter((alert) => alert.status === 'active').length,
        critical: ALERTS.filter((alert) => alert.status !== 'resolved' && alert.severity === 'critical').length,
        warning: ALERTS.filter((alert) => alert.status !== 'resolved' && alert.severity === 'warning').length,
        resolved: ALERTS.filter((alert) => alert.status === 'resolved').length,
      }),
    })
  },

  /** REST contract: POST /alerts/{id}/acknowledge */
  async acknowledgeAlert(alertId: string): Promise<Alert> {
    return apiRequest<Alert>({
      url: `/alerts/${alertId}/acknowledge`,
      method: 'post',
      latencyMs: 420,
      mock: () => {
        const alert = ALERTS.find((entry) => entry.id === alertId)
        if (!alert) throw new Error('Alert no longer exists.')
        return { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
      },
    })
  },

  async resolveAlert(alertId: string): Promise<Alert> {
    return apiRequest<Alert>({
      url: `/alerts/${alertId}/resolve`,
      method: 'post',
      latencyMs: 420,
      mock: () => {
        const alert = ALERTS.find((entry) => entry.id === alertId)
        if (!alert) throw new Error('Alert no longer exists.')
        return { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
      },
    })
  },

  /** REST contract: PUT /anomalies/{id} */
  async updateAnomalyStatus(anomalyId: string, status: Anomaly['status']): Promise<Anomaly> {
    return apiRequest<Anomaly>({
      url: `/anomalies/${anomalyId}`,
      method: 'patch',
      body: { status },
      latencyMs: 380,
      mock: () => {
        const anomaly = ANOMALIES.find((entry) => entry.id === anomalyId)
        if (!anomaly) throw new Error('Anomaly no longer exists.')
        return { ...anomaly, status }
      },
    })
  },
}

function buildOverview(): AnalyticsOverview {
  const temperature = NETWORK_SERIES.temperature.map((point) => point.value)
  const rainfall = NETWORK_SERIES.rainfall
  const humidity = NETWORK_SERIES.humidity.map((point) => point.value)
  const wind = NETWORK_SERIES.windSpeed.map((point) => point.value)

  const step = Math.max(1, Math.floor(NETWORK_SERIES.temperature.length / 90))
  const sampled = NETWORK_SERIES.temperature
    .filter((_, index) => index % step === 0)
    .map((point, index) => ({
      date: point.date,
      temperature: point.value,
      rainfall: rainfall[index * step]?.value ?? 0,
      humidity: humidity[index * step] ?? 0,
      windSpeed: wind[index * step] ?? 0,
    }))

  const temperatureBins = new Map<string, number>()
  for (const value of temperature) {
    const bucket = `${Math.floor(value / 2) * 2}–${Math.floor(value / 2) * 2 + 2}°C`
    temperatureBins.set(bucket, (temperatureBins.get(bucket) ?? 0) + 1)
  }

  const metricPairs: Array<[AnalyticsOverview['correlations'][number]['metricA'], AnalyticsOverview['correlations'][number]['metricB']]> = [
    ['temperature', 'humidity'],
    ['temperature', 'windSpeed'],
    ['temperature', 'rainfall'],
    ['humidity', 'rainfall'],
    ['windSpeed', 'pressure'],
    ['rainfall', 'humidity'],
  ]

  const seriesFor = (metric: keyof typeof NETWORK_SERIES) => NETWORK_SERIES[metric].map((point) => point.value)
  const correlations = metricPairs.map(([metricA, metricB]) => {
    const coefficient = round(pearsonCorrelation(seriesFor(metricA), seriesFor(metricB)), 3)
    return {
      metricA,
      metricB,
      coefficient,
      strength: correlationStrength(coefficient),
      direction: (coefficient > 0.12 ? 'positive' : coefficient < -0.12 ? 'negative' : 'none') as 'positive' | 'negative' | 'none',
    }
  })

  const peakRainfall = rainfall.reduce((max, point) => (point.value > max.value ? point : max), rainfall[0])

  return {
    temperature: {
      average: round(mean(temperature), 1),
      min: round(minOf(temperature), 1),
      max: round(maxOf(temperature), 1),
      range: round(maxOf(temperature) - minOf(temperature), 1),
    },
    rainfall: {
      total: round(sum(rainfall.map((point) => point.value)), 1),
      average: round(mean(rainfall.map((point) => point.value)), 2),
      peakDay: peakRainfall?.date ?? '',
      wetDays: rainfall.filter((point) => point.value > 1).length,
    },
    humidity: { average: round(mean(humidity), 1), min: round(minOf(humidity), 0), max: round(maxOf(humidity), 0) },
    wind: { average: round(mean(wind), 1), max: round(maxOf(wind), 1), dominantDirection: 'WSW' },
    series: sampled,
    locationComparison: STATIONS.slice(0, 8).map((station) => ({
      location: station.location,
      temperature: station.climate.temperature,
      rainfall: station.climate.rainfall,
      humidity: station.climate.humidity,
      windSpeed: station.climate.windSpeed,
    })),
    distribution: Array.from(temperatureBins.entries()).map(([bucket, count]) => ({ bucket, count })),
    correlations,
  }
}

export const analyticsService = {
  /** REST contract: GET /analytics/overview */
  async getOverview(filters: Partial<AnalyticsFilters> = {}): Promise<AnalyticsOverview> {
    return apiRequest<AnalyticsOverview>({
      url: '/analytics/overview',
      params: { ...filters },
      latencyMs: 620,
      mock: () => buildOverview(),
    })
  },

  /** REST contract: GET /analytics/metric-summary */
  async getMetricSummary() {
    return apiRequest<Record<string, { label: string; unit: string }>>({
      url: '/analytics/metric-summary',
      latencyMs: 200,
      mock: () =>
        Object.fromEntries(
          Object.entries(METRIC_LABELS).map(([key, label]) => [key, { label, unit: METRIC_UNITS[key as keyof typeof METRIC_UNITS] }]),
        ),
    })
  },
}
