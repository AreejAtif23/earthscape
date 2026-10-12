export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false',
  requestTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 20_000),
  appName: import.meta.env.VITE_APP_NAME ?? 'EarthScape',
  environment: import.meta.env.MODE,
} as const
