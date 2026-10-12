import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { MobileTabBar, SearchPalette, Topbar } from './Topbar'
import { PageTransition } from '@/components/common/Motion'
import { useAsync } from '@/hooks/useAsync'
import { alertService } from '@/services'
import { cn } from '@/utils/cn'

const SIDEBAR_COLLAPSE_KEY = 'earthscape.sidebar.collapsed'

const PAGE_TITLES: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/$/, title: 'Dashboard' },
  { pattern: /^\/climate-data\/upload$/, title: 'Upload Dataset' },
  { pattern: /^\/climate-data\/cleaning$/, title: 'Data Cleaning' },
  { pattern: /^\/climate-data$/, title: 'Climate Data' },
  { pattern: /^\/analytics$/, title: 'Analytics' },
  { pattern: /^\/predictions$/, title: 'Predictions' },
  { pattern: /^\/anomalies$/, title: 'Anomalies' },
  { pattern: /^\/alerts$/, title: 'Alerts' },
  { pattern: /^\/reports$/, title: 'Reports' },
  { pattern: /^\/support$/, title: 'Support' },
  { pattern: /^\/settings$/, title: 'Settings' },
  { pattern: /^\/profile$/, title: 'Profile' },
]

function resolveTitle(pathname: string): string {
  const match = PAGE_TITLES.find((entry) => entry.pattern.test(pathname))
  return match?.title ?? 'EarthScape'
}

export function AppLayout() {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const alertCounts = useAsync(() => alertService.getAlertCounts(), [])
  const anomalyCounts = useAsync(() => alertService.getAnomalyCounts(), [])

  const activeAlerts = alertCounts.data?.active ?? 0
  const openAnomalies = anomalyCounts.data?.open ?? 0

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next))
      } catch {
        /* preference applies for this session only */
      }
      return next
    })
  }, [])

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        setIsSearchOpen(true)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative flex h-dvh overflow-hidden bg-canvas">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        activeAlerts={activeAlerts}
        openAnomalies={openAnomalies}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          pageTitle={resolveTitle(location.pathname)}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main
          id="main-content"
          className={cn(
            'min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin',
            'px-4 py-5 sm:px-5 lg:px-6 lg:py-6',
            'pb-20 lg:pb-8',
          )}
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <MobileTabBar activeAlerts={activeAlerts} />
      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <span className="sr-only">Skip to main content</span>
    </div>
  )
}
