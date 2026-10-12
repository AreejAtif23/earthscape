import { CLIMATE_RECORDS, NETWORK_SERIES, STATIONS, isoFromOffset, offsetDateTime } from './climate'
import { createRng } from './seededRandom'
import { round } from '@/utils/number'
import type { Anomaly, ClimateMetric, Severity } from '@/types'

const ANOMALY_TEMPLATES: Array<{
  metric: ClimateMetric
  severity: Severity
  direction: 'above' | 'below'
  magnitude: [number, number]
  note: string
}> = [
  {
    metric: 'temperature',
    severity: 'critical',
    direction: 'above',
    magnitude: [6.4, 9.8],
    note: 'Heatwave signature consistent with blocking high-pressure system.',
  },
  {
    metric: 'temperature',
    severity: 'high',
    direction: 'above',
    magnitude: [4.1, 6.2],
    note: 'Above seasonal percentile for the station for 12 consecutive readings.',
  },
  {
    metric: 'temperature',
    severity: 'warning',
    direction: 'below',
    magnitude: [3.2, 5.1],
    note: 'Cold-air intrusion; overnight minimum below expected envelope.',
  },
  {
    metric: 'rainfall',
    severity: 'critical',
    direction: 'above',
    magnitude: [38, 62],
    note: 'Accumulation exceeds 99th percentile for the catchment.',
  },
  {
    metric: 'rainfall',
    severity: 'high',
    direction: 'above',
    magnitude: [22, 37],
    note: 'Short-duration intense rainfall; flash-flood risk elevated.',
  },
  {
    metric: 'rainfall',
    severity: 'warning',
    direction: 'below',
    magnitude: [4, 9],
    note: 'Rainfall deficit over rolling 14-day window.',
  },
  {
    metric: 'windSpeed',
    severity: 'critical',
    direction: 'above',
    magnitude: [12, 18],
    note: 'Sustained wind above regional operational safety threshold.',
  },
  {
    metric: 'windSpeed',
    severity: 'warning',
    direction: 'above',
    magnitude: [5.5, 9],
    note: 'Gust front passage with rapid directional shift.',
  },
  {
    metric: 'humidity',
    severity: 'high',
    direction: 'below',
    magnitude: [14, 22],
    note: 'Relative humidity deficit; static discharge risk increased.',
  },
  {
    metric: 'humidity',
    severity: 'warning',
    direction: 'above',
    magnitude: [8, 14],
    note: 'Sustaturated air mass; fog advisory conditions.',
  },
  {
    metric: 'pressure',
    severity: 'warning',
    direction: 'below',
    magnitude: [8, 14],
    note: 'Rapid pressure fall consistent with approaching frontal system.',
  },
  {
    metric: 'pressure',
    severity: 'high',
    direction: 'above',
    magnitude: [9, 15],
    note: 'Unusually high pressure; stable-air subsidence and haze risk.',
  },
]

const EXPECTED_RANGE: Record<ClimateMetric, [number, number]> = {
  temperature: [12.4, 27.6],
  humidity: [42, 84],
  rainfall: [0, 18],
  windSpeed: [1.8, 13.4],
  pressure: [1002, 1024],
  solarRadiation: [120, 268],
}

const ANOMALY_STATUSES: Anomaly['status'][] = ['open', 'investigating', 'resolved', 'false-positive']

function pickSeverityRank(severity: Severity) {
  return { critical: 4, high: 3, warning: 2, normal: 1 }[severity]
}

export function buildAnomalies(total = 68): Anomaly[] {
  const anomalies: Anomaly[] = []

  for (let index = 0; index < total; index += 1) {
    const rng = createRng(`anomaly-${index}`)
    const template = ANOMALY_TEMPLATES[index % ANOMALY_TEMPLATES.length]
    const station = STATIONS[rng.int(0, STATIONS.length - 1)]
    const [rangeMin, rangeMax] = EXPECTED_RANGE[template.metric]
    const deviation = round(rng.range(template.magnitude[0], template.magnitude[1]), 1)
    const isAbove = template.direction === 'above'
    const actualValue = round(
      isAbove ? rangeMax + deviation : Math.max(0, rangeMin - deviation),
      1,
    )
    const expectedMin = round(isAbove ? rangeMin : rangeMax - deviation * 0.35, 1)
    const expectedMax = round(isAbove ? rangeMax + deviation * 0.35 : rangeMax, 1)
    const daysAgo = rng.int(0, 88)
    const status = rng.next() < 0.55 ? ANOMALY_STATUSES[0] : ANOMALY_STATUSES[rng.int(1, 3)]
    const severityRank = pickSeverityRank(template.severity)

    anomalies.push({
      id: `anm-${String(4100 + index)}`,
      detectedAt: offsetDateTime(daysAgo, rng.int(0, 23)),
      location: station.location,
      stationId: station.id,
      metric: template.metric,
      actualValue,
      expectedMin,
      expectedMax,
      deviation: round(
        isAbove ? actualValue - rangeMax : rangeMin - actualValue,
        1,
      ),
      deviationSigma: round(rng.range(2.1, 5.8), 2),
      severity: template.severity,
      zScoreMethod: 'Robust Z-Score (MAD, window=30d)',
      status,
      confidencePercent: round(Math.min(99, 72 + severityRank * 5 + rng.range(0, 8)), 1),
      note:
        status === 'false-positive'
          ? 'Sensor drift confirmed during site inspection; reading excluded from baseline.'
          : status === 'resolved'
            ? 'Conditions returned to expected envelope after frontal passage.'
            : template.note,
    })
  }

  return anomalies.sort(
    (a, b) => pickSeverityRank(b.severity) - pickSeverityRank(a.severity) || b.detectedAt.localeCompare(a.detectedAt),
  )
}

export const ANOMALIES = buildAnomalies()

export const ANOMALY_SAMPLE = CLIMATE_RECORDS.filter((record) => record.quality === 'suspect').slice(0, 4)

export function anomalyDistribution() {
  const counts: Record<Severity, number> = { critical: 0, high: 0, warning: 0, normal: 0 }
  for (const anomaly of ANOMALIES) {
    counts[anomaly.severity] += 1
  }
  return counts
}

export const ANOMALY_TREND = NETWORK_SERIES.temperature.slice(-60).map((point, index) => {
  const rng = createRng(`anomaly-trend-${index}`)
  return {
    date: point.date,
    normal: 0,
    observed: rng.range(0, 6),
  }
})

export const ALERT_TIMESTAMPS = {
  latest: isoFromOffset(0, 6),
  recent: isoFromOffset(1, 14),
}
