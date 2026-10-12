import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import type { ToastVariant } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: string; iconNode: typeof Info }> = {
  info: {
    ring: 'border-line',
    icon: 'text-state-info-600 dark:text-state-info-200',
    iconNode: Info,
  },
  success: {
    ring: 'border-state-normal-200 dark:border-state-normal-700',
    icon: 'text-state-normal-600 dark:text-state-normal-200',
    iconNode: CheckCircle2,
  },
  warning: {
    ring: 'border-state-warning-200 dark:border-state-warning-700',
    icon: 'text-state-warning-600 dark:text-state-warning-200',
    iconNode: AlertTriangle,
  },
  error: {
    ring: 'border-state-critical-200 dark:border-state-critical-700',
    icon: 'text-state-critical-600 dark:text-state-critical-200',
    iconNode: XCircle,
  },
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant]
          const Icon = style.iconNode
          return (
            <motion.div
              key={toast.id}
              layout
              role={toast.variant === 'error' ? 'alert' : 'status'}
              aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface p-3.5 shadow-lg',
                style.ring,
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', style.icon)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-m-1 shrink-0 rounded p-1 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
