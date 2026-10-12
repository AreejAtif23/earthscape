import { apiRequest } from './httpClient'
import { ALERTS } from '@/data/alerts'
import { ANOMALIES } from '@/data/anomalies'
import { NETWORK_SERIES, STATIONS, DATA_PERIOD } from '@/data/climate'
import { PREDICTION_SERIES } from '@/data/predictions'
import { mean, round } from '@/utils/number'
import type {
  AnomalySummaryItem,
  ClimateStatusOverview,
  KpiSnapshot,
  MetricReading,
  PredictionSummaryItem,
  Severity,
} from '@/types'

const SPARK_WINDOW = 24

function reading(
  values: number[],
  unit: string,
  windowSize = SPARK_WINDOW,
  decimals = 1,
): MetricReading {
  const window = values.slice(-windowSize)
  const previousWindow = values.slice(-windowSize * 2, -windowSize)
  const current = window.length > 0 ? mean(window) : 0
  const previous = previousWindow.length > 0 ? mean(previousWindow) : current
  const delta = previous === 0 ? 0 : current - previous
  const threshold = Math.max(Math.abs(current) * 0.002, 0.01)

  return {
    value: round(current, decimals),
    unit,
    delta: round(delta, decimals),
    deltaLabel: 'vs previous 24 days',
    trend: Math.abs(delta) < threshold ? 'stable' : delta > 0 ? 'up' : 'down',
    sparkline: window.map((value) => round(value, decimals)),
  }
}

function buildStatusOverview(): ClimateStatusOverview {
  const health = { online: 0, degraded: 0, offline: 0, maintenance: 0 }
  for (const station of STATIONS) health[station.status] += 1

  const reporting = STATIONS.filter((station) => station.status !== 'offline').length
  const coverage = Math.round((reporting / STATIONS.length) * 100)
  const recordsProcessedToday = STATIONS.filter((station) => station.status === 'online').length * 412

  return {
    stationHealth: health,
    networkCoveragePercent: coverage,
    dataFreshnessMinutes: health.degraded > 1 ? 18 : 7,
    activeDatasets: 8,
    recordsProcessedToday,
    overallState: health.offline > 0 ? 'degraded' : health.degraded > 0 ? 'elevated' : 'nominal',
  }
}

function buildAnomalySummary(): { items: AnomalySummaryItem[]; total: number } {
  const severities: Severity[] = ['critical', 'high', 'warning', 'normal']
  const total = ANOMALIES.length
  const items = severities
    .map((severity) => {
      const count = ANOMALIES.filter((anomaly) => anomaly.severity === severity).length
      return {
        severity,
        count,
        sharePercent: total === 0 ? 0 : Math.round((count / total) * 100),
      }
    })
    .filter((item) => item.count > 0)
  return { items, total }
}

function buildPredictionSummary(): PredictionSummaryItem[] {
  const horizonDays = 14

  return PREDICTION_SERIES.filter((series) => series.metric !== 'pressure').map((series) => {
    const target = series.predicted[Math.min(horizonDays - 1, series.predicted.length - 1)]
    const current = series.historical[series.historical.length - 1]
    const delta = current && target ? target.value - current.value : 0
    const threshold = Math.max(Math.abs(current?.value ?? 0) * 0.005, 0.02)

    return {
      horizonDays,
      metric: series.metric,
      predictedValue: round(target?.value ?? 0, 1),
      unit: series.unit,
      trend: Math.abs(delta) < threshold ? 'stable' : delta > 0 ? 'up' : 'down',
      confidencePercent: series.confidencePercent,
    }
  })
}

function buildKpiSnapshot(): KpiSnapshot {
  const temperature = NETWORK_SERIES.temperature.map((point) => point.value)
  const humidity = NETWORK_SERIES.humidity.map((point) => point.value)
  const rainfall = NETWORK_SERIES.rainfall.map((point) => point.value)
  const windSpeed = NETWORK_SERIES.windSpeed.map((point) => point.value)

  const activeAlerts = ALERTS.filter((alert) => alert.status === 'active')
  const critical = ALERTS.filter((alert) => alert.status !== 'resolved' && alert.severity === 'critical').length
  const warning = ALERTS.filter((alert) => alert.status !== 'resolved' && alert.severity === 'warning').length

  return {
    averageTemperature: reading(temperature, '°C', 30, 1),
    currentTemperature: reading(temperature, '°C', 1, 1),
    humidity: reading(humidity, '%', 30, 0),
    rainfall: reading(rainfall, 'mm', 30, 1),
    windSpeed: reading(windSpeed, 'm/s', 30, 1),
    activeAlerts: {
      value: activeAlerts.length,
      critical,
      warning,
      deltaPercent: 0,
    },
  }
}

export const dashboardService = {
  /** REST contract: GET /dashboard/kpis */
  async getKpiSnapshot(): Promise<KpiSnapshot> {
    return apiRequest<KpiSnapshot>({
      url: '/dashboard/kpis',
      latencyMs: 520,
      mock: () => buildKpiSnapshot(),
    })
  },

  /** REST contract: GET /dashboard/status */
  async getStatusOverview(): Promise<ClimateStatusOverview> {
    return apiRequest<ClimateStatusOverview>({
      url: '/dashboard/status',
      latencyMs: 380,
      mock: () => buildStatusOverview(),
    })
  },

  /** REST contract: GET /dashboard/anomaly-summary */
  async getAnomalySummary(): Promise<{ items: AnomalySummaryItem[]; total: number }> {
    return apiRequest<{ items: AnomalySummaryItem[]; total: number }>({
      url: '/dashboard/anomaly-summary',
      latencyMs: 340,
      mock: () => buildAnomalySummary(),
    })
  },

  /** REST contract: GET /dashboard/prediction-summary */
  async getPredictionSummary(): Promise<PredictionSummaryItem[]> {
    return apiRequest<PredictionSummaryItem[]>({
      url: '/dashboard/prediction-summary',
      latencyMs: 400,
      mock: () => buildPredictionSummary(),
    })
  },

  /** REST contract: GET /dashboard/window */
  async getWindow(): Promise<{ from: string; to: string; days: number }> {
    return apiRequest<{ from: string; to: string; days: number }>({
      url: '/dashboard/window',
      latencyMs: 120,
      mock: () => ({ from: DATA_PERIOD.from, to: DATA_PERIOD.to, days: 180 }),
    })
  },
}
