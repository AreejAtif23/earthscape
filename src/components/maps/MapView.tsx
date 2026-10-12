import { useMemo } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import type { Layer, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Droplets, Gauge, Thermometer, Wind } from 'lucide-react'
import { Badge, severityTone, severityLabel } from '../common/Badge'
import { EmptyState } from '../common/States'
import { Skeleton } from '../common/Skeleton'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'
import type { ClimateStation, Severity } from '@/types'

const SEVERITY_HEX: Record<Severity, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

const STATUS_HEX: Record<ClimateStation['status'], string> = {
  online: '#0e6f6f',
  degraded: '#f59e0b',
  offline: '#64748b',
  maintenance: '#0891b2',
}

const STATUS_LABEL: Record<ClimateStation['status'], string> = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
  maintenance: 'Maintenance',
}

export interface MapViewProps {
  stations: ClimateStation[]
  isLoading?: boolean
  height?: number | string
  selectedStationId?: string | null
  onSelectStation?: (stationId: string) => void
  colorBy?: 'severity' | 'status'
  className?: string
  initialCenter?: [number, number]
  initialZoom?: number
}

function StationPopup({ station }: { station: ClimateStation }) {
  return (
    <div className="overflow-hidden rounded-lg">
      <div className="border-b border-line bg-surface-muted px-3 py-2">
        <p className="text-xs font-semibold text-ink">{station.name}</p>
        <p className="mt-0.5 text-[11px] text-ink-muted">
          {station.location}, {station.country} · {station.elevationM} m
        </p>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={severityTone(station.climate.severity)} size="sm" dot>
            {severityLabel(station.climate.severity)}
          </Badge>
          <Badge tone="outline" size="sm">
            {STATUS_LABEL[station.status]}
          </Badge>
          <Badge tone="neutral" size="sm">
            {station.code}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <MetricRow
            icon={<Thermometer className="size-3" />}
            label="Temperature"
            value={`${formatNumber(station.climate.temperature, 1)} °C`}
          />
          <MetricRow
            icon={<Droplets className="size-3" />}
            label="Humidity"
            value={`${formatNumber(station.climate.humidity, 0)} %`}
          />
          <MetricRow
            icon={<Droplets className="size-3" />}
            label="Rainfall"
            value={`${formatNumber(station.climate.rainfall, 1)} mm`}
          />
          <MetricRow
            icon={<Wind className="size-3" />}
            label="Wind"
            value={`${formatNumber(station.climate.windSpeed, 1)} m/s`}
          />
          <MetricRow
            icon={<Gauge className="size-3" />}
            label="Pressure"
            value={`${formatNumber(station.climate.pressure, 0)} hPa`}
          />
          <MetricRow icon={<span className="text-[9px] font-mono">ID</span>} label="Sensor" value={station.sensorId} />
        </dl>
      </div>
    </div>
  )
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1 text-[11px] text-ink-muted">
        <span className="text-ink-faint" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="text-[11px] font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  )
}

export function MapView({
  stations,
  isLoading = false,
  height = 380,
  selectedStationId = null,
  onSelectStation,
  colorBy = 'severity',
  className,
  initialCenter = [24, 12],
  initialZoom = 2,
}: MapViewProps) {
  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [stations, selectedStationId],
  )

  if (isLoading) {
    return <Skeleton className={cn('w-full rounded-lg', className)} style={{ height }} />
  }

  if (stations.length === 0) {
    return (
      <div
        className={cn('rounded-lg border border-line bg-surface', className)}
        style={{ height, display: 'flex', alignItems: 'center' }}
      >
        <EmptyState
          title="No stations to display"
          description="Adjust the station filters or register a new monitoring station to populate the network map."
          size="sm"
        />
      </div>
    )
  }

  const markerFor = (station: ClimateStation) => {
    const severityHex = SEVERITY_HEX[station.climate.severity]
    const fillColor = colorBy === 'status' ? STATUS_HEX[station.status] : severityHex
    const radius = station.climate.severity === 'critical' ? 11 : station.climate.severity === 'high' ? 9 : 7
    return {
      radius,
      pathOptions: {
        color: '#ffffff',
        weight: station.id === selectedStationId ? 3 : 2,
        opacity: 1,
        fillColor,
        fillOpacity: station.status === 'offline' ? 0.35 : 0.85,
      },
    }
  }

  const handleClick = (station: ClimateStation, event: LeafletMouseEvent) => {
    onSelectStation?.(station.id)
    const layer = event.target as Layer
    if (layer.openPopup) layer.openPopup()
  }

  return (
    <div
      className={cn('overflow-hidden rounded-lg border border-line bg-surface', className)}
      style={{ height }}
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={2}
        maxZoom={10}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl
        className="size-full"
        worldCopyJump
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />
        {stations.map((station) => (
          <CircleMarker
            key={station.id}
            center={[station.latitude, station.longitude]}
            {...markerFor(station)}
            eventHandlers={{ click: (event) => handleClick(station, event) }}
          >
            <Popup>
              <StationPopup station={station} />
            </Popup>
          </CircleMarker>
        ))}
        {selectedStation && (
          <CircleMarker
            center={[selectedStation.latitude, selectedStation.longitude]}
            radius={16}
            pathOptions={{
              color: 'var(--color-brand-500)',
              weight: 2,
              fill: false,
              opacity: 0.8,
            }}
            interactive={false}
          />
        )}
      </MapContainer>
    </div>
  )
}

export function MapLegend({
  colorBy = 'severity',
  className,
}: {
  colorBy?: 'severity' | 'status'
  className?: string
}) {
  const entries =
    colorBy === 'severity'
      ? (['normal', 'warning', 'high', 'critical'] as Severity[]).map((severity) => ({
          key: severity,
          label: severityLabel(severity),
          hex: SEVERITY_HEX[severity],
        }))
      : (['online', 'degraded', 'maintenance', 'offline'] as ClimateStation['status'][]).map((status) => ({
          key: status,
          label: STATUS_LABEL[status],
          hex: STATUS_HEX[status],
        }))

  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {entries.map((entry) => (
        <li key={entry.key} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span
            className="size-2.5 shrink-0 rounded-full border-2 border-white shadow-xs"
            style={{ backgroundColor: entry.hex }}
            aria-hidden="true"
          />
          {entry.label}
        </li>
      ))}
    </ul>
  )
}
