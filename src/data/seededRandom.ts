/**
 * Deterministic pseudo-random utilities.
 * Mock datasets must be stable across re-renders so charts, tables and
 * snapshot tests do not shift on every render.
 */

export function createSeededRandom(seed: number) {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export interface Rng {
  next: () => number
  range: (min: number, max: number) => number
  int: (min: number, max: number) => number
  pick: <T>(items: readonly T[]) => T
  bool: (probability?: number) => boolean
}

export function createRng(seed: number | string): Rng {
  const next = createSeededRandom(typeof seed === 'string' ? hashString(seed) : seed)
  const range = (min: number, max: number) => min + next() * (max - min)
  return {
    next,
    range,
    int: (min, max) => Math.floor(range(min, max + 1)),
    pick: (items) => items[Math.floor(next() * items.length) % items.length],
    bool: (probability = 0.5) => next() < probability,
  }
}
