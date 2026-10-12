import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LayoutGrid,
  LineChart,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Badge, severityTone } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/common/Dropdown'
import { SearchInput } from '@/components/common/SearchInput'
import { EarthScapeLogo } from '@/components/common/Brand'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { MOBILE_TAB_ITEMS } from '@/routes/navigation'
import { ROUTES } from '@/routes/paths'
import { relativeTime } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  administrator: 'Administrator',
  analyst: 'Climate Analyst',
  researcher: 'Researcher',
}

export interface TopbarProps {
  onOpenMobileNav: () => void
  pageTitle: string
  onOpenSearch: () => void
}

export function Topbar({ onOpenMobileNav, pageTitle, onOpenSearch }: TopbarProps) {
  const { user, logout, notifications, unreadCount, markNotificationsRead, isAuthenticated } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPanelOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsPanelOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPanelOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPanelOpen])

  useEffect(() => {
    setIsPanelOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out', 'Your session on this device has been ended.')
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur-sm sm:px-4">
      <IconButton label="Open navigation" size="sm" onClick={onOpenMobileNav} className="lg:hidden">
        <Menu className="size-5" aria-hidden="true" />
      </IconButton>

      <Link to={ROUTES.dashboard} className="shrink-0 lg:hidden" aria-label="EarthScape dashboard">
        <EarthScapeLogo className="size-7 text-brand-600" />
      </Link>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{pageTitle}</h1>

      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden h-8 w-56 items-center gap-2 rounded-md border border-line-strong bg-surface-muted px-2.5 text-xs text-ink-faint transition-colors hover:border-ink-faint xl:flex xl:w-72"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Search the platform</span>
        <kbd className="rounded border border-line bg-surface px-1 py-0.5 font-mono text-[10px] text-ink-muted">/</kbd>
      </button>

      <IconButton
        label="Search"
        size="sm"
        variant="ghost"
        onClick={onOpenSearch}
        className="xl:hidden"
      >
        <Search className="size-4" aria-hidden="true" />
      </IconButton>

      <div className="relative shrink-0" ref={panelRef}>
        <IconButton
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          size="sm"
          variant="ghost"
          onClick={() => setIsPanelOpen((open) => !open)}
          aria-expanded={isPanelOpen}
          aria-haspopup="dialog"
          className="relative"
        >
          <Bell className="size-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-state-critical-500 px-1 text-[10px] leading-4 font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </IconButton>

        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.14, ease: [0.25, 1, 0.5, 1] }}
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-full z-40 mt-1.5 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
            >
              <div className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-ink">Notifications</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  leadingIcon={<CheckCheck className="size-3.5" />}
                  onClick={() => void markNotificationsRead()}
                  disabled={unreadCount === 0}
                >
                  Mark read
                </Button>
              </div>

              <div className="max-h-[22rem] overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <p className="px-3.5 py-8 text-center text-xs text-ink-muted">
                    No notifications. Alerts and model updates will appear here.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {notifications.map((notification) => (
                      <li key={notification.id}>
                        <Link
                          to={notification.severity === 'critical' ? ROUTES.alerts : ROUTES.dashboard}
                          onClick={() => setIsPanelOpen(false)}
                          className={cn(
                            'flex gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-surface-muted',
                            !notification.read && 'bg-brand-50/60 dark:bg-brand-900/25',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-1.5 size-1.5 shrink-0 rounded-full',
                              !notification.read ? 'bg-brand-500' : 'bg-transparent',
                            )}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium text-ink">{notification.title}</p>
                              <Badge tone={severityTone(notification.severity)} size="sm">
                                {notification.location}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{notification.body}</p>
                            <p className="mt-1 text-[10px] text-ink-faint">{relativeTime(notification.createdAt)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-line bg-surface-muted px-3.5 py-2">
                <Link
                  to={ROUTES.alerts}
                  onClick={() => setIsPanelOpen(false)}
                  className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-200"
                >
                  View all alerts
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isAuthenticated && user && (
        <Dropdown
          align="right"
          widthClassName="w-60"
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              onClick={toggle}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-surface-muted"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                {user.avatarInitials}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block max-w-[9rem] truncate text-xs font-medium text-ink">{user.name}</span>
                <span className="block max-w-[9rem] truncate text-[10px] text-ink-muted">{user.organisation}</span>
              </span>
              <ChevronDown
                className={cn(
                  'hidden size-3.5 text-ink-faint transition-transform duration-150 md:block',
                  isOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>
          )}
        >
          <div className="border-b border-line px-2.5 pt-1.5 pb-2.5">
            <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-ink-muted">{user.email}</p>
            <Badge tone="brand" size="sm" className="mt-1.5">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <DropdownSeparator />
          <DropdownItem
            icon={<UserRound className="size-3.5" />}
            onClick={() => {
              navigate(ROUTES.profile)
            }}
          >
            Profile
          </DropdownItem>
          <DropdownItem
            icon={<Settings className="size-3.5" />}
            onClick={() => {
              navigate(ROUTES.settings)
            }}
          >
            Settings
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={<LogOut className="size-3.5" />} destructive onClick={() => void handleLogout()}>
            Sign out
          </DropdownItem>
        </Dropdown>
      )}
    </header>
  )
}

export function MobileTabBar({ activeAlerts }: { activeAlerts: number }) {
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex h-14 shrink-0 items-stretch border-t border-line bg-surface/97 backdrop-blur-sm lg:hidden"
    >
      {MOBILE_TAB_ITEMS.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-brand-600" aria-hidden="true" />
                )}
                <Icon
                  className={cn('size-5', isActive ? 'text-brand-700 dark:text-brand-200' : 'text-ink-muted')}
                  aria-hidden="true"
                />
                <span className={cn('text-[10px] font-medium', isActive ? 'text-brand-700 dark:text-brand-200' : 'text-ink-muted')}>
                  {tab.label}
                </span>
                {tab.badge === 'alerts' && activeAlerts > 0 && (
                  <span className="absolute top-1.5 right-[20%] min-w-3.5 rounded-full bg-state-critical-500 px-1 text-[9px] leading-4 font-semibold text-white">
                    {activeAlerts > 9 ? '9+' : activeAlerts}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

const SEARCH_INDEX = [
  { label: 'Climate Data Catalogue', to: ROUTES.climateData, hint: 'Browse station records', icon: LayoutGrid },
  { label: 'Upload Dataset', to: ROUTES.dataUpload, hint: 'Ingest a CSV file', icon: Search },
  { label: 'Data Cleaning', to: ROUTES.dataCleaning, hint: 'Review detected problems', icon: Search },
  { label: 'Analytics Workspace', to: ROUTES.analytics, hint: 'Correlation and trends', icon: LineChart },
  { label: 'Predictions', to: ROUTES.predictions, hint: 'Model forecasts', icon: LineChart },
  { label: 'Anomaly Register', to: ROUTES.anomalies, hint: 'Flagged events', icon: Search },
  { label: 'Alerts', to: ROUTES.alerts, hint: 'Threshold breaches', icon: Bell },
  { label: 'Reports', to: ROUTES.reports, hint: 'Generate dossiers', icon: Search },
  { label: 'Support Centre', to: ROUTES.support, hint: 'FAQ and tickets', icon: Search },
  { label: 'Settings', to: ROUTES.settings, hint: 'Preferences', icon: Settings },
]

export function SearchPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const results = SEARCH_INDEX.filter((entry) =>
    entry.label.toLowerCase().includes(query.trim().toLowerCase()),
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
      <div className="fixed inset-0 bg-navy-950/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
        role="dialog"
        aria-label="Search the platform"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
      >
        <div className="border-b border-line p-2.5">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages and workflows"
            label="Search the platform"
            autoFocus
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5 scrollbar-thin">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-xs text-ink-muted">
              No matches for “{query.trim()}”.
            </li>
          ) : (
            results.map((entry) => {
              const Icon = entry.icon
              return (
                <li key={entry.to}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(entry.to)
                      onClose()
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-muted"
                  >
                    <Icon className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{entry.label}</span>
                    <span className="shrink-0 text-[11px] text-ink-muted">{entry.hint}</span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </motion.div>
    </div>
  )
}
