export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return sum(values) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

export function minOf(values: number[]): number {
  return values.length === 0 ? 0 : Math.min(...values)
}

export function maxOf(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values)
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const average = mean(values)
  const variance = sum(values.map((value) => (value - average) ** 2)) / (values.length - 1)
  return Math.sqrt(variance)
}

export function pearsonCorrelation(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length)
  if (length < 2) return 0
  const sliceA = a.slice(0, length)
  const sliceB = b.slice(0, length)
  const averageA = mean(sliceA)
  const averageB = mean(sliceB)
  let numerator = 0
  let denominatorA = 0
  let denominatorB = 0
  for (let index = 0; index < length; index += 1) {
    const deltaA = sliceA[index] - averageA
    const deltaB = sliceB[index] - averageB
    numerator += deltaA * deltaB
    denominatorA += deltaA ** 2
    denominatorB += deltaB ** 2
  }
  if (denominatorA === 0 || denominatorB === 0) return 0
  return clamp(numerator / Math.sqrt(denominatorA * denominatorB), -1, 1)
}

export function correlationStrength(coefficient: number): 'negligible' | 'weak' | 'moderate' | 'strong' {
  const magnitude = Math.abs(coefficient)
  if (magnitude >= 0.7) return 'strong'
  if (magnitude >= 0.4) return 'moderate'
  if (magnitude >= 0.2) return 'weak'
  return 'negligible'
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    const groupKey = key(item)
    accumulator[groupKey] = accumulator[groupKey] ?? []
    accumulator[groupKey].push(item)
    return accumulator
  }, {}) as Record<K, T[]>
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}
