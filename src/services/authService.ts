import { apiRequest, delay, readStoredToken, writeStoredToken } from './httpClient'
import { DEMO_USERS, DEFAULT_SETTINGS } from '@/data/operations'
import type {
  AuthSession,
  LoginCredentials,
  NotificationItem,
  ProfileUpdatePayload,
  SignupPayload,
  User,
  UserSettings,
} from '@/types'

const SESSION_KEY = 'earthscape.auth'
const ACCOUNTS_KEY = 'earthscape.accounts'

const MOCK_PASSWORD = 'Earthscape2026'

export const DEMO_CREDENTIALS = {
  email: DEMO_USERS[0].email,
  password: MOCK_PASSWORD,
}

/**
 * Mock account store. This stands in for the backend user table so a
 * registration is still valid after sign out or a page reload.
 *
 * Only a digest is stored, never the password, and it never leaves the browser.
 */
interface RegisteredAccount {
  user: User
  passwordDigest: string
}

function readAccounts(): RegisteredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY)
    const parsed = raw ? (JSON.parse(raw) as RegisteredAccount[]) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) => entry && typeof entry.passwordDigest === 'string' && Boolean(entry.user?.email),
    )
  } catch {
    return []
  }
}

function writeAccounts(accounts: RegisteredAccount[]): void {
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {
    // Storage is unavailable (private mode or quota) — the current session
    // still works, but registration will not survive a reload.
  }
}

/** SHA-256 when Web Crypto is available, otherwise a non-cryptographic FNV digest. */
async function hashPassword(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    const bytes = await subtle.digest('SHA-256', new TextEncoder().encode(value))
    return Array.from(new Uint8Array(bytes))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }
  let hash = 2_166_136_261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16_777_619)
  }
  return `fnv-${(hash >>> 0).toString(16)}`
}

function findRegisteredAccount(email: string): RegisteredAccount | undefined {
  const needle = email.trim().toLowerCase()
  return readAccounts().find((entry) => entry.user.email.toLowerCase() === needle)
}

function buildSession(user: User): AuthSession {
  return {
    user,
    accessToken: `mock.${btoa(`${user.id}:${Date.now()}`)}.signature`,
    expiresAt: new Date(Date.now() + 8 * 3_600_000).toISOString(),
  }
}

function readPersistedSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

