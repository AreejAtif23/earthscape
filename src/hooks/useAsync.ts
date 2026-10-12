import { useCallback, useEffect, useRef, useState } from 'react'
import type { RequestState } from '@/types'

export interface AsyncResource<T> {
  data: T | null
  error: string | null
  state: RequestState
  isLoading: boolean
  reload: () => void
  setData: (updater: T | ((current: T | null) => T)) => void
}

interface UseAsyncOptions {
  /** Skip execution until the dependencies are meaningful (e.g. filters resolved). */
  enabled?: boolean
  initialData?: unknown
}

/**
 * Runs an async service call and exposes the four states every data surface in
 * the platform must handle: loading, success, error and empty.
 */
export function useAsync<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: UseAsyncOptions = {},
): AsyncResource<T> {
  const enabled = options.enabled ?? true
  const [data, setDataState] = useState<T | null>((options.initialData as T) ?? null)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<RequestState>(enabled ? 'loading' : 'idle')
  const [nonce, setNonce] = useState(0)
  const factoryRef = useRef(factory)
  factoryRef.current = factory

  useEffect(() => {
    if (!enabled) {
      setState('idle')
      return
    }
    const controller = new AbortController()
    let active = true
    setState('loading')
    setError(null)

    factoryRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return
        setDataState(result)
        setState('success')
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : 'Something went wrong while loading data.')
        setState('error')
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  const setData = useCallback((updater: T | ((current: T | null) => T)) => {
    setDataState((current) => (typeof updater === 'function' ? (updater as (value: T | null) => T)(current) : updater))
  }, [])

  return { data, error, state, isLoading: state === 'loading', reload, setData }
}
