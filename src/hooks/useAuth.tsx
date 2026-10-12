import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authService, readPersistedSession } from '@/services/authService'
import type { AuthSession, LoginCredentials, NotificationItem, SignupPayload, User, UserSettings } from '@/types'

interface AuthContextValue {
  user: User | null
  settings: UserSettings | null
  notifications: NotificationItem[]
  unreadCount: number
  isBootstrapping: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  /** Resolves to `true` when the backend still requires an activation step. */
  signup: (payload: SignupPayload) => Promise<boolean>
  logout: () => Promise<void>
  refreshNotifications: () => Promise<void>
  markNotificationsRead: () => Promise<void>
  updateSettings: (settings: UserSettings) => Promise<void>
  updateProfile: (payload: Parameters<typeof authService.updateProfile>[0]) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let active = true
    const stored = readPersistedSession()

    if (!stored) {
      setIsBootstrapping(false)
      return
    }

    void (async () => {
      try {
        const [restored, userSettings] = await Promise.all([
          authService.restoreSession(),
          authService.getSettings(),
        ])
        if (!active) return
        if (restored) setSession(restored)
        setSettings(userSettings)
      } finally {
        if (active) setIsBootstrapping(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (!session) return
    const items = await authService.listNotifications()
    setNotifications(items)
  }, [session])

  useEffect(() => {
    if (!session) {
      setNotifications([])
      return
    }
    void refreshNotifications()
  }, [session, refreshNotifications])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextSession = await authService.login(credentials)
    setSession(nextSession)
    const userSettings = await authService.getSettings()
    setSettings(userSettings)
    return nextSession.user
  }, [])

  const signup = useCallback(async (payload: SignupPayload) => {
    const { activationRequired } = await authService.signup(payload)
    return activationRequired
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setSession(null)
    setSettings(null)
    setNotifications([])
  }, [])

  const markNotificationsRead = useCallback(async () => {
    await authService.markAllNotificationsRead()
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
  }, [])

  const updateSettings = useCallback(async (next: UserSettings) => {
    const saved = await authService.updateSettings(next)
    setSettings(saved)
  }, [])

  const updateProfile = useCallback(
    async (payload: Parameters<typeof authService.updateProfile>[0]) => {
      const updated = await authService.updateProfile(payload)
      setSession((current) => (current ? { ...current, user: updated } : current))
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      settings,
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      isBootstrapping,
      isAuthenticated: session !== null,
      login,
      signup,
      logout,
      refreshNotifications,
      markNotificationsRead,
      updateSettings,
      updateProfile,
    }),
    [
      session,
      settings,
      notifications,
      isBootstrapping,
      login,
      signup,
      logout,
      refreshNotifications,
      markNotificationsRead,
      updateSettings,
      updateProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
