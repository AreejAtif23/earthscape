import { STATION_SEEDS, STATION_STATUS_ASSIGNMENT } from './stations'
import { createRng } from './seededRandom'
import { addDays, format, parseISO, subDays, subMinutes } from 'date-fns'
import { round } from '@/utils/number'
import type {
  ClimateMetric,
  ClimateRecord,
  ClimateStation,
  DatasetSummary,
  IngestionEvent,
  RecordQuality,
  Severity,
  StationClimateSnapshot,
} from '@/types'

export const REFERENCE_DATE = new Date()

export const SERIES_DAYS = 180

export const METRIC_UNITS: Record<ClimateMetric, string> = {
  temperature: '°C',
  humidity: '%',
  rainfall: 'mm',
  windSpeed: 'm/s',
  pressure: 'hPa',
  solarRadiation: 'W/m²',
}

export const METRIC_LABELS: Record<ClimateMetric, string> = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  rainfall: 'Rainfall',
  windSpeed: 'Wind Speed',
  pressure: 'Pressure',
  solarRadiation: 'Solar Radiation',
}

/** Smooth pseudo-random walk so consecutive samples stay physically plausible. */
function createNoiseWalk(seed: number | string, length: number, volatility: number) {
  const rng = createRng(seed)
  const values: number[] = []
  let current = 0
  for (let index = 0; index < length; index += 1) {
    current = current * 0.72 + rng.range(-volatility, volatility)
    values.push(current)
  }
  return values
}

export interface SeriesOptions {
  metric: ClimateMetric
  days?: number
  seed?: string
  baseline: number
  amplitude: number
  volatility: number
  /** 0 = peak at start of window, 0.5 = mid-window peak. */
  phase?: number
  /** Total change applied linearly across the window. */
  drift?: number
  min?: number
  max?: number
  decimals?: number
}

export function buildSeries(options: SeriesOptions) {
  const days = options.days ?? SERIES_DAYS
  const phase = options.phase ?? 0.5
  const decimals = options.decimals ?? 1
  const noise = createNoiseWalk(options.seed ?? options.metric, days, options.volatility)
  const points: Array<{ date: string; value: number }> = []

  for (let index = 0; index < days; index += 1) {
    const date = addDays(subDays(REFERENCE_DATE, days - 1 - index), 0)
    const progress = days === 1 ? 1 : index / (days - 1)
    const seasonal = Math.sin((progress + phase) * Math.PI * 2) * options.amplitude
    const drift = (options.drift ?? 0) * progress
    const raw = options.baseline + seasonal + drift + noise[index]
    const value = round(Math.min(Math.max(raw, options.min ?? -80), options.max ?? 200), decimals)
    points.push({ date: format(date, 'yyyy-MM-dd'), value })
  }

  return points
}

export function buildRainfallSeries(seed = 'rainfall', days = SERIES_DAYS) {
  const rng = createRng(seed)
  const stormNoise = createNoiseWalk(`${seed}-storm`, days, 1)
  const points: Array<{ date: string; value: number }> = []

  for (let index = 0; index < days; index += 1) {
    const date = addDays(subDays(REFERENCE_DATE, days - 1 - index), 0)
    const progress = index / (days - 1)
    const wetSeason = 0.55 + Math.sin((progress + 0.15) * Math.PI * 2) * 0.35
    const wet = rng.next() < wetSeason
    const base = wet ? rng.range(4, 26) : rng.range(0, 2.4)
    const value = round(Math.max(0, base + Math.max(0, stormNoise[index]) * 9), 1)
    points.push({ date: format(date, 'yyyy-MM-dd'), value })
  }

  return points
}

function severityFromThresholds(temperature: number, humidity: number, windSpeed: number, rainfall: number): Severity {
  if (temperature >= 34 || windSpeed >= 21 || rainfall >= 48) return 'critical'
  if (temperature >= 30 || windSpeed >= 16 || rainfall >= 26 || humidity <= 28) return 'high'
  if (temperature <= 2 || windSpeed >= 11 || rainfall >= 12 || humidity >= 88) return 'warning'
  return 'normal'
}

