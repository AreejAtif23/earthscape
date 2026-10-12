import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { GuestRoute, ProtectedRoute } from '@/routes/guards'
import { ROUTES } from '@/routes/paths'
import { SkeletonCard } from '@/components/common/Skeleton'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/* Route-level code splitting keeps the initial workspace payload small. */
const ClimateDataPage = lazy(() => import('@/pages/ClimateDataPage').then((m) => ({ default: m.ClimateDataPage })))
const DataUploadPage = lazy(() => import('@/pages/DataUploadPage').then((m) => ({ default: m.DataUploadPage })))
const DataCleaningPage = lazy(() => import('@/pages/DataCleaningPage').then((m) => ({ default: m.DataCleaningPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const PredictionsPage = lazy(() => import('@/pages/PredictionsPage').then((m) => ({ default: m.PredictionsPage })))
const AnomaliesPage = lazy(() => import('@/pages/AnomaliesPage').then((m) => ({ default: m.AnomaliesPage })))
const AlertsPage = lazy(() => import('@/pages/AlertsPage').then((m) => ({ default: m.AlertsPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SupportPage = lazy(() => import('@/pages/SupportPage').then((m) => ({ default: m.SupportPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))

function RouteFallback() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading view…</span>
      <div className="h-20 rounded-lg border border-line bg-surface" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.signup, element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'climate-data', element: <LazyRoute><ClimateDataPage /></LazyRoute> },
          { path: 'climate-data/upload', element: <LazyRoute><DataUploadPage /></LazyRoute> },
          { path: 'climate-data/cleaning', element: <LazyRoute><DataCleaningPage /></LazyRoute> },
          { path: 'analytics', element: <LazyRoute><AnalyticsPage /></LazyRoute> },
          { path: 'predictions', element: <LazyRoute><PredictionsPage /></LazyRoute> },
          { path: 'anomalies', element: <LazyRoute><AnomaliesPage /></LazyRoute> },
          { path: 'alerts', element: <LazyRoute><AlertsPage /></LazyRoute> },
          { path: 'reports', element: <LazyRoute><ReportsPage /></LazyRoute> },
          { path: 'support', element: <LazyRoute><SupportPage /></LazyRoute> },
          { path: 'settings', element: <LazyRoute><SettingsPage /></LazyRoute> },
          { path: 'profile', element: <LazyRoute><ProfilePage /></LazyRoute> },
          { path: ROUTES.notFound, element: <NotFoundPage /> },
          { path: '*', element: <Navigate to={ROUTES.notFound} replace /> },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
