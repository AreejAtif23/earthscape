import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Activity, BrainCircuit, Radar, ShieldCheck } from 'lucide-react'
import { EarthScapeLogo, Wordmark } from '@/components/common/Brand'
import { NETWORK_SERIES } from '@/data/climate'
import { formatAxisDate } from '@/utils/date'
import { ROUTES } from '@/routes/paths'
import { Link } from 'react-router-dom'

const HIGHLIGHTS = [
  {
    icon: Radar,
    title: 'Live station network',
    description: 'Ten monitoring stations streaming temperature, humidity, rainfall, wind and pressure.',
  },
  {
    icon: BrainCircuit,
    title: 'Machine-learning forecasts',
    description: 'Deployed temperature and precipitation models with calibrated prediction intervals.',
  },
  {
    icon: Activity,
    title: 'Anomaly detection',
    description: 'Robust z-score and isolation-forest ensemble flagging readings outside the seasonal envelope.',
  },
  {
    icon: ShieldCheck,
    title: 'Regulatory reporting',
    description: 'Compliance-ready dossiers with methodology, provenance and attestation statements.',
  },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  const sparkline = NETWORK_SERIES.temperature.slice(-40)

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,44rem)]">
      <aside className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.login} className="flex items-center gap-3 rounded-md px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
              <EarthScapeLogo className="size-9 text-brand-600" />
              <Wordmark />
            </Link>
          </div>

          <div className="mt-14 max-w-md">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-brand-300 uppercase">
              Climate intelligence platform
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-white">
              Turn raw station readings into defensible climate evidence.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-navy-200">
              EarthScape ingests multi-source climate data, cleans it, detects anomalies and projects forward — with
              every figure traceable back to the record that produced it.
            </p>
          </div>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <motion.li
                  key={highlight.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.07, ease: [0.25, 1, 0.5, 1] }}
                  className="flex gap-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-navy-700 bg-navy-800 text-brand-300">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{highlight.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-navy-300">{highlight.description}</p>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </div>

        <div className="relative z-10 border-t border-navy-800 px-10 py-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-medium tracking-[0.12em] text-navy-400 uppercase">
                Network mean temperature
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                {sparkline[sparkline.length - 1]?.value.toFixed(1)} °C
              </p>
            </div>
            <SparklinePreview />
          </div>
          <p className="mt-4 text-[10px] text-navy-400">
            EarthScape Climate Agency · Platform build 1.0.0 · All data shown is simulated for demonstration
          </p>
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
      </aside>

      <main className="flex min-w-0 flex-col bg-surface">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4 lg:hidden">
          <Link to={ROUTES.login} className="flex items-center gap-2.5 rounded-md px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
            <EarthScapeLogo className="size-8 text-brand-600" />
            <Wordmark />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>
      </main>
    </div>
  )
}

function SparklinePreview() {
  const values = NETWORK_SERIES.temperature.slice(-40).map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 168
  const height = 44
  const step = width / (values.length - 1)
  const points = values
    .map((value, index) => `${(index * step).toFixed(1)},${(height - ((value - min) / range) * height).toFixed(1)}`)
    .join(' ')

  return (
    <div className="flex flex-col items-end gap-1">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Network mean temperature, last 40 days">
        <polyline points={points} fill="none" stroke="var(--color-brand-400)" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
      <p className="text-[10px] text-navy-400">
        {formatAxisDate(NETWORK_SERIES.temperature[NETWORK_SERIES.temperature.length - 40].date)} –{' '}
        {formatAxisDate(NETWORK_SERIES.temperature[NETWORK_SERIES.temperature.length - 1].date)}
      </p>
    </div>
  )
}
