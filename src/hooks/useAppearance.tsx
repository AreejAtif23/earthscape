import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_SETTINGS } from '@/data/operations'
import type { AppearancePreference } from '@/types'

const THEME_STORAGE_KEY = 'earthscape.appearance'

interface AppearanceContextValue {
  appearance: AppearancePreference
  resolvedTheme: 'light' | 'dark'
  setAppearance: (next: AppearancePreference) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function readStoredAppearance(): AppearancePreference {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS.appearance, ...(JSON.parse(raw) as AppearancePreference) }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_SETTINGS.appearance
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearancePreference>(readStoredAppearance)
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    appearance.theme === 'system' ? (systemDark ? 'dark' : 'light') : appearance.theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.density = appearance.density
    root.dataset.motion = appearance.reduceMotion ? 'reduced' : 'full'
  }, [resolvedTheme, appearance.density, appearance.reduceMotion])

  const setAppearance = useCallback((next: AppearancePreference) => {
    setAppearanceState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable — preference applies for this session only */
    }
  }, [])

  const value = useMemo(
    () => ({ appearance, resolvedTheme, setAppearance }),
    [appearance, resolvedTheme, setAppearance],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext)
  if (!context) throw new Error('useAppearance must be used inside AppearanceProvider.')
  return context
}
