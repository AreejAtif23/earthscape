import { ALERTS } from './alerts'
import { NETWORK_SERIES, STATIONS, formatIsoWithOffset } from './climate'
import { round } from '@/utils/number'
import { formatDate, formatDateTime } from '@/utils/date'
import type { GeneratedReport, ReportConfig, ReportPreview, ReportType } from '@/types'

export const REPORT_TYPES: Array<{ value: ReportType; label: string; description: string }> = [
  { value: 'summary', label: 'Executive Summary', description: 'Condensed findings suitable for leadership briefing.' },
  { value: 'detailed', label: 'Detailed Analysis', description: 'Full statistical breakdown with per-station appendices.' },
  { value: 'anomaly', label: 'Anomaly Dossier', description: 'Every detected anomaly with deviation evidence.' },
  { value: 'trend', label: 'Trend & Projection', description: 'Historical trend lines with forecast extension.' },
  { value: 'compliance', label: 'Compliance Filing', description: 'Formatted for regulatory submission with methodology.' },
]

export const REPORT_HISTORY: GeneratedReport[] = [
  {
    id: 'rpt-4471',
    title: 'Q3 Network Climate Summary',
    reportType: 'summary',
    location: 'All stations',
    periodLabel: '01 Jul – 30 Sep 2026',
    createdAt: formatIsoWithOffset(2, 11),
    createdBy: 'a.rahman',
    status: 'ready',
    sizeKb: 1_842,
    format: 'pdf',
    sections: ['Headline metrics', 'Network overview', 'Trend narrative', 'Recommendations'],
  },
  {
    id: 'rpt-4463',
    title: 'Heatwave Anomaly Investigation — Bergen',
    reportType: 'anomaly',
    location: 'Bergen',
    periodLabel: '12 Aug – 28 Aug 2026',
    createdAt: formatIsoWithOffset(5, 16),
    createdBy: 'a.rahman',
    status: 'ready',
    sizeKb: 3_410,
    format: 'pdf',
    sections: ['Incident summary', 'Anomaly table', 'Deviation charts', 'Model evidence'],
  },
  {
    id: 'rpt-4458',
    title: 'Coastal Basin Monthly Detail',
    reportType: 'detailed',
    location: 'Lisbon',
    periodLabel: '01 Sep – 30 Sep 2026',
    createdAt: formatIsoWithOffset(9, 9),
    createdBy: 'm.okafor',
    status: 'ready',
    sizeKb: 6_205,
    format: 'xlsx',
    sections: ['Station statistics', 'Hourly appendix', 'Quality notes'],
  },
  {
    id: 'rpt-4452',
    title: 'Multi-Year Trend Projection 2026–2035',
    reportType: 'trend',
    location: 'All stations',
    periodLabel: '2018 – 2035',
    createdAt: formatIsoWithOffset(14, 14),
    createdBy: 'a.rahman',
    status: 'generating',
    sizeKb: 0,
    format: 'pdf',
    sections: ['Trend fitting', 'Projection bands', 'Scenario notes'],
  },
  {
    id: 'rpt-4440',
    title: 'Sensor Network Compliance Filing',
    reportType: 'compliance',
    location: 'All stations',
    periodLabel: '01 Jan – 30 Jun 2026',
    createdAt: formatIsoWithOffset(41, 10),
    createdBy: 'compliance.bot',
    status: 'ready',
    sizeKb: 2_764,
    format: 'pdf',
    sections: ['Methodology', 'Data provenance', 'Coverage statement', 'Attestation'],
  },
  {
    id: 'rpt-4431',
    title: 'Desert Pass Dry Season Review',
    reportType: 'summary',
    location: 'Phoenix',
    periodLabel: '01 Apr – 30 Jun 2026',
    createdAt: formatIsoWithOffset(58, 13),
    createdBy: 'm.okafor',
    status: 'failed',
    sizeKb: 0,
    format: 'pdf',
    sections: ['Headline metrics'],
  },
]

