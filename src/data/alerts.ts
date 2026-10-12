import { STATIONS, offsetDateTime } from './climate'
import { createRng } from './seededRandom'
import { round } from '@/utils/number'
import type { Alert, ClimateMetric, Severity } from '@/types'

interface AlertTemplate {
  metric: ClimateMetric
  severity: Severity
  threshold: number
  excess: [number, number]
  source: Alert['source']
  title: string
  description: string
  unit: string
}

const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    metric: 'temperature',
    severity: 'critical',
    threshold: 35,
    excess: [1.8, 4.6],
    source: 'rule-engine',
    title: 'Extreme heat threshold exceeded',
    description:
      'Sustained air temperature above the critical operational threshold. Heat-health advisories should be issued for vulnerable populations.',
    unit: '°C',
  },
  {
    metric: 'rainfall',
    severity: 'critical',
    threshold: 50,
    excess: [6, 22],
    source: 'rule-engine',
    title: 'Flash-flood rainfall accumulation',
    description:
      'Catchment accumulation crossed the flash-flood trigger. Emergency services notification protocol is active.',
    unit: 'mm',
  },
  {
    metric: 'windSpeed',
    severity: 'high',
    threshold: 17,
    excess: [2.4, 6.1],
    source: 'anomaly-model',
    title: 'Damaging wind gusts detected',
    description:
      'Sustained wind speed exceeded the structural safety threshold. Outdoor operations should be suspended.',
    unit: 'm/s',
  },
  {
    metric: 'temperature',
    severity: 'high',
    threshold: 31,
    excess: [1.2, 3.9],
    source: 'rule-engine',
    title: 'High temperature advisory',
    description: 'Afternoon maximum temperature exceeded the advisory threshold for the second consecutive day.',
    unit: '°C',
  },
  {
    metric: 'humidity',
    severity: 'warning',
    threshold: 25,
    excess: [1.4, 5.2],
    source: 'anomaly-model',
    title: 'Low relative humidity warning',
    description:
      'Relative humidity dropped below the configured threshold. Wildfire fuel-moisture risk is elevated.',
    unit: '%',
  },
  {
    metric: 'windSpeed',
    severity: 'warning',
    threshold: 12,
    excess: [1.1, 3.4],
    source: 'rule-engine',
    title: 'Strong wind monitoring notice',
    description: 'Gusts approaching operational limits. Monitored for escalation to a high-severity advisory.',
    unit: 'm/s',
  },
  {
    metric: 'rainfall',
    severity: 'warning',
    threshold: 18,
    excess: [1.8, 6.4],
    source: 'prediction-model',
    title: 'Heavy rainfall predicted within horizon',
    description: 'Forecast ensemble indicates accumulation above the warning threshold inside the 24-hour horizon.',
    unit: 'mm',
  },
  {
    metric: 'humidity',
    severity: 'warning',
    threshold: 92,
    excess: [0.8, 4.2],
    source: 'anomaly-model',
    title: 'Saturation and fog conditions',
    description: 'Saturated air mass reducing visibility. Expect transport and aviation delays.',
    unit: '%',
  },
]

const STATUS_MIX: Alert['status'][] = ['active', 'active', 'active', 'acknowledged', 'resolved', 'resolved']

export function buildAlerts(total = 54): Alert[] {
  const alerts: Alert[] = []

  for (let index = 0; index < total; index += 1) {
    const rng = createRng(`alert-${index}`)
    const template = ALERT_TEMPLATES[index % ALERT_TEMPLATES.length]
    const station = STATIONS[rng.int(0, STATIONS.length - 1)]
    const status = STATUS_MIX[index % STATUS_MIX.length]
    const observedValue = round(template.threshold + rng.range(template.excess[0], template.excess[1]), 1)
    const daysAgo = rng.int(0, 74)
    const triggeredAt = offsetDateTime(daysAgo, rng.int(0, 23))
    const resolvedAt = status === 'resolved' ? offsetDateTime(Math.max(0, daysAgo - rng.int(1, 3)), rng.int(0, 23)) : null

    alerts.push({
      id: `alt-${String(7700 + index)}`,
      title: template.title,
      severity: template.severity,
      location: station.location,
      stationId: station.id,
      metric: template.metric,
      threshold: template.threshold,
      observedValue,
      unit: template.unit,
      triggeredAt,
      resolvedAt,
      acknowledgedAt: status === 'active' ? null : offsetDateTime(daysAgo, Math.max(0, Number(triggeredAt.slice(11, 13)) - 1)),
      status,
      source: template.source,
      description: template.description,
    })
  }

  return alerts.sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
}

export const ALERTS = buildAlerts()