export function buildStations(): ClimateStation[] {
  return STATION_SEEDS.map((seed) => {
    const rng = createRng(`station-${seed.id}`)
    const status = STATION_STATUS_ASSIGNMENT[seed.id] ?? 'online'
    const temperature = round(rng.range(-1.5, 33.5), 1)
    const humidity = round(rng.range(28, 94), 0)
    const rainfall = round(rng.range(0, 26), 1)
    const windSpeed = round(rng.range(0.6, 19.4), 1)
    const pressure = round(rng.range(996, 1032), 1)
    const climate: StationClimateSnapshot = {
      temperature,
      humidity,
      rainfall,
      windSpeed,
      pressure,
      severity: severityFromThresholds(temperature, humidity, windSpeed, rainfall),
    }
    const lastSeenMinutes =
      status === 'offline' ? rng.int(430, 2900) : status === 'degraded' ? rng.int(9, 55) : rng.int(1, 8)

    return {
      ...seed,
      status,
      climate,
      lastSeenAt: format(subMinutes(REFERENCE_DATE, lastSeenMinutes), "yyyy-MM-dd'T'HH:mm:ss"),
    }
  })
}

export const STATIONS = buildStations()

export const STATION_LOCATIONS = STATIONS.map((station) => station.location)

export const NETWORK_SERIES = {
  temperature: buildSeries({
    metric: 'temperature',
    baseline: 17.5,
    amplitude: 8.2,
    volatility: 1.05,
    drift: 1.6,
    phase: 0.62,
    min: -22,
    max: 46,
  }),
  humidity: buildSeries({
    metric: 'humidity',
    baseline: 63,
    amplitude: 12,
    volatility: 3.4,
    phase: 0.15,
    drift: -2.2,
    min: 18,
    max: 99,
    decimals: 0,
  }),
  rainfall: buildRainfallSeries(),
  windSpeed: buildSeries({
    metric: 'windSpeed',
    baseline: 8.4,
    amplitude: 3.1,
    volatility: 1.5,
    phase: 0.4,
    drift: 0.4,
    min: 0,
    max: 32,
  }),
  pressure: buildSeries({
    metric: 'pressure',
    baseline: 1013,
    amplitude: 7.5,
    volatility: 2.1,
    phase: 0.55,
    drift: -1.4,
    min: 975,
    max: 1048,
  }),
  solarRadiation: buildSeries({
    metric: 'solarRadiation',
    baseline: 190,
    amplitude: 78,
    volatility: 14,
    phase: 0.58,
    min: 0,
    max: 420,
    decimals: 0,
  }),
}

const QUALITY_WEIGHTS: Array<{ quality: RecordQuality; weight: number }> = [
  { quality: 'verified', weight: 0.88 },
  { quality: 'estimated', weight: 0.09 },
  { quality: 'suspect', weight: 0.03 },
]

function pickQuality(rngValue: number): RecordQuality {
  let cumulative = 0
  for (const entry of QUALITY_WEIGHTS) {
    cumulative += entry.weight
    if (rngValue <= cumulative) return entry.quality
  }
  return 'verified'
}

