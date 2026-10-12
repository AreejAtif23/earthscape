export type Severity = 'normal' | 'warning' | 'high' | 'critical'

export type TrendDirection = 'up' | 'down' | 'stable'

export type ClimateMetric =
  | 'temperature'
  | 'humidity'
  | 'rainfall'
  | 'windSpeed'
  | 'pressure'
  | 'solarRadiation'

export type Aggregation = 'hourly' | 'daily' | 'weekly' | 'monthly'

export type SortDirection = 'asc' | 'desc'

export type RequestState = 'idle' | 'loading' | 'success' | 'error'

export type TrendPoint = {
  date: string
  value: number
}

export type NamedValue = {
  name: string
  value: number
}

export type CorrelationPair = {
  metricA: ClimateMetric
  metricB: ClimateMetric
  coefficient: number
  strength: 'negligible' | 'weak' | 'moderate' | 'strong'
  direction: 'positive' | 'negative' | 'none'
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export interface ApiErrorShape {
  message: string
  code?: string
  fieldErrors?: Record<string, string>
}
