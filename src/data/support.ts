import { formatIsoWithOffset } from './climate'
import type { FaqItem, SupportTicket } from '@/types'

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-01',
    category: 'getting-started',
    question: 'How do I connect a new weather station to the network?',
    answer:
      'Navigate to Settings, then Station Network, and select Register Station. EarthScape issues a one-time enrolment key valid for 24 hours. Mount the sensor gateway, submit the key, and the station appears as "provisioning" until its first three readings pass validation.',
  },
  {
    id: 'faq-02',
    category: 'data',
    question: 'Which CSV column names are required for ingestion?',
    answer:
      'The validator requires at minimum: date, location, temperature, humidity, rainfall, wind_speed and sensor_id. Optional columns include pressure and solar_radiation. Column names are case-insensitive and hyphenated variants are normalised automatically.',
  },
  {
    id: 'faq-03',
    category: 'data',
    question: 'What happens to records flagged as suspect quality?',
    answer:
      'Suspect records are retained but excluded from baseline model training and from compliance reporting. They remain visible in the Climate Data table with a suspect badge so an analyst can adjudicate them manually.',
  },
  {
    id: 'faq-04',
    category: 'analytics',
    question: 'How is the data-quality score calculated?',
    answer:
      'The score is a weighted composite of completeness (40 %), validity (30 %), uniqueness (15 %) and timeliness (15 %). Each component is measured against the dataset window and then normalised to a 0–100 scale. Datasets scoring below 70 are automatically queued for a cleaning pass.',
  },
  {
    id: 'faq-05',
    category: 'analytics',
    question: 'Which aggregation should I use for long time ranges?',
    answer:
      'Use daily aggregation for windows up to 90 days, weekly for up to 18 months and monthly beyond that. Hourly aggregation is only meaningful for windows under 14 days and becomes noisy when several stations are combined.',
  },
  {
    id: 'faq-06',
    category: 'predictions',
    question: 'What do the shaded bands around predictions represent?',
    answer:
      'The bands are calibrated prediction intervals at the 80 % level, derived from the model quantile objective. As the horizon extends the band widens because forecast uncertainty compounds. Values inside the band should be read as equally probable.',
  },
  {
    id: 'faq-07',
    category: 'alerts',
    question: 'How do I tune alert thresholds without spamming operators?',
    answer:
      'Use Settings, then Alert Thresholds, to set per-metric limits. A hysteresis guard prevents an alert re-firing unless the metric moves a further 15 % beyond the threshold. Start with the recommended values and adjust using the alert history to review how often each rule would have triggered.',
  },
  {
    id: 'faq-08',
    category: 'alerts',
    question: 'What is the difference between an anomaly and an alert?',
    answer:
      'An anomaly is a statistical observation produced by the detection model. An alert is an operational action raised from a threshold rule or from an anomaly that has been promoted. Every alert references the anomaly or rule that produced it for traceability.',
  },
  {
    id: 'faq-09',
    category: 'billing',
    question: 'Who can export data outside the platform?',
    answer:
      'Exports are limited to the administrator and analyst roles. Researchers can view and generate reports but cannot initiate raw dataset exports. All export events are written to the audit log.',
  },
  {
    id: 'faq-10',
    category: 'billing',
    question: 'Is there a retention limit on historical records?',
    answer:
      'Raw readings are retained for 36 months by default and archived to cold storage thereafter. Aggregated daily statistics derived from them are retained indefinitely, so long-horizon trend analysis is never blocked by archival.',
  },
]

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-2291',
    reference: 'ESC-2291',
    subject: 'Pressure column rejected during CSV upload',
    category: 'data-quality',
    priority: 'high',
    status: 'in-progress',
    createdAt: formatIsoWithOffset(2, 9),
    updatedAt: formatIsoWithOffset(1, 15),
    assignee: 'Platform Engineering',
    messageCount: 6,
  },
  {
    id: 'tkt-2284',
    reference: 'ESC-2284',
    subject: 'Anomaly queue not clearing after cleaning pass',
    category: 'technical',
    priority: 'medium',
    status: 'waiting-on-you',
    createdAt: formatIsoWithOffset(6, 11),
    updatedAt: formatIsoWithOffset(3, 10),
    assignee: 'Data Services',
    messageCount: 11,
  },
  {
    id: 'tkt-2270',
    reference: 'ESC-2270',
    subject: 'Request additional station slots for Q4 expansion',
    category: 'access',
    priority: 'low',
    status: 'open',
    createdAt: formatIsoWithOffset(11, 8),
    updatedAt: formatIsoWithOffset(11, 8),
    assignee: 'Customer Operations',
    messageCount: 2,
  },
  {
    id: 'tkt-2244',
    reference: 'ESC-2244',
    subject: 'Chart tooltips clipped on Safari 17',
    category: 'technical',
    priority: 'medium',
    status: 'resolved',
    createdAt: formatIsoWithOffset(24, 13),
    updatedAt: formatIsoWithOffset(19, 16),
    assignee: 'Frontend Guild',
    messageCount: 8,
  },
  {
    id: 'tkt-2210',
    reference: 'ESC-2210',
    subject: 'Bulk export permissions for regional partners',
    category: 'access',
    priority: 'urgent',
    status: 'resolved',
    createdAt: formatIsoWithOffset(38, 9),
    updatedAt: formatIsoWithOffset(35, 14),
    assignee: 'Customer Operations',
    messageCount: 5,
  },
]

export const SUPPORT_CATEGORIES: Array<{ value: SupportTicket['category']; label: string }> = [
  { value: 'technical', label: 'Technical issue' },
  { value: 'data-quality', label: 'Data quality' },
  { value: 'access', label: 'Access & permissions' },
  { value: 'feedback', label: 'Product feedback' },
  { value: 'other', label: 'Something else' },
]

export const FEEDBACK_AREAS = [
  'Dashboard & reporting',
  'Data ingestion',
  'Analytics accuracy',
  'Alerting rules',
  'Map & geospatial',
  'Performance',
  'Accessibility',
]

export const SUPPORT_CONTACT = {
  email: 'support@earthscape.example',
  hotline: '+47 22 00 00 00',
  hours: 'Monday to Friday, 07:00–19:00 UTC',
  responseTarget: 'First response within 4 business hours for critical issues',
}
