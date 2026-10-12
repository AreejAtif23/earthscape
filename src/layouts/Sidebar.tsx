import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronsLeft, X } from 'lucide-react'
import { NAV_SECTIONS } from '@/routes/navigation'
import type { NavItem } from '@/routes/navigation'
import { EarthScapeLogo, Wordmark } from '@/components/common/Brand'
import { Badge } from '@/components/common/Badge'
import { cn } from '@/utils/cn'

export interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
  activeAlerts: number
  openAnomalies: number
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeAlerts,
  openAnomalies,
}: SidebarProps) {
  const badgeCount = (item: NavItem) => {
    if (item.badge === 'alerts') return activeAlerts
    if (item.badge === 'anomalies') return openAnomalies
    return 0
  }

  const content = (
    <div className="flex h-full flex-col bg-navy-900">
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2.5 border-b border-navy-700 px-4',
          isCollapsed && 'justify-center px-0',
        )}
      >
        <EarthScapeLogo className="size-7 shrink-0 text-brand-600" />
        {!isCollapsed && <Wordmark className="min-w-0 flex-1" />}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="-mr-1 ml-auto rounded p-1 text-navy-200 transition-colors hover:bg-navy-700 hover:text-white lg:hidden"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <nav
        aria-label="Primary navigation"
        className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-3"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4 last:mb-0">
            {!isCollapsed && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.12em] text-navy-400 uppercase">
                {section.label}
              </p>
            )}
            {isCollapsed && <div className="mx-2 mb-2 h-px bg-navy-700" aria-hidden="true" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const count = badgeCount(item)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onCloseMobile}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors duration-150',
                          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400',
                          isCollapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-brand-600/15 text-brand-200'
                            : 'text-navy-200 hover:bg-navy-800 hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-indicator"
                              className="absolute inset-y-1 -left-2.5 w-0.5 rounded-full bg-brand-400"
                              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                            />
                          )}
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          {!isCollapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                          {!isCollapsed && count > 0 && (
                            <Badge
                              tone={item.badge === 'alerts' ? 'critical' : 'warning'}
                              size="sm"
                              className="shrink-0 tabular-nums"
                            >
                              {count > 99 ? '99+' : count}
                            </Badge>
                          )}
                          {isCollapsed && count > 0 && (
                            <span
                              className="absolute top-1 right-1 size-1.5 rounded-full bg-brand-400"
                              aria-hidden="true"
                            />
                          )}
                          <span className="sr-only">
                            {item.label}
                            {count > 0 ? `, ${count} requiring attention` : ''}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-navy-700 p-2.5">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className={cn(
            'hidden w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-navy-300 transition-colors hover:bg-navy-800 hover:text-white lg:flex',
            isCollapsed && 'justify-center px-0',
          )}
        >
          <ChevronsLeft
            className={cn('size-4 shrink-0 transition-transform duration-200', isCollapsed && 'rotate-180')}
            aria-hidden="true"
          />
          {!isCollapsed && <span>Collapse</span>}
        </button>
        {!isCollapsed && (
          <p className="mt-2 px-1 text-[10px] leading-relaxed text-navy-400">
            Platform build 1.0.0 · Mock data mode
          </p>
        )}
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-navy-800 transition-[width] duration-200 ease-out lg:block',
          isCollapsed ? 'w-[68px]' : 'w-[248px]',
        )}
      >
        {content}
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-navy-950/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[268px] max-w-[82vw] shadow-2xl lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              aria-label="Mobile navigation"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
