import { Link } from 'react-router-dom'
import { Compass, Home, LayoutGrid, SearchX } from 'lucide-react'
import { EarthScapeLogo } from '@/components/common/Brand'
import { ROUTES } from '@/routes/paths'

const DESTINATIONS = [
  { to: ROUTES.dashboard, label: 'Dashboard', hint: 'Network overview and KPIs' },
  { to: ROUTES.climateData, label: 'Climate data', hint: 'Station records and datasets' },
  { to: ROUTES.anomalies, label: 'Anomaly register', hint: 'Flagged statistical events' },
  { to: ROUTES.support, label: 'Support centre', hint: 'Guides and helpdesk tickets' },
]

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <EarthScapeLogo className="size-10 text-brand-600" aria-hidden="true" />

      <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">Error 404</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        That page is outside the monitoring footprint
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        The address <span className="font-mono text-xs text-ink-secondary">{window.location.pathname}</span> does not
        match any EarthScape workspace route. It may have been renamed, or the link that brought you here may be
        out of date.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          to={ROUTES.dashboard}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-brand-600 bg-brand-600 px-3.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-brand-700"
        >
          <Home className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
        <Link
          to={ROUTES.climateData}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-muted"
        >
          <LayoutGrid className="size-4" aria-hidden="true" />
          Browse climate data
        </Link>
      </div>

      <div className="mt-10 w-full max-w-xl">
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-muted uppercase">
          <SearchX className="size-3.5" aria-hidden="true" />
          Popular destinations
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DESTINATIONS.map((destination) => (
            <li key={destination.to}>
              <Link
                to={destination.to}
                className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-muted"
              >
                <Compass className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-ink">{destination.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">{destination.hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
