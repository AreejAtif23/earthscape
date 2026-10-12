export const ROUTES = {
  login: '/login',
  signup: '/signup',
  dashboard: '/',
  climateData: '/climate-data',
  dataUpload: '/climate-data/upload',
  dataCleaning: '/climate-data/cleaning',
  analytics: '/analytics',
  predictions: '/predictions',
  anomalies: '/anomalies',
  alerts: '/alerts',
  reports: '/reports',
  support: '/support',
  settings: '/settings',
  profile: '/profile',
  notFound: '/404',
} as const

export type RouteKey = keyof typeof ROUTES

export function resolvePath(...keys: RouteKey[]): string {
  return keys.map((key) => ROUTES[key]).join('/').replace(/\/+/g, '/')
}
