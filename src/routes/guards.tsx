import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { EarthScapeLogo } from '@/components/common/Brand'
import { ROUTES } from '@/routes/paths'

function BootScreen() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-canvas">
      <EarthScapeLogo className="size-10 animate-pulse text-brand-600" />
      <p className="text-xs text-ink-muted">Restoring your session…</p>
    </div>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <BootScreen />

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return <BootScreen />
  if (isAuthenticated) return <Navigate to={ROUTES.dashboard} replace />

  return <Outlet />
}
