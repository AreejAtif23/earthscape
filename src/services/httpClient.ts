import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { env } from './env'
import type { ApiErrorShape } from '@/types'

const TOKEN_STORAGE_KEY = 'earthscape.session'

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(shape: ApiErrorShape & { status?: number }) {
    super(shape.message)
    this.name = 'ApiError'
    this.code = shape.code ?? 'UNKNOWN_ERROR'
    this.status = shape.status ?? 0
    this.fieldErrors = shape.fieldErrors ?? {}
  }
}

interface StoredSession {
  accessToken: string
}

export function readStoredToken(): string | null {
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    return parsed.accessToken ?? null
  } catch {
    return null
  }
}

export function writeStoredToken(accessToken: string | null): void {
  try {
    if (accessToken === null) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken }))
  } catch {
    /* storage unavailable (private mode) — session stays in memory only */
  }
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readStoredToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  config.headers.set('X-Client', 'earthscape-web')
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0
      const data = error.response?.data as { detail?: string; message?: string; errors?: Record<string, string> } | undefined
      const message =
        data?.detail ??
        data?.message ??
        (status === 0
          ? 'Unable to reach the EarthScape API. Check your connection and try again.'
          : error.message ?? 'Request failed')
      return Promise.reject(new ApiError({ message, code: String(status), status, fieldErrors: data?.errors }))
    }
    if (error instanceof ApiError) return Promise.reject(error)
    return Promise.reject(new ApiError({ message: 'Unexpected error while contacting the API.', code: 'UNEXPECTED' }))
  },
)

export interface ApiRequestOptions {
  mock: () => unknown | Promise<unknown>
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete'
  url: string
  params?: Record<string, unknown>
  body?: unknown
  signal?: AbortSignal
  /** Simulated network latency so loading states are exercised during mock mode. */
  latencyMs?: number
}

/**
 * Single swap point between mock resolvers and the real HTTP backend.
 * Services describe the REST contract they expect; when VITE_USE_MOCK_API
 * is false the exact same call is issued against the Python API.
 */
export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  if (env.useMockApi) {
    await delay(options.latencyMs ?? MOCK_LATENCY_MS)
    return (await options.mock()) as T
  }

  const config: AxiosRequestConfig = {
    method: options.method ?? 'get',
    url: options.url,
    params: options.params,
    data: options.body,
    signal: options.signal,
  }
  const response = await httpClient.request<T>(config)
  return response.data
}

const MOCK_LATENCY_MS = 380

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      window.clearTimeout(timer)
      reject(new ApiError({ message: 'Request cancelled.', code: 'CANCELLED' }))
    }
    if (signal) {
      if (signal.aborted) {
        window.clearTimeout(timer)
        reject(new ApiError({ message: 'Request cancelled.', code: 'CANCELLED' }))
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}
