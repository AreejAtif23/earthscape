import type { ClimateMetric, Severity } from './common'

export type StationStatus = 'online' | 'degraded' | 'offline' | 'maintenance'

export interface ClimateStation {
  id: string
  name: string
  code: string
  location: string
  region: string
  country: string
  latitude: number
  longitude: number
  elevationM: number
  status: StationStatus
  sensorId: string
  installedAt: string
  lastSeenAt: string
  climate: StationClimateSnapshot
}

export interface StationClimateSnapshot {
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  pressure: number
  severity: Severity
}

export interface ClimateRecord {
  id: string
  date: string
  recordedAt: string
  location: string
  stationId: string
  sensorId: string
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  pressure: number
  quality: RecordQuality
}

export type RecordQuality = 'verified' | 'estimated' | 'suspect'

export type ClimateRecordColumnKey =
  | 'date'
  | 'location'
  | 'sensorId'
  | 'temperature'
  | 'humidity'
  | 'rainfall'
  | 'windSpeed'
  | 'pressure'
  | 'quality'

export interface ClimateRecordFilters {
  search: string
  location: string
  sensorId: string
  quality: RecordQuality | 'all'
  dateFrom: string
  dateTo: string
  sortKey: ClimateRecordColumnKey
  sortDirection: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface DatasetSummary {
  id: string
  name: string
  source: string
  records: number
  stations: number
  periodStart: string
  periodEnd: string
  qualityScore: number
  uploadedAt: string
  uploadedBy: string
  status: 'ready' | 'processing' | 'failed'
  columns: number
  sizeMb: number
}

export type IngestionSource = 'api' | 'csv' | 'sensor-stream'
export type IngestionStatus = 'completed' | 'in-progress' | 'queued' | 'failed'

export interface IngestionEvent {
  id: string
  datasetName: string
  source: IngestionSource
  status: IngestionStatus
  records: number
  startedAt: string
  durationSeconds: number
  initiatedBy: string
  note: string
}

export interface DatasetStatistics {
  totalRecords: number
  stationCount: number
  dateRange: { from: string; to: string }
  metrics: Array<{
    metric: ClimateMetric
    label: string
    min: number
    max: number
    mean: number
    unit: string
  }>
}

export interface MetricSeries {
  metric: ClimateMetric
  label: string
  unit: string
  points: Array<{ date: string; value: number }>
}
