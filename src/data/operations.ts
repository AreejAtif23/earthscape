import { createRng } from './seededRandom'
import { formatIsoWithOffset } from './climate'
import type { CleaningIssue, CleaningSummary, User, UserSettings } from '@/types'

export const DEMO_USERS: User[] = [
  {
    id: 'usr-1001',
    name: 'Amina Rahman',
    email: 'amina.rahman@earthscape.example',
    role: 'administrator',
    organisation: 'EarthScape Climate Agency',
    jobTitle: 'Head of Climate Analytics',
    avatarInitials: 'AR',
    memberSince: '2021-03-14',
    lastLoginAt: formatIsoWithOffset(0, 7),
  },
  {
    id: 'usr-1002',
    name: 'Mateo Okafor',
    email: 'mateo.okafor@earthscape.example',
    role: 'analyst',
    organisation: 'EarthScape Climate Agency',
    jobTitle: 'Senior Data Analyst',
    avatarInitials: 'MO',
    memberSince: '2022-08-02',
    lastLoginAt: formatIsoWithOffset(0, 6),
  },
]

export const DEFAULT_SETTINGS: UserSettings = {
  notification: {
    email: true,
    push: true,
    sms: false,
    digestFrequency: 'realtime',
  },
  thresholds: {
    temperatureHigh: 32,
    rainfallHeavy: 45,
    windSevere: 17,
    humidityLow: 25,
  },
  appearance: {
    theme: 'light',
    density: 'comfortable',
    reduceMotion: false,
  },
}

export const ROLE_DESCRIPTIONS: Record<User['role'], { label: string; description: string }> = {
  administrator: {
    label: 'Administrator',
    description: 'Full platform access including station management, exports and user administration.',
  },
  analyst: {
    label: 'Climate Analyst',
    description: 'Ingest data, run analyses, manage alerts and generate reports.',
  },
  researcher: {
    label: 'Researcher',
    description: 'Read-only access to analytics, predictions and published reports.',
  },
}

export const CLEANING_BASELINE_ISSUES: CleaningIssue[] = [
  {
    id: 'iss-01',
    rule: 'missing_values',
    category: 'missing',
    severity: 'error',
    column: 'humidity',
    affectedRows: 428,
    description: 'Relative humidity absent for 428 readings recorded during gateway outages.',
    action: 'impute',
    selected: true,
  },
  {
    id: 'iss-02',
    rule: 'missing_values',
    category: 'missing',
    severity: 'warning',
    column: 'wind_speed',
    affectedRows: 196,
    description: 'Wind speed null where anemometer reported a calibration fault.',
    action: 'impute',
    selected: true,
  },
  {
    id: 'iss-03',
    rule: 'duplicate_records',
    category: 'duplicate',
    severity: 'warning',
    column: 'sensor_id, date',
    affectedRows: 312,
    description: 'Exact duplicate rows produced by stream replay after a consumer restart.',
    action: 'drop',
    selected: true,
  },
  {
    id: 'iss-04',
    rule: 'out_of_range',
    category: 'invalid',
    severity: 'error',
    column: 'temperature',
    affectedRows: 74,
    description: 'Temperature readings outside the physically plausible range −60 °C to 60 °C.',
    action: 'clip',
    selected: true,
  },
  {
    id: 'iss-05',
    rule: 'out_of_range',
    category: 'invalid',
    severity: 'warning',
    column: 'humidity',
    affectedRows: 141,
    description: 'Relative humidity values above 100 % indicate sensor saturation.',
    action: 'clip',
    selected: true,
  },
  {
    id: 'iss-06',
    rule: 'outlier',
    category: 'outlier',
    severity: 'info',
    column: 'pressure',
    affectedRows: 58,
    description: 'Pressure steps beyond 18 hPa in under 10 minutes — physically implausible.',
    action: 'flag',
    selected: false,
  },
  {
    id: 'iss-07',
    rule: 'format_inconsistency',
    category: 'format',
    severity: 'warning',
    column: 'date',
    affectedRows: 22,
    description: 'Mixed date formats detected (ISO 8601 and locale short date).',
    action: 'cast',
    selected: true,
  },
  {
    id: 'iss-08',
    rule: 'type_mismatch',
    category: 'format',
    severity: 'error',
    column: 'rainfall',
    affectedRows: 9,
    description: 'Rainfall column contains the sentinel value "-999" used by the legacy exporter.',
    action: 'cast',
    selected: true,
  },
]

