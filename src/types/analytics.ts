import type { ClimateMetric, Severity, TrendDirection } from './common'

export interface KpiSnapshot {
  averageTemperature: MetricReading
  currentTemperature: MetricReading
  humidity: MetricReading
  rainfall: MetricReading
  windSpeed: MetricReading
  activeAlerts: {
    value: number
    critical: number
    warning: number
    deltaPercent: number
  }
}

export interface MetricReading {
  value: number
  unit: string
  delta: number
  deltaLabel: string
  trend: TrendDirection
  sparkline: number[]
}

export interface ClimateStatusOverview {
  stationHealth: {
    online: number
    degraded: number
    offline: number
    maintenance: number
  }
  networkCoveragePercent: number
  dataFreshnessMinutes: number
  activeDatasets: number
  recordsProcessedToday: number
  overallState: 'nominal' | 'elevated' | 'degraded'
}

export interface AnomalySummaryItem {
  severity: Severity
  count: number
  sharePercent: number
}

export interface PredictionSummaryItem {
  horizonDays: number
  metric: ClimateMetric
  predictedValue: number
  unit: string
  trend: TrendDirection
  confidencePercent: number
}

export interface AnalyticsFilters {
  location: string
  dateFrom: string
  dateTo: string
  metric: ClimateMetric
  aggregation: 'hourly' | 'daily' | 'weekly' | 'monthly'
}

export interface AnalyticsOverview {
  temperature: { average: number; min: number; max: number; range: number }
  rainfall: { total: number; average: number; peakDay: string; wetDays: number }
  humidity: { average: number; min: number; max: number }
  wind: { average: number; max: number; dominantDirection: string }
  series: Array<{ date: string; temperature: number; rainfall: number; humidity: number; windSpeed: number }>
  locationComparison: Array<{ location: string; temperature: number; rainfall: number; humidity: number; windSpeed: number }>
  distribution: Array<{ bucket: string; count: number }>
  correlations: Array<{
    metricA: ClimateMetric
    metricB: ClimateMetric
    coefficient: number
    strength: 'negligible' | 'weak' | 'moderate' | 'strong'
    direction: 'positive' | 'negative' | 'none'
  }>
}