export function buildClimateRecords(total = 1840): ClimateRecord[] {
  const records: ClimateRecord[] = []
  const perDay = Math.ceil(total / SERIES_DAYS)

  for (let dayIndex = 0; dayIndex < SERIES_DAYS; dayIndex += 1) {
    const day = addDays(subDays(REFERENCE_DATE, SERIES_DAYS - 1 - dayIndex), 0)
    const date = format(day, 'yyyy-MM-dd')

    for (let slot = 0; slot < perDay; slot += 1) {
      const station = STATIONS[(dayIndex * perDay + slot) % STATIONS.length]
      const rng = createRng(`record-${date}-${station.id}-${slot}`)
      const dayProgress = (6 + slot * 1.5) / 24
      const diurnal = Math.sin((dayProgress - 0.28) * Math.PI * 2)

      const temperature = round(
        NETWORK_SERIES.temperature[dayIndex].value + diurnal * 4.6 + rng.range(-1.6, 1.6),
        1,
      )
      const humidity = round(
        clampValue(
          NETWORK_SERIES.humidity[dayIndex].value - diurnal * 11 + rng.range(-6, 6),
          12,
          100,
        ),
        0,
      )
      const rainfall = round(
        slot === 0 ? NETWORK_SERIES.rainfall[dayIndex].value * rng.range(0.55, 1) : rng.range(0, 2.6),
        1,
      )
      const windSpeed = round(
        Math.max(0.2, NETWORK_SERIES.windSpeed[dayIndex].value + rng.range(-3.2, 3.2)),
        1,
      )
      const pressure = round(NETWORK_SERIES.pressure[dayIndex].value + rng.range(-3.4, 3.4), 1)

      records.push({
        id: `rec-${date}-${station.code}-${String(slot).padStart(2, '0')}`,
        date,
        recordedAt: `${date}T${String(6 + slot).padStart(2, '0')}:00:00`,
        location: station.location,
        stationId: station.id,
        sensorId: station.sensorId,
        temperature,
        humidity,
        rainfall,
        windSpeed,
        pressure,
        quality: pickQuality(rng.next()),
      })
    }
  }

  return records.slice(0, total)
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export const CLIMATE_RECORDS = buildClimateRecords()

export const DATASETS: DatasetSummary[] = [
  {
    id: 'ds-global-daily-2026',
    name: 'Global Daily Surface Observations 2026',
    source: 'ECMWF ERA5 reanalysis mirror',
    records: CLIMATE_RECORDS.length,
    stations: STATIONS.length,
    periodStart: NETWORK_SERIES.temperature[0].date,
    periodEnd: NETWORK_SERIES.temperature[NETWORK_SERIES.temperature.length - 1].date,
    qualityScore: 96.4,
    uploadedAt: format(subDays(REFERENCE_DATE, 1), "yyyy-MM-dd'T'03:12:00"),
    uploadedBy: 'ingest-scheduler',
    status: 'ready',
    columns: 9,
    sizeMb: 42.8,
  },
  {
    id: 'ds-station-network-q3',
    name: 'Station Network Hourly Feed Q3',
    source: 'IoT sensor stream (MQTT)',
    records: 148_320,
    stations: STATIONS.length,
    periodStart: format(subDays(REFERENCE_DATE, 92), 'yyyy-MM-dd'),
    periodEnd: format(REFERENCE_DATE, 'yyyy-MM-dd'),
    qualityScore: 91.8,
    uploadedAt: format(subDays(REFERENCE_DATE, 0), "yyyy-MM-dd'T'05:40:00"),
    uploadedBy: 'stream-collector',
    status: 'processing',
    columns: 11,
    sizeMb: 318.6,
  },
  {
    id: 'ds-legacy-archive',
    name: 'Legacy Archive Migration 2018-2021',
    source: 'CSV bulk import',
    records: 1_284_900,
    stations: 47,
    periodStart: '2018-01-01',
    periodEnd: '2021-12-31',
    qualityScore: 62.3,
    uploadedAt: format(subDays(REFERENCE_DATE, 6), "yyyy-MM-dd'T'18:05:00"),
    uploadedBy: 'data-migration',
    status: 'ready',
    columns: 8,
    sizeMb: 1_042.3,
  },
  {
    id: 'ds-satellite-symbology',
    name: 'Satellite Thermal Symbology Pass',
    source: 'Sentinel-5P TIRS',
    records: 62_480,
    stations: STATIONS.length,
    periodStart: format(subDays(REFERENCE_DATE, 45), 'yyyy-MM-dd'),
    periodEnd: format(subDays(REFERENCE_DATE, 12), 'yyyy-MM-dd'),
    qualityScore: 88.1,
    uploadedAt: format(subDays(REFERENCE_DATE, 12), "yyyy-MM-dd'T'09:22:00"),
    uploadedBy: 'satellite-ingest',
    status: 'ready',
    columns: 14,
    sizeMb: 726.4,
  },
  {
    id: 'ds-partial-upload',
    name: 'Coastal Sensor Trial Batch',
    source: 'CSV bulk import',
    records: 8_940,
    stations: 3,
    periodStart: format(subDays(REFERENCE_DATE, 30), 'yyyy-MM-dd'),
    periodEnd: format(subDays(REFERENCE_DATE, 1), 'yyyy-MM-dd'),
    qualityScore: 74.5,
    uploadedAt: format(subDays(REFERENCE_DATE, 1), "yyyy-MM-dd'T'21:47:00"),
    uploadedBy: 'm.okafor',
    status: 'failed',
    columns: 7,
    sizeMb: 12.9,
  },
]

export const INGESTION_EVENTS: IngestionEvent[] = [
  {
    id: 'ing-9021',
    datasetName: 'Station Network Hourly Feed Q3',
    source: 'sensor-stream',
    status: 'in-progress',
    records: 148_320,
    startedAt: format(subDays(REFERENCE_DATE, 0), "yyyy-MM-dd'T'05:40:00"),
    durationSeconds: 0,
    initiatedBy: 'stream-collector',
    note: 'Backfilling 14 buffered station partitions',
  },
  {
    id: 'ing-9018',
    datasetName: 'Global Daily Surface Observations 2026',
    source: 'api',
    status: 'completed',
    records: 1_840,
    startedAt: format(subDays(REFERENCE_DATE, 1), "yyyy-MM-dd'T'03:12:00"),
    durationSeconds: 148,
    initiatedBy: 'ingest-scheduler',
    note: 'All partitions verified against source checksums',
  },
  {
    id: 'ing-9014',
    datasetName: 'Coastal Sensor Trial Batch',
    source: 'csv',
    status: 'failed',
    records: 8_940,
    startedAt: format(subDays(REFERENCE_DATE, 1), "yyyy-MM-dd'T'21:47:00"),
    durationSeconds: 37,
    initiatedBy: 'm.okafor',
    note: 'Schema mismatch: pressure column missing unit suffix',
  },
  {
    id: 'ing-9009',
    datasetName: 'Satellite Thermal Symbology Pass',
    source: 'api',
    status: 'completed',
    records: 62_480,
    startedAt: format(subDays(REFERENCE_DATE, 12), "yyyy-MM-dd'T'09:22:00"),
    durationSeconds: 612,
    initiatedBy: 'satellite-ingest',
    note: 'Cloud-masked pixels excluded automatically',
  },
  {
    id: 'ing-9005',
    datasetName: 'Legacy Archive Migration 2018-2021',
    source: 'csv',
    status: 'completed',
    records: 1_284_900,
    startedAt: format(subDays(REFERENCE_DATE, 6), "yyyy-MM-dd'T'18:05:00"),
    durationSeconds: 3_284,
    initiatedBy: 'data-migration',
    note: 'Requires cleaning pass before analysis',
  },
  {
    id: 'ing-9002',
    datasetName: 'Station Network Hourly Feed Q3',
    source: 'sensor-stream',
    status: 'queued',
    records: 0,
    startedAt: format(subDays(REFERENCE_DATE, 0), "yyyy-MM-dd'T'07:58:00"),
    durationSeconds: 0,
    initiatedBy: 'stream-collector',
    note: 'Scheduled run, awaiting previous partition',
  },
]

export const DATA_PERIOD = {
  from: NETWORK_SERIES.temperature[0].date,
  to: NETWORK_SERIES.temperature[NETWORK_SERIES.temperature.length - 1].date,
}

export function dateFromOffset(days: number): string {
  return format(addDays(REFERENCE_DATE, -days), 'yyyy-MM-dd')
}

export function isoFromOffset(days: number, hours = 9): string {
  const date = addDays(REFERENCE_DATE, -days)
  date.setHours(hours, 0, 0, 0)
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}

export function offsetDateTime(days: number, hours: number): string {
  const date = addDays(REFERENCE_DATE, -days)
  date.setHours(hours, (days * 7) % 60, 0, 0)
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}

export function safeParseDate(value: string): Date {
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed
}

export function addDaysFromReference(days: number): Date {
  return addDays(REFERENCE_DATE, days)
}

export function formatIso(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatIsoWithOffset(days: number, hours = 8): string {
  const date = addDays(REFERENCE_DATE, -days)
  date.setHours(hours, 0, 0, 0)
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}
