import type { ClimateMetric, Severity } from './common'

export interface Anomaly {
  id: string
  detectedAt: string
  location: string
  stationId: string
  metric: ClimateMetric
  actualValue: number
  expectedMin: number
  expectedMax: number
  deviation: number
  deviationSigma: number
  severity: Severity
  zScoreMethod: string
  status: 'open' | 'investigating' | 'resolved' | 'false-positive'
  confidencePercent: number
  note: string
}

export interface AnomalyFilters {
  search: string
  location: string
  metric: ClimateMetric | 'all'
  severity: Severity | 'all'
  status: Anomaly['status'] | 'all'
  dateFrom: string
  dateTo: string
}

export interface Alert {
  id: string
  title: string
  severity: Severity
  location: string
  stationId: string
  metric: ClimateMetric
  threshold: number
  observedValue: number
  unit: string
  triggeredAt: string
  resolvedAt: string | null
  acknowledgedAt: string | null
  status: 'active' | 'acknowledged' | 'resolved'
  source: 'rule-engine' | 'anomaly-model' | 'prediction-model'
  description: string
}

export interface AlertFilters {
  search: string
  severity: Severity | 'all'
  status: Alert['status'] | 'all'
  metric: ClimateMetric | 'all'
  location: string
}

export interface AlertCounts {
  active: number
  critical: number
  warning: number
  resolved: number
}