function headlineFor() {
  const temperature = NETWORK_SERIES.temperature
  const rainfall = NETWORK_SERIES.rainfall
  const humidity = NETWORK_SERIES.humidity
  const wind = NETWORK_SERIES.windSpeed
  const lastTemperature = temperature[temperature.length - 1]?.value ?? 0
  const previousTemperature = temperature[temperature.length - 8]?.value ?? lastTemperature
  const totalRainfall = rainfall.reduce((total, point) => total + point.value, 0)

  return [
    {
      label: 'Mean temperature',
      value: `${round(lastTemperature, 1)} °C`,
      delta: `${round(lastTemperature - previousTemperature, 1) >= 0 ? '+' : ''}${round(lastTemperature - previousTemperature, 1)} °C vs prior week`,
    },
    {
      label: 'Total precipitation',
      value: `${round(totalRainfall, 0)} mm`,
      delta: `${round((totalRainfall / Math.max(1, rainfall.length)) * 100) / 100} mm mean daily`,
    },
    {
      label: 'Mean relative humidity',
      value: `${round(humidity[humidity.length - 1]?.value ?? 0, 0)} %`,
      delta: 'Within seasonal envelope',
    },
    {
      label: 'Peak wind speed',
      value: `${round(Math.max(...wind.map((point) => point.value)), 1)} m/s`,
      delta: 'No threshold breach recorded',
    },
  ]
}

export function buildReportPreview(config: ReportConfig): ReportPreview {
  const activeAlerts = ALERTS.filter((alert) => alert.status !== 'resolved')
  const criticalCount = activeAlerts.filter((alert) => alert.severity === 'critical').length
  const locationLabel = config.location === 'all' ? 'All monitoring stations' : config.location
  const anomalyCount = config.location === 'all' ? 68 : Math.round(68 / STATIONS.length)

  return {
    title: config.title,
    subtitle: `${config.reportType === 'summary' ? 'Executive' : 'Technical'} climate intelligence dossier`,
    location: locationLabel,
    periodLabel: `${formatDate(config.dateFrom)} – ${formatDate(config.dateTo)}`,
    headlineMetrics: headlineFor(),
    severity: criticalCount > 0 ? 'high' : activeAlerts.length > 3 ? 'warning' : 'normal',
    anomalyCount,
    sectionsIncluded: buildSections(config),
    summaryParagraphs: [
      `Across ${STATIONS.length} monitoring stations in ${locationLabel}, mean surface temperature over the reporting window registered at ${round(
        NETWORK_SERIES.temperature[NETWORK_SERIES.temperature.length - 1]?.value ?? 0,
        1,
      )} °C. The series remains inside the modelled seasonal envelope, with a mild upward drift consistent with the multi-year regional trend.`,
      `Precipitation totalled ${round(
        NETWORK_SERIES.rainfall.reduce((total, point) => total + point.value, 0),
        0,
      )} mm with ${NETWORK_SERIES.rainfall.filter((point) => point.value > 1).length} wet days recorded. ${criticalCount} threshold events require operational acknowledgement.`,
      `Statistical anomaly detection returned ${anomalyCount} flagged events, of which the large majority were subsequently attributed to synoptic-scale variation rather than instrument fault. Data completeness for the window stands at 97.4 %.`,
    ],
    tableRows: STATIONS.slice(0, 6).map((station) => ({
      label: station.name,
      temperature: `${station.climate.temperature} °C`,
      rainfall: `${station.climate.rainfall} mm`,
      humidity: `${station.climate.humidity} %`,
      windSpeed: `${station.climate.windSpeed} m/s`,
    })),
  }
}

export function buildSections(config: ReportConfig): string[] {
  const sections = ['Headline metrics', 'Executive summary']
  if (config.includeCharts) sections.push('Statistical charts')
  if (config.includeAnomalies) sections.push('Anomaly register')
  if (config.metrics.temperature) sections.push('Temperature analysis')
  if (config.metrics.humidity) sections.push('Humidity analysis')
  if (config.metrics.rainfall) sections.push('Precipitation analysis')
  if (config.metrics.windSpeed) sections.push('Wind analysis')
  if (config.metrics.pressure) sections.push('Pressure analysis')
  if (config.includeMethodology) sections.push('Methodology & data provenance')
  sections.push('Recommendations')
  return sections
}

export function describeReportAge(createdAt: string): string {
  return formatDateTime(createdAt)
}
