import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Severity } from '@/types'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

export interface ToastItem extends ToastInput {
  id: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: ToastItem[]
  notify: (input: ToastInput) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((input: ToastInput) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const toast: ToastItem = { ...input, id, variant: input.variant ?? 'info' }
    setToasts((current) => [...current.slice(-3), toast])
    return id
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) => window.setTimeout(() => dismiss(toast.id), toast.durationMs ?? 5_200))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [toasts, dismiss])

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      notify,
      dismiss,
      success: (title, description) => notify({ title, description, variant: 'success' }),
      error: (title, description) => notify({ title, description, variant: 'error' }),
      warning: (title, description) => notify({ title, description, variant: 'warning' }),
      info: (title, description) => notify({ title, description, variant: 'info' }),
    }),
    [toasts, notify, dismiss],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider.')
  return context
}

const VARIANT_BY_SEVERITY: Record<Severity, ToastVariant> = {
  normal: 'success',
  warning: 'warning',
  high: 'warning',
  critical: 'error',
}

export function severityToToastVariant(severity: Severity): ToastVariant {
  return VARIANT_BY_SEVERITY[severity]
}
