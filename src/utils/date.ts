import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toIsoDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}

export function parseDate(value: string): Date {
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : new Date(value)
}

export function formatDate(value: string, pattern = 'dd MMM yyyy'): string {
  const date = parseDate(value)
  return isValid(date) ? format(date, pattern) : '—'
}

export function formatDateTime(value: string): string {
  return formatDate(value, "dd MMM yyyy, HH:mm")
}

export function formatShortDate(value: string): string {
  return formatDate(value, 'dd MMM')
}

export function formatAxisDate(value: string): string {
  return formatDate(value, 'dd MMM')
}

export function relativeTime(value: string): string {
  const date = parseDate(value)
  if (!isValid(date)) return '—'
  return `${formatDistanceToNowStrict(date)} ago`
}

export function dateRangeLabel(from: string, to: string): string {
  const start = parseDate(from)
  const end = parseDate(to)
  if (!isValid(start) || !isValid(end)) return '—'
  return `${format(start, 'dd MMM yyyy')} – ${format(end, 'dd MMM yyyy')}`
}

export function daysBetween(from: string, to: string): number {
  const start = parseDate(from).getTime()
  const end = parseDate(to).getTime()
  return Math.round((end - start) / 86_400_000)
}

export function addDays(value: string | Date, amount: number): Date {
  const date = typeof value === 'string' ? parseDate(value) : new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

export function isWithinRange(value: string, from: string, to: string): boolean {
  const time = parseDate(value).getTime()
  return time >= parseDate(from).getTime() && time <= parseDate(to).getTime()
}
