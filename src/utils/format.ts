const INTEGER_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—'
  if (decimals === 0) return INTEGER_FORMAT.format(value)
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return INTEGER_FORMAT.format(value)
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatSigned(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, decimals)}`
}

export function formatPercent(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNumber(value, decimals)}%`
}

export function formatMetricValue(value: number, unit: string, decimals = 1): string {
  if (unit === '%' || unit === 'hPa') return `${formatNumber(value, decimals)}${unit}`
  return `${formatNumber(value, decimals)} ${unit}`
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${formatNumber(value, exponent === 0 ? 0 : 2)} ${units[exponent]}`
}

export function formatDelta(value: number, decimals = 1, suffix = ''): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${formatNumber(Math.abs(value), decimals)}${suffix}`
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}