function persistSession(session: AuthSession | null): void {
  try {
    if (session === null) {
      window.localStorage.removeItem(SESSION_KEY)
      return
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable — session remains in memory */
  }
}

export const authService = {
  /**
   * REST contract: POST /auth/login
   * Mock resolver accepts the demo credentials below and rejects everything else.
   */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return apiRequest<AuthSession>({
      url: '/auth/login',
      method: 'post',
      body: credentials,
      latencyMs: 720,
      async mock() {
        const email = credentials.email.trim().toLowerCase()

        // Accounts created through the sign-up form live in their own store.
        const registered = findRegisteredAccount(email)
        if (registered) {
          const digest = await hashPassword(credentials.password)
          if (digest !== registered.passwordDigest) {
            throw new Error('The password you entered does not match this account.')
          }
          return buildSession(registered.user)
        }

        const demoUser = DEMO_USERS.find((candidate) => candidate.email.toLowerCase() === email)
        if (!demoUser || credentials.password !== MOCK_PASSWORD) {
          throw new Error(
            'Those credentials were not recognised. Use a demo account shown below, or sign up for a new account.',
          )
        }
        return buildSession(demoUser)
      },
    })
  },

  /** REST contract: POST /auth/signup */
  async signup(payload: SignupPayload): Promise<{ user: User; activationRequired: boolean }> {
    return apiRequest<{ user: User; activationRequired: boolean }>({
      url: '/auth/signup',
      method: 'post',
      body: payload,
      latencyMs: 900,
      async mock() {
        const email = payload.email.trim().toLowerCase()
        const alreadyRegistered =
          DEMO_USERS.some((user) => user.email.toLowerCase() === email) || Boolean(findRegisteredAccount(email))
        if (alreadyRegistered) {
          throw new Error('An account already exists for this email address.')
        }

        const user: User = {
          id: `usr-${Date.now()}`,
          name: payload.name,
          email,
          role: payload.role,
          organisation: payload.organisation || 'EarthScape Climate Agency',
          jobTitle:
            payload.role === 'administrator'
              ? 'Platform Administrator'
              : payload.role === 'researcher'
                ? 'Climate Researcher'
                : 'Climate Analyst',
          avatarInitials: payload.name
            .split(' ')
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join(''),
          memberSince: new Date().toISOString().slice(0, 10),
          lastLoginAt: new Date().toISOString(),
        }

        writeAccounts([...readAccounts(), { user, passwordDigest: await hashPassword(payload.password) }])

        return { user, activationRequired: false }
      },
    })
  },

  /** REST contract: GET /auth/session */
  async restoreSession(): Promise<AuthSession | null> {
    const stored = readPersistedSession()
    if (!stored) return null
    return apiRequest<AuthSession | null>({
      url: '/auth/session',
      latencyMs: 220,
      mock: () => stored,
    })
  },

  async logout(): Promise<void> {
    await apiRequest<void>({
      url: '/auth/logout',
      method: 'post',
      latencyMs: 180,
      mock: () => undefined,
    })
    persistSession(null)
    writeStoredToken(null)
  },

  /** REST contract: GET /notifications */
  async listNotifications(): Promise<NotificationItem[]> {
    return apiRequest<NotificationItem[]>({
      url: '/notifications',
      latencyMs: 260,
      mock: () => [
        {
          id: 'ntf-1',
          title: 'Critical heat threshold exceeded',
          body: 'Bergen station sustained 37.4 °C for 45 minutes.',
          severity: 'critical',
          createdAt: new Date(Date.now() - 42 * 60_000).toISOString(),
          read: false,
          trend: 'up',
          location: 'Bergen',
        },
        {
          id: 'ntf-2',
          title: 'Model retraining completed',
          body: 'HydroCast LSTM v2.8.0 promoted to deployed state.',
          severity: 'normal',
          createdAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
          read: false,
          trend: 'stable',
          location: 'Platform',
        },
        {
          id: 'ntf-3',
          title: 'Flash-flood rainfall accumulation',
          body: 'Lisbon catchment recorded 62 mm in a 3-hour window.',
          severity: 'critical',
          createdAt: new Date(Date.now() - 9 * 3_600_000).toISOString(),
          read: false,
          trend: 'up',
          location: 'Lisbon',
        },
        {
          id: 'ntf-4',
          title: 'Dataset quality below threshold',
          body: 'Coastal Sensor Trial Batch scored 74.5 — queued for cleaning.',
          severity: 'warning',
          createdAt: new Date(Date.now() - 27 * 3_600_000).toISOString(),
          read: true,
          trend: 'down',
          location: 'Lisbon',
        },
        {
          id: 'ntf-5',
          title: 'Station sensor drift detected',
          body: 'Nairobi humidity channel drifting; inspection recommended.',
          severity: 'warning',
          createdAt: new Date(Date.now() - 52 * 3_600_000).toISOString(),
          read: true,
          trend: 'down',
          location: 'Nairobi',
        },
      ],
    })
  },

  async markAllNotificationsRead(): Promise<void> {
    await apiRequest<void>({
      url: '/notifications/read',
      method: 'post',
      latencyMs: 200,
      mock: () => undefined,
    })
  },

  /** REST contract: PUT /profile */
  async updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    return apiRequest<User>({
      url: '/profile',
      method: 'put',
      body: payload,
      latencyMs: 520,
      mock: () => {
        const session = readPersistedSession()
        const base = session?.user ?? DEMO_USERS[0]
        const updated: User = {
          ...base,
          name: payload.name,
          jobTitle: payload.jobTitle,
          organisation: payload.organisation,
        }
        if (session) persistSession({ ...session, user: updated })

        // Keep the mock account store in sync so edits survive sign out.
        const accounts = readAccounts()
        const index = accounts.findIndex(
          (entry) => entry.user.email.toLowerCase() === updated.email.toLowerCase(),
        )
        if (index >= 0) {
          const next = [...accounts]
          next[index] = { ...next[index], user: updated }
          writeAccounts(next)
        }

        return updated
      },
    })
  },

  /** REST contract: PUT /settings */
  async getSettings(): Promise<UserSettings> {
    return apiRequest<UserSettings>({
      url: '/settings',
      latencyMs: 240,
      mock: () => ({ ...DEFAULT_SETTINGS }),
    })
  },

  async updateSettings(settings: UserSettings): Promise<UserSettings> {
    return apiRequest<UserSettings>({
      url: '/settings',
      method: 'put',
      body: settings,
      latencyMs: 480,
      mock: () => settings,
    })
  },

  async requestPasswordReset(email: string): Promise<{ accepted: boolean }> {
    await apiRequest<{ accepted: boolean }>({
      url: '/auth/password-reset',
      method: 'post',
      body: { email },
      latencyMs: 640,
      mock: () => ({ accepted: true }),
    })
    return { accepted: true }
  },
}

export { persistSession, readPersistedSession, readStoredToken, writeStoredToken, delay, MOCK_PASSWORD }