export const CLEANING_DATASETS = [
  {
    datasetId: 'ds-legacy-archive',
    datasetName: 'Legacy Archive Migration 2018-2021',
    totalRecords: 1_284_900,
    columnCount: 8,
  },
  {
    datasetId: 'ds-partial-upload',
    datasetName: 'Coastal Sensor Trial Batch',
    totalRecords: 8_940,
    columnCount: 7,
  },
  {
    datasetId: 'ds-station-network-q3',
    datasetName: 'Station Network Hourly Feed Q3',
    totalRecords: 148_320,
    columnCount: 11,
  },
  {
    datasetId: 'ds-satellite-symbology',
    datasetName: 'Satellite Thermal Symbology Pass',
    totalRecords: 62_480,
    columnCount: 14,
  },
]

export const CLEANING_PROFILES: CleaningSummary['columnProfiles'] = [
  { column: 'date', dtype: 'datetime64', nullRate: 0.0, uniqueCount: 1_467, min: null, max: null, mean: null },
  { column: 'location', dtype: 'category', nullRate: 0.0, uniqueCount: 47, min: null, max: null, mean: null },
  { column: 'temperature', dtype: 'float64', nullRate: 0.021, uniqueCount: 18_204, min: -38.4, max: 47.9, mean: 16.8 },
  { column: 'humidity', dtype: 'float64', nullRate: 0.058, uniqueCount: 402, min: 4.0, max: 100.0, mean: 61.3 },
  { column: 'rainfall', dtype: 'float64', nullRate: 0.012, uniqueCount: 1_986, min: 0.0, max: 128.4, mean: 2.4 },
  { column: 'wind_speed', dtype: 'float64', nullRate: 0.031, uniqueCount: 864, min: 0.0, max: 41.2, mean: 8.1 },
  { column: 'pressure', dtype: 'float64', nullRate: 0.004, uniqueCount: 2_140, min: 962.1, max: 1043.8, mean: 1012.6 },
  { column: 'sensor_id', dtype: 'string', nullRate: 0.0, uniqueCount: 47, min: null, max: null, mean: null },
]

export function buildCleaningSummary(datasetId: string): CleaningSummary {
  const dataset = CLEANING_DATASETS.find((entry) => entry.datasetId === datasetId) ?? CLEANING_DATASETS[0]
  const scale = dataset.totalRecords / CLEANING_DATASETS[0].totalRecords
  const issues = CLEANING_BASELINE_ISSUES.map((issue) => ({
    ...issue,
    affectedRows: Math.max(3, Math.round(issue.affectedRows * scale)),
  }))
  const missingValues = issues
    .filter((issue) => issue.category === 'missing')
    .reduce((total, issue) => total + issue.affectedRows, 0)
  const duplicateRecords = issues
    .filter((issue) => issue.category === 'duplicate')
    .reduce((total, issue) => total + issue.affectedRows, 0)
  const invalidRecords = issues
    .filter((issue) => issue.category === 'invalid' || issue.category === 'format')
    .reduce((total, issue) => total + issue.affectedRows, 0)
  const outlierRecords = issues
    .filter((issue) => issue.category === 'outlier')
    .reduce((total, issue) => total + issue.affectedRows, 0)
  const affected = Math.max(missingValues, duplicateRecords, invalidRecords, outlierRecords)
  const cleanRecords = dataset.totalRecords - affected
  const qualityBefore = Math.round(((dataset.totalRecords - missingValues - invalidRecords) / dataset.totalRecords) * 1000) / 10
  const qualityAfter = Math.min(99.4, Math.max(qualityBefore + 18, 96.2))

  return {
    datasetId: dataset.datasetId,
    datasetName: dataset.datasetName,
    totalRecords: dataset.totalRecords,
    missingValues,
    duplicateRecords,
    invalidRecords,
    outlierRecords,
    cleanRecords,
    columnCount: dataset.columnCount,
    qualityScoreBefore: Math.max(38, Math.min(qualityBefore, 92)),
    qualityScoreAfter: qualityAfter,
    processedAt: formatIsoWithOffset(0, 5),
    issues,
    columnProfiles: CLEANING_PROFILES,
    beforeAfter: [
      { dimension: 'Valid records', before: cleanRecords, after: dataset.totalRecords },
      { dimension: 'Missing values', before: missingValues, after: 0 },
      { dimension: 'Duplicate rows', before: duplicateRecords, after: 0 },
      { dimension: 'Invalid values', before: invalidRecords, after: 0 },
      { dimension: 'Flagged outliers', before: outlierRecords, after: outlierRecords },
      { dimension: 'Quality score (%)', before: Math.max(38, Math.min(qualityBefore, 92)), after: qualityAfter },
    ],
  }
}

export function newTicketReference(): string {
  const rng = createRng(`ticket-${Date.now()}`)
  return `ESC-${rng.int(2300, 2399)}`
}
