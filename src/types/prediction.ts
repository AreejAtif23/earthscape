import type { ClimateMetric, Severity, TrendDirection } from './common'

export interface PredictionPoint {
  date: string
  value: number
}

export interface PredictionSeries {
  metric: ClimateMetric
  label: string
  unit: string
  historical: PredictionPoint[]
  predicted: PredictionPoint[]
  lowerBound: PredictionPoint[]
  upperBound: PredictionPoint[]
  confidencePercent: number
  trend: TrendDirection
  changePercent: number
}

export interface ModelDescriptor {
  id: string
  name: string
  family: string
  version: string
  algorithm: string
  trainedOn: string
  trainingRecords: number
  metrics: Array<{ name: string; value: number; unit: string }>
  horizonDays: number
  status: 'deployed' | 'candidate' | 'retraining'
  description: string
}

export interface PredictionSummary {
  horizonDays: number
  generatedAt: string
  modelName: string
  confidencePercent: number
  series: PredictionSeries[]
}

export type ReportType = 'summary' | 'detailed' | 'anomaly' | 'trend' | 'compliance'
export type ReportStatus = 'draft' | 'queued' | 'generating' | 'ready' | 'failed'

export interface ReportMetricsSelection {
  temperature: boolean
  humidity: boolean
  rainfall: boolean
  windSpeed: boolean
  pressure: boolean
}

export interface ReportConfig {
  title: string
  reportType: ReportType
  location: string
  dateFrom: string
  dateTo: string
  metrics: ReportMetricsSelection
  includeCharts: boolean
  includeAnomalies: boolean
  includeMethodology: boolean
  format: 'pdf' | 'csv' | 'xlsx'
}

export interface GeneratedReport {
  id: string
  title: string
  reportType: ReportType
  location: string
  periodLabel: string
  createdAt: string
  createdBy: string
  status: ReportStatus
  sizeKb: number
  format: ReportConfig['format']
  sections: string[]
}

export interface ReportPreview {
  title: string
  subtitle: string
  location: string
  periodLabel: string
  headlineMetrics: Array<{ label: string; value: string; delta: string }>
  summaryParagraphs: string[]
  tableRows: Array<{ label: string; temperature: string; rainfall: string; humidity: string; windSpeed: string }>
  severity: Severity
  anomalyCount: number
  sectionsIncluded: string[]
}
