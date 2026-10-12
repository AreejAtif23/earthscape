import type { SVGProps } from 'react'

/**
 * EarthScape mark: a layered horizon with a data trace.
 * Inherits currentColor so it works on both light and dark surfaces.
 */
export function EarthScapeLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} role="img" aria-label="EarthScape" {...props}>
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path
        d="M6 21.5c2.4 0 3.6-1.5 5.4-1.5 1.8 0 2.6 1.1 4.2 1.1 1.7 0 2.6-1.4 4.3-1.4 1.6 0 2.4 1 3.6 1.4"
        stroke="var(--color-brand-200)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 25.4c2.4 0 3.6-1.5 5.4-1.5 1.8 0 2.6 1.1 4.2 1.1 1.7 0 2.6-1.4 4.3-1.4 1.6 0 2.4 1 3.6 1.4"
        stroke="var(--color-brand-300)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M8.5 16.2 13 10l4.2 5.4 3-3.8 4 6.6"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.2" cy="9.4" r="1.9" fill="white" />
    </svg>
  )
}

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={className}>
      <span className="block text-sm leading-none font-semibold tracking-tight text-ink">EarthScape</span>
      {!compact && (
        <span className="mt-0.5 block text-[10px] leading-none font-medium tracking-[0.14em] text-ink-muted uppercase">
          Climate Intelligence
        </span>
      )}
    </span>
  )
}
