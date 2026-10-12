import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time failures so a single broken widget cannot blank the
 * whole workspace. Reports to the console for the developer and shows a
 * recoverable state to the operator.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[EarthScape] Unhandled render error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <div
          role="alert"
          className="w-full max-w-lg rounded-lg border border-state-critical-200 bg-surface p-6 text-center shadow-md dark:border-state-critical-700"
        >
          <span className="mx-auto flex size-11 items-center justify-center rounded-lg bg-state-critical-50 text-state-critical-600 dark:bg-state-critical-900 dark:text-state-critical-200">
            <AlertOctagon className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-base font-semibold text-ink">This view failed to render</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            The workspace hit an unexpected error. Your data is unaffected — retry, or sign out and back in if the
            problem persists.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-md border border-line bg-surface-muted p-3 text-left font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ink-secondary">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-brand-600 bg-brand-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Retry this view
          </button>
        </div>
      </div>
    )
  }
}
